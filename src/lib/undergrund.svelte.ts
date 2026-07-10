import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb, broadcastFelt, syncKortTilDbSenere } from './netvaerk';
import { fremtvingKollaps, fremrykTid, udloesBersaerkHvisRelevant } from '$lib/overlevelse.svelte';
import { brugEnergi } from '$lib/energi';
import { afslørOmraade, tilfoejTilRygsæk } from '$lib/spilmotor';
import { startEvent } from '$lib/eventMotor.svelte';
import { registrerHeling } from '$lib/trofaeer';
import { markerTutorialHandling } from '$lib/tutorial.svelte';
import { kanGravesIBiome } from '$lib/graveRegler';
import type { Biome } from './types';
import { tekst } from './i18n.svelte';
import { itemNavn } from './spilTekst';

function tilfaeldigtTal(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ridderPanserStopperNedgravetFaelde() {
    const karakterId = spilTilstand.valgtKarakter?.id;
    const erRidder = karakterId === 'knight_m' || karakterId === 'knight_f';
    const harRustning = spilTilstand.mitUdstyr?.some((ting) => (ting.id === 'rustning' || ting.id === 'kongepanser' || ting.id === 'rustning_elver') && ting.maengde > 0);
    return erRidder && harRustning;
}

export function genererUndergrund(biome: Biome | string) {
    const farlige = ['ruin', 'blodskov', 'hule', 'slagmark', 'ritual'];

    const feltData: { kanGraves: boolean; skjultGuld: number; skjultLiv: number; skjultFaelde: boolean; skjultLoot: string | null } = { 
        kanGraves: kanGravesIBiome(biome),
        skjultGuld: 0, 
        skjultLiv: 0, 
        skjultFaelde: false,
        skjultLoot: null
    };

    if (!feltData.kanGraves) {
        return feltData;
    }

    const terningKast = Math.random() * 100;

    if (biome === 'bandit') {
        if (terningKast < 50) {
            feltData.skjultGuld = tilfaeldigtTal(50, 100); 
        } else if (terningKast < 75) {
            feltData.skjultFaelde = true; 
        }
    } else if (biome === 'mark' || biome === 'eng') {
        if (terningKast < 20) feltData.skjultGuld = tilfaeldigtTal(10, 20);
        else if (terningKast < 35) feltData.skjultLiv = tilfaeldigtTal(10, 20);
        else if (terningKast < 38) feltData.skjultFaelde = true;
        else if (terningKast < 42) feltData.skjultLoot = 'fakkel';
    } else if (biome === 'skov') {
        if (terningKast < 20) feltData.skjultGuld = tilfaeldigtTal(10, 15);
        else if (terningKast < 55) feltData.skjultLiv = tilfaeldigtTal(20, 40);
        else if (terningKast < 58) feltData.skjultFaelde = true;
        else if (terningKast < 62) feltData.skjultLoot = 'livseliksir';
    } else if (biome === 'bjerg') {
        if (terningKast < 50) feltData.skjultGuld = tilfaeldigtTal(15, 40);
        else if (terningKast < 55) feltData.skjultLiv = tilfaeldigtTal(5, 10);
        else if (terningKast < 63) feltData.skjultFaelde = true;
        else if (terningKast < 74) feltData.skjultLoot = 'fakkel';
    } else if (biome === 'hoejland') {
        if (terningKast < 30) feltData.skjultGuld = tilfaeldigtTal(15, 30);
        else if (terningKast < 45) feltData.skjultLiv = tilfaeldigtTal(10, 20);
        else if (terningKast < 50) feltData.skjultFaelde = true;
        else if (terningKast < 58) feltData.skjultLoot = 'fakkel';
    } else if (biome === 'krystal') {
        if (terningKast < 40) feltData.skjultGuld = tilfaeldigtTal(5, 10);
        else if (terningKast < 60) feltData.skjultFaelde = true;
        else if (terningKast < 78) feltData.skjultLoot = 'diamant';
    } else if (farlige.includes(biome)) {
        if (terningKast < 45) feltData.skjultGuld = tilfaeldigtTal(25, 50);
        else if (terningKast < 55) feltData.skjultLiv = tilfaeldigtTal(10, 20);
        else if (terningKast < 73) feltData.skjultFaelde = true;
        else if (terningKast < 81) feltData.skjultLoot = 'livseliksir';
    }

    return feltData;
}

let graverNu = false; 

export function grav() {
    if (graverNu) return; 

    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!felt || felt.gravet) return;

    if (felt.eventID === 'meteor_skat' && !felt.eventFuldført) {
        startEvent('meteor_skat');
        return;
    }
    
    if (!felt.kanGraves) {
        spilTilstand.logBesked = tekst('Du kan ikke grave i dette terræn.', 'You cannot dig in this terrain.');
        return;
    }

    graverNu = true;
    felt.gravet = true;
    spilTilstand.gitter[spilTilstand.spillerIndex] = felt;
    
    // NYT: Skyd ændringen ud på lyn-kanalen omgående for at spærre feltet for andre
    broadcastFelt(spilTilstand.spillerIndex, felt);
    
    spilTilstand.gitter = [...spilTilstand.gitter];

    const baseGravePris = spilTilstand.valgtKarakter.digCost || 3;
    const skovlItem = spilTilstand.mitUdstyr.find((i) => i.id === 'skovl' || i.id === 'mesterskovl');
    const harMesterskovl = skovlItem?.id === 'mesterskovl' && skovlItem.maengde > 0;
    const harSkovl = !!skovlItem && skovlItem.maengde > 0;
    const harGyldenDestillator = spilTilstand.mitUdstyr.some((i) => i.id === 'gylden_destillator' && i.maengde > 0);
    const harMalmviser = spilTilstand.mitUdstyr.some((i) => i.id === 'malmviser' && i.maengde > 0);
    const harRodhjertet = spilTilstand.mitUdstyr.some((i) => i.id === 'rodhjertet' && i.maengde > 0);
    
    let udstyrsLog = ""; 

    const faktiskEnergiPris = harSkovl ? baseGravePris : baseGravePris + 4;
    const energiBetaling = brugEnergi(faktiskEnergiPris);
    const energiTekst = energiBetaling.gratis ? tekst('Bersærkergangen dækker energiforbruget.', 'Your berserk rage covers the energy cost.') : tekst(`Du bruger ${faktiskEnergiPris} energi.`, `You use ${faktiskEnergiPris} energy.`);

    if (!harSkovl) {
        const skade = spilTilstand.beregnSkade(4);
        spilTilstand.livspoint -= skade;
        udstyrsLog = tekst(
            ` Du graver med hænderne og mister ${skade} HP. ${energiTekst}${udloesBersaerkHvisRelevant(skade)}`,
            ` You dig with your hands and lose ${skade} HP. ${energiTekst}${udloesBersaerkHvisRelevant(skade)}`
        );
    } else if (energiBetaling.gratis) {
        udstyrsLog = tekst(' Bersærkergangen dækker energiforbruget.', ' Your berserk rage covers the energy cost.');
    }

    const guldVaerdi = felt.skjultGuld ?? 0;
    const livVaerdi = felt.skjultLiv ?? 0;
    const faelde = felt.skjultFaelde;
    const fundetLoot = felt.skjultLoot;
    const jordskredsSkatSpor = !!felt.jordskredsSkatSpor;

    felt.skjultGuld = 0;
    felt.skjultLiv = 0;
    felt.skjultFaelde = false;
    felt.skjultLoot = null;
    felt.jordskredsSkatSpor = false;
    
    if (felt.biome === 'mark') {
        felt.afgroede = undefined;
        felt.smadretFremTilBlok = undefined;
        felt.hoestetFremTilBlok = undefined;
    }
    
    afslørOmraade(spilTilstand.spillerIndex, 1);    

    let fundLog = tekst('Du graver feltet igennem, men finder intet brugbart.', 'You search the ground but find nothing useful.');

    if (faelde && jordskredsSkatSpor && ridderPanserStopperNedgravetFaelde()) {
        fundLog = tekst(
            'Du graver under krydset, og klippen styrter sammen. Panseret tager slaget, og din riddertræning holder benene fri.',
            'You dig beneath the mark, and the rock collapses. Your armor takes the blow, and your knight training keeps your legs clear.'
        );
    } else if (faelde && jordskredsSkatSpor) {
        const faeldeSkade = spilTilstand.beregnSkade(8);
        spilTilstand.livspoint -= faeldeSkade;
        fundLog = tekst(
            `Du graver under krydset, men klippen er stadig løs efter jordskælvet. Den styrter sammen om dine ben (-${faeldeSkade} HP)${udloesBersaerkHvisRelevant(faeldeSkade)}`,
            `You dig beneath the mark, but the rock is still loose after the earthquake. It collapses around your legs (-${faeldeSkade} HP)${udloesBersaerkHvisRelevant(faeldeSkade)}`
        );
    } else if (faelde && harMesterskovl) {
        fundLog = tekst('Mesterskovlen rammer fælden, før den klapper. Du graver den fri uden at komme til skade.', 'The master shovel strikes the trap before it snaps. You dig it free without getting hurt.');
    } else if (faelde && ridderPanserStopperNedgravetFaelde()) {
        fundLog = tekst('Klik. Den nedgravede fælde klapper om dit panser, men din riddertræning holder benet fri.', 'Click. The buried trap snaps around your armor, but your knight training keeps your leg clear.');
    } else if (faelde) {
        const faeldeSkade = spilTilstand.beregnSkade(10);
        spilTilstand.livspoint -= faeldeSkade;
        fundLog = tekst(
            `Klik. En nedgravet fælde klapper om dit ben (-${faeldeSkade} HP)${udloesBersaerkHvisRelevant(faeldeSkade)}`,
            `Click. A buried trap snaps around your leg (-${faeldeSkade} HP)${udloesBersaerkHvisRelevant(faeldeSkade)}`
        );
    } else if (fundetLoot === 'skattekiste') {
        spilTilstand.guldTotal += 600;
        const unikDiamantVaerdi = tilfaeldigtTal(600, 800);
        tilfoejTilRygsæk('diamant', 1, [unikDiamantVaerdi]);
        felt.tomSkattekiste = true;
        fundLog = tekst(
            `Skovlen rammer træ. Under jorden ligger en kiste med 600 guld og en unik diamant med en værdi på ${unikDiamantVaerdi} guld.`,
            `The shovel strikes wood. Buried below is a chest with 600 gold and a unique diamond worth ${unikDiamantVaerdi} gold.`
        );
    } else if (guldVaerdi > 0) {
        const graveGuldMultiplier = harMesterskovl && harGyldenDestillator ? 3 : (harMesterskovl || harGyldenDestillator) ? 2 : 1;
        const malmviserMultiplier = harMalmviser ? 1.25 : 1;
        let maengde = Math.floor(guldVaerdi * graveGuldMultiplier * malmviserMultiplier);
        maengde = spilTilstand.beregnGuldIndkomst(maengde);
        const foerGuld = spilTilstand.guldTotal;
        spilTilstand.guldTotal += maengde;
        const faktiskGuld = spilTilstand.guldTotal - foerGuld;
        fundLog = harMalmviser
            ? tekst(`Malmviseren slår ud, mens du graver åren fri. Du finder ${faktiskGuld} guld.`, `The ore finder reacts as you uncover the vein. You find ${faktiskGuld} gold.`)
            : harMesterskovl && harGyldenDestillator
            ? tekst(`Mesterskovlen og den gyldne destillator får alt ud af åren. Du finder ${faktiskGuld} guld.`, `The master shovel and golden distiller extract everything from the vein. You find ${faktiskGuld} gold.`)
            : harMesterskovl
                ? tekst(`Mesterskovlen åbner åren uden spild. Du finder ${faktiskGuld} guld.`, `The master shovel opens the vein without waste. You find ${faktiskGuld} gold.`)
                : harGyldenDestillator
                    ? tekst(`Den gyldne destillator trækker mere guld ud af jorden. Du finder ${faktiskGuld} guld.`, `The golden distiller draws more gold from the ground. You find ${faktiskGuld} gold.`)
                    : tekst(`Du finder ${faktiskGuld} guld i jorden.`, `You find ${faktiskGuld} gold in the ground.`);
    } else if (livVaerdi > 0) {
        const aktuelHp = spilTilstand.livspoint;
        spilTilstand.livspoint += harRodhjertet ? livVaerdi * 2 : livVaerdi; 
        const faktiskHeling = spilTilstand.livspoint - aktuelHp;
        registrerHeling(aktuelHp, spilTilstand.livspoint);
        
        if (faktiskHeling > 0) {
            fundLog = tekst(`Du finder en spiselig rod og genvinder ${faktiskHeling} HP.`, `You find an edible root and recover ${faktiskHeling} HP.`);
        } else {
            fundLog = tekst('Du finder en spiselig rod, men har allerede fuldt liv.', 'You find an edible root, but you are already at full health.');
        }
    } else if (fundetLoot) {
        const itemFund = tilfoejTilRygsæk(fundetLoot, 1);
        fundLog = fundetLoot === 'diamant'
            ? tekst(`Du graver en ${itemFund?.diamantBeskrivelse || 'diamant'} frem.`, `You dig up a ${itemFund?.diamantBeskrivelse || 'diamond'}.`)
            : tekst(`Du graver en ${itemNavn(fundetLoot)} frem.`, `You dig up ${itemNavn(fundetLoot)}.`);
    }

    spilTilstand.logBesked = fundLog + udstyrsLog;
    markerTutorialHandling('dig');
    broadcastFelt(spilTilstand.spillerIndex, felt);
    syncTilDb();
    syncKortTilDbSenere();

    if (spilTilstand.livspoint <= 0) {
        spilTilstand.livspoint = 1; 
        spilTilstand.logBesked += tekst(' Kræfterne slipper op, og du kollapser.', ' Your strength runs out, and you collapse.');
        fremtvingKollaps();
    } else {
        fremrykTid();
    }

    setTimeout(() => {
        graverNu = false;
    }, 1000);
}
