import { spilTilstand } from './spilTilstand.svelte';
import { eventBibliotek } from './eventBibliotek';
import { afslørFalkebueSyn, tilfoejTilRygsæk, brugFraRygsæk, harRygsaekItem, findRygsaekItemTilKrav } from './spilmotor';
import { syncTilDb, broadcastFelt, syncKortTilDbSenere } from './netvaerk';
import { fremrykTid, udloesBersaerkHvisRelevant } from './overlevelse.svelte';
import type { Valg } from './eventBibliotek';

export const eventState = $state({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aktivt: null as any,
    log: [] as string[],
    valgLåst: false,
    naesteTrin: null as string | null,
    erFaerdig: false,
    afventerKollaps: false,
    rootEventId: null as string | null,
    rootFeltIndex: null as number | null
});

export function startEvent(eventID: string) {
    const evt = eventBibliotek[eventID];
    if (!evt) return;

    if (!evt.erSubTrin || !eventState.rootEventId) {
        eventState.rootEventId = eventID;
        eventState.rootFeltIndex = spilTilstand.spillerIndex;
    }
    
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
    eventState.rootEventId = null;
    eventState.rootFeltIndex = null;
}

export function kanViseValg(valg: Valg) {
    if (valg.kraeverKarakter && spilTilstand.valgtKarakter?.id !== valg.kraeverKarakter) return false;
    if (valg.puljeVaerdi && spilTilstand.guldTotal < valg.puljeVaerdi) return false;

    if (valg.kraeverItem) {
        if (!harRygsaekItem(valg.kraeverItem)) return false;
    }

    if (valg.kraeverEtAfItems?.length) {
        const harEtAfDem = valg.kraeverEtAfItems.some(itemId => harRygsaekItem(itemId));
        if (!harEtAfDem) return false;
    }

    if (valg.kosterItem) {
        if (!findRygsaekItemTilKrav(valg.kosterItem)) return false;
    }

    if (valg.kosterEnergi && spilTilstand.nuvaerendeEnergi < valg.kosterEnergi) return false;

    return true;
}

function valgBrugerKniv(valg: Valg) {
    return valg.kraeverItem === 'kniv' ||
        valg.kosterItem === 'kniv' ||
        !!valg.kraeverEtAfItems?.includes('kniv');
}

function harMesterknivTilValg(valg: Valg) {
    return valgBrugerKniv(valg) && harRygsaekItem('mesterkniv');
}

function valgBrugerOekse(valg: Valg) {
    return valg.kraeverItem === 'oekse' ||
        valg.kosterItem === 'oekse' ||
        !!valg.kraeverEtAfItems?.includes('oekse');
}

function harStormoekseTilValg(valg: Valg) {
    return valgBrugerOekse(valg) && harRygsaekItem('stormoekse');
}

function valgBrugerBue(valg: Valg) {
    return valg.kraeverItem === 'bue' ||
        valg.kosterItem === 'bue' ||
        !!valg.kraeverEtAfItems?.includes('bue');
}

function harMesterbueTilValg(valg: Valg) {
    return valgBrugerBue(valg) && harRygsaekItem('mesterbue');
}

