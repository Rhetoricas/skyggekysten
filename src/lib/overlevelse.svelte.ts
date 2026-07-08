import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb, broadcastFelt, broadcastFelter } from './netvaerk';
import { HEX_W } from './spildata';
import { brugFraRygsæk, hentKortBredde, hentKortHoejde, hentNaboIRetning } from './spilmotor';
import { erBeskyttetAfTaageblokker, erFeltITaagen } from './taage';
import { erFriskAktivSpiller } from './aktivSpiller';
import { registrerHeling, registrerVandSkade } from './trofaeer';
import type { Felt, GravstenMinde } from './types';
import { tekst } from './i18n.svelte';

function erVandBiome(biome: string | null | undefined) {
    return biome === 'hav' || biome === 'soe';
}

export function erSpillerITaagen() {
    return erFeltITaagen(spilTilstand.gitter, spilTilstand.spillerIndex, spilTilstand.fogX, hentKortBredde());
}

function erOestTaageAktiv() {
    return spilTilstand.fogX < 0;
}

function erTaagenVendtTilbageFraVest() {
    return spilTilstand.fogX <= -(hentKortBredde() * HEX_W);
}

function erSpillerBeskyttetAfTaageblokker() {
    return erBeskyttetAfTaageblokker(
        spilTilstand.gitter,
        spilTilstand.spillerIndex,
        hentKortBredde()
    );
}

function rydTaageramteFelter() {
    const bredde = hentKortBredde();
    const aendredeFelter: Array<{ index: number; feltData: Felt }> = [];

    spilTilstand.gitter.forEach((felt, index) => {
        if (!erFeltITaagen(spilTilstand.gitter, index, spilTilstand.fogX, bredde)) return;

        let aendret = false;
        if ((felt.skjultLiv ?? 0) > 0) {
            felt.skjultLiv = 0;
            aendret = true;
        }

        if (felt.isCampfire || felt.eventID === 'campfire') {
            felt.isCampfire = false;
            felt.eventID = undefined;
            aendret = true;
        }

        if (!felt.taageLukketShop && ((felt.shopBasisItems || []).length > 0 || (felt.shopItems || []).length > 0)) {
            felt.taageLukketShop = true;
            aendret = true;
        }

        if (!felt.taageLukketVaerksted && felt.hasWorkshop) {
            felt.taageLukketVaerksted = true;
            aendret = true;
        }

        if (index === spilTilstand.spillerIndex) {
            spilTilstand.aktivShop = null;
            spilTilstand.aktivVaerksted = false;
        }

        if (aendret) aendredeFelter.push({ index, feltData: felt });
    });

    if (aendredeFelter.length > 0) {
        spilTilstand.gitter = [...spilTilstand.gitter];
        broadcastFelter(aendredeFelter);
        return true;
    }

    return false;
}

let sidstBrugtEliksir = 0;
const BERSAERK_MIN_HP_TAB = 5;
const SKADE_TAL_SUFFIX = /\s*\(-\d+\s*HP\)\s*$/i;

function udenHardcodedSkadeTal(besked: string) {
    return besked.replace(SKADE_TAL_SUFFIX, '');
}

export function udloesBersaerkHvisRelevant(faktiskSkade: number) {
    const karakterId = spilTilstand.valgtKarakter?.id;
    const erViking = karakterId === 'viking_m' || karakterId === 'viking_f';

    if (!erViking) return '';
    if (faktiskSkade < BERSAERK_MIN_HP_TAB) return '';
    if (spilTilstand.sidsteBersaerkDag === spilTilstand.dag) return '';

    if (spilTilstand.gratisNaesteBevaegelse && spilTilstand.gratisBevaegelseKilde === 'bersaerk') {
        return '';
    }

    spilTilstand.sidsteBersaerkDag = spilTilstand.dag;
    spilTilstand.gratisNaesteBevaegelse = true;
    spilTilstand.gratisBevaegelseKilde = 'bersaerk';
    return tekst(
        ' Smerten vækker bersærkergangen. Næste energikrævende handling koster 0 energi.',
        ' The pain wakes berserk. The next energy-costing action costs 0 energy.'
    );
}

