"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Timer,
  Truck,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ChevronDown,
} from "lucide-react";
import { Vehicle, OperationSession, VEHICLE_TYPE_LABELS, STATUS_LABELS } from "@/types";
import { vehicleStore, sessionStore } from "@/data/store";
import { useIsMounted } from "@/lib/hooks";
import TimerConsole from "@/components/timer/TimerConsole";
import OperationScheduler from "@/components/timer/OperationScheduler";
import { msToHumanReadable, calculateOperationDurationMs } from "@/lib/calculator";

function OperationContent() {
  const searchParams = useSearchParams();
  const vehicleIdParam = searchParams.get("vehicleId");
  const mounted = useIsMounted();

  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    typeof window !== "undefined" ? vehicleStore.getAll() : []
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicleIdParam || "");
  const [activeSession, setActiveSession] = useState<OperationSession | null>(null);

  const loadData = useCallback(() => {
    const allVehicles = vehicleStore.getAll();
    setVehicles(allVehicles);

    if (selectedVehicleId) {
      const vehicleSessions = sessionStore.getByVehicleId(selectedVehicleId);
      const active = vehicleSessions.find(
        (s) => s.status !== "COMPLETED" && s.status !== "READY"
      );
      setActiveSession(active || null);
    } else if (allVehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(allVehicles[0].id);
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    if (!mounted) return;
    loadData();
    const onStoreChange = () => loadData();
    window.addEventListener("mesinku-store-change", onStoreChange);
    return () => window.removeEventListener("mesinku-store-change", onStoreChange);
  }, [mounted, loadData]);

  useEffect(() => {
    if (vehicleIdParam) {
      setSelectedVehicleId(vehicleIdParam);
    }
  }, [vehicleIdParam]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Sinkronisasi Timer Operasi...</span>
        </div>
      </div>
    );
  }

  function handleStartSession(session: OperationSession) {
    sessionStore.add(session);
    setActiveSession(session);
  }

  function handleUpdateSession(updated: OperationSession) {
    sessionStore.update(updated);
    setActiveSession(updated.status === "COMPLETED" ? null : updated);
  }

  function handleCompleteSession() {
    setActiveSession(null);
    loadData();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Timer Operasional & Telemetri
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
              Realtime
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Penjadwalan operasi mesin, countdown otomatis, alarm batas waktu, dan masa pendinginan mesin.
          </p>
        </div>
      </div>

      {/* Vehicle Selection Dropdown */}
      <div className="glass-panel rounded-2xl p-4 md:p-5">
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Pilih Unit Kendaraan Operasi
        </label>
        <div className="relative">
          <select
            value={selectedVehicleId}
            onChange={(e) => {
              setSelectedVehicleId(e.target.value);
              setActiveSession(null);
            }}
            className="w-full px-4 py-3 bg-[#070b12]/80 border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">-- Pilih Kendaraan dari Armada --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""} — {VEHICLE_TYPE_LABELS[v.type]}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Active Timer Console or Scheduler */}
      {selectedVehicle && (
        <div className="space-y-6">
          {activeSession ? (
            <TimerConsole
              session={activeSession}
              vehicle={selectedVehicle}
              onUpdate={handleUpdateSession}
              onComplete={handleCompleteSession}
            />
          ) : (
            <OperationScheduler
              vehicle={selectedVehicle}
              onStart={handleStartSession}
            />
          )}

          {/* Session History for this vehicle */}
          <VehicleSessionHistory vehicleId={selectedVehicle.id} />
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="text-center py-16 glass-panel rounded-3xl space-y-3">
          <Truck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">Belum Ada Kendaraan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Daftarkan kendaraan pada menu Armada Kendaraan untuk mulai menjadwalkan timer operasional.
          </p>
        </div>
      )}
    </div>
  );
}

function VehicleSessionHistory({ vehicleId }: { vehicleId: string }) {
  const [sessions, setSessions] = useState<OperationSession[]>([]);

  useEffect(() => {
    const list = sessionStore
      .getByVehicleId(vehicleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSessions(list);
  }, [vehicleId]);

  if (sessions.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Riwayat Operasi Unit Ini ({sessions.length})
          </h3>
        </div>
        <span className="text-xs text-slate-400">Log Tersimpan</span>
      </div>

      <div className="space-y-2.5">
        {sessions.slice(0, 5).map((s) => {
          const durationMs = calculateOperationDurationMs(s.startTime, s.targetEndTime);
          const hasOvertime = s.overtimeMinutes && s.overtimeMinutes > 0;

          return (
            <div
              key={s.id}
              className="bg-[#070b12]/60 border border-white/[0.05] hover:border-white/[0.1] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-200 font-semibold">
                    {new Date(s.startTime).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {new Date(s.startTime).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(s.targetEndTime).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      s.status === "COMPLETED"
                        ? "bg-slate-800 text-slate-300 border border-slate-700/60"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 mt-1.5 text-xs">
                  <span>Durasi: {msToHumanReadable(durationMs)}</span>
                  {s.restDurationMinutes > 0 && (
                    <span>• Istirahat: {s.restDurationMinutes} m</span>
                  )}
                  {s.notes && <span className="text-slate-500 italic">“{s.notes}”</span>}
                </div>
              </div>

              <div>
                {hasOvertime ? (
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium text-xs inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    +{s.overtimeMinutes} m Overtime
                  </span>
                ) : (
                  <span className="text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tepat Waktu
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OperationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      }
    >
      <OperationContent />
    </Suspense>
  );
}

