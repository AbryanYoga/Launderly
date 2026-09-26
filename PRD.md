# Product Requirement Document (PRD)

## 1. Project Overview
Platform berbasis web untuk manajemen operasional dan analitik bisnis laundry. Sistem ini mencakup pemantauan performa harian (KPI), pencatatan transaksi langsung (walk-in), import batch transaksi via spreadsheet Excel, analisis tren pendapatan dan jam ramai, serta manajemen konfigurasi tarif layanan.

## 2. Technical Stack
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS (Skote Theme Palette: Dark Navy `#2A3042`, Slate `#F8F9FA`, Sky Blue `#0284C7`)
- **Database & Auth**: Supabase (PostgreSQL)
- **File Parser**: `xlsx` (SheetJS)
- **Visualisasi Data**: Recharts
- **Icon**: `lucide-react`

## 3. Database Schema (PostgreSQL / Supabase)

### Table: `services`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `name`: TEXT (Nama layanan, contoh: Cuci Komplit, Bed Cover)
- `category_id`: UUID (Foreign Key -> `categories.id` ON DELETE SET NULL, nullable)
- `unit`: TEXT (Satuan hitung: `kg` atau `pcs`)
- `price`: NUMERIC (Tarif per unit)
- `is_active`: BOOLEAN (default `true`)
- `created_at`: TIMESTAMPTZ (default `now()`)

### Table: `customers`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `name`: TEXT (Nama pelanggan)
- `phone`: TEXT (Nomor WhatsApp/HP, UNIQUE)
- `address`: TEXT (Alamat, nullable)
- `created_at`: TIMESTAMPTZ (default `now()`)

### Table: `transactions`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `invoice`: TEXT (Kode nota unik, format: `INV/YYMMDD/XXXX`)
- `customer_id`: UUID (Foreign Key -> `customers.id`)
- `payment_method_id`: UUID (Foreign Key -> `payment_methods.id` ON DELETE SET NULL, nullable)
- `total_weight`: NUMERIC (Total berat/kuantitas item)
- `total_amount`: NUMERIC (Grand total biaya)
- `payment_status`: TEXT (Status bayar: `unpaid` atau `paid`)
- `order_status`: TEXT (Status pengerjaan: `pending`, `washing`, `ironing`, `completed`)
- `notes`: TEXT (Catatan khusus, nullable)
- `created_at`: TIMESTAMPTZ (default `now()`)

### Table: `transaction_items`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `transaction_id`: UUID (Foreign Key -> `transactions.id` ON DELETE CASCADE)
- `service_id`: UUID (Foreign Key -> `services.id`)
- `qty`: NUMERIC (Jumlah kuantitas/berat)
- `subtotal`: NUMERIC (Harga x kuantitas)

### Table: `categories`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `name`: TEXT (Nama kategori: Kiloan, Satuan, Express, Setrika)
- `is_active`: BOOLEAN (default `true`)
- `created_at`: TIMESTAMPTZ (default `now()`)

### Table: `payment_methods`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `name`: TEXT (Nama metode pembayaran: Cash, Transfer Bank, QRIS, E-Wallet)
- `is_active`: BOOLEAN (default `true`)
- `created_at`: TIMESTAMPTZ (default `now()`)

### Table: `settings`
- `id`: UUID (Primary Key, default `gen_random_uuid()`)
- `outlet_name`: TEXT
- `outlet_phone`: TEXT
- `outlet_address`: TEXT
- `receipt_footer`: TEXT
- `updated_at`: TIMESTAMPTZ (default `now()`)

## 4. Module & Feature Specifications

### 4.1. Dashboard Overview (`/`)
- **KPI Metrics Cards**:
  - Total Omzet (IDR)
  - Total Volume Cucian (Kg)
  - Antrean Aktif (Pesanan belum `completed`)
  - Pelanggan Baru (Jumlah pendaftar bulan berjalan)
- **Tabel Transaksi Terbaru**:
  - Menampilkan 10 antrean terakhir.
  - Memiliki fitur *inline status updater* (mengubah status pesanan langsung tanpa refresh).

### 4.2. Input Transaksi Manual (`/transactions/new`)
- **Split Form Layout**:
  - Formulir input data: Nama, No. HP, Dropdown Layanan, Berat/Qty, Status Bayar.
  - Kartu ringkasan nota dinamis: Kalkulasi subtotal otomatis, total bayar, dan perkiraan tanggal selesai.
- **Logika Penyimpanan**:
  - Pengecekan customer: Insert baru jika belum ada, atau ambil `customer_id` jika nomor telepon sudah terdaftar.
  - Pembuatan nomor invoice otomatis.
  - Simpan ke `transactions` dan `transaction_items`.

