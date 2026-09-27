"use client";

import { useEffect, useState, useMemo } from "react";
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
import { useIsMounted } from "@/lib/hooks";
import { MaintenanceIcon, PlusIcon, TrashIcon, AlertTriangleIcon, CheckCircleIcon } from "@/components/ui/Icons";

export default function MaintenancePage() {
  const mounted = useIsMounted();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [statuses, setStatuses] = useState<MaintenanceStatus[]>([]);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  // Form states for new record
  const [recordType, setRecordType] = useState<MaintenanceType>("oil_change");
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [recordKm, setRecordKm] = useState("");
  const [recordCost, setRecordCost] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [recordNextDueDate, setRecordNextDueDate] = useState("");
  const [recordNextDueKm, setRecordNextDueKm] = useState("");

  // Form states for new rule
  const [ruleType, setRuleType] = useState<MaintenanceType>("oil_change");
  const [ruleIntervalKm, setRuleIntervalKm] = useState("5000");
  const [ruleIntervalDays, setRuleIntervalDays] = useState("90");
  const [ruleDescription, setRuleDescription] = useState("");

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

  function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId || !recordDate) return;

    const record: MaintenanceRecord = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      type: recordType,
      date: recordDate,
      kilometer: recordKm ? Number(recordKm) : undefined,
      cost: recordCost ? Number(recordCost) : undefined,
      notes: recordNotes.trim() || undefined,
      nextDueDate: recordNextDueDate || undefined,
      nextDueKm: recordNextDueKm ? Number(recordNextDueKm) : undefined,
      createdAt: new Date().toISOString(),
    };

    maintenanceStore.add(record);

    // If oil change or service, update vehicle odometer / last oil change if higher
    const currentVeh = vehicleStore.getById(selectedVehicleId);
    if (currentVeh && recordKm) {
      const parsedKm = Number(recordKm);
      const updateData: Partial<Vehicle> = {};
      if (recordType === "oil_change") {
        updateData.lastOilChangeDate = recordDate;
        updateData.lastOilChangeKm = parsedKm;
      }
      if (currentVeh.currentKm === undefined || parsedKm > currentVeh.currentKm) {
        updateData.currentKm = parsedKm;
      }
      if (Object.keys(updateData).length > 0) {
        vehicleStore.update({ ...currentVeh, ...updateData });
      }
    }

    resetRecordForm();
    loadData();
  }

  function handleDeleteRecord(id: string) {
    maintenanceStore.remove(id);
    loadData();
  }

  function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId) return;
    if (!ruleIntervalKm && !ruleIntervalDays) return;

    const rule: MaintenanceRule = {
      id: uuidv4(),
      vehicleId: selectedVehicleId,
      type: ruleType,
      intervalKm: ruleIntervalKm ? Number(ruleIntervalKm) : undefined,
      intervalDays: ruleIntervalDays ? Number(ruleIntervalDays) : undefined,
      description: ruleDescription.trim() || undefined,
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
    setRecordDate(new Date().toISOString().split("T")[0]);
    setRecordKm("");
    setRecordCost("");
    setRecordNotes("");
    setRecordNextDueDate("");
    setRecordNextDueKm("");
    setShowRecordForm(false);
  }

  function resetRuleForm() {
    setRuleType("oil_change");
    setRuleIntervalKm("5000");
    setRuleIntervalDays("90");
    setRuleDescription("");
    setShowRuleForm(false);
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Sinkronisasi Basis Data Perawatan...</span>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-500 font-mono";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              PERAWATAN & REMINDER SERVIS
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800/60">
              PREVENTIF
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan riwayat ganti oli, servis berkala, dan evaluasi aturan interval jarak tempuh (KM) atau waktu (hari).
          </p>
        </div>

        {selectedVehicle && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRecordForm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all font-mono"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>CATAT SERVIS BARU</span>
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Selector */}
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
              {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""} — {VEHICLE_TYPE_LABELS[v.type]} (Odo: {v.currentKm ?? 0} KM)
            </option>
          ))}
        </select>
      </div>

      {/* Principle Disclaimer Notice */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
        <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300 font-mono">Prinsip Sistem (No Hallucination): </span>
          Semua pengingat perawatan dievaluasi secara eksplisit berdasarkan parameter dan aturan yang Anda konfigurasikan. Sistem tidak mengarang spesifikasi interval pabrikan tanpa input terverifikasi.
        </div>
      </div>

      {selectedVehicle && (
        <>
          {/* Status Indicators Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              STATUS JADWAL PERAWATAN ({statuses.length} ATURAN DIEVALUASI)
            </h2>

            {statuses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {statuses.map((s) => (
                  <div
                    key={s.ruleId}
                    className={`rounded-xl p-4 border flex items-start justify-between gap-3 ${
                      s.isDue
                        ? "bg-rose-950/40 border-rose-600/50 text-rose-200"
                        : "bg-slate-900/90 border-slate-800 text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            s.isDue ? "bg-rose-500 animate-ping" : "bg-emerald-400"
                          }`}
                        />
                        <h4 className="font-mono font-semibold text-sm text-white">
                          {s.description}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{s.detail}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase shrink-0 ${
                        s.isDue
                          ? "bg-rose-900/80 text-rose-300 border border-rose-700"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                      }`}
                    >
                      {s.isDue ? "JATUH TEMPO" : "OK NORMAL"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 text-center text-xs font-mono text-slate-400">
                Belum ada aturan perawatan yang dikonfigurasikan untuk kendaraan ini. Tambahkan aturan interval KM atau Hari di bawah.
              </div>
            )}
          </section>

          {/* Form Modal: Catat Maintenance Baru */}
          {showRecordForm && (
            <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-5 md:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                  CATAT RIWAYAT SERVIS / PERAWATAN BARU
                </h3>
                <button
                  onClick={resetRecordForm}
                  className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  TUTUP
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      JENIS PERAWATAN *
                    </label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value as MaintenanceType)}
                      className={inputClass}
                    >
                      {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      TANGGAL SERVIS *
                    </label>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      KILOMETER SAAT SERVIS (KM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={recordKm}
                      onChange={(e) => setRecordKm(e.target.value)}
                      placeholder="Contoh: 45000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      BIAYA SERVIS / PARTS (RP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={recordCost}
                      onChange={(e) => setRecordCost(e.target.value)}
                      placeholder="Contoh: 350000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      JADWAL BERIKUTNYA (TANGGAL)
                    </label>
                    <input
                      type="date"
                      value={recordNextDueDate}
                      onChange={(e) => setRecordNextDueDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      JADWAL BERIKUTNYA (TARGET KM)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={recordNextDueKm}
                      onChange={(e) => setRecordNextDueKm(e.target.value)}
                      placeholder="Contoh: 50000"
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      CATATAN / DETAIL PERBAIKAN
                    </label>
                    <input
                      type="text"
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      placeholder="Contoh: Penggantian oli mesin Shell Rimula R4X & filter oli"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={resetRecordForm}
                    className="px-4 py-2 rounded-lg text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-500"
                  >
                    SIMPAN RIWAYAT SERVIS
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules Configuration Section */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                  ATURAN INTERVAL PENGINGAT (RULES ENGINE)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Tetapkan batasan KM atau Hari sesuai pedoman mekanik / buku manual Anda.
                </p>
              </div>

              {!showRuleForm && (
                <button
                  onClick={() => setShowRuleForm(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 transition-colors"
                >
                  + Tambah Aturan
                </button>
              )}
            </div>

            {showRuleForm && (
              <form onSubmit={handleAddRule} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">JENIS</label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value as MaintenanceType)}
                      className={inputClass}
                    >
                      {Object.entries(MAINTENANCE_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">INTERVAL KM</label>
                    <input
                      type="number"
                      min="0"
                      value={ruleIntervalKm}
                      onChange={(e) => setRuleIntervalKm(e.target.value)}
                      placeholder="Contoh: 5000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">INTERVAL HARI</label>
                    <input
                      type="number"
                      min="0"
                      value={ruleIntervalDays}
                      onChange={(e) => setRuleIntervalDays(e.target.value)}
                      placeholder="Contoh: 90"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">DESKRIPSI ATURAN</label>
                    <input
                      type="text"
                      value={ruleDescription}
                      onChange={(e) => setRuleDescription(e.target.value)}
                      placeholder="Contoh: Ganti Oli Rutin"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetRuleForm}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-blue-600 hover:bg-blue-500"
                  >
                    Simpan Aturan
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-semibold text-white">
                      {r.description || MAINTENANCE_TYPE_LABELS[r.type]}
                    </span>
                    <span className="text-slate-500 ml-2">
                      ({r.intervalKm ? `${r.intervalKm.toLocaleString("id-ID")} KM` : ""}
                      {r.intervalKm && r.intervalDays ? " / " : ""}
                      {r.intervalDays ? `${r.intervalDays} Hari` : ""})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Hapus aturan"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Maintenance Records History */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                LOG HISTORI PERAWATAN ({records.length} TERCATAT)
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                Total Biaya: Rp {totalCost.toLocaleString("id-ID")}
              </span>
            </div>

            {records.length > 0 ? (
              <div className="space-y-2.5">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold text-[11px]">
                          {MAINTENANCE_TYPE_LABELS[r.type]}
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
                        {r.kilometer !== undefined && (
                          <span>Odo: {r.kilometer.toLocaleString("id-ID")} KM</span>
                        )}
                        {r.cost !== undefined && (
                          <span className="text-slate-200">
                            Biaya: Rp {r.cost.toLocaleString("id-ID")}
                          </span>
                        )}
                        {r.nextDueDate && (
                          <span className="text-amber-400/90">
                            Jadwal Ulang: {r.nextDueDate}
                          </span>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-slate-300 mt-1 text-[11px]">
                          Catatan: {r.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteRecord(r.id)}
                      className="self-end sm:self-center text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                      title="Hapus catatan"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-xs font-mono text-slate-400">
                Belum ada log catatan servis untuk kendaraan ini.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
