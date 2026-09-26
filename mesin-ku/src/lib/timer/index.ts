import { OperationStatus } from "@/types";
import { calculateRemainingMs, calculateOvertimeMs, calculateRestRemainingMs, calculateRestEndTime } from "@/lib/calculator";

export interface TimerState {
  status: OperationStatus;
  remainingMs: number;
  overtimeMs: number;
  restRemainingMs: number;
  progress: number;
}

export function computeTimerState(
  startTime: string,
  targetEndTime: string,
  restDurationMinutes: number,
  currentStatus: OperationStatus
): TimerState {
  const now = Date.now();
  const startMs = new Date(startTime).getTime();
  const targetMs = new Date(targetEndTime).getTime();

  if (currentStatus === "COMPLETED" || currentStatus === "READY" || currentStatus === "MAINTENANCE") {
    return { status: currentStatus, remainingMs: 0, overtimeMs: 0, restRemainingMs: 0, progress: 100 };
  }

  if (currentStatus === "RESTING") {
    const restEnd = calculateRestEndTime(targetEndTime, restDurationMinutes);
    const restRemaining = calculateRestRemainingMs(restEnd);
    if (restRemaining <= 0) {
      return { status: "READY", remainingMs: 0, overtimeMs: 0, restRemainingMs: 0, progress: 100 };
    }
    return { status: "RESTING", remainingMs: 0, overtimeMs: 0, restRemainingMs: restRemaining, progress: 100 };
  }

  const remaining = calculateRemainingMs(targetEndTime);
  const totalDuration = targetMs - startMs;
  const elapsed = now - startMs;
  const progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;

  if (remaining <= 0) {
    const overtime = calculateOvertimeMs(targetEndTime);
    return { status: "OVERTIME", remainingMs: 0, overtimeMs: overtime, restRemainingMs: 0, progress: 100 };
  }

  const warningThreshold = totalDuration * 0.1;
  if (remaining <= warningThreshold) {
    return { status: "WARNING", remainingMs: remaining, overtimeMs: 0, restRemainingMs: 0, progress };
  }

  return { status: "RUNNING", remainingMs: remaining, overtimeMs: 0, restRemainingMs: 0, progress };
}
