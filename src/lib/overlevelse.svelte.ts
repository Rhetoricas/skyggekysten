import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { BREDDE, HEX_W } from './spildata';
import { tjekUdstyrSlid, brugFraRygsæk } from './spilmotor';

export function erSpillerITaagen() {
    const r = Math.floor(spilTilstand.spillerIndex / BREDDE);
    const k = spilTilstand.spillerIndex % BREDDE;
    return (k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0)) < spilTilstand.fogX;
}

let sidstBrugtEliksir = 0;

function brugEliksir() {
    const nu = Date.now();
    
    if (nu - sidstBrugtEliksir < 1000) {
        spilTilstand.livspoint = 90;
        return true; 
    }

    const harEliksir = spilTilstand.mitUdstyr?.some(i => i.id === 'livseliksir' && i.maengde > 0);
    if (harEliksir) {
        brugFraRygsæk('livseliksir', 1);
        spilTilstand.livspoint = 90;
        sidstBrugtEliksir = nu;
        return true;
    }
    return false;
}

export function tagSkadeOgTjekDød(skade: number, besked: string, doedsBesked?: string) {
    if (spilTilstand.gameState !== 'play') return;
    
    const faktiskSkade = spilTilstand.beregnSkade(skade);
    spilTilstand.livspoint -= faktiskSkade;
    
    const beskedMedTal = faktiskSkade > 0 ? `${besked} (-${faktiskSkade} HP)` : besked;

    if (spilTilstand.livspoint <= 0) {
        const erHavet = besked.includes("havet") || besked.includes("saltvand") || besked.includes("hav");

        if (!erHavet && !erSpillerITaagen()) {
            fremtvingKollaps();
            if (spilTilstand.erBevidstløs && doedsBesked) {
                spilTilstand.logBesked = doedsBesked + " " + spilTilstand.logBesked;
            }
            return;
        }

        if (brugEliksir()) {
            spilTilstand.logBesked = `Du gik i brædderne. ${beskedMedTal} Eliksiren tvang livet tilbage i din krop.`;
            syncTilDb(true);
            return;
        }
        
        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            aktueltFelt.gravstenIkon = spilTilstand.valgtKarakter.ikon;
        }
        
        spilTilstand.logBesked = doedsBesked || `${beskedMedTal} Din krop gav endegyldigt op.`;
        syncTilDb(true);
    } else {
        spilTilstand.logBesked = beskedMedTal;
        syncTilDb(true);
    }
}

export function tjekOverlevelse() {
    if (spilTilstand.gameState !== 'play' || spilTilstand.livspoint > 0) return;

    if (erSpillerITaagen()) {
        if (brugEliksir()) {
            spilTilstand.logBesked = "Døden greb efter dig. Eliksiren tvang livet tilbage i din krop.";
            syncTilDb(true);
            return;
        }

        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            aktueltFelt.gravstenIkon = spilTilstand.valgtKarakter.ikon;
        }

        spilTilstand.logBesked = "Tågen omsluttede dig helt. Mørket flåede det sidste liv ud af din krop.";
        syncTilDb(true);
        return;
    }

    fremtvingKollaps();
}

export function fremrykTid() {
    if (!spilTilstand.valgtKarakter || spilTilstand.nuvaerendeEnergi > 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const antalLevende = Object.values(spilTilstand.alleSpillere).filter((s: any) => !s.isDead && !s.isWinner).length || 1;
    
    const gammelDag = spilTilstand.dag || 1;

    while (spilTilstand.nuvaerendeEnergi <= 0) {
        spilTilstand.dag++;
        spilTilstand.nuvaerendeEnergi += spilTilstand.valgtKarakter.baseEnergi;        
        
        if (spilTilstand.dag > 5) {
            spilTilstand.fogX += (HEX_W * 1.5) / antalLevende;        
        }
    }

    const nyDag = spilTilstand.dag || 1;

    if (nyDag > gammelDag) {
        if (nyDag === 2) {
            spilTilstand.logBesked = "Dit blik skærer skarpere. Du føler dig mere klarsynet og kan nu overskue omgivelserne.";
        }

        ['fakkel', 'metaldetektor', 'soegekvist'].forEach(id => {
            const log = tjekUdstyrSlid(id);
            if (log) spilTilstand.logBesked += log;
        });
    }

    if (erSpillerITaagen()) {
        tagSkadeOgTjekDød(50, "Tågens syre ætsede dine lunger."); 
    } else {
        syncTilDb(true);
    }
}

export function udfoerBlodofring() {
    if (!erSpillerITaagen() || spilTilstand.livspoint <= 10) {
        spilTilstand.logBesked = "Du har ikke blod nok at give af.";
        return;
    }
    
    const skade = spilTilstand.beregnSkade(10);
    spilTilstand.livspoint -= skade;
    spilTilstand.nuvaerendeEnergi += 1;
    spilTilstand.logBesked = `Du drikker dit eget blod. Jernsmagen tvinger kroppen et skridt videre. (-${skade} HP, +1 Energi)`;
    
    syncTilDb(true);
}

export function fremtvingKollaps() {
    if (spilTilstand.gameState !== 'play' || spilTilstand.erBevidstløs) return;

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
        if (spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'dead') {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            spilTilstand.logBesked = mistetGuld > 0 
                ? `Du vågner med 10 HP. Du mangler ${mistetGuld} guld. Tågen er rykket frem.`
                : "Du vågner med buldrende hovedpine. Tågen er rykket frem.";
            syncTilDb(true);
        }
    }, 2000);
}