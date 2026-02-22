// Point of Sale (POS) Module

let cart = [];
let posProductsCache = [];

/**
 * Initialize POS page
 */
async function initPOS() {
    await loadPOSProducts();
    setupPOSEventListeners();
    renderCart();
}

/**
 * Setup event listeners for POS page
 */
function setupPOSEventListeners() {
    // Search products
    const searchInput = document.getElementById('search-pos-products');
    const clearBtn = document.getElementById('clear-pos-search-btn');

    searchInput.addEventListener('input', debounce((e) => {
        filterPOSProducts(e.target.value);
        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = e.target.value ? 'flex' : 'none';
        }
    }, 300));

    // Clear search button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterPOSProducts('');
            searchInput.focus();
        });
    }

    // Barcode scan button
    const scanBtn = document.getElementById('scan-barcode-pos-btn');
    if (scanBtn) {
        scanBtn.addEventListener('click', scanBarcodeInPOS);
    }

    // Clear cart
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        if (cart.length > 0 && confirm('Kosongkan keranjang?')) {
            cart = [];
            renderCart();
        }
    });

    // Process transaction
    document.getElementById('process-transaction-btn').addEventListener('click', processTransaction);

    // Payment method change
    const paymentMethod = document.getElementById('payment-method');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', toggleCreditCustomerSelect);
    }
}

/**
 * Load products for POS
 */
async function loadPOSProducts() {
    try {
        posProductsCache = await getAllProducts();
        // Only show products with stock > 0
        posProductsCache = posProductsCache.filter(p => p.stock > 0);
        renderPOSProducts(posProductsCache);
    } catch (error) {
        console.error('Error loading POS products:', error);
        showToast('Gagal memuat produk', 'error');
    }
}

/**
 * Render products grid for POS
 */
function renderPOSProducts(products) {
    const container = document.getElementById('pos-products-list');

    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Tidak ada produk tersedia</p></div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item" onclick="addToCart('${product.id}')">
            <h4>${product.name}</h4>
            <p class="price">${formatCurrency(product.price)}</p>
            <p>Stok: ${product.stock}</p>
        </div>
    `).join('');
}

/**
 * Filter POS products
 */
function filterPOSProducts(searchTerm) {
    let filtered = posProductsCache;

    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    renderPOSProducts(filtered);
}

/**
 * Add product to cart
 */
async function addToCart(productId) {
    try {
        const product = await getProduct(productId);

        if (!product || product.stock <= 0) {
            showToast('Produk tidak tersedia', 'warning');
            return;
        }

        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                showToast('Stok tidak mencukupi', 'warning');
                return;
            }
            existingItem.quantity++;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                maxStock: product.stock
            });
        }

        renderCart();

    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Gagal menambahkan ke keranjang', 'error');
    }
}

/**
 * Remove item from cart
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

/**
 * Update cart item quantity
 */
function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);

    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > item.maxStock) {
        showToast('Stok tidak mencukupi', 'warning');
        return;
    }

    item.quantity = newQuantity;
    renderCart();
}

/**
 * Render cart with discount calculations
 */
async function renderCart() {
    const container = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('cart-subtotal');
    const discountElement = document.getElementById('cart-discount');
    const totalElement = document.getElementById('cart-total-amount');
    const processBtn = document.getElementById('process-transaction-btn');

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Keranjang kosong</p></div>';
        if (subtotalElement) subtotalElement.textContent = formatCurrency(0);
        if (discountElement) discountElement.textContent = formatCurrency(0);
        totalElement.textContent = formatCurrency(0);
        processBtn.disabled = true;
        return;
    }

    // Calculate discounts for each item
    let subtotal = 0;
    let totalDiscount = 0;

    for (let item of cart) {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        // Use manual discount if set, otherwise calculate automatic discount
        if (item.manualDiscount !== undefined) {
            item.discount = item.manualDiscount;
        } else if (item.discountDisabled) {
            item.discount = 0;
        } else {
            const autoDiscount = await calculateProductDiscount(item, item.quantity);
            item.discount = autoDiscount;
        }

        item.finalPrice = itemSubtotal - item.discount;
        totalDiscount += item.discount;
    }

    const total = subtotal - totalDiscount;

    container.innerHTML = cart.map(item => {
        const itemSubtotal = item.price * item.quantity;
        const hasDiscount = item.discount > 0;
        const isManual = item.manualDiscount !== undefined;

        return `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                ${hasDiscount ? `
                    <p class="original-price" style="text-decoration: line-through; color: var(--color-gray-500);">
                        ${formatCurrency(item.price)} × ${item.quantity} = ${formatCurrency(itemSubtotal)}
                    </p>
                    <p class="discounted-price" style="color: var(--color-success); font-weight: 600;">
                        Diskon ${isManual ? '(Manual)' : '(Auto)'}: -${formatCurrency(item.discount)} → ${formatCurrency(item.finalPrice)}
                    </p>
                ` : `
                    <p>${formatCurrency(item.price)} × ${item.quantity} = ${formatCurrency(itemSubtotal)}</p>
                `}
                <div class="discount-controls">
                    <button class="btn-discount-toggle ${item.discountDisabled ? 'disabled' : 'enabled'}" 
                            onclick="toggleItemDiscount('${item.id}')" 
                            title="${item.discountDisabled ? 'Aktifkan diskon otomatis' : 'Nonaktifkan diskon'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        ${item.discountDisabled ? 'Diskon Off' : 'Diskon On'}
                    </button>
                    <div class="manual-discount-group">
                        <label>Diskon Manual:</label>
                        <div class="input-with-prefix">
                            <span class="prefix">Rp</span>
                            <input type="text" 
                                   placeholder="0" 
                                   value="${isManual ? formatNumber(item.manualDiscount) : ''}" 
                                   onchange="setManualDiscount('${item.id}', this.value)"
                                   oninput="formatDiscountInput(this)"
                                   class="discount-input"
                                   ${item.discountDisabled ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
                <button class="btn btn-text" style="color: var(--color-danger)" onclick="removeFromCart('${item.id}')">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    }).join('');

    // Update totals
    if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
    if (discountElement) {
        discountElement.textContent = formatCurrency(totalDiscount);
        discountElement.style.color = totalDiscount > 0 ? 'var(--color-success)' : '';
    }
    totalElement.textContent = formatCurrency(total);
    processBtn.disabled = false;
}

