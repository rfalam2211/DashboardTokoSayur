// ============================================================
// DEBT-NOTIFICATION.JS — Pengingat hutang jatuh tempo
// Cek overdue debts saat startup, tampilkan badge + push notif
// ============================================================

const NOTIF_CHECKED_KEY = 'ida_debt_notif_checked';
const NOTIF_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam

/**
 * Init: cek hutang overdue dan tampilkan peringatan
 */
async function initDebtNotifications() {
    const lastCheck = localStorage.getItem(NOTIF_CHECKED_KEY);
    const now = Date.now();

    // Jangan cek terlalu sering
    if (lastCheck && (now - parseInt(lastCheck)) < NOTIF_CHECK_INTERVAL) {
        console.log('[DebtNotif] Skipping — checked recently');
        return;
    }

    try {
        await checkOverdueDebts();
        localStorage.setItem(NOTIF_CHECKED_KEY, String(now));
    } catch (err) {
        console.warn('[DebtNotif] Error checking debts:', err.message);
    }
}

/**
 * Ambil hutang yang jatuh tempo dan belum lunas
 */
async function checkOverdueDebts() {
    if (!window._supabaseClient) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: debts, error } = await window._supabaseClient
        .from('debts')
        .select('id, customer_name, amount, due_date, status')
        .eq('status', 'pending')
        .lte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(50);

    if (error) {
        // Tabel mungkin belum ada — skip silently
        if (error.code === '42P01') return;
        throw error;
    }

    if (!debts || debts.length === 0) {
        _clearDebtBadge();
        return;
    }

    console.log(`[DebtNotif] ${debts.length} overdue debt(s) found`);

    // Update badge di nav
    _setDebtBadge(debts.length);

    // Tampilkan toast peringatan
    const totalAmount = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
    showToast(
        `⚠️ ${debts.length} hutang sudah jatuh tempo! Total: ${formatCurrency(totalAmount)}`,
        'warning'
    );

    // Kirim push notification jika diizinkan
    await _sendPushNotification(debts);

    return debts;
}

/**
 * Tampilkan badge merah di menu Hutang di sidebar
 */
function _setDebtBadge(count) {
    const navItem = document.querySelector('[data-page="debts"]');
    if (!navItem) return;

    // Hapus badge lama jika ada
    const existing = navItem.querySelector('.debt-badge');
    if (existing) existing.remove();

    const badge = document.createElement('span');
    badge.className = 'debt-badge';
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.title = `${count} hutang jatuh tempo`;
    navItem.appendChild(badge);
}

function _clearDebtBadge() {
    document.querySelectorAll('.debt-badge').forEach(b => b.remove());
}

/**
 * Kirim push notification via Service Worker (jika izin diberikan)
 */
async function _sendPushNotification(debts) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    // Minta izin jika belum
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
    }

    const count = debts.length;
    const names = debts.slice(0, 3).map(d => d.customer_name || 'Pelanggan').join(', ');
    const more = count > 3 ? ` +${count - 3} lainnya` : '';

    // Gunakan Service Worker notification jika tersedia
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                await reg.showNotification('🥬 Ida Buah — Pengingat Hutang', {
                    body: `${count} hutang jatuh tempo: ${names}${more}`,
                    icon: 'icons/icon-192x192.png',
                    badge: 'icons/icon-72x72.png',
                    tag: 'debt-overdue',
                    requireInteraction: false,
                    data: { url: '/#debts' },
                    actions: [
                        { action: 'view', title: '📋 Lihat Hutang' },
                        { action: 'close', title: 'Tutup' }
                    ]
                });
                return;
            }
        } catch (e) {
            console.warn('[DebtNotif] SW notification failed:', e);
        }
    }

    // Fallback ke Notification API biasa
    new Notification('🥬 Ida Buah — Pengingat Hutang', {
        body: `${count} hutang jatuh tempo: ${names}${more}`,
        icon: 'icons/icon-192x192.png',
        tag: 'debt-overdue'
    });
}

/**
 * Minta izin notifikasi secara manual (panggil dari settings/button)
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Browser tidak mendukung notifikasi', 'warning');
        return false;
    }

    if (Notification.permission === 'granted') {
        showToast('Notifikasi sudah diizinkan ✓', 'success');
        return true;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        showToast('✓ Izin notifikasi diberikan!', 'success');
        return true;
    } else {
        showToast('Izin notifikasi ditolak. Ubah di pengaturan browser.', 'warning');
        return false;
    }
}
