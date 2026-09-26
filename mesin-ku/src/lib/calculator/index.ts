export function calculateOperationDurationMs(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.max(0, end - start);
}

export function calculateRemainingMs(targetEndTime: string): number {
  const target = new Date(targetEndTime).getTime();
  const now = Date.now();
  if (isNaN(target)) return 0;
  return Math.max(0, target - now);
}

export function calculateOvertimeMs(targetEndTime: string): number {
  const target = new Date(targetEndTime).getTime();
  const now = Date.now();
  if (isNaN(target)) return 0;
  return Math.max(0, now - target);
}

export function calculateRestEndTime(actualEndTime: string, restDurationMinutes: number): string {
  const end = new Date(actualEndTime).getTime();
  if (isNaN(end)) return actualEndTime;
  return new Date(end + restDurationMinutes * 60 * 1000).toISOString();
}

export function calculateRestRemainingMs(restEndTime: string): number {
  const end = new Date(restEndTime).getTime();
  const now = Date.now();
  if (isNaN(end)) return 0;
  return Math.max(0, end - now);
}

export function calculateProgress(startTime: string, targetEndTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(targetEndTime).getTime();
  const now = Date.now();
  if (isNaN(start) || isNaN(end)) return 0;
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function msToTimeString(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function msToHumanReadable(ms: number): string {
  if (ms <= 0) return "0 menit";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours} jam ${minutes} menit`;
  if (hours > 0) return `${hours} jam`;
  return `${minutes} menit`;
}

export function calculateMaintenanceDueKm(
  lastChangeKm: number,
  currentKm: number,
  intervalKm: number
): { isDue: boolean; remainingKm: number; nextDueKm: number } {
  const nextDueKm = lastChangeKm + intervalKm;
  const remainingKm = nextDueKm - currentKm;
  return {
    isDue: remainingKm <= 0,
    remainingKm: Math.max(0, remainingKm),
    nextDueKm,
  };
}

export function calculateMaintenanceDueDays(
  lastChangeDate: string,
  intervalDays: number
): { isDue: boolean; remainingDays: number; nextDueDate: string } {
  const lastDate = new Date(lastChangeDate).getTime();
  if (isNaN(lastDate)) {
    return { isDue: false, remainingDays: 0, nextDueDate: "" };
  }
  const nextDue = lastDate + intervalDays * 24 * 60 * 60 * 1000;
  const remaining = nextDue - Date.now();
  const remainingDays = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return {
    isDue: remainingDays <= 0,
    remainingDays: Math.max(0, remainingDays),
    nextDueDate: new Date(nextDue).toISOString().split("T")[0],
  };
}
