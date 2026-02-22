// Offline Sync Module

let syncQueue = [];
let isOnline = navigator.onLine;
let isSyncing = false;

/**
 * Initialize offline sync
 */
function initOfflineSync() {
    // Load sync queue from localStorage
    loadSyncQueue();
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update UI
    updateSyncStatus();
    
    // Sync on init if online
    if (isOnline && syncQueue.length > 0) {
        syncPendingOperations();
    }
}

/**
 * Load sync queue from localStorage
 */
function loadSyncQueue() {
    try {
        const saved = localStorage.getItem('sync_queue');
        if (saved) {
            syncQueue = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading sync queue:', error);
        syncQueue = [];
    }
}

/**
 * Save sync queue to localStorage
 */
function saveSyncQueue() {
    try {
        localStorage.setItem('sync_queue', JSON.stringify(syncQueue));
        updateSyncStatus();
    } catch (error) {
        console.error('Error saving sync queue:', error);
    }
}

/**
 * Add operation to sync queue
 * @param {string} operation - Operation type (create, update, delete)
 * @param {string} store - Object store name
 * @param {object} data - Data to sync
 */
function queueOperation(operation, store, data) {
    const queueItem = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        operation,
        store,
        data,
        timestamp: new Date().toISOString(),
        retries: 0
    };
    
    syncQueue.push(queueItem);
    saveSyncQueue();
    
    console.log('Operation queued for sync:', queueItem);
}

/**
 * Sync pending operations
 */
async function syncPendingOperations() {
    if (isSyncing || syncQueue.length === 0 || !isOnline) {
        return;
    }

    isSyncing = true;
    updateSyncStatus();

    console.log(`Syncing ${syncQueue.length} pending operations...`);

    const failedOperations = [];

    for (const item of syncQueue) {
        try {
            await executeSyncOperation(item);
            console.log('Synced operation:', item.id);
        } catch (error) {
            console.error('Failed to sync operation:', item.id, error);
            item.retries++;
            
            // Keep in queue if retries < 3
            if (item.retries < 3) {
                failedOperations.push(item);
            } else {
                console.error('Operation failed after 3 retries, discarding:', item.id);
            }
        }
    }

    syncQueue = failedOperations;
    saveSyncQueue();
    
    isSyncing = false;
    updateSyncStatus();

    if (syncQueue.length === 0) {
        showToast('Semua data berhasil disinkronkan', 'success');
        await logActivity('system', 'sync_complete', { operations: syncQueue.length });
    } else {
        showToast(`${failedOperations.length} operasi gagal disinkronkan`, 'warning');
    }
}

/**
 * Execute a single sync operation
 * @param {object} item - Queue item
 */
async function executeSyncOperation(item) {
    // In a real implementation, this would sync to a server
    // For now, we just simulate the operation
    
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // Simulate success (90% success rate)
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('Simulated network error'));
            }
        }, 100);
    });
}

/**
 * Handle online event
 */
function handleOnline() {
    console.log('Connection restored');
    isOnline = true;
    updateSyncStatus();
    showToast('Koneksi tersambung kembali', 'success');
    
    // Sync pending operations
    if (syncQueue.length > 0) {
        setTimeout(() => {
            syncPendingOperations();
        }, 1000);
    }
}

/**
 * Handle offline event
 */
function handleOffline() {
    console.log('Connection lost');
    isOnline = false;
    updateSyncStatus();
    showToast('Mode offline - Perubahan akan disinkronkan saat online', 'warning');
}

/**
 * Update sync status UI
 */
function updateSyncStatus() {
    const statusEl = document.getElementById('sync-status');
    const pendingEl = document.getElementById('sync-pending-count');
    
    if (statusEl) {
        if (isOnline) {
            statusEl.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" fill="#10b981"/>
                </svg>
                <span>Online</span>
            `;
            statusEl.className = 'sync-status online';
        } else {
            statusEl.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" fill="#ef4444"/>
                </svg>
                <span>Offline</span>
            `;
            statusEl.className = 'sync-status offline';
        }
    }
    
    if (pendingEl) {
        if (syncQueue.length > 0) {
            pendingEl.textContent = `${syncQueue.length} pending`;
            pendingEl.style.display = 'inline';
        } else {
            pendingEl.style.display = 'none';
        }
    }
}

/**
 * Manual sync trigger
 */
async function manualSync() {
    if (!isOnline) {
        showToast('Tidak dapat sinkronisasi dalam mode offline', 'warning');
        return;
    }
    
    if (syncQueue.length === 0) {
        showToast('Tidak ada data yang perlu disinkronkan', 'info');
        return;
    }
    
    showToast('Memulai sinkronisasi...', 'info');
    await syncPendingOperations();
}

/**
 * Clear sync queue (admin only)
 */
function clearSyncQueue() {
    if (confirm('Hapus semua operasi pending? Tindakan ini tidak dapat dibatalkan.')) {
        syncQueue = [];
        saveSyncQueue();
        showToast('Queue sinkronisasi dikosongkan', 'success');
    }
}

// Initialize on load
initOfflineSync();
