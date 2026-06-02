import { spilTilstand } from './spilTilstand.svelte';

export type EnergiHandling = 'bevaegelse' | 'handling';
type EnergiAnimationOptions = {
    fraFeltIndex?: number;
    tilFeltIndex?: number;
};

let energiKugleId = 0;
let energiTalId = 0;

export function visBrugteEnergiKugler(antal: number, options: EnergiAnimationOptions = {}) {
    const kugleAntal = Math.min(9, Math.max(0, Math.round(antal)));
    if (kugleAntal <= 0) return;
    const feltIndex = options.fraFeltIndex ?? spilTilstand.spillerIndex;
    const tilFeltIndex = options.tilFeltIndex;

    const nyeKugler = Array.from({ length: kugleAntal }, (_, i) => ({
        id: ++energiKugleId,
        feltIndex,
        tilFeltIndex,
        offsetX: (i - (kugleAntal - 1) / 2) * 10 + (Math.random() * 8 - 4),
        offsetY: Math.random() * 12 - 6,
        delay: i * 55,
        ruteAndel: tilFeltIndex === undefined ? 0 : (i + 1) / (kugleAntal + 1)
    }));
    const nytTal = {
        id: ++energiTalId,
        feltIndex,
        tilFeltIndex,
        antal: kugleAntal
    };

    spilTilstand.aktiveEnergiKugler = [...(spilTilstand.aktiveEnergiKugler || []), ...nyeKugler];
    spilTilstand.aktiveEnergiTal = [...(spilTilstand.aktiveEnergiTal || []), nytTal];

    setTimeout(() => {
        const ids = new Set(nyeKugler.map((kugle) => kugle.id));
        spilTilstand.aktiveEnergiKugler = (spilTilstand.aktiveEnergiKugler || []).filter((kugle) => !ids.has(kugle.id));
        spilTilstand.aktiveEnergiTal = (spilTilstand.aktiveEnergiTal || []).filter((tal) => tal.id !== nytTal.id);
    }, 1750 + kugleAntal * 55);
}

export function brugEnergi(pris: number, handling: EnergiHandling = 'handling', animation: EnergiAnimationOptions = {}) {
    const faktiskPris = Math.max(0, pris);
    const kilde = spilTilstand.gratisBevaegelseKilde;
    const gratis =
        faktiskPris > 0 &&
        spilTilstand.gratisNaesteBevaegelse &&
        (kilde === 'bersaerk' || (kilde === 'mad' && handling === 'bevaegelse'));

    if (gratis) {
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        return { pris: 0, gratis: true, kilde };
    }

    spilTilstand.nuvaerendeEnergi -= faktiskPris;
    visBrugteEnergiKugler(faktiskPris, animation);
    return { pris: faktiskPris, gratis: false, kilde: '' as const };
}

export function brugResterendeEnergi(animation: EnergiAnimationOptions = {}) {
    const faktiskPris = Math.max(0, spilTilstand.nuvaerendeEnergi || 0);
    if (faktiskPris <= 0) return { pris: 0 };

    spilTilstand.nuvaerendeEnergi = 0;
    visBrugteEnergiKugler(faktiskPris, animation);
    return { pris: faktiskPris };
}
