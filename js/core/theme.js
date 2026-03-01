// ============================================================
// THEME.JS — Dark / Light Mode Toggle
// Persists user preference in localStorage, respects prefers-color-scheme
// ============================================================

const THEME_KEY = 'ida_theme';

/**
 * Initialize theme on page load.
 * Reads localStorage first, then falls back to system preference.
 */
function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
        _applyDark(false); // no animation on first load
    } else if (saved === 'light') {
        _applyLight(false);
    } else {
        // Follow OS preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            _applyDark(false);
        }
    }

    // Listen for OS theme changes (if user hasn't set a preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            e.matches ? _applyDark() : _applyLight();
        }
    });

    _updateToggleUI();
}

/**
 * Toggle between dark and light
 */
function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        _applyLight();
        localStorage.setItem(THEME_KEY, 'light');
    } else {
        _applyDark();
        localStorage.setItem(THEME_KEY, 'dark');
    }
}

function _applyDark(animate = true) {
    if (!animate) document.body.style.transition = 'none';
    document.body.classList.add('dark-mode');
    if (!animate) setTimeout(() => { document.body.style.transition = ''; }, 50);
    _updateToggleUI(true);
}

function _applyLight(animate = true) {
    if (!animate) document.body.style.transition = 'none';
    document.body.classList.remove('dark-mode');
    if (!animate) setTimeout(() => { document.body.style.transition = ''; }, 50);
    _updateToggleUI(false);
}

function _updateToggleUI(isDark) {
    const btn = document.getElementById('theme-toggle-btn');
    const icon = document.getElementById('theme-toggle-icon');
    const label = document.getElementById('theme-toggle-label');

    const dark = isDark ?? document.body.classList.contains('dark-mode');

    if (btn) btn.title = dark ? 'Ganti ke rang' : 'Ganti ke Mode Gelap';
    if (icon) icon.textContent = dark ? '☀️' : '🌙';
    if (label) label.textContent = dark ? 'rang' : 'Mode Gelap';
}

// Auto-init immediately so there's no flash
initTheme();
