import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Vehicle, OperationSession, MaintenanceRecord, FuelRecord, VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS, STATUS_LABELS, MAINTENANCE_TYPE_LABELS } from "@/types";
import { msToHumanReadable, calculateOperationDurationMs } from "@/lib/calculator";

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dibuat: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);
  doc.setLineWidth(0.5);
  doc.line(14, 31, 196, 31);
}

export function generateVehicleReport(vehicle: Vehicle): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Kendaraan");

  const data = [
    ["Merek", vehicle.brand],
    ["Model", vehicle.model],
    ["Jenis", VEHICLE_TYPE_LABELS[vehicle.type]],
    ["Nomor Polisi", vehicle.plateNumber || "-"],
    ["Nomor Mesin", vehicle.engineNumber || "-"],
    ["Nomor Rangka", vehicle.chassisNumber || "-"],
    ["CC Mesin", vehicle.engineCc ? `${vehicle.engineCc} CC` : "-"],
    ["Bahan Bakar", FUEL_TYPE_LABELS[vehicle.fuelType]],
    ["Kilometer", vehicle.currentKm !== undefined ? `${vehicle.currentKm} km` : "-"],
    ["Terakhir Ganti Oli", vehicle.lastOilChangeDate || "-"],
    ["KM Ganti Oli", vehicle.lastOilChangeKm !== undefined ? `${vehicle.lastOilChangeKm} km` : "-"],
  ];

  autoTable(doc, {
    startY: 36,
    head: [["Field", "Nilai"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  return doc;
}

export function generateOperationReport(
  vehicle: Vehicle,
  sessions: OperationSession[]
): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, `Laporan Operasional - ${vehicle.brand} ${vehicle.model}`);

  const data = sessions.map((s) => [
    new Date(s.startTime).toLocaleDateString("id-ID"),
    new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    new Date(s.targetEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    msToHumanReadable(calculateOperationDurationMs(s.startTime, s.targetEndTime)),
    s.overtimeMinutes ? `${s.overtimeMinutes} menit` : "-",
    STATUS_LABELS[s.status],
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Tanggal", "Mulai", "Target", "Durasi", "Overtime", "Status"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  return doc;
}

export function generateMaintenanceReport(
  vehicle: Vehicle,
  records: MaintenanceRecord[]
): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, `Laporan Maintenance - ${vehicle.brand} ${vehicle.model}`);

  const data = records.map((r) => [
    new Date(r.date).toLocaleDateString("id-ID"),
    MAINTENANCE_TYPE_LABELS[r.type],
    r.kilometer ? `${r.kilometer} km` : "-",
    r.cost ? `Rp ${r.cost.toLocaleString("id-ID")}` : "-",
    r.notes || "-",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Tanggal", "Jenis", "KM", "Biaya", "Catatan"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  return doc;
}

export function generateFuelReport(
  vehicle: Vehicle,
  records: FuelRecord[]
): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, `Laporan Bahan Bakar - ${vehicle.brand} ${vehicle.model}`);

  const data = records.map((r) => [
    new Date(r.date).toLocaleDateString("id-ID"),
    `${r.liters} L`,
    FUEL_TYPE_LABELS[r.fuelType],
    r.pricePerLiter ? `Rp ${r.pricePerLiter.toLocaleString("id-ID")}` : "-",
    r.totalPrice ? `Rp ${r.totalPrice.toLocaleString("id-ID")}` : "-",
    r.kilometer ? `${r.kilometer} km` : "-",
  ]);

  autoTable(doc, {
    startY: 36,
    head: [["Tanggal", "Liter", "Jenis", "Harga/L", "Total", "KM"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  return doc;
}

export function generateOvertimeReport(
  vehicle: Vehicle,
  sessions: OperationSession[]
): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, `Laporan Overtime - ${vehicle.brand} ${vehicle.model}`);

  const overtimeSessions = sessions.filter(
    (s) => (s.overtimeMinutes && s.overtimeMinutes > 0) || s.status === "OVERTIME"
  );

  const totalOvertimeMin = overtimeSessions.reduce(
    (sum, s) => sum + (s.overtimeMinutes || 0),
    0
  );
  const avgOvertime =
    overtimeSessions.length > 0
      ? Math.round(totalOvertimeMin / overtimeSessions.length)
      : 0;

  let yPos = 36;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Insiden Overtime: ${overtimeSessions.length} sesi`, 14, yPos);
  doc.text(`Total Durasi Overtime: ${totalOvertimeMin} menit (${(totalOvertimeMin / 60).toFixed(1)} jam)`, 14, yPos + 6);
  doc.text(`Rata-rata Overtime per Insiden: ${avgOvertime} menit`, 14, yPos + 12);
  yPos += 18;

  if (overtimeSessions.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("Kepatuhan 100%: Tidak ada insiden overtime pada armada ini.", 14, yPos + 4);
    return doc;
  }

  const data = overtimeSessions.map((s) => [
    new Date(s.startTime).toLocaleDateString("id-ID"),
    new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    new Date(s.targetEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    s.actualEndTime
      ? new Date(s.actualEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "Masih Berjalan",
    `+${s.overtimeMinutes || 0} menit`,
    s.notes || "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Tanggal", "Mulai", "Target", "Selesai", "Overtime", "Catatan"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: [220, 38, 38] },
  });

  return doc;
}

export function generateFullReport(
  vehicle: Vehicle,
  sessions: OperationSession[],
  maintenanceRecords: MaintenanceRecord[],
  fuelRecords: FuelRecord[]
): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, `Laporan Lengkap - ${vehicle.brand} ${vehicle.model}`);

  let yPos = 36;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Data Kendaraan", 14, yPos);
  yPos += 4;

  const vehicleData = [
    ["Merek", vehicle.brand],
    ["Model", vehicle.model],
    ["Jenis", VEHICLE_TYPE_LABELS[vehicle.type]],
    ["Plat", vehicle.plateNumber || "-"],
    ["No. Mesin", vehicle.engineNumber || "-"],
    ["No. Rangka", vehicle.chassisNumber || "-"],
    ["CC Mesin", vehicle.engineCc ? `${vehicle.engineCc} CC` : "-"],
    ["Bahan Bakar", FUEL_TYPE_LABELS[vehicle.fuelType]],
    ["Kilometer", vehicle.currentKm !== undefined ? `${vehicle.currentKm} KM` : "-"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Field", "Nilai"]],
    body: vehicleData,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (sessions.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Riwayat Operasional & Overtime", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["Tanggal", "Mulai", "Target", "Durasi", "Overtime", "Status"]],
      body: sessions.map((s) => [
        new Date(s.startTime).toLocaleDateString("id-ID"),
        new Date(s.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        new Date(s.targetEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        msToHumanReadable(calculateOperationDurationMs(s.startTime, s.targetEndTime)),
        s.overtimeMinutes && s.overtimeMinutes > 0 ? `+${s.overtimeMinutes} m` : "-",
        STATUS_LABELS[s.status],
      ]),
      theme: "grid",
      headStyles: { fillColor: [46, 204, 113] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (maintenanceRecords.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Riwayat Maintenance", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["Tanggal", "Jenis", "KM", "Biaya", "Catatan"]],
      body: maintenanceRecords.map((r) => [
        new Date(r.date).toLocaleDateString("id-ID"),
        MAINTENANCE_TYPE_LABELS[r.type],
        r.kilometer ? `${r.kilometer} km` : "-",
        r.cost ? `Rp ${r.cost.toLocaleString("id-ID")}` : "-",
        r.notes || "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: [231, 76, 60] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (fuelRecords.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Riwayat Bahan Bakar", 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [["Tanggal", "Liter", "Jenis", "Total (Rp)"]],
      body: fuelRecords.map((r) => [
        new Date(r.date).toLocaleDateString("id-ID"),
        `${r.liters} L`,
        FUEL_TYPE_LABELS[r.fuelType],
        r.totalPrice ? `Rp ${r.totalPrice.toLocaleString("id-ID")}` : "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: [243, 156, 18] },
    });
  }

  return doc;
}
