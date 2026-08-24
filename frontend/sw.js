// Service Worker para Danzas Folklóricas Argentinas
// Maneja el routing SPA en GitHub Pages interceptando TODAS las navegaciones
// y sirviendo index.html para cualquier ruta que no sea un asset estático.

const CACHE_NAME = 'danzas-folkloricas-v2';
const BASE_PATH = '/danzas-folkloricas-argentinas';
const STATIC_ASSETS = [
    BASE_PATH + '/',
    BASE_PATH + '/index.html',
    BASE_PATH + '/script.js',
    BASE_PATH + '/styles.css',
    BASE_PATH + '/danzas-cache.js',
    BASE_PATH + '/favicon.svg',
    BASE_PATH + '/sw.js',
    BASE_PATH + '/404.html',
];

// Instalación: cachear assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
}

// Activación: limpiar caches antiguos y tomar control inmediato
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
}

// Helper: determinar si es una navegación (HTML)
function isNavigation(request) {
    const acceptHeader = request.headers.get('accept') || '';
    return acceptHeader.includes('text/html');
}

// Helper: determinar si es un asset estático
function isStaticAsset(pathname) {
    return /\.(css|js|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|json|xml|txt|map)$/i.test(pathname);
}

// Helper: determinar si es una ruta de la app (no asset, no API)
function isAppRoute(pathname) {
    return !isStaticAsset(pathname) && !pathname.startsWith('/api/');
}

// Interceptar TODAS las peticiones
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

    // Ignorar assets estáticos (los deja pasar normalmente al navegador)
    if (isStaticAsset(pathname)) {
        return;
    }

    // Ignorar peticiones a la API
    if (pathname.startsWith('/api/')) {
        return;
    }

    // Para TODAS las navegaciones (HTML), usar estrategia:
    // 1. Intentar red
    // 2. Si falla (404, offline, etc.), servir index.html desde cache
    const acceptHeader = request.headers.get('accept') || '';
    const isNavigationRequest = acceptHeader.includes('text/html');

    if (isNavigationRequest) {
        event.respondWith(
            (async () => {
                try {
                    // Intentar obtener de la red
                    const networkResponse = await fetch(request);
                    if (networkResponse.ok) {
                        return networkResponse;
                    }
                    // Si la red falla (404, offline, etc.), servir index.html desde cache
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(BASE_PATH + '/index.html');
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Fallback: intentar fetch index.html
                    const indexResponse = await fetch(BASE_PATH + '/index.html');
                    if (indexResponse.ok) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(BASE_PATH + '/index.html', indexResponse.clone());
                        return indexResponse;
                    }
                    return new Response('Offline', { status: 503 });
                } catch (error) {
                    const cache = await caches.open(CACHE_NAME);
                    const cachedResponse = await cache.match(BASE_PATH + '/index.html');
                    return cachedResponse || new Response('Offline', { status: 503 });
                }
            })()
        );
        return;
    }

    // Para otros recursos (no navegación, no API, no assets estáticos),
    // usar estrategia "Cache First, fallback to Network"
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
    return;
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});