import { BREDDE, HEX_W } from './spildata';
import type { Felt } from './types';

function feltPosX(index: number) {
    const raekke = Math.floor(index / BREDDE);
    const kolonne = index % BREDDE;
    return kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0);
}

export function erBeskyttetAfTaageblokker(gitter: Felt[], index: number) {
    const raekke = Math.floor(index / BREDDE);
    const posX = feltPosX(index);
    const raekkeCount = Math.ceil(gitter.length / BREDDE);

    for (let r = Math.max(0, raekke - 1); r <= Math.min(raekkeCount - 1, raekke + 1); r++) {
        const raekkeStart = r * BREDDE;
        for (let k = 0; k < BREDDE; k++) {
            const blokkerIndex = raekkeStart + k;
            if (!gitter[blokkerIndex]?.taageBlokker) continue;
            if (feltPosX(blokkerIndex) <= posX) return true;
        }
    }

    return false;
}

export function erFeltITaagen(gitter: Felt[], index: number, fogX: number) {
    const posX = feltPosX(index);

    if (fogX < 0) {
        const kortBredde = BREDDE * HEX_W;
        const frontFraOest = kortBredde - Math.abs(fogX);
        const opslugtFraVest = posX <= kortBredde && !erBeskyttetAfTaageblokker(gitter, index);
        const opslugtFraOest = posX >= frontFraOest;
        return opslugtFraVest || opslugtFraOest;
    }

    return posX <= fogX && !erBeskyttetAfTaageblokker(gitter, index);
}
