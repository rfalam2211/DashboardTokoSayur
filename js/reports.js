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

        // Draw chart
        drawRevenueChart(transactions, expenses);

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
        drawRevenueChart(transactions, expenses);

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

/**
 * Draw revenue chart
 */
function drawRevenueChart(transactions, expenses) {
    const canvas = document.getElementById('revenue-chart');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Group transactions by date
    const revenueByDate = {};
    const expensesByDate = {};

    transactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString('id-ID');
        revenueByDate[date] = (revenueByDate[date] || 0) + t.total;
    });

    expenses.forEach(e => {
        const date = new Date(e.date).toLocaleDateString('id-ID');
        expensesByDate[date] = (expensesByDate[date] || 0) + e.amount;
    });

    // Get all unique dates
    const allDates = [...new Set([...Object.keys(revenueByDate), ...Object.keys(expensesByDate)])].sort();

    if (allDates.length === 0) {
        // Draw empty state
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Tidak ada data untuk ditampilkan', width / 2, height / 2);
        return;
    }

    // Prepare data
    const revenueData = allDates.map(date => revenueByDate[date] || 0);
    const expensesData = allDates.map(date => expensesByDate[date] || 0);

    const maxValue = Math.max(...revenueData, ...expensesData, 1);

    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    const barWidth = (width - padding * 2) / (allDates.length * 2 + 1);
    const chartHeight = height - padding * 2;

    allDates.forEach((date, index) => {
        const x = padding + (index * 2 + 1) * barWidth;
        const revenueHeight = (revenueData[index] / maxValue) * chartHeight;
        const expenseHeight = (expensesData[index] / maxValue) * chartHeight;

        // Revenue bar (green)
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x, height - padding - revenueHeight, barWidth * 0.8, revenueHeight);

        // Expense bar (red)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + barWidth, height - padding - expenseHeight, barWidth * 0.8, expenseHeight);

        // Date label
        if (allDates.length <= 7) {
            ctx.fillStyle = '#6b7280';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(x + barWidth, height - padding + 10);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(date, 0, 0);
            ctx.restore();
        }
    });

    // Draw legend
    const legendY = padding - 10;

    ctx.fillStyle = '#10b981';
    ctx.fillRect(width - 200, legendY, 15, 15);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Pendapatan', width - 180, legendY + 12);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width - 100, legendY, 15, 15);
    ctx.fillStyle = '#374151';
    ctx.fillText('Pengeluaran', width - 80, legendY + 12);
}
