// overlevelse.svelte.ts
import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { BREDDE, HEX_W } from './spildata';

export function erSpillerITaagen() {
    const kolonne = spilTilstand.spillerIndex % BREDDE;
    const posX = kolonne * HEX_W;
    return posX <= spilTilstand.fogX;
}

export function tjekOverlevelse() {
    if (spilTilstand.gameState !== 'play') return;

    if (erSpillerITaagen()) {
        spilTilstand.livspoint -= 1;
        spilTilstand.logBesked = "Tågen ætser dine lunger. Du mister HP.";
        if (spilTilstand.livspoint <= 0) {
            fremtvingKollaps();
        }
    }
}

export function fremrykTid() {
    if (spilTilstand.erBevidstløs) return;
    spilTilstand.dag += 1;
}

export function fremtvingKollaps() {
    spilTilstand.erBevidstløs = true;
    spilTilstand.gameState = 'dead';
    spilTilstand.logBesked = "Du kollapser og dør i mørket.";
    syncTilDb(true);
}