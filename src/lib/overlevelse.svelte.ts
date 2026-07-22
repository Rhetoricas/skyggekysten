import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb, broadcastFelt, broadcastFelter } from './netvaerk';
import { HEX_W } from './spildata';
import { brugFraRygsæk, hentKortBredde, hentKortHoejde, hentNaboIRetning } from './spilmotor';
import { erFeltITaagen, hentTaageNiveauForFelt } from './taage';
import { erFriskAktivSpiller } from './aktivSpiller';
import { registrerHeling, registrerVandSkade } from './trofaeer';
import type { Felt } from './types';
import { tekst } from './i18n.svelte';
import { registrerDoedsGravsten } from './gravsten';

function erVandBiome(biome: string | null | undefined) {
    return biome === 'hav' || biome === 'soe';
}

export function erSpillerITaagen() {
    return erFeltITaagen(spilTilstand.gitter, spilTilstand.spillerIndex, spilTilstand.fogX, hentKortBredde());
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

export function nulstilOverlevelseKlientState() {
    sidstBrugtEliksir = 0;
    spilTilstand.erBevidstløs = false;
}
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
        ' Smerten vækker din bersærkergang. Din næste handling med energiforbrug er gratis.',
        ' The pain awakens your berserk rage. Your next action with an energy cost is free.'
    );
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
            spilTilstand.logBesked = tekst(`${beskedMedTal} Du falder om, men livseliksiren redder dig.`, `${beskedMedTal} You collapse, but the life elixir saves you.`);
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
            registrerDoedsGravsten(spilTilstand.spillerIndex, doedsBesked || tekst(`${beskedMedTal} Du dør.`, `${beskedMedTal} You die.`));
        }
        
        spilTilstand.logBesked = doedsBesked || tekst(`${beskedMedTal} Du dør.`, `${beskedMedTal} You die.`);
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
        registrerDoedsGravsten(spilTilstand.spillerIndex, besked);
    }

    spilTilstand.logBesked = besked;
    syncTilDb(true);
}

export function tjekOverlevelse() {
    if (spilTilstand.gameState !== 'play' || spilTilstand.livspoint > 0) return;

    if (erSpillerITaagen()) {
        if (brugEliksir()) {
            spilTilstand.logBesked = tekst('Du er ved at kollapse, men livseliksiren redder dig.', 'You are about to collapse, but the life elixir saves you.');
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
            registrerDoedsGravsten(spilTilstand.spillerIndex, tekst('Tågen lukker sig om dig. Du dør i den giftige luft.', 'The fog closes around you. You die in the toxic air.'));
        }

        spilTilstand.logBesked = tekst('Tågen lukker sig om dig. Du dør i den giftige luft.', 'The fog closes around you. You die in the toxic air.');
        syncTilDb(true);
        return;
    }

    fremtvingKollaps();
}

export function fremrykTid() {
    if (!spilTilstand.valgtKarakter || spilTilstand.nuvaerendeEnergi > 0) return;

    const antalLevende = Object.values(spilTilstand.alleSpillere).filter(erFriskAktivSpiller).length || 1;
    
    const gammelDag = spilTilstand.dag || 1;
    let taagenVendteVed: 'oest' | 'vest' | null = null;
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
                taagenVendteVed = 'oest';
            } else if (spilTilstand.fogX < 0) {
                const gammelPassage = Math.max(1, Math.ceil(Math.abs(spilTilstand.fogX) / oestkant));
                spilTilstand.fogX -= fremrykning;
                const nyPassage = Math.max(1, Math.ceil(Math.abs(spilTilstand.fogX) / oestkant));
                if (nyPassage > gammelPassage) {
                    taagenVendteVed = nyPassage % 2 === 0 ? 'vest' : 'oest';
                }
            } else {
                spilTilstand.fogX += fremrykning;
                if (spilTilstand.fogX >= oestkant) {
                    spilTilstand.fogX = -1;
                    taagenVendteVed = 'oest';
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
            
            samletLog += tekst('Et horn lyder mod øst. Flugtbådene venter ved kysten.', 'A horn sounds to the east. The escape boats are waiting by the coast.');
            spilTilstand.gitter = [...spilTilstand.gitter];
        }

        if (samletLog.trim() !== "") {
            spilTilstand.logBesked = samletLog.trim();
        }

        if (taagenVendteVed) {
            spilTilstand.logBesked = taagenVendteVed === 'oest'
                ? tekst(
                    'Vinden vender ved østkysten. Tågen bevæger sig nu mod vest. Felterne stiger først i tågeniveau, når fronten rammer dem.',
                    'The wind turns at the east coast. The fog now moves west. Tiles only rise in fog level when the front reaches them.'
                )
                : tekst(
                    'Vinden vender ved vestkysten. Tågen bevæger sig nu mod øst. Tågeblokkere holder de beskyttede felter på deres nuværende niveau.',
                    'The wind turns at the west coast. The fog now moves east. Fog blockers keep protected tiles at their current level.'
                );
        }
    }

    if (erSpillerITaagen()) {
        const taageNiveau = hentTaageNiveauForFelt(
            spilTilstand.gitter,
            spilTilstand.spillerIndex,
            spilTilstand.fogX,
            hentKortBredde()
        );
        tagSkadeOgTjekDød(
            taageNiveau >= 3 ? 90 : taageNiveau === 2 ? 60 : 30,
            taageNiveau >= 3
                ? tekst('Tågen har krydset hele øen og nået niveau 3. Den giver dig tredobbelt skade.', 'The fog has crossed the entire island and reached level 3. It deals triple damage to you.')
                : taageNiveau === 2
                ? tekst('Tågen er på niveau 2 og giver dig dobbelt skade.', 'The fog is at level 2 and deals double damage to you.')
                : tekst('Den giftige tåge ætser dine lunger.', 'The toxic fog burns your lungs.')
        );
        if (kortAendret && spilTilstand.gameState === 'play') syncTilDb(true);
    } else {
        syncTilDb(kortAendret);
    }
}

