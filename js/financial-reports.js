// Financial Reports Module

/**
 * Generate Cash Flow Report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 */
async function generateCashFlowReport(startDate, endDate) {
    try {
        // Get transactions (income)
        const transactions = await getAllTransactions({ start: startDate, end: endDate });
        const cashTransactions = transactions.filter(t => t.paymentMethod !== 'credit');
        const totalIncome = cashTransactions.reduce((sum, t) => sum + t.total, 0);

        // Get expenses (outflow)
        const expenses = await getAllExpenses({ start: startDate, end: endDate });
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculate net cash flow
        const netCashFlow = totalIncome - totalExpenses;

        return {
            period: { start: startDate, end: endDate },
            income: {
                total: totalIncome,
                transactions: cashTransactions.length
            },
            expenses: {
                total: totalExpenses,
                count: expenses.length,
                byCategory: groupExpensesByCategory(expenses)
            },
            netCashFlow: netCashFlow,
            status: netCashFlow >= 0 ? 'positive' : 'negative'
        };
    } catch (error) {
        console.error('Error generating cash flow report:', error);
        throw error;
    }
}

/**
 * Generate Profit & Loss Statement
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 */
async function generateProfitLossStatement(startDate, endDate) {
    try {
        // Revenue (all transactions including credit)
        const transactions = await getAllTransactions({ start: startDate, end: endDate });
        const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalDiscount = transactions.reduce((sum, t) => sum + (t.discount || 0), 0);

        // Cost of Goods Sold (COGS) - simplified calculation
        // In real scenario, track purchase cost per product
        const grossRevenue = totalRevenue + totalDiscount;
        const estimatedCOGS = grossRevenue * 0.6; // Assume 60% COGS, 40% margin

        // Gross Profit
        const grossProfit = totalRevenue - estimatedCOGS;

        // Operating Expenses
        const expenses = await getAllExpenses({ start: startDate, end: endDate });
        const operatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Net Profit
        const netProfit = grossProfit - operatingExpenses;

        return {
            period: { start: startDate, end: endDate },
            revenue: {
                gross: grossRevenue,
                discounts: totalDiscount,
                net: totalRevenue
            },
            cogs: estimatedCOGS,
            grossProfit: grossProfit,
            grossProfitMargin: (grossProfit / totalRevenue * 100).toFixed(2),
            operatingExpenses: {
                total: operatingExpenses,
                byCategory: groupExpensesByCategory(expenses)
            },
            netProfit: netProfit,
            netProfitMargin: (netProfit / totalRevenue * 100).toFixed(2)
        };
    } catch (error) {
        console.error('Error generating P&L statement:', error);
        throw error;
    }
}

/**
 * Group expenses by category
 */
function groupExpensesByCategory(expenses) {
    const grouped = {};
    
    expenses.forEach(expense => {
        if (!grouped[expense.category]) {
            grouped[expense.category] = 0;
        }
        grouped[expense.category] += expense.amount;
    });

    return grouped;
}

/**
 * Display Cash Flow Report
 */
