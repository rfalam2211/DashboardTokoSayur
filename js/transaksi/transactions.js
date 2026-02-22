// Transactions Module

let transactionsCache = [];
let currentTransactionDetail = null;

/**
 * Initialize transactions page
 */
async function initTransactions() {
    await loadTransactions();
    setupTransactionsEventListeners();
}

/**
 * Setup event listeners for transactions page
 */
function setupTransactionsEventListeners() {
    // Filter transactions
    document.getElementById('filter-transactions-btn').addEventListener('click', applyTransactionFilter);

    // Reset filter
    document.getElementById('reset-filter-btn').addEventListener('click', resetTransactionFilter);

    // Export transactions
    document.getElementById('export-transactions-btn').addEventListener('click', exportTransactions);

    // Close transaction detail modal
    document.getElementById('close-transaction-modal').addEventListener('click', closeTransactionModal);
    document.getElementById('close-detail-btn').addEventListener('click', closeTransactionModal);

    // Print receipt
    document.getElementById('print-receipt-btn').addEventListener('click', printReceipt);

    // Set default date range to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date-from').value = today;
    document.getElementById('filter-date-to').value = today;
}

/**
 * Load all transactions
 */
async function loadTransactions(filter = null) {
    try {
        transactionsCache = await getAllTransactions(filter);
        renderTransactions(transactionsCache);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Gagal memuat transaksi', 'error');
    }
}

/**
 * Render transactions table
 */
function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-tbody');

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state">
                        <p>Belum ada transaksi</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = formatDate(date, true);

        return `
            <tr>
                <td><code>${transaction.id.substring(0, 8)}</code></td>
                <td>${formattedDate}</td>
                <td><strong>${formatCurrency(transaction.total)}</strong></td>
                <td><span class="badge badge-success">${transaction.paymentMethod}</span></td>
                <td>
                    <button class="btn btn-text" onclick="viewTransactionDetail('${transaction.id}')">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" fill="currentColor"/>
                        </svg>
                        Detail
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Apply transaction filter
 */
async function applyTransactionFilter() {
    const fromDate = document.getElementById('filter-date-from').value;
    const toDate = document.getElementById('filter-date-to').value;

    if (!fromDate || !toDate) {
        showToast('Pilih tanggal mulai dan akhir', 'warning');
        return;
    }

    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    await loadTransactions({ from, to });
}

/**
 * Reset transaction filter
 */
async function resetTransactionFilter() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date-from').value = today;
    document.getElementById('filter-date-to').value = today;
    await loadTransactions();
}

/**
 * View transaction detail
 */
async function viewTransactionDetail(id) {
    try {
        const transaction = await getTransaction(id);
        currentTransactionDetail = transaction;

        const modal = document.getElementById('transaction-modal');
        const detailContainer = document.getElementById('transaction-detail');

        const date = new Date(transaction.date);

        detailContainer.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h4>Informasi Transaksi</h4>
                <table style="width: 100%; margin-top: 1rem;">
                    <tr>
                        <td style="padding: 0.5rem 0;"><strong>ID Transaksi:</strong></td>
                        <td style="padding: 0.5rem 0;"><code>${transaction.id}</code></td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0;"><strong>Tanggal:</strong></td>
                        <td style="padding: 0.5rem 0;">${formatDate(date, true)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 0.5rem 0;"><strong>Metode Pembayaran:</strong></td>
                        <td style="padding: 0.5rem 0;">${transaction.paymentMethod}</td>
                    </tr>
                </table>
            </div>
            
            <div>
                <h4>Item Pembelian</h4>
                <table style="width: 100%; margin-top: 1rem;">
                    <thead>
                        <tr style="background: var(--color-gray-50);">
                            <th style="padding: 0.75rem; text-align: left;">Produk</th>
                            <th style="padding: 0.75rem; text-align: right;">Harga</th>
                            <th style="padding: 0.75rem; text-align: center;">Qty</th>
                            <th style="padding: 0.75rem; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaction.items.map(item => `
                            <tr>
                                <td style="padding: 0.75rem;">${item.name}</td>
                                <td style="padding: 0.75rem; text-align: right;">${formatCurrency(item.price)}</td>
                                <td style="padding: 0.75rem; text-align: center;">${item.quantity}</td>
                                <td style="padding: 0.75rem; text-align: right;"><strong>${formatCurrency(item.price * item.quantity)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="border-top: 2px solid var(--color-gray-200);">
                            <td colspan="3" style="padding: 1rem; text-align: right;"><strong>Total:</strong></td>
                            <td style="padding: 1rem; text-align: right;"><strong style="color: var(--color-primary); font-size: 1.25rem;">${formatCurrency(transaction.total)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading transaction detail:', error);
        showToast('Gagal memuat detail transaksi', 'error');
    }
}

/**
 * Close transaction modal
 */
function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.remove('active');
    currentTransactionDetail = null;
}

/**
 * Print receipt
 */
function printReceipt() {
    if (!currentTransactionDetail) return;

    const printWindow = window.open('', '', 'width=300,height=600');
    const transaction = currentTransactionDetail;
    const date = new Date(transaction.date);

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk - ${transaction.id}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    margin: 20px;
                }
                h2 { text-align: center; margin: 10px 0; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 3px 0; }
            </style>
        </head>
        <body>
            <h2>TOKO KU</h2>
            <div class="divider"></div>
            <div class="row">
                <span>Tanggal:</span>
                <span>${formatDate(date, true)}</span>
            </div>
            <div class="row">
                <span>ID:</span>
                <span>${transaction.id.substring(0, 12)}</span>
            </div>
            <div class="divider"></div>
            <table>
                ${transaction.items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                    </tr>
                    <tr>
                        <td>${formatCurrency(item.price)} x ${item.quantity}</td>
                        <td style="text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="divider"></div>
            <div class="row total">
                <span>TOTAL:</span>
                <span>${formatCurrency(transaction.total)}</span>
            </div>
            <div class="row">
                <span>Pembayaran:</span>
                <span>${transaction.paymentMethod}</span>
            </div>
            <div class="divider"></div>
            <p style="text-align: center; margin-top: 20px;">Terima Kasih!</p>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

/**
 * Export transactions to CSV
 */
function exportTransactions() {
    if (transactionsCache.length === 0) {
        showToast('Tidak ada transaksi untuk di-export', 'warning');
        return;
    }

    const exportData = transactionsCache.map(t => ({
        'ID Transaksi': t.id,
        'Tanggal': formatDate(new Date(t.date), true),
        'Total': t.total,
        'Metode Pembayaran': t.paymentMethod,
        'Jumlah Item': t.items.length
    }));

    exportToCSV(exportData, `transaksi_${new Date().toISOString().split('T')[0]}`);
}
