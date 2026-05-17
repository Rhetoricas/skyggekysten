import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb, broadcastFelt } from './netvaerk';
import { HEX_W } from './spildata';
import { brugFraRygsæk, hentKortBredde, hentKortHoejde, hentNaboIRetning } from './spilmotor';
import { erFeltITaagen } from './taage';
import { erFriskAktivSpiller } from './aktivSpiller';
import type { Felt, GravstenMinde } from './types';

export function erSpillerITaagen() {
    return erFeltITaagen(spilTilstand.gitter, spilTilstand.spillerIndex, spilTilstand.fogX, hentKortBredde());
}

let sidstBrugtEliksir = 0;
const BERSAERK_MIN_HP_TAB = 5;

export function udloesBersaerkHvisRelevant(faktiskSkade: number) {
    const karakterId = spilTilstand.valgtKarakter?.id;
    const erViking = karakterId === 'viking_m' || karakterId === 'viking_f';

    if (!erViking) return '';
    if (faktiskSkade < BERSAERK_MIN_HP_TAB) return '';
    if (spilTilstand.sidsteBersaerkDag === spilTilstand.dag) return '';

    if (spilTilstand.gratisNaesteBevaegelse) {
        return '';
    }

    spilTilstand.sidsteBersaerkDag = spilTilstand.dag;
    spilTilstand.gratisNaesteBevaegelse = true;
    spilTilstand.gratisBevaegelseKilde = 'bersaerk';
    return ' Smerten vækker bersærkergangen. Næste bevægelse koster 0 energi.';
}

function tilfoejGravsten(felt: Felt, tekst: string) {
    if (!spilTilstand.valgtKarakter) return;

    const eksisterende = felt.gravstenListe ?? (felt.gravstenIkon
        ? [{ ikon: felt.gravstenIkon, navn: 'Ukendt', dag: 0 }]
        : []);
    const minde: GravstenMinde = {
        ikon: spilTilstand.valgtKarakter.ikon,
        navn: spilTilstand.spillerNavn || 'Ukendt',
        dag: spilTilstand.dag || 1,
        tekst
    };

    felt.gravstenListe = [...eksisterende, minde];
    felt.gravstenIkon = minde.ikon;
}

function hentMuligeFlugtbaadFelter() {
    const bredde = hentKortBredde();
    const hoejde = hentKortHoejde();
    const kystFelter: number[] = [];
    const landmasse = hentSpillerensLandmasse();
    const tilfoejKystFelt = (indeks: number) => {
        if (!kystFelter.includes(indeks)) kystFelter.push(indeks);
    };

    for (let r = 1; r < hoejde - 1; r++) {
        const landIndeks = r * bredde + (bredde - 2);
        const vandIndeks = r * bredde + (bredde - 1);
        if (
            landmasse.includes(landIndeks) &&
            spilTilstand.gitter[vandIndeks]?.biome === 'hav'
        ) {
            tilfoejKystFelt(vandIndeks);
        }
    }

    if (kystFelter.length === 0) {
        for (let indeks = 0; indeks < spilTilstand.gitter.length; indeks++) {
            const felt = spilTilstand.gitter[indeks];
            const kolonne = indeks % bredde;
            if (kolonne < bredde * 0.75 || felt?.biome !== 'hav') continue;

            const naboLand = hentNaboIndicesLokal(indeks).some((naboIndeks) => landmasse.includes(naboIndeks));
            if (naboLand) tilfoejKystFelt(indeks);
        }
    }

    return kystFelter;
}

