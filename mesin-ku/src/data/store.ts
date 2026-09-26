import { Vehicle, OperationSession, MaintenanceRecord, FuelRecord, MaintenanceRule } from "@/types";
import { SAMPLE_VEHICLES, seedDemoData } from "./seed";

const STORAGE_KEYS = {
  vehicles: "mesinku_vehicles",
  sessions: "mesinku_sessions",
  maintenance: "mesinku_maintenance",
  fuel: "mesinku_fuel",
  rules: "mesinku_rules",
  initialized: "mesinku_initialized_v2",
};

export function notifyStoreChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mesinku-store-change"));
  }
}

function ensureInitialized() {
  if (typeof window === "undefined") return;
  const isInit = localStorage.getItem(STORAGE_KEYS.initialized);
  const existingVehicles = localStorage.getItem(STORAGE_KEYS.vehicles);
  if (!isInit && (!existingVehicles || existingVehicles === "[]")) {
    seedDemoData();
    localStorage.setItem(STORAGE_KEYS.initialized, "true");
  }
}

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  ensureInitialized();
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
  notifyStoreChange();
}

export const vehicleStore = {
  getAll: (): Vehicle[] => getItem<Vehicle>(STORAGE_KEYS.vehicles),
  getById: (id: string): Vehicle | undefined =>
    getItem<Vehicle>(STORAGE_KEYS.vehicles).find((v) => v.id === id),
  add: (vehicle: Vehicle): void => {
    const all = getItem<Vehicle>(STORAGE_KEYS.vehicles);
    all.push(vehicle);
    setItem(STORAGE_KEYS.vehicles, all);
  },
  update: (vehicle: Vehicle): void => {
    const all = getItem<Vehicle>(STORAGE_KEYS.vehicles);
    const idx = all.findIndex((v) => v.id === vehicle.id);
    if (idx !== -1) {
      all[idx] = vehicle;
      setItem(STORAGE_KEYS.vehicles, all);
    }
  },
  remove: (id: string): void => {
    const all = getItem<Vehicle>(STORAGE_KEYS.vehicles).filter((v) => v.id !== id);
    setItem(STORAGE_KEYS.vehicles, all);
  },
};

export const sessionStore = {
  getAll: (): OperationSession[] => getItem<OperationSession>(STORAGE_KEYS.sessions),
  getByVehicleId: (vehicleId: string): OperationSession[] =>
    getItem<OperationSession>(STORAGE_KEYS.sessions).filter((s) => s.vehicleId === vehicleId),
  getById: (id: string): OperationSession | undefined =>
    getItem<OperationSession>(STORAGE_KEYS.sessions).find((s) => s.id === id),
  add: (session: OperationSession): void => {
    const all = getItem<OperationSession>(STORAGE_KEYS.sessions);
    all.push(session);
    setItem(STORAGE_KEYS.sessions, all);
  },
  update: (session: OperationSession): void => {
    const all = getItem<OperationSession>(STORAGE_KEYS.sessions);
    const idx = all.findIndex((s) => s.id === session.id);
    if (idx !== -1) {
      all[idx] = session;
      setItem(STORAGE_KEYS.sessions, all);
    }
  },
  remove: (id: string): void => {
    const all = getItem<OperationSession>(STORAGE_KEYS.sessions).filter((s) => s.id !== id);
    setItem(STORAGE_KEYS.sessions, all);
  },
};

export const maintenanceStore = {
  getAll: (): MaintenanceRecord[] => getItem<MaintenanceRecord>(STORAGE_KEYS.maintenance),
  getByVehicleId: (vehicleId: string): MaintenanceRecord[] =>
    getItem<MaintenanceRecord>(STORAGE_KEYS.maintenance).filter((m) => m.vehicleId === vehicleId),
  add: (record: MaintenanceRecord): void => {
    const all = getItem<MaintenanceRecord>(STORAGE_KEYS.maintenance);
    all.push(record);
    setItem(STORAGE_KEYS.maintenance, all);
  },
  update: (record: MaintenanceRecord): void => {
    const all = getItem<MaintenanceRecord>(STORAGE_KEYS.maintenance);
    const idx = all.findIndex((m) => m.id === record.id);
    if (idx !== -1) {
      all[idx] = record;
      setItem(STORAGE_KEYS.maintenance, all);
    }
  },
  remove: (id: string): void => {
    const all = getItem<MaintenanceRecord>(STORAGE_KEYS.maintenance).filter((m) => m.id !== id);
    setItem(STORAGE_KEYS.maintenance, all);
  },
};

export const fuelStore = {
  getAll: (): FuelRecord[] => getItem<FuelRecord>(STORAGE_KEYS.fuel),
  getByVehicleId: (vehicleId: string): FuelRecord[] =>
    getItem<FuelRecord>(STORAGE_KEYS.fuel).filter((f) => f.vehicleId === vehicleId),
  add: (record: FuelRecord): void => {
    const all = getItem<FuelRecord>(STORAGE_KEYS.fuel);
    all.push(record);
    setItem(STORAGE_KEYS.fuel, all);
  },
  remove: (id: string): void => {
    const all = getItem<FuelRecord>(STORAGE_KEYS.fuel).filter((f) => f.id !== id);
    setItem(STORAGE_KEYS.fuel, all);
  },
};

export const rulesStore = {
  getAll: (): MaintenanceRule[] => getItem<MaintenanceRule>(STORAGE_KEYS.rules),
  getByVehicleId: (vehicleId: string): MaintenanceRule[] =>
    getItem<MaintenanceRule>(STORAGE_KEYS.rules).filter((r) => r.vehicleId === vehicleId),
  add: (rule: MaintenanceRule): void => {
    const all = getItem<MaintenanceRule>(STORAGE_KEYS.rules);
    all.push(rule);
    setItem(STORAGE_KEYS.rules, all);
  },
  update: (rule: MaintenanceRule): void => {
    const all = getItem<MaintenanceRule>(STORAGE_KEYS.rules);
    const idx = all.findIndex((r) => r.id === rule.id);
    if (idx !== -1) {
      all[idx] = rule;
      setItem(STORAGE_KEYS.rules, all);
    }
  },
  remove: (id: string): void => {
    const all = getItem<MaintenanceRule>(STORAGE_KEYS.rules).filter((r) => r.id !== id);
    setItem(STORAGE_KEYS.rules, all);
  },
};

export function resetToDemoData() {
  seedDemoData();
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.initialized, "true");
    notifyStoreChange();
    window.location.reload();
  }
}
