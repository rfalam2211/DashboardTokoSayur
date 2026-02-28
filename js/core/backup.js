// ============================================================
// BACKUP.JS — Export/Import/Auto-backup via Supabase Cloud
// ============================================================

const BACKUP_VERSION = '2.0';
const BACKUP_HISTORY_KEY = 'ida_backup_history';
const LAST_BACKUP_KEY = 'ida_last_backup';

// ============================================================
// EXPORT ALL DATA
// ============================================================

async function exportAllData() {
    try {
        const [products, transactions, expenses, users, discounts, customers, debts] =
            await Promise.all([
                getAllProducts(),
                getAllTransactions(),
                getAllExpenses(),
                getAllUsers(),
                getAllDiscounts(),
                getAllCustomers(),
                getAllDebts()
            ]);

        return {
            version: BACKUP_VERSION,
            exportDate: new Date().toISOString(),
            source: 'Supabase Cloud',
            stats: {
                products: products.length,
                transactions: transactions.length,
                expenses: expenses.length,
                customers: customers.length,
                debts: debts.length
            },
            products,
            transactions,
            expenses,
            users,
            discounts,
            customers,
            debts
        };
    } catch (error) {
        console.error('[Backup] exportAllData error:', error);
        throw error;
    }
}

// ============================================================
// CREATE BACKUP (Download JSON)
// ============================================================

async function createBackup() {
    try {
        showToast('📦 Membuat backup...', 'info');

        const data = await exportAllData();
        const json = JSON.stringify(data, null, 2);

        const blob = new Blob([json], { type: 'application/json' });
        const filename = `backup_ida-buah_${new Date().toISOString().slice(0, 10)}_v${BACKUP_VERSION}.json`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        // Simpan history
        const history = _getBackupHistory();
        history.unshift({
            date: new Date().toISOString(),
            filename,
            size: blob.size,
            stats: data.stats
        });
        if (history.length > 15) history.length = 15;
        localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(history));
        localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());

        try { await logActivity('system', 'create_backup', { filename, size: blob.size }); } catch { }

        showToast(`✓ Backup berhasil: ${filename}`, 'success');
        return true;
    } catch (error) {
        console.error('[Backup] createBackup error:', error);
        showToast('Gagal membuat backup: ' + error.message, 'error');
        return false;
    }
}

// ============================================================
// RESTORE FROM BACKUP FILE
// ============================================================

async function restoreFromBackup(file) {
    if (!file) return false;

    try {
        showToast('🔄 Memulihkan data...', 'info');

        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.exportDate) {
            throw new Error('Format file backup tidak valid');
        }

        const success = await importAllData(data);
        if (success) {
            try { await logActivity('system', 'restore_backup', { filename: file.name }); } catch { }
            showToast('✓ Data berhasil dipulihkan. Halaman akan dimuat ulang...', 'success');
            setTimeout(() => window.location.reload(), 2500);
        }
        return success;
    } catch (error) {
        console.error('[Backup] restoreFromBackup error:', error);
        showToast('Gagal memulihkan: ' + error.message, 'error');
        return false;
    }
}

// ============================================================
// IMPORT ALL DATA
// ============================================================

async function importAllData(data) {
    if (!data.version || !data.exportDate) {
        throw new Error('Format backup tidak valid');
    }

    const confirmed = confirm(
        `Import backup dari ${new Date(data.exportDate).toLocaleString('id-ID')}?\n\n` +
        `⚠ Data yang sudah ada TIDAK akan dihapus.\n` +
        `Data baru akan ditambahkan menggunakan upsert.\n\n` +
        `Produk: ${data.stats?.products || '?'} | Transaksi: ${data.stats?.transactions || '?'}`
    );
    if (!confirmed) return false;

    try {
        showToast('⏳ Mengimpor data...', 'info');

        // Gunakan upsert agar tidak duplikat jika data sudah ada
        if (data.products?.length > 0) {
            const { error } = await window._supabaseClient.from('products').upsert(
                data.products.map(p => ({ ...p, created_at: p.created_at || p.createdAt })),
                { onConflict: 'id', ignoreDuplicates: true }
            );
            if (error && error.code !== '23505') console.warn('[Backup] products upsert:', error.message);
        }

        if (data.customers?.length > 0) {
            const { error } = await window._supabaseClient.from('customers').upsert(
                data.customers.map(c => ({ ...c, created_at: c.created_at || c.createdAt })),
                { onConflict: 'id', ignoreDuplicates: true }
            );
            if (error && error.code !== '23505') console.warn('[Backup] customers upsert:', error.message);
        }

        if (data.expenses?.length > 0) {
            const { error } = await window._supabaseClient.from('expenses').upsert(
                data.expenses,
                { onConflict: 'id', ignoreDuplicates: true }
            );
            if (error && error.code !== '23505') console.warn('[Backup] expenses upsert:', error.message);
        }

        if (data.discounts?.length > 0) {
            const { error } = await window._supabaseClient.from('discounts').upsert(
                data.discounts,
                { onConflict: 'id', ignoreDuplicates: true }
            );
            if (error && error.code !== '23505') console.warn('[Backup] discounts upsert:', error.message);
        }

        if (data.debts?.length > 0) {
            const { error } = await window._supabaseClient.from('debts').upsert(
                data.debts,
                { onConflict: 'id', ignoreDuplicates: true }
            );
            if (error && error.code !== '23505') console.warn('[Backup] debts upsert:', error.message);
        }

        // Transaksi terakhir (mungkin ada foreign key)
        if (data.transactions?.length > 0) {
            const { error } = await window._supabaseClient.from('transactions').upsert(
                data.transactions,
                { onConflict: 'id', ignoreDuplicates: true }
            );
            if (error && error.code !== '23505') console.warn('[Backup] transactions upsert:', error.message);
        }

        return true;
    } catch (error) {
        console.error('[Backup] importAllData error:', error);
        throw error;
    }
}

// ============================================================
// AUTO BACKUP (Harian)
// ============================================================

async function autoBackup() {
    try {
        const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
        const freqSetting = localStorage.getItem('ida_backup_frequency') || 'weekly';

        if (!lastBackup) {
            console.log('[Backup] First run — skipping auto backup (manual first)');
            return false; // Jangan auto-backup pertama, biarkan user yang backup pertama kali
        }

        const daysSince = Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86400000);
        const threshold = freqSetting === 'daily' ? 1 : freqSetting === 'monthly' ? 30 : 7;

        if (daysSince >= threshold) {
            console.log(`[Backup] Auto backup triggered (${daysSince} days since last)`);
            return await createBackup();
        }

        console.log(`[Backup] Auto backup skipped (${daysSince}/${threshold} days)`);
        return false;
    } catch (error) {
        console.error('[Backup] autoBackup error:', error);
        return false;
    }
}

// ============================================================
// HELPERS
// ============================================================

function getBackupHistory() {
    return _getBackupHistory();
}

function _getBackupHistory() {
    try {
        return JSON.parse(localStorage.getItem(BACKUP_HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

function setBackupFrequency(frequency) {
    const valid = ['daily', 'weekly', 'monthly'];
    if (!valid.includes(frequency)) return;
    localStorage.setItem('ida_backup_frequency', frequency);
    showToast(`Frekuensi auto-backup diatur ke: ${frequency}`, 'success');
}

function getLastBackupDate() {
    const d = localStorage.getItem(LAST_BACKUP_KEY);
    return d ? new Date(d) : null;
}

// ============================================================
// INIT — Auto backup check (jalankan 10 detik setelah load)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoBackup, 10000);
});
