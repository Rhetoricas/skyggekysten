import { BREDDE, HEX_W } from './spildata';
import type { Felt } from './types';

export function erBeskyttetAfTaageblokker(gitter: Felt[], index: number) {
    const raekkeStart = Math.floor(index / BREDDE) * BREDDE;
    const kolonne = index % BREDDE;

    for (let k = 0; k <= kolonne; k++) {
        if (gitter[raekkeStart + k]?.taageBlokker) return true;
    }

    return false;
}

export function erFeltITaagen(gitter: Felt[], index: number, fogX: number) {
    const raekke = Math.floor(index / BREDDE);
    const kolonne = index % BREDDE;
    const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0);

    return posX <= fogX && !erBeskyttetAfTaageblokker(gitter, index);
}
