import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { fremtvingKollaps, fremrykTid } from '$lib/overlevelse.svelte';
import { afslørOmraade, tilfoejTilRygsæk, tjekUdstyrSlid } from '$lib/spilmotor';
import type { Biome } from './types';

function tilfaeldigtTal(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genererUndergrund(biome: Biome | string) {
    const farlige = ['ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
    const civilisation = ['by', 'marked', 'bandit'];

    const feltData: { kanGraves: boolean; skjultGuld: number; skjultLiv: number; skjultFaelde: boolean; skjultLoot: string | null } = { 
        kanGraves: true, 
        skjultGuld: 0, 
        skjultLiv: 0, 
        skjultFaelde: false,
        skjultLoot: null
    };

    if (civilisation.includes(biome) || biome === 'hav') {
        feltData.kanGraves = false;
        return feltData;
    }

    const terningKast = Math.random() * 100;

    if (biome === 'mark' || biome === 'eng') {
        if (terningKast < 20) feltData.skjultGuld = tilfaeldigtTal(5, 15);
        else if (terningKast < 35) feltData.skjultLiv = tilfaeldigtTal(10, 20);
        else if (terningKast < 40) feltData.skjultFaelde = true;
        else if (terningKast < 42) feltData.skjultLoot = 'fakkel';
    } else if (biome === 'skov') {
        if (terningKast < 20) feltData.skjultGuld = tilfaeldigtTal(5, 15);
        else if (terningKast < 55) feltData.skjultLiv = tilfaeldigtTal(20, 40);
        else if (terningKast < 60) feltData.skjultFaelde = true;
        else if (terningKast < 63) feltData.skjultLoot = 'livseliksir';
    } else if (biome === 'bjerg') {
        if (terningKast < 50) feltData.skjultGuld = tilfaeldigtTal(15, 30);
        else if (terningKast < 55) feltData.skjultLiv = tilfaeldigtTal(5, 10);
        else if (terningKast < 70) feltData.skjultFaelde = true;
        else if (terningKast < 74) feltData.skjultLoot = 'fakkel';
    } else if (farlige.includes(biome)) {
        if (terningKast < 45) feltData.skjultGuld = tilfaeldigtTal(25, 50);
        else if (terningKast < 55) feltData.skjultLiv = tilfaeldigtTal(10, 20);
        else if (terningKast < 90) feltData.skjultFaelde = true;
        else if (terningKast < 95) feltData.skjultLoot = 'livseliksir';
    }

    return feltData;
}

let graverNu = false; 

export function grav() {
    if (graverNu) return; 

    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!felt || felt.gravet) return;
    
    if (!felt.kanGraves) {
        spilTilstand.logBesked = "Du kan ikke grave her.";
        return;
    }

    graverNu = true;

    felt.gravet = true;
    spilTilstand.gitter[spilTilstand.spillerIndex] = felt;
    spilTilstand.gitter = [...spilTilstand.gitter];

    const baseGravePris = spilTilstand.valgtKarakter.digCost || 3;
    const skovlItem = spilTilstand.mitUdstyr.find((i) => i.id === 'skovl');
    const harSkovl = !!skovlItem && skovlItem.maengde > 0;
    
    let udstyrsLog: string; 

    const faktiskEnergiPris = harSkovl ? baseGravePris : baseGravePris * 2;
    spilTilstand.nuvaerendeEnergi -= faktiskEnergiPris;

    if (harSkovl) {
        udstyrsLog = tjekUdstyrSlid('skovl');
    } else {
        const skade = spilTilstand.beregnSkade(10);
        spilTilstand.livspoint -= skade;
        udstyrsLog = ` Du graver i jorden med bare næver. Du mister ${skade} HP og ${faktiskEnergiPris} Energi.`;
    }

    const guldVaerdi = felt.skjultGuld ?? 0;
    const livVaerdi = felt.skjultLiv ?? 0;
    const faelde = felt.skjultFaelde;
    const fundetLoot = felt.skjultLoot;

    felt.skjultGuld = 0;
    felt.skjultLiv = 0;
    felt.skjultFaelde = false;
    felt.skjultLoot = null;
    
    afslørOmraade(spilTilstand.spillerIndex, 1);    

    let fundLog = "Du finder kun sten og orme.";

    if (faelde) {
        const faeldeSkade = spilTilstand.beregnSkade(10);
        spilTilstand.livspoint -= faeldeSkade;
        fundLog = `KLIK. En nedgravet fælde bider sig fast i dit ben (-${faeldeSkade} HP)`;
    } else if (guldVaerdi > 0) {
        let maengde = Math.floor(guldVaerdi * spilTilstand.valgtKarakter.goldMod);
        maengde = spilTilstand.beregnGuldIndkomst(maengde);
        const foerGuld = spilTilstand.guldTotal;
        spilTilstand.guldTotal += maengde;
        const faktiskGuld = spilTilstand.guldTotal - foerGuld;
        fundLog = `Mudderet gemte på ${faktiskGuld} Guld.`;
    } else if (livVaerdi > 0) {
        const aktuelHp = spilTilstand.livspoint;
        spilTilstand.livspoint += livVaerdi; 
        const faktiskHeling = spilTilstand.livspoint - aktuelHp;
        
        if (faktiskHeling > 0) {
            fundLog = `Du graver en saftig rod frem og spiser den. Du heler ${faktiskHeling} HP.`;
        } else {
            fundLog = `Du graver en rod frem, men du er allerede mæt. Helbredet forbliver intakt.`;
        }
    } else if (fundetLoot) {
        tilfoejTilRygsæk(fundetLoot, 1);
        fundLog = `Spadens blad rammer noget klangfuldt. Du har gravet en ${fundetLoot} frem.`;
    }

    spilTilstand.logBesked = fundLog + udstyrsLog;

    syncTilDb(true);

    if (spilTilstand.livspoint <= 0) {
        spilTilstand.livspoint = 1; 
        spilTilstand.logBesked += " Smerten er for overvældende. Alt går i sort.";
        fremtvingKollaps();
    } else {
        fremrykTid();
    }

    setTimeout(() => {
        graverNu = false;
    }, 1000);
}