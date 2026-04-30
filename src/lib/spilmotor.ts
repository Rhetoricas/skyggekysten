// spilmotor.ts
import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb } from '$lib/netvaerk';
import { BREDDE, HOEJDE, biomeVægte, itemDB, markedVarePool } from '$lib/spildata';
import { supabase } from '$lib/supabaseClient';
import { eventBibliotek } from '$lib/eventBibliotek';
import { genererUndergrund } from '$lib/undergrund.svelte';
import { fremrykTid } from '$lib/overlevelse.svelte';
import type { Felt } from '$lib/types';

const RETNINGER = {
    'NE': [[0, -1], [1, -1]],
    'E':  [[1, 0],  [1, 0]],
    'SE': [[0, 1],  [1, 1]],
    'SW': [[-1, 1], [0, 1]],
    'W':  [[-1, 0], [-1, 0]],
    'NW': [[-1, -1], [0, -1]]
} as const;

export function hentNaboIRetning(index: number, retning: keyof typeof RETNINGER, bredde: number, maxFelter: number): number | null {
    const raekke = Math.floor(index / bredde);
    const kolonne = index % bredde;
    const forskudt = raekke % 2 !== 0 ? 1 : 0;
    
    const forskel = RETNINGER[retning];
    if (!forskel) return null;

    const deltaX = forskel[forskudt][0];
    const deltaY = forskel[forskudt][1];

    const nyKolonne = kolonne + deltaX;
    const nyRaekke = raekke + deltaY;

    if (nyKolonne < 0 || nyKolonne >= bredde || nyRaekke < 0 || nyRaekke >= (maxFelter / bredde)) return null;
    
    return nyRaekke * bredde + nyKolonne;
}

export function regnHexAfstand(indexEn: number, indexTo: number, bredde: number): number {
    if (indexEn === indexTo) return 0;

    const raekkeEn = Math.floor(indexEn / bredde);
    const kolonneEn = indexEn % bredde;
    const raekkeTo = Math.floor(indexTo / bredde);
    const kolonneTo = indexTo % bredde;

    const forskydningEn = Math.floor(raekkeEn / 2);
    const forskydningTo = Math.floor(raekkeTo / 2);

    const kubeXEn = kolonneEn - forskydningEn;
    const kubeXTo = kolonneTo - forskydningTo;
    const kubeZEn = raekkeEn;
    const kubeZTo = raekkeTo;
    const kubeYEn = -kubeXEn - kubeZEn;
    const kubeYTo = -kubeXTo - kubeZTo;

    return Math.max(
        Math.abs(kubeXEn - kubeXTo),
        Math.abs(kubeYEn - kubeYTo),
        Math.abs(kubeZEn - kubeZTo)
    );
}

export async function sendAnonymAlarm() {
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode) return;

    const besked = {
        type: 'anonym_alarm',
        senderNavn: spilTilstand.spillerNavn 
    };

    await supabase.channel(spilTilstand.rumKode).send({
        type: 'broadcast',
        event: 'alarm',
        payload: besked
    });
}

export function hentNaboIndices(index: number) {
    const raekke = Math.floor(index / BREDDE);
    const forskudt = raekke % 2 !== 0;
    const afstande = forskudt 
        ? [-BREDDE, -BREDDE + 1, -1, 1, BREDDE, BREDDE + 1] 
        : [-BREDDE - 1, -BREDDE, -1, 1, BREDDE - 1, BREDDE];
    return afstande.map(o => index + o).filter(i => i >= 0 && i < BREDDE * HOEJDE);
}

export function tilfoejTilRygsæk(genstandId: string, tilfoejetMaengde: number = 1) {
    const fundetTing = spilTilstand.mitUdstyr.find(ting => ting.id === genstandId);

    if (fundetTing) {
        fundetTing.maengde += tilfoejetMaengde;
    } else {
        spilTilstand.mitUdstyr.push({
            id: genstandId,
            maengde: tilfoejetMaengde
        });
    }
    
    syncTilDb();
}

