export function erRoyalKarakter(karakterId: string | null | undefined) {
    return karakterId === 'royal_m' || karakterId === 'royal_f';
}

export function royalMinimumspris(pris: number) {
    return Math.ceil(Math.max(0, pris) / 2);
}

export function kanRoyalPressePris(karakterId: string | null | undefined, guld: number, pris: number) {
    return erRoyalKarakter(karakterId) && guld < pris && guld >= royalMinimumspris(pris);
}

export function kanBetaleMedRoyalPres(karakterId: string | null | undefined, guld: number, pris: number) {
    return guld >= pris || kanRoyalPressePris(karakterId, guld, pris);
}

export function royalBetaling(karakterId: string | null | undefined, guld: number, pris: number) {
    return kanRoyalPressePris(karakterId, guld, pris) ? guld : pris;
}
