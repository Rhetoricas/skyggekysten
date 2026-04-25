import { eventBibliotek, type SpilEvent, type Valg, type Udfald } from './eventBibliotek';
import { spilTilstand } from '$lib/spilTilstand.svelte';
import { itemDB } from '$lib/spildata';
import { fremtvingKollaps } from './overlevelse.svelte';

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
    eventState.aktivt = null;
    eventState.log = [];
    eventState.valgLåst = false;
}

export function kanViseValg(valg: Valg): boolean {
    if (valg.kraeverItem && !spilTilstand.inventory.some(i => i.id === valg.kraeverItem)) return false;
    if (valg.kosterItem && !spilTilstand.inventory.some(i => i.id === valg.kosterItem)) return false;
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
        const index = spilTilstand.inventory.findIndex(i => i.id === valg.kosterItem);
        if (index !== -1) {
            spilTilstand.inventory.splice(index, 1);
            spilTilstand.inventory = [...spilTilstand.inventory];
        }
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
        const dbItem = itemDB[udfald.givItem];
        if (dbItem) {
            spilTilstand.inventory.push({ 
                id: dbItem.id, level: 1, navn: dbItem.navn, billede: dbItem.billede, type: dbItem.type 
            });
        }
    }
    if (udfald.mistItem) {
        const index = spilTilstand.inventory.findIndex(i => i.id === udfald.mistItem);
        if (index !== -1) {
            spilTilstand.inventory.splice(index, 1);
            spilTilstand.inventory = [...spilTilstand.inventory];
        }
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