import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { BREDDE, HEX_W } from './spildata';
import { tjekUdstyrSlid } from './spilmotor';

export function erSpillerITaagen() {
    const r = Math.floor(spilTilstand.spillerIndex / BREDDE);
    const k = spilTilstand.spillerIndex % BREDDE;
    return (k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0)) < spilTilstand.fogX;
}

function brugEliksir() {
    const potionIndex = spilTilstand.mitUdstyr?.findIndex(i => i.id === 'livseliksir') ?? -1;
    if (potionIndex > -1) {
        spilTilstand.mitUdstyr.splice(potionIndex, 1);
        spilTilstand.livspoint = 90;
        return true;
    }
    return false;
}

// Kald denne udefra (fx Island.svelte), når du trækker HP uden for tågen
export function tagSkadeOgTjekDød(skade: number, besked: string, doedsBesked?: string) {
    if (spilTilstand.gameState !== 'play') return;
    spilTilstand.livspoint -= skade;
    
    if (spilTilstand.livspoint <= 0) {
        if (brugEliksir()) {
            spilTilstand.logBesked = `Du gik i brædderne. ${besked} Eliksiren tvang livet tilbage i din krop.`;
            syncTilDb(true);
            return;
        }
        
        spilTilstand.gameState = 'dead';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }
        
        spilTilstand.logBesked = doedsBesked || `${besked} Din krop gav endegyldigt op.`;
        syncTilDb(true);
    } else {
        spilTilstand.logBesked = besked;
        syncTilDb(true);
    }
}

export function tjekOverlevelse() {
    // Hvis spilleren allerede er død (fx af havet), afbryder vi tjekket fuldstændigt
    if (spilTilstand.gameState !== 'play' || spilTilstand.livspoint > 0) return;

    if (brugEliksir()) {
        spilTilstand.logBesked = "Døden greb efter dig. Eliksiren tvang livet tilbage i din krop.";
        syncTilDb(true);
        return;
    }

    if (erSpillerITaagen()) {
        spilTilstand.gameState = 'dead';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }
        spilTilstand.logBesked = "Tågen omsluttede dig helt. Mørket flåede det sidste liv ud af din krop.";
        syncTilDb(true);
        return; // Den afgørende return, der forhindrer spilleren i at "besvime" og genopstå
    }

    // Hvis HP falder til 0 af generel udmattelse (hvor man IKKE er i havet eller tågen)
    spilTilstand.gameState = 'dead';
    if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
        spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
    }
    spilTilstand.logBesked = "Din krop bukkede under for skader og udmattelse. Du rejser dig ikke igen.";
    syncTilDb(true);
}

export function fremrykTid() {
    if (!spilTilstand.valgtKarakter || spilTilstand.nuvaerendeEnergi > 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const antalLevende = Object.values(spilTilstand.alleSpillere).filter((s: any) => !s.isDead && !s.isWinner).length || 1;
    
    const gammelDag = spilTilstand.dag || 1;

    while (spilTilstand.nuvaerendeEnergi <= 0) {
        spilTilstand.dag++;
        spilTilstand.nuvaerendeEnergi += spilTilstand.valgtKarakter.baseEnergi;        
        
        if (spilTilstand.dag > 6) {
            spilTilstand.fogX += HEX_W / (antalLevende * 2);
        }
    }

    const nyDag = spilTilstand.dag || 1;

// Kører slid-tjekket, hvis kalenderen har rykket sig
    if (nyDag > gammelDag) {
        if (nyDag === 2) {
            // Her bruger vi = i stedet for += for at rydde den gamle besked væk
            spilTilstand.logBesked = "Dit blik skærer skarpere. Du føler dig mere klarsynet og kan nu overskue omgivelserne.";
        }

        ['fakkel', 'metaldetektor', 'soegekvist'].forEach(id => {
            const log = tjekUdstyrSlid(id);
            if (log) spilTilstand.logBesked += log;
        });
    }

    if (erSpillerITaagen()) {
        tagSkadeOgTjekDød(50, "Tågens syre ætsede dine lunger. (-50 HP)"); 
    } else {
        syncTilDb(true);
    }
}

export function udfoerBlodofring() {
    if (!erSpillerITaagen() || spilTilstand.livspoint <= 10) {
        spilTilstand.logBesked = "Du har ikke blod nok at give af.";
        return;
    }
    
    spilTilstand.livspoint -= 10;
    spilTilstand.nuvaerendeEnergi += 1;
    spilTilstand.logBesked = "Du drikker dit eget blod. Jernsmagen tvinger kroppen et skridt videre. (-10 HP, +1 Energi)";
    
    syncTilDb(true);
}

export function fremtvingKollaps() {
    if (spilTilstand.gameState !== 'play') return;

    if (brugEliksir()) {
        spilTilstand.logBesked = "Du var ved at kollapse. Eliksiren pumpede nyt liv i dine årer.";
        syncTilDb(true);
        return; 
    }

    spilTilstand.livspoint = 1; 
    spilTilstand.erBevidstløs = true;
    spilTilstand.nuvaerendeEnergi = 0;

    const mistetGuld = Math.floor(spilTilstand.guldTotal / 2);
    spilTilstand.guldTotal -= mistetGuld;

    spilTilstand.logBesked = mistetGuld > 0 
        ? `Du kollapser. Mens du ligger bevidstløs, forsvinder ${mistetGuld} guld fra dine lommer.` 
        : "Du kollapser af udmattelse. Tiden går. Tågen kryber tættere på.";
    
    fremrykTid();

    setTimeout(() => {
        if (spilTilstand.gameState !== 'dead') {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            spilTilstand.logBesked = mistetGuld > 0 
                ? `Du vågner med 10 HP. Du mangler ${mistetGuld} guld. Tågen er rykket frem.`
                : "Du vågner med buldrende hovedpine. Tågen er rykket frem.";
            syncTilDb(true);
        }
    }, 2000);
}