function hashTekst(tekst: string) {
    let hash = 2166136261;
    for (let i = 0; i < tekst.length; i++) {
        hash ^= tekst.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function sortDeterministiskBaadFelter(felter: number[]) {
    const seed = spilTilstand.rundeSeed || spilTilstand.rumKode || 'taage';
    return [...felter].sort((a, b) => hashTekst(`${seed}:${a}`) - hashTekst(`${seed}:${b}`));
}

function taelFlugtbaade() {
    return spilTilstand.gitter.reduce((antal, felt) => {
        if (!felt.hasBoat && !felt.boatCount) return antal;
        return antal + Math.max(1, felt.boatCount || 1);
    }, 0);
}

function placerManglendeFlugtbaade(kystFelter: number[], oensketAntal: number) {
    const mangler = Math.max(0, oensketAntal - taelFlugtbaade());
    if (mangler <= 0 || kystFelter.length === 0) return 0;

    const fordelteFelter = sortDeterministiskBaadFelter(kystFelter);
    let placeret = 0;

    for (let i = 0; i < mangler; i++) {
        const baadFelt = fordelteFelter[i % fordelteFelter.length];
        spilTilstand.gitter[baadFelt].hasBoat = true;
        spilTilstand.gitter[baadFelt].boatCount = Math.max(0, spilTilstand.gitter[baadFelt].boatCount || 0) + 1;
        broadcastFelt(baadFelt, spilTilstand.gitter[baadFelt]);
        placeret++;
    }

    return placeret;
}

function hentSpillerensLandmasse() {
    const start = spilTilstand.spillerIndex;
    if (spilTilstand.gitter[start]?.biome === 'hav') return [];

    const landmasse: number[] = [];
    const aabne = [start];

    while (aabne.length > 0) {
        const indeks = aabne.pop()!;
        if (landmasse.includes(indeks)) continue;
        if (spilTilstand.gitter[indeks]?.biome === 'hav') continue;

        landmasse.push(indeks);
        for (const nabo of hentNaboIndicesLokal(indeks)) {
            if (!landmasse.includes(nabo) && spilTilstand.gitter[nabo]?.biome !== 'hav') {
                aabne.push(nabo);
            }
        }
    }

    return landmasse;
}

function hentNaboIndicesLokal(index: number) {
    const bredde = hentKortBredde();
    const maxFelter = bredde * hentKortHoejde();
    return (['NE', 'E', 'SE', 'SW', 'W', 'NW'] as const)
        .map((retning) => hentNaboIRetning(index, retning, bredde, maxFelter))
        .filter((i): i is number => i !== null);
}

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
    const bersaerkLog = udloesBersaerkHvisRelevant(faktiskSkade);
    
    const beskedMedTal = faktiskSkade > 0 ? `${besked} (-${faktiskSkade} HP)${bersaerkLog}` : besked;

    if (spilTilstand.livspoint <= 0) {
        const erHavet = besked.includes("havet") || besked.includes("saltvand") || besked.includes("hav");

        if (brugEliksir()) {
            spilTilstand.logBesked = `Du faldt om. ${beskedMedTal} Eliksiren redder dig.`;
            syncTilDb();
            return;
        }

        if (erHavet) {
            druknSpiller(doedsBesked || beskedMedTal);
            return;
        }

        if (!erHavet && !erSpillerITaagen()) {
            fremtvingKollaps(doedsBesked || beskedMedTal);
            return;
        }

        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            tilfoejGravsten(aktueltFelt, doedsBesked || `${beskedMedTal} Du døde.`);
            broadcastFelt(spilTilstand.spillerIndex, aktueltFelt);
        }
        
        spilTilstand.logBesked = doedsBesked || `${beskedMedTal} Du døde.`;
        syncTilDb(true);
    } else {
        spilTilstand.logBesked = beskedMedTal;
        syncTilDb();
    }
}

function druknSpiller(besked: string) {
    spilTilstand.gameState = 'dead_map';
    spilTilstand.erBevidstløs = false;
    spilTilstand.livspoint = 0;

    if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
        spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
    }

    const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (aktueltFelt && spilTilstand.valgtKarakter) {
        tilfoejGravsten(aktueltFelt, besked);
        broadcastFelt(spilTilstand.spillerIndex, aktueltFelt);
    }

    spilTilstand.logBesked = besked;
    syncTilDb(true);
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
            tilfoejGravsten(aktueltFelt, 'Tågen lukker sig om dig. Du mister resten af dit liv.');
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

    const antalLevende = Object.values(spilTilstand.alleSpillere).filter(erFriskAktivSpiller).length || 1;
    
    const gammelDag = spilTilstand.dag || 1;
    let taagenVendte = false;

    while (spilTilstand.nuvaerendeEnergi <= 0) {
        spilTilstand.dag++;
        spilTilstand.nuvaerendeEnergi += spilTilstand.valgtKarakter.baseEnergi;        
        
        const taagenGaarModOest = spilTilstand.fogX >= 0;
        const taagenHoldtTilDag = taagenGaarModOest ? Math.max(0, ...spilTilstand.gitter.map((felt) => felt.taagenHoldtTilDag || 0)) : 0;
        if (spilTilstand.dag > 5 && spilTilstand.dag > taagenHoldtTilDag) {
            const dynamiskFart = 0.5 + Math.pow(spilTilstand.dag / 100, 2);
            const fremrykning = (HEX_W * dynamiskFart) / antalLevende;
            const oestkant = hentKortBredde() * HEX_W;

            if (spilTilstand.fogX >= oestkant) {
                spilTilstand.fogX = -fremrykning;
                taagenVendte = true;
            } else if (spilTilstand.fogX < 0) {
                spilTilstand.fogX -= fremrykning;
            } else {
                spilTilstand.fogX += fremrykning;
                if (spilTilstand.fogX >= oestkant) {
                    spilTilstand.fogX = -1;
                    taagenVendte = true;
                }
            }
        }
    }

    const nyDag = spilTilstand.dag || 1;
    let kortAendret = false;

    if (nyDag > gammelDag) {
        let samletLog = "";

        // NYT: Generer både på østkysten, når solen står op på dag 6
        if (nyDag === 6 && gammelDag < 6) {
            const kystFelter = hentMuligeFlugtbaadFelter();
            const antalBaade = antalLevende;
            const placeret = placerManglendeFlugtbaade(kystFelter, antalBaade);
            if (placeret > 0) kortAendret = true;
            
            samletLog += "Et horn lyder mod øst. Flugtbådene er ankommet.";
            spilTilstand.gitter = [...spilTilstand.gitter];
        }

        if (samletLog.trim() !== "") {
            spilTilstand.logBesked = samletLog.trim();
        }

        if (taagenVendte) {
            spilTilstand.logBesked = "Vinden vender ved østkysten. Tågen begynder at æde øen fra den anden side.";
        }
    }

    if (erSpillerITaagen()) {
        tagSkadeOgTjekDød(30, "Tågens syre ætsede dine lunger."); 
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

    if (spilTilstand.gitter[spilTilstand.spillerIndex]?.biome === 'hav') {
        druknSpiller(brugerdefineretAarsag || "Du mistede bevidstheden i vandet og druknede.");
        return;
    }

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
