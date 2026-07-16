export const STANDARD_KORT_BREDDE = 100;
export const STANDARD_KORT_HOEJDE = 20;
export const KORT_VERSION = 2;
export const STANDARD_KORT_BREDDE_MIN = 100;
export const STANDARD_KORT_BREDDE_MAX = 110;
export const STANDARD_KORT_HOEJDE_MIN = 20;
export const STANDARD_KORT_HOEJDE_MAX = 24;

export const HEX_W = 96;
export const ROW_H = 82;

export interface KortDimensioner {
    bredde: number;
    hoejde: number;
}

export function normaliserKortDimensioner(bredde?: number | null, hoejde?: number | null): KortDimensioner {
    const rensetBredde = Number.isFinite(bredde) ? Math.floor(Number(bredde)) : STANDARD_KORT_BREDDE;
    const rensetHoejde = Number.isFinite(hoejde) ? Math.floor(Number(hoejde)) : STANDARD_KORT_HOEJDE;

    return {
        bredde: Math.max(8, rensetBredde),
        hoejde: Math.max(6, rensetHoejde)
    };
}

function randomHeltal(min: number, max: number) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

export function vaelgStandardKortDimensioner(): KortDimensioner {
    return {
        bredde: randomHeltal(STANDARD_KORT_BREDDE_MIN, STANDARD_KORT_BREDDE_MAX),
        hoejde: randomHeltal(STANDARD_KORT_HOEJDE_MIN, STANDARD_KORT_HOEJDE_MAX)
    };
}

export function kortAntalFelter(bredde: number, hoejde: number) {
    return bredde * hoejde;
}

export function indexTilKoordinat(index: number, bredde: number) {
    return {
        raekke: Math.floor(index / bredde),
        kolonne: index % bredde
    };
}

export function koordinatTilIndex(raekke: number, kolonne: number, bredde: number, hoejde: number) {
    if (raekke < 0 || raekke >= hoejde || kolonne < 0 || kolonne >= bredde) return null;
    return raekke * bredde + kolonne;
}

export function hexCenter(index: number, bredde: number) {
    const { raekke, kolonne } = indexTilKoordinat(index, bredde);
    return {
        x: kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + HEX_W / 2,
        y: raekke * ROW_H + ROW_H / 2
    };
}

export function kortPixelBredde(bredde: number) {
    return bredde * HEX_W + HEX_W;
}

export function kortPixelHoejde(hoejde: number) {
    return hoejde * ROW_H + ROW_H;
}
