# MVP.md — Vehicle Operation & Maintenance System

## 1. Ringkasan
Vehicle Operation & Maintenance System adalah aplikasi berbasis Next.js untuk membantu pengguna mengatur waktu operasional kendaraan, waktu istirahat, maintenance, bahan bakar, dan menghasilkan laporan PDF.

MVP tidak membutuhkan database katalog seluruh kendaraan. Pengguna memasukkan data kendaraan dan parameter operasional, kemudian sistem menggunakan calculation engine/rule engine untuk menghasilkan timer, status, peringatan, dan rekomendasi.

## 2. Tujuan MVP
- Mengatur waktu mulai dan target berhenti kendaraan.
- Menjalankan countdown timer.
- Membunyikan alarm ketika target waktu tercapai.
- Mengubah status kendaraan menjadi waktu istirahat.
- Menghitung durasi istirahat dan waktu kendaraan dapat digunakan kembali.
- Mencatat data dasar kendaraan.
- Memberikan peringatan maintenance berdasarkan data yang dimasukkan.
- Menghasilkan laporan PDF.

## 3. Input Kendaraan
- Merek
- Model
- Jenis kendaraan
- Nomor polisi
- Nomor mesin
- Nomor rangka (opsional)
- Kapasitas mesin/CC
- Jenis bahan bakar
- Jumlah bahan bakar yang diisi
- Kilometer saat ini
- Kondisi/beban penggunaan
- Kondisi medan (opsional)
- Tanggal/km terakhir ganti oli

## 4. Input Operasional
- Waktu mulai
- Target waktu berhenti
- Durasi istirahat
- Beban penggunaan
- Kondisi medan
- Catatan penggunaan

## 5. Timer
Contoh:
- Mulai: 13:00
- Target berhenti: 15:00
- Durasi: 2 jam

Timer melakukan countdown sampai 00:00:00.

Saat mencapai target:
1. Alarm berbunyi.
2. Status menjadi `REST_REQUIRED`.
3. Sistem menampilkan notifikasi.
4. Timer istirahat dimulai jika durasi istirahat telah ditentukan.
5. Setelah istirahat selesai, status menjadi `READY`.

Jika waktu terlewati, sistem mencatat `OVERTIME`.

## 6. Calculation Engine
MVP tidak menggunakan AI untuk menebak spesifikasi kendaraan.

Calculation engine hanya menggunakan parameter yang dimasukkan pengguna dan aturan yang sudah didefinisikan.

Contoh:
- Durasi operasi = waktu berhenti - waktu mulai.
- Overtime = waktu aktual - target berhenti.
- Waktu siap kembali = waktu berhenti + durasi istirahat.

CC, merek, dan model digunakan sebagai konteks kendaraan, bukan sebagai bukti bahwa kendaraan memiliki batas aman tertentu.

## 7. Maintenance
Sistem dapat menyimpan:
- terakhir ganti oli
- kilometer saat ganti oli
- kilometer saat ini
- tanggal servis
- catatan maintenance

MVP memberikan reminder berdasarkan interval yang dikonfigurasi, bukan klaim bahwa semua kendaraan memiliki interval yang sama.

## 8. PDF
MVP menyediakan:
- Laporan kendaraan
- Laporan sesi operasional
- Laporan maintenance
- Ringkasan bahan bakar
- Ringkasan overtime

Tombol: `Download PDF`.

## 9. Di luar MVP
- Katalog seluruh kendaraan dunia
- Integrasi telematics/GPS
- Prediksi kerusakan berbasis machine learning
- IoT sensor suhu mesin
- Integrasi bengkel
- Automatic vehicle identification
- Mobile native app

## 10. Kriteria Selesai
MVP dianggap selesai jika:
- Form kendaraan berjalan.
- Form jadwal operasional berjalan.
- Countdown akurat.
- Alarm berjalan saat target tercapai.
- Overtime terdeteksi.
- Rest timer berjalan.
- Maintenance reminder berjalan berdasarkan parameter.
- PDF dapat dibuat dan diunduh.
