
/**
 * Toggle mobile sidebar
 */
function toggleSidebar(e) {
    if (e) e.stopPropagation(); // Cegah event bubble ke document listener
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const isOpen = sidebar.classList.contains('active');
    if (isOpen) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    }
}

/**
 * Close sidebar
 */
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

/**
 * Setup mobile menu
 */
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('sidebar');
    const navItems = document.querySelectorAll('.nav-item');

    if (menuBtn) {
        menuBtn.addEventListener('click', toggleSidebar);
    }

    // Klik overlay menutup sidebar
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Klik di luar sidebar menutup sidebar
    document.addEventListener('click', (e) => {
        if (window.innerWidth > 768) return;
        if (!sidebar) return;
        const isOpen = sidebar.classList.contains('active');
        if (!isOpen) return;
        // Tutup jika klik di luar sidebar DAN bukan tombol hamburger
        if (!sidebar.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
            closeSidebar();
        }
    });

    // Klik nav item menutup sidebar di mobile
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Katalog link (bukan nav-item) juga tutup sidebar
    const catalogueLink = document.getElementById('nav-catalogue');
    if (catalogueLink) {
        catalogueLink.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    }
}

// Initialize mobile menu when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileMenu);
} else {
    setupMobileMenu();
}

