"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Timer,
  Wrench,
  Fuel,
  Pencil,
  Trash2,
  SlidersHorizontal,
  Search,
  FileText,
  X,
  Gauge,
  Info,
} from "lucide-react";
import {
  Vehicle,
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  LOAD_CONDITION_LABELS,
  TERRAIN_LABELS,
} from "@/types";

interface Props {
  vehicles: Vehicle[];
  onDelete?: (id: string) => void;
  onEdit?: (vehicle: Vehicle) => void;
}

export default function VehicleList({ vehicles, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedDetail, setSelectedDetail] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.brand.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        (v.plateNumber && v.plateNumber.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === "all" || v.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [vehicles, search, typeFilter]);

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 glass-panel rounded-3xl space-y-3">
        <Truck className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">Belum Ada Kendaraan</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Tambahkan data kendaraan pertama Anda untuk memulai manajemen armada dan pencatatan operasional.
        </p>
      </div>
    );
  }

  const vehicleTypes = Array.from(new Set(vehicles.map((v) => v.type)));

  return (
    <div className="space-y-5">
      {/* Search and Filter toolbar */}
      <div className="glass-panel rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari plat nomor, merek, atau model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-[#070b12]/80 border border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block mr-1" />
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
              typeFilter === "all"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 bg-[#070b12]/60 hover:bg-white/[0.04] border border-white/[0.06]"
            }`}
          >
            Semua ({vehicles.length})
          </button>
          {vehicleTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                typeFilter === type
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 bg-[#070b12]/60 hover:bg-white/[0.04] border border-white/[0.06]"
              }`}
            >
              {VEHICLE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-2xl text-slate-400 text-xs">
          Tidak ditemukan kendaraan yang cocok dengan filter pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Header: Plate & Type */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-base tracking-tight group-hover:text-cyan-300 transition-colors">
                      {v.brand} {v.model}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {VEHICLE_TYPE_LABELS[v.type]}
                    </span>
                  </div>
                  {v.plateNumber ? (
                    <span className="plate-embossed text-xs">{v.plateNumber}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      Tanpa Plat
                    </span>
                  )}
                </div>

                {/* Technical specs badges */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#070b12]/60 p-3 rounded-xl border border-white/[0.05] mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">KILOMETER</span>
                    <span className="text-slate-200 font-mono font-semibold tabular-nums">
                      {v.currentKm !== undefined
                        ? `${v.currentKm.toLocaleString("id-ID")} KM`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">BAHAN BAKAR</span>
                    <span className="text-slate-200 font-medium">
                      {FUEL_TYPE_LABELS[v.fuelType]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">CC MESIN</span>
                    <span className="text-slate-300">
                      {v.engineCc ? `${v.engineCc} cc` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">TANGKI BBM</span>
                    <span className="text-slate-300">
                      {v.fuelLiters ? `${v.fuelLiters} L` : "-"}
                    </span>
                  </div>
                </div>

                {/* Operational tags */}
                <div className="flex flex-wrap gap-1.5 mb-4 text-xs">
                  {v.loadCondition && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-white/[0.06]">
                      Beban: {LOAD_CONDITION_LABELS[v.loadCondition]}
                    </span>
                  )}
                  {v.terrain && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-white/[0.06]">
                      Medan: {TERRAIN_LABELS[v.terrain]}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setSelectedDetail(v)}
                  title="Lihat Detail Spesifikasi"
                  className="px-2.5 py-2 rounded-xl text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs font-medium transition-colors"
                >
                  Specs
                </button>

                <Link
                  href={`/operation?vehicleId=${v.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all shadow-md shadow-cyan-950/40"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Timer</span>
                </Link>

                <Link
                  href={`/maintenance?vehicleId=${v.id}`}
                  title="Jadwal Servis"
                  className="p-2 rounded-xl text-slate-400 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 border border-white/[0.06] transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/fuel?vehicleId=${v.id}`}
                  title="Catat BBM"
                  className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 bg-slate-800/60 hover:bg-slate-800 border border-white/[0.06] transition-colors"
                >
                  <Fuel className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => onEdit?.(v)}
                  title="Edit Data Kendaraan"
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-white/[0.06] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Hapus ${v.brand} ${v.model} (${v.plateNumber || "Tanpa plat"})?`)) {
                      onDelete?.(v.id);
                    }
                  }}
                  title="Hapus Kendaraan"
                  className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technical Detail Specs Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel border border-white/[0.1] rounded-3xl max-w-xl w-full p-6 md:p-7 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-xs text-cyan-400 font-medium block">
                  Detail Spesifikasi Teknis
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {selectedDetail.brand} {selectedDetail.model}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">JENIS KENDARAAN</span>
                <span className="text-slate-100 font-semibold text-sm">{VEHICLE_TYPE_LABELS[selectedDetail.type]}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">NOMOR POLISI (PLAT)</span>
                <span className="text-slate-100 font-semibold text-sm">{selectedDetail.plateNumber || "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">NOMOR MESIN</span>
                <span className="text-slate-100 font-mono font-medium">{selectedDetail.engineNumber || "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">NOMOR RANGKA (VIN)</span>
                <span className="text-slate-100 font-mono font-medium">{selectedDetail.chassisNumber || "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">KAPASITAS MESIN / CC</span>
                <span className="text-slate-100 font-semibold">{selectedDetail.engineCc ? `${selectedDetail.engineCc} cc` : "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">JENIS BAHAN BAKAR</span>
                <span className="text-slate-100 font-semibold">{FUEL_TYPE_LABELS[selectedDetail.fuelType]}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">ODOMETER SAAT INI</span>
                <span className="text-cyan-400 font-mono font-semibold">{selectedDetail.currentKm !== undefined ? `${selectedDetail.currentKm.toLocaleString("id-ID")} KM` : "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">KAPASITAS TANGKI BBM</span>
                <span className="text-slate-100 font-semibold">{selectedDetail.fuelLiters ? `${selectedDetail.fuelLiters} Liter` : "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">KONDISI / BEBAN</span>
                <span className="text-slate-100 font-medium">{selectedDetail.loadCondition ? LOAD_CONDITION_LABELS[selectedDetail.loadCondition] : "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">KONDISI MEDAN</span>
                <span className="text-slate-100 font-medium">{selectedDetail.terrain ? TERRAIN_LABELS[selectedDetail.terrain] : "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">TERAKHIR GANTI OLI</span>
                <span className="text-slate-100 font-medium">{selectedDetail.lastOilChangeDate || "-"}</span>
              </div>
              <div className="bg-[#070b12]/60 p-3.5 rounded-xl border border-white/[0.05]">
                <span className="text-slate-400 block text-[10px] font-medium">KM GANTI OLI</span>
                <span className="text-slate-100 font-mono font-medium">{selectedDetail.lastOilChangeKm ? `${selectedDetail.lastOilChangeKm.toLocaleString("id-ID")} KM` : "-"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Link
                href={`/reports?vehicleId=${selectedDetail.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-cyan-950/40 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Dokumen PDF Unit Ini</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

