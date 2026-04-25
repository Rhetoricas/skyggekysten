import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { BREDDE, HEX_W } from './spildata';

// --- HJÆLPER: Er vi i tågen? ---
export function erSpillerITaagen() {
    const r = Math.floor(spilTilstand.spillerIndex / BREDDE);
    const k = spilTilstand.spillerIndex % BREDDE;
    const spillerPixelX = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0);
    
    // Vi fjerner det falske +100 og bruger præcis samme logik som i island.svelte
    return spillerPixelX < spilTilstand.fogX;
}

// --- OVERVÅGNING: Liv og Død ---
export function tjekOverlevelse() {
    if (spilTilstand.gameState !== 'play') return;

    if (spilTilstand.livspoint <= 0) {
        // 1. Miraklet (Eliksir tjekkes altid først)
        const potionIndex = spilTilstand.inventory.findIndex(i => i.id === 'livseliksir');
        if (potionIndex > -1) {
            spilTilstand.inventory.splice(potionIndex, 1);
            spilTilstand.livspoint = 90;
            spilTilstand.logBesked = "Døden greb efter dig, men eliksiren tvang livet tilbage i din krop.";
            syncTilDb(true);
            return;
        }

        // 2. Den Sande Død (I Tågen)
        if (erSpillerITaagen()) {
            spilTilstand.gameState = 'dead';
            if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
                spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
            }
            spilTilstand.logBesked = "Tågen omslutter dig helt. Din krop giver op.";
            syncTilDb(true);
            return;
        }

        // 3. Bevidstløshed (Ude i det fri)
        spilTilstand.erBevidstløs = true;
        spilTilstand.nuvaerendeEnergi = 0; // Dræn al strøm
        spilTilstand.logBesked = "Du kollapser af udmattelse! Tiden går, og tågen kryber tættere på...";
        
        // Gennemtving turskift (som fylder energien op igen, men flytter tågen)
        fremrykTid();

        // Spilleren vågner næste morgen
        setTimeout(() => {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            spilTilstand.logBesked = "Du vågner med buldrende hovedpine. Tågen er rykket frem.";
            syncTilDb(true);
        }, 2000); // 2 sekunders "sort skærm" for dramatisk effekt
    }
}

// --- TIDSMASKINEN: Tågen rykker frem ---
export function fremrykTid() {
    if (!spilTilstand.valgtKarakter) return;

    while (spilTilstand.nuvaerendeEnergi <= 0) {
        spilTilstand.dag++;
        spilTilstand.nuvaerendeEnergi += spilTilstand.valgtKarakter.baseEnergi;
        
        let antalLevende = Object.values(spilTilstand.alleSpillere).filter(s => !s.isDead && !s.isWinner).length;
        if (antalLevende < 1) antalLevende = 1;
        
        // Tågen står stille de første 6 dage. Herefter rykker den med 0.5 hex pr. dag (ved 1 spiller).
        if (spilTilstand.dag > 6) {
            spilTilstand.fogX += HEX_W / (antalLevende * 2);
        }
    }

    if (erSpillerITaagen()) {
        spilTilstand.livspoint -= 50;
        spilTilstand.logBesked = "Tågens syre ætser dine lunger. (-50 HP)";
        tjekOverlevelse(); 
    } else {
        syncTilDb(true);
    }
}

// --- DESPERATION: Blodofring ---
export function udfoerBlodofring() {
    // Man kan ikke ofre sit sidste livspoint (man skal have mindst 11 HP for at overleve et 10 HP dræn)
    if (!erSpillerITaagen() || spilTilstand.livspoint <= 10) {
        spilTilstand.logBesked = "Du har ikke blod nok at give af...";
        return;
    }
    
    spilTilstand.livspoint -= 10;
    spilTilstand.nuvaerendeEnergi += 1;
    spilTilstand.logBesked = "Du drikker dit eget blod. Jernsmagen tvinger kroppen et skridt videre. (-10 HP, +1 Energi)";
    
    syncTilDb(true);
}

// --- MANUELT KOLLAPS: Når events eller fælder slår dig ud ---
export function fremtvingKollaps() {
    if (spilTilstand.gameState !== 'play') return;

    // 1. Miraklet (Eliksir redder dig fra at besvime)
    const potionIndex = spilTilstand.inventory.findIndex(i => i.id === 'livseliksir');
    if (potionIndex > -1) {
        spilTilstand.inventory.splice(potionIndex, 1);
        spilTilstand.inventory = [...spilTilstand.inventory]; 
        spilTilstand.livspoint = 90;
        spilTilstand.logBesked = "Du var ved at kollapse, men eliksiren pumpede nyt liv i dine årer!";
        syncTilDb(true);
        return; 
    }

    // 2. Den hårde tur i mudderet (1-HP hacket med straf)
    spilTilstand.livspoint = 1; 
    spilTilstand.erBevidstløs = true;
    spilTilstand.nuvaerendeEnergi = 0;

    // Straffen falder: Tyvene i mørket snupper halvdelen af guldet
    const mistetGuld = Math.floor(spilTilstand.guldTotal / 2);
    spilTilstand.guldTotal -= mistetGuld;

    if (mistetGuld > 0) {
        spilTilstand.logBesked = `Du kollapser! Mens du ligger bevidstløs, forsvinder ${mistetGuld} guld fra dine lommer...`;
    } else {
        spilTilstand.logBesked = "Du kollapser af udmattelse! Tiden går, og tågen kryber tættere på...";
    }
    
    // Tidsmaskinen spoler frem
    fremrykTid();

    // Spilleren vågner
    setTimeout(() => {
        if (spilTilstand.gameState !== 'dead') {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            // Vi bevarer tyveri-beskeden et øjeblik længere, så de ser den, når de vågner
            spilTilstand.logBesked = mistetGuld > 0 
                ? `Du vågner med 10 HP. Du mangler ${mistetGuld} guld. Tågen er rykket frem.`
                : `Du vågner med buldrende hovedpine. Tågen er rykket frem.`;
            syncTilDb(true);
        }
    }, 2000);
}