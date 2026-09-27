"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Vehicle,
  OperationSession,
  STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/types";
import { vehicleStore, sessionStore } from "@/data/store";
import { msToHumanReadable, calculateOperationDurationMs } from "@/lib/calculator";
import { useIsMounted } from "@/lib/hooks";
import { HistoryIcon, TrashIcon, ClockIcon, ArrowRightIcon } from "@/components/ui/Icons";

export default function HistoryPage() {
  const mounted = useIsMounted();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<OperationSession[]>([]);
  const [filterVehicleId, setFilterVehicleId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    if (!mounted) return;
    setVehicles(vehicleStore.getAll());
    loadSessions();
  }, [mounted]);

  function loadSessions() {
    setSessions(
      sessionStore
        .getAll()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filterVehicleId && s.vehicleId !== filterVehicleId) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }, [sessions, filterVehicleId, filterStatus]);

  const totalOvertime = useMemo(() => {
    return filtered.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0);
  }, [filtered]);

  const completedCount = useMemo(() => {
    return filtered.filter((s) => s.status === "COMPLETED").length;
  }, [filtered]);

  const onTimeCount = useMemo(() => {
    return filtered.filter((s) => (!s.overtimeMinutes || s.overtimeMinutes === 0) && s.status === "COMPLETED").length;
  }, [filtered]);

  const punctualityRate = completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 100;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Sinkronisasi Riwayat Operasi...</span>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-emerald-950 text-emerald-300 border-emerald-500/40";
      case "WARNING":
        return "bg-amber-950 text-amber-300 border-amber-500/40";
      case "OVERTIME":
        return "bg-rose-950 text-rose-300 border-rose-500/50";
      case "REST_REQUIRED":
        return "bg-orange-950 text-orange-300 border-orange-500/40";
      case "RESTING":
        return "bg-cyan-950 text-cyan-300 border-cyan-500/40";
      case "COMPLETED":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              HISTORI OPERASIONAL ARMADA
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              AUDIT LOG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Catatan kronologis seluruh sesi operasional kendaraan, durasi kerja mesin, dan kepatuhan jadwal berhenti.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">TOTAL SESI</span>
          <div className="text-3xl font-mono font-bold text-white mt-1">{filtered.length}</div>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">Sesi operasional</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">SELESAI OPERASI</span>
          <div className="text-3xl font-mono font-bold text-emerald-400 mt-1">{completedCount}</div>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">Siklus kerja komplit</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">TOTAL OVERTIME</span>
          <div className="text-3xl font-mono font-bold text-rose-400 mt-1">
            {totalOvertime} <span className="text-sm font-normal">Min</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">Keterlambatan akumulatif</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">TINGKAT KEPATUHAN</span>
          <div className="text-3xl font-mono font-bold text-cyan-400 mt-1">
            {punctualityRate}%
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">Tepat waktu berhenti</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            FILTER KENDARAAN
          </label>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">Semua Kendaraan Armada</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
            FILTER STATUS SESI
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">Semua Status Operasional</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((s) => {
            const vehicle = vehicles.find((v) => v.id === s.vehicleId);
            const duration = calculateOperationDurationMs(s.startTime, s.targetEndTime);
            const hasOvertime = s.overtimeMinutes && s.overtimeMinutes > 0;

            return (
              <div
                key={s.id}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4.5 transition-all text-xs font-mono"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {vehicle?.plateNumber && (
                        <span className="plate-embossed text-[10px]">{vehicle.plateNumber}</span>
                      )}
                      <span className="font-bold text-sm text-white">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </span>
                      {vehicle && (
                        <span className="text-slate-500 text-[11px]">
                          ({VEHICLE_TYPE_LABELS[vehicle.type]})
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge(
                          s.status
                        )}`}
                      >
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                      <span>
                        Tanggal:{" "}
                        {new Date(s.startTime).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        Jadwal:{" "}
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
                      <span>Durasi Target: {msToHumanReadable(duration)}</span>
                      {s.restDurationMinutes > 0 && (
                        <span>Istirahat: {s.restDurationMinutes} m</span>
                      )}
                    </div>

                    {s.notes && (
                      <p className="text-slate-300 mt-2 text-[11px] bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800/60">
                        Catatan: {s.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    {hasOvertime ? (
                      <span className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold text-[11px]">
                        +{s.overtimeMinutes} Min Overtime
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Tepat Waktu
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/operation?vehicleId=${s.vehicleId}`}
                        className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                      >
                        <span>Timer</span>
                        <ArrowRightIcon className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => {
                          sessionStore.remove(s.id);
                          loadSessions();
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Hapus sesi"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-xs font-mono text-slate-400">
            Tidak ada riwayat operasi yang sesuai filter.
          </div>
        )}
      </div>
    </div>
  );
}
