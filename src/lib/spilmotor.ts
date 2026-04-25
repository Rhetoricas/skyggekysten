import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { BREDDE, HOEJDE } from './spildata'; 

export function visFlydendeTal(type: string, vaerdi: number) {
    if (vaerdi === 0) return;

    const tekst = vaerdi > 0 ? `+${vaerdi}` : `${vaerdi}`;
    const id = spilTilstand.talId++;
    
    spilTilstand.aktiveTal = [...spilTilstand.aktiveTal, { id, type, tekst }];
}

export function rydFlydendeTal() {
    spilTilstand.aktiveTal = [];
}

// --- KORT OG BEVÆGELSE ---
export function hentNaboIndices(index: number) {
    const r = Math.floor(index / BREDDE);
    const forskudt = r % 2 !== 0;
    const offsets = forskudt 
        ? [-BREDDE, -BREDDE + 1, -1, 1, BREDDE, BREDDE + 1] 
        : [-BREDDE - 1, -BREDDE, -1, 1, BREDDE - 1, BREDDE];
    return offsets.map(o => index + o).filter(i => i >= 0 && i < BREDDE * HOEJDE);
}

export function afslørOmraade(index: number, radius: number) {
    const fundne = [index];
    let nuvaerendeKant = [index];
    for (let r = 0; r < radius; r++) {
        const nyKant: number[] = [];
        for (const i of nuvaerendeKant) {
            hentNaboIndices(i).forEach(n => {
                if (!fundne.includes(n)) { fundne.push(n); nyKant.push(n); }
            });
        }
        nuvaerendeKant = nyKant;
    }
    const nyeFelter = [...spilTilstand.mineKendteFelter];
    fundne.forEach(i => { 
        if (spilTilstand.gitter[i] && !nyeFelter.includes(i)) {
            nyeFelter.push(i);
        }
    });
    spilTilstand.mineKendteFelter = nyeFelter;
}

// --- HANDLINGER ---
export function grav() {
    rydFlydendeTal();
    
    const f = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (spilTilstand.erBevidstløs) return; 
    if (!f || f.gravet || f.eventID || !spilTilstand.valgtKarakter) return;
    
    const energiPris = spilTilstand.valgtKarakter.digCost;
    
    if (spilTilstand.nuvaerendeEnergi < energiPris) {
        spilTilstand.logBesked = "Du er for træt til at grave. Skift dag for at få ny energi.";
        return;
    }

    spilTilstand.nuvaerendeEnergi -= energiPris;
    f.gravet = true;
    
    const harSkovl = spilTilstand.inventory.some(i => i.id === 'skovl');
    
    const k = spilTilstand.spillerIndex % BREDDE;
    const svaerhedsgrad = 1 + (k / BREDDE);
    const roll = Math.random();

    const farligeBiomer = ['bjerg', 'ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
    const isDangerous = farligeBiomer.includes(f.biome);
    const trapChance = isDangerous ? 0.30 * svaerhedsgrad : 0.05 * svaerhedsgrad;

    if (roll > trapChance) {
        if (Math.random() < 0.60) {
            if (harSkovl) {
                const amount = Math.floor((Math.random() * 20) + 10) * spilTilstand.valgtKarakter.goldMod;
                spilTilstand.guldTotal += amount; 
                spilTilstand.logBesked = `Mudderet gemte på ${amount}G. (-${energiPris} Energi)`;
                visFlydendeTal('guld', amount);
            } else {
                spilTilstand.logBesked = `Du river neglene til blods i mudderet. Absolut ingenting. (-${energiPris} Energi)`;
            }
        } else {
            const heal = 15;
            spilTilstand.livspoint += heal;
            spilTilstand.logBesked = `Rod fundet. Heler ${heal} HP. (-${energiPris} Energi)`;
            visFlydendeTal('hp', heal);
        }
    } else {
        spilTilstand.livspoint -= 30;
        spilTilstand.logBesked = `Du ramte en ældgammel fælde. Ekstra -30 HP.`;
        visFlydendeTal('hp', -30);
    }
    
    if (spilTilstand.livspoint <= 0) { 
        syncTilDb(true); 
        return; 
    }

    syncTilDb(true);
}

export function hvil() {
    rydFlydendeTal();
    
    if (spilTilstand.erBevidstløs) return;
    
    const karakter = spilTilstand.valgtKarakter;
    if (!karakter) return;

    if (!karakter.canRest) { 
        spilTilstand.logBesked = "Din stolthed forbyder dig at hvile i fjendeland."; 
        return; 
    }
    if (spilTilstand.guldTotal < 40) { 
        spilTilstand.logBesked = "En sikker lejr koster nu 40 guld."; 
        return; 
    }
    
    spilTilstand.guldTotal -= 40;
    visFlydendeTal('guld', -40);
    
    spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;

    const maxHp = karakter.startHp;

    if (spilTilstand.livspoint >= maxHp) { 
        spilTilstand.logBesked = "Du hviler og genvinder energi, men dit helbred er allerede optimalt (40G tabt)."; 
    } else { 
        const pladsTilHeal = maxHp - spilTilstand.livspoint;
        const faktiskHeal = Math.min(30, pladsTilHeal);
        
        spilTilstand.livspoint += faktiskHeal;
        visFlydendeTal('hp', faktiskHeal);
        spilTilstand.logBesked = `Du slapper af, får fuld energi og heler sår for ${faktiskHeal} HP.`; 
    }

    if (Math.random() < 0.2) { 
        spilTilstand.logBesked = "Overfald i natten!"; 
        spilTilstand.livspoint -= 25; 
        visFlydendeTal('hp', -25);
    }
    syncTilDb();
}