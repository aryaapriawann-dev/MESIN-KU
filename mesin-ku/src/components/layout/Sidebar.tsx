"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Timer,
  Wrench,
  Fuel,
  History,
  FileText,
  RotateCcw,
  Activity,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { vehicleStore, sessionStore, resetToDemoData } from "@/data/store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "activeOps" | "totalVehicles";
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard Telemetri", icon: LayoutDashboard },
  { href: "/vehicles", label: "Armada Kendaraan", icon: Truck, badgeKey: "totalVehicles" },
  { href: "/operation", label: "Timer Operasional", icon: Timer, badgeKey: "activeOps" },
  { href: "/maintenance", label: "Perawatan & Servis", icon: Wrench },
  { href: "/fuel", label: "Konsumsi BBM", icon: Fuel },
  { href: "/history", label: "Riwayat Operasi", icon: History },
  { href: "/reports", label: "Ekspor Dokumen PDF", icon: FileText },
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
    <aside className="w-68 bg-[#090d16]/95 border-r border-white/[0.07] backdrop-blur-xl text-slate-300 min-h-screen flex flex-col shrink-0 max-md:hidden select-none sticky top-0 h-screen z-20">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-white/[0.07]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-all duration-300">
            <div className="w-full h-full bg-[#0b101b] rounded-[11px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                MESIN<span className="text-cyan-400">-</span>KU
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Fleet Operations OS
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          Menu Operasional
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
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/20 shadow-sm shadow-cyan-950/20"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-cyan-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                <span className="tracking-tight text-[13px]">{item.label}</span>
              </div>

              {badgeValue > 0 ? (
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    item.badgeKey === "activeOps"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-soft-pulse"
                      : "bg-slate-800 text-slate-400 border border-slate-700/60"
                  }`}
                >
                  {badgeValue}
                </span>
              ) : (
                isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400/70" />
                )
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & Demo Loader */}
      <div className="p-4 border-t border-white/[0.07] space-y-3 bg-[#080c14]/80">
        <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-3 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Engine Sync
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              ONLINE
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Penyimpanan lokal telemetri aktif & tersinkronisasi.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm("Muat ulang data contoh armada dan jadwal operasional?")) {
              resetToDemoData();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 hover:text-slate-200 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Data Demo</span>
        </button>
      </div>
    </aside>
  );
}

