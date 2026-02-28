// ============================================================
// ACTIVITY-LOG.JS — Activity logging via Supabase
// Catatan: tabel 'activity_logs' harus ada di Supabase.
// Jika tabel belum ada, log akan disimpan di localStorage saja.
// ============================================================

const _LOG_LOCAL_KEY = 'ida_activity_logs_local';
const _LOG_MAX_LOCAL = 200; // Max log disimpan di localStorage

/**
 * Log sebuah aktivitas pengguna.
 * Tidak akan throw error — logging tidak boleh break aplikasi.
 */
async function logActivity(module, action, details = {}) {
    try {
        const currentUser = getCurrentUser?.();
        const log = {
            id: 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 7),
            user_id: currentUser?.id || null,
            user_name: currentUser?.name || 'System',
            module,
            action,
            details: typeof details === 'object' ? JSON.stringify(details) : String(details),
            created_at: new Date().toISOString()
        };

        // Simpan ke Supabase jika tersedia
        if (window._supabaseClient) {
            const { error } = await window._supabaseClient
                .from('activity_logs')
                .insert([log]);

            if (error) {
                // Tabel mungkin belum ada — fallback ke localStorage
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    console.info('[ActivityLog] Tabel activity_logs belum ada, fallback ke localStorage');
                    _saveLogLocal(log);
                } else {
                    console.warn('[ActivityLog] Gagal log ke Supabase:', error.message);
                    _saveLogLocal(log);
                }
            }
        } else {
            // Simpan ke localStorage sebagai fallback
            _saveLogLocal(log);
        }
    } catch (err) {
        // Never throw — logging is best-effort
        console.warn('[ActivityLog] Error:', err.message);
    }
}

/**
 * Simpan log ke localStorage sebagai fallback
 */
function _saveLogLocal(log) {
    try {
        const existing = JSON.parse(localStorage.getItem(_LOG_LOCAL_KEY) || '[]');
        existing.unshift(log);
        if (existing.length > _LOG_MAX_LOCAL) existing.length = _LOG_MAX_LOCAL;
        localStorage.setItem(_LOG_LOCAL_KEY, JSON.stringify(existing));
    } catch {
        // ignore storage errors
    }
}

/**
 * Ambil semua activity logs (dari Supabase atau localStorage)
 */
async function getAllActivityLogs(filters = {}) {
    try {
        if (window._supabaseClient) {
            let query = window._supabaseClient
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);

            if (filters.userId) query = query.eq('user_id', filters.userId);
            if (filters.module) query = query.eq('module', filters.module);
            if (filters.action) query = query.eq('action', filters.action);
            if (filters.startDate) query = query.gte('created_at', filters.startDate);
            if (filters.endDate) query = query.lte('created_at', filters.endDate);

            const { data, error } = await query;

            if (error) {
                // Tabel belum ada → kembalikan dari localStorage
                if (error.code === '42P01') {
                    return _getLogsLocal(filters);
                }
                throw error;
            }

            return data.map(l => ({
                ...l,
                userId: l.user_id,
                userName: l.user_name,
                timestamp: l.created_at,
                details: _parseDetails(l.details)
            }));
        }

        return _getLogsLocal(filters);
    } catch (err) {
        console.error('[ActivityLog] getAllActivityLogs error:', err);
        return _getLogsLocal(filters);
    }
}

function _getLogsLocal(filters = {}) {
    try {
        let logs = JSON.parse(localStorage.getItem(_LOG_LOCAL_KEY) || '[]');
        if (filters.module) logs = logs.filter(l => l.module === filters.module);
        if (filters.action) logs = logs.filter(l => l.action === filters.action);
        return logs;
    } catch {
        return [];
    }
}

function _parseDetails(details) {
    if (!details) return {};
    if (typeof details === 'object') return details;
    try { return JSON.parse(details); } catch { return { raw: details }; }
}

/**
 * Hapus log lama (lebih dari N hari) dari Supabase
 */
async function cleanupOldLogs(days = 90) {
    try {
        if (!window._supabaseClient) return 0;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const { data, error } = await window._supabaseClient
            .from('activity_logs')
            .delete()
            .lt('created_at', cutoff.toISOString())
            .select();

        if (error) {
            if (error.code === '42P01') return 0; // tabel belum ada
            throw error;
        }

        console.log(`[ActivityLog] Deleted ${data?.length || 0} old logs`);
        return data?.length || 0;
    } catch (err) {
        console.error('[ActivityLog] cleanupOldLogs error:', err);
        return 0;
    }
}

/**
 * Export activity logs ke CSV
 */
async function exportActivityLogs(filters = {}) {
    try {
        const logs = await getAllActivityLogs(filters);

        if (logs.length === 0) {
            showToast('Tidak ada log untuk diekspor', 'warning');
            return;
        }

        const headers = ['Timestamp', 'User', 'Module', 'Action', 'Details'];
        const rows = logs.map(log => [
            log.created_at || log.timestamp || '',
            log.user_name || log.userName || '',
            log.module || '',
            log.action || '',
            typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`${logs.length} log berhasil diekspor`, 'success');
    } catch (err) {
        console.error('[ActivityLog] exportActivityLogs error:', err);
        showToast('Gagal mengekspor log', 'error');
    }
}

/**
 * Flush log lokal ke Supabase 
 * (panggil ini saat kembali online)
 */
async function flushLocalLogs() {
    if (!window._supabaseClient) return;

    const localLogs = _getLogsLocal();
    if (localLogs.length === 0) return;

    try {
        const { error } = await window._supabaseClient
            .from('activity_logs')
            .upsert(localLogs, { onConflict: 'id', ignoreDuplicates: true });

        if (!error) {
            localStorage.removeItem(_LOG_LOCAL_KEY);
            console.log(`[ActivityLog] Flushed ${localLogs.length} local logs to Supabase`);
        }
    } catch (err) {
        console.warn('[ActivityLog] flushLocalLogs failed:', err.message);
    }
}

// Flush local logs saat online kembali
window.addEventListener('online', () => {
    setTimeout(flushLocalLogs, 3000);
});
