import { tekst } from './i18n.svelte';

export const offlineAppState = $state({
    understottet: false,
    klar: false,
    arbejder: false,
    beskedKey: '' as '' | 'unsupported' | 'ready' | 'not-ready' | 'downloading' | 'still-downloading' | 'timeout' | 'failed',
    besked: ''
});

const SERVICE_WORKER_URL = 'service-worker.js';
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
        saetOfflineBesked('unsupported');
        return false;
    }

    offlineAppState.understottet = true;

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        offlineAppState.klar = !!registration?.active;
        saetOfflineBesked(offlineAppState.klar ? 'ready' : 'not-ready');
        return offlineAppState.klar;
    } catch {
        offlineAppState.klar = false;
        saetOfflineBesked('');
        return false;
    }
}

export async function goerOfflineAppKlar() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        offlineAppState.understottet = false;
        offlineAppState.klar = false;
        saetOfflineBesked('unsupported');
        return false;
    }

    offlineAppState.understottet = true;
    offlineAppState.arbejder = true;
    saetOfflineBesked('downloading');
    const langsomBesked = setTimeout(() => {
        if (offlineAppState.arbejder) {
            saetOfflineBesked('still-downloading');
        }
    }, 8000);

    try {
        const registration = await hentServiceWorkerRegistration();
        offlineAppState.klar = !!registration.active;
        saetOfflineBesked('ready');
        return true;
    } catch (error) {
        offlineAppState.klar = false;
        saetOfflineBesked(error instanceof Error && error.message === 'timeout' ? 'timeout' : 'failed');
        return false;
    } finally {
        clearTimeout(langsomBesked);
        offlineAppState.arbejder = false;
    }
}

function offlineBeskedTekst(key: typeof offlineAppState.beskedKey) {
    switch (key) {
        case 'unsupported':
            return tekst('Denne browser kan ikke gemme spillet til offline brug.', 'This browser cannot save the game for offline play.');
        case 'ready':
            return tekst('Spillet er klar til offline brug på denne enhed.', 'The game is ready for offline play on this device.');
        case 'not-ready':
            return tekst('Spillet er ikke hentet til offline brug endnu.', 'The game has not been saved for offline play yet.');
        case 'downloading':
            return tekst('Gør spillet klar til offline brug...', 'Preparing the game for offline play...');
        case 'still-downloading':
            return tekst('Spillet gøres stadig klar. Første gang kan tage lidt længere...', 'The game is still being prepared. The first time may take a little longer...');
        case 'timeout':
            return tekst('Det tog for lang tid at gøre spillet klar. Gå online, genindlæs siden, og prøv igen.', 'Preparing the game took too long. Go online, reload the page, and try again.');
        case 'failed':
            return tekst('Spillet kunne ikke gøres klar til offline brug. Gå online, genindlæs siden, og prøv igen.', 'The game could not be prepared for offline play. Go online, reload the page, and try again.');
        default:
            return '';
    }
}

function saetOfflineBesked(key: typeof offlineAppState.beskedKey) {
    offlineAppState.beskedKey = key;
    offlineAppState.besked = offlineBeskedTekst(key);
}

export function offlineAppBesked() {
    return offlineBeskedTekst(offlineAppState.beskedKey) || offlineAppState.besked;
}
