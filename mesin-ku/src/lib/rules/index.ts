import { MaintenanceRecord, MaintenanceRule, Vehicle } from "@/types";
import { calculateMaintenanceDueDays, calculateMaintenanceDueKm } from "@/lib/calculator";

export interface MaintenanceStatus {
  ruleId: string;
  type: string;
  isDue: boolean;
  description: string;
  detail: string;
}

export function evaluateMaintenanceRules(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
  rules: MaintenanceRule[]
): MaintenanceStatus[] {
  return rules.map((rule) => {
    const relevantRecords = records
      .filter((r) => r.vehicleId === vehicle.id && r.type === rule.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastRecord = relevantRecords[0];

    if (rule.intervalKm && vehicle.currentKm !== undefined) {
      const lastKm = lastRecord?.kilometer ?? vehicle.lastOilChangeKm ?? 0;
      const result = calculateMaintenanceDueKm(lastKm, vehicle.currentKm, rule.intervalKm);
      return {
        ruleId: rule.id,
        type: rule.type,
        isDue: result.isDue,
        description: rule.description || `${rule.type} setiap ${rule.intervalKm} km`,
        detail: result.isDue
          ? `Sudah melewati batas ${result.nextDueKm} km`
          : `Sisa ${result.remainingKm} km lagi`,
      };
    }

    if (rule.intervalDays) {
      const lastDate = lastRecord?.date ?? vehicle.lastOilChangeDate;
      if (lastDate) {
        const result = calculateMaintenanceDueDays(lastDate, rule.intervalDays);
        return {
          ruleId: rule.id,
          type: rule.type,
          isDue: result.isDue,
          description: rule.description || `${rule.type} setiap ${rule.intervalDays} hari`,
          detail: result.isDue
            ? `Sudah melewati jadwal (${result.nextDueDate})`
            : `Sisa ${result.remainingDays} hari lagi (${result.nextDueDate})`,
        };
      }
    }

    return {
      ruleId: rule.id,
      type: rule.type,
      isDue: false,
      description: rule.description || rule.type,
      detail: "Data tidak cukup untuk menghitung jadwal",
    };
  });
}
