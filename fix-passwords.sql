-- ============================================================
-- FIX LOGIN — Set password SHA-256 yang benar
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- pgcrypto sudah tersedia di Supabase (tidak perlu install)
-- Formula hash: sha256('ida-buah-pos-2026:PASSWORD:salt_v1')
-- ============================================================

-- Fix password admin
UPDATE users 
SET password = encode(
    digest('ida-buah-pos-2026:admin123:salt_v1', 'sha256'),
    'hex'
)
WHERE username = 'admin';

-- Fix password kasir
UPDATE users 
SET password = encode(
    digest('ida-buah-pos-2026:kasir123:salt_v1', 'sha256'),
    'hex'
)
WHERE username = 'kasir';

-- Verifikasi hasilnya (password harus 64 karakter hex)
SELECT 
    username, 
    role,
    LENGTH(password) AS panjang_hash,
    CASE 
        WHEN LENGTH(password) = 64 THEN '✅ SHA-256 OK'
        WHEN password = ''         THEN '❌ Masih kosong'
        ELSE '⚠️ Format lain'
    END AS status
FROM users
ORDER BY role;