async function displayCashFlowReport() {
    const startDate = document.getElementById('cashflow-start-date')?.value;
    const endDate = document.getElementById('cashflow-end-date')?.value;

    if (!startDate || !endDate) {
        showToast('Pilih periode laporan', 'warning');
        return;
    }

    try {
        const report = await generateCashFlowReport(startDate, endDate);
        const container = document.getElementById('cashflow-report-content');

        if (!container) return;

        container.innerHTML = `
            <div class="report-summary">
                <h3>Laporan Arus Kas</h3>
                <p class="report-period">Periode: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
                
                <div class="report-section">
                    <h4>Pemasukan (Cash)</h4>
                    <div class="report-item">
                        <span>Total Pemasukan:</span>
                        <span class="text-success">${formatCurrency(report.income.total)}</span>
                    </div>
                    <div class="report-item">
                        <span>Jumlah Transaksi:</span>
                        <span>${report.income.transactions}</span>
                    </div>
                </div>

                <div class="report-section">
                    <h4>Pengeluaran</h4>
                    <div class="report-item">
                        <span>Total Pengeluaran:</span>
                        <span class="text-danger">${formatCurrency(report.expenses.total)}</span>
                    </div>
                    <div class="report-item">
                        <span>Jumlah Pengeluaran:</span>
                        <span>${report.expenses.count}</span>
                    </div>
                    ${Object.entries(report.expenses.byCategory).map(([cat, amount]) => `
                        <div class="report-item sub-item">
                            <span>${cat}:</span>
                            <span>${formatCurrency(amount)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="report-section highlight">
                    <h4>Arus Kas Bersih</h4>
                    <div class="report-item">
                        <span>Net Cash Flow:</span>
                        <span class="${report.status === 'positive' ? 'text-success' : 'text-danger'}">
                            ${formatCurrency(report.netCashFlow)}
                        </span>
                    </div>
                </div>
            </div>
        `;

        showToast('Laporan berhasil dibuat', 'success');
    } catch (error) {
        console.error('Error displaying cash flow report:', error);
        showToast('Gagal membuat laporan', 'error');
    }
}

/**
 * Display Profit & Loss Statement
 */
async function displayProfitLossStatement() {
    const startDate = document.getElementById('pl-start-date')?.value;
    const endDate = document.getElementById('pl-end-date')?.value;

    if (!startDate || !endDate) {
        showToast('Pilih periode laporan', 'warning');
        return;
    }

    try {
        const report = await generateProfitLossStatement(startDate, endDate);
        const container = document.getElementById('pl-report-content');

        if (!container) return;

        container.innerHTML = `
            <div class="report-summary">
                <h3>Laporan Laba Rugi</h3>
                <p class="report-period">Periode: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
                
                <div class="report-section">
                    <h4>Pendapatan</h4>
                    <div class="report-item">
                        <span>Pendapatan Kotor:</span>
                        <span>${formatCurrency(report.revenue.gross)}</span>
                    </div>
                    <div class="report-item">
                        <span>Diskon:</span>
                        <span class="text-danger">-${formatCurrency(report.revenue.discounts)}</span>
                    </div>
                    <div class="report-item strong">
                        <span>Pendapatan Bersih:</span>
                        <span>${formatCurrency(report.revenue.net)}</span>
                    </div>
                </div>

                <div class="report-section">
                    <h4>Harga Pokok Penjualan (HPP)</h4>
                    <div class="report-item">
                        <span>HPP:</span>
                        <span class="text-danger">-${formatCurrency(report.cogs)}</span>
                    </div>
                </div>

                <div class="report-section highlight">
                    <h4>Laba Kotor</h4>
                    <div class="report-item">
                        <span>Gross Profit:</span>
                        <span class="text-success">${formatCurrency(report.grossProfit)}</span>
                    </div>
                    <div class="report-item">
                        <span>Margin:</span>
                        <span>${report.grossProfitMargin}%</span>
                    </div>
                </div>

                <div class="report-section">
                    <h4>Beban Operasional</h4>
                    <div class="report-item">
                        <span>Total Beban:</span>
                        <span class="text-danger">-${formatCurrency(report.operatingExpenses.total)}</span>
                    </div>
                    ${Object.entries(report.operatingExpenses.byCategory).map(([cat, amount]) => `
                        <div class="report-item sub-item">
                            <span>${cat}:</span>
                            <span>${formatCurrency(amount)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="report-section highlight">
                    <h4>Laba Bersih</h4>
                    <div class="report-item">
                        <span>Net Profit:</span>
                        <span class="${report.netProfit >= 0 ? 'text-success' : 'text-danger'}">
                            ${formatCurrency(report.netProfit)}
                        </span>
                    </div>
                    <div class="report-item">
                        <span>Margin:</span>
                        <span>${report.netProfitMargin}%</span>
                    </div>
                </div>
            </div>
        `;

        showToast('Laporan berhasil dibuat', 'success');
    } catch (error) {
        console.error('Error displaying P&L statement:', error);
        showToast('Gagal membuat laporan', 'error');
    }
}

/**
 * Export report to CSV
 */
async function exportFinancialReport(reportType) {
    try {
        let csvContent = '';
        const filename = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

        if (reportType === 'cashflow') {
            const startDate = document.getElementById('cashflow-start-date')?.value;
            const endDate = document.getElementById('cashflow-end-date')?.value;
            const report = await generateCashFlowReport(startDate, endDate);

            csvContent = `Laporan Arus Kas\nPeriode,${startDate} - ${endDate}\n\n`;
            csvContent += `Kategori,Jumlah\n`;
            csvContent += `Pemasukan,${report.income.total}\n`;
            csvContent += `Pengeluaran,${report.expenses.total}\n`;
            csvContent += `Arus Kas Bersih,${report.netCashFlow}\n`;
        } else if (reportType === 'pl') {
            const startDate = document.getElementById('pl-start-date')?.value;
            const endDate = document.getElementById('pl-end-date')?.value;
            const report = await generateProfitLossStatement(startDate, endDate);

            csvContent = `Laporan Laba Rugi\nPeriode,${startDate} - ${endDate}\n\n`;
            csvContent += `Kategori,Jumlah\n`;
            csvContent += `Pendapatan Bersih,${report.revenue.net}\n`;
            csvContent += `HPP,${report.cogs}\n`;
            csvContent += `Laba Kotor,${report.grossProfit}\n`;
            csvContent += `Beban Operasional,${report.operatingExpenses.total}\n`;
            csvContent += `Laba Bersih,${report.netProfit}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Laporan berhasil diekspor', 'success');
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('Gagal mengekspor laporan', 'error');
    }
}
