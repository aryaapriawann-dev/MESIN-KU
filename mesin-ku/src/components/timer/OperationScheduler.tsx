"use client";

import { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Clock,
  Play,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Vehicle, OperationSession, LoadCondition, Terrain, LOAD_CONDITION_LABELS, TERRAIN_LABELS } from "@/types";
import { validateOperationSchedule, ValidationError } from "@/lib/validation";
import { calculateOperationDuration, calculateRestEnd } from "@/lib/calculator";
import { telemetryAudio } from "@/lib/alarm";

interface Props {
  vehicle: Vehicle;
  onStart: (session: OperationSession) => void;
}

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function OperationScheduler({ vehicle, onStart }: Props) {
  const now = useMemo(() => new Date(), []);
  const defaultTarget = useMemo(() => new Date(now.getTime() + 2 * 60 * 60 * 1000), [now]);

  const [startTime, setStartTime] = useState(() => toLocalDatetimeInput(now));
  const [targetEndTime, setTargetEndTime] = useState(() => toLocalDatetimeInput(defaultTarget));
  const [restMinutes, setRestMinutes] = useState(30);
  const [loadCondition, setLoadCondition] = useState<LoadCondition>(vehicle.loadCondition || "normal");
  const [terrain, setTerrain] = useState<Terrain>(vehicle.terrain || "urban");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Calculate live preview metrics
  const calculation = useMemo(() => {
    if (!startTime || !targetEndTime) return null;
    const dur = calculateOperationDuration(startTime, targetEndTime);
    const restEnd = calculateRestEnd(targetEndTime, restMinutes);
    return {
      duration: dur,
      restEnd,
      isValid: dur.durationMs > 0,
    };
  }, [startTime, targetEndTime, restMinutes]);

  function applyPresetHours(hours: number) {
    const base = startTime ? new Date(startTime) : new Date();
    const newTarget = new Date(base.getTime() + hours * 60 * 60 * 1000);
    setTargetEndTime(toLocalDatetimeInput(newTarget));
    setErrors((prev) => prev.filter((e) => e.field !== "targetEndTime"));
  }

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateOperationSchedule(startTime, targetEndTime, restMinutes);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    telemetryAudio.init();

    const session: OperationSession = {
      id: uuidv4(),
      vehicleId: vehicle.id,
      startTime: new Date(startTime).toISOString(),
      targetEndTime: new Date(targetEndTime).toISOString(),
      restDurationMinutes: restMinutes,
      loadCondition,
      terrain,
      notes: notes.trim() || undefined,
      status: "RUNNING",
      createdAt: new Date().toISOString(),
    };

    onStart(session);
  }

  function getError(field: string): string | undefined {
    return errors.find((e) => e.field === field)?.message;
  }

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 bg-[#070b12]/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors ${
      getError(field)
        ? "border-rose-500/80 focus:border-rose-500"
        : "border-white/[0.08] focus:border-cyan-500 hover:border-white/[0.15]"
    }`;

  return (
    <form
      onSubmit={handleStart}
      className="glass-panel rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Jadwal Operasional Baru
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit: <span className="text-slate-200 font-medium">{vehicle.brand} {vehicle.model}</span> {vehicle.plateNumber ? `[${vehicle.plateNumber}]` : ""}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          Rule Engine Aktif
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Waktu Mulai Operasi <span className="text-rose-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setErrors((prev) => prev.filter((err) => err.field !== "startTime"));
            }}
            className={inputClass("startTime")}
          />
          {getError("startTime") && (
            <p className="text-rose-400 text-xs mt-1">{getError("startTime")}</p>
          )}
        </div>

        {/* Target End Time */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              Target Berhenti Operasi <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetHours(1)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-white/[0.06] transition-colors"
              >
                +1 Jam
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours(2)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-white/[0.06] transition-colors"
              >
                +2 Jam
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours(4)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-white/[0.06] transition-colors"
              >
                +4 Jam
              </button>
            </div>
          </div>
          <input
            type="datetime-local"
            value={targetEndTime}
            onChange={(e) => {
              setTargetEndTime(e.target.value);
              setErrors((prev) => prev.filter((err) => err.field !== "targetEndTime"));
            }}
            className={inputClass("targetEndTime")}
          />
          {getError("targetEndTime") && (
            <p className="text-rose-400 text-xs mt-1">{getError("targetEndTime")}</p>
          )}
        </div>

        {/* Rest Duration */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Durasi Istirahat Mesin (Menit) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={restMinutes}
            onChange={(e) => setRestMinutes(Math.max(0, Number(e.target.value)))}
            className={inputClass("restDurationMinutes")}
          />
          {getError("restDurationMinutes") && (
            <p className="text-rose-400 text-xs mt-1">{getError("restDurationMinutes")}</p>
          )}
        </div>

        {/* Load Condition */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Beban Penggunaan
          </label>
          <select
            value={loadCondition}
            onChange={(e) => setLoadCondition(e.target.value as LoadCondition)}
            className="w-full px-3.5 py-2.5 bg-[#070b12]/80 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500"
          >
            {Object.entries(LOAD_CONDITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Terrain */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Kondisi Medan / Rute Operasional
          </label>
          <select
            value={terrain}
            onChange={(e) => setTerrain(e.target.value as Terrain)}
            className="w-full px-3.5 py-2.5 bg-[#070b12]/80 border border-white/[0.08] rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500"
          >
            {Object.entries(TERRAIN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Catatan Operasi (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Logistik pengiriman rute tol / kargo berat"
            className="w-full px-3.5 py-2.5 bg-[#070b12]/80 border border-white/[0.08] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Automatic Calculation Preview Box */}
      {calculation && calculation.isValid && (
        <div className="bg-[#070b12]/70 border border-cyan-500/20 rounded-2xl p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Kalkulasi Otomatis Telemetri:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[11px] font-medium">Estimasi Durasi</span>
              <span className="text-emerald-400 font-semibold text-base">
                {calculation.duration.human}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[11px] font-medium">Waktu Berhenti</span>
              <span className="text-slate-100 font-mono font-semibold text-base">
                {new Date(targetEndTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/[0.05]">
              <span className="text-slate-400 block text-[11px] font-medium">Estimasi Siap Kembali</span>
              <span className="text-cyan-400 font-mono font-semibold text-base">
                {new Date(calculation.restEnd).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-cyan-950/40"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Mulai Operasi Kendaraan</span>
          <span className="text-[11px] opacity-80">(Countdown & Alarm)</span>
        </button>
      </div>
    </form>
  );
}

