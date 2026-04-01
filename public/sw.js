const CACHE_NAME = 'lm-passo-v20';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    // NOTE: JS and CSS are NOT cached by the SW — always fetched fresh from server
    // Local fonts
    '/fonts/inter-300.ttf',
    '/fonts/inter-400.ttf',
    '/fonts/inter-500.ttf',
    '/fonts/inter-600.ttf',
    '/fonts/inter-700.ttf',
    // Local Ionicons
    '/libs/ionicons/ionicons.esm.js',
    '/libs/ionicons/ionicons.js',
    '/libs/ionicons/p-d15ec307.js',
    '/libs/ionicons/svg/clipboard-outline.svg',
    '/libs/ionicons/svg/people-outline.svg',
    '/libs/ionicons/svg/pricetags-outline.svg',
    '/libs/ionicons/svg/cube-outline.svg',
    '/libs/ionicons/svg/cash-outline.svg',
    '/libs/ionicons/svg/settings-outline.svg',
    '/libs/ionicons/svg/menu-outline.svg',
    '/libs/ionicons/svg/log-out-outline.svg',
    '/libs/ionicons/svg/receipt-outline.svg',
    '/libs/ionicons/svg/checkmark-done-outline.svg',
    '/libs/ionicons/svg/time-outline.svg',
    '/libs/ionicons/svg/checkmark-circle-outline.svg',
    '/libs/ionicons/svg/warning-outline.svg',
    '/libs/ionicons/svg/alert-circle-outline.svg',
];

// Listen for SKIP_WAITING message from client (auto-update flow)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Install — cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting(); // Activate immediately
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
    self.clients.claim(); // Take control immediately
});

// Fetch strategy:
// - JS / CSS: Network First (sempre pega versão mais recente do servidor)
// - API: Network First com fallback offline
// - Outros estáticos (fontes, SVGs): Cache First (mudam raramente)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // SSE Streams cannot be intercepted by SW or cached, otherwise they buffer infinitely and crash the app
    if (url.pathname.includes('/stream')) {
        return; // Bypass Service Worker entirely
    }

    // API calls: always try network first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful GET responses for offline fallback
                    if (event.request.method === 'GET' && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline — try cache
                    return caches.match(event.request).then(cached => {
                        return cached || new Response(JSON.stringify({ error: 'Offline' }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
        return;
    }

    // JS and CSS: Network ONLY — never serve from cache, always get latest from server
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .catch(() => {
                    // Only fall back to cache if network is completely unavailable
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Other static assets (fonts, SVGs, images): Cache First
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse.ok) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            }).catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
