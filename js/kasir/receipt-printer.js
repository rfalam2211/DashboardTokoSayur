// ============================================================
// RECEIPT PRINTER — Generate, preview & print struk
// ============================================================

// Load settings from localStorage (override defaults)
const RECEIPT_SETTINGS = (() => {
    const defaults = {
        storeName: 'Ida Buah',
        storeAddress: 'Jl. Buah Segar No. 1, Jakarta',
        storePhone: '08123456789',
        footerMessage: 'Terima kasih atas kunjungan Anda! 🥬',
        paperSize: '80mm'
    };
    try {
        const saved = localStorage.getItem('receipt_settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
        return defaults;
    }
})();

/**
 * Generate receipt HTML string
 */
function generateReceiptHTML(transaction) {
    // Use formatDate from utils.js — formatDateTime doesn't exist
    const receiptDate = (typeof formatDate === 'function')
        ? formatDate(transaction.date || transaction.created_at, true)
        : new Date(transaction.date || transaction.created_at).toLocaleString('id-ID');

    const items = transaction.items || [];
    const itemsHTML = items.map(item => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        const itemDiscount = item.discount || 0;
        const itemFinal = itemTotal - itemDiscount;
        return `
            <tr>
                <td>${escapeHtml ? escapeHtml(item.name) : item.name}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">${formatCurrency(item.price)}</td>
                <td class="right">${formatCurrency(itemFinal)}</td>
            </tr>
            ${itemDiscount > 0 ? `
            <tr class="disc">
                <td colspan="3" class="right">Diskon:</td>
                <td class="right">-${formatCurrency(itemDiscount)}</td>
            </tr>` : ''}
        `;
    }).join('');

    const cashier = transaction.cashier_name || transaction.cashier
        || (typeof getCurrentUser === 'function' ? getCurrentUser()?.name : null)
        || '—';

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Struk #${transaction.id}</title>
    <style>
        @page { margin: 0; size: ${RECEIPT_SETTINGS.paperSize} auto; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            width: ${RECEIPT_SETTINGS.paperSize === '58mm' ? '58mm' : '80mm'};
            margin: 0 auto;
            padding: 8px;
            color: #000;
            background: #fff;
        }
        .center { text-align: center; }
        .right   { text-align: right; }
        .bold    { font-weight: bold; }
        .line    { border-top: 1px dashed #000; margin: 6px 0; }
        .double  { border-top: 2px solid #000;  margin: 6px 0; }
        h1 { font-size: 15px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 10px; text-align: left; border-bottom: 1px solid #000; padding: 3px 0; }
        th.right { text-align: right; }
        td { padding: 2px 0; font-size: 11px; vertical-align: top; }
        .disc { font-size: 10px; color: #555; }
        .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .grand { font-size: 13px; font-weight: bold; padding: 4px 0; }
        .footer { font-size: 9px; text-align: center; padding-top: 6px; color: #333; }
    </style>
</head>
<body>
    <div class="center">
        <h1>${RECEIPT_SETTINGS.storeName}</h1>
        <div>${RECEIPT_SETTINGS.storeAddress}</div>
        <div>Telp: ${RECEIPT_SETTINGS.storePhone}</div>
    </div>
    <div class="line"></div>
    <div>No: #${transaction.id}</div>
    <div>Tgl: ${receiptDate}</div>
    <div>Kasir: ${cashier}</div>
    <div class="line"></div>
    <table>
        <thead>
            <tr>
                <th>Nama</th>
                <th class="right">Qty</th>
                <th class="right">Harga</th>
                <th class="right">Total</th>
            </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
    </table>
    <div class="line"></div>
    <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(transaction.subtotal || transaction.total)}</span></div>
    ${(transaction.discount > 0) ? `<div class="total-row"><span>Diskon:</span><span>-${formatCurrency(transaction.discount)}</span></div>` : ''}
    ${(transaction.tax > 0) ? `<div class="total-row"><span>Pajak:</span><span>${formatCurrency(transaction.tax)}</span></div>` : ''}
    <div class="double"></div>
    <div class="total-row grand"><span>TOTAL:</span><span>${formatCurrency(transaction.total)}</span></div>
    <div class="line"></div>
    <div class="total-row"><span>Bayar (${transaction.payment_method || transaction.paymentMethod || 'Tunai'}):</span><span>${formatCurrency(transaction.paid || transaction.total)}</span></div>
    ${transaction.change > 0 ? `<div class="total-row"><span>Kembalian:</span><span>${formatCurrency(transaction.change)}</span></div>` : ''}
    <div class="line"></div>
    <div class="footer">
        <div>${RECEIPT_SETTINGS.footerMessage}</div>
        <div style="margin-top:4px;">Barang yang sudah dibeli tidak dapat dikembalikan.</div>
    </div>
</body>
</html>`;
}

/**
 * Print receipt (opens print dialog)
 */
function printReceipt(transaction) {
    try {
        const html = generateReceiptHTML(transaction);
        const win = window.open('', '_blank', 'width=380,height=680,scrollbars=no,menubar=no,toolbar=no');

        if (!win) {
            showToast('⚠️ Popup diblokir. Izinkan popup untuk mencetak struk.', 'warning');
            return;
        }

        win.document.open();
        win.document.write(html);
        win.document.close();

        win.onload = () => {
            win.focus();
            win.print();
            setTimeout(() => win.close(), 500);
        };

        try { logActivity('pos', 'print_receipt', { transactionId: transaction.id }); } catch { }
    } catch (err) {
        console.error('[Receipt] printReceipt error:', err);
        showToast('Gagal mencetak struk', 'error');
    }
}

/**
 * Download struk as PDF via browser print-to-PDF
 * (No external library needed — piggybacks on browser PDF print)
 */
function downloadReceiptPDF(transaction) {
    try {
        const html = generateReceiptHTML(transaction);

        // Tambahkan instruksi print ke PDF di judul
        const pdfHtml = html.replace(
            '<title>',
            `<script>
                window.onload = function() {
                    window.onafterprint = function() { window.close(); };
                    window.print();
                };
            <\/script><title>PDF — `
        );

        const win = window.open('', '_blank', 'width=380,height=680');
        if (!win) {
            showToast('Popup diblokir. Izinkan popup untuk export PDF.', 'warning');
            return;
        }

        win.document.open();
        win.document.write(pdfHtml);
        win.document.close();

        showToast('💡 Pilih "Save as PDF" di dialog print', 'info');
    } catch (err) {
        console.error('[Receipt] downloadReceiptPDF error:', err);
        showToast('Gagal export PDF', 'error');
    }
}

/**
 * Preview struk di modal sebelum print
 */
function previewReceipt(transaction) {
    const html = generateReceiptHTML(transaction);

    // Tampilkan di iframe di dalam modal jika ada, atau buka popup
    const previewModal = document.getElementById('receipt-preview-modal');
    const previewFrame = document.getElementById('receipt-preview-frame');

    if (previewModal && previewFrame) {
        previewFrame.srcdoc = html;
        previewModal.classList.add('active');
    } else {
        // Fallback: langsung buka di popup
        printReceipt(transaction);
    }
}

/**
 * Update receipt settings
 */
function updateReceiptSettings(settings) {
    Object.assign(RECEIPT_SETTINGS, settings);
    localStorage.setItem('receipt_settings', JSON.stringify(RECEIPT_SETTINGS));
    showToast('Pengaturan struk disimpan', 'success');
}


/**
 * Generate receipt HTML
 * @param {object} transaction - Transaction data
 * @returns {string} HTML string for receipt
 */
function generateReceiptHTML(transaction) {
    const receiptDate = formatDateTime(transaction.date);
    
    let itemsHTML = transaction.items.map(item => {
        const itemTotal = item.price * item.quantity;
        const itemDiscount = item.discount || 0;
        const itemFinal = itemTotal - itemDiscount;
        
        return `
            <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${formatCurrency(itemFinal)}</td>
            </tr>
            ${itemDiscount > 0 ? `
                <tr class="discount-row">
                    <td colspan="3" class="text-right">Diskon:</td>
                    <td class="text-right">-${formatCurrency(itemDiscount)}</td>
                </tr>
            ` : ''}
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Struk #${transaction.id}</title>
            <style>
                @media print {
                    @page { margin: 0; }
                    body { margin: 1cm; }
                }
                body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    max-width: ${RECEIPT_SETTINGS.paperSize === '58mm' ? '58mm' : '80mm'};
                    margin: 0 auto;
                    padding: 10px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 15px;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 10px;
                }
                .store-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .store-info {
                    font-size: 10px;
                    margin: 2px 0;
                }
                .transaction-info {
                    margin: 10px 0;
                    font-size: 10px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                th {
                    text-align: left;
                    border-bottom: 1px solid #000;
                    padding: 5px 0;
                    font-size: 10px;
                }
                td {
                    padding: 3px 0;
                    font-size: 11px;
                }
                .text-right {
                    text-align: right;
                }
                .discount-row {
                    font-size: 10px;
                    font-style: italic;
                }
                .totals {
                    border-top: 1px solid #000;
                    margin-top: 10px;
                    padding-top: 5px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 3px 0;
                }
                .grand-total {
                    font-size: 14px;
                    font-weight: bold;
                    border-top: 2px solid #000;
                    padding-top: 5px;
                    margin-top: 5px;
                }
                .footer {
                    text-align: center;
                    margin-top: 15px;
                    border-top: 2px dashed #000;
                    padding-top: 10px;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="store-name">${RECEIPT_SETTINGS.storeName}</div>
                <div class="store-info">${RECEIPT_SETTINGS.storeAddress}</div>
                <div class="store-info">Telp: ${RECEIPT_SETTINGS.storePhone}</div>
            </div>

            <div class="transaction-info">
                <div>No: #${transaction.id}</div>
                <div>Tanggal: ${receiptDate}</div>
                <div>Kasir: ${transaction.cashier || getCurrentUser()?.name || '-'}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Harga</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(transaction.subtotal)}</span>
                </div>
                ${transaction.discount > 0 ? `
                    <div class="total-row">
                        <span>Diskon Total:</span>
                        <span>-${formatCurrency(transaction.discount)}</span>
                    </div>
                ` : ''}
                <div class="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(transaction.total)}</span>
                </div>
                <div class="total-row">
                    <span>Pembayaran (${transaction.paymentMethod}):</span>
                    <span>${formatCurrency(transaction.paid || transaction.total)}</span>
                </div>
                ${transaction.change ? `
                    <div class="total-row">
                        <span>Kembali:</span>
                        <span>${formatCurrency(transaction.change)}</span>
                    </div>
                ` : ''}
            </div>

            <div class="footer">
                <div>${RECEIPT_SETTINGS.footerMessage}</div>
                <div style="margin-top: 10px;">*** Barang yang sudah dibeli tidak dapat dikembalikan ***</div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Print receipt
 * @param {object} transaction - Transaction data
 */
function printReceipt(transaction) {
    try {
        const receiptHTML = generateReceiptHTML(transaction);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        
        if (!printWindow) {
            showToast('Popup diblokir. Izinkan popup untuk mencetak struk', 'warning');
            return;
        }

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            
            // Close window after printing (optional)
            setTimeout(() => {
                printWindow.close();
            }, 100);
        };

        logActivity('pos', 'print_receipt', { transactionId: transaction.id });
    } catch (error) {
        console.error('Error printing receipt:', error);
        showToast('Gagal mencetak struk', 'error');
    }
}

/**
 * Update receipt settings
 * @param {object} settings - New settings
 */
function updateReceiptSettings(settings) {
    Object.assign(RECEIPT_SETTINGS, settings);
    localStorage.setItem('receipt_settings', JSON.stringify(RECEIPT_SETTINGS));
    showToast('Pengaturan struk berhasil disimpan', 'success');
}

/**
 * Load receipt settings from localStorage
 */
function loadReceiptSettings() {
    const saved = localStorage.getItem('receipt_settings');
    if (saved) {
        try {
            Object.assign(RECEIPT_SETTINGS, JSON.parse(saved));
        } catch (error) {
            console.error('Error loading receipt settings:', error);
        }
    }
}

// Load settings on init
loadReceiptSettings();
