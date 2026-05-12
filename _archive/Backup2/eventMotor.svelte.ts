// eventMotor.svelte.ts
import { spilTilstand } from './spilTilstand.svelte';
import { eventBibliotek } from './eventBibliotek';
import { tilfoejTilRygsæk, brugFraRygsæk } from './spilmotor';
import { syncTilDb } from './netvaerk';
import { fremtvingKollaps, fremrykTid } from './overlevelse.svelte';

export const eventState = $state({
    aktivt: null as any,
    log: [] as string[],
    valgLåst: false
});

export function startEvent(eventID: string) {
    const evt = eventBibliotek[eventID];
    if (!evt) return;
    eventState.aktivt = evt;
    eventState.log = [evt.tekst];
    eventState.valgLåst = false;
}

export function lukEvent() {
    eventState.aktivt = null;
    eventState.log = [];
    eventState.valgLåst = false;
}

export function kanViseValg(valg: any) {
    if (valg.betingelse && !valg.betingelse()) return false;
    if (valg.kraeverItem) {
        const harTing = spilTilstand.mitUdstyr.find(i => i.id === valg.kraeverItem);
        if (!harTing || harTing.maengde <= 0) return false;
    }
    return true;
}

export function tagValg(valg: any) {
    if (eventState.valgLåst) return;

    if (valg.kosterItem) {
        brugFraRygsæk(valg.kosterItem, 1);
    }
    if (valg.puljeVaerdi) {
        if (spilTilstand.guldTotal < valg.puljeVaerdi) {
            eventState.log = [...eventState.log, "Du har ikke guld nok."];
            return;
        }
        spilTilstand.guldTotal -= valg.puljeVaerdi;
    }

    eventState.valgLåst = true;
    const resultat = valg.effekt();
    eventState.log = [...eventState.log, resultat.logBesked];

    if (resultat.hpOp) spilTilstand.livspoint += resultat.hpOp;
    if (resultat.hpNed) spilTilstand.livspoint -= resultat.hpNed;
    if (resultat.guldOp) spilTilstand.guldTotal += resultat.guldOp;
    if (resultat.guldNed) spilTilstand.guldTotal -= resultat.guldNed;
    if (resultat.itemUd) tilfoejTilRygsæk(resultat.itemUd, 1);
    
    syncTilDb(true);

    if (spilTilstand.livspoint <= 0) {
        setTimeout(() => fremtvingKollaps(), 1500);
        return;
    }

    if (resultat.naesteEvent) {
        setTimeout(() => startEvent(resultat.naesteEvent), 2000);
    } else {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (felt) felt.eventFuldført = true;
        syncTilDb(true);
        fremrykTid();
        setTimeout(() => lukEvent(), 2000);
    }
}