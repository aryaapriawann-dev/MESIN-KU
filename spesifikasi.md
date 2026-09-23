# Spesifikasi.md — Technical Specification

## 1. Stack
### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- React

### Backend/API
Untuk MVP dapat dimulai dengan Next.js Route Handlers/Server Actions.
Backend terpisah seperti FastAPI dapat ditambahkan jika kebutuhan API, AI, background processing, atau integrasi eksternal meningkat.

### Database
MVP tidak membutuhkan database katalog kendaraan.

Jika persistence diperlukan:
- PostgreSQL
- Supabase PostgreSQL

Database menyimpan data operasional user, bukan wajib menyimpan katalog semua kendaraan.

### PDF
- Server-side PDF generation
- ReportLab jika menggunakan Python service
- Alternatif Node PDF library jika seluruh backend tetap di Next.js

## 2. Suggested Project Structure

```text
src/
├── app/
│   ├── dashboard/
│   ├── vehicles/
│   ├── operation/
│   ├── maintenance/
│   ├── reports/
│   └── api/
├── components/
│   ├── vehicle/
│   ├── timer/
│   ├── dashboard/
│   ├── maintenance/
│   └── reports/
├── lib/
│   ├── calculator/
│   ├── rules/
│   ├── timer/
│   ├── validation/
│   └── pdf/
├── types/
└── data/
```

## 3. Vehicle Input Schema

```ts
type Vehicle = {
  brand: string;
  model: string;
  type: string;
  plateNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  engineCc?: number;
  fuelType: string;
  fuelLiters?: number;
  currentKm?: number;
  loadCondition?: "light" | "normal" | "heavy";
  terrain?: "flat" | "urban" | "uphill" | "offroad";
  lastOilChangeDate?: string;
  lastOilChangeKm?: number;
};
```

## 4. Operation Session

```ts
type OperationSession = {
  vehicleId: string;
  startTime: string;
  targetEndTime: string;
  restDurationMinutes: number;
  actualEndTime?: string;
  overtimeMinutes?: number;
  status:
    | "READY"
    | "RUNNING"
    | "WARNING"
    | "REST_REQUIRED"
    | "RESTING"
    | "OVERTIME"
    | "COMPLETED"
    | "MAINTENANCE";
};
```

## 5. Timer Rules
- Gunakan timestamp sebagai sumber waktu, bukan hanya decrement counter.
- Hitung `remaining = targetEnd - currentTime`.
- Jika remaining <= 0, trigger end event.
- Simpan target time agar refresh halaman tidak mengubah jadwal.
- Overtime = current time - target end.
- Rest end = actual end + configured rest duration.

## 6. Accuracy
Timer harus menggunakan `Date.now()`/timestamp calculation agar tidak bergantung pada ketepatan `setInterval()`.

`setInterval()` hanya digunakan untuk refresh UI.

## 7. Alarm
Browser audio harus mempertimbangkan autoplay policy.

Flow:
1. User menekan Start.
2. Audio context/element dipersiapkan setelah user interaction.
3. Saat target tercapai, play alarm.
4. Tampilkan visual alert.
5. Sediakan mute/stop alarm.

## 8. Calculation Engine
Calculation engine harus pure function jika memungkinkan.

Contoh:

```ts
calculateOperationDuration(start, end)
calculateOvertime(currentTime, targetEnd)
calculateRestEnd(end, restMinutes)
calculateMaintenanceStatus(vehicle, maintenanceRules)
```

Jangan membuat fungsi yang mengklaim:

```text
CC = X → mesin pasti aman selama Y jam
```

karena hubungan tersebut tidak dapat disimpulkan hanya dari CC.

## 9. Data Trust Model
Data dapat memiliki:
- source
- sourceType
- verified
- verifiedAt

Jika data tidak tersedia:
- jangan mengarang
- tampilkan `Unknown`
- minta user mengisi
- atau gunakan sumber yang dapat diverifikasi

## 10. Security
- Validate all input
- Sanitize text
- Protect API routes
- Authentication jika multi-user
- Authorization berdasarkan role
- Rate limit public APIs jika diperlukan

## 11. PDF Contents
PDF minimal:
- Vehicle identity
- Operation summary
- Operation history
- Fuel history
- Maintenance history
- Overtime
- Generated date

## 12. Scalability
MVP:
Next.js only + optional persistence.

Production:
Next.js + API service + PostgreSQL + object storage + background worker jika diperlukan.
