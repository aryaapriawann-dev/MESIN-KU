"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Timer,
  Wrench,
  Fuel,
  History,
  FileText,
  Activity,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Armada", icon: Truck },
  { href: "/operation", label: "Operasi & Timer", icon: Timer },
  { href: "/maintenance", label: "Perawatan & Servis", icon: Wrench },
  { href: "/fuel", label: "Konsumsi BBM", icon: Fuel },
  { href: "/history", label: "Riwayat Operasi", icon: History },
  { href: "/reports", label: "Ekspor PDF", icon: FileText },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden sticky top-0 z-40">
      <header className="bg-[#090d16]/90 backdrop-blur-xl border-b border-white/[0.07] px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center p-[1px]">
            <div className="w-full h-full bg-[#0b101b] rounded-[7px] flex items-center justify-center">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-white text-base">
            MESIN<span className="text-cyan-400">-</span>KU
          </span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] border border-white/[0.08]"
          aria-label="Toggle navigation"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {open && (
        <nav className="bg-[#090d16]/95 backdrop-blur-2xl border-b border-white/[0.07] p-3 space-y-1 shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-300 font-medium border border-cyan-500/20"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400/80" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

