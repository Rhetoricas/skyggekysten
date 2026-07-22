import { spilTilstand } from './spilTilstand.svelte';
import { effektLog, eventBibliotek, eventTekst, eventTitel, udfaldLog } from './eventBibliotek';
import { tilfoejTilRygsæk, brugFraRygsæk, harRygsaekItem, findRygsaekItemTilKrav } from './spilmotor';
import { syncTilDb, broadcastFelt, syncKortTilDbSenere } from './netvaerk';
import { fremrykTid, udloesBersaerkHvisRelevant } from './overlevelse.svelte';
import { brugEnergi, visBrugteEnergiKugler } from './energi';
import { registrerHeling } from './trofaeer';
import { markerTutorialHandling } from './tutorial.svelte';
import type { Valg } from './eventBibliotek';
import { tekst } from './i18n.svelte';
import { itemNavn } from './spilTekst';

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
    eventState.log = [eventTekst(evt)];
    
    spilTilstand.logBesked = `--- ${eventTitel(evt).toUpperCase()} ---`;
    spilTilstand.logBesked = eventTekst(evt);
    
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

function erFantast() {
    return spilTilstand.valgtKarakter?.id === 'joker_m' || spilTilstand.valgtKarakter?.id === 'joker_f';
}

function kanFantastIgnorereAdgangskrav(valg: Valg) {
    return erFantast() && !valg.kosterItem;
}

