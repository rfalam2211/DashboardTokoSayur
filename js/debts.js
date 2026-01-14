// Debt Management Module

let debtsCache = [];
let editingDebtId = null;

/**
 * Initialize debts page
 */
async function initDebts() {
    await loadDebts();
    await loadCustomersForSelect();
    setupDebtsEventListeners();
}

/**
 * Setup event listeners
 */
function setupDebtsEventListeners() {
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    const addBtn = document.getElementById('add-debt-btn');
    if (addBtn) {
        if (!canEdit) {
            addBtn.style.display = 'none';
        }
        addBtn.addEventListener('click', () => {
            if (!canEdit) {
                showToast('Anda tidak memiliki izin untuk menambah hutang', 'warning');
                return;
            }
            openDebtModal();
        });
    }

    const closeBtn = document.getElementById('close-debt-modal');
    const cancelBtn = document.getElementById('cancel-debt-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeDebtModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDebtModal);

    const form = document.getElementById('debt-form');
    if (form) {
        form.addEventListener('submit', handleDebtSubmit);
    }

    // Payment modal
    const closePaymentBtn = document.getElementById('close-payment-modal');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    if (closePaymentBtn) closePaymentBtn.addEventListener('click', closePaymentModal);
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closePaymentModal);

    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Filter debts
    const statusFilter = document.getElementById('debt-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterDebts);
    }
}

/**
 * Load all debts
 */
async function loadDebts() {
    try {
        debtsCache = await getAllDebts();
        renderDebts(debtsCache);
        updateDebtSummary();
    } catch (error) {
        console.error('Error loading debts:', error);
        showToast('Gagal memuat hutang', 'error');
    }
}

/**
 * Load customers for select dropdown
 */
