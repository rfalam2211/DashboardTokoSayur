-- Supabase Database Schema for Ida Buah POS
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Uncategorized',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  barcode TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts Table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT,
  transaction_id UUID REFERENCES transactions(id),
  amount DECIMAL(12,2) NOT NULL,
  paid DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  notes TEXT,
  payments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  payment_method TEXT DEFAULT 'cash',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts Table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'percentage',
  value DECIMAL(12,2) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read all data
CREATE POLICY "Allow read for authenticated" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON debts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON discounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for authenticated" ON activity_logs FOR SELECT TO authenticated USING (true);

-- Policies: Allow authenticated users to insert
CREATE POLICY "Allow insert for authenticated" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON debts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON discounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert for authenticated" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Policies: Allow authenticated users to update
CREATE POLICY "Allow update for authenticated" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated" ON transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated" ON debts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated" ON expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow update for authenticated" ON discounts FOR UPDATE TO authenticated USING (true);

-- Policies: Allow authenticated users to delete
CREATE POLICY "Allow delete for authenticated" ON products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON transactions FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON customers FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON debts FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON expenses FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow delete for authenticated" ON discounts FOR DELETE TO authenticated USING (true);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- ===== DONE =====
-- Copy this SQL and run it in your Supabase SQL Editor
