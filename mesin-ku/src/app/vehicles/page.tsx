"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Vehicle } from "@/types";
import { vehicleStore } from "@/data/store";
import VehicleForm from "@/components/vehicle/VehicleForm";
import VehicleList from "@/components/vehicle/VehicleList";
import { useIsMounted } from "@/lib/hooks";
import { PlusIcon, VehicleIcon } from "@/components/ui/Icons";

function VehiclesContent() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const idParam = searchParams.get("id");
  const mounted = useIsMounted();

  const [vehicles, setVehicles] = useState<Vehicle[]>(() =>
    typeof window !== "undefined" ? vehicleStore.getAll() : []
  );
  const [isFormOpen, setIsFormOpen] = useState(() => actionParam === "add" || actionParam === "edit");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(() => {
    if (typeof window !== "undefined" && actionParam === "edit" && idParam) {
      return vehicleStore.getById(idParam);
    }
    return undefined;
  });

  const loadVehicles = useCallback(() => {
    setVehicles(vehicleStore.getAll());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadVehicles();
    const handleStoreChange = () => loadVehicles();
    window.addEventListener("mesinku-store-change", handleStoreChange);
    return () => window.removeEventListener("mesinku-store-change", handleStoreChange);
  }, [mounted, loadVehicles]);

  function handleDelete(id: string) {
    vehicleStore.remove(id);
    loadVehicles();
  }

  function handleSave() {
    loadVehicles();
    setIsFormOpen(false);
    setEditingVehicle(undefined);
    window.history.replaceState(null, "", "/vehicles");
  }

  function handleOpenAdd() {
    setEditingVehicle(undefined);
    setIsFormOpen(true);
    window.history.replaceState(null, "", "/vehicles?action=add");
  }

  function handleOpenEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
    window.history.replaceState(null, "", `/vehicles?action=edit&id=${vehicle.id}`);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingVehicle(undefined);
    window.history.replaceState(null, "", "/vehicles");
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Memuat Basis Data Armada...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              MANAJEMEN ARMADA
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {vehicles.length} UNIT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Katalog spesifikasi kendaraan, nomor rangka/mesin, kapasitas bahan bakar, dan kondisi operasional.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md shadow-blue-900/30 font-mono tracking-wide"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>TAMBAH KENDARAAN</span>
          </button>
        )}
      </div>

      {/* Form Modal / Inline Panel */}
      {isFormOpen && (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <VehicleIcon className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-white font-mono">
                {editingVehicle
                  ? `EDIT KENDARAAN: ${editingVehicle.brand} ${editingVehicle.model}`
                  : "PENDAFTARAN KENDARAAN BARU"}
              </h2>
            </div>
            <button
              onClick={handleCloseForm}
              className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              BATAL / TUTUP
            </button>
          </div>

          <VehicleForm
            vehicle={editingVehicle}
            onSave={handleSave}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Vehicle Grid List */}
      <VehicleList
        vehicles={vehicles}
        onDelete={handleDelete}
        onEdit={handleOpenEdit}
      />
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      }
    >
      <VehiclesContent />
    </Suspense>
  );
}