/**
 * Process transaction with discount and credit sales support
 */
async function processTransaction() {
    if (cart.length === 0) {
        showToast('Keranjang kosong', 'warning');
        return;
    }

    const paymentMethod = document.getElementById('payment-method').value;

    // Calculate totals with discounts
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
    const total = subtotal - totalDiscount;

    // Check for credit sales
    if (paymentMethod === 'credit') {
        const customerName = document.getElementById('credit-customer-name')?.value.trim();
        if (!customerName) {
            showToast('Masukkan nama pelanggan untuk penjualan kredit', 'warning');
            return;
        }
    }

    try {
        // Create transaction
        const transactionData = {
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                discount: item.discount || 0
            })),
            subtotal: subtotal,
            discount: totalDiscount,
            total: total,
            paymentMethod: paymentMethod
        };

        const transactionId = await addTransaction(transactionData);

        // Handle credit sales
        if (paymentMethod === 'credit') {
            const customerName = document.getElementById('credit-customer-name').value.trim();

            // Check if customer exists, if not create new one
            let customer = null;
            const allCustomers = await getAllCustomers();
            customer = allCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase());

            if (!customer) {
                // Create new customer
                const newCustomer = {
                    name: customerName,
                    phone: '',
                    address: '',
                    totalDebt: total
                };
                const customerId = await addCustomer(newCustomer);
                customer = { id: customerId, ...newCustomer };
                showToast(`Pelanggan baru "${customerName}" berhasil ditambahkan`, 'info');
            }

            // Create debt record
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

            await addDebt({
                customerId: customer.id,
                customerName: customer.name,
                transactionId: transactionId,
                amount: total,
                dueDate: dueDate.toISOString().split('T')[0],
                notes: `Transaksi #${transactionId}`
            });

            showToast(`Penjualan kredit berhasil untuk ${customer.name}`, 'success');
        } else {
            showToast('Transaksi berhasil!', 'success');
        }

        // Update stock for each item
        for (const item of cart) {
            await updateStock(item.id, -item.quantity);
        }

        // Clear cart
        cart = [];
        renderCart();

        // Reset payment method and customer input
        document.getElementById('payment-method').value = 'cash';
        toggleCreditCustomerSelect();

        // Reload products
        await loadPOSProducts();

        // Refresh dashboard if on dashboard page
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            await refreshDashboard();
        }

    } catch (error) {
        console.error('Error processing transaction:', error);
        showToast('Gagal memproses transaksi', 'error');
    }
}

/**
 * Scan barcode in POS to add product
 */
function scanBarcodeInPOS() {
    initBarcodeScanner(async (barcode) => {
        try {
            const product = await getProductByBarcode(barcode);
            if (product) {
                if (product.stock > 0) {
                    await addToCart(product.id);
                    showToast(`${product.name} ditambahkan ke keranjang`, 'success');
                } else {
                    showToast(`${product.name} stok habis`, 'warning');
                }
            } else {
                showToast('Produk dengan barcode ini tidak ditemukan', 'error');
            }
        } catch (error) {
            console.error('Error finding product by barcode:', error);
            showToast('Gagal mencari produk', 'error');
        }
    });

    showBarcodeScannerModal();
}

/**
 * Toggle credit customer input visibility
 */
function toggleCreditCustomerSelect() {
    const paymentMethod = document.getElementById('payment-method').value;
    const creditContainer = document.getElementById('credit-customer-container');

    if (!creditContainer) return;

    if (paymentMethod === 'credit') {
        creditContainer.style.display = 'block';
        // Focus on input when shown
        const input = document.getElementById('credit-customer-name');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    } else {
        creditContainer.style.display = 'none';
        // Clear input when hidden
        const input = document.getElementById('credit-customer-name');
        if (input) {
            input.value = '';
        }
    }
}

/**
 * Toggle discount for a cart item
 */
function toggleItemDiscount(productId) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.discountDisabled = !item.discountDisabled;

    renderCart();
}

/**
 * Format number with thousand separators (dots)
 */
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format discount input as user types
 */
function formatDiscountInput(input) {
    // Remove all non-digit characters
    let value = input.value.replace(/\D/g, '');

    // Format with thousand separators
    if (value) {
        const formatted = new Intl.NumberFormat('id-ID').format(parseInt(value));
        input.value = formatted;
    }
}

/**
 * Set manual discount for a cart item
 */
function setManualDiscount(productId, value) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    // Remove dots and parse as number
    const cleanValue = value.replace(/\./g, '');
    const discountAmount = parseInt(cleanValue) || 0;
    const itemSubtotal = item.price * item.quantity;

    if (discountAmount <= 0) {
        // Clear manual discount if zero or invalid
        delete item.manualDiscount;
    } else if (discountAmount > itemSubtotal) {
        showToast('Diskon tidak boleh lebih besar dari subtotal', 'warning');
        return;
    } else {
        item.manualDiscount = discountAmount;
        item.discountDisabled = false;
    }

    renderCart();
}
