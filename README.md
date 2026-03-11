# 🥬 Ida Buah — Store Management System

A modern **Progressive Web App (PWA)** for managing a small grocery/fruit store. Built with vanilla HTML, CSS, and JavaScript — powered by **Supabase cloud database** with real-time multi-device sync, offline queue, and full PWA installation support.

> **Live Demo**: [https://dashboard-toko-sayur.vercel.app/](https://dashboard-toko-sayur.vercel.app/)  
> **Katalog Publik**: [https://dashboard-toko-sayur.vercel.app/catalogue.html](https://dashboard-toko-sayur.vercel.app/catalogue.html)  
> **Live Database**: Supabase Cloud (PostgreSQL)  
> **Version**: 9.0.0  
> **Last Updated**: 11 Maret 2026  

---

## ✨ Fitur Lengkap

### 📱 PWA & Mobile-First
- **Installable** — install di Android/iOS/Desktop seperti native app
- **Fully Responsive** — mobile, tablet, desktop
- **Offline Queue** — aksi saat offline akan otomatis di-sync saat online kembali
- **Service Worker v6** — caching stale-while-revalidate untuk semua file statis
- **Dark Mode** — toggle 🌙/☀️ di sidebar, mengikuti preferensi OS secara otomatis

### 📊 Dashboard
- Summary harian: total produk, penjualan hari ini, pendapatan, laba bersih
- Peringatan stok menipis
- Ringkasan transaksi terbaru
- Akses cepat ke semua modul

### 📦 Manajemen Produk
- Tambah / edit / hapus produk
- Field: nama, harga, stok, kategori, barcode, URL gambar
- Pencarian & filter kategori
- Scan barcode via kamera (prioritas kamera belakang, html5-qrcode)
- QR Code otomatis untuk setiap produk di katalog

### 💰 Point of Sale (POS)
- Interface kasir yang cepat dan intuitif
- Pencarian produk + scan barcode
- Penyesuaian kuantitas
- Kalkulasi total real-time
- Sistem diskon (persentase / nominal, per produk / per transaksi)
- Metode pembayaran: Tunai, Transfer, QRIS
- **Cetak struk** (thermal 58mm / 80mm)
- **Export struk PDF** via browser print

### 📝 Riwayat Transaksi
- Riwayat lengkap semua transaksi
- Filter rentang tanggal
- Export ke CSV (BOM-encoded, aman untuk Excel)

### 📈 Laporan Keuangan
- Laporan harian / mingguan / bulanan / custom
- Pendapatan, pengeluaran, dan laba/rugi
- **Export PDF** — generate laporan terformat, buka print dialog
- **Export CSV** — gabungan transaksi + pengeluaran + summary baris

### 👥 Manajemen Pelanggan & Hutang
- Data pelanggan tersimpan di cloud
- Pencatatan hutang/kredit per pelanggan
- **Notifikasi badge merah** di sidebar jika ada hutang jatuh tempo
- **Push Notification** via Service Worker saat startup
- Riwayat pembayaran hutang

### 👤 Manajemen Pengguna
- Multi-user dengan role-based access control
- Role: **Developer** (akses sistem), **Admin** (akses penuh) dan **Kasir** (akses terbatas)
- Fitur Show Password untuk kemudahan login & manajemen
- Autentikasi dengan bcrypt password hashing
- Sesi tersimpan aman

### 🌐 Katalog Publik (`catalogue.html`)
- Halaman katalog yang bisa dibagikan ke pelanggan
- **Akses Langsung**: [Lihat Katalog Pelanggan](https://dashboard-toko-sayur.vercel.app/catalogue.html)
- Tampilkan foto produk, harga, stok
- Filter kategori dinamis
- QR Code untuk share link katalog
- Share via WhatsApp, copy link, native share API

### ☁️ Cloud Sync & Realtime
- **Supabase Realtime** — data antar device sinkron otomatis (products, transactions, debts)
- **Offline Queue** — operasi saat offline disimpan dan di-push saat kembali online
- **Sync Status Panel** di sidebar: badge Tersinkron / Menunggu / Syncing / Offline + waktu terakhir sync
- **Manual Sync** — tombol 🔄 untuk force sync kapan saja

### 📋 Activity Log
- Log semua aksi pengguna (login, tambah/edit/hapus, backup, dsb.)
- Disimpan di Supabase, fallback localStorage jika offline
- Auto-flush ke Supabase saat kembali online
- Export log ke CSV

### 💾 Backup & Restore
- Export semua data ke file JSON
- Import/restore dari file backup (upsert — tidak duplikat data)
- Riwayat backup tersimpan (up to 15 entri)

---

## 🛠️ Teknologi

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Database | **Supabase** (PostgreSQL) |
| Realtime | Supabase Realtime (WebSocket) |
| Auth | bcrypt.js password hashing |
| Barcode | html5-qrcode library |
| QR Code | qrcode.min.js |
| PWA | Service Worker, Web App Manifest |
| Styling | Modular CSS (base, layout, sidebar, components, pages, responsive) |

---

## 📁 Struktur Proyek

```
ida-buah/
├── index.html              # Aplikasi utama (SPA)
├── login.html              # Halaman login
├── catalogue.html          # Katalog publik
├── migrate.html            # Halaman migrasi database (dev only)
├── app.js                  # Main app controller
├── manifest.json           # PWA manifest
├── service-worker.js       # SW v6 — caching & offline
│
├── css/
│   ├── index.css           # Entry point (imports semua)
│   ├── base.css            # Variables & reset (+ dark mode)
│   ├── layout.css          # Layout grid & containers
│   ├── sidebar.css         # Sidebar + sync panel + dark toggle
│   ├── components.css      # Komponen UI reusable
│   ├── pages.css           # Page-specific styles
│   ├── catalogue.css       # Style untuk katalog
│   ├── flatpickr.min.css   # Tema kalender (datepicker)
│   └── responsive.css      # Breakpoints responsive
│
├── js/
│   ├── core/
│   │   ├── utils.js            # Utility functions (format, toast, CSV export)
│   │   ├── supabase.js         # Supabase client init
│   │   ├── database.js         # CRUD operations via Supabase
│   │   ├── activity-log.js     # Activity logging (Supabase + localStorage fallback)
│   │   ├── offline-sync.js     # Offline queue & Supabase Realtime
│   │   ├── backup.js           # Export/Import/Auto-backup
│   │   ├── theme.js            # Dark/light mode toggle (no-flash)
│   │   ├── debt-notification.js # Overdue debt push notifications
│   │   ├── mobile.js           # Mobile sidebar behavior
│   │   └── mobile-menu.js      # Hamburger menu
│   │
│   ├── pengguna/
│   │   ├── auth-v2.js          # Login, logout, session management
│   │   ├── permissions.js      # Role-based access control
│   │   └── users.js            # User CRUD
│   │
│   ├── dashboard/
│   │   └── dashboard.js        # Dashboard stats & summary
│   │
│   ├── produk/
│   │   ├── products.js         # Product management
│   │   ├── barcode.js          # Barcode scanner
│   │   └── catalogue.js        # Public catalogue page
│   │
│   ├── kasir/
│   │   ├── pos.js              # Point of Sale logic
│   │   ├── discounts.js        # Discount system
│   │   └── receipt-printer.js  # Cetak & export PDF struk
│   │
│   ├── transaksi/
│   │   ├── transactions.js     # Transaction history
│   │   ├── customers.js        # Customer management
│   │   └── debts.js            # Debt/credit management
│   │
│   └── laporan/
│       ├── reports.js          # Financial reports + PDF/CSV export
│       ├── expenses.js         # Expense tracking
│       └── financial-reports.js # Extended financial reports
│
└── icons/                  # PWA icons (72x72 → 512x512)
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- Browser modern (Chrome/Edge/Firefox)
- Koneksi internet untuk pertama kali (Supabase setup)

### 1. Clone Repository
```bash
git clone https://github.com/rfalam2211/DashboardTokoSayur.git
cd DashboardTokoSayur
```

### 2. Jalankan Local Server
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# Buka di browser
http://localhost:8000/login.html
```

### 3. Login Default
| Role | Username | Password |
|------|----------|----------|
| Developer | `developer` | `dev123` |
| Admin | `admin` | `admin123` |
| Kasir | `kasir` | `kasir123` |

### 4. Install sebagai PWA (Android/Desktop)
1. Buka app di Chrome
2. Tap menu ⋮ → **"Add to Home screen"** / **"Install App"**
3. Launch dari home screen seperti app native

---

## ☁️ Deployment (Vercel)

Proyek ini sudah dikonfigurasi untuk auto-deploy di **Vercel** setiap kali ada push ke GitHub (`main` branch).
**Live Web App**: [https://dashboard-toko-sayur.vercel.app/](https://dashboard-toko-sayur.vercel.app/)

### Konfigurasi Vercel (`vercel.json`)
File `vercel.json` telah disiapkan untuk memastikan PWA berjalan dengan lancar saat di-hosting:
- **Cache-Control**: Mencegah browser melakukan cache yang terlalu lama pada file `service-worker.js`, `.html`, dan `.js`, sehingga pembaruan aplikasi PWA bisa langsung diterima pengguna.
- **Security Headers**: Mengaktifkan mitigasi dasar keamanan web seperti proteksi XSS (Cross-Site Scripting) dan X-Frame-Options dilarang untuk mencegah _Clickjacking_.

### Cara Update Live App
Untuk memperbarui versi yang sedang online di Vercel, cukup push perubahan ke GitHub:
```bash
git add .
git commit -m "feat: deskripsi perubahan"
git push origin main
```
Vercel secara otomatis akan mem-build dan mendistribusikan versi terbaru.

---

## ⚙️ Konfigurasi Supabase

Edit file `js/core/supabase.js` dan ganti dengan kredensial Supabase project kamu:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Tabel yang dibutuhkan di Supabase:
| Tabel | Deskripsi |
|-------|-----------|
| `users` | Akun pengguna |
| `products` | Data produk |
| `transactions` | Riwayat transaksi |
| `expenses` | Pengeluaran |
| `customers` | Data pelanggan |
| `debts` | Hutang pelanggan |
| `discounts` | Aturan diskon |
| `activity_logs` | Log aktivitas *(opsional)* |

> Gunakan `migrate.html` untuk membuat tabel secara otomatis.

### Aktifkan Supabase Realtime:
Di Supabase Dashboard → **Table Editor → Replication**, aktifkan Realtime untuk tabel `products`, `transactions`, dan `debts`.

---

## 🗺️ Roadmap — Semua Phase Selesai ✅

| Phase | Fitur | Status |
|-------|-------|--------|
| Phase 1 | Infrastructure & Mobile UI | ✅ Selesai |
| Phase 2 | Barcode Scanning | ✅ Selesai |
| Phase 3 | Discount System | ✅ Selesai |
| Phase 4 | Public Stock Catalogue | ✅ Selesai |
| Phase 5 | Debt & Customer Management | ✅ Selesai |
| Phase 6 | Catalogue Enhancement (QR, Images, Share) | ✅ Selesai |
| Phase 7 | UX Polish & Bug Fixing | ✅ Selesai |
| Phase 8 | Cloud Sync & Supabase Realtime | ✅ Selesai |
| Phase 9 | Performance & PWA (Dark Mode, PDF Export) | ✅ Selesai |

---

## 📱 Kompatibilitas Browser

| Browser | Desktop | Mobile | PWA Install |
|---------|---------|--------|-------------|
| Chrome/Edge | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ⚠️ Terbatas |
| Safari | ✅ | ✅ | ✅ (iOS 16.4+) |
| Samsung Internet | — | ✅ | ✅ |

---

## 🤝 Kontribusi

1. Fork project ini
2. Buat branch fitur (`git checkout -b feature/NamaFitur`)
3. Commit perubahan (`git commit -m 'Tambah fitur X'`)
4. Push ke branch (`git push origin feature/NamaFitur`)
5. Buka Pull Request

---

## 📄 Lisensi

Open source di bawah [MIT License](LICENSE).

---

## 👨‍💻 Author

Dibuat dengan ❤️ untuk **Ida Buah** — toko buah & sayur keluarga.

---

**Version**: 9.0.0  
**Last Updated**: 11 Maret 2026  
**Database**: Supabase Cloud (PostgreSQL)  
**PWA**: Service Worker v6  
