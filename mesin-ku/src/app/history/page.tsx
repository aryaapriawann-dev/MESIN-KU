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
import {
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowUpRight,
  Filter,
  Car,
  ShieldCheck,
  Activity,
  Calendar,
  Coffee,
} from "lucide-react";

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
          <div className="w-9 h-9 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider text-slate-400">Sinkronisasi Riwayat Operasi...</span>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
      case "WARNING":
        return "bg-amber-950/80 text-amber-300 border-amber-500/40";
      case "OVERTIME":
        return "bg-rose-950/80 text-rose-300 border-rose-500/50 animate-soft-pulse";
      case "REST_REQUIRED":
        return "bg-orange-950/80 text-orange-300 border-orange-500/40";
      case "RESTING":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-500/40";
      case "COMPLETED":
        return "bg-slate-850 text-slate-300 border-slate-700/80";
      default:
        return "bg-slate-850 text-slate-400 border-slate-700/80";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Histori Operasional Armada
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              AUDIT LOG
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Catatan kronologis seluruh sesi kerja mesin kendaraan, ketepatan jadwal berhenti, dan kepatuhan istirahat.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4.5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Sesi</span>
            <Activity className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-white mt-2">{filtered.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Sesi operasional</span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl relative overflow-hidden border-t-2 border-t-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Selesai Operasi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">{completedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Siklus kerja komplit</span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl relative overflow-hidden border-t-2 border-t-rose-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Overtime</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-rose-400 mt-2">
            {totalOvertime} <span className="text-sm font-normal text-slate-400">Min</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Keterlambatan kumulatif</span>
        </div>

        <div className="glass-card p-4.5 rounded-2xl relative overflow-hidden border-t-2 border-t-cyan-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tingkat Kepatuhan</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-cyan-400 mt-2">
            {punctualityRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tepat waktu berhenti</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-cyan-400" />
            Filter Berdasarkan Unit Armada
          </label>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
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
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Filter Status Operasional
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
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
                className="glass-card rounded-2xl p-4.5 transition-all hover:border-slate-700/80"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {vehicle?.plateNumber && (
                        <span className="plate-embossed text-[10px]">{vehicle.plateNumber}</span>
                      )}
                      <span className="font-bold text-sm text-white">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </span>
                      {vehicle && (
                        <span className="text-slate-500 text-xs">
                          ({VEHICLE_TYPE_LABELS[vehicle.type]})
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${statusBadge(
                          s.status
                        )}`}
                      >
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(s.startTime).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
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
                      <span className="font-mono text-slate-300">
                        Durasi: {msToHumanReadable(duration)}
                      </span>
                      {s.restDurationMinutes > 0 && (
                        <span className="flex items-center gap-1 text-cyan-400 font-mono">
                          <Coffee className="w-3 h-3" />
                          Istirahat {s.restDurationMinutes} m
                        </span>
                      )}
                    </div>

                    {s.notes && (
                      <p className="text-slate-300 text-xs bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
                        {s.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
                    {hasOvertime ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono font-semibold text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        +{s.overtimeMinutes} Min Overtime
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Tepat Waktu
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/operation?vehicleId=${s.vehicleId}`}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/30 border border-cyan-800/40 hover:bg-cyan-900/30 transition-colors"
                      >
                        <span>Timer</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => {
                          sessionStore.remove(s.id);
                          loadSessions();
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                        title="Hapus sesi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-12 rounded-2xl text-center">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              Tidak ada data riwayat operasi yang sesuai filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

