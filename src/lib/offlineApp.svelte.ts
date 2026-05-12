export const offlineAppState = $state({
    understottet: false,
    klar: false,
    arbejder: false,
    besked: ''
});

export async function tjekOfflineAppKlar() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        offlineAppState.understottet = false;
        offlineAppState.klar = false;
        offlineAppState.besked = 'Denne browser understøtter ikke offline-cache.';
        return false;
    }

    offlineAppState.understottet = true;

    try {
        const registration = await navigator.serviceWorker.ready;
        offlineAppState.klar = !!registration.active;
        offlineAppState.besked = offlineAppState.klar
            ? 'Spillet er klar på denne enhed'
            : 'Offline-cache er ikke klar endnu.';
        return offlineAppState.klar;
    } catch {
        offlineAppState.klar = false;
        offlineAppState.besked = 'Offline-cache kunne ikke gøres klar.';
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

    try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        offlineAppState.klar = !!registration.active;
        offlineAppState.besked = 'Spillet er klar på denne enhed';
        return true;
    } catch {
        offlineAppState.klar = false;
        offlineAppState.besked = 'Offline-cache kunne ikke gøres klar. Prøv at genindlæse siden online.';
        return false;
    } finally {
        offlineAppState.arbejder = false;
    }
}
