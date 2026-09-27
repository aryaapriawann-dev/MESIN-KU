"use client";

import { useEffect, useState, useRef } from "react";
import { OperationSession, Vehicle, STATUS_LABELS, VEHICLE_TYPE_LABELS } from "@/types";
import { TimerState, computeTimerState } from "@/lib/timer";
import { msToTimeString, msToHumanReadable, calculateRestEnd } from "@/lib/calculator";
import { sessionStore } from "@/data/store";
import { telemetryAudio } from "@/lib/alarm";
import { ClockIcon, AlertTriangleIcon, CheckCircleIcon } from "@/components/ui/Icons";

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
          status: state.status, // REST_REQUIRED or OVERTIME
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
      badge: "bg-emerald-950/80 text-emerald-400 border-emerald-500/40",
      accent: "text-emerald-400",
      border: "border-emerald-500/40",
      glow: "shadow-emerald-950/30",
      bar: "bg-emerald-500",
    },
    WARNING: {
      badge: "bg-amber-950/80 text-amber-400 border-amber-500/40",
      accent: "text-amber-400",
      border: "border-amber-500/60",
      glow: "shadow-amber-950/40",
      bar: "bg-amber-500",
    },
    REST_REQUIRED: {
      badge: "bg-orange-950/90 text-orange-300 border-orange-500/60 animate-pulse",
      accent: "text-orange-400",
      border: "border-orange-500/70",
      glow: "shadow-orange-950/50",
      bar: "bg-orange-500",
    },
    OVERTIME: {
      badge: "bg-rose-950/90 text-rose-300 border-rose-500/60 animate-pulse",
      accent: "text-rose-400",
      border: "border-rose-500/70",
      glow: "shadow-rose-950/50",
      bar: "bg-rose-500",
    },
    RESTING: {
      badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
      accent: "text-cyan-400",
      border: "border-cyan-500/50",
      glow: "shadow-cyan-950/30",
      bar: "bg-cyan-500",
    },
    READY: {
      badge: "bg-teal-950/80 text-teal-300 border-teal-500/40",
      accent: "text-teal-400",
      border: "border-teal-500/50",
      glow: "shadow-teal-950/30",
      bar: "bg-teal-500",
    },
    COMPLETED: {
      badge: "bg-slate-800 text-slate-300 border-slate-700",
      accent: "text-slate-400",
      border: "border-slate-800",
      glow: "shadow-black/30",
      bar: "bg-slate-600",
    },
    MAINTENANCE: {
      badge: "bg-purple-950 text-purple-300 border-purple-600",
      accent: "text-purple-400",
      border: "border-purple-600",
      glow: "shadow-purple-950/30",
      bar: "bg-purple-600",
    },
  }[timerState.status] || {
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    accent: "text-slate-400",
    border: "border-slate-800",
    glow: "shadow-black/30",
    bar: "bg-slate-600",
  };

  const expectedReadyIso = calculateRestEnd(
    session.actualEndTime || session.targetEndTime,
    session.restDurationMinutes
  );

  return (
    <div
      className={`bg-slate-900/95 border-2 ${statusConfig.border} rounded-2xl p-6 md:p-8 shadow-2xl ${statusConfig.glow} space-y-6 transition-all duration-200`}
    >
      {/* Alarm Banner */}
      {alarmActive && (
        <div className="bg-gradient-to-r from-rose-900 via-red-900 to-rose-950 border border-rose-500 text-white px-5 py-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-pulse shadow-lg shadow-rose-950">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-400 animate-ping shrink-0" />
            <div>
              <p className="font-mono font-bold text-sm tracking-wider">
                PERINGATAN ALARM OPERASIONAL!
              </p>
              <p className="text-xs text-rose-200">
                Target waktu operasional telah tercapai. Hentikan mesin atau alihkan ke periode istirahat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStopAlarm}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white text-rose-900 hover:bg-rose-100 transition-colors shadow"
            >
              HENTIKAN ALARM
            </button>
            <button
              onClick={handleToggleMute}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-rose-200 bg-rose-950 hover:bg-rose-800 border border-rose-700 transition-colors"
            >
              {isMuted ? "UNMUTE" : "MUTE"}
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {vehicle?.plateNumber && (
              <span className="plate-embossed text-xs">{vehicle.plateNumber}</span>
            )}
            <h2 className="text-lg md:text-xl font-bold font-mono text-white">
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Konsol Timer Operasional"}
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {vehicle ? `${VEHICLE_TYPE_LABELS[vehicle.type]} • CC: ${vehicle.engineCc || "-"} • BBM: ${vehicle.fuelType}` : "Sesi Telemetri Berjalan"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${statusConfig.badge}`}
          >
            {STATUS_LABELS[timerState.status]}
          </span>
          <button
            onClick={handleToggleMute}
            className="text-xs font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            title="Toggle Mute Audio"
          >
            {isMuted ? "Audio: MUTED" : "Audio: ON"}
          </button>
        </div>
      </div>

      {/* Big Telemetry Display */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 md:p-8 text-center space-y-2 relative overflow-hidden">
        <div className="text-xs font-mono tracking-widest text-slate-400 uppercase">
          {timerState.status === "RUNNING" || timerState.status === "WARNING"
            ? "SISA WAKTU OPERASI HINGGA TARGET"
            : timerState.status === "OVERTIME"
            ? "KETERLAMBATAN OPERASI (OVERTIME)"
            : timerState.status === "REST_REQUIRED"
            ? "TARGET TERCAPAI — SEGERA ISTIRAHATKAN MESIN"
            : timerState.status === "RESTING"
            ? "COUNTDOWN MASA ISTIRAHAT MESIN"
            : timerState.status === "READY"
            ? "MESIN TELAH BERISTIRAHAT PENUH — SIAP BEROPERASI"
            : "SESI TELAH SELESAI"}
        </div>

        {/* Readout Numbers */}
        <div
          className={`text-5xl sm:text-7xl md:text-8xl font-mono font-extrabold tracking-tight tabular-nums ${statusConfig.accent}`}
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
          <p className="text-xs font-mono text-cyan-300">
            Estimasi Waktu Siap Kembali:{" "}
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
          <p className="text-xs font-mono text-rose-400">
            Telah melewati target berhenti sejak{" "}
            {new Date(session.targetEndTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>PROGRESS {timerState.status === "RESTING" ? "ISTIRAHAT" : "OPERASI"}</span>
          <span>{Math.round(timerState.progress)}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusConfig.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, timerState.progress))}%` }}
          />
        </div>
      </div>

      {/* Telemetry Parameters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-mono text-xs">
        <div>
          <span className="text-slate-500 block text-[10px]">WAKTU MULAI</span>
          <span className="text-slate-200 font-semibold">
            {new Date(session.startTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">TARGET BERHENTI</span>
          <span className="text-slate-200 font-semibold">
            {new Date(session.targetEndTime).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">DURASI ISTIRAHAT</span>
          <span className="text-slate-200 font-semibold">
            {session.restDurationMinutes} Menit
          </span>
        </div>

        <div>
          <span className="text-slate-500 block text-[10px]">WAKTU SIAP KEMBALI</span>
          <span className="text-cyan-400 font-semibold">
            {new Date(expectedReadyIso).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Additional Session Notes */}
      {session.notes && (
        <div className="text-xs text-slate-400 bg-slate-950/40 px-3.5 py-2.5 rounded-lg border border-slate-800/60">
          <span className="font-mono text-slate-500 mr-2">CATATAN:</span>
          {session.notes}
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {(timerState.status === "RUNNING" || timerState.status === "WARNING") && (
          <button
            onClick={handleStopOperation}
            className="flex-1 min-w-[140px] px-5 py-3 rounded-xl font-mono text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-950/40"
          >
            HENTIKAN OPERASI (STOP)
          </button>
        )}

        {(timerState.status === "REST_REQUIRED" || timerState.status === "OVERTIME") && (
          <>
            {session.restDurationMinutes > 0 && (
              <button
                onClick={handleStartRest}
                className="flex-1 min-w-[160px] px-5 py-3 rounded-xl font-mono text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-950/40"
              >
                MULAI ISTIRAHAT MESIN ({session.restDurationMinutes} MIN)
              </button>
            )}
            <button
              onClick={handleFinishSession}
              className="px-5 py-3 rounded-xl font-mono text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              SELESAIKAN SESI
            </button>
          </>
        )}

        {timerState.status === "RESTING" && (
          <button
            onClick={handleFinishSession}
            className="flex-1 px-5 py-3 rounded-xl font-mono text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            SELESAIKAN ISTIRAHAT (LEWATI SISA WAKTU)
          </button>
        )}

        {timerState.status === "READY" && (
          <button
            onClick={handleFinishSession}
            className="flex-1 px-5 py-3 rounded-xl font-mono text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/40"
          >
            SIMPAN KE HISTORI & MULAI SESI BARU
          </button>
        )}
      </div>
    </div>
  );
}
