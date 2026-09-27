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
  generateOvertimeReport,
  generateFullReport,
} from "@/lib/pdf";
import { useIsMounted } from "@/lib/hooks";
import { ReportIcon, ArrowRightIcon, CheckCircleIcon } from "@/components/ui/Icons";

type ReportType = "full" | "vehicle" | "operation" | "overtime" | "maintenance" | "fuel";

interface ReportOption {
  type: ReportType;
  title: string;
  description: string;
  badge: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: "full",
    title: "Laporan Lengkap Armada (Master Report)",
    description: "Kompilasi komprehensif data teknis, seluruh riwayat sesi operasi, catatan perawatan, dan konsumsi BBM.",
    badge: "LENGKAP",
  },
  {
    type: "vehicle",
    title: "Laporan Spesifikasi Kendaraan",
    description: "Identitas kendaraan, nomor rangka, nomor mesin, CC, tipe bahan bakar, serta tanggal & kilometer ganti oli terakhir.",
    badge: "IDENTITAS",
  },
  {
    type: "operation",
    title: "Laporan Sesi Operasional",
    description: "Histori jadwal operasional, waktu mulai & target berhenti, durasi, overtime, dan status akhir operasi.",
    badge: "OPERASIONAL",
  },
  {
    type: "overtime",
    title: "Laporan Ringkasan Overtime",
    description: "Audit sesi operasional yang melebihi target waktu berhenti beserta durasi menit keterlambatan.",
    badge: "AUDIT OVERTIME",
  },
  {
    type: "maintenance",
    title: "Laporan Servis & Maintenance",
    description: "Log catatan penggantian oli mesin, servis berkala, perbaikan suku cadang, dan rincian biaya perawatan.",
    badge: "SERVIS",
  },
  {
    type: "fuel",
    title: "Laporan Bahan Bakar (BBM)",
    description: "Pencatatan volume liter BBM, harga per liter, total pengeluaran biaya, dan odometer saat pengisian.",
    badge: "ENERGI / BBM",
  },
];

export default function ReportsPage() {
  const mounted = useIsMounted();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>("full");
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const all = vehicleStore.getAll();
    setVehicles(all);
    if (all.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(all[0].id);
    }
  }, [mounted, selectedVehicleId]);

  function handleGenerate() {
    if (!selectedVehicleId) return;
    const vehicle = vehicleStore.getById(selectedVehicleId);
    if (!vehicle) return;

    setGenerating(true);

    try {
      let doc;
      const cleanBrand = (vehicle.brand + "_" + vehicle.model).replace(/[^a-zA-Z0-9_-]/g, "_");

      switch (reportType) {
        case "vehicle":
          doc = generateVehicleReport(vehicle);
          doc.save(`${cleanBrand}_Spesifikasi_Kendaraan.pdf`);
          break;
        case "operation": {
          const sessions = sessionStore.getByVehicleId(selectedVehicleId);
          doc = generateOperationReport(vehicle, sessions);
          doc.save(`${cleanBrand}_Laporan_Operasional.pdf`);
          break;
        }
        case "overtime": {
          const sessions = sessionStore.getByVehicleId(selectedVehicleId);
          doc = generateOvertimeReport(vehicle, sessions);
          doc.save(`${cleanBrand}_Laporan_Overtime.pdf`);
          break;
        }
        case "maintenance": {
          const records = maintenanceStore.getByVehicleId(selectedVehicleId);
          doc = generateMaintenanceReport(vehicle, records);
          doc.save(`${cleanBrand}_Laporan_Maintenance.pdf`);
          break;
        }
        case "fuel": {
          const fuelRecords = fuelStore.getByVehicleId(selectedVehicleId);
          doc = generateFuelReport(vehicle, fuelRecords);
          doc.save(`${cleanBrand}_Laporan_Bahan_Bakar.pdf`);
          break;
        }
        case "full": {
          const allSessions = sessionStore.getByVehicleId(selectedVehicleId);
          const allMaintenance = maintenanceStore.getByVehicleId(selectedVehicleId);
          const allFuel = fuelStore.getByVehicleId(selectedVehicleId);
          doc = generateFullReport(vehicle, allSessions, allMaintenance, allFuel);
          doc.save(`${cleanBrand}_Laporan_Lengkap_Armada.pdf`);
          break;
        }
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } finally {
      setGenerating(false);
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const stats = selectedVehicleId
    ? {
        sessions: sessionStore.getByVehicleId(selectedVehicleId).length,
        overtime: sessionStore.getByVehicleId(selectedVehicleId).filter(
          (s) => (s.overtimeMinutes && s.overtimeMinutes > 0) || s.status === "OVERTIME"
        ).length,
        maintenance: maintenanceStore.getByVehicleId(selectedVehicleId).length,
        fuel: fuelStore.getByVehicleId(selectedVehicleId).length,
      }
    : null;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Menyiapkan Generator Dokumen PDF...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              EKSPOR DOKUMEN & LAPORAN PDF
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-800/60">
              PDF ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unduh laporan resmi data teknis kendaraan, log operasional, ringkasan overtime, servis berkala, dan konsumsi BBM.
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-mono">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Dokumen PDF berhasil dibuat dan diunduh ke perangkat Anda!</span>
        </div>
      )}

      {/* Vehicle Selection Dropdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <label className="block text-xs font-mono font-medium text-slate-300 mb-2">
          PILIH KENDARAAN UNTUK LAPORAN *
        </label>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
        >
          <option value="">-- Pilih Kendaraan --</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""} — {VEHICLE_TYPE_LABELS[v.type]}
            </option>
          ))}
        </select>
      </div>

      {selectedVehicle && stats && (
        <div className="space-y-6">
          {/* Quick Metrics of Available Data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">SESI OPERASI</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats.sessions}</span>
              <span className="text-[10px] text-slate-400">Tercatat</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">SESI OVERTIME</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">{stats.overtime}</span>
              <span className="text-[10px] text-slate-400">Insiden</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">LOG SERVIS</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{stats.maintenance}</span>
              <span className="text-[10px] text-slate-400">Pekerjaan</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">PENGISIAN BBM</span>
              <span className="text-xl font-bold text-cyan-400 mt-1 block">{stats.fuel}</span>
              <span className="text-[10px] text-slate-400">Transaksi</span>
            </div>
          </div>

          {/* Select Report Type Cards */}
          <div className="space-y-3">
            <label className="block text-xs font-mono font-medium text-slate-300">
              PILIH FORMAT DOKUMEN LAPORAN:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_OPTIONS.map((opt) => {
                const isSelected = reportType === opt.type;
                return (
                  <div
                    key={opt.type}
                    onClick={() => setReportType(opt.type)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all text-xs font-mono ${
                      isSelected
                        ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500"
                        : "bg-slate-900/70 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-white text-sm">{opt.title}</h4>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isSelected
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Action Button */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-slate-200">
                Laporan Terpilih:{" "}
                <span className="font-bold text-cyan-400">
                  {REPORT_OPTIONS.find((o) => o.type === reportType)?.title}
                </span>
              </p>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Armada: {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.plateNumber ? `[${selectedVehicle.plateNumber}]` : ""}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 rounded-xl font-mono text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ReportIcon className="w-4 h-4" />
              <span>{generating ? "MEMBUAT DOKUMEN..." : "DOWNLOAD PDF"}</span>
            </button>
          </div>
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
          <p className="text-xs font-mono text-slate-400">
            Belum ada kendaraan terdaftar untuk diekspor laporannya.
          </p>
        </div>
      )}
    </div>
  );
}
