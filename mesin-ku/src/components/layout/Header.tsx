"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Timer, Plus, Radio, Clock } from "lucide-react";
import { sessionStore } from "@/data/store";

export default function Header() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [activeOpsCount, setActiveOpsCount] = useState<number>(0);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
      const active = sessionStore
        .getAll()
        .filter((s) => s.status === "RUNNING" || s.status === "WARNING" || s.status === "OVERTIME").length;
      setActiveOpsCount(active);
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-white/[0.07] bg-[#080c14]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
          <span className="font-mono text-[11px] tracking-wide">TELEMETRI AKTIF</span>
        </div>

        {activeOpsCount > 0 && (
          <Link
            href="/operation"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium hover:bg-cyan-500/15 transition-colors"
          >
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span className="text-[11px]">{activeOpsCount} Unit Beroperasi</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {timeStr && (
          <div className="hidden sm:flex items-center gap-2.5 text-right px-3 py-1.5 rounded-lg bg-slate-900/40 border border-white/[0.05]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                {timeStr} <span className="text-[10px] text-slate-400 font-normal">WIB</span>
              </span>
              <span className="text-[10px] text-slate-400 leading-none">{dateStr}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/operation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] rounded-xl transition-all hover:border-white/[0.15] shadow-sm"
          >
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Konsol</span> Operasi
          </Link>
          <Link
            href="/vehicles?action=add"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl transition-all shadow-md shadow-cyan-950/40 hover:shadow-cyan-900/60"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Armada Baru</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

