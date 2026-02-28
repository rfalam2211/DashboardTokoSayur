// ============================================================
// REPORTS MODULE
// ============================================================

let reportData = {
    revenue: 0,
    expenses: 0,
    profit: 0,
    transactions: [],
    expensesList: []
};

let _currentPeriod = 'today';
let _currentDateRange = null;

async function initReports() {
    setupReportsEventListeners();
    await loadReportData('today');
}

function setupReportsEventListeners() {
    const periodEl = document.getElementById('report-period');
    if (periodEl) {
        periodEl.addEventListener('change', (e) => {
            _currentPeriod = e.target.value;
            const customRange = document.getElementById('custom-date-range');
            if (_currentPeriod === 'custom') {
                if (customRange) customRange.style.display = 'flex';
                const today = new Date().toISOString().split('T')[0];
                const fromEl = document.getElementById('report-date-from');
                const toEl = document.getElementById('report-date-to');
                if (fromEl) fromEl.value = today;
                if (toEl) toEl.value = today;
            } else {
                if (customRange) customRange.style.display = 'none';
                loadReportData(_currentPeriod);
            }
        });
    }

    const fromEl = document.getElementById('report-date-from');
    const toEl = document.getElementById('report-date-to');
    if (fromEl) fromEl.addEventListener('change', loadCustomReport);
    if (toEl) toEl.addEventListener('change', loadCustomReport);
}

async function loadReportData(period) {
    try {
        const dateRange = getDateRange(period);
        _currentDateRange = dateRange;

        const [transactions, expenses] = await Promise.all([
            getAllTransactions(dateRange),
            getAllExpenses(dateRange)
        ]);

        reportData.transactions = transactions;
        reportData.expensesList = expenses;
        reportData.revenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
        reportData.expenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        reportData.profit = reportData.revenue - reportData.expenses;

        updateReportUI();
    } catch (err) {
        console.error('[Reports] loadReportData error:', err);
        showToast('Gagal memuat laporan', 'error');
    }
}

async function loadCustomReport() {
    const from = document.getElementById('report-date-from')?.value;
    const to = document.getElementById('report-date-to')?.value;
    if (!from || !to) return;

    const fromDate = new Date(from); fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to); toDate.setHours(23, 59, 59, 999);
    _currentDateRange = { from: fromDate, to: toDate };

    try {
        const [transactions, expenses] = await Promise.all([
            getAllTransactions(_currentDateRange),
            getAllExpenses(_currentDateRange)
        ]);

        reportData.transactions = transactions;
        reportData.expensesList = expenses;
        reportData.revenue = transactions.reduce((s, t) => s + (t.total || 0), 0);
        reportData.expenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        reportData.profit = reportData.revenue - reportData.expenses;

        updateReportUI();
    } catch (err) {
        console.error('[Reports] loadCustomReport error:', err);
        showToast('Gagal memuat laporan', 'error');
    }
}

function updateReportUI() {
    const revenueEl = document.getElementById('total-revenue');
    const expensesEl = document.getElementById('total-expenses');
    const profitEl = document.getElementById('profit-loss');

    if (revenueEl) revenueEl.textContent = formatCurrency(reportData.revenue);
    if (expensesEl) expensesEl.textContent = formatCurrency(reportData.expenses);

    if (profitEl) {
        profitEl.textContent = formatCurrency(reportData.profit);
        profitEl.className = 'report-value ' + (
            reportData.profit > 0 ? 'positive' :
                reportData.profit < 0 ? 'negative' : ''
        );
    }
}

// ============================================================
// EXPORT LAPORAN
// ============================================================

/**
 * Export laporan ke CSV
 */
