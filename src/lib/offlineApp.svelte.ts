export const offlineAppState = $state({
    understottet: false,
    klar: false,
    arbejder: false,
    besked: ''
});

const SERVICE_WORKER_URL = '/service-worker.js';
const OFFLINE_TIMEOUT_MS = 45000;

function medTimeout<T>(promise: PromiseLike<T>, ms = OFFLINE_TIMEOUT_MS): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), ms);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function hentServiceWorkerRegistration() {
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
        registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL);
    } else {
        registration.update().catch(() => {});
    }

    if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return await ventPaaAktivServiceWorker(registration);
}

async function ventPaaAktivServiceWorker(registration: ServiceWorkerRegistration) {
    if (registration.active) return registration;

    const worker = registration.installing || registration.waiting;
    if (!worker) return await medTimeout(navigator.serviceWorker.ready);

    const aktivering = new Promise<ServiceWorkerRegistration>((resolve, reject) => {
        const tjekState = () => {
            if (worker.state === 'installed' && registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            if (worker.state === 'activated' || registration.active) {
                worker.removeEventListener('statechange', tjekState);
                resolve(registration);
            }
            if (worker.state === 'redundant') {
                worker.removeEventListener('statechange', tjekState);
                reject(new Error('redundant'));
            }
        };

        worker.addEventListener('statechange', tjekState);
        tjekState();
    });

    return await medTimeout(aktivering);
}

export async function tjekOfflineAppKlar() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        offlineAppState.understottet = false;
        offlineAppState.klar = false;
        offlineAppState.besked = 'Denne browser understøtter ikke offline-cache.';
        return false;
    }

    offlineAppState.understottet = true;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        offlineAppState.klar = !!registration?.active;
        offlineAppState.besked = offlineAppState.klar
            ? 'Spillet er klar på denne enhed'
            : 'Offline-cache er ikke klar endnu.';
        return offlineAppState.klar;
    } catch {
        offlineAppState.klar = false;
        offlineAppState.besked = '';
        return false;
    }
}

export async function goerOfflineAppKlar() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        offlineAppState.understottet = false;
        offlineAppState.klar = false;
        offlineAppState.besked = 'Denne browser understøtter ikke offline-cache.';
        return false;
    }

    offlineAppState.understottet = true;
    offlineAppState.arbejder = true;
    offlineAppState.besked = 'Downloader spillet til offline brug...';
    const langsomBesked = setTimeout(() => {
        if (offlineAppState.arbejder) {
            offlineAppState.besked = 'Downloader stadig. Firefox kan være lidt langsom første gang...';
        }
    }, 8000);

    try {
        const registration = await hentServiceWorkerRegistration();
        offlineAppState.klar = !!registration.active;
        offlineAppState.besked = 'Spillet er klar på denne enhed';
        return true;
    } catch (error) {
        offlineAppState.klar = false;
        offlineAppState.besked = error instanceof Error && error.message === 'timeout'
            ? 'Offline-cache tog for lang tid. Genindlæs siden online og prøv igen.'
            : 'Offline-cache kunne ikke gøres klar. Genindlæs siden online og prøv igen.';
        return false;
    } finally {
        clearTimeout(langsomBesked);
        offlineAppState.arbejder = false;
    }
}