export function udfoerBlodofring() {
    if (!erSpillerITaagen()) {
        spilTilstand.logBesked = tekst('Du kan kun bruge blodofferet, når tågen omslutter dig.', 'You can only use the blood sacrifice while the fog surrounds you.');
        return;
    }
    if (spilTilstand.maxLivspoint <= 10) {
        spilTilstand.logBesked = tekst('Du kan ikke sænke dit maks. HP yderligere.', 'You cannot lower your maximum HP any further.');
        return;
    }
    
    const foerHp = spilTilstand.livspoint;
    spilTilstand.maxLivspoint -= 10;
    spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 50);
    registrerHeling(foerHp, spilTilstand.livspoint);
    
    spilTilstand.logBesked = tekst('Du ofrer 10 maks. HP og genvinder 50 HP.', 'You sacrifice 10 maximum HP and recover 50 HP.');
    
    syncTilDb();
}

export function fremtvingKollaps(brugerdefineretAarsag?: string) {
    if (spilTilstand.gameState !== 'play' || spilTilstand.erBevidstløs) return;

    if (erVandBiome(spilTilstand.gitter[spilTilstand.spillerIndex]?.biome)) {
        druknSpiller(brugerdefineretAarsag || tekst('Du mister bevidstheden i vandet og drukner.', 'You lose consciousness in the water and drown.'));
        return;
    }

    if (brugEliksir()) {
        const aarsag = brugerdefineretAarsag ? `${brugerdefineretAarsag} ` : tekst('Du er ved at kollapse. ', 'You are about to collapse. ');
        spilTilstand.logBesked = `${aarsag}${tekst('Livseliksiren redder dig.', 'The life elixir saves you.')}`;
        syncTilDb();
        return; 
    }

    spilTilstand.livspoint = 1; 
    spilTilstand.erBevidstløs = true;
    spilTilstand.nuvaerendeEnergi = 0;

    const mistetGuld = Math.floor(spilTilstand.guldTotal / 2);
    spilTilstand.guldTotal -= mistetGuld;

    const basisKollaps = mistetGuld > 0 
        ? tekst(`Du kollapser. Da du kommer til dig selv, er ${mistetGuld} guld væk.`, `You collapse. When you come to, ${mistetGuld} gold is gone.`)
        : tekst('Du kollapser af udmattelse. Imens rykker tågen frem.', 'You collapse from exhaustion. While you are unconscious, the fog advances.');

    spilTilstand.logBesked = brugerdefineretAarsag ? `${brugerdefineretAarsag} ${basisKollaps}` : basisKollaps;
    
    fremrykTid();

    const gameStateEfterTid: string = spilTilstand.gameState;
    if (gameStateEfterTid === 'dead_map' || gameStateEfterTid === 'dead') {
        spilTilstand.erBevidstløs = false;
        return;
    }

    const kollapsRundeId = spilTilstand.rundeSeed;
    const kollapsSpiller = spilTilstand.spillerNavn;
    setTimeout(() => {
        if (
            spilTilstand.rundeSeed === kollapsRundeId &&
            spilTilstand.spillerNavn === kollapsSpiller &&
            spilTilstand.erBevidstløs &&
            spilTilstand.gameState !== 'dead_map' &&
            spilTilstand.gameState !== 'dead'
        ) {
            spilTilstand.livspoint = 10;
            spilTilstand.erBevidstløs = false;
            spilTilstand.logBesked = mistetGuld > 0 
                ? tekst(`Du vågner med 10 HP. ${mistetGuld} guld er væk, og tågen er rykket frem.`, `You wake with 10 HP. ${mistetGuld} gold is gone, and the fog has advanced.`)
                : tekst('Du vågner med 10 HP. Imens er tågen rykket frem.', 'You wake with 10 HP. In the meantime, the fog has advanced.');
            syncTilDb();
        }
    }, 2000);
}
