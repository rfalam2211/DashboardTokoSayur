// Authentication Module

const SESSION_KEY = 'tokoku_session';

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise} Promise that resolves with user object if successful, null otherwise
 */
async function login(username, password) {
    try {
        const user = await getUserByUsername(username);

        if (!user) {
            return null;
        }

        // In production, use proper password hashing (bcrypt, etc.)
        if (user.password === password) {
            // Create session
            const session = {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                loginTime: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));

            return session;
        }

        return null;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

/**
 * Get current logged in user
 * @returns {Object|null} User session object or null if not logged in
 */
function getCurrentUser() {
    const sessionData = localStorage.getItem(SESSION_KEY);

    if (!sessionData) {
        return null;
    }

    try {
        return JSON.parse(sessionData);
    } catch (error) {
        console.error('Error parsing session data:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * Redirects to login page if not authenticated
 */
function checkAuth() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

/**
 * Check if user has permission for a feature
 * @param {string} feature - Feature name (dashboard, products, pos, transactions, reports)
 * @returns {boolean} True if user has permission
 */
function hasPermission(feature) {
    const user = getCurrentUser();

    if (!user) {
        return false;
    }

    // Admin has access to everything
    if (user.role === 'admin') {
        return true;
    }

    // Kasir only has access to POS and transactions
    if (user.role === 'kasir') {
        return ['pos', 'transactions'].includes(feature);
    }

    return false;
}

/**
 * Get allowed pages for current user
 * @returns {Array} Array of allowed page names
 */
function getAllowedPages() {
    const user = getCurrentUser();

    if (!user) {
        return [];
    }

    if (user.role === 'admin') {
        return ['dashboard', 'products', 'pos', 'transactions', 'reports', 'users'];
    }

    if (user.role === 'kasir') {
        return ['pos', 'transactions'];
    }

    return [];
}
