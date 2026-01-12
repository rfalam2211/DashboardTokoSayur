// Mobile-specific functionality and UI enhancements

let isMobile = false;
let isStandalone = false;

/**
 * Initialize mobile features
 */
function initMobile() {
    detectMobile();
    setupMobileNavigation();
    setupTouchGestures();
    checkPWAInstallation();
    setupPWAInstallPrompt();
}

/**
 * Detect if device is mobile
 */
function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    
    if (isMobile) {
        document.body.classList.add('mobile');
    }
    
    if (isStandalone) {
        document.body.classList.add('pwa-installed');
    }
}

/**
 * Setup mobile navigation (hamburger menu)
 */
function setupMobileNavigation() {
    if (!isMobile) return;

    // Create hamburger button
    const header = document.querySelector('.page-header') || document.querySelector('.main-content');
    if (!header) return;

    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-menu';
    hamburger.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
    hamburger.setAttribute('aria-label', 'Toggle menu');

    // Insert at the beginning of header
    if (header.firstChild) {
        header.insertBefore(hamburger, header.firstChild);
    } else {
        header.appendChild(hamburger);
    }

    const sidebar = document.querySelector('.sidebar');
    
    // Toggle sidebar
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        document.body.classList.toggle('sidebar-open');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
            document.body.classList.remove('sidebar-open');
        }
    });

    // Close sidebar when navigating
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            document.body.classList.remove('sidebar-open');
        });
    });
}

/**
 * Setup touch gestures
 */
function setupTouchGestures() {
    if (!isMobile) return;

    let touchStartX = 0;
    let touchEndX = 0;
    
    const sidebar = document.querySelector('.sidebar');
    
    // Swipe to open/close sidebar
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 100;
        const diff = touchEndX - touchStartX;
        
        // Swipe right from left edge - open sidebar
        if (diff > swipeThreshold && touchStartX < 50) {
            sidebar.classList.add('mobile-open');
            document.body.classList.add('sidebar-open');
        }
        
        // Swipe left - close sidebar
        if (diff < -swipeThreshold && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
            document.body.classList.remove('sidebar-open');
        }
    }
}

/**
 * Check if PWA is installed
 */
function checkPWAInstallation() {
    if (isStandalone) {
        console.log('App is running as PWA');
    } else {
        console.log('App is running in browser');
    }
}

/**
 * Setup PWA install prompt
 */
let deferredPrompt;

function setupPWAInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        
        // Show install button
        showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        hideInstallButton();
        showToast('Aplikasi berhasil diinstal!', 'success');
    });
}

/**
 * Show PWA install button
 */
function showInstallButton() {
    // Create install banner
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.className = 'pwa-install-banner';
    installBanner.innerHTML = `
        <div class="install-banner-content">
            <div class="install-banner-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="install-banner-text">
                <strong>Install Ida Buah</strong>
                <p>Akses lebih cepat dari layar utama</p>
            </div>
            <button class="btn btn-primary btn-sm" id="pwa-install-btn">Install</button>
            <button class="btn btn-text btn-sm" id="pwa-dismiss-btn">×</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // Install button click
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // Clear the deferredPrompt
        deferredPrompt = null;
        hideInstallButton();
    });
    
    // Dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        hideInstallButton();
        // Remember dismissal for 7 days
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });
    
    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
            hideInstallButton();
        }
    }
}

/**
 * Hide PWA install button
 */
function hideInstallButton() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.remove();
    }
}

/**
 * Convert table to card view on mobile
 */
function convertTableToCards(tableId) {
    if (!isMobile) return;
    
    const table = document.getElementById(tableId);
    if (!table) return;
    
    // This is handled via CSS media queries for better performance
    // But we can add additional mobile-specific functionality here if needed
}

/**
 * Setup pull-to-refresh
 */
function setupPullToRefresh() {
    if (!isMobile) return;
    
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    
    const mainContent = document.querySelector('.main-content');
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-to-refresh-indicator';
    refreshIndicator.innerHTML = `
        <svg class="refresh-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Pull to refresh</span>
    `;
    
    mainContent.insertBefore(refreshIndicator, mainContent.firstChild);
    
    mainContent.addEventListener('touchstart', (e) => {
        if (mainContent.scrollTop === 0) {
            startY = e.touches[0].pageY;
            pulling = true;
        }
    }, { passive: true });
    
    mainContent.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        
        currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0 && pullDistance < 100) {
            refreshIndicator.style.transform = `translateY(${pullDistance}px)`;
            refreshIndicator.style.opacity = pullDistance / 100;
        }
    }, { passive: true });
    
    mainContent.addEventListener('touchend', async () => {
        if (!pulling) return;
        
        const pullDistance = currentY - startY;
        
        if (pullDistance > 80) {
            refreshIndicator.classList.add('refreshing');
            
            // Trigger refresh based on current page
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageId = activePage.id;
                await refreshCurrentPage(pageId);
            }
            
            setTimeout(() => {
                refreshIndicator.classList.remove('refreshing');
                refreshIndicator.style.transform = '';
                refreshIndicator.style.opacity = '';
            }, 1000);
        } else {
            refreshIndicator.style.transform = '';
            refreshIndicator.style.opacity = '';
        }
        
        pulling = false;
        startY = 0;
        currentY = 0;
    }, { passive: true });
}

/**
 * Refresh current page data
 */
async function refreshCurrentPage(pageId) {
    try {
        switch(pageId) {
            case 'dashboard-page':
                if (typeof refreshDashboard === 'function') {
                    await refreshDashboard();
                }
                break;
            case 'products-page':
                if (typeof loadProducts === 'function') {
                    await loadProducts();
                }
                break;
            case 'pos-page':
                if (typeof loadPOSProducts === 'function') {
                    await loadPOSProducts();
                }
                break;
            case 'transactions-page':
                if (typeof loadTransactions === 'function') {
                    await loadTransactions();
                }
                break;
            case 'reports-page':
                if (typeof loadReports === 'function') {
                    await loadReports();
                }
                break;
            default:
                console.log('No refresh function for this page');
        }
        showToast('Data diperbarui', 'success');
    } catch (error) {
        console.error('Error refreshing page:', error);
        showToast('Gagal memperbarui data', 'error');
    }
}

/**
 * Optimize images for mobile
 */
function optimizeImagesForMobile() {
    if (!isMobile) return;
    
    // Add loading="lazy" to all images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
}

/**
 * Setup mobile-specific event listeners
 */
function setupMobileEventListeners() {
    // Prevent zoom on double tap for buttons
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.click();
        }, { passive: false });
    });
}

// Initialize mobile features when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobile);
} else {
    initMobile();
}
