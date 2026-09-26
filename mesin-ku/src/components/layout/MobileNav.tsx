"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/vehicles", label: "Armada", icon: VehicleIcon },
  { href: "/operation", label: "Operasi", icon: OperationIcon },
  { href: "/maintenance", label: "Maintenance", icon: MaintenanceIcon },
  { href: "/fuel", label: "BBM", icon: FuelIcon },
  { href: "/history", label: "Riwayat", icon: HistoryIcon },
  { href: "/reports", label: "Laporan", icon: ReportIcon },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden sticky top-0 z-40">
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <EngineIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold font-mono tracking-tight text-white text-base">
            MESIN<span className="text-cyan-400">-</span>KU
          </span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {open && (
        <nav className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-2 space-y-1 shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 font-medium border border-slate-700"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
