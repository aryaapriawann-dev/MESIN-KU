"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DashboardIcon,
  VehicleIcon,
  OperationIcon,
  MaintenanceIcon,
  FuelIcon,
  HistoryIcon,
  ReportIcon,
  EngineIcon,
} from "@/components/ui/Icons";
import { vehicleStore, sessionStore, resetToDemoData } from "@/data/store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "activeOps" | "totalVehicles";
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard Telemetri", icon: DashboardIcon },
  { href: "/vehicles", label: "Armada Kendaraan", icon: VehicleIcon, badgeKey: "totalVehicles" },
  { href: "/operation", label: "Timer Operasional", icon: OperationIcon, badgeKey: "activeOps" },
  { href: "/maintenance", label: "Perawatan & Servis", icon: MaintenanceIcon },
  { href: "/fuel", label: "Konsumsi BBM", icon: FuelIcon },
  { href: "/history", label: "Riwayat Operasi", icon: HistoryIcon },
  { href: "/reports", label: "Ekspor Dokumen PDF", icon: ReportIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ totalVehicles: 0, activeOps: 0 });

  useEffect(() => {
    function refreshCounts() {
      const v = vehicleStore.getAll().length;
      const ops = sessionStore
        .getAll()
        .filter((s) => s.status === "RUNNING" || s.status === "WARNING" || s.status === "OVERTIME").length;
      setCounts({ totalVehicles: v, activeOps: ops });
    }

    refreshCounts();
    const interval = setInterval(refreshCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-68 bg-slate-950 border-r border-slate-800/80 text-slate-300 min-h-screen flex flex-col shrink-0 max-md:hidden select-none">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <EngineIcon className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white font-mono">
                MESIN<span className="text-cyan-400">-</span>KU
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-semibold">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tracking-wider">
              FLEET TELEMETRICS
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-mono tracking-wider font-semibold text-slate-500 uppercase">
          Menu Kontrol
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const badgeValue =
            item.badgeKey === "activeOps"
              ? counts.activeOps
              : item.badgeKey === "totalVehicles"
              ? counts.totalVehicles
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                isActive
                  ? "bg-slate-800/90 text-white font-medium border border-slate-700/80 shadow-inner shadow-black/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-cyan-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>

              {badgeValue > 0 && (
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeKey === "activeOps"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30 animate-pulse"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Demo Loader */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/60">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span>STATUS TELEMETRI</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-full" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">
            Penyimpanan: Local Engine
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm("Muat ulang data contoh armada dan operasional?")) {
              resetToDemoData();
            }
          }}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1.5 transition-colors font-mono"
        >
          Muat Ulang Demo Armada
        </button>
      </div>
    </aside>
  );
}
