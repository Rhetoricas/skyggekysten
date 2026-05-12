import { eventBibliotek, type SpilEvent, type Valg, type Udfald } from './eventBibliotek';
import { spilTilstand } from '$lib/spilTilstand.svelte';
import { fremtvingKollaps } from './overlevelse.svelte';
import { tilfoejTilRygsæk, brugFraRygsæk } from '$lib/spilmotor';

export const eventState = $state<{
    aktivt: SpilEvent | null;
    log: string[];
    valgLåst: boolean;
}>({
    aktivt: null,
    log: [],
    valgLåst: false
});

export function startEvent(id: string) {
    const event = eventBibliotek[id];
    if (event) {
        eventState.aktivt = event;
        eventState.log = [event.tekst]; 
        eventState.valgLåst = false;
    } else {
        console.error(`Kritisk fejl: Kunne ikke finde event med ID '${id}' i ordbogen.`);
    }
}

export function lukEvent() {
    // Find feltet under spilleren i gitteret
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    
    if (felt) {
        // Fjern eventID med 'undefined' i stedet for 'null'
        felt.eventID = undefined;
        
        // Ret navnet til 'udforsket', præcis som din types.ts kræver
        felt.udforsket = true;

        // Tving Svelte til at registrere ændringen i arrayet
        spilTilstand.gitter = [...spilTilstand.gitter];
    }

    // Nulstil selve event-vinduets interne tilstand
    eventState.aktivt = null;
    eventState.log = [];
    eventState.valgLåst = false;
}

export function kanViseValg(valg: Valg): boolean {
    if (valg.kraeverItem && !spilTilstand.mitUdstyr.some(i => i.id === valg.kraeverItem)) return false;
    if (valg.kosterItem && !spilTilstand.mitUdstyr.some(i => i.id === valg.kosterItem)) return false;
    if (valg.kraeverKarakter && spilTilstand.valgtKarakter?.id !== valg.kraeverKarakter) return false;
    if (valg.gemtForKarakter && spilTilstand.valgtKarakter?.id === valg.gemtForKarakter) return false;
    if (valg.puljeVaerdi && spilTilstand.guldTotal < valg.puljeVaerdi) return false;
    
    return true; 
}

export function tagValg(valg: Valg) {
    if (eventState.valgLåst) return;
    eventState.valgLåst = true;

    // 1. Træk betalingen fra spilleren (fjerner kun én kopi af genstanden)
    if (valg.kosterItem) {
        brugFraRygsæk(valg.kosterItem, 1);
    }
    if (valg.puljeVaerdi) {
        spilTilstand.guldTotal -= valg.puljeVaerdi;
    }

    // 2. Tjek om vi hopper direkte til et nyt vindue uden belønninger
    if (valg.naesteTrin && (!valg.udfaldListe || valg.udfaldListe.length === 0)) {
        startEvent(valg.naesteTrin);
        return;
    }

    // 3. Maskinen trækker i blinde fra udfaldslisten
    if (valg.udfaldListe && valg.udfaldListe.length > 0) {
        const index = Math.floor(Math.random() * valg.udfaldListe.length);
        const valgtUdfald = valg.udfaldListe[index];
        eksekverUdfald(valgtUdfald);
    } else {
        eventState.log.push("Du rækker ud i mørket, men finder ingenting.");
    }
}

function eksekverUdfald(udfald: Udfald) {
    eventState.log.push(udfald.log);

    if (udfald.aktionType === 'hp' && udfald.vaerdi) spilTilstand.livspoint += udfald.vaerdi;
    if (udfald.aktionType === 'guld' && udfald.vaerdi) spilTilstand.guldTotal += udfald.vaerdi;

    if (udfald.givItem) {
        tilfoejTilRygsæk(udfald.givItem, 1);
    }
    if (udfald.mistItem) {
        brugFraRygsæk(udfald.mistItem, 1);
    }

// Det skudsikre kollaps-tjek via 1-HP hacket
    if (udfald.aktionType === 'kollaps' || spilTilstand.livspoint <= 0) {
        lukEvent(); 
        
        // Tvinger besvimelsen i gang med 1 HP (overstyrer Sveltes dræber-kode)
        fremtvingKollaps();
        
        return; 
    }

    // Kører kun videre, hvis karakteren stadig står på benene
    if (udfald.naesteTrin) {
        setTimeout(() => {
            startEvent(udfald.naesteTrin!);
        }, 3000); 
    }
}