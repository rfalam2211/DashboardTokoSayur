// Authentication Module

// Get bcrypt from CDN (exposed as dcodeIO.bcrypt or window.bcrypt)
const bcrypt = window.dcodeIO?.bcrypt || window.bcrypt;

const SESSION_KEY = 'tokoku_session';

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hash) {
    try {
        return bcrypt.compareSync(password, hash);
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

/**
 * Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
 * @param {string} password - Password string to check
 * @returns {boolean} True if password appears to be hashed
 */
function isPasswordHashed(password) {
    return password && (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$'));
}

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

        // Check if password is hashed
        let passwordMatches = false;

        if (isPasswordHashed(user.password)) {
            // Verify hashed password
            passwordMatches = verifyPassword(password, user.password);
        } else {
            // Legacy plain-text password - compare directly and migrate
            passwordMatches = (user.password === password);

            if (passwordMatches) {
                // Migrate to hashed password
                console.log('Migrating password for user:', username);
                const hashedPassword = hashPassword(password);
                await updateUser(user.id, { ...user, password: hashedPassword });
            }
        }

        if (passwordMatches) {
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
