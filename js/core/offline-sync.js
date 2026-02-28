// ============================================================
// OFFLINE-SYNC.JS — Real Supabase Cloud Sync
// Strategi: queue operasi saat offline, push saat online
// ============================================================

const SYNC_QUEUE_KEY = 'ida_sync_queue_v2';
const SYNC_STATUS_KEY = 'ida_last_sync';

let _syncQueue = [];
let _isSyncing = false;
let _isOnline = navigator.onLine;
let _realtimeChannels = [];

// ============================================================
// INIT
// ============================================================

function initOfflineSync() {
    _loadSyncQueue();
    window.addEventListener('online', _handleOnline);
    window.addEventListener('offline', _handleOffline);
    _updateSyncStatusUI();

    // Auto-sync on init jika ada queue
    if (_isOnline && _syncQueue.length > 0) {
        console.log('[Sync] Found pending operations on init, syncing...');
        setTimeout(syncPendingOperations, 2000);
    }

    // Update last sync display
    _updateLastSyncDisplay();

    console.log('[Sync] Offline sync initialized ✓');
}

// ============================================================
// SUPABASE REALTIME
// ============================================================

/**
 * Subscribe ke realtime updates untuk table tertentu.
 * Panggil ini setelah initDB() selesai.
 */
function initRealtimeSync(tables = ['products', 'transactions']) {
    if (!window._supabaseClient) {
        console.warn('[Realtime] Supabase client belum siap');
        return;
    }

    // Unsubscribe dari channel lama
    _realtimeChannels.forEach(ch => {
        try { window._supabaseClient.removeChannel(ch); } catch { }
    });
    _realtimeChannels = [];

    tables.forEach(table => {
        const channel = window._supabaseClient
            .channel(`realtime-${table}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: table
            }, (payload) => {
                console.log(`[Realtime] ${table} changed:`, payload.eventType);
                _handleRealtimeChange(table, payload);
            })
            .subscribe((status) => {
                console.log(`[Realtime] ${table} subscription status:`, status);
            });

        _realtimeChannels.push(channel);
    });

    console.log('[Realtime] Subscribed to:', tables.join(', '));
}

/**
 * Broadcast ke semua tab: data berubah → refresh halaman yang relevan
 */
function _handleRealtimeChange(table, payload) {
    // Dispatch custom event untuk ditangkap modul yang relevan
    const event = new CustomEvent('supabase-realtime', {
        detail: { table, eventType: payload.eventType, record: payload.new || payload.old }
    });
    window.dispatchEvent(event);

    // Update last sync time
    _setLastSyncNow();
    _updateLastSyncDisplay();
}

/**
 * Stop semua realtime subscriptions
 */
function stopRealtimeSync() {
    _realtimeChannels.forEach(ch => {
        try {
            if (window._supabaseClient) {
                window._supabaseClient.removeChannel(ch);
            }
        } catch (e) {
            console.warn('[Realtime] Error removing channel:', e);
        }
    });
    _realtimeChannels = [];
    console.log('[Realtime] All subscriptions stopped.');
}

// ============================================================
// ONLINE/OFFLINE HANDLERS
// ============================================================

function _handleOnline() {
    console.log('[Sync] Connection restored');
    _isOnline = true;
    _updateSyncStatusUI('syncing');

    // Tunda sebentar untuk memastikan koneksi stabil
    setTimeout(async () => {
        if (_syncQueue.length > 0) {
            console.log(`[Sync] ${_syncQueue.length} pending operations, starting sync...`);
            await syncPendingOperations();
        } else {
            _updateSyncStatusUI('synced');
        }
    }, 1500);
}

function _handleOffline() {
    console.log('[Sync] Connection lost');
    _isOnline = false;
    _updateSyncStatusUI('offline');
}

// ============================================================
// SYNC QUEUE MANAGEMENT
// ============================================================

function _loadSyncQueue() {
    try {
        const saved = localStorage.getItem(SYNC_QUEUE_KEY);
        _syncQueue = saved ? JSON.parse(saved) : [];
    } catch {
        _syncQueue = [];
    }
}

function _saveSyncQueue() {
    try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(_syncQueue));
    } catch (e) {
        console.error('[Sync] Failed to save queue:', e);
    }
    _updateSyncStatusUI();
}

/**
 * Tambahkan operasi ke queue (untuk dieksekusi saat online)
 * @param {string} operation - 'insert' | 'update' | 'delete'
 * @param {string} table - Nama tabel Supabase
 * @param {object} data - Data payload
 * @param {string} [id] - ID record (untuk update/delete)
 */
function queueOperation(operation, table, data, id = null) {
    const item = {
        qid: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        operation,
        table,
        data,
        id,
        timestamp: new Date().toISOString(),
        retries: 0
    };
    _syncQueue.push(item);
    _saveSyncQueue();
    console.log(`[Sync] Queued ${operation} on ${table}:`, item.qid);
    _updateSyncStatusUI('pending');
}

// ============================================================
// SYNC EXECUTION
// ============================================================

async function syncPendingOperations() {
    if (_isSyncing || !_isOnline) return;
    if (_syncQueue.length === 0) {
        _updateSyncStatusUI('synced');
        return;
    }

    _isSyncing = true;
    _updateSyncStatusUI('syncing');
    console.log(`[Sync] Starting sync of ${_syncQueue.length} operations...`);

    const failed = [];

    for (const item of _syncQueue) {
        try {
            await _executeSyncItem(item);
            console.log(`[Sync] ✓ ${item.operation} ${item.table}:`, item.qid);
        } catch (err) {
            console.error(`[Sync] ✗ ${item.operation} ${item.table}:`, err.message);
            item.retries = (item.retries || 0) + 1;
            if (item.retries < 5) {
                failed.push(item);
            } else {
                console.error(`[Sync] Discarding after 5 retries:`, item.qid);
            }
        }
    }

    _syncQueue = failed;
    _isSyncing = false;
    _saveSyncQueue();

    if (_syncQueue.length === 0) {
        _setLastSyncNow();
        _updateSyncStatusUI('synced');
        _updateLastSyncDisplay();
        showToast('✓ Data berhasil disinkronkan ke cloud', 'success');
    } else {
        _updateSyncStatusUI('pending');
        showToast(`⚠ ${failed.length} operasi gagal, akan dicoba lagi`, 'warning');
    }
}

async function _executeSyncItem(item) {
    if (!window._supabaseClient) throw new Error('Supabase belum siap');

    const db = window._supabaseClient;
    let result;

    switch (item.operation) {
        case 'insert':
            result = await db.from(item.table).insert([item.data]);
            break;
        case 'update':
            if (!item.id) throw new Error('Update requires id');
            result = await db.from(item.table).update(item.data).eq('id', item.id);
            break;
        case 'upsert':
            result = await db.from(item.table).upsert([item.data]);
            break;
        case 'delete':
            if (!item.id) throw new Error('Delete requires id');
            result = await db.from(item.table).delete().eq('id', item.id);
            break;
        default:
            throw new Error('Unknown operation: ' + item.operation);
    }

    if (result.error) throw result.error;
    return result.data;
}

// ============================================================
// MANUAL SYNC
// ============================================================

async function manualSync() {
    if (!_isOnline) {
        showToast('Tidak dapat sync — tidak ada koneksi internet', 'warning');
        return;
    }
    if (_syncQueue.length === 0) {
        showToast('✓ Semua data sudah tersinkronkan', 'info');
        _setLastSyncNow();
        _updateLastSyncDisplay();
        return;
    }
    showToast('🔄 Memulai sinkronisasi...', 'info');
    await syncPendingOperations();
}

function clearSyncQueue() {
    if (confirm(`Hapus ${_syncQueue.length} operasi pending?\nData yang belum tersinkronkan akan hilang.`)) {
        _syncQueue = [];
        _saveSyncQueue();
        _updateSyncStatusUI('synced');
        showToast('Queue dibersihkan', 'success');
    }
}

// ============================================================
// SYNC STATUS UI
// ============================================================

/**
 * status: 'synced' | 'syncing' | 'pending' | 'offline'
 */
function _updateSyncStatusUI(status) {
    // Hitung status otomatis kalau tidak disediakan
    if (!status) {
        if (!_isOnline) status = 'offline';
        else if (_isSyncing) status = 'syncing';
        else if (_syncQueue.length > 0) status = 'pending';
        else status = 'synced';
    }

    const el = document.getElementById('sync-status-badge');
    const countEl = document.getElementById('sync-pending-count');
    const btnEl = document.getElementById('btn-manual-sync');

    const config = {
        synced: { text: '☁ Tersinkron', className: 'sync-badge sync-synced', icon: '✓' },
        syncing: { text: '⟳ Menyinkronkan...', className: 'sync-badge sync-syncing', icon: '⟳' },
        pending: { text: '⏸ Menunggu Sync', className: 'sync-badge sync-pending', icon: '!' },
        offline: { text: '✗ Offline', className: 'sync-badge sync-offline', icon: '✗' }
    };
    const c = config[status] || config.synced;

    if (el) {
        el.textContent = c.text;
        el.className = c.className;
    }

    if (countEl) {
        if (_syncQueue.length > 0) {
            countEl.textContent = _syncQueue.length;
            countEl.style.display = 'inline-flex';
        } else {
            countEl.style.display = 'none';
        }
    }

    if (btnEl) {
        btnEl.disabled = _isSyncing || !_isOnline;
        btnEl.title = _isSyncing ? 'Sedang sinkronisasi...' : 'Sync sekarang';
    }
}

function _setLastSyncNow() {
    localStorage.setItem(SYNC_STATUS_KEY, new Date().toISOString());
}

function _updateLastSyncDisplay() {
    const el = document.getElementById('sync-last-time');
    if (!el) return;
    const lastSync = localStorage.getItem(SYNC_STATUS_KEY);
    if (!lastSync) {
        el.textContent = 'Belum pernah sync';
        return;
    }
    const diff = Math.floor((Date.now() - new Date(lastSync).getTime()) / 1000);
    if (diff < 60) el.textContent = 'Baru saja';
    else if (diff < 3600) el.textContent = `${Math.floor(diff / 60)} menit lalu`;
    else if (diff < 86400) el.textContent = `${Math.floor(diff / 3600)} jam lalu`;
    else el.textContent = new Date(lastSync).toLocaleDateString('id-ID');
}

// Update waktu sync setiap menit
setInterval(_updateLastSyncDisplay, 60000);

// ============================================================
// PUBLIC API
// ============================================================

// Expose sebagai object agar mudah diakses dari luar
const OfflineSync = {
    init: initOfflineSync,
    initRealtime: initRealtimeSync,
    stopRealtime: stopRealtimeSync,
    queue: queueOperation,
    sync: syncPendingOperations,
    manual: manualSync,
    clear: clearSyncQueue,
    isOnline: () => _isOnline,
    queueLength: () => _syncQueue.length
};

// Auto-init
initOfflineSync();
