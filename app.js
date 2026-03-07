// Main Application Script

// Current active page
let currentPage = 'dashboard';
let currentUser = null;

/**
 * Initialize application
 */
async function initApp() {
    try {
        // Register service worker for PWA
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }

        // Check authentication
        if (!checkAuth()) {
            return;
        }

        // Get current user
        currentUser = getCurrentUser();

        // Initialize Supabase
        if (typeof initSupabase === 'function') {
            initSupabase();
        }

        // initDB is now a no-op stub (Supabase only)
        await initDB();

        // Show Supabase status in sidebar
        _setStatusSupabase();

        // Seed default users if Supabase table is empty
        await seedDefaultUsers();

        // Load user info
        loadUserInfo();

        // Initialize online/offline indicator
        if (typeof initOnlineStatus === 'function') {
            initOnlineStatus();
        }
        // Set initial state
        const indicator = document.getElementById('online-indicator');
        if (indicator) {
            const isOnline = navigator.onLine;
            indicator.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
            indicator.className = 'online-indicator ' + (isOnline ? 'online' : 'offline');
        }

        // Init Supabase Realtime subscriptions (products + transactions)
        if (typeof initRealtimeSync === 'function') {
            setTimeout(() => initRealtimeSync(['products', 'transactions', 'debts']), 1500);
        }

        // Check overdue debts and show notifications (5s delay)
        if (typeof initDebtNotifications === 'function') {
            setTimeout(() => initDebtNotifications(), 5000);
        }

        // Listen for realtime changes → refresh current page if relevant
        window.addEventListener('supabase-realtime', (e) => {
            const { table } = e.detail;
            const refreshMap = {
                products: ['products', 'pos', 'dashboard'],
                transactions: ['transactions', 'dashboard', 'reports'],
                debts: ['debts', 'customers'],
                expenses: ['expenses', 'dashboard', 'reports']
            };
            const pagesToRefresh = refreshMap[table] || [];
            if (pagesToRefresh.includes(currentPage)) {
                console.log(`[Realtime] Auto-refreshing ${currentPage} due to ${table} change`);
                // Re-init the active page silently
                navigateToPage(currentPage).catch(() => { });
            }
        });

        // Setup navigation
        setupNavigation();

        // Setup logout
        setupLogout();

        // Filter navigation based on role
        filterNavigationByRole();

        // Navigate to first allowed page
        const allowedPages = getAllowedPages();
        const firstPage = allowedPages.length > 0 ? allowedPages[0] : 'pos';
        await navigateToPage(firstPage);

        // Initialize number formatting for configured inputs
        if (typeof setupNumberFormatter === 'function') {
            setupNumberFormatter();
        }

        // Initialize custom flatpickr date pickers for elements with .date-picker
        if (typeof flatpickr !== 'undefined') {
            const fpConfig = {
                dateFormat: "Y-m-d",        // Actual value submitted/read
                altInput: true,             // Show an alternate visually pleasing input
                altFormat: "d-m-Y",         // Visual format display
                locale: "id",               // Indonesian language
                allowInput: true            // Allow typing manually
            };

            // Initialize all .date-picker elements first
            flatpickr(".date-picker", fpConfig);

            // Helper function to link "From" and "To" date pickers
            const linkDatePairs = (fromId, toId) => {
                const fromEl = document.getElementById(fromId);
                const toEl = document.getElementById(toId);

                if (fromEl && toEl && fromEl._flatpickr && toEl._flatpickr) {
                    fromEl._flatpickr.set('onChange', function (selectedDates) {
                        if (selectedDates.length > 0) {
                            toEl._flatpickr.set('minDate', selectedDates[0]);
                        } else {
                            toEl._flatpickr.set('minDate', null);
                        }
                    });

                    toEl._flatpickr.set('onChange', function (selectedDates) {
                        if (selectedDates.length > 0) {
                            fromEl._flatpickr.set('maxDate', selectedDates[0]);
                        } else {
                            fromEl._flatpickr.set('maxDate', null);
                        }
                    });
                }
            };

            // Link date ranges for safety
            linkDatePairs('filter-date-from', 'filter-date-to');       // Halaman Transaksi
            linkDatePairs('report-date-from', 'report-date-to');       // Halaman Laporan
            linkDatePairs('discount-valid-from', 'discount-valid-to'); // Halaman Diskon
        }

        console.log('Application initialized successfully (Supabase Cloud + Realtime)');

    } catch (error) {
        console.error('Error initializing application:', error);
        const msg = error?.message || '';
        if (msg.includes('fetch') || msg.includes('network') || !navigator.onLine) {
            showToast('Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.', 'warning');
        } else {
            showToast('Gagal menginisialisasi aplikasi: ' + msg, 'error');
        }
    }
}


