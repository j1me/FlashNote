self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('flashnote-cache').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './styles.css',
                './webrtc.js',
                './manifest.json',
                './qrcode.min.js'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
