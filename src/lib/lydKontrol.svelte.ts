import { spilTilstand } from './spilTilstand.svelte';

export type LydNiveau = 'fuld' | 'lav' | 'slukket';

const LYD_STORAGE_KEY = 'taage_lyd_niveau';
const lydNiveauer: LydNiveau[] = ['fuld', 'lav', 'slukket'];

function hentGemtLydNiveau(): LydNiveau {
    if (typeof localStorage === 'undefined') return 'fuld';
    const gemt = localStorage.getItem(LYD_STORAGE_KEY);
    return lydNiveauer.includes(gemt as LydNiveau) ? gemt as LydNiveau : 'fuld';
}

export const lydKontrol = $state({
    niveau: hentGemtLydNiveau()
});

export function hentLydVolumen() {
    if (lydKontrol.niveau === 'slukket') return 0;
    if (lydKontrol.niveau === 'lav') return 0.25;
    return 0.8;
}

export function skiftLydNiveau() {
    saetLydNiveau(lydKontrol.niveau === 'fuld' ? 'lav' : lydKontrol.niveau === 'lav' ? 'slukket' : 'fuld');
}

export function saetLydNiveau(niveau: LydNiveau) {
    lydKontrol.niveau = lydNiveauer.includes(niveau) ? niveau : 'fuld';
    spilTilstand.musikTaendt = lydKontrol.niveau !== 'slukket';
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LYD_STORAGE_KEY, lydKontrol.niveau);
    }
}

export function lydTitel() {
    if (lydKontrol.niveau === 'fuld') return 'Fuld lyd';
    if (lydKontrol.niveau === 'lav') return 'Dæmpet lyd';
    return 'Lyd slukket';
}

export function lydIkon() {
    return lydKontrol.niveau === 'slukket' ? '/screens/musicoff.webp' : '/screens/musicon.webp';
}
