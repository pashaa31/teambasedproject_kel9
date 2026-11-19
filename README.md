# VComp — Vape Companion

VComp adalah aplikasi web pendamping pengguna vape. Aplikasi ini menyediakan dashboard informasi, pencarian vape store berbasis peta GPS, jurnal rasa liquid, serta pengingat perawatan perangkat.

## Anggota kelompok
1. Pasha Abdul Qadir_F5512520069
2. Nofraghitos Marciano Maugo_F5512520064
3. I Nyoman Bagus Aryana_F5512520047

## Menjalankan aplikasi

1. Pastikan Node.js sudah terpasang.
2. Buka atau extract folder proyek.
3. Double-click `START.bat`.
4. Browser akan membuka `http://localhost:3000`.

Alternatif melalui terminal:

```bash
cd backend
npm start
```

Aplikasi tidak memerlukan Docker atau PostgreSQL. Database menggunakan SQLite melalui `sql.js`.

## Halaman aplikasi

- Dashboard: `http://localhost:3000`
- Peta GPS: `http://localhost:3000/map`
- Perawatan & Pengingat: `http://localhost:3000/care`
- Admin: `http://localhost:3000/admin`

## Fitur

### Dashboard VComp

- Tampilan dashboard dengan akses cepat ke setiap fitur.
- Fakta singkat tentang perawatan perangkat vape.
- Rekomendasi kategori pod dan liquid.
- Animasi hover pada tombol dan kartu akses cepat.

### Peta GPS Vape Store

- Peta interaktif Leaflet dengan OpenStreetMap.
- Data 30 titik lokasi vape store di Kota Palu.
- Pencarian berdasarkan nama atau alamat toko.
- Filter lokasi berdasarkan wilayah/kecamatan.
- Fitur Lokasi Saya melalui GPS browser.
- Rekomendasi daftar toko terdekat setelah Lokasi Saya diaktifkan.
- Rute menuju toko menggunakan layanan OSRM.

### Perawatan & Pengingat

- Pengingat penggantian koil, kapas, pod/cartridge, atau baterai.
- Pencatatan tanggal terakhir penggantian dan tanggal pengingat berikutnya.
- Notifikasi browser untuk pengingat yang telah jatuh tempo ketika halaman Perawatan dibuka dan izin notifikasi diberikan.

### Jurnal Rasa Liquid

- Pencatatan nama liquid dan profil rasa.
- Rating liquid dari 1 sampai 5.
- Catatan pengalaman penggunaan liquid.
- Data jurnal disimpan pada database SQLite dan dipisahkan per browser pengguna.

### Admin

- Login admin untuk pengelolaan data lokasi.
- Tambah, edit, dan hapus data vape store.
- Pengelolaan nama, alamat, koordinat, wilayah, jam operasional, produk, dan URL foto.

## Akses admin

- Username: `admin`
- Password: `admin123`

## Catatan data dan penggunaan

Data lokasi mencakup nama, koordinat, serta sebagian alamat dari data tugas. Atribut yang belum tersedia akan ditampilkan sebagai `Belum tersedia` atau `Belum diverifikasi`.

Produk vape ditujukan bagi pengguna dewasa. Gunakan secara bertanggung jawab dan patuhi ketentuan yang berlaku di wilayah Anda.
