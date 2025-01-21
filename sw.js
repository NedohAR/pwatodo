const cacheName = 'quicknote-cache-v1';

self.addEventListener('install', (event) => {
    console.log('Service worker installed');
})

self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
    event.waitUntil (
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== cacheName).map((name) => caches.delete(name))
            )
        })
    )
    }
)

self.addEventListener('fetch', (event) => {
    console.log('Fetch event');

    event.respondWith(
        fetch(event.request).then((response) => {
            return caches.open(cacheName).then((cache) => {
                cache.put(event.request.url, response.clone());
                return response;
            })
        }).catch(() => {
            return caches.match(event.request);
        })
    )
})