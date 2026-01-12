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

        // Initialize database
        await initDB();

        // Seed default users
        await seedDefaultUsers();

        // Load user info
        loadUserInfo();

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

        console.log('Application initialized successfully');

    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Gagal menginisialisasi aplikasi', 'error');
    }
}

/**
 * Load user info to sidebar
 */
function loadUserInfo() {
    if (!currentUser) return;

    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-role').textContent = currentUser.role;
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
            case 'users':
                await initUsers();
                break;
        }
    } catch (error) {
        console.error(`Error initializing ${pageName} page:`, error);
        showToast(`Gagal memuat halaman ${pageName}`, 'error');
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
