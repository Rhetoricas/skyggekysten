import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb, broadcastFelt } from '$lib/netvaerk';
import { BREDDE, HOEJDE, biomeVægte, itemDB, markedVarePool } from '$lib/spildata';
import { supabase } from '$lib/supabaseClient';
import { eventBibliotek } from '$lib/eventBibliotek';
import { genererUndergrund } from '$lib/undergrund.svelte';
import { fremrykTid, fremtvingKollaps, tagSkadeOgTjekDød } from '$lib/overlevelse.svelte';
import type { Felt, RygsækTing } from '$lib/types';
import { delNyeKort } from '$lib/ventespil.svelte';
import { startEvent } from '$lib/eventMotor.svelte';

const RETNINGER = {
    'NE': [[0, -1], [1, -1]],
    'E':  [[1, 0],  [1, 0]],
    'SE': [[0, 1],  [1, 1]],
    'SW': [[-1, 1], [0, 1]],
    'W':  [[-1, 0], [-1, 0]],
    'NW': [[-1, -1], [0, -1]]
} as const;

export function rystSkaerm(varighed: number = 1200) {
    if (typeof document !== 'undefined') {
        document.body.classList.add('jordskaelv');
        setTimeout(() => document.body.classList.remove('jordskaelv'), varighed);
    }
}

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
    const udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    const fundetTing = udstyrListe.find(ting => ting.id === genstandId);

    if (fundetTing) {
        fundetTing.maengde += tilfoejetMaengde;
    } else {
        const nyTing: RygsækTing = {
            id: genstandId,
            maengde: tilfoejetMaengde,
            anskaffetDag: spilTilstand.dag
        };
        udstyrListe.push(nyTing);
    }
    
    spilTilstand.mitUdstyr = [...spilTilstand.mitUdstyr];
    syncTilDb(); // Ingen `true` her. Rygsæk er personlig.
}

