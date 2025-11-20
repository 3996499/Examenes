const CACHE_NAME = 'hub-shell-v1';
const APP_SHELL = [
    './',
    './index.html',
    './hub.js',
    './manifest.webmanifest',
    '../../shared/styles/theme.css',
    '../../shared/assets/favicon.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => Promise.resolve())
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request)
                .then(networkResponse => {
                    if (
                        !networkResponse ||
                        networkResponse.status !== 200 ||
                        networkResponse.type !== 'basic'
                    ) {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                    return caches.match('../../shared/assets/favicon.svg');
                });
        })
    );
});
