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
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Car,
  Clock,
  AlertTriangle,
  Wrench,
  Fuel,
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
} from "lucide-react";

type ReportType = "full" | "vehicle" | "operation" | "overtime" | "maintenance" | "fuel";

interface ReportOption {
  type: ReportType;
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: "full",
    title: "Master Telematika Armada",
    description: "Kompilasi lengkap spesifikasi teknis, seluruh riwayat sesi operasional, rekaman servis berkala, dan log konsumsi BBM.",
    badge: "KOMPREHENSIF",
    icon: Layers,
  },
  {
    type: "vehicle",
    title: "Spesifikasi Teknis Unit",
    description: "Identitas kendaraan, nomor rangka, nomor mesin, volume silinder CC, tipe bahan bakar, serta status interval servis oli.",
    badge: "IDENTITAS",
    icon: Car,
  },
  {
    type: "operation",
    title: "Log Sesi Operasional",
    description: "Histori jadwal kerja mesin, timestamp start & stop, kepatuhan batas waktu, dan akumulasi jam kerja unit.",
    badge: "OPERASIONAL",
    icon: Clock,
  },
  {
    type: "overtime",
    title: "Audit Kepatuhan & Overtime",
    description: "Daftar insiden operasional yang melampaui batas toleransi kerja beserta durasi menit overtime.",
    badge: "AUDIT OVERTIME",
    icon: AlertTriangle,
  },
  {
    type: "maintenance",
    title: "Histori Pemeliharaan & Servis",
    description: "Rekam jejak servis preventif, pergantian oli mesin, penggantian suku cadang, dan rincian biaya bengkel.",
    badge: "PERAWATAN",
    icon: Wrench,
  },
  {
    type: "fuel",
    title: "Konsumsi Energi & Bahan Bakar",
    description: "Audit volume pengisian BBM, rincian biaya per liter, pengeluaran kumulatif, serta tracking efisiensi odometer.",
    badge: "BAHAN BAKAR",
    icon: Fuel,
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
      setTimeout(() => setDownloadSuccess(false), 4500);
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
          <div className="w-9 h-9 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider text-slate-400">Menyiapkan Generator Dokumen PDF...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Ekspor Dokumen & Laporan PDF
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/60">
              PDF EXPORT ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Generate dokumen audit berformat PDF standar industri untuk rekaman operasional, kepatuhan jadwal, dan pengeluaran armada.
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 text-xs shadow-lg shadow-emerald-950/30">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold block text-emerald-200">Dokumen PDF Berhasil Dibuat</span>
            <span className="text-emerald-400/90 text-[11px]">File laporan telah otomatis diunduh ke direktori penyimpanan lokal perangkat Anda.</span>
          </div>
        </div>
      )}

      {/* Vehicle Selection Card */}
      <div className="glass-panel p-4.5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" />
            Pilih Target Kendaraan Armada
          </label>
          {selectedVehicle?.plateNumber && (
            <span className="plate-embossed text-[11px] self-start sm:self-auto">
              {selectedVehicle.plateNumber}
            </span>
          )}
        </div>

        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
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
          {/* Quick Telemetry Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] uppercase font-medium">Sesi Operasi</span>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">{stats.sessions}</span>
              <span className="text-[10px] text-slate-400">Tercatat</span>
            </div>

            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] uppercase font-medium">Insiden Overtime</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">{stats.overtime}</span>
              <span className="text-[10px] text-slate-400">Insiden</span>
            </div>

            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] uppercase font-medium">Log Servis</span>
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{stats.maintenance}</span>
              <span className="text-[10px] text-slate-400">Pekerjaan</span>
            </div>

            <div className="glass-card p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] uppercase font-medium">Pengisian BBM</span>
                <Fuel className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">{stats.fuel}</span>
              <span className="text-[10px] text-slate-400">Transaksi</span>
            </div>
          </div>

          {/* Select Report Type Cards */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Pilih Jenis Dokumen Laporan:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {REPORT_OPTIONS.map((opt) => {
                const isSelected = reportType === opt.type;
                const IconComponent = opt.icon;

                return (
                  <div
                    key={opt.type}
                    onClick={() => setReportType(opt.type)}
                    className={`cursor-pointer rounded-2xl p-4.5 border transition-all text-xs relative overflow-hidden group ${
                      isSelected
                        ? "bg-slate-900/90 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500"
                        : "glass-card hover:border-slate-700/90"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-slate-800/80 text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="font-semibold text-white text-sm">{opt.title}</h4>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold tracking-wider ${
                          isSelected
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                            : "bg-slate-800 text-slate-400 border border-slate-700/80"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed pl-9.5">
                      {opt.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate & Download Panel */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-200 flex items-center gap-1.5">
                <span className="text-slate-400">Laporan Terpilih:</span>
                <span className="font-semibold text-cyan-400">
                  {REPORT_OPTIONS.find((o) => o.type === reportType)?.title}
                </span>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Unit: {selectedVehicle.brand} {selectedVehicle.model}</span>
                {selectedVehicle.plateNumber && (
                  <span className="plate-embossed text-[9px]">{selectedVehicle.plateNumber}</span>
                )}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Membuat Dokumen PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Dokumen PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {vehicles.length === 0 && (
        <div className="glass-panel p-16 rounded-2xl text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">
            Belum ada kendaraan terdaftar untuk diekspor laporannya.
          </p>
        </div>
      )}
    </div>
  );
}

