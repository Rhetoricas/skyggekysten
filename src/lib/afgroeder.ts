import type { Felt } from './types';

export const DAGE_PR_AFGROEDEBLOK = 10;

export function hentAfgroedeBlok(dag: number) {
    return Math.ceil((dag || 1) / DAGE_PR_AFGROEDEBLOK);
}

export function erHvedeBlok(blok: number) {
    return blok % 2 !== 0;
}

export function erAfgroedeModen(felt: Felt, blok: number) {
    return (felt.afgroede === 'hvede' && erHvedeBlok(blok)) || (felt.afgroede === 'boenner' && !erHvedeBlok(blok));
}

export function hentInsektPlageBlok(gitter: Felt[]) {
    let senesteBlok: number | null = null;

    for (const felt of gitter) {
        if (typeof felt.insektPlageBlok !== 'number') continue;
        if (senesteBlok === null || felt.insektPlageBlok > senesteBlok) {
            senesteBlok = felt.insektPlageBlok;
        }
    }

    return senesteBlok;
}

export function erInsektPlageAktiv(gitter: Felt[], blok: number) {
    return hentInsektPlageBlok(gitter) === blok;
}
