import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb } from '$lib/netvaerk';
import { BREDDE, HOEJDE, biomeVægte, itemDB } from '$lib/spildata'; 
import { supabase } from '$lib/supabaseClient';
import { eventBibliotek } from '$lib/eventBibliotek';
import { genererUndergrund } from '$lib/undergrund.svelte';
import type { Felt } from '$lib/types';

// ==========================================
// NY RADAR & GEOMETRI
// ==========================================

// Gitter-matematik for Odd-R
const OFFSETS = {
    'NE': [[0, -1], [1, -1]],
    'E':  [[1, 0],  [1, 0]],
    'SE': [[0, 1],  [1, 1]],
    'SW': [[-1, 1], [0, 1]],
    'W':  [[-1, 0], [-1, 0]],
    'NW': [[-1, -1], [0, -1]]
};

export function hentNaboIRetning(index: number, retning: string, bredde: number, maxFelter: number): number | null {
    const r = Math.floor(index / bredde);
    const k = index % bredde;
    const isOdd = r % 2 !== 0 ? 1 : 0;
    
    const offset = OFFSETS[retning as keyof typeof OFFSETS];
    if (!offset) return null;

    const dx = offset[isOdd][0];
    const dy = offset[isOdd][1];

    const nyK = k + dx;
    const nyR = r + dy;

    if (nyK < 0 || nyK >= bredde || nyR < 0 || nyR >= (maxFelter / bredde)) return null;
    
    const nytIndex = nyR * bredde + nyK;
    return nytIndex;
}

export function regnHexAfstand(index1: number, index2: number, bredde: number): number {
    if (index1 === index2) return 0;

    const r1 = Math.floor(index1 / bredde);
    const k1 = index1 % bredde;
    const r2 = Math.floor(index2 / bredde);
    const k2 = index2 % bredde;

    const offset1 = Math.floor(r1 / 2);
    const offset2 = Math.floor(r2 / 2);

    const cube_x1 = k1 - offset1;
    const cube_x2 = k2 - offset2;
    const cube_z1 = r1;
    const cube_z2 = r2;
    const cube_y1 = -cube_x1 - cube_z1;
    const cube_y2 = -cube_x2 - cube_z2;

    return Math.max(
        Math.abs(cube_x1 - cube_x2),
        Math.abs(cube_y1 - cube_y2),
        Math.abs(cube_z1 - cube_z2)
    );
}

// ==========================================
// EKSISTERENDE SPILMOTOR LOGIK
// ==========================================

export async function sendAnonymAlarm() {
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode) return;

    const message = {
        type: 'anonym_alarm',
        senderNavn: spilTilstand.spillerNavn 
    };

    await supabase.channel(spilTilstand.rumKode).send({
        type: 'broadcast',
        event: 'alarm',
        payload: message
    });
}

export function hentNaboIndices(index: number) {
    const r = Math.floor(index / BREDDE);
    const forskudt = r % 2 !== 0;
    const offsets = forskudt 
        ? [-BREDDE, -BREDDE + 1, -1, 1, BREDDE, BREDDE + 1] 
        : [-BREDDE - 1, -BREDDE, -1, 1, BREDDE - 1, BREDDE];
    return offsets.map(o => index + o).filter(i => i >= 0 && i < BREDDE * HOEJDE);
}

export function tilfoejTilRygsæk(genstandId: string, tilfoejetMaengde: number = 1) {
    const eksisterendeTing = spilTilstand.mitUdstyr.find(ting => ting.id === genstandId);

    if (eksisterendeTing) {
        eksisterendeTing.maengde += tilfoejetMaengde;
    } else {
        spilTilstand.mitUdstyr.push({
            id: genstandId,
            maengde: tilfoejetMaengde
        });
    }
    
    // Magien der vækker Svelte: Vi overskriver arrayet med sig selv
    spilTilstand.mitUdstyr = [...spilTilstand.mitUdstyr];
    
    syncTilDb();
}

export function brugFraRygsæk(genstandId: string, brugtMaengde: number = 1) {
    const index = spilTilstand.mitUdstyr.findIndex(ting => ting.id === genstandId);
    
    if (index === -1) return;

    spilTilstand.mitUdstyr[index].maengde -= brugtMaengde;

    if (spilTilstand.mitUdstyr[index].maengde <= 0) {
        spilTilstand.mitUdstyr.splice(index, 1);
    }
    
    // Igen: Væk Svelte ved at skabe et nyt reference-array
    spilTilstand.mitUdstyr = [...spilTilstand.mitUdstyr];
    
    syncTilDb();
}

export function afslørOmraade(centerIndex: number, rad: number = 1) {
    const maxFelter = spilTilstand.gitter.length;
    const HOEJDE = Math.floor(maxFelter / BREDDE);

    const centerR = Math.floor(centerIndex / BREDDE);
    const centerK = centerIndex % BREDDE;

    const synlige = new Set<number>();

    const rMin = Math.max(0, centerR - rad);
    const rMax = Math.min(HOEJDE - 1, centerR + rad);
    const kMin = Math.max(0, centerK - rad);
    const kMax = Math.min(BREDDE - 1, centerK + rad);

    for (let r = rMin; r <= rMax; r++) {
        for (let k = kMin; k <= kMax; k++) {
            const i = r * BREDDE + k;
            
            if (regnHexAfstand(centerIndex, i, BREDDE) <= rad) {
                synlige.add(i);
            }
        }
    }

    const nyeFelter = [...spilTilstand.mineKendteFelter];
    
    synlige.forEach(i => { 
        if (spilTilstand.gitter[i] && !nyeFelter.includes(i)) {
            nyeFelter.push(i);
        }
    });
    
    spilTilstand.mineKendteFelter = nyeFelter;
}

