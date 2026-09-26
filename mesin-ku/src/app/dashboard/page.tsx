"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Vehicle, OperationSession, STATUS_LABELS, VEHICLE_TYPE_LABELS } from "@/types";
import { vehicleStore, sessionStore, maintenanceStore, rulesStore, resetToDemoData } from "@/data/store";
import { evaluateMaintenanceRules, MaintenanceStatus } from "@/lib/rules";
import { msToTimeString, calculateRemainingMs, calculateOvertimeMs } from "@/lib/calculator";
import { useIsMounted } from "@/lib/hooks";
import {
  VehicleIcon,
  OperationIcon,
  MaintenanceIcon,
  AlertTriangleIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@/components/ui/Icons";

export default function DashboardPage() {
  const mounted = useIsMounted();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<OperationSession[]>([]);
  const [now, setNow] = useState(Date.now());

  const refreshData = useCallback(() => {
    setVehicles(vehicleStore.getAll());
    setSessions(sessionStore.getAll());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    refreshData();

    // 1-second interval for real-time telemetry timer
    const interval = setInterval(() => {
      setNow(Date.now());
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
          <span className="text-xs font-mono text-slate-400">Sinkronisasi Telemetri...</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              KONSOL DASHBOARD
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ringkasan status operasional armada, timer telemetri, dan jadwal perawatan berkala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vehicles?action=add"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-900/30"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Tambah Kendaraan</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="TOTAL ARMADA"
          value={vehicles.length}
          subtitle="Kendaraan terdaftar"
          icon={VehicleIcon}
          accent="cyan"
          href="/vehicles"
        />
        <MetricCard
          title="OPERASI AKTIF"
          value={activeSessions.length}
          subtitle="Mesin menyala sekarang"
          icon={OperationIcon}
          accent="emerald"
          isLive={activeSessions.length > 0}
          href="/operation"
        />
        <MetricCard
          title="OVERTIME"
          value={overtimeSessions.length}
          subtitle="Melebihi target operasi"
          icon={AlertTriangleIcon}
          accent="rose"
          isUrgent={overtimeSessions.length > 0}
          href="/operation"
        />
        <MetricCard
          title="MAINTENANCE DUE"
          value={maintenanceDue.length}
          subtitle="Jatuh tempo servis"
          icon={MaintenanceIcon}
          accent="amber"
          isUrgent={maintenanceDue.length > 0}
          href="/maintenance"
        />
      </div>

      {/* Critical Overtime Notification Banner */}
      {overtimeSessions.length > 0 && (
        <section className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/60 border-2 border-rose-500/50 rounded-xl p-5 shadow-lg shadow-rose-950/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-warning-radar" />
              <h2 className="text-sm font-mono font-bold tracking-wider text-rose-300 uppercase">
                PERINGATAN OVERTIME ({overtimeSessions.length} UNIT)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700/50">
              Tindakan Diperlukan Segera
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overtimeSessions.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicleId);
              const overtime = calculateOvertimeMs(s.targetEndTime);
              return (
                <div
                  key={s.id}
                  className="bg-slate-900/90 border border-rose-800/80 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {vehicle?.plateNumber && (
                        <span className="plate-embossed">{vehicle.plateNumber}</span>
                      )}
                      <span className="font-semibold text-white text-sm">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>Melebihi target:</span>
                      <span className="font-mono font-bold">+{msToTimeString(overtime)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/operation?vehicleId=${s.vehicleId}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1"
                  >
                    <span>Tangani</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Live Operations Monitor */}
      {activeSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-radar" />
              <h2 className="text-sm font-mono font-bold tracking-wider text-slate-200 uppercase">
                MONITOR OPERASI AKTIF
              </h2>
            </div>
            <Link
              href="/operation"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Buka Konsol Timer</span>
              <ArrowRightIcon className="w-3 h-3" />
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
                  className={`bg-slate-900/90 rounded-xl p-5 border transition-all ${
                    isWarning
                      ? "border-amber-500/70 shadow-lg shadow-amber-950/20"
                      : "border-slate-800 hover:border-slate-700 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {vehicle?.plateNumber && (
                          <span className="plate-embossed">{vehicle.plateNumber}</span>
                        )}
                        <h3 className="font-semibold text-white text-base">
                          {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        {vehicle ? VEHICLE_TYPE_LABELS[vehicle.type] : "-"}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isWarning
                          ? "bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </div>

                  {/* Countdown readout */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 my-3">
                    <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                      <span>SISA WAKTU OPERASI</span>
                      <span className="text-slate-500">
                        Target:{" "}
                        {new Date(s.targetEndTime).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`text-3xl sm:text-4xl font-mono font-bold tracking-wider tabular-nums ${
                        isWarning ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {msToTimeString(remaining)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Mulai:{" "}
                      {new Date(s.startTime).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      href={`/operation?vehicleId=${s.vehicleId}`}
                      className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Kontrol Operasi</span>
                      <ArrowRightIcon className="w-3 h-3" />
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
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-sm font-mono font-bold tracking-wider text-slate-300 uppercase">
              SEDANG MASA ISTIRAHAT MESIN
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {restingSessions.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicleId);
              return (
                <div
                  key={s.id}
                  className="bg-slate-900/80 border border-cyan-800/40 rounded-lg p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {vehicle?.plateNumber && (
                      <span className="plate-embossed text-[10px]">{vehicle.plateNumber}</span>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-slate-200">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </h4>
                      <p className="text-xs text-cyan-400 font-mono">
                        {STATUS_LABELS[s.status]} ({s.restDurationMinutes} menit)
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/operation?vehicleId=${s.vehicleId}`}
                    className="text-xs font-mono text-cyan-400 hover:underline"
                  >
                    Detail
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
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-mono font-bold tracking-wider text-amber-300 uppercase">
                JATUH TEMPO PERAWATAN ({maintenanceDue.length} TUGAS)
              </h2>
            </div>
            <Link
              href="/maintenance"
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Lihat Jadwal Lengkap</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {maintenanceDue.map((m) => (
              <div
                key={m.ruleId}
                className="bg-slate-900/90 border border-amber-600/40 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-700/50 flex items-center justify-center shrink-0">
                    <MaintenanceIcon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{m.description}</p>
                    <p className="text-xs text-amber-400/90 font-mono mt-0.5">{m.detail}</p>
                  </div>
                </div>
                <Link
                  href="/maintenance"
                  className="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
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
            <h2 className="text-sm font-mono font-bold tracking-wider text-slate-200 uppercase">
              RINGKASAN STATUS ARMADA
            </h2>
            <p className="text-xs text-slate-400">Daftar kendaraan dan pembacaan odometer saat ini.</p>
          </div>
          <Link
            href="/vehicles"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Semua Kendaraan ({vehicles.length})</span>
            <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <VehicleIcon className="w-6 h-6" />
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
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                + Tambah Kendaraan Pertama
              </Link>
              <button
                onClick={() => resetToDemoData()}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Muat Contoh Armada Demo
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
                  className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-white text-sm">
                          {v.brand} {v.model}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {VEHICLE_TYPE_LABELS[v.type]}
                        </span>
                      </div>
                      {v.plateNumber && (
                        <span className="plate-embossed text-[10px]">{v.plateNumber}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">ODOMETER</span>
                        <span className="text-slate-300 font-medium tabular-nums">
                          {v.currentKm !== undefined
                            ? `${v.currentKm.toLocaleString("id-ID")} KM`
                            : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">STATUS</span>
                        {isRunning ? (
                          <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-radar" />
                            Operasi
                          </span>
                        ) : (
                          <span className="text-slate-400">Siap</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <Link
                      href={`/operation?vehicleId=${v.id}`}
                      className="flex-1 text-center py-1.5 rounded-lg text-xs font-medium bg-cyan-950 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/50 transition-colors"
                    >
                      Buka Timer
                    </Link>
                    <Link
                      href={`/vehicles?action=edit&id=${v.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
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
    cyan: "text-cyan-400 bg-cyan-950/50 border-cyan-800/40",
    emerald: "text-emerald-400 bg-emerald-950/50 border-emerald-500/40",
    amber: "text-amber-400 bg-amber-950/50 border-amber-600/40",
    rose: "text-rose-400 bg-rose-950/50 border-rose-600/40",
  };

  const content = (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-150 group relative overflow-hidden">
      {isLive && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-radar" />
        </div>
      )}
      {isUrgent && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-warning-radar" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${accentStyles[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
        {value}
      </div>

      <p className="text-xs text-slate-400 mt-1 font-mono">{subtitle}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
