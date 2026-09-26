import { Vehicle, OperationSession, MaintenanceRecord, FuelRecord, MaintenanceRule } from "@/types";
import { vehicleStore, sessionStore, maintenanceStore, fuelStore, rulesStore } from "./store";

export const SAMPLE_VEHICLES: Vehicle[] = [
  {
    id: "veh-hilux-01",
    brand: "Toyota",
    model: "Hilux D-Cab 2.4 GD-4x4",
    type: "pickup",
    plateNumber: "B 9421 SBB",
    engineNumber: "2GD-FTV-849201",
    chassisNumber: "MHF11BE40H0019284",
    engineCc: 2400,
    fuelType: "diesel",
    fuelLiters: 65,
    currentKm: 34250,
    loadCondition: "heavy",
    terrain: "offroad",
    lastOilChangeDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().split("T")[0],
    lastOilChangeKm: 30000,
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "veh-fuso-02",
    brand: "Mitsubishi Fuso",
    model: "Canter FE 71 Long Box",
    type: "truk",
    plateNumber: "B 9088 TKN",
    engineNumber: "4D34-T4-719302",
    chassisNumber: "MHMFE71-9238410",
    engineCc: 3908,
    fuelType: "diesel",
    fuelLiters: 100,
    currentKm: 58900,
    loadCondition: "heavy",
    terrain: "urban",
    lastOilChangeDate: new Date(Date.now() - 70 * 24 * 3600 * 1000).toISOString().split("T")[0],
    lastOilChangeKm: 52000,
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "veh-crv-03",
    brand: "Honda",
    model: "CR-V 1.5 Turbo Prestige",
    type: "suv",
    plateNumber: "B 1184 SSJ",
    engineNumber: "L15B7-502918",
    chassisNumber: "MRHRW18-910283",
    engineCc: 1498,
    fuelType: "bensin",
    fuelLiters: 53,
    currentKm: 18400,
    loadCondition: "normal",
    terrain: "urban",
    lastOilChangeDate: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString().split("T")[0],
    lastOilChangeKm: 15000,
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function seedDemoData() {
  if (typeof window === "undefined") return;

  // Clear previous demo keys
  localStorage.setItem("mesinku_vehicles", JSON.stringify(SAMPLE_VEHICLES));

  // Seed sample rules
  const sampleRules: MaintenanceRule[] = [
    {
      id: "rule-hilux-oli",
      vehicleId: "veh-hilux-01",
      type: "oil_change",
      intervalKm: 5000,
      intervalDays: 90,
      description: "Ganti Oli Mesin & Filter Oli (Heavy Duty)",
    },
    {
      id: "rule-fuso-servis",
      vehicleId: "veh-fuso-02",
      type: "service",
      intervalKm: 5000,
      intervalDays: 60,
      description: "Servis Berkala & Pemeriksaan Rem Angin",
    },
    {
      id: "rule-crv-inspeksi",
      vehicleId: "veh-crv-03",
      type: "inspection",
      intervalKm: 10000,
      intervalDays: 180,
      description: "Inspeksi Berkala & Rotasi Ban",
    },
  ];
  localStorage.setItem("mesinku_rules", JSON.stringify(sampleRules));

  // Seed sample maintenance history
  const sampleMaintenance: MaintenanceRecord[] = [
    {
      id: "maint-1",
      vehicleId: "veh-hilux-01",
      type: "oil_change",
      date: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString().split("T")[0],
      kilometer: 30000,
      cost: 850000,
      notes: "Oli Fully Synthetic 5W-30 + Filter Oli OEM",
      createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "maint-2",
      vehicleId: "veh-fuso-02",
      type: "service",
      date: new Date(Date.now() - 70 * 24 * 3600 * 1000).toISOString().split("T")[0],
      kilometer: 52000,
      cost: 1450000,
      notes: "Penggantian kampas rem depan dan kuras oli gardan",
      createdAt: new Date(Date.now() - 70 * 24 * 3600 * 1000).toISOString(),
    },
  ];
  localStorage.setItem("mesinku_maintenance", JSON.stringify(sampleMaintenance));

  // Seed sample fuel records
  const sampleFuel: FuelRecord[] = [
    {
      id: "fuel-1",
      vehicleId: "veh-hilux-01",
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
      liters: 55,
      fuelType: "diesel",
      pricePerLiter: 15200,
      totalPrice: 836000,
      kilometer: 34100,
      notes: "Pertamina Dex SPBU Gatot Subroto",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fuel-2",
      vehicleId: "veh-fuso-02",
      date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split("T")[0],
      liters: 90,
      fuelType: "diesel",
      pricePerLiter: 6800,
      totalPrice: 612000,
      kilometer: 58500,
      notes: "Solar Bio Subsidi Trayek Cakung",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fuel-3",
      vehicleId: "veh-crv-03",
      date: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString().split("T")[0],
      liters: 42,
      fuelType: "bensin",
      pricePerLiter: 13700,
      totalPrice: 575400,
      kilometer: 18100,
      notes: "Pertamax Turbo 98",
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem("mesinku_fuel", JSON.stringify(sampleFuel));

  // Seed one running operation session and one completed
  const now = Date.now();
  const sampleSessions: OperationSession[] = [
    {
      id: "session-active-1",
      vehicleId: "veh-hilux-01",
      startTime: new Date(now - 45 * 60 * 1000).toISOString(), // started 45m ago
      targetEndTime: new Date(now + 45 * 60 * 1000).toISOString(), // ends in 45m
      restDurationMinutes: 20,
      status: "RUNNING",
      notes: "Patroli Site A & Inspeksi Titik Proyek",
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "session-completed-1",
      vehicleId: "veh-crv-03",
      startTime: new Date(now - 26 * 3600 * 1000).toISOString(),
      targetEndTime: new Date(now - 24 * 3600 * 1000).toISOString(),
      actualEndTime: new Date(now - 24 * 3600 * 1000).toISOString(),
      restDurationMinutes: 15,
      status: "COMPLETED",
      notes: "Kunjungan Klien Korporat Sudirman",
      createdAt: new Date(now - 26 * 3600 * 1000).toISOString(),
    },
  ];
  localStorage.setItem("mesinku_sessions", JSON.stringify(sampleSessions));
}
