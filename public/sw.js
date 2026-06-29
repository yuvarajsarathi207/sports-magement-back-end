const CACHE = 'tournament-hub-v3';

const ASSET_PATHS = ['/build/', '/icons/'];

function isAssetRequest(url) {
    return ASSET_PATHS.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    // Never intercept page loads — installed PWA must fetch /app/ from network
    if (request.mode === 'navigate') return;

    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) return;

    if (!isAssetRequest(url)) return;

    event.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(request);
            try {
                const response = await fetch(request);
                if (response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            } catch (err) {
                if (cached) return cached;
                throw err;
            }
        })
    );
});
