-- ============================================================
-- FIX: Allow anon key access to all tables
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Hapus semua policy lama yang hanya izinkan 'authenticated'
DROP POLICY IF EXISTS "Allow read for authenticated" ON products;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON products;
DROP POLICY IF EXISTS "Allow update for authenticated" ON products;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON products;

DROP POLICY IF EXISTS "Allow read for authenticated" ON transactions;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON transactions;
DROP POLICY IF EXISTS "Allow update for authenticated" ON transactions;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON transactions;

DROP POLICY IF EXISTS "Allow read for authenticated" ON customers;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON customers;
DROP POLICY IF EXISTS "Allow update for authenticated" ON customers;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON customers;

DROP POLICY IF EXISTS "Allow read for authenticated" ON debts;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON debts;
DROP POLICY IF EXISTS "Allow update for authenticated" ON debts;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON debts;

DROP POLICY IF EXISTS "Allow read for authenticated" ON expenses;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON expenses;
DROP POLICY IF EXISTS "Allow update for authenticated" ON expenses;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON expenses;

DROP POLICY IF EXISTS "Allow read for authenticated" ON discounts;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON discounts;
DROP POLICY IF EXISTS "Allow update for authenticated" ON discounts;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON discounts;

DROP POLICY IF EXISTS "Allow read for authenticated" ON activity_logs;
DROP POLICY IF EXISTS "Allow insert for authenticated" ON activity_logs;

-- ============================================================
-- Buat tabel 'users' jika belum ada
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'kasir',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Tambahkan kolom `remaining` di debts jika belum ada
ALTER TABLE debts ADD COLUMN IF NOT EXISTS remaining DECIMAL(12,2) DEFAULT 0;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Tambahkan kolom `updated_at` di products jika belum ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Tambahkan kolom `total_debt` di customers jika belum ada
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_debt DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Tambahkan kolom yg mungkin belum ada di transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Tambahkan kolom yg mungkin belum ada di discounts
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS applicable_to TEXT DEFAULT 'all';
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]';
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS category_ids JSONB DEFAULT '[]';
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ============================================================
-- NONAKTIFKAN RLS pada semua tabel
-- (Kita pakai auth sistem sendiri, bukan Supabase Auth)
-- ============================================================
ALTER TABLE products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers     DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses      DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts     DISABLE ROW LEVEL SECURITY;
ALTER TABLE users         DISABLE ROW LEVEL SECURITY;

-- Nonaktifkan juga activity_logs jika ada
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Seed default admin & kasir (jika belum ada)
-- ============================================================
INSERT INTO users (id, username, password, name, role, created_at)
VALUES
  ('admin-001', 'admin', 'admin123', 'Administrator', 'admin', NOW()),
  ('kasir-001', 'kasir', 'kasir123', 'Kasir',         'kasir', NOW())
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Verifikasi: tampilkan daftar user
-- ============================================================
SELECT id, username, name, role FROM users;
