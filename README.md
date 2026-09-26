# Launderly — Laundry Operations & Business Analytics Platform

Launderly adalah platform manajemen operasional dan analitik bisnis laundry modern berbasis web. Dibangun dengan estetika antarmuka Skote Theme palette (Dark Navy, Slate, dan Sky Blue), sistem ini dirancang untuk mempercepat pencatatan transaksi kasir harian, memudahkan migrasi/batch import data dari Excel, memantau metrik performa utama (KPI), serta memberikan analisis tren bisnis yang mendalam.

---

## Fitur Utama

- **Dashboard Real-Time**: Pemantauan KPI harian (total omzet, volume cucian, antrean aktif, pelanggan baru) dengan tabel transaksi terbaru dan *inline status updater*.
- **Pencatatan Transaksi Cepat**: Formulir pemesanan walk-in dengan pengelompokan layanan per kategori, pemilihan metode pembayaran, auto-lookup pelanggan, dan pratinjau nota receipt siap cetak.
- **Batch Import Excel**: Unggah spreadsheet (`.xlsx`, `.xls`, `.csv`) dengan validasi otomatis per baris, pencocokan layanan & metode pembayaran cerdas, serta penyimpanan batch ke database.
- **Analitik & Business Intelligence**: Visualisasi tren omzet harian, rasio pelanggan berulang, jam sibuk (peak hours), serta grafik komposisi (per layanan, per kategori, dan metode pembayaran).
- **Master Data & Pengaturan**: Manajemen tarif layanan, master kategori cucian, master metode pembayaran, serta profil usaha untuk bukti bayar.
- **Keamanan & Keandalan**: Row Level Security (RLS) di semua tabel PostgreSQL, penyimpanan transaksi atomik via RPC function, dan penanganan collision nomor nota otomatis.
- **Polesan UX & Responsif**: Tampilan mobile-friendly dengan collapsible drawer sidebar, loading skeleton teranimasi, pemisahan jelas antara mode demo dan data asli, serta unified toast notifications.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Skote Palette `#2A3042`, `#F8F9FA`, `#0284C7`)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL dengan RLS & Stored Procedures)
- **Visualisasi Data**: [Recharts](https://recharts.org/)
- **Spreadsheet Parser**: [SheetJS (xlsx)](https://docs.sheetjs.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Panduan Instalasi & Menjalankan Project

### 1. Prasyarat
- Node.js versi 18.18 atau lebih baru
- Akun atau project di [Supabase](https://supabase.com)

### 2. Kloning & Instal Dependensi
```bash
git clone https://github.com/AbryanYoga/Launderly.git
cd Launderly
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu buka file `.env.local` dan masukkan kredensial Supabase project Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Menjalankan Migrasi Database Supabase
Jalankan file migrasi SQL secara berurutan pada menu **SQL Editor** di dashboard Supabase (atau gunakan Supabase CLI):

1. **`supabase/migrations/01_initial_schema.sql`**  
   Membuat skema tabel dasar: `services`, `customers`, `transactions`, `transaction_items`, dan `settings`.
2. **`supabase/migrations/02_categories_payment_methods.sql`**  
   Membuat tabel `categories` dan `payment_methods`, serta menambahkan relasi foreign key pada `services.category_id` dan `transactions.payment_method_id`.
3. **`supabase/migrations/03_rls_policies.sql`**  
   Mengaktifkan Row Level Security (RLS) di seluruh tabel dengan policy publik (anon `SELECT`, `INSERT`, `UPDATE`), serta membuat fungsi atomik PostgreSQL `create_transaction_with_item`.

### 5. Menjalankan Server Development
Jalankan server pengembangan lokal:
```bash
npm run dev
```
Akses aplikasi melalui browser di [http://localhost:3000](http://localhost:3000).

### 6. Build untuk Produksi
Untuk memvalidasi dan membuat build produksi:
```bash
npm run build
npm run start
```