export function brugFraRygsæk(genstandId: string, brugtMaengde: number = 1) {
    const indeks = spilTilstand.mitUdstyr.findIndex(ting => ting.id === genstandId);
    
    if (indeks === -1) return;

    spilTilstand.mitUdstyr[indeks].maengde -= brugtMaengde;

    if (spilTilstand.mitUdstyr[indeks].maengde <= 0) {
        spilTilstand.mitUdstyr.splice(indeks, 1);
    }
    
    spilTilstand.mitUdstyr = [...spilTilstand.mitUdstyr];
    syncTilDb(); // Ingen `true` her.
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

export function haandterFeltInteraktion(nytIndeks: number, teleportKilde: 'stav' | 'portal' | 'byg_portal') {
    const felt = spilTilstand.gitter[nytIndeks];
    let ekstraLog = "";
    let mapAendret = false;

    const nulHp = ['mark', 'by', 'eng', 'marked', 'hoejland', 'skov'];
    const toHp = ['bjerg', 'hule'];
    let hpStraf = 0;
    
    if (nulHp.includes(felt.biome as string)) hpStraf = 0;
    else if (toHp.includes(felt.biome as string)) hpStraf = 3;

    if (hpStraf > 0) {
        hpStraf = spilTilstand.beregnSkade(hpStraf);
        spilTilstand.livspoint -= hpStraf;
        ekstraLog += ` Landingen var hård. (-${hpStraf} HP)`;
    }

    if (felt.skjultFaelde && !felt.gravet) {
        const faeldeSkade = spilTilstand.beregnSkade(15);
        spilTilstand.livspoint -= faeldeSkade;
        felt.skjultFaelde = false;
        felt.gravet = true;
        ekstraLog += ` KLIK! Du lander direkte oven i en skjult fælde! (-${faeldeSkade} HP)`;
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
    }

    const nuBlok = Math.ceil((spilTilstand.dag || 1) / 5);
    const erHvedeTid = nuBlok % 2 !== 0; 
    const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok;
    const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok;
    
    if (felt.biome === 'mark' && felt.afgroede && !erSmadret && !erHoestet) {
        const erModen = (felt.afgroede === 'hvede' && erHvedeTid) || (felt.afgroede === 'boenner' && !erHvedeTid);
        if (erModen) {
            spilTilstand.livspoint += 3;
            felt.hoestetFremTilBlok = nuBlok;
        } else {
            felt.smadretFremTilBlok = nuBlok + 1;
        }
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
    }

    if (felt.biome === 'hav') {
        tagSkadeOgTjekDød(30, `Du blev kastet over åbent vand og styrtede i havet!`, "De kolde bølger trak dig under. Du er død.");
        if (spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'dead') {
            return false;
        }
    }

    if (felt.hasGoldmine) {
        const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (!spiller.besoegteMiner) spiller.besoegteMiner = [];
        
        const varEjer = felt.mineOwner === spilTilstand.spillerNavn;
        const harBesoegt = spiller.besoegteMiner.includes(nytIndeks);
        
        if (!varEjer) {
            if (felt.mineLocked) {
                ekstraLog += " Minen er spærret med en massiv hængelås. Ejeren har sikret den for evigt.";
            } else {
                const ejedeMiner = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
                felt.mineOwner = spilTilstand.spillerNavn;
                
                if (!harBesoegt) {
                    spiller.besoegteMiner.push(nytIndeks);
                    const basisGuld = 100 + (ejedeMiner * 50);
                    const faktiskGuld = spilTilstand.beregnGuldIndkomst ? spilTilstand.beregnGuldIndkomst(basisGuld) : basisGuld;
                    spilTilstand.guldTotal += faktiskGuld;
                    ekstraLog += ` Du overtager minen og udbetaler ${faktiskGuld} guld.`;
                } else {
                    felt.mineLocked = true;
                    ekstraLog += ` Du flår skødet tilbage og låser minen for evigt!`;
                }
                spilTilstand.gitter[nytIndeks] = { ...felt };
                broadcastFelt(nytIndeks, spilTilstand.gitter[nytIndeks]);
                mapAendret = true;
            }
        }
    }

    const slidLog = tjekMiljoeSlitage(felt.biome as string);
    const startLog = teleportKilde === 'stav' 
        ? "Rummet folder sig sammen. Du kastes blindt mod øst." 
        : "Portalens sug flår dig afsted mod øst.";
    
    spilTilstand.logBesked = `${startLog}${ekstraLog}${slidLog}`;

    fremrykTid();
    
    if (felt.hasBoat) {
        felt.hasBoat = false;
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = true;
        }
        spilTilstand.logBesked = "Du mærker bådens ru træ under dine støvler. Havet åbner sig. Du har overlevet øen og kan trække vejret frit.";
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
        setTimeout(() => {
            spilTilstand.gameState = 'win_map';
            syncTilDb(true); 
        }, 3000);
    } else {
        if (felt.eventID && !felt.eventFuldført) {
            felt.eventFuldført = true;
            broadcastFelt(nytIndeks, felt);
            startEvent(felt.eventID);
            mapAendret = true;
        }
        else if (felt.shopItems && felt.shopItems.length > 0) spilTilstand.aktivShop = felt.shopItems;
    }

    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(mapAendret); // Uploades kun hvis nødvendigt

    if (spilTilstand.livspoint <= 0 && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map') {
        fremtvingKollaps("Kræfterne rev din sidste livsgnist væk.");
    }
    return true;
}

function udfoerKerneTeleport(kilde: 'stav' | 'portal') {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;

    if (kilde === 'stav') {
        const stavItem = spilTilstand.mitUdstyr.find(i => i.id === 'stav');
        if (!stavItem || stavItem.maengde <= 0) return;
    }

    const pris = spilTilstand.valgtKarakter.baseEnergi;
    spilTilstand.nuvaerendeEnergi -= pris;

    const gammeltIndeks = spilTilstand.spillerIndex;
    const raekke = Math.floor(gammeltIndeks / BREDDE);
    const kolonne = gammeltIndeks % BREDDE;

    const nyKolonne = Math.min(kolonne + 4, BREDDE - 1);
    const nytIndeks = raekke * BREDDE + nyKolonne;

    spilTilstand.spillerIndex = nytIndeks;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(nytIndeks);
    
    afslørOmraade(nytIndeks, Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));

    if (nyKolonne > spilTilstand.maxKolonne) {
        spilTilstand.maxKolonne = nyKolonne;
    }

    haandterFeltInteraktion(nytIndeks, kilde);
}

