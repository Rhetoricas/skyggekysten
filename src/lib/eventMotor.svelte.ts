// eventMotor.svelte.ts
import { spilTilstand } from './spilTilstand.svelte';
import { eventBibliotek } from './eventBibliotek';
import { tilfoejTilRygsæk, brugFraRygsæk } from './spilmotor';
import { syncTilDb } from './netvaerk';
import { fremtvingKollaps, fremrykTid } from './overlevelse.svelte';
import type { Valg } from './eventBibliotek';

export const eventState = $state({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function kanViseValg(valg: Valg) {
    if (valg.kraeverKarakter && spilTilstand.valgtKarakter?.id !== valg.kraeverKarakter) return false;
    if (valg.puljeVaerdi && spilTilstand.guldTotal < valg.puljeVaerdi) return false;

    if (valg.kraeverItem) {
        const harTing = spilTilstand.mitUdstyr?.find(i => i.id === valg.kraeverItem);
        if (!harTing || harTing.maengde <= 0) return false;
    }

    if (valg.kosterItem) {
        const harTing = spilTilstand.mitUdstyr?.find(i => i.id === valg.kosterItem);
        if (!harTing || harTing.maengde <= 0) return false;
    }

    return true;
}

export function tagValg(valg: Valg) {
    if (eventState.valgLåst) return;

    if (!kanViseValg(valg)) {
        eventState.log = [...eventState.log, "Du har ikke det nødvendige udstyr eller guld."];
        return;
    }

    if (valg.kosterItem) {
        brugFraRygsæk(valg.kosterItem, 1);
    }
    if (valg.puljeVaerdi) {
        spilTilstand.guldTotal -= valg.puljeVaerdi;
    }

    eventState.valgLåst = true;

    if (valg.udfaldListe && valg.udfaldListe.length > 0) {
        const resultat = valg.udfaldListe[Math.floor(Math.random() * valg.udfaldListe.length)];
        let kvittering = "";
        let samletLogTekst = resultat.log;

        if (resultat.hpAendring) {
            let endeligHp = resultat.hpAendring;
            const udsving = Math.abs(endeligHp * 0.25);
            const tilfaeldig = (Math.random() * udsving * 2) - udsving;
            endeligHp = Math.round(endeligHp + tilfaeldig);
            spilTilstand.livspoint += endeligHp;
            kvittering += ` (${endeligHp > 0 ? '+' : ''}${endeligHp} HP)`;
        }

        if (resultat.guldAendring) {
            let endeligGuld = resultat.guldAendring;
            const udsving = Math.abs(endeligGuld * 0.25);
            const tilfaeldig = (Math.random() * udsving * 2) - udsving;
            endeligGuld = Math.round(endeligGuld + tilfaeldig);
            spilTilstand.guldTotal += endeligGuld;
            kvittering += ` (${endeligGuld > 0 ? '+' : ''}${endeligGuld} Guld)`;
        }

        if (kvittering) {
            samletLogTekst += kvittering;
        }

        eventState.log = [...eventState.log, samletLogTekst];
        spilTilstand.logBesked = samletLogTekst;

        if (resultat.givItem) tilfoejTilRygsæk(resultat.givItem, 1);
        if (resultat.mistItem) brugFraRygsæk(resultat.mistItem, 1);

        syncTilDb(true);

        if (resultat.kollaps || spilTilstand.livspoint <= 0) {
            setTimeout(() => fremtvingKollaps(), 1500);
            return;
        }

        if (resultat.naesteTrin) {
            setTimeout(() => startEvent(resultat.naesteTrin!), 2000);
        } else {
            const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
            if (felt) felt.eventFuldført = true;
            syncTilDb(true);
            fremrykTid();
            setTimeout(() => lukEvent(), 2000);
        }
    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else if ((valg as any).effekt) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultat = (valg as any).effekt();
        eventState.log = [...eventState.log, resultat.logBesked];
        spilTilstand.logBesked = resultat.logBesked;

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
    } else {
        eventState.log = [...eventState.log, "Ingenting skete."];
        spilTilstand.logBesked = "Ingenting skete.";
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (felt) felt.eventFuldført = true;
        syncTilDb(true);
        fremrykTid();
        setTimeout(() => lukEvent(), 2000);
    }
}