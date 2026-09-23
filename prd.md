# PRD.md — Vehicle Operation & Maintenance System

## 1. Product Overview
Aplikasi web untuk membantu individu dan perusahaan mengatur penggunaan kendaraan dan alat berat melalui scheduling, operational timer, rest timer, maintenance reminder, histori, dan laporan PDF.

## 2. Problem
Penggunaan kendaraan yang tidak terjadwal dapat menyebabkan operator lupa berhenti sesuai target, penggunaan melewati jadwal, dan keterlambatan perawatan.

Aplikasi memberikan alat bantu monitoring dan pengingat preventif. Aplikasi tidak menggantikan manual kendaraan, standar keselamatan, atau keputusan teknisi.

## 3. Target User
- Pemilik kendaraan pribadi
- Operator kendaraan
- Perusahaan dengan fleet kendaraan
- Pengelola kendaraan umum
- Pengelola kendaraan operasional
- Pengelola alat berat
- Admin fleet

## 4. Product Principle
### No Hallucination
Sistem tidak boleh mengarang spesifikasi atau batas aman kendaraan.

### Calculator First
Perhitungan berasal dari parameter yang diberikan user dan rule yang eksplisit.

### AI as Explanation
Jika AI ditambahkan, AI hanya menjelaskan atau menganalisis hasil berdasarkan data yang tersedia; AI bukan sumber utama fakta teknis kendaraan.

### Preventive
Sistem fokus pada pengingat dan preventive maintenance.

## 5. Core User Flow
1. User membuka aplikasi.
2. User memasukkan data kendaraan.
3. User memasukkan jadwal penggunaan.
4. Sistem menghitung durasi.
5. User menekan `Start Operation`.
6. Countdown berjalan.
7. Saat target tercapai, alarm berbunyi.
8. Status berubah menjadi `Rest Required`.
9. Rest timer berjalan.
10. Setelah selesai, status menjadi `Ready`.
11. Sesi disimpan ke histori.
12. User dapat membuat laporan PDF.

## 6. Vehicle Types
- Motor
- Mobil
- Pickup
- SUV
- Sedan
- Bus
- Truk
- Kendaraan umum
- Kendaraan operasional
- Kendaraan logistik
- Alat berat
- Lainnya

## 7. Functional Requirements

### FR-01 Vehicle Input
Sistem harus menerima data kendaraan.

### FR-02 Operation Scheduling
Sistem harus menerima waktu mulai dan target berhenti.

### FR-03 Countdown
Sistem harus menampilkan waktu operasional secara realtime di browser.

### FR-04 Alarm
Sistem harus memberikan alarm ketika target berhenti tercapai.

### FR-05 Overtime
Sistem harus mendeteksi penggunaan melewati target.

### FR-06 Rest Timer
Sistem harus menghitung waktu istirahat.

### FR-07 Maintenance
Sistem harus menyediakan pencatatan dan reminder maintenance.

### FR-08 Fuel
Sistem harus mencatat pengisian bahan bakar.

### FR-09 History
Sistem harus menyediakan histori operasional.

### FR-10 PDF
Sistem harus menyediakan laporan yang dapat diunduh dalam format PDF.

## 8. Non-Functional Requirements
- Responsive
- Fast UI
- Accessible controls
- Accurate timer
- Clear status
- Type-safe code
- Secure input validation
- Modular architecture
- No unsupported technical claims

## 9. Future
- PostgreSQL fleet database
- User roles
- Multi-company
- API kendaraan
- IoT
- GPS
- AI analytics
- Predictive maintenance
