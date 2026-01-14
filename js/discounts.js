// Discount Management Module

let discountsCache = [];
let editingDiscountId = null;

/**
 * Initialize discounts page
 */
async function initDiscounts() {
    await loadDiscounts();
    setupDiscountsEventListeners();
}

/**
 * Setup event listeners for discounts page
 */
function setupDiscountsEventListeners() {
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    // Hide add discount button for non-admin users
    const addDiscountBtn = document.getElementById('add-discount-btn');
    if (addDiscountBtn) {
        if (!canEdit) {
            addDiscountBtn.style.display = 'none';
        }
        addDiscountBtn.addEventListener('click', () => {
            if (!canEdit) {
                showToast('Anda tidak memiliki izin untuk menambah diskon', 'warning');
                return;
            }
            openDiscountModal();
        });
    }

    // Close modal buttons
    const closeBtn = document.getElementById('close-discount-modal');
    const cancelBtn = document.getElementById('cancel-discount-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeDiscountModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDiscountModal);

    // Discount form submit
    const form = document.getElementById('discount-form');
    if (form) {
        form.addEventListener('submit', handleDiscountSubmit);
    }

    // Discount type change
    const typeSelect = document.getElementById('discount-applicable-to');
    if (typeSelect) {
        typeSelect.addEventListener('change', toggleDiscountApplicability);
    }
}

/**
 * Load all discounts
 */
async function loadDiscounts() {
    try {
        discountsCache = await getAllDiscounts();
        renderDiscounts(discountsCache);
    } catch (error) {
        console.error('Error loading discounts:', error);
        showToast('Gagal memuat diskon', 'error');
    }
}

/**
 * Render discounts table
 */
function renderDiscounts(discounts) {
    const tbody = document.getElementById('discounts-tbody');
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    if (discounts.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <p>Belum ada diskon. Klik "Tambah Diskon" untuk memulai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = discounts.map(discount => {
        const isActive = isDiscountActive(discount);
        const statusBadge = isActive ? 
            '<span class="badge badge-success">Aktif</span>' : 
            '<span class="badge badge-danger">Tidak Aktif</span>';
        
        const discountValue = discount.type === 'percentage' ? 
            `${discount.value}%` : 
            formatCurrency(discount.value);

        return `
            <tr>
                <td><strong>${discount.name}</strong></td>
                <td>${discountValue}</td>
                <td><span class="badge badge-info">${getApplicabilityText(discount.applicableTo)}</span></td>
                <td>${formatDate(discount.validFrom)} - ${discount.validTo ? formatDate(discount.validTo) : 'Tidak terbatas'}</td>
                <td>${statusBadge}</td>
                <td>
                    ${canEdit ? `
                        <button class="btn btn-text" onclick="editDiscount('${discount.id}')">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn btn-text" style="color: var(--color-danger)" onclick="deleteDiscountConfirm('${discount.id}', '${discount.name}')">
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
 * Check if discount is currently active
 */
function isDiscountActive(discount) {
    if (!discount.active) return false;
    
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = discount.validTo ? new Date(discount.validTo) : null;
    
    if (validFrom > now) return false;
    if (validTo && validTo < now) return false;
    
    return true;
}

/**
 * Get applicability text
 */
function getApplicabilityText(applicableTo) {
    const map = {
        'all': 'Semua Produk',
        'product': 'Produk Tertentu',
        'category': 'Kategori Tertentu'
    };
    return map[applicableTo] || applicableTo;
}

/**
 * Open discount modal
 */
function openDiscountModal(discount = null) {
    const modal = document.getElementById('discount-modal');
    const form = document.getElementById('discount-form');
    const title = document.getElementById('discount-modal-title');

    form.reset();

    if (discount) {
        title.textContent = 'Edit Diskon';
        document.getElementById('discount-id').value = discount.id;
        document.getElementById('discount-name').value = discount.name;
        document.getElementById('discount-type').value = discount.type;
        document.getElementById('discount-value').value = discount.value;
        document.getElementById('discount-applicable-to').value = discount.applicableTo;
        document.getElementById('discount-valid-from').value = discount.validFrom.split('T')[0];
        document.getElementById('discount-valid-to').value = discount.validTo ? discount.validTo.split('T')[0] : '';
        document.getElementById('discount-active').checked = discount.active;
        editingDiscountId = discount.id;
    } else {
        title.textContent = 'Tambah Diskon';
        // Set default valid from to today
        document.getElementById('discount-valid-from').value = new Date().toISOString().split('T')[0];
        document.getElementById('discount-active').checked = true;
        editingDiscountId = null;
    }

    toggleDiscountApplicability();
    modal.classList.add('active');
}

/**
 * Close discount modal
 */
function closeDiscountModal() {
    const modal = document.getElementById('discount-modal');
    modal.classList.remove('active');
    editingDiscountId = null;
}

/**
 * Toggle discount applicability fields
 */
function toggleDiscountApplicability() {
    const applicableTo = document.getElementById('discount-applicable-to').value;
    const productSelect = document.getElementById('discount-products-container');
    const categorySelect = document.getElementById('discount-categories-container');

    if (productSelect) productSelect.style.display = applicableTo === 'product' ? 'block' : 'none';
    if (categorySelect) categorySelect.style.display = applicableTo === 'category' ? 'block' : 'none';
}

/**
 * Handle discount form submit
 */
async function handleDiscountSubmit(e) {
    e.preventDefault();

    const form = e.target;

    if (!validateForm(form)) {
        showToast('Mohon lengkapi semua field', 'warning');
        return;
    }

    const discountData = {
        name: document.getElementById('discount-name').value,
        type: document.getElementById('discount-type').value,
        value: parseFloat(document.getElementById('discount-value').value),
        applicableTo: document.getElementById('discount-applicable-to').value,
        validFrom: document.getElementById('discount-valid-from').value,
        validTo: document.getElementById('discount-valid-to').value || null,
        active: document.getElementById('discount-active').checked
    };

    // Validate discount value
    if (discountData.type === 'percentage' && (discountData.value < 0 || discountData.value > 100)) {
        showToast('Persentase diskon harus antara 0-100%', 'warning');
        return;
    }

    try {
        if (editingDiscountId) {
            await updateDiscount(editingDiscountId, discountData);
            showToast('Diskon berhasil diupdate', 'success');
        } else {
            await addDiscount(discountData);
            showToast('Diskon berhasil ditambahkan', 'success');
        }

        closeDiscountModal();
        await loadDiscounts();

    } catch (error) {
        console.error('Error saving discount:', error);
        showToast('Gagal menyimpan diskon', 'error');
    }
}

/**
 * Edit discount
 */
async function editDiscount(id) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk mengedit diskon', 'warning');
        return;
    }

    try {
        const discount = discountsCache.find(d => d.id === id);
        if (discount) {
            openDiscountModal(discount);
        } else {
            showToast('Diskon tidak ditemukan', 'error');
        }
    } catch (error) {
        console.error('Error loading discount:', error);
        showToast('Gagal memuat diskon', 'error');
    }
}

/**
 * Delete discount with confirmation
 */
function deleteDiscountConfirm(id, name) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk menghapus diskon', 'warning');
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus diskon "${name}"?`)) {
        deleteDiscountById(id);
    }
}

/**
 * Delete discount by ID
 */
async function deleteDiscountById(id) {
    try {
        await deleteDiscount(id);
        showToast('Diskon berhasil dihapus', 'success');
        await loadDiscounts();
    } catch (error) {
        console.error('Error deleting discount:', error);
        showToast('Gagal menghapus diskon', 'error');
    }
}

/**
 * Calculate discount for a product
 * @param {Object} product - Product object
 * @param {number} quantity - Quantity
 * @returns {Promise<number>} Discount amount
 */
async function calculateProductDiscount(product, quantity = 1) {
    try {
        const activeDiscounts = await getActiveDiscounts();
        let totalDiscount = 0;

        for (const discount of activeDiscounts) {
            // Check if discount applies to this product
            if (discount.applicableTo === 'all' ||
                (discount.applicableTo === 'product' && discount.productIds && discount.productIds.includes(product.id)) ||
                (discount.applicableTo === 'category' && discount.categoryIds && discount.categoryIds.includes(product.category))) {
                
                const subtotal = product.price * quantity;
                
                if (discount.type === 'percentage') {
                    totalDiscount += (subtotal * discount.value / 100);
                } else {
                    totalDiscount += discount.value;
                }
            }
        }

        return totalDiscount;
    } catch (error) {
        console.error('Error calculating discount:', error);
        return 0;
    }
}

/**
 * Apply discounts to cart items
 * @param {Array} cartItems - Array of cart items
 * @returns {Promise<Object>} Object with subtotal, discount, and total
 */
async function applyDiscountsToCart(cartItems) {
    let subtotal = 0;
    let totalDiscount = 0;

    for (const item of cartItems) {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        const itemDiscount = await calculateProductDiscount(item, item.quantity);
        totalDiscount += itemDiscount;
    }

    return {
        subtotal: subtotal,
        discount: totalDiscount,
        total: subtotal - totalDiscount
    };
}
