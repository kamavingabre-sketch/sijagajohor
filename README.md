# SIJAGA JOHOR 🏙️
**Sistem Informasi Jaga Kebersihan — Kecamatan Medan Johor**

Website pemantauan lokasi petugas kebersihan Melati dan Bestari di Kecamatan Medan Johor, Kota Medan.

---

## 🚀 Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Deploy**: Vercel
- **Font**: Barlow Condensed + Plus Jakarta Sans

---

## ⚙️ Setup Lokal

### 1. Clone repo
```bash
git clone https://github.com/YOUR_USERNAME/sijaga-johor.git
cd sijaga-johor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env.local
```
Isi file `.env.local` dengan kredensial Supabase Anda:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Jalankan development server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Salin **Project URL** dan **anon key** dari Settings → API
3. Tempel ke `.env.local`

### SQL Awal (jalankan di Supabase SQL Editor)
```sql
-- Tabel petugas
CREATE TABLE petugas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT UNIQUE,
  unit TEXT CHECK (unit IN ('melati', 'bestari')),
  kelurahan TEXT,
  nomor_hp TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel lokasi (tracking)
CREATE TABLE lokasi_petugas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES petugas(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  akurasi FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS
ALTER TABLE petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasi_petugas ENABLE ROW LEVEL SECURITY;
```

---

## 🌐 Deploy ke Vercel

1. Push ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import Project
3. Pilih repo `sijaga-johor`
4. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klik **Deploy**

---

## 📁 Struktur Project

```
sijaga-johor/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page (Home)
│   │   ├── login/
│   │   │   └── page.tsx     # Halaman login
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── Hero.tsx         # Hero section
│   │   ├── Features.tsx     # Fitur section
│   │   ├── UnitSection.tsx  # Unit Melati & Bestari
│   │   └── Footer.tsx       # CTA + Footer
│   └── lib/
│       └── supabase.ts      # Supabase client
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🎨 Warna Brand
| Name | Hex |
|------|-----|
| Biru Tua | `#0B3C7A` |
| Biru Mid | `#1A5CB8` |
| Biru Light | `#2E7DD1` |
| Merah | `#E02020` |
| Merah Tua | `#B01010` |

---

*Dibuat untuk Kecamatan Medan Johor — bagian dari program **MEDAN UNTUK SEMUA***
