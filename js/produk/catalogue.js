// ============================================================
// CATALOGUE.JS — Public Product Catalogue
// Features: dynamic categories, product images, QR code, share
// ============================================================

let allProducts = [];
let filteredProducts = [];
let currentView = 'grid';
let currentProductForShare = null;

// ============================================================
// INIT
// ============================================================

async function initCatalogue() {
    try {
        await initDB();
        await loadProducts();
        populateCategoryFilter();
        renderProducts(allProducts);
        setupShareLink();
        checkNativeShare();
        console.log('[Catalogue] Initialized ✓');
    } catch (error) {
        console.error('[Catalogue] Init error:', error);
        showCatalogueError('Gagal memuat katalog. Pastikan koneksi internet tersedia.');
    }
}

// ============================================================
// LOAD & RENDER PRODUCTS
// ============================================================

async function loadProducts() {
    try {
        allProducts = await getAllProducts();
        filteredProducts = [...allProducts];
        updateProductCount();

        // Hide loading state
        const loading = document.getElementById('loading-state');
        if (loading) loading.style.display = 'none';
    } catch (error) {
        console.error('[Catalogue] Load products error:', error);
        throw error;
    }
}

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');

    // Remove loading state if present
    const loading = document.getElementById('loading-state');
    if (loading) loading.remove();

    if (products.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = products.map(product => {
        const stockStatus = getStockStatus(product.stock);
        const emoji = getCategoryEmoji(product.category);
        const hasImage = product.image_url && product.image_url.trim() !== '';
        const priceFormatted = formatRupiah(product.price);

        const imageContent = hasImage
            ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" 
                   onerror="this.style.display='none'; this.previousElementSibling.style.display='block'">
               <span class="product-emoji" style="display:none">${emoji}</span>`
            : `<span class="product-emoji">${emoji}</span>`;

        return `
            <div class="product-card" onclick="showProductDetail('${product.id}')" 
                 id="card-${product.id}" role="button" tabindex="0"
                 onkeydown="if(event.key==='Enter') showProductDetail('${product.id}')">
                <div class="product-image">
                    ${imageContent}
                </div>
                <div class="product-info">
                    <h3 class="product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3>
                    <span class="product-category">${escapeHtml(product.category || 'lainnya')}</span>
                    <p class="product-price">${priceFormatted}</p>
                    <div class="product-stock">
                        <span class="stock-info">Stok: <strong>${product.stock}</strong></span>
                        <span class="stock-badge ${stockStatus.class}">${stockStatus.label}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// CATEGORY FILTER — DYNAMIC
// ============================================================

function populateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;

    // Get unique categories from products
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();

    // Keep the first "Semua Kategori" option
    select.innerHTML = '<option value="">Semua Kategori</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = capitalizeFirst(cat);
        select.appendChild(opt);
    });
}

// ============================================================
// SEARCH & FILTER
// ============================================================

function searchProducts() {
    applyFilters();
}

function filterByCategory() {
    applyFilters();
}

function filterByStock() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const categoryFilter = document.getElementById('category-filter').value;
    const stockFilter = document.getElementById('stock-filter').value;

    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchTerm) ||
            (product.category && product.category.toLowerCase().includes(searchTerm));

        const matchesCategory = !categoryFilter || product.category === categoryFilter;

        let matchesStock = true;
        if (stockFilter === 'available') matchesStock = product.stock > 0;
        else if (stockFilter === 'low') matchesStock = product.stock > 0 && product.stock < 10;
        else if (stockFilter === 'out') matchesStock = product.stock === 0;

        return matchesSearch && matchesCategory && matchesStock;
    });

    renderProducts(filteredProducts);
    updateProductCount();
}

function updateProductCount() {
    const el = document.getElementById('product-count');
    if (el) el.textContent = filteredProducts.length;
}

// ============================================================
// TOGGLE VIEW
// ============================================================

