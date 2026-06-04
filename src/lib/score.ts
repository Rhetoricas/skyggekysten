import type { Felt, SpillerData } from './types';
import type { RygsækTing } from './types';
import { STANDARD_KORT_BREDDE, STANDARD_KORT_HOEJDE } from './kortDimensioner';
import { itemDB } from './spildata';

export const DIAMANT_MIN_VAERDI = 200;
export const DIAMANT_MAX_VAERDI = 1200;
export const BUTIK_SALGS_ANDEL = 0.75;
export const SLUT_SALGS_ANDEL = 0.5;
const DIAMANT_FORDELING_EKSPONENT = 2;

export function rulDiamantVaerdi() {
    return DIAMANT_MIN_VAERDI + Math.round(Math.pow(Math.random(), DIAMANT_FORDELING_EKSPONENT) * (DIAMANT_MAX_VAERDI - DIAMANT_MIN_VAERDI));
}

export function diamantVaerdier(ting: Partial<RygsækTing> | null | undefined) {
    if (!ting || ting.id !== 'diamant') return [];
    const antal = Math.max(0, Math.floor(Number(ting.maengde) || 0));
    const gemte = Array.isArray(ting.diamanter)
        ? ting.diamanter
            .map((vaerdi) => Math.round(Number(vaerdi)))
            .filter((vaerdi) => Number.isFinite(vaerdi) && vaerdi > 0)
        : [];

    if (gemte.length >= antal) return gemte.slice(0, antal);
    const fallback = itemDB.diamant?.pris || 500;
    return [...gemte, ...Array.from({ length: antal - gemte.length }, () => fallback)];
}

export function diamantSamletVaerdi(ting: Partial<RygsækTing> | null | undefined) {
    return diamantVaerdier(ting).reduce((sum, vaerdi) => sum + vaerdi, 0);
}

export function diamantSalgspris(ting: Partial<RygsækTing> | null | undefined) {
    return Math.floor(diamantSamletVaerdi(ting) * BUTIK_SALGS_ANDEL);
}

export function diamantSlutSalgspris(ting: Partial<RygsækTing> | null | undefined) {
    return Math.floor(diamantSamletVaerdi(ting) * SLUT_SALGS_ANDEL);
}

export function diamantStoerrelse(vaerdi: number) {
    const normaliseret = Math.max(0, Math.min(1, (vaerdi - DIAMANT_MIN_VAERDI) / (DIAMANT_MAX_VAERDI - DIAMANT_MIN_VAERDI)));
    return 0.7 + normaliseret * 0.95;
}

export function diamantStoerrelsesNavn(vaerdi: number) {
    if (vaerdi >= 950) return 'enorm';
    if (vaerdi >= 500) return 'stor';
    return 'lille';
}

export function beskrivDiamantFund(vaerdier: number[] = []) {
    const reneVaerdier = vaerdier
        .map((vaerdi) => Math.round(Number(vaerdi)))
        .filter((vaerdi) => Number.isFinite(vaerdi) && vaerdi > 0);

    if (reneVaerdier.length === 0) return '';
    if (reneVaerdier.length === 1) {
        const vaerdi = reneVaerdier[0];
        return `${diamantStoerrelsesNavn(vaerdi)} diamant (${vaerdi} guld)`;
    }

    return `${reneVaerdier.length} diamanter: ${reneVaerdier
        .map((vaerdi) => `${diamantStoerrelsesNavn(vaerdi)} ${vaerdi}`)
        .join(', ')}`;
}

export const MEDALJE_GRAENSER = [0, 500, 1200, 2100, 3200, 4500, 6000, 7800, 10000, 12500] as const;
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

export function beregnMultiplayerScoreModifier(antalSpillere: number) {
    return Math.min(1.5, 1 + Math.max(0, antalSpillere - 1) * 0.1);
}

export function beregnMinePoint(gitter: Felt[], spillerNavn: string, antalSpillere: number) {
    const antalMiner = gitter.filter((felt) => felt.hasGoldmine && felt.mineOwner === spillerNavn).length;
    return Math.floor(antalMiner * 100 * beregnMineScoreModifier(antalSpillere));
}

export function beregnSalgspris(itemId: string) {
    const vareData = itemDB[itemId];
    if (!vareData) return 0;
    return Math.max(0, Math.floor(vareData.pris * BUTIK_SALGS_ANDEL));
}

export function beregnSlutSalgspris(ting: Partial<RygsækTing> | null | undefined) {
    if (!ting?.id) return 0;
    const antal = Math.max(0, Math.floor(Number(ting.maengde) || 0));
    if (antal <= 0) return 0;
    if (ting.id === 'diamant') return diamantSlutSalgspris(ting);
    const vareData = itemDB[ting.id];
    if (!vareData) return 0;
    return Math.max(0, Math.floor(vareData.pris * SLUT_SALGS_ANDEL) * antal);
}

export function beskrivSlutSalg(udstyr: RygsækTing[] = []) {
    const poster = udstyr
        .map((ting) => {
            const salgspris = beregnSlutSalgspris(ting);
            if (salgspris <= 0) return '';
            const antal = Math.max(0, Math.floor(Number(ting.maengde) || 0));
            const navn = itemDB[ting.id]?.navn || ting.id;
            return `${antal > 1 ? `${antal} x ` : ''}${navn} (${salgspris} point)`;
        })
        .filter(Boolean);

    const total = udstyr.reduce((sum, ting) => sum + beregnSlutSalgspris(ting), 0);
    return {
        total,
        tekst: total > 0
            ? `Dit resterende udstyr og dine diamanter omregnes til ${total} point: ${poster.join(', ')}.`
            : ''
    };
}

export function beregnUdstyrPoint(udstyr: RygsækTing[] = []) {
    return udstyr.reduce((sum, ting) => sum + beregnSlutSalgspris(ting), 0);
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
    const udstyrPoint = beregnUdstyrPoint(data.mitUdstyr || []);
    const fremdriftPoint = beregnFremdriftPoint(kolonne, erVinder, kortBredde);
    const kortModifier = beregnKortStoerrelseScoreModifier(kortBredde, kortHoejde);
    const multiplayerModifier = beregnMultiplayerScoreModifier(antalSpillere);

    return Math.floor((guld + fremdriftPoint + udforskningPoint + minePoint + udstyrPoint) * (1 + Math.max(0, hp) / 1000) * kortModifier * multiplayerModifier);
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
