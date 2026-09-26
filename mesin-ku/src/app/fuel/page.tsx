"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Vehicle,
  FuelRecord,
  FuelType,
  FUEL_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/types";
import { vehicleStore, fuelStore } from "@/data/store";

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [fuelDate, setFuelDate] = useState("");
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("bensin");
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState("");
  const [fuelKm, setFuelKm] = useState("");
  const [fuelNotes, setFuelNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    setVehicles(vehicleStore.getAll());
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setRecords([]);
      return;
    }
    loadRecords();
  }, [selectedVehicleId]);

  function loadRecords() {
    setRecords(
      fuelStore
        .getByVehicleId(selectedVehicleId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  }

  function handleAdd() {
    if (!selectedVehicleId || !fuelDate || !fuelLiters) return;
    const liters = Number(fuelLiters);
    const pricePerLiter = fuelPricePerLiter ? Number(fuelPricePerLiter) : undefined;
    const record: FuelRecord = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      date: fuelDate,
      liters,
      fuelType,
      pricePerLiter,
      totalPrice: pricePerLiter ? liters * pricePerLiter : undefined,
      kilometer: fuelKm ? Number(fuelKm) : undefined,
      notes: fuelNotes || undefined,
      createdAt: new Date().toISOString(),
    };
    fuelStore.add(record);
    resetForm();
    loadRecords();
  }

  function handleDelete(id: string) {
    fuelStore.remove(id);
    loadRecords();
  }

  function resetForm() {
    setFuelDate("");
    setFuelLiters("");
    setFuelType("bensin");
    setFuelPricePerLiter("");
    setFuelKm("");
    setFuelNotes("");
    setShowForm(false);
  }

  const totalLiters = records.reduce((sum, r) => sum + r.liters, 0);
  const totalCost = records.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

  if (!mounted) {
    return <div className="animate-pulse text-gray-400 p-8">Memuat...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Bahan Bakar (BBM)</h1>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kendaraan</label>
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

      {selectedVehicleId && (
        <>
          {records.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700 opacity-80">Total Liter</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{totalLiters.toFixed(1)} L</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 opacity-80">Total Biaya</p>
                <p className="text-3xl font-bold text-green-700 mt-1">Rp {totalCost.toLocaleString("id-ID")}</p>
              </div>
            </div>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Riwayat Pengisian</h2>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + Catat Pengisian
                </button>
              )}
            </div>

            {showForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Pengisian BBM Baru</h3>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-sm">
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                    <input
                      type="date"
                      value={fuelDate}
                      onChange={(e) => setFuelDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis BBM</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as FuelType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Liter *</label>
                    <input
                      type="number"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Liter (Rp)</label>
                    <input
                      type="number"
                      value={fuelPricePerLiter}
                      onChange={(e) => setFuelPricePerLiter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kilometer Saat Ini</label>
                    <input
                      type="number"
                      value={fuelKm}
                      onChange={(e) => setFuelKm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                    <input
                      type="text"
                      value={fuelNotes}
                      onChange={(e) => setFuelNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Opsional"
                    />
                  </div>
                </div>
                {fuelLiters && fuelPricePerLiter && (
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-semibold">Rp {(Number(fuelLiters) * Number(fuelPricePerLiter)).toLocaleString("id-ID")}</span>
                  </p>
                )}
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            )}

            {records.length > 0 ? (
              <div className="space-y-2">
                {records.map((r) => (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{r.liters} L</span>
                        <span className="text-xs text-gray-400">{FUEL_TYPE_LABELS[r.fuelType]}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.date).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        {r.pricePerLiter !== undefined && (
                          <span>Rp {r.pricePerLiter.toLocaleString("id-ID")}/L</span>
                        )}
                        {r.totalPrice !== undefined && (
                          <span>Total: Rp {r.totalPrice.toLocaleString("id-ID")}</span>
                        )}
                        {r.kilometer !== undefined && <span>{r.kilometer} km</span>}
                        {r.notes && <span>{r.notes}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada catatan pengisian BBM</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
