-- ============================================================
-- SIJAGA JOHOR — Supabase Schema v4
-- Jalankan di Supabase SQL Editor (Settings > SQL Editor)
-- ============================================================

-- 1. Tabel petugas (users)
-- PERUBAHAN v4: nip dijadikan opsional (nullable), bukan required
CREATE TABLE IF NOT EXISTS petugas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT UNIQUE,                          -- nullable, tidak wajib lagi
  unit TEXT CHECK (unit IN ('melati', 'bestari')) NOT NULL,
  kelurahan TEXT NOT NULL,
  nomor_hp TEXT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('petugas', 'admin')) DEFAULT 'petugas',
  foto_profil TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jika tabel sudah ada, jalankan ALTER ini untuk mengubah NIP menjadi nullable:
-- ALTER TABLE petugas ALTER COLUMN nip DROP NOT NULL;

-- 2. Tabel absensi
CREATE TABLE IF NOT EXISTS absensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES petugas(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_masuk TIMESTAMPTZ,
  jam_keluar TIMESTAMPTZ,
  status TEXT CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')) DEFAULT 'hadir',
  foto_bukti_url TEXT,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(petugas_id, tanggal)
);

-- 3. Tabel lokasi realtime
CREATE TABLE IF NOT EXISTS lokasi_petugas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES petugas(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  akurasi FLOAT,
  kecepatan FLOAT,
  heading FLOAT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel foto bukti tugas
CREATE TABLE IF NOT EXISTS foto_bukti (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES petugas(id) ON DELETE CASCADE,
  absensi_id UUID REFERENCES absensi(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  keterangan TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel foto_kegiatan (dokumentasi kegiatan harian)
CREATE TABLE IF NOT EXISTS foto_kegiatan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES petugas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel alerts (NEW v4) — Admin alert ke petugas
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES petugas(id) ON DELETE CASCADE,
  judul TEXT NOT NULL DEFAULT 'Alert dari Admin',
  deskripsi TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('personal', 'mass')) NOT NULL DEFAULT 'personal',
  target_petugas_id UUID REFERENCES petugas(id) ON DELETE CASCADE,
  dibaca BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_lokasi_petugas_id ON lokasi_petugas(petugas_id);
CREATE INDEX IF NOT EXISTS idx_lokasi_timestamp ON lokasi_petugas(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_absensi_petugas ON absensi(petugas_id);
CREATE INDEX IF NOT EXISTS idx_foto_kegiatan_petugas ON foto_kegiatan(petugas_id);
CREATE INDEX IF NOT EXISTS idx_foto_kegiatan_time ON foto_kegiatan(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_target ON alerts(target_petugas_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- 8. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE lokasi_petugas;
ALTER PUBLICATION supabase_realtime ADD TABLE absensi;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- 9. Row Level Security
ALTER TABLE petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasi_petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE foto_bukti ENABLE ROW LEVEL SECURITY;
ALTER TABLE foto_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_read"   ON petugas       FOR SELECT USING (true);
CREATE POLICY "allow_all_read"   ON absensi        FOR SELECT USING (true);
CREATE POLICY "allow_all_read"   ON lokasi_petugas FOR SELECT USING (true);
CREATE POLICY "allow_all_read"   ON foto_bukti     FOR SELECT USING (true);
CREATE POLICY "allow_all_read"   ON foto_kegiatan  FOR SELECT USING (true);
CREATE POLICY "allow_all_read"   ON alerts         FOR SELECT USING (true);

CREATE POLICY "allow_all_insert" ON petugas        FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_insert" ON absensi        FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_insert" ON lokasi_petugas FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_insert" ON foto_bukti     FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_insert" ON foto_kegiatan  FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_insert" ON alerts         FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_all_update" ON absensi        FOR UPDATE USING (true);
CREATE POLICY "allow_all_update" ON petugas        FOR UPDATE USING (true);
CREATE POLICY "allow_all_update" ON alerts         FOR UPDATE USING (true);

CREATE POLICY "allow_all_delete" ON petugas        FOR DELETE USING (true);
CREATE POLICY "allow_all_delete" ON alerts         FOR DELETE USING (true);

-- 10. Storage bucket foto-bukti: buat di Dashboard > Storage, set Public = true
-- Lalu jalankan storage policy agar upload tidak kena RLS error:
-- INSERT INTO storage.policies (bucket_id, name, definition, operation)
-- VALUES ('foto-bukti', 'allow_public_upload', 'true', 'INSERT') ON CONFLICT DO NOTHING;

-- 11. Seed: akun admin default
INSERT INTO petugas (nama, nip, unit, kelurahan, username, password_hash, role, nomor_hp)
VALUES (
  'Administrator Kecamatan',
  NULL,
  'melati',
  'Semua Kelurahan',
  'admin',
  'admin123',
  'admin',
  '081234567890'
) ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- MIGRASI (jika sudah ada data lama):
-- ALTER TABLE petugas ALTER COLUMN nip DROP NOT NULL;
-- ============================================================