async function exportReportCSV() {
    try {
        const period = _currentPeriod === 'custom'
            ? `${document.getElementById('report-date-from')?.value}_${document.getElementById('report-date-to')?.value}`
            : _currentPeriod;

        // Gabung transaksi + pengeluaran
        const rows = [
            ...reportData.transactions.map(t => ({
                Tanggal: formatDate(t.created_at || t.date),
                Jenis: 'Penjualan',
                Keterangan: `Transaksi #${t.id}`,
                Pemasukan: t.total || 0,
                Pengeluaran: 0
            })),
            ...reportData.expensesList.map(e => ({
                Tanggal: formatDate(e.created_at || e.date),
                Jenis: 'Pengeluaran',
                Keterangan: e.description || e.category || '—',
                Pemasukan: 0,
                Pengeluaran: e.amount || 0
            }))
        ].sort((a, b) => new Date(a.Tanggal) - new Date(b.Tanggal));

        // Tambah baris summary
        rows.push({ Tanggal: '', Jenis: '', Keterangan: 'TOTAL PEMASUKAN', Pemasukan: reportData.revenue, Pengeluaran: '' });
        rows.push({ Tanggal: '', Jenis: '', Keterangan: 'TOTAL PENGELUARAN', Pemasukan: '', Pengeluaran: reportData.expenses });
        rows.push({ Tanggal: '', Jenis: '', Keterangan: 'LABA/RUGI', Pemasukan: reportData.profit > 0 ? reportData.profit : '', Pengeluaran: reportData.profit < 0 ? Math.abs(reportData.profit) : '' });

        exportToCSV(rows, `laporan_${period}`);
    } catch (err) {
        console.error('[Reports] exportReportCSV error:', err);
        showToast('Gagal export CSV', 'error');
    }
}

/**
 * Export laporan ke PDF via print dialog
 * (Menggunakan browser print-to-PDF — zero dependency)
 */
async function exportReportPDF() {
    try {
        const period = _currentPeriod === 'custom'
            ? `${document.getElementById('report-date-from')?.value} s/d ${document.getElementById('report-date-to')?.value}`
            : { today: 'Hari Ini', week: 'Minggu Ini', month: 'Bulan Ini' }[_currentPeriod] || _currentPeriod;

        const rows = [
            ...reportData.transactions.map(t => ({
                date: formatDate(t.created_at || t.date),
                type: 'Penjualan',
                desc: `Transaksi #${t.id}`,
                income: formatCurrency(t.total || 0),
                expense: '—'
            })),
            ...reportData.expensesList.map(e => ({
                date: formatDate(e.created_at || e.date),
                type: 'Pengeluaran',
                desc: e.description || e.category || '—',
                income: '—',
                expense: formatCurrency(e.amount || 0)
            }))
        ];

        const tableRows = rows.map(r => `
            <tr>
                <td>${r.date}</td>
                <td>${r.type}</td>
                <td>${r.desc}</td>
                <td class="right">${r.income}</td>
                <td class="right">${r.expense}</td>
            </tr>
        `).join('');

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Keuangan — ${period}</title>
    <style>
        @page { margin: 1.5cm; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; color: #10b981; }
        .subtitle { color: #666; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #10b981; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        th.right { text-align: right; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
        td.right { text-align: right; }
        tr:nth-child(even) { background: #f9fafb; }
        .summary { margin-top: 16px; border: 2px solid #10b981; border-radius: 8px; padding: 12px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .summary-row.profit { font-weight: bold; font-size: 13px; color: ${reportData.profit >= 0 ? '#059669' : '#dc2626'}; }
        .footer { margin-top: 20px; font-size: 9px; color: #666; text-align: center; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <h1>🥬 Ida Buah — Laporan Keuangan</h1>
    <div class="subtitle">Periode: ${period} | Dicetak: ${new Date().toLocaleString('id-ID')}</div>
    <table>
        <thead>
            <tr>
                <th>Tanggal</th><th>Jenis</th><th>Keterangan</th>
                <th class="right">Pemasukan</th><th class="right">Pengeluaran</th>
            </tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>
    <div class="summary">
        <div class="summary-row"><span>Total Pemasukan:</span><span>${formatCurrency(reportData.revenue)}</span></div>
        <div class="summary-row"><span>Total Pengeluaran:</span><span>${formatCurrency(reportData.expenses)}</span></div>
        <div class="summary-row profit"><span>${reportData.profit >= 0 ? '✓ Laba Bersih' : '✗ Rugi'}:</span><span>${formatCurrency(Math.abs(reportData.profit))}</span></div>
    </div>
    <div class="footer">Ida Buah POS System © ${new Date().getFullYear()}</div>
    <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=800,height=700');
        if (!win) {
            showToast('Popup diblokir. Izinkan popup untuk export PDF.', 'warning');
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();

        showToast('💡 Pilih "Save as PDF" di dialog print', 'info');
    } catch (err) {
        console.error('[Reports] exportReportPDF error:', err);
        showToast('Gagal export PDF', 'error');
    }
}


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

