// Permissions Management Module

// Define permissions for each role
const PERMISSIONS = {
    admin: {
        dashboard: ['view'],
        products: ['view', 'create', 'edit', 'delete'],
        pos: ['view', 'create'],
        transactions: ['view', 'delete'],
        reports: ['view', 'export'],
        users: ['view', 'create', 'edit', 'delete'],
        discounts: ['view', 'create', 'edit', 'delete'],
        customers: ['view', 'create', 'edit', 'delete'],
        debts: ['view', 'create', 'edit', 'delete', 'payment'],
        expenses: ['view', 'create', 'edit', 'delete'],
        activityLogs: ['view', 'export'],
        settings: ['view', 'edit']
    },
    kasir: {
        dashboard: ['view'],
        products: ['view'],
        pos: ['view', 'create'],
        transactions: ['view'],
        reports: [],
        users: [],
        discounts: [],
        customers: ['view'],
        debts: ['view'],
        expenses: [],
        activityLogs: [],
        settings: []
    }
};

/**
 * Check if current user has permission
 * @param {string} module - Module name
 * @param {string} action - Action to check (view, create, edit, delete)
 * @returns {boolean} True if user has permission
 */
function hasPermission(module, action = 'view') {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        return false;
    }

    // Admin has all permissions
    if (currentUser.role === 'admin') {
        return true;
    }

    // Check role-based permissions
    const rolePermissions = PERMISSIONS[currentUser.role];
    
    if (!rolePermissions || !rolePermissions[module]) {
        return false;
    }

    return rolePermissions[module].includes(action);
}

/**
 * Enforce permission - redirect if no permission
 * @param {string} module - Module name
 * @param {string} action - Action to check
 */
function enforcePermission(module, action = 'view') {
    if (!hasPermission(module, action)) {
        showToast('Anda tidak memiliki izin untuk mengakses fitur ini', 'error');
        navigateToPage('dashboard');
        return false;
    }
    return true;
}

/**
 * Get user permissions for a module
 * @param {string} module - Module name
 * @returns {array} Array of allowed actions
 */
function getUserPermissions(module) {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        return [];
    }

    if (currentUser.role === 'admin') {
        return ['view', 'create', 'edit', 'delete', 'export', 'payment'];
    }

    const rolePermissions = PERMISSIONS[currentUser.role];
    return rolePermissions[module] || [];
}

/**
 * Hide UI elements based on permissions
 */
function applyPermissionUI() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) return;

    // Hide navigation items without permission
    document.querySelectorAll('.nav-item').forEach(item => {
        const page = item.dataset.page;
        if (page && !hasPermission(page, 'view')) {
            item.style.display = 'none';
        }
    });

    // Hide action buttons without permission
    document.querySelectorAll('[data-permission]').forEach(element => {
        const [module, action] = element.dataset.permission.split(':');
        if (!hasPermission(module, action)) {
            element.style.display = 'none';
        }
    });
}
