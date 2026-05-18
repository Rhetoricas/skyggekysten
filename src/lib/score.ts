import type { Felt, SpillerData } from './types';
import { STANDARD_KORT_BREDDE, STANDARD_KORT_HOEJDE } from './kortDimensioner';

export const MEDALJE_GRAENSER = [0, 500, 1200, 2000, 3000, 4500, 6250, 8500, 11000, 14000] as const;
export const M10_SCORE = MEDALJE_GRAENSER[MEDALJE_GRAENSER.length - 1];

export function taelScoreSpillere(alleSpillere: Record<string, Partial<SpillerData>> = {}) {
    const spillere = Object.values(alleSpillere).filter((spiller) => {
        return spiller.ikon || spiller.hp !== undefined || spiller.isDead || spiller.isWinner;
    });

    return Math.max(1, spillere.length);
}

export function beregnMineScoreModifier(antalSpillere: number) {
    return Math.min(4, 1 + Math.max(0, antalSpillere - 1) * 0.5);
}

export function beregnMinePoint(gitter: Felt[], spillerNavn: string, antalSpillere: number) {
    const antalMiner = gitter.filter((felt) => felt.hasGoldmine && felt.mineOwner === spillerNavn).length;
    return Math.floor(antalMiner * 100 * beregnMineScoreModifier(antalSpillere));
}

export function beregnFremdriftPoint(maxKolonne: number, erVinder: boolean, kortBredde = STANDARD_KORT_BREDDE) {
    if (erVinder) return 1000;
    const normaliseretKolonne = Math.round((Math.max(0, maxKolonne) / Math.max(1, kortBredde - 1)) * (STANDARD_KORT_BREDDE - 1));
    return normaliseretKolonne * 2;
}

export function beregnKortStoerrelseScoreModifier(kortBredde = STANDARD_KORT_BREDDE, kortHoejde = STANDARD_KORT_HOEJDE) {
    void kortBredde;
    void kortHoejde;
    return 1;
}

export function beregnSpillerScore(
    gitter: Felt[],
    alleSpillere: Record<string, Partial<SpillerData>>,
    spillerNavn: string,
    data: Partial<SpillerData>,
    erVinder = !!data.isWinner,
    kortBredde = STANDARD_KORT_BREDDE,
    kortHoejde = STANDARD_KORT_HOEJDE
) {
    const antalSpillere = taelScoreSpillere(alleSpillere);
    const guld = data.guld || 0;
    const hp = data.hp || 0;
    const kolonne = data.kolonne || 0;
    const udforskningPoint = (data.kendteFelter?.length || 0) * 2;
    const minePoint = beregnMinePoint(gitter, spillerNavn, antalSpillere);
    const fremdriftPoint = beregnFremdriftPoint(kolonne, erVinder, kortBredde);
    const kortModifier = beregnKortStoerrelseScoreModifier(kortBredde, kortHoejde);

    return Math.floor((guld + fremdriftPoint + udforskningPoint + minePoint) * (1 + Math.max(0, hp) / 1000) * kortModifier);
}

export function findMedaljeNiveau(score: number) {
    let niveau = 0;
    for (let i = 0; i < MEDALJE_GRAENSER.length; i++) {
        if (score >= MEDALJE_GRAENSER[i]) niveau = i;
    }
    return niveau;
}

export function findMedaljeSti(score: number, nyGlobalRekord = false) {
    if (nyGlobalRekord && score >= M10_SCORE) return '/screens/m11.webp';
    return `/screens/m${findMedaljeNiveau(score) + 1}.webp`;
}
