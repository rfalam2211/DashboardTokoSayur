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
    searchInput.addEventListener('input', debounce((e) => {
        filterPOSProducts(e.target.value);
    }, 300));

    // Clear cart
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        if (cart.length > 0 && confirm('Kosongkan keranjang?')) {
            cart = [];
            renderCart();
        }
    });

    // Process transaction
    document.getElementById('process-transaction-btn').addEventListener('click', processTransaction);
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
 * Render cart
 */
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total-amount');
    const processBtn = document.getElementById('process-transaction-btn');

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Keranjang kosong</p></div>';
        totalElement.textContent = formatCurrency(0);
        processBtn.disabled = true;
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatCurrency(item.price)} × ${item.quantity} = ${formatCurrency(item.price * item.quantity)}</p>
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
    `).join('');

    totalElement.textContent = formatCurrency(total);
    processBtn.disabled = false;
}

/**
 * Process transaction
 */
async function processTransaction() {
    if (cart.length === 0) {
        showToast('Keranjang kosong', 'warning');
        return;
    }

    const paymentMethod = document.getElementById('payment-method').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        // Create transaction
        const transactionData = {
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: total,
            paymentMethod: paymentMethod
        };

        const transactionId = await addTransaction(transactionData);

        // Update stock for each item
        for (const item of cart) {
            await updateStock(item.id, -item.quantity);
        }

        showToast('Transaksi berhasil!', 'success');

        // Clear cart
        cart = [];
        renderCart();

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