export function udfoerTeleport() {
    udfoerKerneTeleport('stav');
}

export function udfoerPortalTeleport() {
    udfoerKerneTeleport('portal');
}

export function hvil() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    const vildmark = ['eng', 'skov', 'mark', 'bjerg', 'hoejland' ];
    
    if (!felt || !vildmark.includes(felt.biome as string)) {
        spilTilstand.logBesked = "Miljøet er uegnet til at slå lejr i.";
        return;
    }
    
    const harSovepose = spilTilstand.mitUdstyr?.some(ting => ting.id === 'sovepose');
    if (!harSovepose) {
        spilTilstand.logBesked = "Du mangler en sovepose for at slå lejr.";
        return;
    }

    if ((spilTilstand.nuvaerendeEnergi || 0) >= spilTilstand.valgtKarakter.baseEnergi) {
        spilTilstand.logBesked = "Du er allerede udhvilet.";
        return;
    }

    spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 20); 
    
    spilTilstand.nuvaerendeEnergi = 0;
    
    spilTilstand.logBesked = "Du pakker dig ind i soveposen. Sår lukkes, mens tågen æder dit forspring.";
    
    fremrykTid();
    syncTilDb(); // Soveposen ændrer intet i landskabet. Drop (true).
}

export function aktiverHemmelighed() {
    const kort = spilTilstand.mitUdstyr.find(i => i.id === 'hemmelighed');
    if (!kort || kort.maengde <= 0) return;

    brugFraRygsæk('hemmelighed', 1);

    const klynge = spilTilstand.gitter.reduce((acc, felt, idx) => {
        if (felt.isSkatteKlynge) acc.push(idx);
        return acc;
    }, [] as number[]);

    if (klynge.length > 0) {
        const nyeFelter = new Set(spilTilstand.mineKendteFelter);
        klynge.forEach(idx => nyeFelter.add(idx));
        spilTilstand.mineKendteFelter = Array.from(nyeFelter);

        tilfoejTilRygsæk('skattekort_aabent', 1);
        
        spilTilstand.kameraFokus = klynge[Math.floor(klynge.length / 2)];
        
        spilTilstand.logBesked = "Du ruller pergamentet ud. Syv røde krydser brænder sig fast på dit indre landkort.";
    } else {
        spilTilstand.logBesked = "Kortet smuldrer i dine hænder. Det var værdiløst.";
    }
    
    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(); // Du ruller et kort ud. Kun dig og din rygsæk er involveret. Drop (true).
}

