export type AppSprog = 'da' | 'en';

const SPROG_KEY = 'taage_language';

export const sprogState = $state({
    sprog: 'da' as AppSprog
});

export function normaliserSprog(sprog?: string | null): AppSprog {
    return sprog === 'en' ? 'en' : 'da';
}

export function initSprog() {
    if (typeof localStorage === 'undefined') return;
    sprogState.sprog = normaliserSprog(localStorage.getItem(SPROG_KEY));
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
