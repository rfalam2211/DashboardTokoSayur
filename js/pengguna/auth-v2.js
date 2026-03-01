// ============================================================
// AUTH-V2.JS — Authentication Module
// Hashing: SHA-256 via Web Crypto API (built-in browser)
// Tidak perlu library eksternal — berfungsi di semua halaman
// ============================================================

const SESSION_KEY = 'tokoku_session';

// ============================================================
// PASSWORD HASHING — SHA-256 (Web Crypto API)
// ============================================================

/**
 * Hash password menggunakan SHA-256.
 * Menggunakan salt statis + pepper agar lebih aman dari rainbow table.
 * @param {string} password
 * @returns {Promise<string>} hex string hash
 */
async function hashPassword(password) {
    const PEPPER = 'ida-buah-pos-2026'; // app-level secret
    const salted = PEPPER + ':' + password + ':' + 'salt_v1';
    const encoded = new TextEncoder().encode(salted);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifikasi password terhadap hash SHA-256.
 * @param {string} password - password plaintext
 * @param {string} hash - hash yang tersimpan di database
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash) {
    const hashed = await hashPassword(password);
    return hashed === hash;
}

/**
 * Cek apakah password sudah di-hash (SHA-256 = 64 hex chars)
 * atau masih plaintext (termasuk format bcrypt lama $2a$/$2b$)
 * @param {string} password
 * @returns {boolean}
 */
function isPasswordHashed(password) {
    if (!password) return false;
    // SHA-256 menghasilkan tepat 64 karakter hex
    return /^[0-9a-f]{64}$/.test(password);
}

// ============================================================
// LOGIN
// ============================================================

/**
 * Login user.
 * Mendukung migrasi otomatis: jika password di DB masih plaintext
 * atau format bcrypt lama, akan dicocokkan lalu di-upgrade ke SHA-256.
 * @param {string} username
 * @param {string} password - plaintext dari form
 * @returns {Promise<Object|null>} session object jika berhasil, null jika gagal
 */
async function login(username, password) {
    try {
        const user = await getUserByUsername(username);
        if (!user) return null;

        let passwordMatches = false;
        let needsUpgrade = false;

        if (isPasswordHashed(user.password)) {
            // ✅ Password sudah SHA-256 — verifikasi normal
            passwordMatches = await verifyPassword(password, user.password);
        } else {
            // ⚠️ Password masih plaintext atau format bcrypt lama
            // Cocokkan secara langsung untuk migrasi
            const isPlainMatch = (user.password === password);
            const isBcryptMatch = _verifyBcryptFallback(password, user.password);

            passwordMatches = isPlainMatch || isBcryptMatch;
            needsUpgrade = passwordMatches; // tandai untuk di-upgrade
        }

        if (!passwordMatches) return null;

        // 🔄 Upgrade password ke SHA-256 jika masih format lama
        if (needsUpgrade) {
            try {
                const newHash = await hashPassword(password);
                await updateUser(user.id, { password: newHash });
                console.log('[Auth] Password user migrasi ke SHA-256:', username);
            } catch (upgradeErr) {
                // Jangan gagalkan login hanya karena gagal upgrade
                console.warn('[Auth] Gagal upgrade password hash:', upgradeErr);
            }
        }

        // Buat session
        const session = {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;

    } catch (error) {
        console.error('[Auth] Login error:', error);
        return null;
    }
}

/**
 * Fallback untuk password bcrypt lama ($2a$/$2b$)
 * Dicoba hanya jika library bcrypt tersedia di window.
 */
function _verifyBcryptFallback(password, hash) {
    if (!hash || !hash.startsWith('$2')) return false;
    try {
        const bcrypt = window.dcodeIO?.bcrypt || window.bcrypt || null;
        if (!bcrypt) return false;
        return bcrypt.compareSync(password, hash);
    } catch {
        return false;
    }
}

// ============================================================
// SESSION
// ============================================================

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

function getCurrentUser() {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    try {
        return JSON.parse(sessionData);
    } catch {
        return null;
    }
}

function checkAuth() {
    if (!getCurrentUser()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// ============================================================
// PERMISSIONS
// ============================================================

function hasPermission(feature) {
    const user = getCurrentUser();
    if (!user) return false;
    // Admin & Developer punya akses ke semua fitur
    if (user.role === 'admin' || user.role === 'developer') return true;
    if (user.role === 'kasir') {
        return ['pos', 'transactions', 'customers', 'debts'].includes(feature);
    }
    return false;
}

function getAllowedPages() {
    const user = getCurrentUser();
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'developer') {
        return ['dashboard', 'products', 'pos', 'transactions', 'reports',
            'discounts', 'customers', 'debts', 'users'];
    }
    if (user.role === 'kasir') {
        return ['pos', 'transactions', 'customers', 'debts'];
    }
    return [];
}
