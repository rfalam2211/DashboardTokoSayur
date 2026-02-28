// ============================================================
// UTILS.JS — Shared utility functions
// ============================================================

// ===== CURRENCY & DATE =====

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatDate(date, includeTime = false) {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; }
    return d.toLocaleDateString('id-ID', options);
}

function formatDateShort(date) {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== ID GENERATION =====

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===== XSS PROTECTION =====

function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ===== TOAST NOTIFICATION =====

let _toastTimer = null;

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    clearTimeout(_toastTimer);
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    _toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// ===== FORM VALIDATION =====

function validateForm(form) {
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
        const isEmpty = !input.value || !input.value.trim();
        if (isEmpty) {
            isValid = false;
            input.style.borderColor = 'var(--color-danger)';
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.style.borderColor = '';
            input.removeAttribute('aria-invalid');
        }
    });

    return isValid;
}

// ===== CSV EXPORT =====

function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('Tidak ada data untuk di-export', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data berhasil di-export', 'success');
}

// ===== DATE RANGE =====

function getDateRange(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (period) {
        case 'today':
            return { from: today, to: tomorrow };
        case 'week': {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return { from: weekStart, to: tomorrow };
        }
        case 'month': {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: monthStart, to: tomorrow };
        }
        default:
            return { from: today, to: tomorrow };
    }
}

// ===== DEBOUNCE =====

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ===== BARCODE DISPLAY =====

function formatBarcodeDisplay(barcode) {
    if (!barcode) return '';
    if (barcode.length === 13) return barcode.replace(/(\d{3})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4');
    if (barcode.length === 12) return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    if (barcode.length === 8) return barcode.replace(/(\d{4})(\d{4})/, '$1 $2');
    return barcode;
}

// ===== ONLINE/OFFLINE INDICATOR =====

function initOnlineStatus() {
    const updateStatus = (isOnline) => {
        const indicator = document.getElementById('online-indicator');
        if (!indicator) return;
        indicator.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
        indicator.className = 'online-indicator ' + (isOnline ? 'online' : 'offline');

        if (!isOnline) {
            showToast('Koneksi internet terputus. Data tidak dapat disinkronkan.', 'warning');
        } else {
            showToast('Koneksi internet pulih.', 'success');
        }
    };

    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));
}

// ===== GLOBAL ERROR HANDLER =====

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Utils] Unhandled promise rejection:', event.reason);

    const msg = event.reason?.message || String(event.reason);

    // Tampilkan pesan yang user-friendly
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        showToast('Gagal terhubung ke server. Cek koneksi internet Anda.', 'error');
    } else if (msg.includes('JWT') || msg.includes('auth')) {
        showToast('Sesi Anda telah berakhir. Silakan login ulang.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    }
    // Jangan unmask error teknis ke user
});

// ===== STRING HELPERS =====

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str, maxLength = 30) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}
