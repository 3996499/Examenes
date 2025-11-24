self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request, { cache: 'reload' })
            .catch(() => fetch(event.request))
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return Response.redirect('/index.html');
                }
                return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
            })
    );
});
