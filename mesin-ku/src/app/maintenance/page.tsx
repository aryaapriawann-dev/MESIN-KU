"use client";

import { useEffect, useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Wrench,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  ChevronDown,
  Info,
  DollarSign,
  Gauge,
} from "lucide-react";
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
          <span className="text-xs text-slate-400 font-medium">Sinkronisasi Basis Data Perawatan...</span>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 bg-[#070b12]/80 border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500 placeholder-slate-500 transition-colors";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Perawatan & Reminder Servis
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-soft-pulse" />
              Preventif
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Riwayat servis berkala, penggantian pelumas mesin, dan evaluasi aturan interval jarak tempuh (KM) atau hari.
          </p>
        </div>

        {selectedVehicle && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRecordForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Servis Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Vehicle Selector */}
      <div className="glass-panel rounded-2xl p-4 md:p-5">
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Pilih Unit Kendaraan Armada
        </label>
        <div className="relative">
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full px-4 py-3 bg-[#070b12]/80 border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">-- Pilih Kendaraan --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.plateNumber ? `[${v.plateNumber}]` : ""} — {VEHICLE_TYPE_LABELS[v.type]} (Odometer: {v.currentKm ? v.currentKm.toLocaleString("id-ID") : 0} KM)
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Principle Disclaimer Notice */}
      <div className="bg-[#070b12]/60 border border-white/[0.06] rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3 backdrop-blur-sm">
        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-200">Prinsip Sistem (Terverifikasi & Eksplisit): </span>
          Semua reminder perawatan dievaluasi secara matematis berdasarkan parameter dan aturan interval yang Anda tentukan. Sistem tidak mengarang interval tanpa data yang jelas.
        </div>
      </div>

      {selectedVehicle && (
        <>
          {/* Status Indicators Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Status Evaluasi Jadwal ({statuses.length} Aturan)
            </h2>

            {statuses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {statuses.map((s) => (
                  <div
                    key={s.ruleId}
                    className={`rounded-2xl p-4 md:p-5 border flex items-start justify-between gap-3 backdrop-blur-sm transition-all ${
                      s.isDue
                        ? "bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-lg shadow-rose-950/20"
                        : "glass-card text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            s.isDue ? "bg-rose-400 animate-ping" : "bg-emerald-400"
                          }`}
                        />
                        <h4 className="font-semibold text-sm text-white">
                          {s.description}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{s.detail}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase shrink-0 ${
                        s.isDue
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                      }`}
                    >
                      {s.isDue ? "Jatuh Tempo" : "Aman / Normal"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
                Belum ada aturan perawatan untuk kendaraan ini. Tambahkan aturan interval KM atau Hari di bawah.
              </div>
            )}
          </section>

          {/* Form Modal: Catat Maintenance Baru */}
          {showRecordForm && (
            <div className="glass-panel rounded-3xl p-6 md:p-7 shadow-2xl space-y-5 relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Catat Riwayat Servis / Perawatan Baru
                  </h3>
                </div>
                <button
                  onClick={resetRecordForm}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Jenis Perawatan <span className="text-rose-400">*</span>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Tanggal Servis <span className="text-rose-400">*</span>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Kilometer Saat Servis (KM)
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Biaya Servis / Spare Parts (Rp)
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Jadwal Servis Berikutnya (Tanggal)
                    </label>
                    <input
                      type="date"
                      value={recordNextDueDate}
                      onChange={(e) => setRecordNextDueDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Jadwal Servis Berikutnya (Target KM)
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Catatan / Detail Pekerjaan Servis
                    </label>
                    <input
                      type="text"
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      placeholder="Contoh: Penggantian oli mesin Shell Rimula R4X & filter oli original"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.07]">
                  <button
                    type="button"
                    onClick={resetRecordForm}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-950/40"
                  >
                    Simpan Riwayat Servis
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules Configuration Section */}
          <section className="glass-panel rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Aturan Interval Pengingat (Rules Engine)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tetapkan batasan interval KM atau Hari berdasarkan panduan teknis kendaraan.
                </p>
              </div>

              {!showRuleForm && (
                <button
                  onClick={() => setShowRuleForm(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                >
                  + Tambah Aturan
                </button>
              )}
            </div>

            {showRuleForm && (
              <form onSubmit={handleAddRule} className="bg-[#070b12]/80 p-4 md:p-5 rounded-2xl border border-white/[0.08] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Jenis</label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Interval KM</label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Interval Hari</label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi Aturan</label>
                    <input
                      type="text"
                      value={ruleDescription}
                      onChange={(e) => setRuleDescription(e.target.value)}
                      placeholder="Contoh: Ganti Oli Rutin"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.05]">
                  <button
                    type="button"
                    onClick={resetRuleForm}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
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
                  className="bg-[#070b12]/60 border border-white/[0.05] hover:border-white/[0.1] rounded-xl p-3.5 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-semibold text-white">
                      {r.description || MAINTENANCE_TYPE_LABELS[r.type]}
                    </span>
                    <span className="text-slate-400 ml-2 font-mono">
                      ({r.intervalKm ? `${r.intervalKm.toLocaleString("id-ID")} KM` : ""}
                      {r.intervalKm && r.intervalDays ? " / " : ""}
                      {r.intervalDays ? `${r.intervalDays} Hari` : ""})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors"
                    title="Hapus aturan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Maintenance Records History */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-semibold text-white">
                Log Histori Perawatan ({records.length} Tercatat)
              </h3>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                Total Biaya: Rp {totalCost.toLocaleString("id-ID")}
              </span>
            </div>

            {records.length > 0 ? (
              <div className="space-y-2.5">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="glass-card rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium text-[11px]">
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

                      <div className="flex flex-wrap items-center gap-3 text-slate-400 text-xs">
                        {r.kilometer !== undefined && (
                          <span className="font-mono">Odo: {r.kilometer.toLocaleString("id-ID")} KM</span>
                        )}
                        {r.cost !== undefined && (
                          <span className="text-emerald-400 font-mono font-medium">
                            Biaya: Rp {r.cost.toLocaleString("id-ID")}
                          </span>
                        )}
                        {r.nextDueDate && (
                          <span className="text-amber-300">
                            Jadwal Ulang: {r.nextDueDate}
                          </span>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-slate-300 italic pt-0.5 text-xs">
                          Catatan: {r.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteRecord(r.id)}
                      className="self-end sm:self-center text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Hapus catatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-400">
                Belum ada log catatan servis untuk kendaraan ini.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