export function hvil() {
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
    spilTilstand.nuvaerendeEnergi = spilTilstand.maxEnergi;

    const maxHp = karakter.startHp;

    if (spilTilstand.livspoint >= maxHp) { 
        spilTilstand.logBesked = "Du hviler og genvinder energi, men dit helbred er allerede optimalt (40G tabt)."; 
    } else { 
        const pladsTilHeal = maxHp - spilTilstand.livspoint;
        const faktiskHeal = Math.min(30, pladsTilHeal);
        
        spilTilstand.livspoint += faktiskHeal;
        spilTilstand.logBesked = `Du slapper af, får fuld energi og heler sår for ${faktiskHeal} HP.`; 
    }

    if (Math.random() < 0.2) { 
        spilTilstand.logBesked = "Overfald i natten!"; 
        spilTilstand.livspoint -= 25; 
    }

    // Tving en opdatering af synsfeltet, så ridderen åbner visiret
    afslørOmraade(spilTilstand.spillerIndex );

    syncTilDb();
}

export function initialiserGitter() {
    const antal = BREDDE * HOEJDE;
    const totalVægt = biomeVægte.reduce((sum, b) => sum + b.vaegt, 0);

    let råKort = Array(antal).fill('').map((_, i) => {
        const r = Math.floor(i / BREDDE);
        const k = i % BREDDE;
        if (r === 0 || r === HOEJDE - 1 || k === 0 || k === BREDDE - 1) return 'hav';
        let roll = Math.random() * totalVægt;
        for (const b of biomeVægte) {
            if (roll < b.vaegt) return b.id;
            roll -= b.vaegt;
        }
        return 'mark';
    });

    for (let pass = 0; pass < 3; pass++) {
        const nytKort = [...råKort];
        for (let i = 0; i < antal; i++) {
            const r = Math.floor(i / BREDDE);
            const k = i % BREDDE;
            if (r === 0 || r === HOEJDE - 1 || k === 0 || k === BREDDE - 1) continue;
            const naboer = hentNaboIndices(i);
            if (Math.random() < 0.7) {
                const tilfældigNabo = råKort[naboer[Math.floor(Math.random() * naboer.length)]];
                const erSjælden = ['hule', 'ritual', 'ruin', 'bandit'].includes(tilfældigNabo);
                if (!erSjælden || Math.random() < 0.1) nytKort[i] = tilfældigNabo;
            }
        }
        råKort = nytKort;
    }

    const nytGitter: Felt[] = Array(antal).fill(null).map((_, i) => {
        const biome = råKort[i];
        const hemmeligheder = genererUndergrund(biome);
        return {
            guld: 0,
            gravet: false,
            udforsket: false,
            eventFuldført: false,
            biome: biome,
            ...hemmeligheder
        };
    });

    const alleGyldigeEvents = Object.keys(eventBibliotek).filter((k) => !eventBibliotek[k].erSubTrin && k !== 'campfire');
    const vildmark = ['eng', 'skov', 'mark', 'bjerg'];

    for (const key of alleGyldigeEvents) {
        const event = eventBibliotek[key];
        for (let forsøg = 0; forsøg < 100; forsøg++) {
            const randomIndex = Math.floor(Math.random() * antal);
            const f = nytGitter[randomIndex];

            if (f.biome === 'hav' || f.eventID) continue;

            const reqBiome = event.biome;
            const erEtMatch = Array.isArray(reqBiome)
                ? reqBiome.includes(f.biome) || reqBiome.includes('alle')
                : reqBiome === f.biome || reqBiome === 'alle' || reqBiome === 'any' || !reqBiome;

            if (erEtMatch) {
                f.eventID = key;
                break;
            }
        }
    }

    for (let i = 0; i < antal; i++) {
        const f = nytGitter[i];
        if (f.biome === 'hav' || f.eventID) continue;

        if (vildmark.includes(f.biome) && Math.random() < 0.008) {
            f.isCampfire = true;
            f.eventID = 'campfire';
        } else {
            const salgbareVarer = Object.keys(itemDB).filter((k) => itemDB[k].pris > 0 && itemDB[k].type !== 'forbandelse');
            if ((f.biome === 'marked' && Math.random() < 0.33) || (f.biome === 'by' && Math.random() < 0.2)) {
                const vare1 = salgbareVarer[Math.floor(Math.random() * salgbareVarer.length)];
                let vare2 = salgbareVarer[Math.floor(Math.random() * salgbareVarer.length)];
                while (vare1 === vare2) {
                    vare2 = salgbareVarer[Math.floor(Math.random() * salgbareVarer.length)];
                }
                f.shopItems = [vare1, vare2];
            }
        }
    }

    spilTilstand.gitter = nytGitter;
    const muligeStartFelter = [];
    for (let r = 1; r < HOEJDE - 1; r++) {
        if (spilTilstand.gitter[r * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(r * BREDDE + 1);
    }
    
    // Sæt en standardretning, så udregningerne ikke fejler
    spilTilstand.retning = 'E';
    spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
    
    // Første gang vi afslører, er der ikke rigtig en profil at regne på, men funktionen klarer det
    afslørOmraade(spilTilstand.spillerIndex);
}