"use client";

import { useState, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Vehicle, OperationSession, LoadCondition, Terrain, LOAD_CONDITION_LABELS, TERRAIN_LABELS } from "@/types";
import { validateOperationSchedule, ValidationError } from "@/lib/validation";
import { calculateOperationDuration, calculateRestEnd } from "@/lib/calculator";
import { telemetryAudio } from "@/lib/alarm";
import { ClockIcon } from "@/components/ui/Icons";

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
    `w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors ${
      getError(field)
        ? "border-rose-500 focus:border-rose-500"
        : "border-slate-800 focus:border-cyan-500 hover:border-slate-700"
    }`;

  return (
    <form
      onSubmit={handleStart}
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-7 shadow-xl space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold font-mono text-white tracking-wide">
            JADWAL OPERASIONAL BARU
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {vehicle.brand} {vehicle.model} {vehicle.plateNumber ? `[${vehicle.plateNumber}]` : ""}
          </p>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 self-start sm:self-auto">
          RULE ENGINE AKTIF
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            WAKTU MULAI OPERASI *
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
            <p className="text-rose-400 text-xs mt-1 font-mono">{getError("startTime")}</p>
          )}
        </div>

        {/* Target End Time */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              TARGET BERHENTI OPERASI *
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyPresetHours(1)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
              >
                +1 Jam
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours(2)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
              >
                +2 Jam
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours(4)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
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
            <p className="text-rose-400 text-xs mt-1 font-mono">{getError("targetEndTime")}</p>
          )}
        </div>

        {/* Rest Duration */}
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            DURASI ISTIRAHAT MESIN (MENIT) *
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
            <p className="text-rose-400 text-xs mt-1 font-mono">{getError("restDurationMinutes")}</p>
          )}
        </div>

        {/* Load Condition */}
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            BEBAN PENGGUNAAN
          </label>
          <select
            value={loadCondition}
            onChange={(e) => setLoadCondition(e.target.value as LoadCondition)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {Object.entries(LOAD_CONDITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Terrain */}
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            KONDISI MEDAN / RUTE
          </label>
          <select
            value={terrain}
            onChange={(e) => setTerrain(e.target.value as Terrain)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {Object.entries(TERRAIN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            CATATAN PENGGUNAAN (OPSIONAL)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pengiriman logistik rute antar kota"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Automatic Calculation Preview Box (As required by PRD & Spesifikasi) */}
      {calculation && calculation.isValid && (
        <div className="bg-slate-950/80 border border-cyan-800/40 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>HASIL KALKULASI OTOMATIS:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono">
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">DURASI OPERASI</span>
              <span className="text-emerald-400 font-bold text-sm">
                {calculation.duration.human}
              </span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">TARGET WAKTU BERHENTI</span>
              <span className="text-slate-200 font-bold text-sm">
                {new Date(targetEndTime).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ESTIMASI SIAP KEMBALI</span>
              <span className="text-cyan-400 font-bold text-sm">
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
          className="w-full sm:w-auto px-7 py-3 rounded-xl font-mono text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
        >
          <span>START OPERASI KENDARAAN</span>
          <span className="text-[10px] opacity-80">(Countdown & Alarm)</span>
        </button>
      </div>
    </form>
  );
}