export function brugFraRygsæk(genstandId: string, brugtMaengde: number = 1) {
    const indeks = spilTilstand.mitUdstyr.findIndex(ting => ting.id === genstandId);
    
    if (indeks === -1) return;

    spilTilstand.mitUdstyr[indeks].maengde -= brugtMaengde;

    if (spilTilstand.mitUdstyr[indeks].maengde <= 0) {
        spilTilstand.mitUdstyr.splice(indeks, 1);
    }
    
    syncTilDb();
}

export function afslørOmraade(centerIndex: number, radius: number = 1) {
    const totalFelter = spilTilstand.gitter.length;
    const maxRaekker = Math.floor(totalFelter / BREDDE);

    const centerRaekke = Math.floor(centerIndex / BREDDE);
    const centerKolonne = centerIndex % BREDDE;

    const synlige = new Set<number>();

    const raekkeMin = Math.max(0, centerRaekke - radius);
    const raekkeMax = Math.min(maxRaekker - 1, centerRaekke + radius);
    const kolonneMin = Math.max(0, centerKolonne - radius);
    const kolonneMax = Math.min(BREDDE - 1, centerKolonne + radius);

    for (let r = raekkeMin; r <= raekkeMax; r++) {
        for (let k = kolonneMin; k <= kolonneMax; k++) {
            const indeks = r * BREDDE + k;
            
            if (regnHexAfstand(centerIndex, indeks, BREDDE) <= radius) {
                synlige.add(indeks);
            }
        }
    }

    synlige.forEach(indeks => { 
        if (spilTilstand.gitter[indeks] && !spilTilstand.mineKendteFelter.includes(indeks)) {
            spilTilstand.mineKendteFelter.push(indeks);
        }
    });
}

export function hvil() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (felt?.biome === 'hav') {
        spilTilstand.logBesked = "Du kan ikke slå lejr på åbent hav.";
        return;
    }
    
    // Tjek om spilleren faktisk ejer en sovepose
    const harSovepose = spilTilstand.mitUdstyr?.some(ting => ting.id === 'sovepose');
    if (!harSovepose) {
        spilTilstand.logBesked = "Du mangler en sovepose for at slå lejr.";
        return;
    }

    if ((spilTilstand.nuvaerendeEnergi || 0) >= spilTilstand.valgtKarakter.baseEnergi) {
        spilTilstand.logBesked = "Du er allerede udhvilet.";
        return;
    }

    spilTilstand.nuvaerendeEnergi = 0;
    spilTilstand.logBesked = "Du slår lejr og samler kræfter.";
    fremrykTid();
}

