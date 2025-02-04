const cacheName = 'quicknote-cache-v1';
const filesToCache = [
    '/index.html',
    '/app.js',
    '/style.css',
    '/db.js',
    '/manifest.json',
    '/sw.js'
];


self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('Caching files...');
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    const cacheWhitelist = [cacheName];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (!cacheWhitelist.includes(cache)) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetching...', event.request.url);

    event.respondWith(
        fetch(event.request)
            .then((response) => {

                return caches.open(cacheName).then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            })
            .catch(() => {

                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return caches.match('/offline.html');
                });
            })
    );
});




