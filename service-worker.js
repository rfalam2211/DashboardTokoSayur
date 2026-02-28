// ============================================================
// SERVICE WORKER — Ida Buah PWA
// VERSI: v5 — Updated cache paths untuk struktur JS modular
// Bump versi ini setiap kali ada perubahan JS/CSS penting
// ============================================================

const CACHE_NAME = 'ida-buah-v7';

// Hanya cache file statis yang pasti ada
// Jangan cache API calls atau CDN libraries (bisa fail)
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/catalogue.html',
    '/migrate.html',
    '/app.js',

    // CSS modular
    '/css/index.css',
    '/css/base.css',
    '/css/sidebar.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/pages.css',
    '/css/right-sidebar.css',
    '/css/responsive.css',
    '/catalogue.css',

    // JS — CORE
    '/js/core/utils.js',
    '/js/core/supabase.js',
    '/js/core/database.js',
    '/js/core/activity-log.js',
    '/js/core/offline-sync.js',
    '/js/core/backup.js',
    '/js/core/mobile.js',
    '/js/core/mobile-menu.js',
    '/js/core/theme.js',
    '/js/core/debt-notification.js',

    // JS — PENGGUNA
    '/js/pengguna/auth-v2.js',
    '/js/pengguna/permissions.js',
    '/js/pengguna/users.js',

    // JS — DASHBOARD
    '/js/dashboard/dashboard.js',

    // JS — PRODUK
    '/js/produk/products.js',
    '/js/produk/barcode.js',
    '/js/produk/catalogue.js',

    // JS — KASIR
    '/js/kasir/discounts.js',
    '/js/kasir/receipt-printer.js',
    '/js/kasir/pos.js',

    // JS — TRANSAKSI
    '/js/transaksi/customers.js',
    '/js/transaksi/debts.js',
    '/js/transaksi/transactions.js',

    // JS — LAPORAN
    '/js/laporan/expenses.js',
    '/js/laporan/financial-reports.js',
    '/js/laporan/reports.js',

    // Icons
    '/icons/icon-72x72.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/manifest.json'
];

// ============================================================
// INSTALL — Cache static assets
// ============================================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v5...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // addAll akan fail jika SATU file tidak ada.
                // Kita cache satu per satu agar tidak fail total.
                return Promise.allSettled(
                    STATIC_CACHE.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('[SW] Failed to cache:', url, err.message);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[SW] Install complete ✓');
                return self.skipWaiting();
            })
    );
});

// ============================================================
// ACTIVATE — Hapus cache lama
// ============================================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating v5...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Activated ✓');
            return self.clients.claim();
        })
    );
});

// ============================================================
// FETCH — Strategi: Network-first untuk API, Cache-first untuk assets
// ============================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Jangan intercept: Supabase API, Font CDN, external APIs
    if (
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('cdn.jsdelivr.net') ||
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('qrcode')
    ) {
        return; // Biarkan browser handle langsung
    }

    // Untuk request GET ke file lokal: Cache-first, fallback network
    if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Tetap fetch di background untuk update cache (stale-while-revalidate)
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    }).catch(() => { }); // Ignore network errors in background

                    return cachedResponse;
                }

                // Tidak ada di cache, fetch dari network
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback untuk HTML pages
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
        );
    }
});

// ============================================================
// BACKGROUND SYNC
// ============================================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SYNC_REQUESTED' });
                });
            })
        );
    }
});

// ============================================================
// PUSH NOTIFICATIONS — Pengingat hutang
// ============================================================
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || 'Ada hutang pelanggan yang jatuh tempo!',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'debt-reminder',
        data: { url: data.url || '/#debts' },
        actions: [
            { action: 'view', title: '📋 Lihat Detail' },
            { action: 'close', title: '✕ Tutup' }
        ]
    };
    event.waitUntil(
        self.registration.showNotification(data.title || '🥬 Ida Buah', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'view' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(clientList => {
                const targetUrl = event.notification.data?.url || '/';
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }
                return clients.openWindow(targetUrl);
            })
        );
    }
});