export function plantSkat(gitter: Felt[]) {
    gitter.forEach(f => {
        f.isSkatteKlynge = false;
        f.tomSkattekiste = false;
    });

    const muligeCentre: number[] = [];
    const minKol = Math.floor(BREDDE * 0.50);
    const maxKol = Math.floor(BREDDE * 0.75);

    for (let i = 0; i < gitter.length; i++) {
        const kol = i % BREDDE;
        if (kol >= minKol && kol <= maxKol) {
            const naboer = hentNaboIndices(i);
            if (naboer.length === 6) {
                const alleGyldige = [i, ...naboer].every(idx => {
                    const felt = gitter[idx];
                    return felt.kanGraves && felt.biome !== 'hav' && felt.biome !== 'by' && felt.biome !== 'marked' && felt.biome !== 'meteor' && !felt.hasPortal && !felt.eventID;
                });
                if (alleGyldige) {
                    muligeCentre.push(i);
                }
            }
        }
    }

    if (muligeCentre.length > 0) {
        const center = muligeCentre[Math.floor(Math.random() * muligeCentre.length)];
        const klynge = [center, ...hentNaboIndices(center)];
        const skatteFelt = klynge[Math.floor(Math.random() * klynge.length)];
        
        klynge.forEach(idx => {
            gitter[idx].isSkatteKlynge = true;
            if (idx === skatteFelt) {
                gitter[idx].skjultLoot = 'skattekiste';
                gitter[idx].skjultFaelde = false;
                gitter[idx].skjultGuld = 0;
                gitter[idx].skjultLiv = 0;
            } else {
                gitter[idx].skjultFaelde = true;
                gitter[idx].skjultLoot = null;
                gitter[idx].skjultGuld = 0;
                gitter[idx].skjultLiv = 0;
            }
        });
    }
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

    const bySementer = Math.floor(antal / 400);
    const markedSementer = Math.floor(antal / 200);

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
        const tilfaeldigByStoerrelse = Math.floor(Math.random() * 6) + 5; 
        spredBiome(seed, 'by', tilfaeldigByStoerrelse);
    }
    
    for (let i = 0; i < markedSementer; i++) {
        const seed = Math.floor(Math.random() * antal);
        const tilfaeldigMarkedStoerrelse = Math.floor(Math.random() * 5) + 1; 
        spredBiome(seed, 'marked', tilfaeldigMarkedStoerrelse);
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

    let ledigeEvents = Object.keys(eventBibliotek).filter((noegle) => !eventBibliotek[noegle].erSubTrin && noegle !== 'campfire');
    
    const eventForbrug = new Map<string, number>();
    ledigeEvents.forEach(e => eventForbrug.set(e, 0));

    const eventChancer: Record<string, number> = {
        'hule': 0.50, 'ritual': 0.90, 'ruin': 0.50, 'bandit': 0.10, 'krystal': 0.02,
        'blodskov': 0.02, 'slagmark': 0.02, 'by': 0.02, 'marked': 0.02, 'hoejland': 0.01,
        'hav': 0.005, 'bjerg': 0.01, 'skov': 0.01, 'eng': 0.01, 'mark': 0.01
    };

    const tilfaeldigeFelter = Array.from({length: antal}, (_, i) => i).sort((a, b) => {
        const kolA = a % BREDDE;
        const kolB = b % BREDDE;
        if (kolA !== kolB) return kolB - kolA;
        return Math.random() - 0.5;
    });

    for (const indeks of tilfaeldigeFelter) {
        const felt = nytGitter[indeks];
        if (felt.eventID) continue;

        const pauseEvents = false; 
        const chance = pauseEvents ? 0 : (eventChancer[felt.biome as string] || 0.05);

        if (Math.random() < chance) {
            const matchendeEvents = ledigeEvents.filter(noegle => {
                const kraevetBiome = eventBibliotek[noegle].biome;
                if (felt.biome === 'hav') return Array.isArray(kraevetBiome) && kraevetBiome.includes('hav');
                return Array.isArray(kraevetBiome)
                    ? (kraevetBiome as string[]).includes(felt.biome as string) || (kraevetBiome as string[]).includes('alle')
                    : kraevetBiome === felt.biome || kraevetBiome === 'alle' || kraevetBiome === 'any' || !kraevetBiome;
            });

            if (matchendeEvents.length > 0) {
                const minBrugt = Math.min(...matchendeEvents.map(e => eventForbrug.get(e) || 0));
                const mulige = matchendeEvents.filter(e => (eventForbrug.get(e) || 0) === minBrugt);
                const valgtEvent = mulige[Math.floor(Math.random() * mulige.length)];
                felt.eventID = valgtEvent;

                if (eventBibliotek[valgtEvent].unik) {
                    ledigeEvents = ledigeEvents.filter(e => e !== valgtEvent);
                    eventForbrug.delete(valgtEvent);
                } else {
                    eventForbrug.set(valgtEvent, (eventForbrug.get(valgtEvent) || 0) + 1);
                }
            }
        }
    }

    const vildmark = ['eng', 'skov', 'mark', 'bjerg'];

    for (let indeks = 0; indeks < antal; indeks++) {
        const felt = nytGitter[indeks];
        
        if (Math.random() < 0.005) {
            felt.hasPortal = true;
        }

        if (felt.biome === 'hav' || felt.eventID) continue;

        if (felt.biome === 'bjerg' && Math.random() < 0.04) {
            felt.hasGoldmine = true;
        } else if (vildmark.includes(felt.biome as string) && Math.random() < 0.008) {
            felt.isCampfire = true;
            felt.eventID = 'campfire';
        } else if (felt.biome === 'by' || felt.biome === 'marked') {
            if (Math.random() < 0.6) {
                const antalVarer = felt.biome === 'by' ? 2 : 1;
                const pulje = felt.biome === 'marked' 
                    ? markedVarePool 
                    : Object.keys(itemDB).filter(k => itemDB[k].pris > 0 && itemDB[k].type !== 'forbandelse' && itemDB[k].type !== 'skat');                
                const valgte: string[] = [];
                for(let j=0; j < antalVarer; j++) {
                    const vare = pulje[Math.floor(Math.random() * pulje.length)];
                    if (!valgte.includes(vare)) valgte.push(vare);
                }
                felt.shopItems = valgte;
            }
        }
    }

    for (let indeks = 0; indeks < antal; indeks++) {
        const felt = nytGitter[indeks];
        if (felt.biome !== 'mark') continue;

        const naboer = hentNaboIndices(indeks);
        let hvedeCount = 0;
        let boenneCount = 0;

        for (const naboIdx of naboer) {
            const naboFelt = nytGitter[naboIdx];
            if (naboFelt && naboFelt.afgroede === 'hvede') hvedeCount++;
            if (naboFelt && naboFelt.afgroede === 'boenner') boenneCount++;
        }

        if (hvedeCount > boenneCount) felt.afgroede = 'hvede';
        else if (boenneCount > hvedeCount) felt.afgroede = 'boenner';
        else felt.afgroede = Math.random() < 0.5 ? 'hvede' : 'boenner';
    }

    plantSkat(nytGitter);

    for (let i = 0; i < antal; i++) {
        nytGitter[i].grundBiome = nytGitter[i].biome;
        nytGitter[i].grundEvent = nytGitter[i].eventID;
    }

    spilTilstand.gitter = nytGitter;
    const muligeStartFelter = [];
    for (let raekke = 1; raekke < HOEJDE - 1; raekke++) {
        if (spilTilstand.gitter[raekke * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(raekke * BREDDE + 1);
    }
    
    spilTilstand.retning = 'E';
    spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
    
    afslørOmraade(spilTilstand.spillerIndex);
    delNyeKort();
}

export function tjekMiljoeSlitage(biome: string): string {
    const logBeskeder: string[] = [];
    let mistetFintToej = 0;

    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter(vare => {
        if (biome === 'hav') {
            if (vare.id === 'rustning') {
                logBeskeder.push("Dit tunge panser trækker dig mod bunden. Du smider rustningen i havet.");
                return false;
            }
            if (vare.id === 'fakkel') {
                logBeskeder.push("Vandet drukner din fakkel.");
                return false;
            }
        } else if (biome === 'hule') {
            if (vare.id === 'flot_toej') {
                mistetFintToej += vare.maengde;
                logBeskeder.push("Hulens skarpe sten flænser dit fine tøj til klude.");
                return false;
            }
            if (vare.id === 'sovepose') {
                logBeskeder.push("Den ekstreme fugt får din sovepose til at rådne væk.");
                return false;
            }
        } else if (biome === 'blodskov') {
            if (vare.id === 'flot_toej') {
                mistetFintToej += vare.maengde;
                logBeskeder.push("Blodskovens torne river dit fine tøj i laser.");
                return false;
            }
        } else if (biome === 'krystal') {
            if (vare.id === 'metaldetektor') {
                logBeskeder.push("Krystallernes resonans kortslutter din metaldetektor.");
                return false;
            }
            if (vare.id === 'kikkert_250' || vare.id === 'kikkert_45') {
                logBeskeder.push("Krystallens lys splintrer kikkertens linser");
                return false;
            }
        } else if (biome === 'ruin') {
            if (vare.id === 'mad') {
                logBeskeder.push("Skadedyrene i ruinen stjæler din mad.");
                return false;
            }
        } else if (biome === 'ritual') {
            if (vare.id === 'soegekvist') {
                logBeskeder.push("Den mørke magi brænder din søgekvist til aske.");
                return false;
            }
        }
        return true;
    });

    if (mistetFintToej > 0) {
        const klude = spilTilstand.mitUdstyr.find(i => i.id === 'klude');
        if (klude) {
            klude.maengde += mistetFintToej;
        } else {
            spilTilstand.mitUdstyr.push({ id: 'klude', maengde: mistetFintToej });
        }
    }

    return logBeskeder.length > 0 ? " " + logBeskeder.join(" ") : "";
}

export async function sendBaalSignal(centerIndex: number, radius: number) {
    if (!spilTilstand.rumKode) return;
    await supabase.channel(spilTilstand.rumKode).send({
        type: 'broadcast',
        event: 'baal',
        payload: { centerIndex, radius }
    });
}

export function taendBaal() {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const fakkel = spilTilstand.mitUdstyr.find(i => i.id === 'fakkel');
    if (!fakkel || fakkel.maengde <= 0) return;

    brugFraRygsæk('fakkel', 1);

    const radius = Math.max(1, spilTilstand.valgtKarakter.synsRadius + spilTilstand.rygsækEffekt.syn) + 2;
    afslørOmraade(spilTilstand.spillerIndex, radius);
    
    spilTilstand.logBesked = "Du planter faklen i jorden og antænder et massivt bål. Lyset flænger tågen og guider dine medspillere.";
    
    sendBaalSignal(spilTilstand.spillerIndex, radius);
    fremrykTid();
    syncTilDb(); // Tænder bål og rykker tid. Gør intet ved grundkortet. Drop (true).
}

export function bygOgHopGennemPortal() {
    const gammeltIndeks = spilTilstand.spillerIndex;
    const raekke = Math.floor(gammeltIndeks / BREDDE);
    const kolonne = gammeltIndeks % BREDDE;

    const nyKolonne = Math.min(kolonne + 4, BREDDE - 1);
    const hopIndeks = raekke * BREDDE + nyKolonne;
    
    spilTilstand.gitter[gammeltIndeks].hasPortal = true;
    broadcastFelt(gammeltIndeks, spilTilstand.gitter[gammeltIndeks]);
    
    spilTilstand.spillerIndex = hopIndeks;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(hopIndeks);

    if (nyKolonne > spilTilstand.maxKolonne) {
        spilTilstand.maxKolonne = nyKolonne;
    }
    
    afslørOmraade(hopIndeks, Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));
    
    haandterFeltInteraktion(hopIndeks, 'byg_portal');
    return true;
}

export async function udloesNaturkatastrofe(centerIndex: number) {
    rystSkaerm(1200);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.60) paavirkede.add(r1);
    }

    const lukkedeFelter = new Set([centerIndex, ...ring1]);
    const inficeredeRing1 = Array.from(paavirkede).filter(i => i !== centerIndex);

    for (const inficeret of inficeredeRing1) {
        const ring2 = hentNaboIndices(inficeret);
        for (const r2 of ring2) {
            if (!lukkedeFelter.has(r2) && Math.random() < 0.30) {
                paavirkede.add(r2);
            }
        }
    }

    const paavirkedeArray = Array.from(paavirkede);

    for (const idx of paavirkedeArray) {
        felter[idx].biome = 'meteor';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = 'meteor_skat';
        felter[idx].eventFuldført = false;
        felter[idx].hasMeteorStone = true;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];

    if (spilTilstand.rumKode) {
        await supabase.channel(spilTilstand.rumKode).send({
            type: 'broadcast',
            event: 'meteor',
            payload: { ramteFelter: paavirkedeArray }
        });
    }

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        tagSkadeOgTjekDød(30, "Et øredøvende brag flænger himlen. Meteoren knuser jorden under dig.", "Du bliver slemt forbrændt i krateret.");
    }

    syncTilDb(true); // Massiv meteor der smadrer tyve felter permanent. Her skal databasen æde det hele.
}

