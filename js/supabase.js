// ============================================================
// SUPABASE CLIENT
// PENTING: variabel client disimpan sebagai `supabaseClient`
//          agar tidak bentrok dengan `window.supabase` dari CDN
// ============================================================

const SUPABASE_URL = 'https://rnpvfhllrmdwgoxpmapr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucHZmaGxscm1kd2dveHBtYXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDk2MDUsImV4cCI6MjA4NDM4NTYwNX0.9-PufKDfndh6GTlvR756_n_92mVOOYuC0r3qbS4n3Nk';

// Client instance — pakai nama berbeda dari window.supabase (CDN)
let supabaseClient = null;

/**
 * Inisialisasi Supabase client.
 * Dipanggil dari app.js dan login.html sebelum operasi DB.
 */
function initSupabase() {
    try {
        // window.supabase adalah CDN library object (bukan client)
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[Supabase] Client initialized ✓');
            return true;
        } else {
            console.warn('[Supabase] Library not loaded');
            return false;
        }
    } catch (e) {
        console.error('[Supabase] Init error:', e);
        return false;
    }
}

/**
 * Cek apakah credentials terisi
 */
function isSupabaseConfigured() {
    return SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY.startsWith('eyJ');
}

/**
 * Cek apakah Supabase siap dipakai
 */
function isOnlineMode() {
    return supabaseClient !== null && navigator.onLine;
}

/**
 * Kembalikan client instance (dipakai oleh database.js)
 */
function getSupabaseClient() {
    return supabaseClient;
}
