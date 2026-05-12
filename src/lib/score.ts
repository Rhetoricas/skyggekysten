import type { Felt, SpillerData } from './types';

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

export function beregnFremdriftPoint(maxKolonne: number, erVinder: boolean) {
    return erVinder ? 1000 : Math.max(0, maxKolonne) * 2;
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
