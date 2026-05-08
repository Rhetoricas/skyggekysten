import { spilTilstand } from './spilTilstand.svelte';
import { eventBibliotek } from './eventBibliotek';
import { tilfoejTilRygsæk, brugFraRygsæk } from './spilmotor';
import { syncTilDb } from './netvaerk';
import { fremrykTid } from './overlevelse.svelte';
import type { Valg } from './eventBibliotek';

export const eventState = $state({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aktivt: null as any,
    log: [] as string[],
    valgLåst: false,
    naesteTrin: null as string | null,
    erFaerdig: false,
    afventerKollaps: false
});

export function startEvent(eventID: string) {
    const evt = eventBibliotek[eventID];
    if (!evt) return;
    
    eventState.aktivt = evt;
    eventState.log = [evt.tekst];
    
    spilTilstand.logBesked = `--- ${evt.titel.toUpperCase()} ---`;
    spilTilstand.logBesked = evt.tekst;
    
    eventState.valgLåst = false;
    eventState.naesteTrin = null;
    eventState.erFaerdig = false;
    eventState.afventerKollaps = false;
}

export function lukEvent() {
    eventState.aktivt = null;
    eventState.log = [];
    eventState.valgLåst = false;
    eventState.naesteTrin = null;
    eventState.erFaerdig = false;
    eventState.afventerKollaps = false;
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

    if (valg.kosterEnergi && spilTilstand.nuvaerendeEnergi < valg.kosterEnergi) return false;

    return true;
}

export function tagValg(valg: Valg) {
    if (eventState.valgLåst) return;

    if (!kanViseValg(valg)) {
        eventState.log = [...eventState.log, "Du har ikke det nødvendige udstyr eller guld."];
        return;
    }

    if (valg.kosterItem) brugFraRygsæk(valg.kosterItem, 1);
    if (valg.puljeVaerdi) spilTilstand.guldTotal -= valg.puljeVaerdi;
    if (valg.kosterEnergi) spilTilstand.nuvaerendeEnergi -= valg.kosterEnergi;

    eventState.valgLåst = true;

    let samletLogTekst = "";
    let kvittering = "";

    if (valg.udfaldListe && valg.udfaldListe.length > 0) {
        const resultat = valg.udfaldListe[Math.floor(Math.random() * valg.udfaldListe.length)];
        samletLogTekst = resultat.log;

        if (resultat.maxHpAendring) {
            spilTilstand.maxLivspoint += resultat.maxHpAendring;
            spilTilstand.livspoint += (resultat.maxHpAendring > 0 ? resultat.maxHpAendring : 0);
            kvittering += ` (${resultat.maxHpAendring > 0 ? '+' : ''}${resultat.maxHpAendring} Max HP)`;
        }

        if (resultat.hpAendring) {
            let endeligHp = resultat.hpAendring;
            const udsving = Math.abs(endeligHp * 0.25);
            endeligHp = Math.round(endeligHp + (Math.random() * udsving * 2) - udsving);
            if (endeligHp < 0) endeligHp = -spilTilstand.beregnSkade(Math.abs(endeligHp));
            
            const foerHp = spilTilstand.livspoint;
            spilTilstand.livspoint += endeligHp;
            const faktiskAendring = spilTilstand.livspoint - foerHp;
            if (faktiskAendring !== 0) kvittering += ` (${faktiskAendring > 0 ? '+' : ''}${faktiskAendring} HP)`;
        }

        if (resultat.guldAendring) {
            let endeligGuld = resultat.guldAendring;
            if (endeligGuld > 0) endeligGuld = spilTilstand.beregnGuldIndkomst(endeligGuld);
            const foerGuld = spilTilstand.guldTotal;
            spilTilstand.guldTotal += endeligGuld;
            const faktiskGuld = spilTilstand.guldTotal - foerGuld;
            if (faktiskGuld !== 0) kvittering += ` (${faktiskGuld > 0 ? '+' : ''}${faktiskGuld} Guld)`;
        }

        if (resultat.givItem) {
            resultat.givItem.split(',').forEach(item => {
                const id = item.trim();
                tilfoejTilRygsæk(id, 1);
                kvittering += ` (+${id})`;
            });
        }
        if (resultat.mistItem) {
            resultat.mistItem.split(',').forEach(item => {
                const id = item.trim();
                brugFraRygsæk(id, 1);
                kvittering += ` (-${id})`;
            });
        }
        
        if (resultat.naesteTrin) eventState.naesteTrin = resultat.naesteTrin;
        if (resultat.kollaps) eventState.afventerKollaps = true;

    } 
    else if ('effekt' in valg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const valgMedEffekt = valg as any;
        const resultat = valgMedEffekt.effekt();
        samletLogTekst = resultat.logBesked;

        if (resultat.maxHpAendring) {
            spilTilstand.maxLivspoint += resultat.maxHpAendring;
            spilTilstand.livspoint += (resultat.maxHpAendring > 0 ? resultat.maxHpAendring : 0);
            kvittering += ` (${resultat.maxHpAendring > 0 ? '+' : ''}${resultat.maxHpAendring} Max HP)`;
        }

        if (resultat.hpOp) {
            const foer = spilTilstand.livspoint;
            spilTilstand.livspoint += resultat.hpOp;
            kvittering += ` (+${spilTilstand.livspoint - foer} HP)`;
        }
        if (resultat.hpNed) {
            const skade = spilTilstand.beregnSkade(resultat.hpNed);
            spilTilstand.livspoint -= skade;
            kvittering += ` (-${skade} HP)`;
        }
        if (resultat.guldOp) {
            const indkomst = spilTilstand.beregnGuldIndkomst(resultat.guldOp);
            spilTilstand.guldTotal += indkomst;
            kvittering += ` (+${indkomst} Guld)`;
        }
        if (resultat.guldNed) {
            spilTilstand.guldTotal -= resultat.guldNed;
            kvittering += ` (-${resultat.guldNed} Guld)`;
        }
        if (resultat.energiOp) {
            spilTilstand.nuvaerendeEnergi += resultat.energiOp;
            kvittering += ` (+${resultat.energiOp} Energi)`;
        }
        if (resultat.energiNed) {
            spilTilstand.nuvaerendeEnergi -= resultat.energiNed;
            kvittering += ` (-${resultat.energiNed} Energi)`;
        }
        if (resultat.itemUd) {
            resultat.itemUd.split(',').forEach((item: string) => {
                const id = item.trim();
                tilfoejTilRygsæk(id, 1);
                kvittering += ` (+${id})`;
            });
        }

        if (resultat.naesteEvent) eventState.naesteTrin = resultat.naesteEvent;
    }

    const fuldBesked = samletLogTekst + kvittering;
    eventState.log = [...eventState.log, fuldBesked];
    spilTilstand.logBesked = fuldBesked;

    syncTilDb(true);

    if (spilTilstand.livspoint <= 0) {
        eventState.afventerKollaps = true;
        return;
    }

    if (!eventState.naesteTrin) {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (felt) felt.eventFuldført = true;
        fremrykTid();
        eventState.erFaerdig = true;
        syncTilDb(true);
    }
}