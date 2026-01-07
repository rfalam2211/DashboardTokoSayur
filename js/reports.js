// Reports Module

let reportData = {
    revenue: 0,
    expenses: 0,
    profit: 0
};

/**
 * Initialize reports page
 */
async function initReports() {
    setupReportsEventListeners();
    await loadReportData('today');
}

/**
 * Setup event listeners for reports page
 */
function setupReportsEventListeners() {
    // Period selector
    document.getElementById('report-period').addEventListener('change', (e) => {
        const period = e.target.value;
        const customDateRange = document.getElementById('custom-date-range');

        if (period === 'custom') {
            customDateRange.style.display = 'flex';

            // Set default custom dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('report-date-from').value = today;
            document.getElementById('report-date-to').value = today;
        } else {
            customDateRange.style.display = 'none';
            loadReportData(period);
        }
    });

    // Custom date range
    document.getElementById('report-date-from').addEventListener('change', loadCustomReport);
    document.getElementById('report-date-to').addEventListener('change', loadCustomReport);
}

/**
 * Load report data for period
 */
async function loadReportData(period) {
    try {
        const dateRange = getDateRange(period);

        const transactions = await getAllTransactions(dateRange);
        const expenses = await getAllExpenses(dateRange);

        // Calculate totals
        reportData.revenue = transactions.reduce((sum, t) => sum + t.total, 0);
        reportData.expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        reportData.profit = reportData.revenue - reportData.expenses;

        // Update UI
        updateReportUI();

    } catch (error) {
        console.error('Error loading report data:', error);
        showToast('Gagal memuat laporan', 'error');
    }
}

/**
 * Load custom report
 */
async function loadCustomReport() {
    const fromDate = document.getElementById('report-date-from').value;
    const toDate = document.getElementById('report-date-to').value;

    if (!fromDate || !toDate) return;

    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    try {
        const transactions = await getAllTransactions({ from, to });
        const expenses = await getAllExpenses({ from, to });

        reportData.revenue = transactions.reduce((sum, t) => sum + t.total, 0);
        reportData.expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        reportData.profit = reportData.revenue - reportData.expenses;

        updateReportUI();

    } catch (error) {
        console.error('Error loading custom report:', error);
        showToast('Gagal memuat laporan', 'error');
    }
}

/**
 * Update report UI
 */
function updateReportUI() {
    document.getElementById('total-revenue').textContent = formatCurrency(reportData.revenue);
    document.getElementById('total-expenses').textContent = formatCurrency(reportData.expenses);

    const profitElement = document.getElementById('profit-loss');
    profitElement.textContent = formatCurrency(reportData.profit);

    if (reportData.profit > 0) {
        profitElement.className = 'report-value positive';
    } else if (reportData.profit < 0) {
        profitElement.className = 'report-value negative';
    } else {
        profitElement.className = 'report-value';
    }
}

