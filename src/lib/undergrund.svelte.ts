import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb, broadcastFelt, syncKortTilDbSenere } from './netvaerk';
import { fremtvingKollaps, fremrykTid, udloesBersaerkHvisRelevant } from '$lib/overlevelse.svelte';
import { afslørOmraade, tilfoejTilRygsæk } from '$lib/spilmotor';
import { startEvent } from '$lib/eventMotor.svelte';
import type { Biome } from './types';

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
    const farlige = ['ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
    const civilisation = ['by', 'marked'];

    const feltData: { kanGraves: boolean; skjultGuld: number; skjultLiv: number; skjultFaelde: boolean; skjultLoot: string | null } = { 
        kanGraves: true, 
        skjultGuld: 0, 
        skjultLiv: 0, 
        skjultFaelde: false,
        skjultLoot: null
    };

    if (civilisation.includes(biome) || biome === 'hav' || biome === 'soe') {
        feltData.kanGraves = false;
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
        spilTilstand.logBesked = "Du kan ikke grave her.";
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
    spilTilstand.nuvaerendeEnergi -= faktiskEnergiPris;

    if (!harSkovl) {
        const skade = spilTilstand.beregnSkade(4);
        spilTilstand.livspoint -= skade;
        udstyrsLog = ` Du graver uden skovl. Du mister ${skade} HP og ${faktiskEnergiPris} Energi.${udloesBersaerkHvisRelevant(skade)}`;
    }

    const guldVaerdi = felt.skjultGuld ?? 0;
    const livVaerdi = felt.skjultLiv ?? 0;
    const faelde = felt.skjultFaelde;
    const fundetLoot = felt.skjultLoot;

    felt.skjultGuld = 0;
    felt.skjultLiv = 0;
    felt.skjultFaelde = false;
    felt.skjultLoot = null;
    
    if (felt.biome === 'mark') {
        felt.afgroede = undefined;
        felt.smadretFremTilBlok = undefined;
        felt.hoestetFremTilBlok = undefined;
    }
    
    afslørOmraade(spilTilstand.spillerIndex, 1);    

    let fundLog = "Du finder ikke noget brugbart.";

    if (faelde && harMesterskovl) {
        fundLog = "Mesterskovlen finder fælden, før den klapper. Du får den gravet fri uden skade. (-0 HP)";
    } else if (faelde && ridderPanserStopperNedgravetFaelde()) {
        fundLog = "KLIK. Den nedgravede fælde klapper om dit panser, men ridderens træning holder benet fri. (-0 HP)";
    } else if (faelde) {
        const faeldeSkade = spilTilstand.beregnSkade(10);
        spilTilstand.livspoint -= faeldeSkade;
        fundLog = `KLIK. En nedgravet fælde bider sig fast i dit ben (-${faeldeSkade} HP)${udloesBersaerkHvisRelevant(faeldeSkade)}`;
    } else if (fundetLoot === 'skattekiste') {
        spilTilstand.guldTotal += 600;
        tilfoejTilRygsæk('diamant', 1);
        felt.tomSkattekiste = true;
        fundLog = `Skovlen rammer træ. Du åbner en kiste. (+600 Guld, +Diamant)`;
    } else if (guldVaerdi > 0) {
        const graveGuldMultiplier = harMesterskovl && harGyldenDestillator ? 3 : (harMesterskovl || harGyldenDestillator) ? 2 : 1;
        const malmviserMultiplier = harMalmviser ? 1.25 : 1;
        let maengde = Math.floor(guldVaerdi * graveGuldMultiplier * malmviserMultiplier);
        maengde = spilTilstand.beregnGuldIndkomst(maengde);
        const foerGuld = spilTilstand.guldTotal;
        spilTilstand.guldTotal += maengde;
        const faktiskGuld = spilTilstand.guldTotal - foerGuld;
        fundLog = harMalmviser
            ? `Malmviseren synger, mens du graver åren fri. Jorden gemte på ${faktiskGuld} Guld.`
            : harMesterskovl && harGyldenDestillator
            ? `Mesterskovlen og den gyldne destillator presser åren ren. Jorden gemte på ${faktiskGuld} Guld.`
            : harMesterskovl
                ? `Mesterskovlen åbner åren rent. Jorden gemte på ${faktiskGuld} Guld.`
                : harGyldenDestillator
                    ? `Den gyldne destillator trækker ekstra glans ud af jorden. Du finder ${faktiskGuld} Guld.`
                    : `Jorden gemte på ${faktiskGuld} Guld.`;
    } else if (livVaerdi > 0) {
        const aktuelHp = spilTilstand.livspoint;
        spilTilstand.livspoint += harRodhjertet ? livVaerdi * 2 : livVaerdi; 
        const faktiskHeling = spilTilstand.livspoint - aktuelHp;
        
        if (faktiskHeling > 0) {
            fundLog = `Du finder en spiselig rod. Du heler ${faktiskHeling} HP.`;
        } else {
            fundLog = `Du finder en rod, men du har ikke brug for mere liv lige nu.`;
        }
    } else if (fundetLoot) {
        tilfoejTilRygsæk(fundetLoot, 1);
        fundLog = `Du graver en ${fundetLoot} frem.`;
    }

    spilTilstand.logBesked = fundLog + udstyrsLog;
    broadcastFelt(spilTilstand.spillerIndex, felt);
    syncTilDb();
    syncKortTilDbSenere();

    if (spilTilstand.livspoint <= 0) {
        spilTilstand.livspoint = 1; 
        spilTilstand.logBesked += " Du kollapser.";
        fremtvingKollaps();
    } else {
        fremrykTid();
    }

    setTimeout(() => {
        graverNu = false;
    }, 1000);
}