async function loadCustomersForSelect() {
    try {
        const customers = await getAllCustomers();
        const select = document.getElementById('debt-customer');
        if (select) {
            select.innerHTML = '<option value="">Pilih Pelanggan</option>' +
                customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

/**
 * Render debts table
 */
function renderDebts(debts) {
    const tbody = document.getElementById('debts-tbody');
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    if (debts.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <div class="empty-state">
                        <p>Belum ada hutang tercatat.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = debts.map(debt => {
        const statusBadge = getDebtStatusBadge(debt.status);
        const isOverdue = debt.status === 'overdue';
        
        return `
            <tr class="${isOverdue ? 'debt-overdue' : ''}">
                <td><strong>${debt.customerName}</strong></td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid || 0)}</td>
                <td><strong>${formatCurrency(debt.remaining)}</strong></td>
                <td>${formatDate(debt.dueDate)}</td>
                <td>${statusBadge}</td>
                <td>
                    ${canEdit ? `
                        ${debt.status !== 'paid' ? `
                            <button class="btn btn-text btn-success" onclick="openPaymentModal('${debt.id}')">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                                </svg>
                                Bayar
                            </button>
                        ` : ''}
                        <button class="btn btn-text" onclick="viewDebtHistory('${debt.id}')">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" fill="currentColor"/>
                                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" fill="currentColor"/>
                            </svg>
                            Riwayat
                        </button>
                        <button class="btn btn-text" style="color: var(--color-danger)" onclick="deleteDebtConfirm('${debt.id}', '${debt.customerName}')">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" fill="currentColor"/>
                            </svg>
                            Hapus
                        </button>
                    ` : '<span class="badge badge-info">View Only</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Get debt status badge
 */
function getDebtStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-warning">Belum Dibayar</span>',
        'partial': '<span class="badge badge-info">Dibayar Sebagian</span>',
        'paid': '<span class="badge badge-success">Lunas</span>',
        'overdue': '<span class="badge badge-danger">Jatuh Tempo</span>'
    };
    return badges[status] || badges['pending'];
}

/**
 * Filter debts
 */
function filterDebts() {
    const statusFilter = document.getElementById('debt-status-filter').value;
    const customerFilter = document.getElementById('debt-customer-filter')?.value;
    
    let filtered = debtsCache;
    
    if (statusFilter) {
        filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    if (customerFilter) {
        filtered = filtered.filter(d => d.customerId === customerFilter);
    }
    
    renderDebts(filtered);
}

/**
 * Update debt summary
 */
function updateDebtSummary() {
    const totalDebt = debtsCache.reduce((sum, d) => sum + d.amount, 0);
    const totalPaid = debtsCache.reduce((sum, d) => sum + (d.paid || 0), 0);
    const totalRemaining = debtsCache.reduce((sum, d) => sum + d.remaining, 0);
    const overdueCount = debtsCache.filter(d => d.status === 'overdue').length;
    
    const summaryEl = document.getElementById('debt-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Total Hutang:</span>
                <span class="summary-value">${formatCurrency(totalDebt)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Sudah Dibayar:</span>
                <span class="summary-value text-success">${formatCurrency(totalPaid)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Sisa Hutang:</span>
                <span class="summary-value text-danger">${formatCurrency(totalRemaining)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Jatuh Tempo:</span>
                <span class="summary-value text-danger">${overdueCount} hutang</span>
            </div>
        `;
    }
}

/**
 * Open debt modal
 */
function openDebtModal(debt = null) {
    const modal = document.getElementById('debt-modal');
    const form = document.getElementById('debt-form');
    const title = document.getElementById('debt-modal-title');

    form.reset();

    if (debt) {
        title.textContent = 'Edit Hutang';
        document.getElementById('debt-id').value = debt.id;
        document.getElementById('debt-customer').value = debt.customerId;
        document.getElementById('debt-amount').value = debt.amount;
        document.getElementById('debt-due-date').value = debt.dueDate.split('T')[0];
        document.getElementById('debt-notes').value = debt.notes || '';
        editingDebtId = debt.id;
    } else {
        title.textContent = 'Tambah Hutang';
        // Set default due date to 30 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('debt-due-date').value = dueDate.toISOString().split('T')[0];
        editingDebtId = null;
    }

    modal.classList.add('active');
}

/**
 * Close debt modal
 */
function closeDebtModal() {
    const modal = document.getElementById('debt-modal');
    modal.classList.remove('active');
    editingDebtId = null;
}

/**
 * Handle debt form submit
 */
async function handleDebtSubmit(e) {
    e.preventDefault();

    const customerId = document.getElementById('debt-customer').value;
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const dueDate = document.getElementById('debt-due-date').value;
    const notes = document.getElementById('debt-notes').value;

    if (!customerId) {
        showToast('Pilih pelanggan terlebih dahulu', 'warning');
        return;
    }

    try {
        const customer = await getCustomer(customerId);
        
        const debtData = {
            customerId: customerId,
            customerName: customer.name,
            amount: amount,
            dueDate: dueDate,
            notes: notes
        };

        if (editingDebtId) {
            await updateDebt(editingDebtId, debtData);
            showToast('Hutang berhasil diupdate', 'success');
        } else {
            await addDebt(debtData);
            showToast('Hutang berhasil ditambahkan', 'success');
        }

        closeDebtModal();
        await loadDebts();

    } catch (error) {
        console.error('Error saving debt:', error);
        showToast('Gagal menyimpan hutang', 'error');
    }
}

/**
 * Open payment modal
 */
function openPaymentModal(debtId) {
    const debt = debtsCache.find(d => d.id === debtId);
    if (!debt) return;

    const modal = document.getElementById('payment-modal');
    const form = document.getElementById('payment-form');
    
    form.reset();
    document.getElementById('payment-debt-id').value = debtId;
    document.getElementById('payment-customer-name').textContent = debt.customerName;
    document.getElementById('payment-remaining').textContent = formatCurrency(debt.remaining);
    document.getElementById('payment-amount').max = debt.remaining;
    document.getElementById('payment-amount').value = debt.remaining;
    
    modal.classList.add('active');
}

/**
 * Close payment modal
 */
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('active');
}

/**
 * Handle payment submit
 */
async function handlePaymentSubmit(e) {
    e.preventDefault();

    const debtId = document.getElementById('payment-debt-id').value;
    const amount = parseFloat(document.getElementById('payment-amount').value);
    const method = document.getElementById('payment-method').value;
    const notes = document.getElementById('payment-notes').value;

    try {
        const payment = {
            date: new Date().toISOString(),
            amount: amount,
            method: method,
            notes: notes
        };

        await recordDebtPayment(debtId, payment);
        showToast('Pembayaran berhasil dicatat', 'success');
        
        closePaymentModal();
        await loadDebts();

    } catch (error) {
        console.error('Error recording payment:', error);
        showToast('Gagal mencatat pembayaran', 'error');
    }
}

/**
 * View debt history
 */
async function viewDebtHistory(debtId) {
    const debt = debtsCache.find(d => d.id === debtId);
    if (!debt) return;

    let historyHTML = `
        <div class="debt-history">
            <h4>${debt.customerName}</h4>
            <p>Total Hutang: ${formatCurrency(debt.amount)}</p>
            <p>Sisa: ${formatCurrency(debt.remaining)}</p>
            <h5>Riwayat Pembayaran:</h5>
    `;

    if (debt.payments && debt.payments.length > 0) {
        historyHTML += '<ul class="payment-history">';
        debt.payments.forEach(payment => {
            historyHTML += `
                <li>
                    <strong>${formatDate(payment.date)}</strong> - 
                    ${formatCurrency(payment.amount)} 
                    (${payment.method})
                    ${payment.notes ? `<br><small>${payment.notes}</small>` : ''}
                </li>
            `;
        });
        historyHTML += '</ul>';
    } else {
        historyHTML += '<p>Belum ada pembayaran</p>';
    }

    historyHTML += '</div>';

    // Show in a simple alert for now (can be enhanced with a modal)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = historyHTML;
    alert(tempDiv.textContent);
}

/**
 * Delete debt with confirmation
 */
function deleteDebtConfirm(id, customerName) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk menghapus hutang', 'warning');
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus hutang dari "${customerName}"?`)) {
        deleteDebtById(id);
    }
}

/**
 * Delete debt by ID
 */
async function deleteDebtById(id) {
    try {
        await deleteDebt(id);
        showToast('Hutang berhasil dihapus', 'success');
        await loadDebts();
    } catch (error) {
        console.error('Error deleting debt:', error);
        showToast('Gagal menghapus hutang', 'error');
    }
}

/**
 * Check for overdue debts and show notifications
 */
async function checkOverdueDebts() {
    try {
        const debts = await getAllDebts();
        const now = new Date();
        const overdueDebts = debts.filter(debt => {
            const dueDate = new Date(debt.dueDate);
            return debt.status !== 'paid' && dueDate < now;
        });

        if (overdueDebts.length > 0 && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Pengingat Hutang', {
                    body: `Ada ${overdueDebts.length} hutang yang sudah jatuh tempo`,
                    icon: 'icons/icon-192x192.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }

        return overdueDebts.length;
    } catch (error) {
        console.error('Error checking overdue debts:', error);
        return 0;
    }
}