/**
 * Load user info to sidebar
 */
function loadUserInfo() {
    if (!currentUser) return;

    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('sidebar-user-role').textContent = currentUser.role;
}

/**
 * Set sidebar status to always show Supabase Cloud
 */
function _setStatusSupabase() {
    const dot = document.querySelector('.status-dot');
    const label = document.querySelector('.offline-indicator span');
    if (dot) dot.style.backgroundColor = '#10b981'; // green
    if (label) label.textContent = '☁️ Supabase Cloud';
}


/**
 * Setup logout button
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    const closeLogoutModal = document.getElementById('close-logout-modal');

    if (logoutBtn) {
        // Show modal when logout button is clicked
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            logoutModal.classList.add('active');
        });
        console.log('Logout button event listener attached');
    } else {
        console.error('Logout button not found');
    }

    // Confirm logout
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('active');
            logout();
        });
    }

    // Cancel logout - close modal
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('active');
        });
    }

    // Close modal with X button
    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', () => {
            logoutModal.classList.remove('active');
        });
    }
}


/**
 * Filter navigation items based on user role
 */
function filterNavigationByRole() {
    const allowedPages = getAllowedPages();
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const page = item.dataset.page;
        // Lewati link eksternal (tidak punya data-page), misal: Katalog Publik
        if (!page) return;
        if (!allowedPages.includes(page)) {
            item.classList.add('hidden');
        }
    });
}

/**
 * Setup navigation event listeners
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        // Lewati link eksternal (tidak punya data-page) — biarkan browser
        // buka di tab baru sesuai target="_blank"
        if (!item.dataset.page) return;

        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const page = item.dataset.page;

            // Check permission
            if (!hasPermission(page)) {
                showToast('Anda tidak memiliki akses ke halaman ini', 'warning');
                return;
            }

            await navigateToPage(page);
        });
    });
}

/**
 * Navigate to a page
 */
async function navigateToPage(pageName) {
    // Check permission
    if (!hasPermission(pageName)) {
        showToast('Anda tidak memiliki akses ke halaman ini', 'warning');
        return;
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    // Initialize page-specific functionality
    currentPage = pageName;

    try {
        switch (pageName) {
            case 'dashboard':
                await initDashboard();
                break;
            case 'products':
                await initProducts();
                break;
            case 'pos':
                await initPOS();
                break;
            case 'transactions':
                await initTransactions();
                break;
            case 'reports':
                await initReports();
                break;
            case 'discounts':
                await initDiscounts();
                break;
            case 'customers':
                await initCustomers();
                break;
            case 'debts':
                await initDebts();
                break;
            case 'expenses':
                await initExpenses();
                break;
            case 'users':
                await initUsers();
                break;
        }
    } catch (error) {
        console.error(`Error initializing ${pageName} page:`, error);
        const msg = error?.message || '';
        let userMsg = `Gagal memuat halaman. `;
        if (msg.includes('fetch') || msg.includes('NetworkError') || !navigator.onLine) {
            userMsg += 'Cek koneksi internet Anda.';
        } else if (msg.includes('JWT') || msg.includes('auth')) {
            userMsg += 'Sesi berakhir, silakan login ulang.';
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
            userMsg += msg.substring(0, 80);
        }
        showToast(userMsg, 'error');
    }
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
