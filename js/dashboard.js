// Dashboard Module

let dashboardData = {
    todaySales: 0,
    totalProducts: 0,
    todayTransactions: 0,
    netProfit: 0
};

/**
 * Initialize dashboard
 */
async function initDashboard() {
    await loadDashboardStats();
    await loadLowStockProducts();
    await loadRecentTransactions();
}

/**
 * Load dashboard statistics
 */
async function loadDashboardStats() {
    try {
        const products = await getAllProducts();
        const dateRange = getDateRange('today');
        const transactions = await getAllTransactions(dateRange);
        const expenses = await getAllExpenses(dateRange);

        // Calculate stats
        dashboardData.totalProducts = products.length;
        dashboardData.todayTransactions = transactions.length;
        dashboardData.todaySales = transactions.reduce((sum, t) => sum + t.total, 0);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        dashboardData.netProfit = dashboardData.todaySales - totalExpenses;

        // Update UI
        document.getElementById('today-sales').textContent = formatCurrency(dashboardData.todaySales);
        document.getElementById('total-products').textContent = dashboardData.totalProducts;
        document.getElementById('today-transactions').textContent = dashboardData.todayTransactions;
        document.getElementById('net-profit').textContent = formatCurrency(dashboardData.netProfit);

        // Update change indicators
        document.getElementById('products-info').textContent = `${products.reduce((sum, p) => sum + p.stock, 0)} Total Stok`;
        document.getElementById('transactions-info').textContent = 'Transaksi';

        const profitChange = document.getElementById('profit-change');
        if (dashboardData.netProfit > 0) {
            profitChange.textContent = '+' + formatCurrency(dashboardData.netProfit);
            profitChange.className = 'stat-change positive';
        } else if (dashboardData.netProfit < 0) {
            profitChange.textContent = formatCurrency(dashboardData.netProfit);
            profitChange.className = 'stat-change negative';
        } else {
            profitChange.textContent = formatCurrency(0);
            profitChange.className = 'stat-change';
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Gagal memuat statistik dashboard', 'error');
    }
}

/**
 * Load products with low stock
 */
async function loadLowStockProducts() {
    try {
        const products = await getAllProducts();
        const lowStockProducts = products.filter(p => p.stock < 10);

        const container = document.getElementById('low-stock-list');
        const badge = document.getElementById('low-stock-count');

        badge.textContent = lowStockProducts.length;

        if (lowStockProducts.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Semua produk memiliki stok yang cukup</p></div>';
            return;
        }

        container.innerHTML = lowStockProducts.map(product => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${product.name}</h4>
                    <p>Stok: ${product.stock}</p>
                </div>
                <span class="badge badge-warning">Rendah</span>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading low stock products:', error);
    }
}

/**
 * Load recent transactions
 */
async function loadRecentTransactions() {
    try {
        const dateRange = getDateRange('today');
        const transactions = await getAllTransactions(dateRange);

        const container = document.getElementById('recent-transactions');

        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Belum ada transaksi hari ini</p></div>';
            return;
        }

        // Show only last 5 transactions
        const recentTransactions = transactions.slice(0, 5);

        container.innerHTML = recentTransactions.map(transaction => {
            const date = new Date(transaction.date);
            const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${formatCurrency(transaction.total)}</h4>
                        <p>${time} • ${transaction.paymentMethod}</p>
                    </div>
                    <span class="badge badge-success">Selesai</span>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    await initDashboard();
}
