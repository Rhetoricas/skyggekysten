import { build, files, version } from '$service-worker';

const CACHE = `taageoerne-${version}`;
const APP_SHELL = '/';
const ASSETS = [APP_SHELL, ...build, ...files].filter((asset) => !asset.endsWith('.map'));
const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const ER_DEV_HOST = DEV_HOSTS.has(self.location.hostname);

async function cacheAssets(cacheName: string, assets: string[]) {
    const cache = await caches.open(cacheName);
    await Promise.allSettled(
        assets.map(async (asset) => {
            try {
                await cache.add(asset);
            } catch (error) {
                console.warn('Offline-cache sprang asset over:', asset, error);
            }
        })
    );
}

self.addEventListener('install', (event) => {
    if (ER_DEV_HOST) {
        event.waitUntil(self.skipWaiting());
        return;
    }

    event.waitUntil(
        cacheAssets(CACHE, ASSETS)
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => ER_DEV_HOST || key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

async function cacheFirst(request: Request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

async function appShellFallback(request: Request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return (await caches.match(APP_SHELL)) || Response.error();
    }
}

self.addEventListener('fetch', (event) => {
    if (ER_DEV_HOST) return;

    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname === '/service-worker.js') return;

    if (request.mode === 'navigate') {
        event.respondWith(appShellFallback(request));
        return;
    }

    event.respondWith(cacheFirst(request));
});
