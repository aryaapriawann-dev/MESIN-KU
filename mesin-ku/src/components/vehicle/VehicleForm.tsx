"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Vehicle,
  VehicleType,
  FuelType,
  LoadCondition,
  Terrain,
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  LOAD_CONDITION_LABELS,
  TERRAIN_LABELS,
} from "@/types";
import { validateVehicle, ValidationError } from "@/lib/validation";
import { vehicleStore } from "@/data/store";
import { CheckCircleIcon } from "@/components/ui/Icons";

interface Props {
  vehicle?: Vehicle;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function VehicleForm({ vehicle, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Vehicle>>(
    vehicle || {
      brand: "",
      model: "",
      type: "mobil" as VehicleType,
      fuelType: "bensin" as FuelType,
      plateNumber: "",
      engineNumber: "",
      chassisNumber: "",
      engineCc: undefined,
      fuelLiters: undefined,
      currentKm: undefined,
      loadCondition: "normal" as LoadCondition,
      terrain: "urban" as Terrain,
      lastOilChangeDate: "",
      lastOilChangeKm: undefined,
    }
  );
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [saved, setSaved] = useState(false);

  function handleChange(field: string, value: string | number | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => prev.filter((e) => e.field !== field));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateVehicle(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const now = new Date().toISOString();
    if (vehicle) {
      vehicleStore.update({ ...vehicle, ...form, updatedAt: now } as Vehicle);
    } else {
      const newVehicle: Vehicle = {
        ...(form as Vehicle),
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      vehicleStore.add(newVehicle);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSave?.();
    }, 600);
  }

  function getError(field: string): string | undefined {
    return errors.find((e) => e.field === field)?.message;
  }

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors ${
      getError(field)
        ? "border-rose-500 focus:border-rose-500"
        : "border-slate-800 focus:border-cyan-500 hover:border-slate-700"
    }`;

  const selectClass = (field: string) =>
    `w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors ${
      getError(field)
        ? "border-rose-500 focus:border-rose-500"
        : "border-slate-800 focus:border-cyan-500 hover:border-slate-700"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
          <span>Data armada berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* Section 1: Identitas Pokok */}
      <div>
        <h3 className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase mb-3">
          1. Identitas & Legalitas Kendaraan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              MEREK / BRAND *
            </label>
            <input
              type="text"
              value={form.brand || ""}
              onChange={(e) => handleChange("brand", e.target.value)}
              className={inputClass("brand")}
              placeholder="Contoh: Toyota, Mitsubishi, Isuzu"
            />
            {getError("brand") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">{getError("brand")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              MODEL / VARIAN *
            </label>
            <input
              type="text"
              value={form.model || ""}
              onChange={(e) => handleChange("model", e.target.value)}
              className={inputClass("model")}
              placeholder="Contoh: Hilux 2.4 D-Cab, Canter 71"
            />
            {getError("model") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">{getError("model")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              NOMOR POLISI (PLAT)
            </label>
            <input
              type="text"
              value={form.plateNumber || ""}
              onChange={(e) => handleChange("plateNumber", e.target.value.toUpperCase())}
              className={`${inputClass("plateNumber")} uppercase font-mono tracking-wider`}
              placeholder="B 1234 ABC"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              JENIS KENDARAAN *
            </label>
            <select
              value={form.type || ""}
              onChange={(e) => handleChange("type", e.target.value)}
              className={selectClass("type")}
            >
              {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-slate-950 text-white">
                  {label}
                </option>
              ))}
            </select>
            {getError("type") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">{getError("type")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              NOMOR MESIN
            </label>
            <input
              type="text"
              value={form.engineNumber || ""}
              onChange={(e) => handleChange("engineNumber", e.target.value.toUpperCase())}
              className={`${inputClass("engineNumber")} uppercase font-mono`}
              placeholder="Contoh: 2GD-FTV-849201"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              NOMOR RANGKA (VIN)
            </label>
            <input
              type="text"
              value={form.chassisNumber || ""}
              onChange={(e) => handleChange("chassisNumber", e.target.value.toUpperCase())}
              className={`${inputClass("chassisNumber")} uppercase font-mono`}
              placeholder="Contoh: MHF11BE40H001..."
            />
          </div>
        </div>
      </div>

      {/* Section 2: Spesifikasi Mesin & Bahan Bakar */}
      <div className="pt-3 border-t border-slate-800">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase mb-3">
          2. Spesifikasi Teknis & Bahan Bakar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              JENIS BAHAN BAKAR *
            </label>
            <select
              value={form.fuelType || ""}
              onChange={(e) => handleChange("fuelType", e.target.value)}
              className={selectClass("fuelType")}
            >
              {Object.entries(FUEL_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-slate-950 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              KAPASITAS MESIN (CC)
            </label>
            <input
              type="number"
              value={form.engineCc ?? ""}
              onChange={(e) =>
                handleChange("engineCc", e.target.value ? Number(e.target.value) : undefined)
              }
              className={inputClass("engineCc")}
              placeholder="Contoh: 2400"
              min="0"
            />
            {getError("engineCc") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">{getError("engineCc")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              KAPASITAS TANGKI BBM (LITER)
            </label>
            <input
              type="number"
              value={form.fuelLiters ?? ""}
              onChange={(e) =>
                handleChange("fuelLiters", e.target.value ? Number(e.target.value) : undefined)
              }
              className={inputClass("fuelLiters")}
              placeholder="Contoh: 65"
              min="0"
              step="0.5"
            />
            {getError("fuelLiters") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">{getError("fuelLiters")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              KONDISI BEBAN KERJA
            </label>
            <select
              value={form.loadCondition || "normal"}
              onChange={(e) => handleChange("loadCondition", e.target.value)}
              className={selectClass("loadCondition")}
            >
              {Object.entries(LOAD_CONDITION_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-slate-950 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              MEDAN OPERASI UTAMA
            </label>
            <select
              value={form.terrain || "urban"}
              onChange={(e) => handleChange("terrain", e.target.value)}
              className={selectClass("terrain")}
            >
              {Object.entries(TERRAIN_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-slate-950 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              ODOMETER SAAT INI (KM)
            </label>
            <input
              type="number"
              value={form.currentKm ?? ""}
              onChange={(e) =>
                handleChange("currentKm", e.target.value ? Number(e.target.value) : undefined)
              }
              className={inputClass("currentKm")}
              placeholder="Contoh: 34250"
              min="0"
            />
            {getError("currentKm") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">{getError("currentKm")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Baseline Riwayat Servis Oli */}
      <div className="pt-3 border-t border-slate-800">
        <h3 className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase mb-3">
          3. Baseline Perawatan Terakhir
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              TANGGAL TERAKHIR GANTI OLI
            </label>
            <input
              type="date"
              value={form.lastOilChangeDate || ""}
              onChange={(e) => handleChange("lastOilChangeDate", e.target.value)}
              className={inputClass("lastOilChangeDate")}
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              KM SAAT TERAKHIR GANTI OLI
            </label>
            <input
              type="number"
              value={form.lastOilChangeKm ?? ""}
              onChange={(e) =>
                handleChange(
                  "lastOilChangeKm",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className={inputClass("lastOilChangeKm")}
              placeholder="Contoh: 30000"
              min="0"
            />
            {getError("lastOilChangeKm") && (
              <p className="text-rose-400 text-xs mt-1 font-mono">
                {getError("lastOilChangeKm")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-900/30 font-mono tracking-wide"
        >
          {vehicle ? "SIMPAN PERUBAHAN" : "TAMBAHKAN KE ARMADA"}
        </button>
      </div>
    </form>
  );
}
