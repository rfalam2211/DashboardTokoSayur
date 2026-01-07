// Main Application Script

// Current active page
let currentPage = 'dashboard';

/**
 * Initialize application
 */
async function initApp() {
    try {
        // Initialize database
        await initDB();

        // Setup navigation
        setupNavigation();

        // Initialize current page
        await navigateToPage('dashboard');

        console.log('Application initialized successfully');

    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Gagal menginisialisasi aplikasi', 'error');
    }
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
            await navigateToPage(page);
        });
    });
}

/**
 * Navigate to a page
 */
async function navigateToPage(pageName) {
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
