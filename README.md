# SIG Vape Store Kota Palu - Versi Presentasi

## Menjalankan
1. Pastikan Node.js sudah terpasang.
2. Extract ZIP.
3. Double-click `START.bat`.
4. Browser akan membuka `http://localhost:3000`.

Tidak membutuhkan Docker atau PostgreSQL. Database menggunakan SQLite melalui sql.js.

## Akses
- Peta publik: `http://localhost:3000` (tanpa login)
- Admin: `http://localhost:3000/admin`
- Username: `admin`
- Password: `admin123`

## Fitur
- Peta Leaflet + OpenStreetMap
- 30 titik lokasi dari data tugas
- Pencarian dan daftar lokasi
- Lokasi saya
- Routing melalui OSRM
- Login admin
- CRUD data lokasi
- SQLite otomatis dibuat saat server pertama kali berjalan

## Catatan data
Data tugas yang tersedia berisi nama, koordinat, dan sebagian alamat. Jam operasional, foto, produk, serta zonasi yang belum tersedia ditandai `Belum tersedia`/`Belum diverifikasi`, bukan dibuat-buat.