function tilfoejGravsten(felt: Felt, mindeTekst: string) {
    if (!spilTilstand.valgtKarakter) return;

    const eksisterende = felt.gravstenListe ?? (felt.gravstenIkon
        ? [{ ikon: felt.gravstenIkon, navn: tekst('Ukendt', 'Unknown'), dag: 0 }]
        : []);
    const minde: GravstenMinde = {
        ikon: spilTilstand.valgtKarakter.ikon,
        navn: spilTilstand.spillerNavn || tekst('Ukendt', 'Unknown'),
        dag: spilTilstand.dag || 1,
        tekst: mindeTekst
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
    if (erVandBiome(spilTilstand.gitter[start]?.biome)) return [];

    const landmasse: number[] = [];
    const aabne = [start];

    while (aabne.length > 0) {
        const indeks = aabne.pop()!;
        if (landmasse.includes(indeks)) continue;
        if (erVandBiome(spilTilstand.gitter[indeks]?.biome)) continue;

        landmasse.push(indeks);
        for (const nabo of hentNaboIndicesLokal(indeks)) {
            if (!landmasse.includes(nabo) && !erVandBiome(spilTilstand.gitter[nabo]?.biome)) {
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
        const foerHp = spilTilstand.livspoint;
        spilTilstand.livspoint = 90;
        registrerHeling(foerHp, spilTilstand.livspoint);
        return true; 
    }

    const harEliksir = spilTilstand.mitUdstyr?.some(i => i.id === 'livseliksir' && i.maengde > 0);
    if (harEliksir) {
        brugFraRygsæk('livseliksir', 1);
        const foerHp = spilTilstand.livspoint;
        spilTilstand.livspoint = 90;
        registrerHeling(foerHp, spilTilstand.livspoint);
        sidstBrugtEliksir = nu;
        return true;
    }
    return false;
}

export function tagSkadeOgTjekDød(skade: number, besked: string, doedsBesked?: string) {
    if (spilTilstand.gameState !== 'play') return;
    
    const rensetBesked = udenHardcodedSkadeTal(besked);
    const faktiskSkade = spilTilstand.beregnSkade(skade);
    spilTilstand.livspoint -= faktiskSkade;
    const bersaerkLog = udloesBersaerkHvisRelevant(faktiskSkade);
    
    const beskedMedTal = faktiskSkade > 0 ? `${rensetBesked} (-${faktiskSkade} HP)${bersaerkLog}` : rensetBesked;

    if (spilTilstand.livspoint <= 0) {
        const erHavet = rensetBesked.includes("havet") || rensetBesked.includes("saltvand") || rensetBesked.includes("hav") || erVandBiome(spilTilstand.gitter[spilTilstand.spillerIndex]?.biome);
        if (erHavet) registrerVandSkade(faktiskSkade);

        if (brugEliksir()) {
            spilTilstand.logBesked = tekst(`Du faldt om. ${beskedMedTal} Eliksiren redder dig.`, `You fell. ${beskedMedTal} The elixir saves you.`);
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
        spilTilstand.doedsAarsag = 'taage';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].deathCause = 'taage';
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            tilfoejGravsten(aktueltFelt, doedsBesked || tekst(`${beskedMedTal} Du døde.`, `${beskedMedTal} You died.`));
            broadcastFelt(spilTilstand.spillerIndex, aktueltFelt);
        }
        
        spilTilstand.logBesked = doedsBesked || tekst(`${beskedMedTal} Du døde.`, `${beskedMedTal} You died.`);
        syncTilDb(true);
    } else {
        const erHavet = rensetBesked.includes("havet") || rensetBesked.includes("saltvand") || rensetBesked.includes("hav") || erVandBiome(spilTilstand.gitter[spilTilstand.spillerIndex]?.biome);
        if (erHavet) registrerVandSkade(faktiskSkade);
        spilTilstand.logBesked = beskedMedTal;
        syncTilDb();
    }
}

function druknSpiller(besked: string) {
    spilTilstand.gameState = 'dead_map';
    spilTilstand.doedsAarsag = 'vand';
    spilTilstand.erBevidstløs = false;
    spilTilstand.livspoint = 0;

    if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
        spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        spilTilstand.alleSpillere[spilTilstand.spillerNavn].deathCause = 'vand';
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
            spilTilstand.logBesked = tekst('Du var ved at kollapse, men livseliksiren redder dig.', 'You were about to collapse, but the life elixir saves you.');
            syncTilDb();
            return;
        }

        spilTilstand.gameState = 'dead_map';
        spilTilstand.doedsAarsag = 'taage';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].deathCause = 'taage';
        }

        const aktueltFelt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (aktueltFelt && spilTilstand.valgtKarakter) {
            tilfoejGravsten(aktueltFelt, tekst('Tågen lukker sig om dig. Du mister resten af dit liv.', 'The fog closes around you. You lose the rest of your life.'));
            broadcastFelt(spilTilstand.spillerIndex, aktueltFelt);
        }

        spilTilstand.logBesked = tekst('Tågen lukker sig om dig. Du mister resten af dit liv.', 'The fog closes around you. You lose the rest of your life.');
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
    let taagenRykkede = false;

    while (spilTilstand.nuvaerendeEnergi <= 0) {
        spilTilstand.dag++;
        spilTilstand.nuvaerendeEnergi += spilTilstand.valgtKarakter.baseEnergi;        
        
        const taagenGaarModOest = spilTilstand.fogX >= 0;
        const taagenHoldtTilDag = taagenGaarModOest ? Math.max(0, ...spilTilstand.gitter.map((felt) => felt.taagenHoldtTilDag || 0)) : 0;
        if (spilTilstand.dag > 6 && spilTilstand.dag > taagenHoldtTilDag) {
            const dynamiskFart = 0.5 + Math.pow(spilTilstand.dag / 100, 2);
            const fremrykning = (HEX_W * dynamiskFart) / antalLevende;
            const oestkant = hentKortBredde() * HEX_W;
            taagenRykkede = true;

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
    let kortAendret = taagenRykkede ? rydTaageramteFelter() : false;

    if (nyDag > gammelDag) {
        let samletLog = "";

        // NYT: Generer både på østkysten, når solen står op på dag 6
        if (nyDag === 6 && gammelDag < 6) {
            const kystFelter = hentMuligeFlugtbaadFelter();
            const antalBaade = antalLevende;
            const placeret = placerManglendeFlugtbaade(kystFelter, antalBaade);
            if (placeret > 0) kortAendret = true;
            
            samletLog += tekst('Et horn lyder mod øst. Flugtbådene er ankommet.', 'A horn sounds to the east. The escape boats have arrived.');
            spilTilstand.gitter = [...spilTilstand.gitter];
        }

        if (samletLog.trim() !== "") {
            spilTilstand.logBesked = samletLog.trim();
        }

        if (taagenVendte) {
            spilTilstand.logBesked = tekst(
                'Vinden vender ved østkysten. Tågen stiger til niveau 2 og giver dobbelt skade, medmindre en tågeblokker holder den nede.',
                'The wind turns at the east coast. The fog rises to level 2 and deals double damage unless a fog blocker holds it down.'
            );
        }
    }

    if (erSpillerITaagen()) {
        const beskyttetAfBlokker = erSpillerBeskyttetAfTaageblokker();
        const tredobbeltTaage = erTaagenVendtTilbageFraVest() && !beskyttetAfBlokker;
        const dobbeltTaage = erOestTaageAktiv() && !beskyttetAfBlokker;
        tagSkadeOgTjekDød(
            tredobbeltTaage ? 90 : dobbeltTaage ? 60 : 30,
            tredobbeltTaage
                ? tekst('Tågen har krydset hele øen og stiger til niveau 3. Den lægger sig tre gange så tungt om dig.', 'The fog has crossed the whole island and rises to level 3. It settles three times as heavily around you.')
                : dobbeltTaage
                ? tekst('Tågen er på niveau 2 og lægger sig dobbelt tungt om dig.', 'The fog is level 2 and settles twice as heavily around you.')
                : tekst('Tågens syre ætsede dine lunger.', 'The fog acid burned your lungs.')
        );
        if (kortAendret && spilTilstand.gameState === 'play') syncTilDb(true);
    } else {
        syncTilDb(kortAendret);
    }
}

export function udfoerBlodofring() {
    if (!erSpillerITaagen()) {
        spilTilstand.logBesked = tekst('Du kan kun drikke af dit blod, når tågen omslutter dig.', 'You can only drink from your blood when the fog surrounds you.');
        return;
    }
    if (spilTilstand.maxLivspoint <= 10) {
        spilTilstand.logBesked = tekst('Du kan ikke sænke Max HP mere.', 'You cannot lower Max HP any further.');
        return;
    }
    
    const foerHp = spilTilstand.livspoint;
    spilTilstand.maxLivspoint -= 10;
    spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 50);
    registrerHeling(foerHp, spilTilstand.livspoint);
    
    spilTilstand.logBesked = tekst('Du bruger blodofferet. (-10 Max HP, +50 HP)', 'You use the blood sacrifice. (-10 Max HP, +50 HP)');
    
    syncTilDb();
}

