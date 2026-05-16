import { STANDARD_KORT_BREDDE, HEX_W } from './kortDimensioner';
import type { Felt } from './types';

function feltPosX(index: number, bredde: number) {
    const raekke = Math.floor(index / bredde);
    const kolonne = index % bredde;
    return kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0);
}

export function erBeskyttetAfTaageblokker(gitter: Felt[], index: number, bredde = STANDARD_KORT_BREDDE) {
    const raekke = Math.floor(index / bredde);
    const posX = feltPosX(index, bredde);
    const raekkeCount = Math.ceil(gitter.length / bredde);

    for (let r = Math.max(0, raekke - 1); r <= Math.min(raekkeCount - 1, raekke + 1); r++) {
        const raekkeStart = r * bredde;
        for (let k = 0; k < bredde; k++) {
            const blokkerIndex = raekkeStart + k;
            if (!gitter[blokkerIndex]?.taageBlokker) continue;
            if (feltPosX(blokkerIndex, bredde) <= posX) return true;
        }
    }

    return false;
}

export function erFeltITaagen(gitter: Felt[], index: number, fogX: number, bredde = STANDARD_KORT_BREDDE) {
    const posX = feltPosX(index, bredde);

    if (fogX < 0) {
        const kortBredde = bredde * HEX_W;
        const frontFraOest = kortBredde - Math.abs(fogX);
        const opslugtFraVest = posX <= kortBredde && !erBeskyttetAfTaageblokker(gitter, index, bredde);
        const opslugtFraOest = posX >= frontFraOest;
        return opslugtFraVest || opslugtFraOest;
    }

    return posX <= fogX && !erBeskyttetAfTaageblokker(gitter, index, bredde);
}