export function initialiserGitter() {
    const antal = BREDDE * HOEJDE;
    const totalVaegt = biomeVægte.reduce((sum, biome) => sum + biome.vaegt, 0);

    let raaKort = Array(antal).fill('').map((_, indeks) => {
        const raekke = Math.floor(indeks / BREDDE);
        const kolonne = indeks % BREDDE;
        if (raekke === 0 || raekke === HOEJDE - 1 || kolonne === 0 || kolonne === BREDDE - 1) return 'hav';
        
        let terningKast = Math.random() * totalVaegt;
        for (const biome of biomeVægte) {
            if (terningKast < biome.vaegt) return biome.id;
            terningKast -= biome.vaegt;
        }
        return 'mark';
    });

    for (let omgang = 0; omgang < 3; omgang++) {
        const nytKort = [...raaKort];
        for (let indeks = 0; indeks < antal; indeks++) {
            const raekke = Math.floor(indeks / BREDDE);
            const kolonne = indeks % BREDDE;
            if (raekke === 0 || raekke === HOEJDE - 1 || kolonne === 0 || kolonne === BREDDE - 1) continue;
            
            const naboer = hentNaboIndices(indeks);
            if (Math.random() < 0.7) {
                const tilfaeldigNabo = raaKort[naboer[Math.floor(Math.random() * naboer.length)]];
                const erSjaelden = ['hule', 'ritual', 'ruin', 'bandit'].includes(tilfaeldigNabo);
                if (!erSjaelden || Math.random() < 0.1) nytKort[indeks] = tilfaeldigNabo;
            }
        }
        raaKort = nytKort;
    }

    const bySementer = 3;
    const byStoerrelse = 8;
    const markedSementer = 6;
    const markedStoerrelse = 3;

    function spredBiome(startIndeks: number, type: 'by' | 'marked', maxStr: number) {
        const aabne = [startIndeks];
        const lukkede = new Set<number>();
        let bygget = 0;

        while (aabne.length > 0 && bygget < maxStr) {
            const nu = aabne.shift()!;
            if (lukkede.has(nu)) continue;
            lukkede.add(nu);

            const raekke = Math.floor(nu / BREDDE);
            const kolonne = nu % BREDDE;
            
            if (raekke === 0 || raekke === HOEJDE - 1 || kolonne === 0 || kolonne === BREDDE - 1) continue;
            if (raaKort[nu] === 'hav') continue;

            raaKort[nu] = type;
            bygget++;

            const naboer = hentNaboIndices(nu).sort(() => Math.random() - 0.5);
            aabne.push(...naboer);
        }
    }

    for (let i = 0; i < bySementer; i++) {
        const seed = Math.floor(Math.random() * antal);
        spredBiome(seed, 'by', byStoerrelse);
    }
    for (let i = 0; i < markedSementer; i++) {
        const seed = Math.floor(Math.random() * antal);
        spredBiome(seed, 'marked', markedStoerrelse);
    }

    const nytGitter: Felt[] = Array(antal).fill(null).map((_, indeks) => {
        const biome = raaKort[indeks];
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

    const alleGyldigeEvents = Object.keys(eventBibliotek).filter((noegle) => !eventBibliotek[noegle].erSubTrin && noegle !== 'campfire');
    const vildmark = ['eng', 'skov', 'mark', 'bjerg'];

    for (const noegle of alleGyldigeEvents) {
        const begivenhed = eventBibliotek[noegle];
        for (let forsoeg = 0; forsoeg < 100; forsoeg++) {
            const tilfaeldigtIndeks = Math.floor(Math.random() * antal);
            const felt = nytGitter[tilfaeldigtIndeks];

            if (felt.biome === 'hav' || felt.eventID) continue;

            const kraevetBiome = begivenhed.biome;
            const erMatch = Array.isArray(kraevetBiome)
                ? (kraevetBiome as string[]).includes(felt.biome as string) || (kraevetBiome as string[]).includes('alle')
                : kraevetBiome === felt.biome || kraevetBiome === 'alle' || kraevetBiome === 'any' || !kraevetBiome;

            if (erMatch) {
                felt.eventID = noegle;
                break;
            }
        }
    }

    for (let indeks = 0; indeks < antal; indeks++) {
        const felt = nytGitter[indeks];
        if (felt.biome === 'hav' || felt.eventID) continue;

        if (vildmark.includes(felt.biome as string) && Math.random() < 0.008) {
            felt.isCampfire = true;
            felt.eventID = 'campfire';
        } else if (felt.biome === 'by' || felt.biome === 'marked') {
            if (Math.random() < 0.6) {
                const antalVarer = felt.biome === 'by' ? 2 : 1;
// Klip fra spilmotor.ts
const pulje = felt.biome === 'marked' 
    ? markedVarePool 
    : Object.keys(itemDB).filter(k => itemDB[k].pris > 0 && itemDB[k].type !== 'forbandelse' && itemDB[k].type !== 'skat');                const valgte: string[] = [];
                for(let j=0; j < antalVarer; j++) {
                    const vare = pulje[Math.floor(Math.random() * pulje.length)];
                    if (!valgte.includes(vare)) valgte.push(vare);
                }
                felt.shopItems = valgte;
            }
        }
    }

    spilTilstand.gitter = nytGitter;
    const muligeStartFelter = [];
    for (let raekke = 1; raekke < HOEJDE - 1; raekke++) {
        if (spilTilstand.gitter[raekke * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(raekke * BREDDE + 1);
    }
    
    spilTilstand.retning = 'E';
    spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
    
    afslørOmraade(spilTilstand.spillerIndex);
}