"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Vehicle,
  MaintenanceRecord,
  MaintenanceRule,
  MaintenanceType,
  MAINTENANCE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/types";
import { vehicleStore, maintenanceStore, rulesStore } from "@/data/store";
import { evaluateMaintenanceRules, MaintenanceStatus } from "@/lib/rules";

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [statuses, setStatuses] = useState<MaintenanceStatus[]>([]);
  const [mounted, setMounted] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  const [recordType, setRecordType] = useState<MaintenanceType>("oil_change");
  const [recordDate, setRecordDate] = useState("");
  const [recordKm, setRecordKm] = useState("");
  const [recordCost, setRecordCost] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [recordNextDueDate, setRecordNextDueDate] = useState("");
  const [recordNextDueKm, setRecordNextDueKm] = useState("");

  const [ruleType, setRuleType] = useState<MaintenanceType>("oil_change");
  const [ruleIntervalKm, setRuleIntervalKm] = useState("");
  const [ruleIntervalDays, setRuleIntervalDays] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");

  useEffect(() => {
    setMounted(true);
    setVehicles(vehicleStore.getAll());
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setRecords([]);
      setRules([]);
      setStatuses([]);
      return;
    }
    loadData();
  }, [selectedVehicleId]);

  function loadData() {
    const recs = maintenanceStore
      .getByVehicleId(selectedVehicleId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const rls = rulesStore.getByVehicleId(selectedVehicleId);
    setRecords(recs);
    setRules(rls);

    const vehicle = vehicleStore.getById(selectedVehicleId);
    if (vehicle) {
      setStatuses(evaluateMaintenanceRules(vehicle, recs, rls));
    }
  }

  function handleAddRecord() {
    if (!selectedVehicleId || !recordDate) return;
    const record: MaintenanceRecord = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      type: recordType,
      date: recordDate,
      kilometer: recordKm ? Number(recordKm) : undefined,
      cost: recordCost ? Number(recordCost) : undefined,
      notes: recordNotes || undefined,
      nextDueDate: recordNextDueDate || undefined,
      nextDueKm: recordNextDueKm ? Number(recordNextDueKm) : undefined,
      createdAt: new Date().toISOString(),
    };
    maintenanceStore.add(record);
    resetRecordForm();
    loadData();
  }

  function handleDeleteRecord(id: string) {
    maintenanceStore.remove(id);
    loadData();
  }

  function handleAddRule() {
    if (!selectedVehicleId) return;
    if (!ruleIntervalKm && !ruleIntervalDays) return;
    const rule: MaintenanceRule = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      type: ruleType,
      intervalKm: ruleIntervalKm ? Number(ruleIntervalKm) : undefined,
      intervalDays: ruleIntervalDays ? Number(ruleIntervalDays) : undefined,
      description: ruleDescription || undefined,
    };
    rulesStore.add(rule);
    resetRuleForm();
    loadData();
  }

  function handleDeleteRule(id: string) {
    rulesStore.remove(id);
    loadData();
  }

  function resetRecordForm() {
    setRecordType("oil_change");
    setRecordDate("");
    setRecordKm("");
    setRecordCost("");
    setRecordNotes("");
    setRecordNextDueDate("");
    setRecordNextDueKm("");
    setShowRecordForm(false);
  }

  function resetRuleForm() {
    setRuleType("oil_change");
    setRuleIntervalKm("");
    setRuleIntervalDays("");
    setRuleDescription("");
    setShowRuleForm(false);
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  if (!mounted) {
    return <div className="animate-pulse text-gray-400 p-8">Memuat...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>

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
          {statuses.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Status Maintenance</h2>
              <div className="space-y-2">
                {statuses.map((s) => (
                  <div
                    key={s.ruleId}
                    className={`border rounded-lg px-4 py-3 flex items-center justify-between ${
                      s.isDue
                        ? "bg-red-50 border-red-300 text-red-900"
                        : "bg-green-50 border-green-300 text-green-900"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{s.description}</p>
                      <p className="text-sm opacity-80">{s.detail}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        s.isDue ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                      }`}
                    >
                      {s.isDue ? "Sudah Jatuh Tempo" : "OK"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Aturan Maintenance</h2>
              {!showRuleForm && (
                <button
                  onClick={() => setShowRuleForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + Tambah Aturan
                </button>
              )}
            </div>

            {showRuleForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Aturan Baru</h3>
                  <button onClick={resetRuleForm} className="text-gray-400 hover:text-gray-600 text-sm">
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as MaintenanceType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <input
                      type="text"
                      value={ruleDescription}
                      onChange={(e) => setRuleDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Contoh: Ganti oli setiap 5000 km"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interval KM</label>
                    <input
                      type="number"
                      value={ruleIntervalKm}
                      onChange={(e) => setRuleIntervalKm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Contoh: 5000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interval Hari</label>
                    <input
                      type="number"
                      value={ruleIntervalDays}
                      onChange={(e) => setRuleIntervalDays(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Contoh: 90"
                      min="0"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddRule}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Simpan Aturan
                </button>
              </div>
            )}

            {rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map((r) => (
                  <div key={r.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{r.description || MAINTENANCE_TYPE_LABELS[r.type]}</p>
                      <p className="text-sm text-gray-500">
                        {r.intervalKm ? `Setiap ${r.intervalKm} km` : ""}
                        {r.intervalKm && r.intervalDays ? " / " : ""}
                        {r.intervalDays ? `Setiap ${r.intervalDays} hari` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteRule(r.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada aturan maintenance</p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Riwayat Maintenance</h2>
              {!showRecordForm && (
                <button
                  onClick={() => setShowRecordForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  + Catat Maintenance
                </button>
              )}
            </div>

            {showRecordForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Catat Maintenance Baru</h3>
                  <button onClick={resetRecordForm} className="text-gray-400 hover:text-gray-600 text-sm">
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis *</label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value as MaintenanceType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal *</label>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kilometer</label>
                    <input
                      type="number"
                      value={recordKm}
                      onChange={(e) => setRecordKm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya (Rp)</label>
                    <input
                      type="number"
                      value={recordCost}
                      onChange={(e) => setRecordCost(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jadwal Berikutnya (Tanggal)</label>
                    <input
                      type="date"
                      value={recordNextDueDate}
                      onChange={(e) => setRecordNextDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jadwal Berikutnya (KM)</label>
                    <input
                      type="number"
                      value={recordNextDueKm}
                      onChange={(e) => setRecordNextDueKm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                    <input
                      type="text"
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Catatan tambahan (opsional)"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddRecord}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
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
                        <span className="font-medium text-gray-900">{MAINTENANCE_TYPE_LABELS[r.type]}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.date).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        {r.kilometer !== undefined && <span>{r.kilometer} km</span>}
                        {r.cost !== undefined && <span>Rp {r.cost.toLocaleString("id-ID")}</span>}
                        {r.notes && <span>{r.notes}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRecord(r.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada catatan maintenance</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
