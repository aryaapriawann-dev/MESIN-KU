"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Vehicle,
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  LOAD_CONDITION_LABELS,
  TERRAIN_LABELS,
} from "@/types";
import {
  VehicleIcon,
  OperationIcon,
  MaintenanceIcon,
  FuelIcon,
  EditIcon,
  TrashIcon,
  FilterIcon,
} from "@/components/ui/Icons";

interface Props {
  vehicles: Vehicle[];
  onDelete?: (id: string) => void;
  onEdit?: (vehicle: Vehicle) => void;
}

export default function VehicleList({ vehicles, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
      <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-xl">
        <VehicleIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">Belum Ada Kendaraan</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Tambahkan data kendaraan pertama Anda untuk memulai manajemen armada dan pencatatan operasional.
        </p>
      </div>
    );
  }

  const vehicleTypes = Array.from(new Set(vehicles.map((v) => v.type)));

  return (
    <div className="space-y-4">
      {/* Search and Filter toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari plat nomor, merek, atau model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <FilterIcon className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
              typeFilter === "all"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60"
                : "text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800"
            }`}
          >
            Semua ({vehicles.length})
          </button>
          {vehicleTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 ${
                typeFilter === type
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60"
                  : "text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800"
              }`}
            >
              {VEHICLE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-400 text-xs">
          Tidak ditemukan kendaraan yang cocok dengan filter pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header: Plate & Type */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-base tracking-tight">
                      {v.brand} {v.model}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {VEHICLE_TYPE_LABELS[v.type]}
                    </span>
                  </div>
                  {v.plateNumber ? (
                    <span className="plate-embossed">{v.plateNumber}</span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                      TANPA PLAT
                    </span>
                  )}
                </div>

                {/* Technical specs badges */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800/70 font-mono mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">KILOMETER</span>
                    <span className="text-slate-200 font-medium tabular-nums">
                      {v.currentKm !== undefined
                        ? `${v.currentKm.toLocaleString("id-ID")} KM`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">BAHAN BAKAR</span>
                    <span className="text-slate-200 font-medium">
                      {FUEL_TYPE_LABELS[v.fuelType]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">CC MESIN</span>
                    <span className="text-slate-300">
                      {v.engineCc ? `${v.engineCc} cc` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">TANGKI BBM</span>
                    <span className="text-slate-300">
                      {v.fuelLiters ? `${v.fuelLiters} L` : "-"}
                    </span>
                  </div>
                </div>

                {/* Operational tags */}
                <div className="flex flex-wrap gap-1.5 mb-4 text-[11px] font-mono">
                  {v.loadCondition && (
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      Beban: {LOAD_CONDITION_LABELS[v.loadCondition]}
                    </span>
                  )}
                  {v.terrain && (
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      Medan: {TERRAIN_LABELS[v.terrain]}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/operation?vehicleId=${v.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition-colors"
                >
                  <OperationIcon className="w-3.5 h-3.5" />
                  <span>Operasi</span>
                </Link>

                <Link
                  href={`/maintenance?vehicleId=${v.id}`}
                  title="Jadwal Servis"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  <MaintenanceIcon className="w-3.5 h-3.5 text-amber-400" />
                </Link>

                <Link
                  href={`/fuel?vehicleId=${v.id}`}
                  title="Catat BBM"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  <FuelIcon className="w-3.5 h-3.5 text-blue-400" />
                </Link>

                <button
                  onClick={() => onEdit?.(v)}
                  title="Edit Data Kendaraan"
                  className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Hapus ${v.brand} ${v.model} (${v.plateNumber || "Tanpa plat"})?`)) {
                      onDelete?.(v.id);
                    }
                  }}
                  title="Hapus Kendaraan"
                  className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-rose-900/40 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
