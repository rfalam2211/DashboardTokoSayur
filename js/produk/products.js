// Products Management Module

let productsCache = [];
let editingProductId = null;

/**
 * Initialize products page
 */
async function initProducts() {
    await loadProducts();
    setupProductsEventListeners();
}

/**
 * Setup event listeners for products page
 */
function setupProductsEventListeners() {
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    // Hide add product button for non-admin users
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        if (!canEdit) {
            addProductBtn.style.display = 'none';
        }
        addProductBtn.addEventListener('click', () => {
            if (!canEdit) {
                showToast('Anda tidak memiliki izin untuk menambah produk', 'warning');
                return;
            }
            openProductModal();
        });
    }

    // Close modal buttons
    document.getElementById('close-product-modal').addEventListener('click', closeProductModal);
    document.getElementById('cancel-product-btn').addEventListener('click', closeProductModal);

    // Product form submit
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);

    // Search products
    const searchInput = document.getElementById('search-products');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    searchInput.addEventListener('input', debounce((e) => {
        const value = e.target.value;
        filterProducts(value, document.getElementById('filter-category').value);

        // Show/hide clear button
        if (clearSearchBtn) {
            clearSearchBtn.style.display = value ? 'flex' : 'none';
        }
    }, 300));

    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            filterProducts('', document.getElementById('filter-category').value);
            searchInput.focus();
        });
    }

    // Filter by category
    document.getElementById('filter-category').addEventListener('change', (e) => {
        filterProducts(document.getElementById('search-products').value, e.target.value);
    });
}

/**
 * Load all products
 */
async function loadProducts() {
    try {
        productsCache = await getAllProducts();
        renderProducts(productsCache);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Gagal memuat produk', 'error');
    }
}

/**
 * Render products table
 */
function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    const currentUser = getCurrentUser();
    const canEdit = currentUser && currentUser.role === 'admin';

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state">
                        <p>Belum ada produk. Klik "Tambah Produk" untuk memulai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <strong>${product.name}</strong>
                ${product.barcode ? `<br><small class="barcode-display">📊 ${formatBarcodeDisplay(product.barcode)}</small>` : ''}
            </td>
            <td>
                <span class="badge badge-success">${product.category}</span>
            </td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="${product.stock < 10 ? 'badge badge-warning' : ''}">${product.stock}</span>
            </td>
            <td>
                ${canEdit ? `
                    <button class="btn btn-text" onclick="editProduct('${product.id}')">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                        </svg>
                        Edit
                    </button>
                    <button class="btn btn-text" style="color: var(--color-danger)" onclick="deleteProductConfirm('${product.id}', '${product.name}')">
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
 * Filter products
 */
function filterProducts(searchTerm, category) {
    let filtered = productsCache;

    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    renderProducts(filtered);
}

/**
 * Open product modal
 */
function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');

    form.reset();

    if (product) {
        title.textContent = 'Edit Produk';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-barcode').value = product.barcode || '';
        editingProductId = product.id;
    } else {
        title.textContent = 'Tambah Produk';
        editingProductId = null;
    }

    modal.classList.add('active');
}

/**
 * Close product modal
 */
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('active');
    editingProductId = null;
}

/**
 * Handle product form submit
 */
async function handleProductSubmit(e) {
    e.preventDefault();

    const form = e.target;

    if (!validateForm(form)) {
        showToast('Mohon lengkapi semua field', 'warning');
        return;
    }

    const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: document.getElementById('product-price').value,
        stock: document.getElementById('product-stock').value,
        barcode: document.getElementById('product-barcode').value.trim() || null
    };

    try {
        if (editingProductId) {
            await updateProduct(editingProductId, productData);
            showToast('Produk berhasil diupdate', 'success');
        } else {
            await addProduct(productData);
            showToast('Produk berhasil ditambahkan', 'success');
        }

        closeProductModal();
        await loadProducts();

    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Gagal menyimpan produk', 'error');
    }
}

/**
 * Edit product
 */
async function editProduct(id) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk mengedit produk', 'warning');
        return;
    }

    try {
        const product = await getProduct(id);
        openProductModal(product);
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Gagal memuat produk', 'error');
    }
}

/**
 * Delete product with confirmation
 */
function deleteProductConfirm(id, name) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Anda tidak memiliki izin untuk menghapus produk', 'warning');
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
        deleteProductById(id);
    }
}

/**
 * Delete product by ID
 */
async function deleteProductById(id) {
    try {
        await deleteProduct(id);
        showToast('Produk berhasil dihapus', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Gagal menghapus produk', 'error');
    }
}

/**
 * Scan barcode for product form
 */
function scanBarcodeForProduct() {
    // Initialize scanner with callback
    initBarcodeScanner((barcode) => {
        // Set the barcode in the product form
        document.getElementById('product-barcode').value = barcode;
        showToast('Barcode berhasil di-scan: ' + barcode, 'success');
    });

    // Show scanner modal
    showBarcodeScannerModal();
}

/**
 * Generate random barcode for product
 */
function generateBarcodeForProduct() {
    const barcode = generateBarcode();
    document.getElementById('product-barcode').value = barcode;
    showToast('Barcode berhasil di-generate', 'success');
}

