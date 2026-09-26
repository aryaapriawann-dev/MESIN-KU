"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Vehicle,
  OperationSession,
  STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "@/types";
import { vehicleStore, sessionStore } from "@/data/store";
import { msToHumanReadable, calculateOperationDurationMs } from "@/lib/calculator";

export default function HistoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sessions, setSessions] = useState<OperationSession[]>([]);
  const [filterVehicleId, setFilterVehicleId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setVehicles(vehicleStore.getAll());
    loadSessions();
  }, []);

  function loadSessions() {
    setSessions(
      sessionStore
        .getAll()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  const filtered = sessions.filter((s) => {
    if (filterVehicleId && s.vehicleId !== filterVehicleId) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  const totalOvertime = filtered.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0);
  const completedCount = filtered.filter((s) => s.status === "COMPLETED").length;

  const statusColors: Record<string, string> = {
    RUNNING: "bg-green-100 text-green-800",
    WARNING: "bg-yellow-100 text-yellow-800",
    OVERTIME: "bg-red-100 text-red-800",
    REST_REQUIRED: "bg-orange-100 text-orange-800",
    RESTING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-700",
    READY: "bg-gray-100 text-gray-700",
    MAINTENANCE: "bg-purple-100 text-purple-800",
  };

  if (!mounted) {
    return <div className="animate-pulse text-gray-400 p-8">Memuat...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Riwayat Operasi</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kendaraan</label>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Semua Kendaraan</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} {v.plateNumber ? `(${v.plateNumber})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-700 opacity-80">Total Sesi</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-700 opacity-80">Selesai</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{completedCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-700 opacity-80">Total Overtime</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{totalOvertime} min</p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((s) => {
            const vehicle = vehicles.find((v) => v.id === s.vehicleId);
            const duration = calculateOperationDurationMs(s.startTime, s.targetEndTime);
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {vehicle ? `${vehicle.brand} ${vehicle.model}` : "Kendaraan"}
                      </span>
                      {vehicle && (
                        <span className="text-xs text-gray-400">{VEHICLE_TYPE_LABELS[vehicle.type]}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColors[s.status] || ""}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>
                        {new Date(s.startTime).toLocaleDateString("id-ID")}
                      </span>
                      <span>
                        {new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(s.targetEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>Durasi: {msToHumanReadable(duration)}</span>
                      {s.overtimeMinutes && s.overtimeMinutes > 0 && (
                        <span className="text-red-600">+{s.overtimeMinutes} min overtime</span>
                      )}
                    </div>
                    {s.notes && <p className="text-xs text-gray-400 mt-1">{s.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/operation?vehicleId=${s.vehicleId}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Detail
                    </Link>
                    <button
                      onClick={() => {
                        sessionStore.remove(s.id);
                        loadSessions();
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Belum ada riwayat operasi</p>
        </div>
      )}
    </div>
  );
}
