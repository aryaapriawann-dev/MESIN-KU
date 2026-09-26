"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OperationIcon, PlusIcon } from "@/components/ui/Icons";

export default function Header() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

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
    }

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-radar" />
          <span>SISTEM AKTIF</span>
        </div>
        <div className="hidden sm:block text-xs text-slate-400 font-mono border-l border-slate-800 pl-3">
          KONSOL OPERASI FLEET & TELEMETRI
        </div>
      </div>

      <div className="flex items-center gap-4">
        {timeStr && (
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-sm font-mono font-semibold text-slate-200 tabular-nums">
              {timeStr} <span className="text-xs text-slate-500 font-normal">WIB</span>
            </span>
            <span className="text-[11px] text-slate-400">{dateStr}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/operation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all hover:border-slate-600 shadow-sm"
          >
            <OperationIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Konsol</span> Operasi
          </Link>
          <Link
            href="/vehicles?action=add"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-sm hover:shadow-blue-500/20"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Armada Baru</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
