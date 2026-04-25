import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { fremtvingKollaps } from '$lib/overlevelse.svelte';

function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genererUndergrund(biome: string) {
    const farlige = ['ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
    const civ = ['by', 'marked', 'bandit'];

    const feltData = { kanGraves: true, skjultGuld: 0, skjultLiv: 0, skjultFaelde: false };

    if (civ.includes(biome) || biome === 'hav') {
        feltData.kanGraves = false;
        return feltData;
    }

    const roll = Math.random() * 100;

    if (biome === 'mark' || biome === 'eng') {
        if (roll < 20) feltData.skjultGuld = rand(10, 30);
        else if (roll < 35) feltData.skjultLiv = rand(15, 25);
        else if (roll < 40) feltData.skjultFaelde = true;
    } else if (biome === 'skov') {
        if (roll < 20) feltData.skjultGuld = rand(10, 30);
        else if (roll < 55) feltData.skjultLiv = rand(30, 50);
        else if (roll < 60) feltData.skjultFaelde = true;
    } else if (biome === 'bjerg') {
        if (roll < 50) feltData.skjultGuld = rand(30, 60);
        else if (roll < 55) feltData.skjultLiv = rand(10, 20);
        else if (roll < 70) feltData.skjultFaelde = true;
    } else if (farlige.includes(biome)) {
        if (roll < 45) feltData.skjultGuld = rand(50, 100);
        else if (roll < 55) feltData.skjultLiv = rand(20, 40);
        else if (roll < 90) feltData.skjultFaelde = true;
    }

    return feltData;
}

let senesteGravning = 0; // Vores tidslås

export function grav() {
    // Blokerer for dobbelt-klik (500 millisekunder)
    const nu = Date.now();
    if (nu - senesteGravning < 500) return;
    senesteGravning = nu;

    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const f = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!f || f.gravet || f.eventID) return;
    
    if (!f.kanGraves) {
        spilTilstand.logBesked = "Du kan ikke grave her.";
        return;
    }

    const harSkovl = spilTilstand.inventory.some(i => i.id === 'skovl');
    const energiPris = spilTilstand.valgtKarakter.digCost || 3;

    if (harSkovl) {
        spilTilstand.nuvaerendeEnergi -= energiPris;
    } else {
        spilTilstand.livspoint -= 15;
        spilTilstand.logBesked = "Du flænser jorden med de bare næver. (-15 HP)";
    }

    // Marker feltet og gem værdierne
    f.gravet = true;
    const guldVaerdi = f.skjultGuld ?? 0;
    const livVaerdi = f.skjultLiv ?? 0;

    // Tøm mudderet øjeblikkeligt, så exploit er umuligt
    f.skjultGuld = 0;
    f.skjultLiv = 0;

    if (f.skjultFaelde) {
        if (spilTilstand.livspoint <= 20) {
            spilTilstand.logBesked = "KLIK! En rusten klinge flænger dit ben. Smerten er for overvældende, og alt går i sort...";
            f.skjultFaelde = false; 
            fremtvingKollaps();
            return; 
        }

        spilTilstand.livspoint -= 20;
        spilTilstand.logBesked = "KLIK! En rusten klinge bider sig fast i dit ben. (-20 HP)";
        f.skjultFaelde = false; 
        
    } else if (guldVaerdi > 0) {
        const amount = Math.floor(guldVaerdi * spilTilstand.valgtKarakter.goldMod);
        spilTilstand.guldTotal += amount;
        spilTilstand.logBesked = `Mudderet gemte på ${amount} Guld!`;
        
    } else if (livVaerdi > 0) {
        spilTilstand.livspoint += livVaerdi;
        spilTilstand.logBesked = `Du graver en saftig rod frem og spiser den. (+${livVaerdi} HP)`;
        
    } else {
        if (harSkovl) spilTilstand.logBesked = "Kun sten og orme.";
    }

    // Maskinen opdaterer selv brættet nu!
    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(true);
}