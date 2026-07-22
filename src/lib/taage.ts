import { STANDARD_KORT_BREDDE, HEX_W } from './kortDimensioner';
import type { Felt } from './types';

function feltPosX(index: number, bredde: number) {
    const raekke = Math.floor(index / bredde);
    const kolonne = index % bredde;
    return kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0);
}

function taagePassage(fogX: number, kortPixelBredde: number) {
    if (fogX >= 0) return { nummer: 0, afstand: fogX };

    const samletAfstand = Math.abs(fogX);
    const nummer = Math.max(1, Math.ceil(samletAfstand / kortPixelBredde));
    const afstand = samletAfstand - ((nummer - 1) * kortPixelBredde);
    return { nummer, afstand };
}

function passageHarNaaetFelt(passage: number, afstand: number, posX: number, kortPixelBredde: number) {
    return passage % 2 === 0
        ? posX <= afstand
        : posX >= kortPixelBredde - afstand;
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

export function hentTaageNiveauForFelt(gitter: Felt[], index: number, fogX: number, bredde = STANDARD_KORT_BREDDE) {
    const kortPixelBredde = bredde * HEX_W;
    const posX = feltPosX(index, bredde);
    const aktuelPassage = taagePassage(fogX, kortPixelBredde);
    const beskyttetFraVest = erBeskyttetAfTaageblokker(gitter, index, bredde);
    let niveau = 0;

    // Niveau 3 er loftet. Derfor er kun de første fire passager relevante:
    // vest→øst, øst→vest, vest→øst og eventuelt øst→vest igen bag en blokker.
    for (let passage = 0; passage <= Math.min(aktuelPassage.nummer, 3) && niveau < 3; passage++) {
        const erAfsluttet = passage < aktuelPassage.nummer;
        const erNaaet = erAfsluttet || passageHarNaaetFelt(
            passage,
            aktuelPassage.afstand,
            posX,
            kortPixelBredde
        );
        if (!erNaaet) continue;

        const kommerFraVest = passage % 2 === 0;
        if (passage === 0 || !kommerFraVest || !beskyttetFraVest) niveau++;
    }

    return niveau;
}

export function erFeltITaagen(gitter: Felt[], index: number, fogX: number, bredde = STANDARD_KORT_BREDDE) {
    return hentTaageNiveauForFelt(gitter, index, fogX, bredde) > 0;
}
