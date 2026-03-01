-- ============================================================
-- MIGRASI PASSWORD — Jalankan di Supabase → SQL Editor
-- ============================================================
-- Tujuan: Hapus password plaintext lama dari database.
-- Password baru (SHA-256) akan dibuat otomatis saat user
-- login pertama kali (auto-migration di auth-v2.js).
--
-- PENTING: Setelah menjalankan ini, semua user harus login
-- melalui halaman login.html seperti biasa. Password tidak
-- berubah — hanya formatnya yang akan di-upgrade ke hash.
-- ============================================================

-- 1. Lihat user yang masih punya password plaintext
SELECT id, username, role,
    CASE
        WHEN password ~ '^[0-9a-f]{64}$' THEN '✅ SHA-256'
        WHEN password LIKE '$2%'          THEN '⚠️ bcrypt (lama)'
        ELSE '❌ Plaintext'
    END AS status_password
FROM users
ORDER BY role;

-- 2. Reset semua password yang belum di-hash menjadi string kosong
--    (akan di-upgrade otomatis pada login berikutnya)
UPDATE users
SET password = ''
WHERE password NOT LIKE '$2%'           -- bukan bcrypt
  AND NOT (password ~ '^[0-9a-f]{64}$') -- bukan SHA-256
  AND password != '';                    -- skip yang sudah kosong

-- 3. Verifikasi hasilnya
SELECT id, username, role,
    CASE
        WHEN password = ''              THEN '🔄 Menunggu login untuk diupgrade'
        WHEN password ~ '^[0-9a-f]{64}$' THEN '✅ SHA-256'
        WHEN password LIKE '$2%'          THEN '⚠️ bcrypt'
        ELSE '❌ Masih plaintext'
    END AS status_password
FROM users;
