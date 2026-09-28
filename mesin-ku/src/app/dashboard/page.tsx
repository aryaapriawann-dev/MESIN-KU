"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Timer,
  Wrench,
  AlertTriangle,
  Plus,
  ArrowRight,
  Clock,
  Activity,
  ArrowUpRight,
  Radio,
  Gauge,
  Sparkles,
} from "lucide-react";
import { Vehicle, OperationSession, STATUS_LABELS, VEHICLE_TYPE_LABELS } from "@/types";
import { vehicleStore, sessionStore, maintenanceStore, rulesStore, resetToDemoData } from "@/data/store";
import { evaluateMaintenanceRules, MaintenanceStatus } from "@/lib/rules";
import { msToTimeString, calculateRemainingMs, calculateOvertimeMs } from "@/lib/calculator";
import { useIsMounted } from "@/lib/hooks";

export default function DashboardPage() {
  const mounted = useIsMounted();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<OperationSession[]>([]);

  const refreshData = useCallback(() => {
    setVehicles(vehicleStore.getAll());
    setSessions(sessionStore.getAll());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshData();

    // Real-time telemetry tick
    const interval = setInterval(() => {
      setSessions(sessionStore.getAll());
    }, 1000);

    const onStoreChange = () => refreshData();
    window.addEventListener("mesinku-store-change", onStoreChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mesinku-store-change", onStoreChange);
    };
  }, [mounted, refreshData]);

  const maintenanceDue = useMemo(() => {
    const allDue: MaintenanceStatus[] = [];
    vehicles.forEach((vehicle) => {
      const records = maintenanceStore.getByVehicleId(vehicle.id);
      const rules = rulesStore.getByVehicleId(vehicle.id);
      const statuses = evaluateMaintenanceRules(vehicle, records, rules);
      statuses.filter((s) => s.isDue).forEach((s) => allDue.push(s));
    });
    return allDue;
  }, [vehicles]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Sinkronisasi Telemetri Armada...</span>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter(
    (s) => s.status === "RUNNING" || s.status === "WARNING"
  );
  const overtimeSessions = sessions.filter((s) => s.status === "OVERTIME");
  const restingSessions = sessions.filter(
    (s) => s.status === "RESTING" || s.status === "REST_REQUIRED"
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dashboard Operasional
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Status pengoperasian armada, countdown timer real-time, dan pengingat servis berkala.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/operation"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] hover:border-white/[0.15] transition-all shadow-sm"
          >
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Konsol Timer</span>
          </Link>
          <Link
            href="/vehicles?action=add"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kendaraan</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Armada"
          value={vehicles.length}
          subtitle="Unit kendaraan aktif"
          icon={Truck}
          accent="cyan"
          href="/vehicles"
        />
        <MetricCard
          title="Operasi Aktif"
          value={activeSessions.length}
          subtitle="Mesin menyala saat ini"
          icon={Activity}
          accent="emerald"
          isLive={activeSessions.length > 0}
          href="/operation"
        />
        <MetricCard
          title="Unit Overtime"
          value={overtimeSessions.length}
          subtitle="Melebihi target operasi"
          icon={AlertTriangle}
          accent="rose"
          isUrgent={overtimeSessions.length > 0}
          href="/operation"
        />
        <MetricCard
          title="Jatuh Tempo Servis"
          value={maintenanceDue.length}
          subtitle="Tugas perawatan berkala"
          icon={Wrench}
          accent="amber"
          isUrgent={maintenanceDue.length > 0}
          href="/maintenance"
        />
      </div>

      {/* Critical Overtime Notification Banner */}
      {overtimeSessions.length > 0 && (
        <section className="bg-gradient-to-br from-rose-950/70 via-slate-900/90 to-rose-950/40 border border-rose-500/40 rounded-2xl p-5 md:p-6 shadow-xl shadow-rose-950/30 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-rose-200">
                  Peringatan Overtime ({overtimeSessions.length} Unit Melebihi Batas)
                </h2>
                <p className="text-xs text-rose-300/80">
                  Mesin telah melampaui target durasi kerja yang ditentukan. Segera alihkan ke waktu istirahat.
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Perlu Tindakan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {overtimeSessions.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicleId);
              const overtime = calculateOvertimeMs(s.targetEndTime);
              return (
                <div
                  key={s.id}
                  className="bg-slate-950/60 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between gap-3 backdrop-blur-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {vehicle?.plateNumber && (
                        <span className="plate-embossed text-xs">{vehicle.plateNumber}</span>
                      )}
                      <span className="font-semibold text-white text-sm">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Overtime:</span>
                      <span className="font-mono font-bold">+{msToTimeString(overtime)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/operation?vehicleId=${s.vehicleId}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-950/40 flex items-center gap-1.5 shrink-0"
                  >
                    <span>Tangani</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Live Operations Monitor */}
      {activeSessions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-soft-pulse" />
              <h2 className="text-base font-semibold text-white">
                Monitor Operasi Aktif ({activeSessions.length})
              </h2>
            </div>
            <Link
              href="/operation"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
            >
              <span>Buka Konsol Timer</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicleId);
              const remaining = calculateRemainingMs(s.targetEndTime);
              const isWarning = s.status === "WARNING";

              return (
                <div
                  key={s.id}
                  className={`glass-card rounded-2xl p-5 md:p-6 relative overflow-hidden transition-all ${
                    isWarning
                      ? "border-amber-500/50 shadow-lg shadow-amber-950/20"
                      : "hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        {vehicle?.plateNumber && (
                          <span className="plate-embossed text-xs">{vehicle.plateNumber}</span>
                        )}
                        <h3 className="font-semibold text-white text-base">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        {vehicle ? VEHICLE_TYPE_LABELS[vehicle.type] : "-"} • {vehicle?.fuelType.toUpperCase()}
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                        isWarning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>

                  {/* Countdown readout instrument */}
                  <div className="bg-[#070b12]/80 border border-white/[0.06] rounded-xl p-4 my-4">
                    <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between">
                      <span className="font-medium">SISA WAKTU OPERASI</span>
                      <span className="text-slate-400 font-mono text-xs">
                        Target:{" "}
                        {new Date(s.targetEndTime).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`text-3xl sm:text-4xl font-mono font-bold tracking-tight tabular-nums ${
                        isWarning ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {msToTimeString(remaining)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.05]">
                    <span className="text-slate-400">
                      Mulai:{" "}
                      {new Date(s.startTime).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      href={`/operation?vehicleId=${s.vehicleId}`}
                      className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 group"
                    >
                      <span>Kontrol Operasi</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Resting Sessions */}
      {restingSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-soft-pulse" />
            <h2 className="text-sm font-semibold text-slate-200">
              Masa Istirahat Mesin ({restingSessions.length} Unit)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {restingSessions.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicleId);
              return (
                <div
                  key={s.id}
                  className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-3.5 flex items-center justify-between backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2.5">
                    {vehicle?.plateNumber && (
                      <span className="plate-embossed text-xs">{vehicle.plateNumber}</span>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </h4>
                      <p className="text-xs text-cyan-400">
                        {STATUS_LABELS[s.status]} ({s.restDurationMinutes} menit)
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/operation?vehicleId=${s.vehicleId}`}
                    className="text-xs font-medium text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                  >
                    Buka Timer
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Maintenance Alerts Banner */}
      {maintenanceDue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-soft-pulse" />
              <h2 className="text-sm font-semibold text-amber-300">
                Jatuh Tempo Perawatan ({maintenanceDue.length} Tugas Servis)
              </h2>
            </div>
            <Link
              href="/maintenance"
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
            >
              <span>Lihat Jadwal Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {maintenanceDue.map((m) => (
              <div
                key={m.ruleId}
                className="bg-slate-900/70 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{m.description}</p>
                    <p className="text-xs text-amber-400/90 font-mono mt-0.5">{m.detail}</p>
                  </div>
                </div>
                <Link
                  href="/maintenance"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-colors shrink-0"
                >
                  Servis Sekarang
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fleet Overview Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Status Armada Terdaftar
            </h2>
            <p className="text-xs text-slate-400">Ringkasan unit dan pembacaan odometer terkini.</p>
          </div>
          <Link
            href="/vehicles"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group"
          >
            <span>Semua Kendaraan ({vehicles.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Belum Ada Kendaraan Terdaftar</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Daftarkan armada Anda untuk mulai memantau timer operasional, mencatat konsumsi bahan bakar, dan menjadwalkan servis.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/vehicles?action=add"
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-950/40"
              >
                + Tambah Kendaraan Pertama
              </Link>
              <button
                onClick={() => resetToDemoData()}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition-colors"
              >
                Muat Data Contoh Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.slice(0, 6).map((v) => {
              const isRunning = activeSessions.some((s) => s.vehicleId === v.id);
              return (
                <div
                  key={v.id}
                  className="glass-card rounded-2xl p-4 md:p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm group-hover:text-cyan-300 transition-colors">
                          {v.brand} {v.model}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {VEHICLE_TYPE_LABELS[v.type]}
                        </span>
                      </div>
                      {v.plateNumber && (
                        <span className="plate-embossed text-xs">{v.plateNumber}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-[#070b12]/60 p-3 rounded-xl border border-white/[0.05]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">ODOMETER</span>
                        <span className="text-slate-200 font-mono font-semibold tabular-nums text-sm">
                          {v.currentKm !== undefined
                            ? `${v.currentKm.toLocaleString("id-ID")} KM`
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">STATUS</span>
                        {isRunning ? (
                          <span className="text-emerald-400 font-semibold inline-flex items-center gap-1.5 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
                            Operasi
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Siap Jalan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                    <Link
                      href={`/operation?vehicleId=${v.id}`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-colors"
                    >
                      Buka Timer
                    </Link>
                    <Link
                      href={`/vehicles?action=edit&id=${v.id}`}
                      className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-white/[0.06] transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "cyan" | "emerald" | "amber" | "rose";
  isLive?: boolean;
  isUrgent?: boolean;
  href?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  isLive,
  isUrgent,
  href,
}: MetricCardProps) {
  const accentStyles = {
    cyan: {
      badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      glow: "hover:border-cyan-500/30",
    },
    emerald: {
      badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      glow: "hover:border-emerald-500/30",
    },
    amber: {
      badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      glow: "hover:border-amber-500/30",
    },
    rose: {
      badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      glow: "hover:border-rose-500/30",
    },
  }[accent];

  const content = (
    <div
      className={`glass-card rounded-2xl p-4 md:p-5 group relative overflow-hidden ${accentStyles.glow}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${accentStyles.badge}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
        {value}
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs text-slate-400">{subtitle}</p>
        {isLive && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
            Live
          </span>
        )}
        {isUrgent && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-soft-pulse" />
            Perhatian
          </span>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