export async function udloesJordskaelv(centerIndex: number) {
    rystSkaerm(2000);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.70) paavirkede.add(r1);
    }

    const lukkedeFelter = new Set([centerIndex, ...ring1]);
    const inficeredeRing1 = Array.from(paavirkede).filter(i => i !== centerIndex);

    for (const inficeret of inficeredeRing1) {
        const ring2 = hentNaboIndices(inficeret);
        for (const r2 of ring2) {
            if (!lukkedeFelter.has(r2) && Math.random() < 0.40) {
                paavirkede.add(r2);
            }
        }
    }

    const paavirkedeArray = Array.from(paavirkede);

    for (const idx of paavirkedeArray) {
        if (felter[idx].biome === 'hav') continue; 
        
        felter[idx].biome = Math.random() < 0.2 ? 'ruin' : 'bjerg';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = undefined;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];

    if (spilTilstand.rumKode) {
        await supabase.channel(spilTilstand.rumKode).send({
            type: 'broadcast',
            event: 'rystelse',
            payload: { varighed: 2000 }
        });
    }

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        tagSkadeOgTjekDød(40, "Jorden brød op under dig.", "Klipperne skyder op fra undergrunden og knuser dig mod bjergvæggen.");
    }

    syncTilDb(true); // Landskab skifter fuldstændig. Æd data.
}

