import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb, broadcastFelt } from './netvaerk';
import { BREDDE, HEX_W, HOEJDE } from './spildata';
import { brugFraRygsæk } from './spilmotor';
import { erFeltITaagen } from './taage';

export function erSpillerITaagen() {
    return erFeltITaagen(spilTilstand.gitter, spilTilstand.spillerIndex, spilTilstand.fogX);
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
            fremtvingKollaps(doedsBesked || beskedMedTal);
            return;
        }

        if (brugEliksir()) {
            spilTilstand.logBesked = `Du faldt om. ${beskedMedTal} Eliksiren redder dig.`;
            syncTilDb();
            return;
        }
        
        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            aktueltFelt.gravstenIkon = spilTilstand.valgtKarakter.ikon;
            broadcastFelt(spilTilstand.spillerIndex, aktueltFelt);
        }
        
        spilTilstand.logBesked = doedsBesked || `${beskedMedTal} Du døde.`;
        syncTilDb(true);
    } else {
        spilTilstand.logBesked = beskedMedTal;
        syncTilDb();
    }
}

export function tjekOverlevelse() {
    if (spilTilstand.gameState !== 'play' || spilTilstand.livspoint > 0) return;

    if (erSpillerITaagen()) {
        if (brugEliksir()) {
            spilTilstand.logBesked = "Du var ved at kollapse, men livseliksiren redder dig.";
            syncTilDb();
            return;
        }

        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            aktueltFelt.gravstenIkon = spilTilstand.valgtKarakter.ikon;
            broadcastFelt(spilTilstand.spillerIndex, aktueltFelt);
        }

        spilTilstand.logBesked = "Tågen lukker sig om dig. Du mister resten af dit liv.";
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
        
        const taagenHoldtTilDag = Math.max(0, ...spilTilstand.gitter.map((felt) => felt.taagenHoldtTilDag || 0));
        if (spilTilstand.dag > 5 && spilTilstand.dag > taagenHoldtTilDag) {
            const dynamiskFart = 0.5 + Math.pow(spilTilstand.dag / 100, 2);
            spilTilstand.fogX += (HEX_W * dynamiskFart) / antalLevende;        
        }
    }

    const nyDag = spilTilstand.dag || 1;
    let kortAendret = false;

    if (nyDag > gammelDag) {
        let samletLog = "";

        // NYT: Generer både på østkysten, når solen står op på dag 6
        if (nyDag === 6 && gammelDag < 6) {
            const kystFelter = [];
            for (let r = 1; r < HOEJDE - 1; r++) {
                const landIndeks = r * BREDDE + (BREDDE - 2);
                const vandIndeks = r * BREDDE + (BREDDE - 1);
                if (
                    spilTilstand.gitter[landIndeks]?.biome !== 'hav' &&
                    spilTilstand.gitter[vandIndeks]?.biome === 'hav'
                ) {
                    kystFelter.push(vandIndeks);
                }
            }
            
            kystFelter.sort(() => Math.random() - 0.5);
            const antalBaade = Math.min(antalLevende, kystFelter.length);
            
            for (let i = 0; i < antalBaade; i++) {
                spilTilstand.gitter[kystFelter[i]].hasBoat = true;
                broadcastFelt(kystFelter[i], spilTilstand.gitter[kystFelter[i]]);
                kortAendret = true;
            }
            
            samletLog += "Et horn lyder mod øst. Flugtbådene er ankommet.";
            spilTilstand.gitter = [...spilTilstand.gitter];
        }

        if (samletLog.trim() !== "") {
            spilTilstand.logBesked = samletLog.trim();
        }
    }

    if (erSpillerITaagen()) {
        tagSkadeOgTjekDød(50, "Tågens syre ætsede dine lunger."); 
    } else {
        syncTilDb(kortAendret);
    }
}

export function udfoerBlodofring() {
    if (!erSpillerITaagen()) {
        spilTilstand.logBesked = "Du kan kun drikke af dit blod, når tågen omslutter dig.";
        return;
    }
    if (spilTilstand.maxLivspoint <= 10) {
        spilTilstand.logBesked = "Du kan ikke sænke Max HP mere.";
        return;
    }
    
    spilTilstand.maxLivspoint -= 10;
    spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 50);
    
    spilTilstand.logBesked = `Du bruger blodofferet. (-10 Max HP, +50 HP)`;
    
    syncTilDb();
}

export function fremtvingKollaps(brugerdefineretAarsag?: string) {
    if (spilTilstand.gameState !== 'play' || spilTilstand.erBevidstløs) return;

    if (brugEliksir()) {
        const aarsag = brugerdefineretAarsag ? `${brugerdefineretAarsag} ` : "Du var ved at kollapse. ";
        spilTilstand.logBesked = `${aarsag}Eliksiren redder dig.`;
        syncTilDb();
        return; 
    }

    spilTilstand.livspoint = 1; 
    spilTilstand.erBevidstløs = true;
    spilTilstand.nuvaerendeEnergi = 0;

    const mistetGuld = Math.floor(spilTilstand.guldTotal / 2);
    spilTilstand.guldTotal -= mistetGuld;

    const basisKollaps = mistetGuld > 0 
        ? `Du kollapser. Da du vågner, mangler du ${mistetGuld} guld.` 
        : "Du kollapser af udmattelse. Tiden går, og tågen rykker frem.";

    spilTilstand.logBesked = brugerdefineretAarsag ? `${brugerdefineretAarsag} ${basisKollaps}` : basisKollaps;
    
    fremrykTid();

    setTimeout(() => {
        if (spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'dead') {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            spilTilstand.logBesked = mistetGuld > 0 
                ? `Du vågner med 10 HP. Du mangler ${mistetGuld} guld. Tågen er rykket frem.`
                : "Du vågner med 10 HP. Tågen er rykket frem.";
            syncTilDb();
        }
    }, 2000);
}
