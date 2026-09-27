import { OperationStatus } from "@/types";
import { calculateRemainingMs, calculateOvertimeMs, calculateRestRemainingMs, calculateRestEndTime } from "@/lib/calculator";

export interface TimerState {
  status: OperationStatus;
  remainingMs: number;
  overtimeMs: number;
  restRemainingMs: number;
  restEndIso?: string;
  progress: number;
  isAlarmDue?: boolean;
}

export function computeTimerState(
  startTime: string,
  targetEndTime: string,
  restDurationMinutes: number,
  currentStatus: OperationStatus,
  actualEndTime?: string
): TimerState {
  const now = Date.now();
  const startMs = new Date(startTime).getTime();
  const targetMs = new Date(targetEndTime).getTime();

  if (currentStatus === "COMPLETED" || currentStatus === "READY" || currentStatus === "MAINTENANCE") {
    return { status: currentStatus, remainingMs: 0, overtimeMs: 0, restRemainingMs: 0, progress: 100 };
  }

  if (currentStatus === "RESTING") {
    const baseTime = actualEndTime || targetEndTime;
    const restEnd = calculateRestEndTime(baseTime, restDurationMinutes);
    const restRemaining = calculateRestRemainingMs(restEnd);
    const totalRestMs = restDurationMinutes * 60 * 1000;
    const restElapsed = totalRestMs - restRemaining;
    const restProgress = totalRestMs > 0 ? Math.min(100, Math.max(0, (restElapsed / totalRestMs) * 100)) : 100;

    if (restRemaining <= 0) {
      return { status: "READY", remainingMs: 0, overtimeMs: 0, restRemainingMs: 0, restEndIso: restEnd, progress: 100 };
    }
    return { status: "RESTING", remainingMs: 0, overtimeMs: 0, restRemainingMs: restRemaining, restEndIso: restEnd, progress: restProgress };
  }

  const remaining = calculateRemainingMs(targetEndTime);
  const totalDuration = targetMs - startMs;
  const elapsed = now - startMs;
  const progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

  if (remaining <= 0) {
    const overtime = calculateOvertimeMs(targetEndTime);
    // If rest is required and time reached, first state is REST_REQUIRED, or OVERTIME if operating past target
    const isRestRequired = currentStatus === "REST_REQUIRED" || (overtime <= 30000 && currentStatus !== "OVERTIME");
    return {
      status: isRestRequired ? "REST_REQUIRED" : "OVERTIME",
      remainingMs: 0,
      overtimeMs: overtime,
      restRemainingMs: 0,
      progress: 100,
      isAlarmDue: true,
    };
  }

  const warningThreshold = Math.max(totalDuration * 0.1, 5 * 60 * 1000); // 10% or 5 minutes
  if (remaining <= warningThreshold) {
    return { status: "WARNING", remainingMs: remaining, overtimeMs: 0, restRemainingMs: 0, progress, isAlarmDue: false };
  }

  return { status: "RUNNING", remainingMs: remaining, overtimeMs: 0, restRemainingMs: 0, progress, isAlarmDue: false };
}