### 4.3. Import Otomatis via Excel (`/transactions/import`)
- **Area Drag & Drop**: Menerima file berekstensi `.xlsx`, `.xls`, atau `.csv`.
- **Parsing & Validasi Client-Side**:
  - Format target: `Nama Pelanggan`, `Nomor HP`, `Layanan`, `Berat`, `Total`, `Tanggal`, `Status Bayar`.
  - Tabel pratinjau dengan penanda visual baris merah jika format salah atau kosong.
- **Batch Processing**: Menyimpan seluruh baris data valid secara bersamaan ke Supabase.
- **Download Template**: Menyediakan file contoh struktur kolom untuk pengguna.

### 4.4. Analitik & Laporan (`/analytics`)
- **Filter Rentang Waktu**: 7 hari terakhir, 30 hari terakhir, bulan ini.
- **Grafik Tren Omzet**: Area / Bar Chart pendapatan harian.
- **Grafik Komposisi Layanan**: Donut Chart perbandingan beban pengerjaan (Kiloan, Bed Cover, Satuan).
- **Operasional & Retensi**:
  - Matriks jam ramai (Peak Days & Hours).
  - Rata-rata nilai pesanan (Average Order Value).
  - Rasio pelanggan berulang (Repeat Customer Rate).

### 4.5. Pengaturan (`/settings`)
- **Master Tarif Layanan**: Tambah layanan baru, ubah harga per unit, asosiasi kategori, dan toggle status aktif/nonaktif.
- **Profil Usaha**: Konfigurasi nama toko, alamat, kontak WhatsApp, dan teks catatan nota.

### 4.6. Kategori Layanan
- **Manajemen Kategori di Pengaturan (`/settings`)**:
  - Tab "Kategori" untuk master data pengelompokan layanan (Kiloan, Satuan, Express, Setrika).
  - Tambah dan edit nama kategori dengan validasi input tidak boleh kosong dan tidak boleh duplikat (case-insensitive).
  - Toggle switch aktif/nonaktif kategori.
- **Asosiasi dengan Layanan**:
  - Kolom `category_id` (opsional) pada master layanan.
  - Dropdown pilihan kategori saat menambah/mengubah layanan.
  - Tampilan badge kategori visual pada baris data tabel layanan.
- **Pengelompokan Form Transaksi**:
  - Pengelompokan dropdown pilihan layanan di form transaksi baru (`/transactions/new`) menggunakan elemen `<optgroup>` berdasarkan kategori (layanan tanpa kategori masuk grup "Lainnya").
- **Analitik Komposisi Kategori**:
  - Fitur toggle switch "Per Layanan" vs "Per Kategori" pada grafik Donut Chart komposisi di `/analytics`.

### 4.7. Metode Pembayaran & Keandalan Transaksi
- **Manajemen Metode Pembayaran di Pengaturan (`/settings`)**:
  - Tab "Metode Pembayaran" untuk mengelola channel bayar (Cash, Transfer Bank, QRIS, E-Wallet).
  - Tambah, edit, dan toggle aktif/nonaktif dengan validasi string unik dan non-kosong.
- **Integrasi Transaksi & Bukti Bayar**:
  - Field wajib "Metode Pembayaran" di form transaksi manual (`/transactions/new`) dari daftar metode aktif, tersimpan ke `transactions.payment_method_id`.
  - Tampilan nama metode pembayaran pada nota preview dan receipt cetak thermal.
- **Dukungan Import Spreadsheet (`/transactions/import`)**:
  - Deteksi kolom "Metode Pembayaran" (alias: metode bayar, payment method) dari template Excel.
  - Auto-matching nama metode secara fleksibel/case-insensitive dengan fallback ke default aktif pertama bila kosong/tidak cocok.
- **Analitik Komposisi Metode Pembayaran**:
  - Donut Chart "Komposisi Metode Pembayaran" di `/analytics` untuk memantau porsi pembayaran tunai vs digital.
- **Reliability & Keamanan Transaksi Database**:
  - **Row Level Security (RLS)**: Diaktifkan pada seluruh tabel (`services`, `customers`, `transactions`, `transaction_items`, `settings`, `categories`, `payment_methods`) dengan policy `SELECT`, `INSERT`, `UPDATE` untuk role `anon`, tanpa mengizinkan `DELETE` via public key.
  - **Insert Transaksi Atomik (RPC)**: Fungsi PostgreSQL `create_transaction_with_item` (PL/pgSQL) untuk menjamin persistensi data `transactions` dan `transaction_items` dalam satu transaksi DB yang aman dari inkonsistensi (*atomic commit*).
  - **Invoice Uniqueness Handling**: Pengecekan collision dan retry loop otomatis bila kode nota terduplikasi pada lonjakan transaksi konkuren.

## 5. Coding & Commit Guidelines
- Menulis kode modular, bersih, dan langsung ke fungsi teknis.
- Tanpa komentar instruksional yang berlebihan di dalam baris kode.
- Format git commit menggunakan *conventional commits* huruf kecil (misal: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`).