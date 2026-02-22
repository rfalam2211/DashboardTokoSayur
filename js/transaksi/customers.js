// Customer Management Module

let customersCache = [];
let editingCustomerId = null;

/**
 * Initialize customers page
 */
async function initCustomers() {
    await loadCustomers();
    setupCustomersEventListeners();
}

/**
 * Setup event listeners
 */
function setupCustomersEventListeners() {
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    const addBtn = document.getElementById('add-customer-btn');
    if (addBtn) {
        if (!canEdit) {
            addBtn.style.display = 'none';
        }
        addBtn.addEventListener('click', () => {
            if (!canEdit) {
                showToast('Anda tidak memiliki izin untuk menambah pelanggan', 'warning');
                return;
            }
            openCustomerModal();
        });
    }

    const closeBtn = document.getElementById('close-customer-modal');
    const cancelBtn = document.getElementById('cancel-customer-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCustomerModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCustomerModal);

    const form = document.getElementById('customer-form');
    if (form) {
        form.addEventListener('submit', handleCustomerSubmit);
    }

    // Search customers
    const searchInput = document.getElementById('search-customers');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            filterCustomers(e.target.value);
        }, 300));
    }
}

/**
 * Load all customers
 */
async function loadCustomers() {
    try {
        customersCache = await getAllCustomers();
        renderCustomers(customersCache);
    } catch (error) {
        console.error('Error loading customers:', error);
        showToast('Gagal memuat pelanggan', 'error');
    }
}

/**
 * Render customers table
 */
function renderCustomers(customers) {
    const tbody = document.getElementById('customers-tbody');
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    if (customers.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state">
                        <p>Belum ada pelanggan. Klik "Tambah Pelanggan" untuk memulai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.address || '-'}</td>
            <td>
                <span class="${customer.totalDebt > 0 ? 'text-danger' : 'text-success'}">
                    ${formatCurrency(customer.totalDebt || 0)}
                </span>
            </td>
            <td>
                ${canEdit ? `
                    <button class="btn btn-text" onclick="viewCustomerDebts('${customer.id}')">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z" fill="currentColor"/>
                            <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Lihat Hutang
                    </button>
                    <button class="btn btn-text" onclick="editCustomer('${customer.id}')">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                        </svg>
                        Edit
                    </button>
                    <button class="btn btn-text" style="color: var(--color-danger)" onclick="deleteCustomerConfirm('${customer.id}', '${customer.name}')">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" fill="currentColor"/>
                        </svg>
                        Hapus
                    </button>
                ` : '<span class="badge badge-info">View Only</span>'}
            </td>
        </tr>
    `).join('');
}

/**
 * Filter customers
 */
function filterCustomers(searchTerm) {
    const filtered = customersCache.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );
    renderCustomers(filtered);
}

/**
 * Open customer modal
 */
function openCustomerModal(customer = null) {
    const modal = document.getElementById('customer-modal');
    const form = document.getElementById('customer-form');
    const title = document.getElementById('customer-modal-title');

    form.reset();

    if (customer) {
        title.textContent = 'Edit Pelanggan';
        document.getElementById('customer-id').value = customer.id;
        document.getElementById('customer-name').value = customer.name;
        document.getElementById('customer-phone').value = customer.phone || '';
        document.getElementById('customer-address').value = customer.address || '';
        editingCustomerId = customer.id;
    } else {
        title.textContent = 'Tambah Pelanggan';
        editingCustomerId = null;
    }

    modal.classList.add('active');
}

/**
 * Close customer modal
 */
function closeCustomerModal() {
    const modal = document.getElementById('customer-modal');
    modal.classList.remove('active');
    editingCustomerId = null;
}

/**
 * Handle customer form submit
 */
async function handleCustomerSubmit(e) {
    e.preventDefault();

    const customerData = {
        name: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value
    };

    try {
        if (editingCustomerId) {
            await updateCustomer(editingCustomerId, customerData);
            showToast('Pelanggan berhasil diupdate', 'success');
        } else {
            await addCustomer(customerData);
            showToast('Pelanggan berhasil ditambahkan', 'success');
        }

        closeCustomerModal();
        await loadCustomers();

    } catch (error) {
        console.error('Error saving customer:', error);
        showToast('Gagal menyimpan pelanggan', 'error');
    }
}

/**
 * Edit customer
 */
async function editCustomer(id) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk mengedit pelanggan', 'warning');
        return;
    }

    try {
        const customer = await getCustomer(id);
        if (customer) {
            openCustomerModal(customer);
        }
    } catch (error) {
        console.error('Error loading customer:', error);
        showToast('Gagal memuat pelanggan', 'error');
    }
}

/**
 * Delete customer with confirmation
 */
function deleteCustomerConfirm(id, name) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk menghapus pelanggan', 'warning');
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus pelanggan "${name}"?`)) {
        deleteCustomerById(id);
    }
}

/**
 * Delete customer by ID
 */
async function deleteCustomerById(id) {
    try {
        await deleteCustomer(id);
        showToast('Pelanggan berhasil dihapus', 'success');
        await loadCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
        showToast('Gagal menghapus pelanggan', 'error');
    }
}

/**
 * View customer debts
 */
function viewCustomerDebts(customerId) {
    // Navigate to debts page with customer filter
    navigateToPage('debts');
    // Set customer filter after page loads
    setTimeout(() => {
        const customerFilter = document.getElementById('debt-customer-filter');
        if (customerFilter) {
            customerFilter.value = customerId;
            filterDebts();
        }
    }, 100);
}