export async function udloesOversvoemmelse(centerIndex: number) {
    rystSkaerm(1500);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.85) paavirkede.add(r1);
    }

    const lukkedeFelter = new Set([centerIndex, ...ring1]);
    const inficeredeRing1 = Array.from(paavirkede).filter(i => i !== centerIndex);

    for (const inficeret of inficeredeRing1) {
        const ring2 = hentNaboIndices(inficeret);
        for (const r2 of ring2) {
            if (!lukkedeFelter.has(r2) && Math.random() < 0.50) {
                paavirkede.add(r2);
            }
        }
    }

    const paavirkedeArray = Array.from(paavirkede);

    for (const idx of paavirkedeArray) {
        felter[idx].biome = 'hav';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = undefined;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];

    if (spilTilstand.rumKode) {
        await supabase.channel(spilTilstand.rumKode).send({
            type: 'broadcast',
            event: 'rystelse',
            payload: { varighed: 1500 }
        });
    }

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        const harRustning = spilTilstand.mitUdstyr.some(t => t.id === 'rustning');
        if (harRustning) {
            tagSkadeOgTjekDød(80, "Din tunge rustning trak dig mod bunden.", "Vandet sluger landskabet. Du trækkes under af dit udstyr og drukner.");
        } else {
            tagSkadeOgTjekDød(30, "En flodbølge skyllede dig brutalt ned af klipperne.", "Masserne flænser landskabet, og du skylles i døden.");
        }
    }

    syncTilDb(true); // Bjerge ændres til hav. Enorm opdatering.
}

