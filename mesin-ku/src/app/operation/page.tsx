"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Vehicle, OperationSession, OperationStatus, STATUS_LABELS, VEHICLE_TYPE_LABELS } from "@/types";
import { vehicleStore, sessionStore } from "@/data/store";
import { validateOperationSchedule } from "@/lib/validation";
import { computeTimerState, TimerState } from "@/lib/timer";
import { msToTimeString, calculateRestEndTime } from "@/lib/calculator";

function OperationContent() {
  const searchParams = useSearchParams();
  const vehicleIdParam = searchParams.get("vehicleId");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicleIdParam || "");
  const [activeSession, setActiveSession] = useState<OperationSession | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [mounted, setMounted] = useState(false);

  const [startTime, setStartTime] = useState("");
  const [targetEndTime, setTargetEndTime] = useState("");
  const [restMinutes, setRestMinutes] = useState(30);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVehicles(vehicleStore.getAll());
  }, []);

  useEffect(() => {
    if (vehicleIdParam) setSelectedVehicleId(vehicleIdParam);
  }, [vehicleIdParam]);

  const loadActiveSession = useCallback(() => {
    if (!selectedVehicleId) {
      setActiveSession(null);
      return;
    }
    const sessions = sessionStore.getByVehicleId(selectedVehicleId);
    const active = sessions.find(
      (s) => s.status !== "COMPLETED" && s.status !== "READY"
    );
    setActiveSession(active || null);
    if (active) {
      setAlarmTriggered(active.status === "OVERTIME" || active.status === "REST_REQUIRED");
    }
  }, [selectedVehicleId]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  useEffect(() => {
    if (!activeSession) {
      setTimerState(null);
      return;
    }
    function tick() {
      const session = sessionStore.getById(activeSession!.id);
      if (!session) return;
      const state = computeTimerState(
        session.startTime,
        session.targetEndTime,
        session.restDurationMinutes,
        session.status
      );

      if (
        (state.status === "OVERTIME" || state.status === "REST_REQUIRED") &&
        session.status !== "OVERTIME" &&
        session.status !== "REST_REQUIRED" &&
        session.status !== "RESTING" &&
        session.status !== "COMPLETED"
      ) {
        const updated = { ...session, status: state.status as OperationStatus };
        sessionStore.update(updated);
        setActiveSession(updated);
        if (!alarmTriggered) {
          playAlarm();
          setAlarmTriggered(true);
        }
      }

      if (state.status === "READY" && session.status === "RESTING") {
        const updated = { ...session, status: "COMPLETED" as OperationStatus };
        sessionStore.update(updated);
        setActiveSession(updated);
      }

      setTimerState(state);
    }

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [activeSession, alarmTriggered]);

  function initAudio() {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  function playAlarm() {
    try {
      initAudio();
      const ctx = audioContextRef.current!;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 2);
      setAlarmPlaying(true);
      setTimeout(() => setAlarmPlaying(false), 2000);
    } catch {
      // browser blocked audio
    }
  }

  function stopAlarm() {
    setAlarmPlaying(false);
    setAlarmTriggered(true);
  }

  function handleStartOperation() {
    const validationErrors = validateOperationSchedule(startTime, targetEndTime, restMinutes);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    initAudio();

    const session: OperationSession = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      startTime: new Date(startTime).toISOString(),
      targetEndTime: new Date(targetEndTime).toISOString(),
      restDurationMinutes: restMinutes,
      status: "RUNNING",
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    sessionStore.add(session);
    setActiveSession(session);
    setAlarmTriggered(false);
  }

  function handleStopOperation() {
    if (!activeSession) return;
    const now = new Date().toISOString();
    const overtimeMs = Math.max(0, Date.now() - new Date(activeSession.targetEndTime).getTime());
    const updated: OperationSession = {
      ...activeSession,
      actualEndTime: now,
      overtimeMinutes: Math.floor(overtimeMs / 60000),
      status: activeSession.restDurationMinutes > 0 ? "RESTING" : "COMPLETED",
    };
    sessionStore.update(updated);
    setActiveSession(updated);
    stopAlarm();
  }

  function handleStartRest() {
    if (!activeSession) return;
    const updated: OperationSession = {
      ...activeSession,
      actualEndTime: new Date().toISOString(),
      status: "RESTING",
    };
    sessionStore.update(updated);
    setActiveSession(updated);
    stopAlarm();
  }

  function handleComplete() {
    if (!activeSession) return;
    const updated: OperationSession = {
      ...activeSession,
      status: "COMPLETED",
    };
    sessionStore.update(updated);
    setActiveSession(null);
    setTimerState(null);
  }

  function getError(field: string) {
    return errors.find((e) => e.field === field)?.message;
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  if (!mounted) {
    return <div className="animate-pulse text-gray-400 p-8">Memuat...</div>;
  }

  const statusColors: Record<string, string> = {
    RUNNING: "bg-green-100 text-green-800 border-green-300",
    WARNING: "bg-yellow-100 text-yellow-800 border-yellow-400",
    OVERTIME: "bg-red-100 text-red-800 border-red-400",
    REST_REQUIRED: "bg-orange-100 text-orange-800 border-orange-400",
    RESTING: "bg-blue-100 text-blue-800 border-blue-300",
    COMPLETED: "bg-gray-100 text-gray-800 border-gray-300",
    READY: "bg-gray-100 text-gray-800 border-gray-300",
    MAINTENANCE: "bg-purple-100 text-purple-800 border-purple-300",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Operasi Kendaraan</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kendaraan</label>
        <select
          value={selectedVehicleId}
          onChange={(e) => {
            setSelectedVehicleId(e.target.value);
            setActiveSession(null);
            setTimerState(null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">-- Pilih Kendaraan --</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model} {v.plateNumber ? `(${v.plateNumber})` : ""} - {VEHICLE_TYPE_LABELS[v.type]}
            </option>
          ))}
        </select>
      </div>

      {selectedVehicleId && !activeSession && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Jadwal Operasi Baru</h2>
          {selectedVehicle && (
            <p className="text-sm text-gray-500">
              {selectedVehicle.brand} {selectedVehicle.model} — {VEHICLE_TYPE_LABELS[selectedVehicle.type]}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai *</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${getError("startTime") ? "border-red-400" : "border-gray-300"}`}
              />
              {getError("startTime") && <p className="text-red-500 text-xs mt-1">{getError("startTime")}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Berhenti *</label>
              <input
                type="datetime-local"
                value={targetEndTime}
                onChange={(e) => setTargetEndTime(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${getError("targetEndTime") ? "border-red-400" : "border-gray-300"}`}
              />
              {getError("targetEndTime") && <p className="text-red-500 text-xs mt-1">{getError("targetEndTime")}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Istirahat (menit)</label>
              <input
                type="number"
                value={restMinutes}
                onChange={(e) => setRestMinutes(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${getError("restDurationMinutes") ? "border-red-400" : "border-gray-300"}`}
                min="0"
              />
              {getError("restDurationMinutes") && <p className="text-red-500 text-xs mt-1">{getError("restDurationMinutes")}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Catatan penggunaan (opsional)"
              />
            </div>
          </div>

          <button
            onClick={handleStartOperation}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Start Operasi
          </button>
        </div>
      )}

      {activeSession && timerState && (
        <div className={`border-2 rounded-lg p-6 ${statusColors[timerState.status] || ""}`}>
          {alarmPlaying && (
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg mb-4 flex items-center justify-between animate-pulse">
              <span className="font-bold">ALARM! Target waktu tercapai!</span>
              <button onClick={stopAlarm} className="bg-white text-red-600 px-3 py-1 rounded text-sm font-medium">
                Matikan
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Operasi Aktif"}
              </h2>
              <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded ${statusColors[timerState.status] || ""}`}>
                {STATUS_LABELS[timerState.status]}
              </span>
            </div>
          </div>

          <div className="text-center py-6">
            {timerState.status === "RUNNING" || timerState.status === "WARNING" ? (
              <>
                <p className="text-sm text-gray-600 mb-1">Sisa Waktu</p>
                <p className={`text-6xl font-mono font-bold ${timerState.status === "WARNING" ? "text-yellow-700" : "text-gray-900"}`}>
                  {msToTimeString(timerState.remainingMs)}
                </p>
              </>
            ) : timerState.status === "OVERTIME" ? (
              <>
                <p className="text-sm text-red-600 mb-1">Overtime</p>
                <p className="text-6xl font-mono font-bold text-red-700">
                  +{msToTimeString(timerState.overtimeMs)}
                </p>
              </>
            ) : timerState.status === "RESTING" ? (
              <>
                <p className="text-sm text-blue-600 mb-1">Istirahat Tersisa</p>
                <p className="text-6xl font-mono font-bold text-blue-700">
                  {msToTimeString(timerState.restRemainingMs)}
                </p>
              </>
            ) : timerState.status === "REST_REQUIRED" ? (
              <>
                <p className="text-sm text-orange-600 mb-1">Istirahat Diperlukan</p>
                <p className="text-2xl font-bold text-orange-700">Hentikan operasi dan istirahat</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-700">Operasi Selesai</p>
            )}
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  timerState.status === "OVERTIME"
                    ? "bg-red-500"
                    : timerState.status === "WARNING"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(100, timerState.progress)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">Mulai:</span>{" "}
              {new Date(activeSession.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div>
              <span className="font-medium">Target:</span>{" "}
              {new Date(activeSession.targetEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {activeSession.restDurationMinutes > 0 && (
              <div>
                <span className="font-medium">Istirahat:</span> {activeSession.restDurationMinutes} menit
              </div>
            )}
            {activeSession.notes && (
              <div>
                <span className="font-medium">Catatan:</span> {activeSession.notes}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {(timerState.status === "RUNNING" || timerState.status === "WARNING") && (
              <button
                onClick={handleStopOperation}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Stop Operasi
              </button>
            )}
            {(timerState.status === "OVERTIME" || timerState.status === "REST_REQUIRED") && (
              <>
                {activeSession.restDurationMinutes > 0 && (
                  <button
                    onClick={handleStartRest}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Mulai Istirahat
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  className="bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Selesai
                </button>
              </>
            )}
            {timerState.status === "RESTING" && (
              <button
                onClick={handleComplete}
                className="bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Selesai (Lewati Istirahat)
              </button>
            )}
            {timerState.status === "COMPLETED" && (
              <button
                onClick={() => {
                  setActiveSession(null);
                  setTimerState(null);
                }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Operasi Baru
              </button>
            )}
          </div>
        </div>
      )}

      {selectedVehicleId && (
        <SessionHistory vehicleId={selectedVehicleId} />
      )}
    </div>
  );
}

export default function OperationPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-400 p-8">Memuat...</div>}>
      <OperationContent />
    </Suspense>
  );
}

function SessionHistory({ vehicleId }: { vehicleId: string }) {
  const [sessions, setSessions] = useState<OperationSession[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSessions(
      sessionStore
        .getByVehicleId(vehicleId)
        .filter((s) => s.status === "COMPLETED")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }, [vehicleId]);

  if (!mounted || sessions.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Riwayat Operasi</h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">
                {new Date(s.startTime).toLocaleDateString("id-ID")}
              </span>
              <span className="text-gray-500 ml-2">
                {new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                {" - "}
                {new Date(s.targetEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {s.overtimeMinutes && s.overtimeMinutes > 0 ? (
              <span className="text-red-600 text-xs">+{s.overtimeMinutes} menit overtime</span>
            ) : (
              <span className="text-green-600 text-xs">Selesai</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
