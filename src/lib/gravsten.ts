import { registrerPermanentGravsten } from './netvaerk';
import { spilTilstand } from './spilTilstand.svelte';
import type { GravstenMinde } from './types';
import { tekst } from './i18n.svelte';

function fnvHash(vaerdi: string) {
    let hash = 2166136261;
    for (let i = 0; i < vaerdi.length; i++) {
        hash ^= vaerdi.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function lavDoedsId(feltIndex: number) {
    const rundeId = (spilTilstand.rundeSeed || 'uden_runde')
        .replace(/[^A-Za-z0-9_-]/g, '_')
        .slice(0, 64);
    const spillerHash = fnvHash(`${spilTilstand.spillerNavn}\u0000${feltIndex}`);
    return `doed_${rundeId}_${spillerHash}`.slice(0, 100);
}

export function registrerDoedsGravsten(feltIndex: number, mindeTekst: string) {
    const felt = spilTilstand.gitter[feltIndex];
    if (!felt || !spilTilstand.valgtKarakter) return null;

    const id = lavDoedsId(feltIndex);
    const eksisterende = felt.gravstenListe ?? (felt.gravstenIkon
        ? [{ ikon: felt.gravstenIkon, navn: tekst('Ukendt', 'Unknown'), dag: 0 }]
        : []);
    const minde: GravstenMinde & { id: string } = {
        id,
        ikon: spilTilstand.valgtKarakter.ikon,
        navn: spilTilstand.spillerNavn || tekst('Ukendt', 'Unknown'),
        dag: spilTilstand.dag || 1,
        tekst: mindeTekst,
        tidspunkt: new Date().toISOString()
    };

    felt.gravstenListe = [
        ...eksisterende.filter((gammeltMinde) => gammeltMinde.id !== id),
        minde
    ].slice(-3);
    felt.gravstenIkon = minde.ikon;
    spilTilstand.gitter = [...spilTilstand.gitter];
    void registrerPermanentGravsten(feltIndex, minde);
    return minde;
}
