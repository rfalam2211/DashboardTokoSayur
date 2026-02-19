-- ============================================================
-- SUPABASE SCHEMA LENGKAP - Ida Groceries POS
-- Jalankan ini di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- 1. BUAT SEMUA TABEL
-- ============================================================

-- Tabel Produk
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT DEFAULT 'lainnya',
  price       DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock       INTEGER DEFAULT 0,
  barcode     TEXT,
  image       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

-- Tabel Transaksi
CREATE TABLE IF NOT EXISTS transactions (
  id             TEXT PRIMARY KEY,
  items          JSONB NOT NULL DEFAULT '[]',
  subtotal       DECIMAL(12,2) DEFAULT 0,
  discount       DECIMAL(12,2) DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  customer_name  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Pelanggan
CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  total_debt DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Tabel Hutang
CREATE TABLE IF NOT EXISTS debts (
  id             TEXT PRIMARY KEY,
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name  TEXT,
  transaction_id TEXT,
  amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid           DECIMAL(12,2) DEFAULT 0,
  remaining      DECIMAL(12,2) DEFAULT 0,
  status         TEXT DEFAULT 'pending',
  due_date       DATE,
  notes          TEXT,
  payments       JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ
);

-- Tabel Pengeluaran
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY,
  date        DATE NOT NULL,
  category    TEXT NOT NULL DEFAULT 'lainnya',
  description TEXT,
  amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Diskon
CREATE TABLE IF NOT EXISTS discounts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT DEFAULT 'percentage',
  value         DECIMAL(12,2) NOT NULL DEFAULT 0,
  applicable_to TEXT DEFAULT 'all',
  product_ids   JSONB DEFAULT '[]',
  category_ids  JSONB DEFAULT '[]',
  active        BOOLEAN DEFAULT true,
  valid_from    TIMESTAMPTZ DEFAULT NOW(),
  valid_to      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Tabel Pengguna (custom auth, bukan Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT DEFAULT 'kasir',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Tabel Log Aktivitas
CREATE TABLE IF NOT EXISTS activity_logs (
  id        TEXT PRIMARY KEY,
  user_id   TEXT,
  user_name TEXT,
  module    TEXT NOT NULL,
  action    TEXT NOT NULL,
  details   JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. NONAKTIFKAN ROW LEVEL SECURITY
--    (Kita pakai custom auth, bukan Supabase Auth)
-- ============================================================

ALTER TABLE products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers     DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses      DISABLE ROW LEVEL SECURITY;
ALTER TABLE discounts     DISABLE ROW LEVEL SECURITY;
ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. BUAT INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode  ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_pm   ON transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_customers_name    ON customers(name);

CREATE INDEX IF NOT EXISTS idx_debts_customer    ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status      ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due         ON debts(due_date);

CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_discounts_active  ON discounts(active);

-- ============================================================
-- 4. SEED DATA DEFAULT
-- ============================================================

-- Default users: admin & kasir
INSERT INTO users (id, username, password, name, role, created_at)
VALUES
  ('default-admin-001', 'admin', 'admin123', 'Administrator', 'admin', NOW()),
  ('default-kasir-001', 'kasir', 'kasir123', 'Kasir',         'kasir', NOW())
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 5. VERIFIKASI - Tampilkan semua tabel yang berhasil dibuat
-- ============================================================

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name
   AND table_schema = 'public') AS jumlah_kolom
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
