"use client";

import { useEffect, useState } from "react";
import {
  Vehicle,
  VEHICLE_TYPE_LABELS,
} from "@/types";
import { vehicleStore, sessionStore, maintenanceStore, fuelStore } from "@/data/store";
import {
  generateVehicleReport,
  generateOperationReport,
  generateMaintenanceReport,
  generateFuelReport,
  generateFullReport,
} from "@/lib/pdf";

type ReportType = "vehicle" | "operation" | "maintenance" | "fuel" | "full";

const REPORT_LABELS: Record<ReportType, string> = {
  vehicle: "Laporan Kendaraan",
  operation: "Laporan Operasional",
  maintenance: "Laporan Maintenance",
  fuel: "Laporan Bahan Bakar",
  full: "Laporan Lengkap",
};

export default function ReportsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("full");
  const [mounted, setMounted] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVehicles(vehicleStore.getAll());
  }, []);

  function handleGenerate() {
    if (!selectedVehicleId) return;
    const vehicle = vehicleStore.getById(selectedVehicleId);
    if (!vehicle) return;

    setGenerating(true);

    try {
      let doc;
      const fileName = `${vehicle.brand}_${vehicle.model}`.replace(/\s+/g, "_");

      switch (reportType) {
        case "vehicle":
          doc = generateVehicleReport(vehicle);
          doc.save(`${fileName}_kendaraan.pdf`);
          break;
        case "operation": {
          const sessions = sessionStore.getByVehicleId(selectedVehicleId);
          doc = generateOperationReport(vehicle, sessions);
          doc.save(`${fileName}_operasional.pdf`);
          break;
        }
        case "maintenance": {
          const records = maintenanceStore.getByVehicleId(selectedVehicleId);
          doc = generateMaintenanceReport(vehicle, records);
          doc.save(`${fileName}_maintenance.pdf`);
          break;
        }
        case "fuel": {
          const fuelRecords = fuelStore.getByVehicleId(selectedVehicleId);
          doc = generateFuelReport(vehicle, fuelRecords);
          doc.save(`${fileName}_bbm.pdf`);
          break;
        }
        case "full": {
          const allSessions = sessionStore.getByVehicleId(selectedVehicleId);
          const allMaintenance = maintenanceStore.getByVehicleId(selectedVehicleId);
          const allFuel = fuelStore.getByVehicleId(selectedVehicleId);
          doc = generateFullReport(vehicle, allSessions, allMaintenance, allFuel);
          doc.save(`${fileName}_laporan_lengkap.pdf`);
          break;
        }
      }
    } finally {
      setGenerating(false);
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const stats = selectedVehicleId
    ? {
        sessions: sessionStore.getByVehicleId(selectedVehicleId).length,
        maintenance: maintenanceStore.getByVehicleId(selectedVehicleId).length,
        fuel: fuelStore.getByVehicleId(selectedVehicleId).length,
      }
    : null;

  if (!mounted) {
    return <div className="animate-pulse text-gray-400 p-8">Memuat...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Laporan PDF</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kendaraan *</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
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

        {selectedVehicleId && stats && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Sesi Operasi</p>
                <p className="text-xl font-bold text-gray-900">{stats.sessions}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Maintenance</p>
                <p className="text-xl font-bold text-gray-900">{stats.maintenance}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Pengisian BBM</p>
                <p className="text-xl font-bold text-gray-900">{stats.fuel}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Laporan</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(REPORT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{REPORT_LABELS[reportType]}</span>
                {" untuk "}
                <span className="font-medium">
                  {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : ""}
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {reportType === "vehicle" && "Berisi data lengkap kendaraan"}
                {reportType === "operation" && `Berisi ${stats.sessions} sesi operasional`}
                {reportType === "maintenance" && `Berisi ${stats.maintenance} catatan maintenance`}
                {reportType === "fuel" && `Berisi ${stats.fuel} catatan pengisian BBM`}
                {reportType === "full" && "Berisi semua data kendaraan, operasi, maintenance, dan BBM"}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Membuat PDF..." : "Download PDF"}
            </button>
          </>
        )}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Belum ada kendaraan terdaftar</p>
        </div>
      )}
    </div>
  );
}