export function kanViseValg(valg: Valg) {
    const ignorerAdgangskrav = kanFantastIgnorereAdgangskrav(valg);

    if (valg.kraeverKarakter && spilTilstand.valgtKarakter?.id !== valg.kraeverKarakter && !ignorerAdgangskrav) return false;
    if (valg.puljeVaerdi && spilTilstand.guldTotal < valg.puljeVaerdi) return false;

    if (valg.kraeverItem) {
        if (!harRygsaekItem(valg.kraeverItem) && !ignorerAdgangskrav) return false;
    }

    if (valg.kraeverEtAfItems?.length) {
        const harEtAfDem = valg.kraeverEtAfItems.some(itemId => harRygsaekItem(itemId));
        if (!harEtAfDem && !ignorerAdgangskrav) return false;
    }

    if (valg.kosterItem) {
        if (!findRygsaekItemTilKrav(valg.kosterItem)) return false;
    }

    const bersaerkBetalerEnergi = spilTilstand.gratisNaesteBevaegelse && spilTilstand.gratisBevaegelseKilde === 'bersaerk';
    if (valg.kosterEnergi && spilTilstand.nuvaerendeEnergi < valg.kosterEnergi && !bersaerkBetalerEnergi) return false;

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
        eventState.log = [...eventState.log, tekst('Du opfylder ikke kravene til dette valg.', 'You do not meet the requirements for this choice.')];
        return;
    }

    if (valg.kosterItem) {
        if (betaltItem) brugFraRygsæk(betaltItem, 1);
    }
    if (valg.puljeVaerdi) spilTilstand.guldTotal -= valg.puljeVaerdi;
    let gratisEnergiKvittering = "";
    if (valg.kosterEnergi) {
        const energiBetaling = brugEnergi(valg.kosterEnergi);
        if (energiBetaling.gratis) gratisEnergiKvittering = tekst(' (bersærkergangen dækker energiforbruget)', ' (your berserk rage covers the energy cost)');
    }

    eventState.valgLåst = true;

    let samletLogTekst = "";
    let kvittering = gratisEnergiKvittering;
    let bevarEvent = false;

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
        samletLogTekst = udfaldLog(resultat);

        if (resultat.maxHpAendring) {
            spilTilstand.maxLivspoint += resultat.maxHpAendring;
            const foerHp = spilTilstand.livspoint;
            spilTilstand.livspoint += (resultat.maxHpAendring > 0 ? resultat.maxHpAendring : 0);
            registrerHeling(foerHp, spilTilstand.livspoint);
            kvittering += ` (${resultat.maxHpAendring > 0 ? '+' : ''}${resultat.maxHpAendring} ${tekst('maks. HP', 'max HP')})`;
        }

        if (resultat.hpAendring) {
            let endeligHp = resultat.hpAendring;
            const udsving = Math.abs(endeligHp * 0.25);
            endeligHp = Math.round(endeligHp + (Math.random() * udsving * 2) - udsving);
            if (endeligHp < 0) endeligHp = -spilTilstand.beregnSkade(Math.abs(endeligHp));
            
            const foerHp = spilTilstand.livspoint;
            spilTilstand.livspoint += endeligHp;
            const faktiskAendring = spilTilstand.livspoint - foerHp;
            registrerHeling(foerHp, spilTilstand.livspoint);
            if (faktiskAendring !== 0) kvittering += ` (${faktiskAendring > 0 ? '+' : ''}${faktiskAendring} HP)`;
            if (faktiskAendring < 0) kvittering += udloesBersaerkHvisRelevant(Math.abs(faktiskAendring));
        }

        if (resultat.guldAendring) {
            let endeligGuld = resultat.guldAendring;
            if (endeligGuld > 0) endeligGuld = spilTilstand.beregnGuldIndkomst(endeligGuld);
            const foerGuld = spilTilstand.guldTotal;
            spilTilstand.guldTotal += endeligGuld;
            const faktiskGuld = spilTilstand.guldTotal - foerGuld;
            if (faktiskGuld !== 0) kvittering += ` (${faktiskGuld > 0 ? '+' : ''}${faktiskGuld} ${tekst('guld', 'gold')})`;
        }

        if (resultat.givItem) {
            resultat.givItem.split(',').forEach(item => {
                const id = item.trim();
                const itemFund = tilfoejTilRygsæk(id, 1);
                kvittering += id === 'diamant'
                    ? ` (+${itemFund?.diamantBeskrivelse || itemNavn('diamant')})`
                    : ` (+${itemNavn(id)})`;
            });
        }
        if (resultat.mistItem) {
            resultat.mistItem.split(',').forEach(item => {
                const id = item.trim();
                const betaltId = findRygsaekItemTilKrav(id) ?? id;
                brugFraRygsæk(betaltId, 1);
                kvittering += ` (-${itemNavn(betaltId)})`;
            });
        }
        
        if (resultat.naesteTrin) eventState.naesteTrin = resultat.naesteTrin;
        if (resultat.kollaps) eventState.afventerKollaps = true;

    } 
    else if ('effekt' in valg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const valgMedEffekt = valg as any;
        const resultat = valgMedEffekt.effekt(betaltItem);
        samletLogTekst = effektLog(resultat);
        bevarEvent = resultat.bevarEvent === true;

        if (resultat.maxHpAendring) {
            spilTilstand.maxLivspoint += resultat.maxHpAendring;
            const foerHp = spilTilstand.livspoint;
            spilTilstand.livspoint += (resultat.maxHpAendring > 0 ? resultat.maxHpAendring : 0);
            registrerHeling(foerHp, spilTilstand.livspoint);
            kvittering += ` (${resultat.maxHpAendring > 0 ? '+' : ''}${resultat.maxHpAendring} ${tekst('maks. HP', 'max HP')})`;
        }

        if (resultat.hpOp) {
            const foer = spilTilstand.livspoint;
            spilTilstand.livspoint += resultat.hpOp;
            registrerHeling(foer, spilTilstand.livspoint);
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
            kvittering += ` (+${indkomst} ${tekst('guld', 'gold')})`;
        }
        if (resultat.guldNed) {
            spilTilstand.guldTotal -= resultat.guldNed;
            kvittering += ` (-${resultat.guldNed} ${tekst('guld', 'gold')})`;
        }
        if (resultat.energiOp) {
            const foerEnergi = spilTilstand.nuvaerendeEnergi;
            spilTilstand.nuvaerendeEnergi += resultat.energiOp;
            const faktiskEnergi = spilTilstand.nuvaerendeEnergi - foerEnergi;
            if (faktiskEnergi > 0) kvittering += ` (+${faktiskEnergi} ${tekst('energi', 'energy')})`;
        }
        if (resultat.energiTil !== undefined) {
            const foerEnergi = spilTilstand.nuvaerendeEnergi;
            spilTilstand._nuvaerendeEnergi = Math.max(spilTilstand.nuvaerendeEnergi, resultat.energiTil);
            const faktiskEnergi = spilTilstand.nuvaerendeEnergi - foerEnergi;
            if (faktiskEnergi > 0) kvittering += ` (+${faktiskEnergi} ${tekst('energi', 'energy')})`;
        }
        if (resultat.energiNed) {
            spilTilstand.nuvaerendeEnergi -= resultat.energiNed;
            visBrugteEnergiKugler(resultat.energiNed);
            kvittering += ` (-${resultat.energiNed} ${tekst('energi', 'energy')})`;
        }
        if (resultat.energisyn) {
            if (!spilTilstand.harEnergisyn) kvittering += ` (${tekst('Energisyn', 'Energy sight')})`;
            spilTilstand.harEnergisyn = true;
        }
        if (resultat.itemUd) {
            resultat.itemUd.split(',').forEach((item: string) => {
                const id = item.trim();
                const itemFund = tilfoejTilRygsæk(id, 1);
                kvittering += id === 'diamant'
                    ? ` (+${itemFund?.diamantBeskrivelse || itemNavn('diamant')})`
                    : ` (+${itemNavn(id)})`;
            });
        }

        if (resultat.naesteEvent) eventState.naesteTrin = resultat.naesteEvent;
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
            felt.eventFuldført = !bevarEvent;
            broadcastFelt(afsluttetFeltIndex, felt);
        }
        fremrykTid();
        eventState.erFaerdig = true;
        markerTutorialHandling('event');
        syncTilDb();
        syncKortTilDbSenere();
    }
}
