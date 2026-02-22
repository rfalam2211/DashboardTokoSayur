// Auto Backup Module

/**
 * Export all database data to JSON
 */
async function exportAllData() {
    try {
        const data = {
            version: DB_VERSION,
            exportDate: new Date().toISOString(),
            products: await getAllProducts(),
            transactions: await getAllTransactions(),
            expenses: await getAllExpenses(),
            users: await getAllUsers(),
            discounts: await getAllDiscounts(),
            customers: await getAllCustomers(),
            debts: await getAllDebts(),
            activityLogs: await getAllActivityLogs()
        };

        return data;
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
}

/**
 * Import data from JSON
 * @param {object} data - Data to import
 */
async function importAllData(data) {
    try {
        // Validate data structure
        if (!data.version || !data.exportDate) {
            throw new Error('Invalid backup file format');
        }

        // Clear existing data (optional - can be configurable)
        const confirmClear = confirm('Import akan mengganti semua data yang ada. Lanjutkan?');
        if (!confirmClear) return false;

        // Import each store
        if (data.products) {
            for (const item of data.products) {
                await addProduct(item);
            }
        }

        if (data.transactions) {
            for (const item of data.transactions) {
                await addTransaction(item);
            }
        }

        if (data.expenses) {
            for (const item of data.expenses) {
                await addExpense(item);
            }
        }

        if (data.users) {
            for (const item of data.users) {
                await addUser(item);
            }
        }

        if (data.discounts) {
            for (const item of data.discounts) {
                await addDiscount(item);
            }
        }

        if (data.customers) {
            for (const item of data.customers) {
                await addCustomer(item);
            }
        }

        if (data.debts) {
            for (const item of data.debts) {
                await addDebt(item);
            }
        }

        await logActivity('system', 'import_data', { recordCount: Object.keys(data).length });
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
}

/**
 * Create backup file and download
 */
async function createBackup() {
    try {
        showToast('Membuat backup...', 'info');
        
        const data = await exportAllData();
        const jsonString = JSON.stringify(data, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        // Save backup metadata
        const backupHistory = JSON.parse(localStorage.getItem('backup_history') || '[]');
        backupHistory.unshift({
            date: new Date().toISOString(),
            filename: a.download,
            size: blob.size
        });
        
        // Keep only last 10 backups in history
        if (backupHistory.length > 10) {
            backupHistory.length = 10;
        }
        
        localStorage.setItem('backup_history', JSON.stringify(backupHistory));
        localStorage.setItem('last_backup_date', new Date().toISOString());

        await logActivity('system', 'create_backup', { size: blob.size });
        showToast('Backup berhasil dibuat', 'success');
        
        return true;
    } catch (error) {
        console.error('Error creating backup:', error);
        showToast('Gagal membuat backup', 'error');
        return false;
    }
}

/**
 * Restore from backup file
 * @param {File} file - Backup file
 */
async function restoreFromBackup(file) {
    try {
        showToast('Memulihkan data...', 'info');
        
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = await importAllData(data);
                    
                    if (success) {
                        await logActivity('system', 'restore_backup', { filename: file.name });
                        showToast('Data berhasil dipulihkan. Halaman akan dimuat ulang.', 'success');
                        
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                        
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    } catch (error) {
        console.error('Error restoring backup:', error);
        showToast('Gagal memulihkan data', 'error');
        return false;
    }
}

/**
 * Auto backup (scheduled)
 */
async function autoBackup() {
    try {
        const lastBackup = localStorage.getItem('last_backup_date');
        const backupFrequency = localStorage.getItem('backup_frequency') || 'weekly'; // daily, weekly, monthly
        
        if (!lastBackup) {
            // First time - create backup
            return await createBackup();
        }

        const lastBackupDate = new Date(lastBackup);
        const now = new Date();
        const daysSinceBackup = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));

        let shouldBackup = false;

        if (backupFrequency === 'daily' && daysSinceBackup >= 1) {
            shouldBackup = true;
        } else if (backupFrequency === 'weekly' && daysSinceBackup >= 7) {
            shouldBackup = true;
        } else if (backupFrequency === 'monthly' && daysSinceBackup >= 30) {
            shouldBackup = true;
        }

        if (shouldBackup) {
            console.log('Auto backup triggered');
            return await createBackup();
        }

        return false;
    } catch (error) {
        console.error('Error in auto backup:', error);
        return false;
    }
}

/**
 * Get backup history
 */
function getBackupHistory() {
    return JSON.parse(localStorage.getItem('backup_history') || '[]');
}

/**
 * Set backup frequency
 * @param {string} frequency - 'daily', 'weekly', or 'monthly'
 */
function setBackupFrequency(frequency) {
    localStorage.setItem('backup_frequency', frequency);
    showToast(`Frekuensi backup diatur ke ${frequency}`, 'success');
}

// Run auto backup on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        autoBackup();
    }, 5000); // Wait 5 seconds after page load
});
