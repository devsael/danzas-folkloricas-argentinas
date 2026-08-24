// Service Worker para Danzas Folklóricas Argentinas
// Maneja el routing SPA en GitHub Pages interceptando navegaciones
// y sirviendo index.html para todas las rutas de la aplicación.

const CACHE_NAME = 'danzas-folkloricas-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/script.js',
    '/styles.css',
    '/danzas-cache.js',
    '/favicon.svg',
];

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptar peticiones: estrategia "Network First, fallback to Cache"
// Para navegaciones (HTML), servir index.html si no está en cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo manejar peticiones del mismo origen
    if (url.origin !== location.origin) {
        return;
    }

    // Solo manejar GET
    if (request.method !== 'GET') {
        return;
    }

    const pathname = url.pathname;

    // Ignorar assets estáticos (los deja pasar normalmente)
    if (/\.(css|js|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|json|xml|txt|map)$/i.test(pathname)) {
        return;
    }

    // Para navegaciones (HTML), usar estrategia "Network First, fallback to index.html"
    const acceptHeader = request.headers.get('accept') || '';
    const isNavigation = acceptHeader.includes('text/html');

    if (isNavigation) {
        event.respondWith(
            (async () => {
                try {
                    // Intentar obtener de la red
                    const networkResponse = await fetch(request);
                    if (networkResponse.ok) {
                        return networkResponse;
                    }
                    // Si la red falla (404, etc.), servir index.html desde cache
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match('/index.html');
                    return cachedResponse || new Response('Offline', { status: 503 });
                } catch (error) {
                    // Si todo falla, servir index.html desde cache
                    const cache = await caches.open(CACHE_NAME);
                    return cache.match('/index.html') || new Response('Offline', { status: 503 });
                }
            })()
        );
        return;
    }

    // Para otros recursos (API, etc.), usar estrategia "Cache First, fallback to Network"
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
            try {
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            } catch (error) {
                return new Response('Offline', { status: 503 });
            }
        })()
    );
});

// Manejar mensajes del cliente (para skipWaiting, etc.)
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});