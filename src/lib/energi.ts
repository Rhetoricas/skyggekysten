import { spilTilstand } from './spilTilstand.svelte';

export type EnergiHandling = 'bevaegelse' | 'handling';

export function brugEnergi(pris: number, handling: EnergiHandling = 'handling') {
    const faktiskPris = Math.max(0, pris);
    const kilde = spilTilstand.gratisBevaegelseKilde;
    const gratis =
        faktiskPris > 0 &&
        spilTilstand.gratisNaesteBevaegelse &&
        (kilde === 'bersaerk' || (kilde === 'mad' && handling === 'bevaegelse'));

    if (gratis) {
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        return { pris: 0, gratis: true, kilde };
    }

    spilTilstand.nuvaerendeEnergi -= faktiskPris;
    return { pris: faktiskPris, gratis: false, kilde: '' as const };
}
