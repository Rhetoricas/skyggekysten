import { tekst } from './i18n.svelte';

export const offlineAppState = $state({
    understottet: false,
    klar: false,
    arbejder: false,
    besked: ''
});

const SERVICE_WORKER_URL = '/service-worker.js';
const OFFLINE_TIMEOUT_MS = 45000;
const SERVICE_WORKER_OPTIONS: RegistrationOptions = { updateViaCache: 'none' };

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
        registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, SERVICE_WORKER_OPTIONS);
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
        offlineAppState.besked = tekst('Denne browser understøtter ikke offline-cache.', 'This browser does not support offline cache.');
        return false;
    }

    offlineAppState.understottet = true;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        offlineAppState.klar = !!registration?.active;
        offlineAppState.besked = offlineAppState.klar
            ? tekst('Spillet er klar på denne enhed', 'The game is ready on this device')
            : tekst('Offline-cache er ikke klar endnu.', 'Offline cache is not ready yet.');
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
        offlineAppState.besked = tekst('Denne browser understøtter ikke offline-cache.', 'This browser does not support offline cache.');
        return false;
    }

    offlineAppState.understottet = true;
    offlineAppState.arbejder = true;
    offlineAppState.besked = tekst('Downloader spillet til offline brug...', 'Downloading the game for offline use...');
    const langsomBesked = setTimeout(() => {
        if (offlineAppState.arbejder) {
            offlineAppState.besked = tekst('Downloader stadig. Firefox kan være lidt langsom første gang...', 'Still downloading. Firefox can be a little slow the first time...');
        }
    }, 8000);

    try {
        const registration = await hentServiceWorkerRegistration();
        offlineAppState.klar = !!registration.active;
        offlineAppState.besked = tekst('Spillet er klar på denne enhed', 'The game is ready on this device');
        return true;
    } catch (error) {
        offlineAppState.klar = false;
        offlineAppState.besked = error instanceof Error && error.message === 'timeout'
            ? tekst('Offline-cache tog for lang tid. Genindlæs siden online og prøv igen.', 'Offline cache took too long. Reload the page online and try again.')
            : tekst('Offline-cache kunne ikke gøres klar. Genindlæs siden online og prøv igen.', 'Offline cache could not be prepared. Reload the page online and try again.');
        return false;
    } finally {
        clearTimeout(langsomBesked);
        offlineAppState.arbejder = false;
    }
}
