// supabase.js - minimal stub
// Inisialisasi sesungguhnya ada di database.js

function initSupabase() {
    // Handled by database.js _db() lazy init
    return typeof window.supabase !== 'undefined';
}

function isSupabaseConfigured() {
    return true;
}

function isOnlineMode() {
    return navigator.onLine && typeof window.supabase !== 'undefined';
}

function getSupabaseClient() {
    return window._supabaseClient || null;
}