function toggleView() {
    const grid = document.getElementById('products-grid');
    const icon = document.getElementById('view-icon');

    if (currentView === 'grid') {
        currentView = 'list';
        grid.classList.add('list-view');
        icon.innerHTML = `<path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
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

// ============================================================
// PRODUCT DETAIL MODAL
// ============================================================

function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    currentProductForShare = product;
    const modal = document.getElementById('product-modal');
    const stockStatus = getStockStatus(product.stock);

    // Name
    document.getElementById('modal-product-name').textContent = product.name;

    // Image / Emoji
    const emojiEl = document.getElementById('modal-product-emoji');
    const imgEl = document.getElementById('modal-product-img');
    if (product.image_url && product.image_url.trim()) {
        imgEl.src = product.image_url;
        imgEl.style.display = 'block';
        emojiEl.style.display = 'none';
        imgEl.onerror = () => {
            imgEl.style.display = 'none';
            emojiEl.style.display = 'block';
        };
    } else {
        imgEl.style.display = 'none';
        emojiEl.style.display = 'block';
        emojiEl.textContent = getCategoryEmoji(product.category);
    }

    // Info
    document.getElementById('modal-product-category').textContent = capitalizeFirst(product.category || 'lainnya');
    document.getElementById('modal-product-price').textContent = formatRupiah(product.price);
    document.getElementById('modal-product-stock').textContent = product.stock + ' unit';
    document.getElementById('modal-product-status').innerHTML =
        `<span class="stock-badge ${stockStatus.class}">${stockStatus.label}</span>`;

    // Barcode
    const barcodeRow = document.getElementById('modal-barcode-row');
    if (product.barcode) {
        document.getElementById('modal-product-barcode').textContent = formatBarcodeDisplay(product.barcode);
        barcodeRow.style.display = 'flex';
    } else {
        barcodeRow.style.display = 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentProductForShare = null;
}

// Share current product via WhatsApp
function shareProductWhatsApp() {
    if (!currentProductForShare) return;
    const p = currentProductForShare;
    const status = getStockStatus(p.stock);
    const url = getCatalogueUrl();
    const msg = `🛒 *${p.name}*\n💰 Harga: ${formatRupiah(p.price)}\n📦 Stok: ${p.stock} (${status.label})\n\n🔗 Lihat katalog lengkap:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ============================================================
// QR CODE MODAL
// ============================================================

function openQRModal() {
    const modal = document.getElementById('qr-modal');
    const canvas = document.getElementById('qr-canvas');
    const urlText = document.getElementById('qr-url-text');
    const url = getCatalogueUrl();

    urlText.textContent = url;

    // Generate QR code using qrcode.js
    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvas, url, {
            width: 220,
            margin: 2,
            color: {
                dark: '#111827',
                light: '#ffffff'
            }
        }, (err) => {
            if (err) console.error('QR Code error:', err);
        });
    } else {
        canvas.getContext('2d').fillText('QR tidak tersedia', 10, 10);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQRModal() {
    document.getElementById('qr-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function downloadQRCode() {
    const canvas = document.getElementById('qr-canvas');
    const link = document.createElement('a');
    link.download = 'katalog-ida-buah-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showCatalogueToast('QR Code berhasil didownload!', 'success');
}

// ============================================================
// SHARE MODAL
// ============================================================

function setupShareLink() {
    const input = document.getElementById('share-link-input');
    if (input) input.value = getCatalogueUrl();
}

function openShareModal() {
    document.getElementById('share-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeShareModal() {
    document.getElementById('share-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function shareWhatsApp() {
    const url = getCatalogueUrl();
    const msg = `🥬 *Katalog Produk Ida Buah*\n\nCek produk segar kami lengkap dengan stok dan harga terbaru!\n\n🔗 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function copyLink() {
    const url = getCatalogueUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showCatalogueToast('Link berhasil disalin!', 'success');
        }).catch(() => fallbackCopy(url));
    } else {
        fallbackCopy(url);
    }
}

function fallbackCopy(text) {
    const input = document.getElementById('share-link-input');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            showCatalogueToast('Link berhasil disalin!', 'success');
        } catch {
            showCatalogueToast('Gagal menyalin link', 'error');
        }
    }
}

function checkNativeShare() {
    if (navigator.share) {
        const btn = document.getElementById('btn-native-share');
        if (btn) btn.style.display = 'flex';
    }
}

function nativeShare() {
    const url = getCatalogueUrl();
    if (navigator.share) {
        navigator.share({
            title: 'Katalog Produk - Ida Buah',
            text: 'Cek katalog produk segar Ida Buah!',
            url: url
        }).catch(() => { }); // user cancelled is ok
    }
}

// ============================================================
// HELPERS
// ============================================================

function getCatalogueUrl() {
    // Build the catalogue URL based on current page location
    const base = window.location.href.split('?')[0].split('#')[0];
    // If on localhost or file://, use it as-is; otherwise use the deployed URL
    return base;
}

function getStockStatus(stock) {
    if (stock === 0) return { class: 'out-of-stock', label: 'Habis' };
    if (stock < 10) return { class: 'low-stock', label: 'Stok Rendah' };
    return { class: 'in-stock', label: 'Tersedia' };
}

function getCategoryEmoji(category) {
    const map = {
        'makanan': '🍱', 'minuman': '🥤', 'snack': '🍿',
        'sayuran': '🥬', 'buah': '🍎', 'bumbu': '🌶️',
        'daging': '🥩', 'ikan': '🐟', 'susu': '🥛',
        'lainnya': '📦'
    };
    return map[category?.toLowerCase()] || '📦';
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function formatBarcodeDisplay(barcode) {
    if (!barcode) return '';
    if (barcode.length === 13) return barcode.replace(/(\d{3})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4');
    if (barcode.length === 12) return barcode.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    return barcode;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showCatalogueError(message) {
    const grid = document.getElementById('products-grid');
    if (grid) grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-icon">⚠️</div>
            <p>${message}</p>
        </div>
    `;
}

let toastTimer;
function showCatalogueToast(message, type = 'info') {
    const toast = document.getElementById('catalogue-toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `catalogue-toast ${type} show`;
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================================
// CLOSE MODALS ON BACKDROP CLICK
// ============================================================

document.addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') closeProductModal();
    if (e.target.id === 'qr-modal') closeQRModal();
    if (e.target.id === 'share-modal') closeShareModal();
});

// Keyboard ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
        closeQRModal();
        closeShareModal();
    }
});

// ============================================================
// BOOTSTRAP
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalogue);
} else {
    initCatalogue();
}
