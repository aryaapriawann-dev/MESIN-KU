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
import { FuelIcon, PlusIcon, TrashIcon } from "@/components/ui/Icons";

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
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Sinkronisasi Log BBM...</span>
        </div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono ${
      errors.some((e) => e.field === field)
        ? "border-rose-500 focus:border-rose-500"
        : "border-slate-800 focus:border-cyan-500"
    }`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              MANAJEMEN KONSUMSI BBM
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              LOG BAHAN BAKAR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan pengisian bahan bakar armada, volume liter, biaya operasional, dan tracking odometer.
          </p>
        </div>

        {selectedVehicle && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all font-mono"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>CATAT PENGISIAN BBM</span>
          </button>
        )}
      </div>

      {/* Vehicle Selection Dropdown */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <label className="block text-xs font-mono font-medium text-slate-300 mb-2">
          PILIH KENDARAAN ARMADA
        </label>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
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
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                TOTAL VOLUME BBM
              </span>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                {totalLiters.toFixed(1)} Liter
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                {records.length} transaksi pengisian
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                TOTAL BIAYA BBM
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                Rp {totalCost.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Pengeluaran energi operasional
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                RATA-RATA HARGA / LITER
              </span>
              <div className="text-2xl font-mono font-bold text-slate-200 mt-1">
                Rp {avgPrice.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                Estimasi rata-rata per liter
              </p>
            </div>
          </div>

          {/* Form Modal: Catat Pengisian Baru */}
          {showForm && (
            <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-5 md:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                  CATAT PENGISIAN BAHAN BAKAR BARU
                </h3>
                <button
                  onClick={resetForm}
                  className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  TUTUP
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      TANGGAL PENGISIAN *
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
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      JENIS BAHAN BAKAR *
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
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      JUMLAH LITER *
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
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      HARGA PER LITER (RP)
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
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      KILOMETER SAAT PENGISIAN (KM)
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
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      CATATAN / SPBU
                    </label>
                    <input
                      type="text"
                      value={fuelNotes}
                      onChange={(e) => setFuelNotes(e.target.value)}
                      placeholder="Contoh: SPBU KM 57 Tol Trans Jawa"
                      className={inputClass("notes")}
                    />
                  </div>
                </div>

                {fuelLiters && fuelPricePerLiter && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300">
                    Total Kalkulasi: <span className="font-bold text-white">Rp {(Number(fuelLiters) * Number(fuelPricePerLiter)).toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-500"
                  >
                    SIMPAN LOG BBM
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* History List */}
          <section className="space-y-3">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              RIWAYAT PENGISIAN BAHAN BAKAR ({records.length})
            </h3>

            {records.length > 0 ? (
              <div className="space-y-2.5">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-cyan-400 text-sm">
                          {r.liters} Liter
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                          {FUEL_TYPE_LABELS[r.fuelType]}
                        </span>
                        <span className="text-slate-400">
                          {new Date(r.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                        {r.pricePerLiter !== undefined && (
                          <span>Rp {r.pricePerLiter.toLocaleString("id-ID")}/L</span>
                        )}
                        {r.totalPrice !== undefined && (
                          <span className="text-emerald-400 font-semibold">
                            Total: Rp {r.totalPrice.toLocaleString("id-ID")}
                          </span>
                        )}
                        {r.kilometer !== undefined && (
                          <span>Odometer: {r.kilometer.toLocaleString("id-ID")} KM</span>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-slate-400 mt-1 text-[11px]">
                          Catatan: {r.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(r.id)}
                      className="self-end sm:self-center text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                      title="Hapus riwayat BBM"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-xs font-mono text-slate-400">
                Belum ada data pengisian BBM untuk kendaraan ini.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
