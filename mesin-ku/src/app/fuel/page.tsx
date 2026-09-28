"use client";

import { useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Vehicle,
  FuelRecord,
  FuelType,
  FUEL_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/types";
import { vehicleStore, fuelStore } from "@/data/store";
import { validateFuelRecord, ValidationError } from "@/lib/validation";
import { useIsMounted } from "@/lib/hooks";
import {
  Fuel,
  Plus,
  Trash2,
  Calendar,
  Gauge,
  Wallet,
  TrendingUp,
  Droplet,
  Car,
  FileText,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

export default function FuelPage() {
  const mounted = useIsMounted();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [fuelDate, setFuelDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("diesel");
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState("");
  const [fuelKm, setFuelKm] = useState("");
  const [fuelNotes, setFuelNotes] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (!mounted) return;
    const all = vehicleStore.getAll();
    setVehicles(all);
    if (all.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(all[0].id);
    }
  }, [mounted, selectedVehicleId]);

  useEffect(() => {
    if (!selectedVehicleId) {
      setRecords([]);
      return;
    }
    loadRecords();
    const veh = vehicleStore.getById(selectedVehicleId);
    if (veh) {
      setFuelType(veh.fuelType);
    }
  }, [selectedVehicleId]);

  function loadRecords() {
    setRecords(
      fuelStore
        .getByVehicleId(selectedVehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId) return;

    const liters = Number(fuelLiters);
    const pricePerLiter = fuelPricePerLiter ? Number(fuelPricePerLiter) : undefined;
    const km = fuelKm ? Number(fuelKm) : undefined;

    const newRecord: Partial<FuelRecord> = {
      vehicleId: selectedVehicleId,
      date: fuelDate,
      liters,
      fuelType,
      pricePerLiter,
      kilometer: km,
      notes: fuelNotes.trim() || undefined,
    };

    const validationErrors = validateFuelRecord(newRecord);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);

    const record: FuelRecord = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      date: fuelDate,
      liters,
      fuelType,
      pricePerLiter,
      totalPrice: pricePerLiter ? liters * pricePerLiter : undefined,
      kilometer: km,
      notes: fuelNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    fuelStore.add(record);

    // Update vehicle currentKm if reported km is higher
    const veh = vehicleStore.getById(selectedVehicleId);
    if (veh && km !== undefined) {
      if (veh.currentKm === undefined || km > veh.currentKm) {
        vehicleStore.update({ ...veh, currentKm: km });
      }
    }

    resetForm();
    loadRecords();
  }

  function handleDelete(id: string) {
    fuelStore.remove(id);
    loadRecords();
  }

  function resetForm() {
    setFuelDate(new Date().toISOString().split("T")[0]);
    setFuelLiters("");
    setFuelPricePerLiter("");
    setFuelKm("");
    setFuelNotes("");
    setErrors([]);
    setShowForm(false);
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const totalLiters = useMemo(() => records.reduce((sum, r) => sum + r.liters, 0), [records]);
  const totalCost = useMemo(() => records.reduce((sum, r) => sum + (r.totalPrice || 0), 0), [records]);
  const avgPrice = totalLiters > 0 && totalCost > 0 ? Math.round(totalCost / totalLiters) : 0;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider text-slate-400">Sinkronisasi Log BBM...</span>
        </div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 bg-slate-950/80 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
      errors.some((e) => e.field === field)
        ? "border-rose-500/80 bg-rose-950/20 focus:border-rose-500"
        : "border-slate-800/80 hover:border-slate-700 focus:border-cyan-500"
    }`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Fuel className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Manajemen Bahan Bakar
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              TELEMETRY LOG
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Pencatatan pengisian BBM armada, volume konsumsi, efisiensi biaya energi, dan pemutakhiran odometer.
          </p>
        </div>

        {selectedVehicle && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengisian BBM</span>
          </button>
        )}
      </div>

      {/* Vehicle Selection Card */}
      <div className="glass-panel p-4.5 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" />
            Pilih Unit Armada
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
              {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""} — {VEHICLE_TYPE_LABELS[v.type]} (Tipe BBM: {FUEL_TYPE_LABELS[v.fuelType]})
            </option>
          ))}
        </select>
      </div>

      {selectedVehicle && (
        <>
          {/* KPI Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border-t-2 border-t-cyan-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Volume BBM</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Droplet className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
                {totalLiters.toFixed(1)} <span className="text-sm font-normal text-slate-400">Liter</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span>{records.length} transaksi pengisian</span>
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border-t-2 border-t-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Biaya BBM</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                Rp {totalCost.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Akumulasi belanja bahan bakar
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl relative overflow-hidden border-t-2 border-t-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Rata-rata Harga / Liter</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200 mt-2">
                Rp {avgPrice.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Estimasi rata-rata per liter
              </p>
            </div>
          </div>

          {/* New Fuel Record Modal / Form */}
          {showForm && (
            <div className="glass-panel p-5 md:p-6 rounded-2xl border border-cyan-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-soft-pulse" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    Catat Pengisian Bahan Bakar Baru
                  </h3>
                </div>
                <button
                  onClick={resetForm}
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Mohon periksa data input:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {errors.map((err, idx) => (
                        <li key={idx}>{err.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Tanggal Pengisian *
                    </label>
                    <input
                      type="date"
                      value={fuelDate}
                      onChange={(e) => setFuelDate(e.target.value)}
                      required
                      className={inputClass("date")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" />
                      Jenis Bahan Bakar *
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as FuelType)}
                      className={inputClass("fuelType")}
                    >
                      {Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-slate-400" />
                      Volume Liter *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      placeholder="Contoh: 45.5"
                      required
                      className={inputClass("liters")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      Harga per Liter (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={fuelPricePerLiter}
                      onChange={(e) => setFuelPricePerLiter(e.target.value)}
                      placeholder="Contoh: 15200"
                      className={inputClass("pricePerLiter")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      Kilometer Odometer (KM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={fuelKm}
                      onChange={(e) => setFuelKm(e.target.value)}
                      placeholder="Contoh: 48200"
                      className={inputClass("kilometer")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Catatan / Lokasi SPBU
                    </label>
                    <input
                      type="text"
                      value={fuelNotes}
                      onChange={(e) => setFuelNotes(e.target.value)}
                      placeholder="Contoh: SPBU Pertamina KM 57"
                      className={inputClass("notes")}
                    />
                  </div>
                </div>

                {fuelLiters && fuelPricePerLiter && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs font-mono text-cyan-300">
                    <span className="text-slate-400">Total Estimasi Biaya:</span>
                    <span className="font-bold text-sm text-cyan-200">
                      Rp {(Number(fuelLiters) * Number(fuelPricePerLiter)).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md shadow-cyan-950/40"
                  >
                    Simpan Transaksi BBM
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Records History List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Fuel className="w-3.5 h-3.5 text-cyan-400" />
                Riwayat Pengisian Bahan Bakar ({records.length})
              </h3>
            </div>

            {records.length > 0 ? (
              <div className="space-y-3">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="glass-card rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700/80"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold font-mono text-cyan-400 text-base">
                          {r.liters} Liter
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80 text-[10px] font-mono uppercase">
                          {FUEL_TYPE_LABELS[r.fuelType]}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(r.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs">
                        {r.pricePerLiter !== undefined && (
                          <span className="font-mono">
                            Rp {r.pricePerLiter.toLocaleString("id-ID")} / Liter
                          </span>
                        )}
                        {r.totalPrice !== undefined && (
                          <span className="text-emerald-400 font-mono font-semibold">
                            Total: Rp {r.totalPrice.toLocaleString("id-ID")}
                          </span>
                        )}
                        {r.kilometer !== undefined && (
                          <span className="flex items-center gap-1 font-mono text-slate-300">
                            <Gauge className="w-3 h-3 text-cyan-400" />
                            {r.kilometer.toLocaleString("id-ID")} KM
                          </span>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-slate-300 text-xs bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60">
                          {r.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="self-end sm:self-center text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-950/30 transition-colors"
                      title="Hapus riwayat BBM"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-10 rounded-2xl text-center">
                <Fuel className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Belum ada data transaksi pengisian BBM untuk kendaraan ini.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

