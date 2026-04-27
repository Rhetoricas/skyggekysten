import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { fremtvingKollaps, fremrykTid } from '$lib/overlevelse.svelte';
import { afslørOmraade, tilfoejTilRygsæk } from '$lib/spilmotor';

function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genererUndergrund(biome: string) {
    const farlige = ['ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
    const civ = ['by', 'marked', 'bandit'];

    const feltData: { kanGraves: boolean; skjultGuld: number; skjultLiv: number; skjultFaelde: boolean; skjultLoot: string | null } = { 
        kanGraves: true, 
        skjultGuld: 0, 
        skjultLiv: 0, 
        skjultFaelde: false,
        skjultLoot: null
    };

    if (civ.includes(biome) || biome === 'hav') {
        feltData.kanGraves = false;
        return feltData;
    }

    const roll = Math.random() * 100;

    if (biome === 'mark' || biome === 'eng') {
        if (roll < 20) feltData.skjultGuld = rand(10, 30);
        else if (roll < 35) feltData.skjultLiv = rand(10, 20);
        else if (roll < 40) feltData.skjultFaelde = true;
        else if (roll < 42) feltData.skjultLoot = 'fakkel';
    } else if (biome === 'skov') {
        if (roll < 20) feltData.skjultGuld = rand(10, 30);
        else if (roll < 55) feltData.skjultLiv = rand(20, 40);
        else if (roll < 60) feltData.skjultFaelde = true;
        else if (roll < 63) feltData.skjultLoot = 'eliksir';
    } else if (biome === 'bjerg') {
        if (roll < 50) feltData.skjultGuld = rand(30, 60);
        else if (roll < 55) feltData.skjultLiv = rand(5, 10);
        else if (roll < 70) feltData.skjultFaelde = true;
        else if (roll < 74) feltData.skjultLoot = 'fakkel';
    } else if (farlige.includes(biome)) {
        if (roll < 45) feltData.skjultGuld = rand(60, 100);
        else if (roll < 55) feltData.skjultLiv = rand(10, 20);
        else if (roll < 90) feltData.skjultFaelde = true;
        else if (roll < 95) feltData.skjultLoot = 'eliksir';
    }

    return feltData;
}

let graverNu = false; 

export function grav() {
    if (graverNu) return; 

    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const f = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!f || f.gravet || f.eventID) return;
    
    if (!f.kanGraves) {
        spilTilstand.logBesked = "Du kan ikke grave her.";
        return;
    }

    graverNu = true;

    const baseGravePris = spilTilstand.valgtKarakter.digCost || 3;
    const skovlIndex = spilTilstand.inventory.findIndex(i => i.id === 'skovl');
    const harSkovl = skovlIndex !== -1;
    
    let udstyrsLog = ""; 

    const faktiskEnergiPris = harSkovl ? baseGravePris : baseGravePris * 2;
    spilTilstand.nuvaerendeEnergi -= faktiskEnergiPris;

    if (harSkovl) {
        const skovl = spilTilstand.inventory[skovlIndex];
        skovl.brugCount = (skovl.brugCount || 0) + 1;

        if (skovl.brugCount > 5 && Math.random() < 0.25) {
            spilTilstand.inventory.splice(skovlIndex, 1);
            spilTilstand.inventory = [...spilTilstand.inventory]; 
            udstyrsLog = " KNAK! Din skovl splintredes mod undergrunden.";
        }
    } else {
        spilTilstand.livspoint -= 10;
        udstyrsLog = ` Du flænser jorden med bare næver (-10 HP, -${faktiskEnergiPris} Energi).`;
    }

    const guldVaerdi = f.skjultGuld ?? 0;
    const livVaerdi = f.skjultLiv ?? 0;
    const faelde = f.skjultFaelde;
    const fundetLoot = f.skjultLoot;

    f.gravet = true;
    f.skjultGuld = 0;
    f.skjultLiv = 0;
    f.skjultFaelde = false;
    f.skjultLoot = null;
    afslørOmraade(spilTilstand.spillerIndex, 1);    

    spilTilstand.gitter[spilTilstand.spillerIndex] = f;
    spilTilstand.gitter = [...spilTilstand.gitter];

    let fundLog = "Kun sten og orme.";

    if (faelde) {
        spilTilstand.livspoint -= 20;
        fundLog = "KLIK! En rusten klinge bider sig fast (-20 HP).";
    } else if (guldVaerdi > 0) {
        const amount = Math.floor(guldVaerdi * spilTilstand.valgtKarakter.goldMod);
        spilTilstand.guldTotal += amount;
        fundLog = `Mudderet gemte på ${amount} Guld!`;
    } else if (livVaerdi > 0) {
        spilTilstand.livspoint += livVaerdi;
        fundLog = `Du graver en saftig rod frem og spiser den (+${livVaerdi} HP).`;
    } else if (fundetLoot) {
        tilfoejTilRygsæk(fundetLoot, 1);
        fundLog = `Spadens blad rammer noget klangfuldt. Du har gravet en ${fundetLoot} frem!`;
    }

    spilTilstand.logBesked = fundLog + udstyrsLog;

    syncTilDb(true);

    if (spilTilstand.livspoint <= 0) {
        spilTilstand.livspoint = 1; 
        spilTilstand.logBesked += " Smerten er for overvældende. Alt går i sort...";
        fremtvingKollaps();
    } else {
        fremrykTid();
    }

    setTimeout(() => {
        graverNu = false;
    }, 1000);
}