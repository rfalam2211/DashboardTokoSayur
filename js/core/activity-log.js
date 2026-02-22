// Activity Logging Module

/**
 * Log an activity
 * @param {string} module - Module name (products, users, pos, etc.)
 * @param {string} action - Action performed (create, update, delete, login, logout)
 * @param {object} details - Additional details about the action
 */
async function logActivity(module, action, details = {}) {
    try {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
            console.warn('No user logged in, skipping activity log');
            return;
        }

        const log = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            userName: currentUser.name,
            module: module,
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        };

        await addActivityLog(log);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error - logging should not break the app
    }
}

/**
 * Add activity log to database
 */
function addActivityLog(log) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['activityLogs'], 'readwrite');
        const store = transaction.objectStore('activityLogs');
        const request = store.add(log);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all activity logs
 * @param {object} filters - Optional filters {userId, module, action, startDate, endDate}
 */
function getAllActivityLogs(filters = {}) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['activityLogs'], 'readonly');
        const store = transaction.objectStore('activityLogs');
        const request = store.getAll();

        request.onsuccess = () => {
            let logs = request.result;

            // Apply filters
            if (filters.userId) {
                logs = logs.filter(log => log.userId === filters.userId);
            }
            if (filters.module) {
                logs = logs.filter(log => log.module === filters.module);
            }
            if (filters.action) {
                logs = logs.filter(log => log.action === filters.action);
            }
            if (filters.startDate) {
                logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
            }
            if (filters.endDate) {
                logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
            }

            // Sort by timestamp descending (newest first)
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            resolve(logs);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete old activity logs (older than specified days)
 * @param {number} days - Number of days to keep
 */
async function cleanupOldLogs(days = 90) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const allLogs = await getAllActivityLogs();
        const oldLogs = allLogs.filter(log => new Date(log.timestamp) < cutoffDate);

        const transaction = db.transaction(['activityLogs'], 'readwrite');
        const store = transaction.objectStore('activityLogs');

        for (const log of oldLogs) {
            store.delete(log.id);
        }

        return oldLogs.length;
    } catch (error) {
        console.error('Error cleaning up old logs:', error);
        throw error;
    }
}

/**
 * Export activity logs to CSV
 */
async function exportActivityLogs(filters = {}) {
    try {
        const logs = await getAllActivityLogs(filters);
        
        if (logs.length === 0) {
            showToast('Tidak ada log untuk diekspor', 'warning');
            return;
        }

        // Create CSV content
        const headers = ['Timestamp', 'User', 'Module', 'Action', 'Details'];
        const rows = logs.map(log => [
            formatDateTime(log.timestamp),
            log.userName,
            log.module,
            log.action,
            JSON.stringify(log.details)
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Log berhasil diekspor', 'success');
    } catch (error) {
        console.error('Error exporting logs:', error);
        showToast('Gagal mengekspor log', 'error');
    }
}
