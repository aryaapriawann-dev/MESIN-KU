"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Vehicle, OperationSession, VEHICLE_TYPE_LABELS, STATUS_LABELS } from "@/types";
import { vehicleStore, sessionStore } from "@/data/store";
import { useIsMounted } from "@/lib/hooks";
import TimerConsole from "@/components/timer/TimerConsole";
import OperationScheduler from "@/components/timer/OperationScheduler";
import { OperationIcon, VehicleIcon, ClockIcon } from "@/components/ui/Icons";
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
          <span className="text-xs font-mono text-slate-400">Sinkronisasi Timer Operasi...</span>
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
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              TIMER OPERASIONAL & TELEMETRI
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              REALTIME
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Penjadwalan operasi, countdown otomatis, alarm batas waktu, dan masa istirahat mesin kendaraan.
          </p>
        </div>
      </div>

      {/* Vehicle Selection Dropdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <label className="block text-xs font-mono font-medium text-slate-300 mb-2">
          PILIH KENDARAAN OPERASI
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedVehicleId}
            onChange={(e) => {
              setSelectedVehicleId(e.target.value);
              setActiveSession(null);
            }}
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          >
            <option value="">-- Pilih Kendaraan dari Armada --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""} — {VEHICLE_TYPE_LABELS[v.type]}
              </option>
            ))}
          </select>
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
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
          <VehicleIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
          RIWAYAT OPERASI UNIT INI ({sessions.length})
        </h3>
        <span className="text-[11px] font-mono text-slate-500">Log Tersimpan</span>
      </div>

      <div className="space-y-2">
        {sessions.slice(0, 5).map((s) => {
          const durationMs = calculateOperationDurationMs(s.startTime, s.targetEndTime);
          const hasOvertime = s.overtimeMinutes && s.overtimeMinutes > 0;

          return (
            <div
              key={s.id}
              className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold">
                    {new Date(s.startTime).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-slate-500">
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
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      s.status === "COMPLETED"
                        ? "bg-slate-800 text-slate-400"
                        : "bg-emerald-950 text-emerald-400"
                    }`}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-400 mt-1 text-[11px]">
                  <span>Durasi: {msToHumanReadable(durationMs)}</span>
                  {s.restDurationMinutes > 0 && (
                    <span>Istirahat: {s.restDurationMinutes} m</span>
                  )}
                  {s.notes && <span className="text-slate-500">“{s.notes}”</span>}
                </div>
              </div>

              <div>
                {hasOvertime ? (
                  <span className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold text-[11px]">
                    +{s.overtimeMinutes} m Overtime
                  </span>
                ) : (
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
