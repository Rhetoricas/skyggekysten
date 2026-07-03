export type AppSprog = 'da' | 'en';

const SPROG_KEY = __ITCH_BUILD__ ? 'taage_language_itch' : 'taage_language';
const DEFAULT_SPROG = __ITCH_BUILD__ ? 'en' : 'da';
let urlSprogOverride = false;

export const sprogState = $state({
    sprog: DEFAULT_SPROG as AppSprog
});

export function normaliserSprog(sprog?: string | null): AppSprog {
    return sprog === 'en' ? 'en' : 'da';
}

export function initSprog() {
    const urlSprog = hentUrlSprog();
    urlSprogOverride = !!urlSprog;
    if (urlSprog) {
        saetSprog(urlSprog);
        return;
    }
    if (typeof localStorage === 'undefined') return;
    sprogState.sprog = normaliserSprog(localStorage.getItem(SPROG_KEY) || DEFAULT_SPROG);
}

export function saetSprog(sprog: AppSprog) {
    sprogState.sprog = normaliserSprog(sprog);
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SPROG_KEY, sprogState.sprog);
    }
}

export function tekst(da: string, en: string) {
    return sprogState.sprog === 'en' ? en : da;
}

export function sprogLabel() {
    return sprogState.sprog === 'en' ? 'English' : 'Dansk';
}

export function harUrlSprogOverride() {
    return urlSprogOverride;
}

function hentUrlSprog(): AppSprog | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const sprog = params.get('lang') || params.get('sprog');
    return sprog === 'da' || sprog === 'en' ? sprog : null;
}
