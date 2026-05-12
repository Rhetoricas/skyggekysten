import { spilTilstand } from './spilTilstand.svelte';

export type LydNiveau = 'fuld' | 'lav' | 'slukket';

export const lydKontrol = $state({
    niveau: 'fuld' as LydNiveau
});

export function hentLydVolumen() {
    if (lydKontrol.niveau === 'slukket') return 0;
    if (lydKontrol.niveau === 'lav') return 0.25;
    return 0.8;
}

export function skiftLydNiveau() {
    lydKontrol.niveau = lydKontrol.niveau === 'fuld' ? 'lav' : lydKontrol.niveau === 'lav' ? 'slukket' : 'fuld';
    spilTilstand.musikTaendt = lydKontrol.niveau !== 'slukket';
}

export function lydTitel() {
    if (lydKontrol.niveau === 'fuld') return 'Fuld lyd';
    if (lydKontrol.niveau === 'lav') return 'Dæmpet lyd';
    return 'Lyd slukket';
}

export function lydIkon() {
    return lydKontrol.niveau === 'slukket' ? '/screens/musicoff.webp' : '/screens/musicon.webp';
}
