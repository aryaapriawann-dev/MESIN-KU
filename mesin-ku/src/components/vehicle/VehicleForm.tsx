"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { CheckCircle2, Save, X } from "lucide-react";
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
    `w-full px-4 py-2.5 bg-[#070b12]/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors ${
      getError(field)
        ? "border-rose-500/80 focus:border-rose-500"
        : "border-white/[0.08] focus:border-cyan-500 hover:border-white/[0.15]"
    }`;

  const selectClass = (field: string) =>
    `w-full px-4 py-2.5 bg-[#070b12]/80 border rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors ${
      getError(field)
        ? "border-rose-500/80 focus:border-rose-500"
        : "border-white/[0.08] focus:border-cyan-500 hover:border-white/[0.15]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Data armada berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* Section 1: Identitas Pokok */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-3">
          1. Identitas & Legalitas Kendaraan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Merek / Brand <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.brand || ""}
              onChange={(e) => handleChange("brand", e.target.value)}
              className={inputClass("brand")}
              placeholder="Contoh: Toyota, Mitsubishi, Isuzu"
            />
            {getError("brand") && (
              <p className="text-rose-400 text-xs mt-1">{getError("brand")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Model / Tipe Varian <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.model || ""}
              onChange={(e) => handleChange("model", e.target.value)}
              className={inputClass("model")}
              placeholder="Contoh: Hilux 2.4 D-Cab, Canter 71"
            />
            {getError("model") && (
              <p className="text-rose-400 text-xs mt-1">{getError("model")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nomor Polisi (Plat)
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Jenis Kendaraan <span className="text-rose-400">*</span>
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
              <p className="text-rose-400 text-xs mt-1">{getError("type")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nomor Mesin
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nomor Rangka (VIN)
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
      <div className="pt-4 border-t border-white/[0.07]">
        <h3 className="text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-3">
          2. Spesifikasi Teknis & Bahan Bakar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Jenis Bahan Bakar <span className="text-rose-400">*</span>
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kapasitas Mesin (CC)
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
              <p className="text-rose-400 text-xs mt-1">{getError("engineCc")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kapasitas Tangki BBM (Liter)
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
              <p className="text-rose-400 text-xs mt-1">{getError("fuelLiters")}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Kondisi Beban Kerja
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Medan Operasi Utama
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Odometer Saat Ini (KM)
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
              <p className="text-rose-400 text-xs mt-1">{getError("currentKm")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Baseline Riwayat Servis Oli */}
      <div className="pt-4 border-t border-white/[0.07]">
        <h3 className="text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-3">
          3. Baseline Perawatan Terakhir
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tanggal Terakhir Ganti Oli
            </label>
            <input
              type="date"
              value={form.lastOilChangeDate || ""}
              onChange={(e) => handleChange("lastOilChangeDate", e.target.value)}
              className={inputClass("lastOilChangeDate")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              KM Saat Terakhir Ganti Oli
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
              <p className="text-rose-400 text-xs mt-1">
                {getError("lastOilChangeKm")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/[0.07]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-950/40"
        >
          <Save className="w-4 h-4" />
          <span>{vehicle ? "Simpan Perubahan" : "Tambahkan ke Armada"}</span>
        </button>
      </div>
    </form>
  );
}