export function tagValg(valg: Valg) {
    if (eventState.valgLåst) return;
    const betaltItem = valg.kosterItem ? findRygsaekItemTilKrav(valg.kosterItem) : null;
    const brugerMesterkniv = harMesterknivTilValg(valg) || betaltItem === 'mesterkniv';
    const brugerStormoekse = harStormoekseTilValg(valg) || betaltItem === 'stormoekse';
    const brugerMesterbue = harMesterbueTilValg(valg) || betaltItem === 'mesterbue';
    const afsluttetEventId = eventState.rootEventId ?? eventState.aktivt?.id;
    const afsluttetFeltIndex = eventState.rootFeltIndex ?? spilTilstand.spillerIndex;

    if (!kanViseValg(valg)) {
        eventState.log = [...eventState.log, "Du har ikke det nødvendige udstyr eller guld."];
        return;
    }

    if (valg.kosterItem) {
        if (betaltItem) brugFraRygsæk(betaltItem, 1);
    }
    if (valg.puljeVaerdi) spilTilstand.guldTotal -= valg.puljeVaerdi;
    if (valg.kosterEnergi) spilTilstand.nuvaerendeEnergi -= valg.kosterEnergi;

    eventState.valgLåst = true;

    let samletLogTekst = "";
    let kvittering = "";

    if (valg.udfaldListe && valg.udfaldListe.length > 0) {
        const resultat = { ...valg.udfaldListe[Math.floor(Math.random() * valg.udfaldListe.length)] };
        if (brugerMesterkniv) {
            if (resultat.guldAendring && resultat.guldAendring > 0) {
                resultat.guldAendring = Math.round(resultat.guldAendring * 1.5);
            }
            if (resultat.hpAendring && resultat.hpAendring < 0) {
                resultat.hpAendring = Math.round(resultat.hpAendring * 0.75);
            }
        }
        if (brugerStormoekse) {
            if (resultat.guldAendring && resultat.guldAendring > 0) {
                resultat.guldAendring = Math.round(resultat.guldAendring * 1.5);
            }
            if (resultat.hpAendring && resultat.hpAendring < 0) {
                resultat.hpAendring = Math.round(resultat.hpAendring * 0.5);
            }
        }
        if (brugerMesterbue) {
            if (resultat.guldAendring && resultat.guldAendring > 0) {
                resultat.guldAendring = Math.round(resultat.guldAendring * 1.25);
            }
            if (resultat.hpAendring && resultat.hpAendring < 0) {
                resultat.hpAendring = Math.round(resultat.hpAendring * 0.5);
            }
        }
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
            if (faktiskAendring < 0) kvittering += udloesBersaerkHvisRelevant(Math.abs(faktiskAendring));
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
                const betaltId = findRygsaekItemTilKrav(id) ?? id;
                brugFraRygsæk(betaltId, 1);
                kvittering += ` (-${betaltId})`;
            });
        }
        
        if (resultat.naesteTrin) eventState.naesteTrin = resultat.naesteTrin;
        if (resultat.kollaps) eventState.afventerKollaps = true;

    } 
    else if ('effekt' in valg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const valgMedEffekt = valg as any;
        const resultat = valgMedEffekt.effekt(betaltItem);
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
            let grundSkade = resultat.hpNed;
            if (brugerMesterkniv) grundSkade = Math.round(grundSkade * 0.75);
            if (brugerStormoekse || brugerMesterbue) grundSkade = Math.round(grundSkade * 0.5);
            const skade = spilTilstand.beregnSkade(grundSkade);
            spilTilstand.livspoint -= skade;
            kvittering += ` (-${skade} HP)${udloesBersaerkHvisRelevant(skade)}`;
        }
        if (resultat.guldOp) {
            let grundIndkomst = resultat.guldOp;
            if (brugerMesterkniv || brugerStormoekse) grundIndkomst = Math.round(grundIndkomst * 1.5);
            if (brugerMesterbue) grundIndkomst = Math.round(grundIndkomst * 1.25);
            const indkomst = spilTilstand.beregnGuldIndkomst(grundIndkomst);
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

    if (brugerMesterbue) {
        afslørFalkebueSyn(spilTilstand.spillerIndex);
        kvittering += ` (Falkebuen afslører tre felter mod øst)`;
    }

    const fuldBesked = samletLogTekst + kvittering;
    eventState.log = [...eventState.log, fuldBesked];
    spilTilstand.logBesked = fuldBesked;

    syncTilDb();

    if (spilTilstand.livspoint <= 0) {
        eventState.afventerKollaps = true;
        return;
    }

    if (!eventState.naesteTrin) {
        const felt = spilTilstand.gitter[afsluttetFeltIndex];
        if (felt && felt.eventID === afsluttetEventId) {
            felt.eventFuldført = true;
            broadcastFelt(afsluttetFeltIndex, felt);
        }
        fremrykTid();
        eventState.erFaerdig = true;
        syncTilDb();
        syncKortTilDbSenere();
    }
}