export function udvindMeteorSkat(metode: string): { logBesked: string; hpNed?: number; guldOp?: number; itemUd?: string } {
    const pris = spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.baseEnergi * 2 : 10;
    spilTilstand.nuvaerendeEnergi -= pris;
    
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    felt.hasMeteorStone = false;
    broadcastFelt(spilTilstand.spillerIndex, felt);
    
    if (metode === 'haender') {
        return {
            logBesked: `Du får det meste af guldet ud af den brandvarme sten.`,
            hpNed: 20,
            guldOp: 150
        };
    } else {
        return {
            logBesked: `Dit værktøj er slidt op, men du lykkes med at få stenen åbnet`,
            guldOp: 300,
            itemUd: 'diamant' 
        };
    }
}

export function nulstilKort() {
    spilTilstand.gitter.forEach(felt => {
        felt.gravet = false;
        felt.eventFuldført = false;
        felt.hasBoat = false;
        felt.smadretFremTilBlok = undefined;
        felt.hoestetFremTilBlok = undefined;
        felt.mineOwner = undefined;
        felt.mineLocked = undefined;
        felt.hasMeteorStone = false;

        if (felt.grundBiome) {
            felt.biome = felt.grundBiome;
            felt.eventID = felt.grundEvent;
            
            const hemmeligheder = genererUndergrund(felt.grundBiome as string);
            felt.skjultGuld = hemmeligheder.skjultGuld;
            felt.skjultLiv = hemmeligheder.skjultLiv;
            felt.skjultFaelde = hemmeligheder.skjultFaelde;
            felt.skjultLoot = hemmeligheder.skjultLoot;
        }
    });

    plantSkat(spilTilstand.gitter);
}