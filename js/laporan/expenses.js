// Expenses Management Module

let expensesCache = [];
let editingExpenseId = null;

// Expense categories
const EXPENSE_CATEGORIES = [
    { value: 'operational', label: 'Operasional' },
    { value: 'inventory', label: 'Pembelian Stok' },
    { value: 'salary', label: 'Gaji Karyawan' },
    { value: 'utilities', label: 'Utilitas (Listrik, Air)' },
    { value: 'rent', label: 'Sewa Tempat' },
    { value: 'maintenance', label: 'Perawatan' },
    { value: 'marketing', label: 'Marketing/Promosi' },
    { value: 'other', label: 'Lain-lain' }
];

/**
 * Initialize expenses page
 */
async function initExpenses() {
    await loadExpenses();
    setupExpensesEventListeners();
    populateExpenseCategories();
}

/**
 * Setup event listeners
 */
function setupExpensesEventListeners() {
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openExpenseModal());
    }

    const form = document.getElementById('expense-form');
    if (form) {
        form.addEventListener('submit', handleExpenseSubmit);
    }

    const closeBtn = document.getElementById('close-expense-modal');
    const cancelBtn = document.getElementById('cancel-expense-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeExpenseModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeExpenseModal);

    // Filters
    const categoryFilter = document.getElementById('expense-category-filter');
    const dateFilter = document.getElementById('expense-date-filter');
    if (categoryFilter) categoryFilter.addEventListener('change', filterExpenses);
    if (dateFilter) dateFilter.addEventListener('change', filterExpenses);
}

/**
 * Populate expense categories in select
 */
function populateExpenseCategories() {
    const selects = document.querySelectorAll('.expense-category-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Semua Kategori</option>' +
            EXPENSE_CATEGORIES.map(cat => 
                `<option value="${cat.value}">${cat.label}</option>`
            ).join('');
    });
}

/**
 * Load all expenses
 */
async function loadExpenses() {
    try {
        expensesCache = await getAllExpenses();
        renderExpenses(expensesCache);
        updateExpenseSummary();
    } catch (error) {
        console.error('Error loading expenses:', error);
        showToast('Gagal memuat data pengeluaran', 'error');
    }
}

/**
 * Render expenses table
 */
function renderExpenses(expenses) {
    const tbody = document.getElementById('expenses-tbody');
    
    if (!tbody) return;

    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <p>Belum ada pengeluaran tercatat</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = expenses.map(expense => {
        const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
        return `
            <tr>
                <td>${formatDate(expense.date)}</td>
                <td><span class="badge badge-info">${category ? category.label : expense.category}</span></td>
                <td>${formatCurrency(expense.amount)}</td>
                <td>${expense.description || '-'}</td>
                <td>${expense.paymentMethod || '-'}</td>
                <td>
                    <button class="btn btn-text" onclick="editExpense('${expense.id}')" data-permission="expenses:edit">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                        </svg>
                    </button>
                    <button class="btn btn-text" style="color: var(--color-danger)" onclick="deleteExpenseConfirm('${expense.id}')" data-permission="expenses:delete">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" fill="currentColor"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    applyPermissionUI();
}

/**
 * Update expense summary
 */
function updateExpenseSummary() {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const todayExpenses = expensesCache.filter(e => e.date.startsWith(today));
    const monthExpenses = expensesCache.filter(e => e.date.startsWith(thisMonth));

    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const summaryEl = document.getElementById('expense-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="summary-item">
                <span>Pengeluaran Hari Ini:</span>
                <span class="text-danger">${formatCurrency(todayTotal)}</span>
            </div>
            <div class="summary-item">
                <span>Pengeluaran Bulan Ini:</span>
                <span class="text-danger">${formatCurrency(monthTotal)}</span>
            </div>
        `;
    }
}

/**
 * Filter expenses
 */
function filterExpenses() {
    const category = document.getElementById('expense-category-filter')?.value;
    const dateRange = document.getElementById('expense-date-filter')?.value;

    let filtered = expensesCache;

    if (category) {
        filtered = filtered.filter(e => e.category === category);
    }

    if (dateRange) {
        const range = getDateRange(dateRange);
        filtered = filtered.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= range.start && expenseDate <= range.end;
        });
    }

    renderExpenses(filtered);
}

/**
 * Open expense modal
 */
function openExpenseModal(expenseId = null) {
    const modal = document.getElementById('expense-modal');
    const title = document.getElementById('expense-modal-title');
    const form = document.getElementById('expense-form');

    form.reset();

    if (expenseId) {
        const expense = expensesCache.find(e => e.id === expenseId);
        if (expense) {
            title.textContent = 'Edit Pengeluaran';
            document.getElementById('expense-id').value = expense.id;
            document.getElementById('expense-date').value = expense.date;
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-amount').value = expense.amount;
            document.getElementById('expense-description').value = expense.description || '';
            document.getElementById('expense-payment-method').value = expense.paymentMethod || 'cash';
            editingExpenseId = expenseId;
        }
    } else {
        title.textContent = 'Tambah Pengeluaran';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        editingExpenseId = null;
    }

    modal.classList.add('active');
}

/**
 * Close expense modal
 */
function closeExpenseModal() {
    document.getElementById('expense-modal').classList.remove('active');
    editingExpenseId = null;
}

/**
 * Handle expense form submit
 */
async function handleExpenseSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('expense-id').value;
    const date = document.getElementById('expense-date').value;
    const category = document.getElementById('expense-category').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const description = document.getElementById('expense-description').value;
    const paymentMethod = document.getElementById('expense-payment-method').value;

    try {
        const expenseData = {
            date,
            category,
            amount,
            description,
            paymentMethod,
            createdBy: getCurrentUser()?.id
        };

        if (id) {
            await updateExpense(id, expenseData);
            await logActivity('expenses', 'update', { expenseId: id, amount });
            showToast('Pengeluaran berhasil diupdate', 'success');
        } else {
            await addExpense(expenseData);
            await logActivity('expenses', 'create', { amount, category });
            showToast('Pengeluaran berhasil ditambahkan', 'success');
        }

        closeExpenseModal();
        await loadExpenses();
    } catch (error) {
        console.error('Error saving expense:', error);
        showToast('Gagal menyimpan pengeluaran', 'error');
    }
}

/**
 * Edit expense
 */
function editExpense(id) {
    openExpenseModal(id);
}

/**
 * Delete expense with confirmation
 */
function deleteExpenseConfirm(id) {
    if (confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
        deleteExpenseById(id);
    }
}

/**
 * Delete expense by ID
 */
async function deleteExpenseById(id) {
    try {
        await deleteExpense(id);
        await logActivity('expenses', 'delete', { expenseId: id });
        showToast('Pengeluaran berhasil dihapus', 'success');
        await loadExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Gagal menghapus pengeluaran', 'error');
    }
}
