# Fitur.md — Vehicle Operation & Maintenance System

## A. Vehicle Management
- Tambah kendaraan
- Edit kendaraan
- Detail kendaraan
- Kategori kendaraan
- Nomor polisi
- Nomor mesin
- CC
- Bahan bakar
- Kilometer
- Kondisi kendaraan

## B. Operation Scheduler
- Set waktu mulai
- Set target berhenti
- Hitung durasi otomatis
- Set durasi istirahat
- Start/pause/stop sesi
- Status operasional

## C. Operational Timer
Status:
- READY
- RUNNING
- WARNING
- REST_REQUIRED
- RESTING
- OVERTIME
- COMPLETED
- MAINTENANCE

Fungsi:
- Countdown
- Progress indicator
- Target time
- Remaining time
- Overtime counter
- Alarm
- Visual warning

## D. Rest Timer
- Durasi istirahat
- Countdown istirahat
- Waktu siap kembali
- Status `READY` setelah selesai

## E. Alarm
- Alarm saat target tercapai
- Alarm/indikator overtime
- Tombol mute
- Visual alert
- Audio fallback jika browser membatasi autoplay

## F. Maintenance
- Last oil change
- Kilometer oil change
- Current kilometer
- Service history
- Maintenance notes
- Reminder
- Maintenance status

## G. Fuel
- Jumlah liter
- Jenis bahan bakar
- Harga (opsional)
- Kilometer
- Tanggal
- Riwayat pengisian

## H. Dashboard
Menampilkan:
- Kendaraan aktif
- Kendaraan istirahat
- Overtime
- Maintenance due
- Timer aktif
- Ringkasan operasional

## I. Report
- Vehicle report
- Operation report
- Maintenance report
- Fuel report
- Overtime report
- PDF download

## J. Calculation & Rule Engine
- Durasi operasi
- Overtime
- Rest duration
- Ready time
- Maintenance due berdasarkan parameter
- Validation
- Risk/condition indicator berbasis rule

## K. AI Layer — Optional
AI dapat:
- menjelaskan hasil kalkulasi
- membuat ringkasan histori
- menjawab pertanyaan berdasarkan data aplikasi
- membantu membaca pola penggunaan

AI tidak boleh:
- mengarang spesifikasi kendaraan
- membuat klaim kerusakan tanpa data
- menentukan batas aman mesin hanya berdasarkan CC
- menggantikan manual pabrikan atau teknisi
