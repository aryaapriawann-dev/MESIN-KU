export type VehicleType =
  | "motor"
  | "mobil"
  | "pickup"
  | "suv"
  | "sedan"
  | "bus"
  | "truk"
  | "kendaraan_umum"
  | "kendaraan_operasional"
  | "kendaraan_logistik"
  | "alat_berat"
  | "lainnya";

export type FuelType = "bensin" | "diesel" | "listrik" | "hybrid" | "gas" | "lainnya";

export type LoadCondition = "light" | "normal" | "heavy";

export type Terrain = "flat" | "urban" | "uphill" | "offroad";

export type OperationStatus =
  | "READY"
  | "RUNNING"
  | "WARNING"
  | "REST_REQUIRED"
  | "RESTING"
  | "OVERTIME"
  | "COMPLETED"
  | "MAINTENANCE";

export type MaintenanceType = "oil_change" | "service" | "repair" | "inspection" | "other";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  type: VehicleType;
  plateNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  engineCc?: number;
  fuelType: FuelType;
  fuelLiters?: number;
  currentKm?: number;
  loadCondition?: LoadCondition;
  terrain?: Terrain;
  lastOilChangeDate?: string;
  lastOilChangeKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperationSession {
  id: string;
  vehicleId: string;
  startTime: string;
  targetEndTime: string;
  restDurationMinutes: number;
  actualEndTime?: string;
  overtimeMinutes?: number;
  status: OperationStatus;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  date: string;
  kilometer?: number;
  notes?: string;
  cost?: number;
  nextDueDate?: string;
  nextDueKm?: number;
  createdAt: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  fuelType: FuelType;
  pricePerLiter?: number;
  totalPrice?: number;
  kilometer?: number;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRule {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  intervalKm?: number;
  intervalDays?: number;
  description?: string;
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  motor: "Motor",
  mobil: "Mobil",
  pickup: "Pickup",
  suv: "SUV",
  sedan: "Sedan",
  bus: "Bus",
  truk: "Truk",
  kendaraan_umum: "Kendaraan Umum",
  kendaraan_operasional: "Kendaraan Operasional",
  kendaraan_logistik: "Kendaraan Logistik",
  alat_berat: "Alat Berat",
  lainnya: "Lainnya",
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  bensin: "Bensin",
  diesel: "Diesel",
  listrik: "Listrik",
  hybrid: "Hybrid",
  gas: "Gas",
  lainnya: "Lainnya",
};

export const LOAD_CONDITION_LABELS: Record<LoadCondition, string> = {
  light: "Ringan",
  normal: "Normal",
  heavy: "Berat",
};

export const TERRAIN_LABELS: Record<Terrain, string> = {
  flat: "Datar",
  urban: "Perkotaan",
  uphill: "Tanjakan",
  offroad: "Off-road",
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  oil_change: "Ganti Oli",
  service: "Servis",
  repair: "Perbaikan",
  inspection: "Inspeksi",
  other: "Lainnya",
};

export const STATUS_LABELS: Record<OperationStatus, string> = {
  READY: "Siap",
  RUNNING: "Beroperasi",
  WARNING: "Peringatan",
  REST_REQUIRED: "Istirahat Diperlukan",
  RESTING: "Istirahat",
  OVERTIME: "Overtime",
  COMPLETED: "Selesai",
  MAINTENANCE: "Maintenance",
};
