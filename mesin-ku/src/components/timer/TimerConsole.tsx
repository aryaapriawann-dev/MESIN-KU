"use client";

import { useEffect, useState, useRef } from "react";
import {
  Clock,
  AlertTriangle,
  Volume2,
  VolumeX,
  Square,
  Coffee,
  CheckCircle2,
  Radio,
  Flame,
  Zap,
} from "lucide-react";
import { OperationSession, Vehicle, STATUS_LABELS, VEHICLE_TYPE_LABELS } from "@/types";
import { TimerState, computeTimerState } from "@/lib/timer";
import { msToTimeString, calculateRestEnd } from "@/lib/calculator";
import { sessionStore } from "@/data/store";
import { telemetryAudio } from "@/lib/alarm";

interface Props {
  session: OperationSession;
  vehicle?: Vehicle;
  onUpdate: (session: OperationSession) => void;
  onComplete: () => void;
}

export default function TimerConsole({ session, vehicle, onUpdate, onComplete }: Props) {
  const [timerState, setTimerState] = useState<TimerState>(() =>
    computeTimerState(
      session.startTime,
      session.targetEndTime,
      session.restDurationMinutes,
      session.status,
      session.actualEndTime
    )
  );

  const [alarmActive, setAlarmActive] = useState(false);
  const [isMuted, setIsMuted] = useState(() => telemetryAudio.getIsMuted());
  const alarmTriggeredRef = useRef(false);

  useEffect(() => {
    function tick() {
      const current = sessionStore.getById(session.id) || session;
      const state = computeTimerState(
        current.startTime,
        current.targetEndTime,
        current.restDurationMinutes,
        current.status,
        current.actualEndTime
      );

      // Handle automatic status promotion when target is reached
      if (
        state.isAlarmDue &&
        (current.status === "RUNNING" || current.status === "WARNING") &&
        !alarmTriggeredRef.current
      ) {
        alarmTriggeredRef.current = true;
        setAlarmActive(true);
        telemetryAudio.playAlarm();

        const updated: OperationSession = {
          ...current,
          status: state.status,
        };
        sessionStore.update(updated);
        onUpdate(updated);
      }

      // If resting finishes, transition to READY
      if (state.status === "READY" && current.status === "RESTING") {
        const updated: OperationSession = {
          ...current,
          status: "READY",
        };
        sessionStore.update(updated);
        onUpdate(updated);
      }

      setTimerState(state);
    }

    tick();
    const interval = setInterval(tick, 500);

    return () => {
      clearInterval(interval);
      telemetryAudio.stopAlarm();
    };
  }, [session, onUpdate]);

  function handleStopAlarm() {
    telemetryAudio.stopAlarm();
    setAlarmActive(false);
  }

  function handleToggleMute() {
    const muted = telemetryAudio.toggleMute();
    setIsMuted(muted);
    if (muted) {
      setAlarmActive(false);
    }
  }

  function handleStopOperation() {
    telemetryAudio.stopAlarm();
    setAlarmActive(false);

    const now = new Date().toISOString();
    const overtimeMs = Math.max(0, Date.now() - new Date(session.targetEndTime).getTime());
    const overtimeMin = Math.floor(overtimeMs / 60000);

    const nextStatus = session.restDurationMinutes > 0 ? "REST_REQUIRED" : "COMPLETED";
    const updated: OperationSession = {
      ...session,
      actualEndTime: now,
      overtimeMinutes: overtimeMin,
      status: nextStatus,
    };
    sessionStore.update(updated);
    onUpdate(updated);
  }

  function handleStartRest() {
    telemetryAudio.stopAlarm();
    setAlarmActive(false);

    const now = new Date().toISOString();
    const overtimeMs = Math.max(0, Date.now() - new Date(session.targetEndTime).getTime());
    const overtimeMin = Math.floor(overtimeMs / 60000);

    const updated: OperationSession = {
      ...session,
      actualEndTime: session.actualEndTime || now,
      overtimeMinutes: session.overtimeMinutes ?? overtimeMin,
      status: "RESTING",
    };
    sessionStore.update(updated);
    onUpdate(updated);
  }

  function handleFinishSession() {
    telemetryAudio.stopAlarm();
    setAlarmActive(false);

    const updated: OperationSession = {
      ...session,
      actualEndTime: session.actualEndTime || new Date().toISOString(),
      status: "COMPLETED",
    };
    sessionStore.update(updated);
    onUpdate(updated);
    onComplete();
  }

  const statusConfig = {
    RUNNING: {
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      accent: "text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]",
      border: "border-emerald-500/40",
      glow: "shadow-emerald-950/20",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
      dot: "bg-emerald-400",
    },
    WARNING: {
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
      accent: "text-amber-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]",
      border: "border-amber-500/50",
      glow: "shadow-amber-950/20",
      bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
      dot: "bg-amber-400",
    },
    REST_REQUIRED: {
      badge: "bg-orange-500/15 text-orange-300 border-orange-500/40 animate-pulse",
      accent: "text-orange-400 drop-shadow-[0_0_25px_rgba(249,115,22,0.35)]",
      border: "border-orange-500/60",
      glow: "shadow-orange-950/30",
      bar: "bg-gradient-to-r from-orange-500 to-amber-500",
      dot: "bg-orange-400",
    },
    OVERTIME: {
      badge: "bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse",
      accent: "text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.4)]",
      border: "border-rose-500/60",
      glow: "shadow-rose-950/30",
      bar: "bg-gradient-to-r from-rose-500 to-red-500",
      dot: "bg-rose-400",
    },
    RESTING: {
      badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
      accent: "text-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]",
      border: "border-cyan-500/40",
      glow: "shadow-cyan-950/20",
      bar: "bg-gradient-to-r from-cyan-500 to-blue-500",
      dot: "bg-cyan-400",
    },
    READY: {
      badge: "bg-teal-500/10 text-teal-300 border-teal-500/30",
      accent: "text-teal-400 drop-shadow-[0_0_25px_rgba(20,184,166,0.35)]",
      border: "border-teal-500/40",
      glow: "shadow-teal-950/20",
      bar: "bg-teal-500",
      dot: "bg-teal-400",
    },
    COMPLETED: {
      badge: "bg-slate-800 text-slate-300 border-slate-700",
      accent: "text-slate-400",
      border: "border-slate-800",
      glow: "shadow-black/20",
      bar: "bg-slate-600",
      dot: "bg-slate-500",
    },
    MAINTENANCE: {
      badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      accent: "text-purple-400",
      border: "border-purple-600/40",
      glow: "shadow-purple-950/20",
      bar: "bg-purple-600",
      dot: "bg-purple-400",
    },
  }[timerState.status] || {
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    accent: "text-slate-400",
    border: "border-slate-800",
    glow: "shadow-black/20",
    bar: "bg-slate-600",
    dot: "bg-slate-500",
  };

  const expectedReadyIso = calculateRestEnd(
    session.actualEndTime || session.targetEndTime,
    session.restDurationMinutes
  );

  return (
    <div
      className={`glass-panel border ${statusConfig.border} rounded-3xl p-6 md:p-8 shadow-2xl ${statusConfig.glow} space-y-6 transition-all duration-300`}
    >
      {/* Alarm Banner */}
      {alarmActive && (
        <div className="bg-gradient-to-r from-rose-900/90 via-red-900/80 to-rose-950/90 border border-rose-500/80 text-white px-5 py-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl shadow-rose-950/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-400 animate-ping shrink-0" />
            <div>
              <p className="font-semibold text-sm tracking-wide text-white">
                Peringatan Batas Waktu Operasi Tercapai
              </p>
              <p className="text-xs text-rose-200 mt-0.5">
                Target waktu operasional telah usai. Hentikan mesin armada atau alihkan ke periode istirahat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStopAlarm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-rose-900 hover:bg-rose-100 transition-colors shadow-md"
            >
              Hentikan Alarm
            </button>
            <button
              onClick={handleToggleMute}
              className="px-3 py-2 rounded-xl text-xs font-medium text-rose-200 bg-rose-950/80 hover:bg-rose-800 border border-rose-700/60 transition-colors"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            {vehicle?.plateNumber && (
              <span className="plate-embossed text-xs">{vehicle.plateNumber}</span>
            )}
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Konsol Timer Operasional"}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {vehicle ? `${VEHICLE_TYPE_LABELS[vehicle.type]} • Mesin: ${vehicle.engineCc || "-"} CC • BBM: ${vehicle.fuelType.toUpperCase()}` : "Sesi Telemetri Berjalan"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border flex items-center gap-1.5 ${statusConfig.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} animate-soft-pulse`} />
            {STATUS_LABELS[timerState.status]}
          </span>
          <button
            onClick={handleToggleMute}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-white/[0.08] transition-colors"
            title="Toggle Audio"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audio On</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Big Cockpit Telemetry Display */}
      <div className="bg-[#070b12]/80 border border-white/[0.07] rounded-3xl p-6 md:p-10 text-center space-y-3 relative overflow-hidden">
        <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          {timerState.status === "RUNNING" || timerState.status === "WARNING"
            ? "Sisa Waktu Operasional Mesin"
            : timerState.status === "OVERTIME"
            ? "Keterlambatan Operasi (Overtime)"
            : timerState.status === "REST_REQUIRED"
            ? "Target Selesai — Segera Istirahatkan Mesin"
            : timerState.status === "RESTING"
            ? "Masa Istirahat & Pendinginan Mesin"
            : timerState.status === "READY"
            ? "Mesin Siap Beroperasi Kembali"
            : "Sesi Selesai"}
        </div>

        {/* Readout Numbers */}
        <div
          className={`text-6xl sm:text-7xl md:text-8xl font-mono font-extrabold tracking-tight tabular-nums transition-all ${statusConfig.accent}`}
        >
          {timerState.status === "RUNNING" || timerState.status === "WARNING" ? (
            msToTimeString(timerState.remainingMs)
          ) : timerState.status === "OVERTIME" ? (
            `+${msToTimeString(timerState.overtimeMs)}`
          ) : timerState.status === "RESTING" ? (
            msToTimeString(timerState.restRemainingMs)
          ) : timerState.status === "REST_REQUIRED" ? (
            "00:00:00"
          ) : timerState.status === "READY" ? (
            "SIAP"
          ) : (
            "SELESAI"
          )}
        </div>

        {/* Dynamic Context Under Counter */}
        {timerState.status === "RESTING" && (
          <p className="text-xs text-cyan-300 font-mono">
            Estimasi Mesin Siap Jalan:{" "}
            <span className="font-bold">
              {new Date(expectedReadyIso).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </p>
        )}

        {timerState.status === "OVERTIME" && (
          <p className="text-xs text-rose-400 font-mono">
            Melewati target sejak{" "}
            {new Date(session.targetEndTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Progress {timerState.status === "RESTING" ? "Istirahat" : "Operasi"}</span>
          <span className="font-mono">{Math.round(timerState.progress)}%</span>
        </div>
        <div className="w-full bg-[#070b12] rounded-full h-2.5 p-0.5 border border-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusConfig.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, timerState.progress))}%` }}
          />
        </div>
      </div>

      {/* Telemetry Parameters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#070b12]/50 p-4 rounded-2xl border border-white/[0.05]">
        <div>
          <span className="text-slate-400 block text-[11px] font-medium">Waktu Mulai</span>
          <span className="text-slate-100 font-mono font-semibold text-sm">
            {new Date(session.startTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] font-medium">Target Berhenti</span>
          <span className="text-slate-100 font-mono font-semibold text-sm">
            {new Date(session.targetEndTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] font-medium">Target Istirahat</span>
          <span className="text-slate-100 font-mono font-semibold text-sm">
            {session.restDurationMinutes} Menit
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px] font-medium">Waktu Siap Kembali</span>
          <span className="text-cyan-400 font-mono font-semibold text-sm">
            {new Date(expectedReadyIso).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Additional Session Notes */}
      {session.notes && (
        <div className="text-xs text-slate-300 bg-[#070b12]/40 px-4 py-3 rounded-xl border border-white/[0.05]">
          <span className="text-slate-400 font-medium mr-2">Catatan Operasi:</span>
          {session.notes}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {(timerState.status === "RUNNING" || timerState.status === "WARNING") && (
          <button
            onClick={handleStopOperation}
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 transition-all shadow-lg shadow-rose-950/40"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Hentikan Operasi (Stop)</span>
          </button>
        )}

        {(timerState.status === "REST_REQUIRED" || timerState.status === "OVERTIME") && (
          <>
            {session.restDurationMinutes > 0 && (
              <button
                onClick={handleStartRest}
                className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-950/40"
              >
                <Coffee className="w-4 h-4" />
                <span>Mulai Istirahat Mesin ({session.restDurationMinutes} Menit)</span>
              </button>
            )}
            <button
              onClick={handleFinishSession}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition-colors"
            >
              Selesaikan Sesi
            </button>
          </>
        )}

        {timerState.status === "RESTING" && (
          <button
            onClick={handleFinishSession}
            className="flex-1 px-5 py-3 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition-colors"
          >
            Selesaikan Istirahat (Lewati Sisa Waktu)
          </button>
        )}

        {timerState.status === "READY" && (
          <button
            onClick={handleFinishSession}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950/40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan ke Histori & Mulai Sesi Baru</span>
          </button>
        )}
      </div>
    </div>
  );
}

