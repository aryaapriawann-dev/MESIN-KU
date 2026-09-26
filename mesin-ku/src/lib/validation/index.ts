import { Vehicle, FuelRecord } from "@/types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateVehicle(vehicle: Partial<Vehicle>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!vehicle.brand?.trim()) {
    errors.push({ field: "brand", message: "Merek kendaraan harus diisi" });
  }
  if (!vehicle.model?.trim()) {
    errors.push({ field: "model", message: "Model kendaraan harus diisi" });
  }
  if (!vehicle.type) {
    errors.push({ field: "type", message: "Jenis kendaraan harus dipilih" });
  }
  if (!vehicle.fuelType) {
    errors.push({ field: "fuelType", message: "Jenis bahan bakar harus dipilih" });
  }
  if (vehicle.engineCc !== undefined && vehicle.engineCc !== null) {
    if (vehicle.engineCc < 0) {
      errors.push({ field: "engineCc", message: "CC mesin tidak boleh negatif" });
    }
  }
  if (vehicle.fuelLiters !== undefined && vehicle.fuelLiters !== null) {
    if (vehicle.fuelLiters < 0) {
      errors.push({ field: "fuelLiters", message: "Jumlah bahan bakar tidak boleh negatif" });
    }
  }
  if (vehicle.currentKm !== undefined && vehicle.currentKm !== null) {
    if (vehicle.currentKm < 0) {
      errors.push({ field: "currentKm", message: "Kilometer tidak boleh negatif" });
    }
  }
  if (vehicle.lastOilChangeKm !== undefined && vehicle.lastOilChangeKm !== null) {
    if (vehicle.lastOilChangeKm < 0) {
      errors.push({ field: "lastOilChangeKm", message: "Kilometer ganti oli tidak boleh negatif" });
    }
  }

  return errors;
}

export function validateOperationSchedule(
  startTime: string,
  targetEndTime: string,
  restDurationMinutes: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!startTime) {
    errors.push({ field: "startTime", message: "Waktu mulai harus diisi" });
  }
  if (!targetEndTime) {
    errors.push({ field: "targetEndTime", message: "Target waktu berhenti harus diisi" });
  }

  if (startTime && targetEndTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(targetEndTime).getTime();

    if (isNaN(start)) {
      errors.push({ field: "startTime", message: "Format waktu mulai tidak valid" });
    }
    if (isNaN(end)) {
      errors.push({ field: "targetEndTime", message: "Format target waktu tidak valid" });
    }
    if (!isNaN(start) && !isNaN(end) && end <= start) {
      errors.push({ field: "targetEndTime", message: "Target berhenti harus setelah waktu mulai" });
    }
  }

  if (restDurationMinutes < 0) {
    errors.push({ field: "restDurationMinutes", message: "Durasi istirahat tidak boleh negatif" });
  }

  return errors;
}

export function validateFuelRecord(record: Partial<FuelRecord>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!record.date) {
    errors.push({ field: "date", message: "Tanggal harus diisi" });
  }
  if (record.liters === undefined || record.liters === null || record.liters <= 0) {
    errors.push({ field: "liters", message: "Jumlah liter harus lebih dari 0" });
  }
  if (!record.fuelType) {
    errors.push({ field: "fuelType", message: "Jenis bahan bakar harus dipilih" });
  }
  if (record.pricePerLiter !== undefined && record.pricePerLiter !== null && record.pricePerLiter < 0) {
    errors.push({ field: "pricePerLiter", message: "Harga tidak boleh negatif" });
  }
  if (record.kilometer !== undefined && record.kilometer !== null && record.kilometer < 0) {
    errors.push({ field: "kilometer", message: "Kilometer tidak boleh negatif" });
  }

  return errors;
}

export function validateMaintenanceRecord(
  type: string,
  date: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!type) {
    errors.push({ field: "type", message: "Jenis maintenance harus dipilih" });
  }
  if (!date) {
    errors.push({ field: "date", message: "Tanggal harus diisi" });
  }

  return errors;
}
