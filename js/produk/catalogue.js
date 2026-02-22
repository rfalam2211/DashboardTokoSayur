// Public Catalogue Module

let allProducts = [];
let filteredProducts = [];
let currentView = 'grid'; // 'grid' or 'list'

/**
 * Initialize catalogue page
 */
async function initCatalogue() {
    try {
        // Initialize database
        await initDB();
        
        // Load products
        await loadProducts();
        
        // Render products
        renderProducts(allProducts);
        
        console.log('Catalogue initialized successfully');
    } catch (error) {
        console.error('Error initializing catalogue:', error);
        showError('Gagal memuat katalog produk');
    }
}

/**
 * Load products from database
 */
async function loadProducts() {
    try {
        allProducts = await getAllProducts();
        filteredProducts = [...allProducts];
        updateProductCount();
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
}

/**
 * Render products to grid
 */
function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (products.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    grid.innerHTML = products.map(product => {
        const stockStatus = getStockStatus(product.stock);
        const emoji = getCategoryEmoji(product.category);
        
        return `
            <div class="product-card" onclick="showProductDetail('${product.id}')">
                <div class="product-image">
                    ${emoji}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <span class="product-category">${product.category}</span>
                    <div class="product-stock">
                        <span class="stock-info">Stok: ${product.stock}</span>
                        <span class="stock-badge ${stockStatus.class}">${stockStatus.label}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get stock status
 */
function getStockStatus(stock) {
    if (stock === 0) {
        return { class: 'out-of-stock', label: 'Habis' };
    } else if (stock < 10) {
        return { class: 'low-stock', label: 'Stok Rendah' };
    } else {
        return { class: 'in-stock', label: 'Tersedia' };
    }
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category) {
    const emojiMap = {
        'makanan': '🍱',
        'minuman': '🥤',
        'snack': '🍿',
        'lainnya': '📦'
    };
    return emojiMap[category] || '📦';
}

/**
 * Search products
 */
function searchProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const stockFilter = document.getElementById('stock-filter').value;
    
    filteredProducts = allProducts.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        // Stock filter
        let matchesStock = true;
        if (stockFilter === 'available') {
            matchesStock = product.stock > 0;
        } else if (stockFilter === 'low') {
            matchesStock = product.stock > 0 && product.stock < 10;
        } else if (stockFilter === 'out') {
            matchesStock = product.stock === 0;
        }
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    renderProducts(filteredProducts);
    updateProductCount();
}

/**
 * Filter by category
 */
function filterByCategory() {
    searchProducts();
}

/**
 * Filter by stock
 */
function filterByStock() {
    searchProducts();
}

/**
 * Update product count
 */
function updateProductCount() {
    const count = document.getElementById('product-count');
    count.textContent = filteredProducts.length;
}

/**
 * Toggle view (grid/list)
 */
function toggleView() {
    const grid = document.getElementById('products-grid');
    const icon = document.getElementById('view-icon');
    
    if (currentView === 'grid') {
        currentView = 'list';
        grid.classList.add('list-view');
        icon.innerHTML = `
            <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        `;
    } else {
        currentView = 'grid';
        grid.classList.remove('list-view');
        icon.innerHTML = `
            <path d="M10 3H3V10H10V3Z" stroke="currentColor" stroke-width="2"/>
            <path d="M21 3H14V10H21V3Z" stroke="currentColor" stroke-width="2"/>
            <path d="M21 14H14V21H21V14Z" stroke="currentColor" stroke-width="2"/>
            <path d="M10 14H3V21H10V14Z" stroke="currentColor" stroke-width="2"/>
        `;
    }
}

/**
 * Show product detail modal
 */
function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('product-modal');
    const stockStatus = getStockStatus(product.stock);
    
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-category').textContent = product.category;
    document.getElementById('modal-product-stock').textContent = product.stock;
    document.getElementById('modal-product-status').innerHTML = `<span class="stock-badge ${stockStatus.class}">${stockStatus.label}</span>`;
    
    // Show barcode if available
    const barcodeRow = document.getElementById('modal-barcode-row');
    if (product.barcode) {
        document.getElementById('modal-product-barcode').textContent = formatBarcodeDisplay(product.barcode);
        barcodeRow.style.display = 'flex';
    } else {
        barcodeRow.style.display = 'none';
    }
    
    modal.classList.add('active');
}

/**
 * Close product modal
 */
function closeProductModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('active');
}

/**
 * Show error message
 */
function showError(message) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div class="loading-state">
            <p style="color: var(--color-danger);">${message}</p>
        </div>
    `;
}

/**
 * Format barcode for display
 */
function formatBarcodeDisplay(barcode) {
    if (!barcode) return '';
    
    // Add spaces for readability
    if (barcode.length === 13) {
        return barcode.replace(/(\d{3})(\d{4})(\d{4})(\d{1})/, '$1 $2 $3 $4');
    } else if (barcode.length === 12) {
        return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    
    return barcode;
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('product-modal');
    if (e.target === modal) {
        closeProductModal();
    }
});

// Initialize catalogue when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalogue);
} else {
    initCatalogue();
}