export function fremtvingKollaps(brugerdefineretAarsag?: string) {
    if (spilTilstand.gameState !== 'play' || spilTilstand.erBevidstløs) return;

    if (erVandBiome(spilTilstand.gitter[spilTilstand.spillerIndex]?.biome)) {
        druknSpiller(brugerdefineretAarsag || tekst('Du mistede bevidstheden i vandet og druknede.', 'You lost consciousness in the water and drowned.'));
        return;
    }

    if (brugEliksir()) {
        const aarsag = brugerdefineretAarsag ? `${brugerdefineretAarsag} ` : tekst('Du var ved at kollapse. ', 'You were about to collapse. ');
        spilTilstand.logBesked = `${aarsag}${tekst('Eliksiren redder dig.', 'The elixir saves you.')}`;
        syncTilDb();
        return; 
    }

    spilTilstand.livspoint = 1; 
    spilTilstand.erBevidstløs = true;
    spilTilstand.nuvaerendeEnergi = 0;

    const mistetGuld = Math.floor(spilTilstand.guldTotal / 2);
    spilTilstand.guldTotal -= mistetGuld;

    const basisKollaps = mistetGuld > 0 
        ? tekst(`Du kollapser. Da du vågner, mangler du ${mistetGuld} guld.`, `You collapse. When you wake, ${mistetGuld} gold is missing.`)
        : tekst('Du kollapser af udmattelse. Tiden går, og tågen rykker frem.', 'You collapse from exhaustion. Time passes, and the fog advances.');

    spilTilstand.logBesked = brugerdefineretAarsag ? `${brugerdefineretAarsag} ${basisKollaps}` : basisKollaps;
    
    fremrykTid();

    setTimeout(() => {
        if (spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'dead') {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            spilTilstand.logBesked = mistetGuld > 0 
                ? tekst(`Du vågner med 10 HP. Du mangler ${mistetGuld} guld. Tågen er rykket frem.`, `You wake with 10 HP. ${mistetGuld} gold is missing. The fog has advanced.`)
                : tekst('Du vågner med 10 HP. Tågen er rykket frem.', 'You wake with 10 HP. The fog has advanced.');
            syncTilDb();
        }
    }, 2000);
}
