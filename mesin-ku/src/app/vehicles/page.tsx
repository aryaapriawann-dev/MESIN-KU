"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Truck, Plus, X } from "lucide-react";
import { Vehicle } from "@/types";
import { vehicleStore } from "@/data/store";
import VehicleForm from "@/components/vehicle/VehicleForm";
import VehicleList from "@/components/vehicle/VehicleList";
import { useIsMounted } from "@/lib/hooks";

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
          <span className="text-xs text-slate-400 font-medium">Memuat Basis Data Armada...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Manajemen Armada
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-white/[0.08]">
              {vehicles.length} Unit
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Katalog spesifikasi kendaraan, nomor rangka/mesin, kapasitas bahan bakar, dan kondisi operasional.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all shadow-md shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kendaraan</span>
          </button>
        )}
      </div>

      {/* Form Modal / Inline Panel */}
      {isFormOpen && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 relative">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editingVehicle
                  ? `Edit Kendaraan: ${editingVehicle.brand} ${editingVehicle.model}`
                  : "Pendaftaran Kendaraan Baru"}
              </h2>
            </div>
            <button
              onClick={handleCloseForm}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
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

