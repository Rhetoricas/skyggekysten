import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb, broadcastFelt, broadcastFelter, syncKortTilDbSenere, realtimeRumNoegle } from '$lib/netvaerk';
import { HEX_W, biomeVægte, biomeTerraenCost, itemDB, markedVarePool } from '$lib/spildata';
import { KORT_VERSION, normaliserKortDimensioner, STANDARD_KORT_BREDDE, STANDARD_KORT_HOEJDE } from '$lib/kortDimensioner';
import { supabase } from '$lib/supabaseClient';
import { eventBibliotek } from '$lib/eventBibliotek';
import { genererUndergrund } from '$lib/undergrund.svelte';
import { fremrykTid, fremtvingKollaps, tagSkadeOgTjekDød, udloesBersaerkHvisRelevant } from '$lib/overlevelse.svelte';
import { erAfgroedeModen, erHvedeBlok, erInsektPlageAktiv, hentAfgroedeBlok } from '$lib/afgroeder';
import type { Biome, Felt, RygsækTing } from '$lib/types';
import { delNyeKort, startVenteSpil } from '$lib/ventespil.svelte';
import { startEvent } from '$lib/eventMotor.svelte';
import { erFriskAktivSpiller } from '$lib/aktivSpiller';

function eventKanalNavn() {
    return `room:${realtimeRumNoegle(spilTilstand.rumKode)}:events`;
}

function eventKanalPayload() {
    return {
        kanalNoegle: realtimeRumNoegle(spilTilstand.rumKode),
        rumKode: spilTilstand.rumKode
    };
}

const RETNINGER = {
    'NE': [[0, -1], [1, -1]],
    'E':  [[1, 0],  [1, 0]],
    'SE': [[0, 1],  [1, 1]],
    'SW': [[-1, 1], [0, 1]],
    'W':  [[-1, 0], [-1, 0]],
    'NW': [[-1, -1], [0, -1]]
} as const;

export function hentKortBredde() {
    return spilTilstand.kortBredde || STANDARD_KORT_BREDDE;
}

export function hentKortHoejde() {
    return spilTilstand.kortHoejde || STANDARD_KORT_HOEJDE;
}

export function hentKortAntalFelter() {
    return hentKortBredde() * hentKortHoejde();
}

export function saetKortDimensioner(bredde?: number | null, hoejde?: number | null) {
    const dimensioner = normaliserKortDimensioner(bredde, hoejde);
    spilTilstand.kortBredde = dimensioner.bredde;
    spilTilstand.kortHoejde = dimensioner.hoejde;
    return dimensioner;
}

export function aktivKortVersion() {
    return KORT_VERSION;
}

export function erVandBiome(biome: string | Biome | null | undefined) {
    return biome === 'hav' || biome === 'soe';
}

interface FaellesEventEffekt {
    senderNavn: string;
    besked: string;
    guldAendring?: number;
    skade?: number;
}

let katastrofeVisuelId = 0;

function animerKatastrofeFelter(centerIndex: number, fraBiomer: Map<number, string | Biome>) {
    const id = ++katastrofeVisuelId;
    const felter = spilTilstand.gitter;
    const bredde = hentKortBredde();
    const indices = Array.from(fraBiomer.keys()).sort((a, b) => {
        const afstandDiff = regnHexAfstand(centerIndex, a, bredde) - regnHexAfstand(centerIndex, b, bredde);
        return afstandDiff !== 0 ? afstandDiff : a - b;
    });

    for (const index of indices) {
        const felt = felter[index];
        if (!felt) continue;
        felt.katastrofeFraBiome = fraBiomer.get(index);
        felt.katastrofeVisuelAktiv = true;
        felt.katastrofeVisuelId = id;
    }

    spilTilstand.gitter = [...felter];

    indices.forEach((index, position) => {
        setTimeout(() => {
            const felt = spilTilstand.gitter[index];
            if (!felt || felt.katastrofeVisuelId !== id) return;

            delete felt.katastrofeFraBiome;
            delete felt.katastrofeVisuelAktiv;
            delete felt.katastrofeVisuelId;
            spilTilstand.gitter = [...spilTilstand.gitter];
        }, position * 300);
    });
}

export function rystSkaerm(varighed: number = 1200) {
    if (typeof document !== 'undefined') {
        document.body.classList.add('jordskaelv');
        document.body.classList.add('katastrofe-lys');
        setTimeout(() => {
            document.body.classList.remove('jordskaelv');
            document.body.classList.remove('katastrofe-lys');
        }, varighed);
    }

    if (typeof window !== 'undefined' && spilTilstand.musikTaendt) {
        try {
            const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtor) return;

            const ctx = new AudioCtor();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(72, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(34, ctx.currentTime + 0.38);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.52);
            setTimeout(() => void ctx.close().catch(() => {}), 700);
        } catch {
            // Lyd er kun en lokal effekt. Hvis browseren blokerer den, fortsætter spillet.
        }
    }
}

export function hentNaboIRetning(index: number, retning: keyof typeof RETNINGER, bredde = hentKortBredde(), maxFelter = hentKortAntalFelter()): number | null {
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

export function regnHexAfstand(indexEn: number, indexTo: number, bredde = hentKortBredde()): number {
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
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode) return;

    const besked = {
        type: 'anonym_alarm',
        ...eventKanalPayload(),
        senderNavn: spilTilstand.spillerNavn 
    };

    void supabase.channel(eventKanalNavn()).send({
        type: 'broadcast',
        event: 'alarm',
        payload: besked
    }).catch((error) => console.warn('Alarm kunne ikke sendes', error));
}

export function anvendFaellesEventEffekt(payload: FaellesEventEffekt) {
    if (!payload || payload.senderNavn === spilTilstand.spillerNavn) return;
    if (spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win_map') return;

    if (payload.guldAendring) {
        spilTilstand.guldTotal += payload.guldAendring;
    }

    if (payload.skade && payload.skade > 0) {
        tagSkadeOgTjekDød(payload.skade, payload.besked);
    } else {
        spilTilstand.logBesked = payload.besked;
    }

    syncTilDb();
}

export function udloesFaellesEventEffekt(effekt: Omit<FaellesEventEffekt, 'senderNavn'>) {
    const senderNavn = spilTilstand.spillerNavn || 'En spiller';
    const payload: FaellesEventEffekt = { ...effekt, senderNavn };

    if (payload.guldAendring) {
        spilTilstand.guldTotal += payload.guldAendring;
    }
    if (payload.skade && payload.skade > 0) {
        tagSkadeOgTjekDød(payload.skade, payload.besked);
    } else {
        spilTilstand.logBesked = payload.besked;
    }

    if (!spilTilstand.offlineMode && spilTilstand.rumKode) {
        void supabase.channel(eventKanalNavn()).send({
            type: 'broadcast',
            event: 'faelles_event',
            payload: { ...payload, ...eventKanalPayload() }
        }).catch((error) => console.warn('Fælles event kunne ikke sendes', error));
    }

    syncTilDb();
}

export function rykTaagenTilbage(antalFelter: number = 2) {
    const afstand = Math.max(1, antalFelter) * HEX_W;
    if (spilTilstand.fogX < 0) {
        spilTilstand.fogX = Math.min(-1, spilTilstand.fogX + afstand);
    } else {
        spilTilstand.fogX = Math.max(0, spilTilstand.fogX - afstand);
    }
    syncTilDb();
}

export function hentNaboIndices(index: number) {
    const bredde = hentKortBredde();
    const maxFelter = hentKortAntalFelter();
    return (['NE', 'E', 'SE', 'SW', 'W', 'NW'] as const)
        .map((retning) => hentNaboIRetning(index, retning, bredde, maxFelter))
        .filter((i): i is number => i !== null);
}

export function harRygsaekItem(genstandId: string) {
    const itemIds = genstandId === 'skovl'
        ? ['skovl', 'mesterskovl']
        : genstandId === 'stav'
            ? ['stav', 'dragestav']
            : genstandId === 'soegekvist'
                ? ['soegekvist', 'runekvist']
                : genstandId === 'dirk'
                    ? ['dirk', 'mesterdirk']
                    : genstandId === 'kniv'
                        ? ['kniv', 'mesterkniv']
                        : genstandId === 'rustning'
                            ? ['rustning', 'kongepanser']
                            : genstandId === 'oekse'
                                ? ['oekse', 'stormoekse']
                                : genstandId === 'koelle'
                                    ? ['koelle', 'koelle_upgr']
                                    : genstandId === 'bue'
                                        ? ['bue', 'mesterbue']
                                        : genstandId === 'flot_toej'
                                            ? ['flot_toej', 'royalt_toej']
                                            : genstandId === 'fakkel'
                                                ? ['fakkel', 'solfakkel']
                                                : genstandId === 'metaldetektor'
                                                    ? ['metaldetektor', 'malmviser']
                                                    : genstandId === 'sovepose'
                                                        ? ['sovepose', 'silkesovepose']
                                                        : [genstandId];
    return spilTilstand.mitUdstyr.some(ting => itemIds.includes(ting.id) && ting.maengde > 0);
}

export function findRygsaekItemTilKrav(genstandId: string) {
    const itemIds = genstandId === 'skovl'
        ? ['skovl', 'mesterskovl']
        : genstandId === 'stav'
            ? ['stav', 'dragestav']
            : genstandId === 'soegekvist'
                ? ['soegekvist', 'runekvist']
                : genstandId === 'dirk'
                    ? ['dirk', 'mesterdirk']
                    : genstandId === 'kniv'
                        ? ['kniv', 'mesterkniv']
                        : genstandId === 'rustning'
                            ? ['rustning', 'kongepanser']
                            : genstandId === 'oekse'
                                ? ['oekse', 'stormoekse']
                                : genstandId === 'koelle'
                                    ? ['koelle', 'koelle_upgr']
                                    : genstandId === 'bue'
                                        ? ['bue', 'mesterbue']
                                        : genstandId === 'flot_toej'
                                            ? ['flot_toej', 'royalt_toej']
                                            : genstandId === 'fakkel'
                                                ? ['fakkel', 'solfakkel']
                                                : genstandId === 'metaldetektor'
                                                    ? ['metaldetektor', 'malmviser']
                                                    : genstandId === 'sovepose'
                                                        ? ['sovepose', 'silkesovepose']
                                                        : [genstandId];
    return spilTilstand.mitUdstyr.find(ting => itemIds.includes(ting.id) && ting.maengde > 0)?.id ?? null;
}

export function kanStackeItem(genstandId: string) {
    return genstandId === 'mad' ||
        genstandId === 'livseliksir' ||
        genstandId === 'diamant' ||
        genstandId === 'hemmelighed' ||
        genstandId === 'fakkel' ||
        genstandId === 'solfakkel';
}

export function kanModtageItem(genstandId: string) {
    if (kanStackeItem(genstandId)) return true;
    if (genstandId === 'skovl' || genstandId === 'mesterskovl') return !harRygsaekItem('skovl');
    if (genstandId === 'stav' || genstandId === 'dragestav') return !harRygsaekItem('stav');
    if (genstandId === 'soegekvist' || genstandId === 'runekvist') return !harRygsaekItem('soegekvist');
    if (genstandId === 'dirk' || genstandId === 'mesterdirk') return !harRygsaekItem('dirk');
    if (genstandId === 'kniv' || genstandId === 'mesterkniv') return !harRygsaekItem('kniv');
    if (genstandId === 'rustning' || genstandId === 'kongepanser') return !harRygsaekItem('rustning');
    if (genstandId === 'oekse' || genstandId === 'stormoekse') return !harRygsaekItem('oekse');
    if (genstandId === 'koelle' || genstandId === 'koelle_upgr') return !harRygsaekItem('koelle');
    if (genstandId === 'bue' || genstandId === 'mesterbue') return !harRygsaekItem('bue');
    if (genstandId === 'klude' || genstandId === 'flot_toej' || genstandId === 'royalt_toej') {
        return !spilTilstand.mitUdstyr.some(ting => ['klude', 'flot_toej', 'royalt_toej'].includes(ting.id) && ting.maengde > 0);
    }
    if (genstandId === 'fakkel' || genstandId === 'solfakkel') return !harRygsaekItem('fakkel');
    if (genstandId === 'metaldetektor' || genstandId === 'malmviser') return !harRygsaekItem('metaldetektor');
    if (genstandId === 'sovepose' || genstandId === 'silkesovepose') return !harRygsaekItem('sovepose');
    return !spilTilstand.mitUdstyr.some(ting => ting.id === genstandId && ting.maengde > 0);
}

function normaliserItemAntal(maengde: unknown, fallback = 1) {
    const antal = Math.floor(Number(maengde));
    return Number.isFinite(antal) && antal > 0 ? antal : fallback;
}

export function tilfoejTilRygsæk(genstandId: string, tilfoejetMaengde: number = 1) {
    genstandId = String(genstandId || '').trim();
    tilfoejetMaengde = normaliserItemAntal(tilfoejetMaengde);
    if (!genstandId) return;

    let udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];

    if (genstandId === 'mesterskovl') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'skovl');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'dragestav') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'stav');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'runekvist') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'soegekvist');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'mesterdirk') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'dirk');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'mesterkniv') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'kniv');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'kongepanser') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'rustning');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'stormoekse') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'oekse');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'koelle_upgr') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'koelle');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'mesterbue') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'bue');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'flot_toej') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'klude');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'royalt_toej') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'klude' && ting.id !== 'flot_toej');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'solfakkel') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'fakkel');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'malmviser') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'metaldetektor');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    if (genstandId === 'silkesovepose') {
        spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== 'sovepose');
        udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    }

    const fundetTing = udstyrListe.find(ting => ting.id === genstandId);

    if (fundetTing) {
        if (kanStackeItem(genstandId)) {
            const dubletAntal = udstyrListe
                .filter(ting => ting.id === genstandId && ting !== fundetTing)
                .reduce((sum, ting) => sum + normaliserItemAntal(ting.maengde, 0), 0);
            fundetTing.maengde = normaliserItemAntal(fundetTing.maengde, 0) + dubletAntal + tilfoejetMaengde;
            spilTilstand.mitUdstyr = udstyrListe.filter(ting => ting.id !== genstandId || ting === fundetTing);
            udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
        } else {
            spilTilstand.logBesked = `Du har allerede ${itemDB[genstandId]?.navn || 'den genstand'}.`;
            return;
        }
    } else {
        if (!kanModtageItem(genstandId)) {
            spilTilstand.logBesked = `Du har allerede ${itemDB[genstandId]?.navn || 'den type udstyr'}.`;
            return;
        }

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

export function laegGuldIKasseForAktueltFelt(beloeb: number) {
    const kasseBeloeb = Math.max(0, Math.floor(beloeb));
    if (kasseBeloeb <= 0) return 0;

    const indeks = spilTilstand.spillerIndex;
    const felt = spilTilstand.gitter[indeks];
    if (!felt) return 0;

    felt.kasseGuld = Math.max(0, felt.kasseGuld || 0) + kasseBeloeb;
    spilTilstand.gitter[indeks] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(indeks, spilTilstand.gitter[indeks]);
    syncKortTilDbSenere();
    return felt.kasseGuld;
}

export function afslørOmraade(centerIndex: number, radius: number = 1) {
    const bredde = hentKortBredde();
    const totalFelter = spilTilstand.gitter.length;
    const maxRaekker = Math.floor(totalFelter / bredde);

    const centerRaekke = Math.floor(centerIndex / bredde);
    const centerKolonne = centerIndex % bredde;
    const staarPaaBjerg = spilTilstand.gitter[centerIndex]?.biome === 'bjerg';

    const synlige = new Set<number>();

    const raekkeMin = Math.max(0, centerRaekke - radius);
    const raekkeMax = Math.min(maxRaekker - 1, centerRaekke + radius);
    const kolonneMin = Math.max(0, centerKolonne - radius);
    const kolonneMax = Math.min(bredde - 1, centerKolonne + radius);

    for (let r = raekkeMin; r <= raekkeMax; r++) {
        for (let k = kolonneMin; k <= kolonneMax; k++) {
            const indeks = r * bredde + k;
            
            if (
                regnHexAfstand(centerIndex, indeks, bredde) <= radius &&
                (staarPaaBjerg || !erSynBlokeretAfBjerg(centerIndex, indeks))
            ) {
                synlige.add(indeks);
            }
        }
    }

    synlige.forEach(indeks => { 
        if (spilTilstand.gitter[indeks] && !spilTilstand.mineKendteFelter.includes(indeks)) {
            spilTilstand.mineKendteFelter.push(indeks);
        }
    });

    if (centerIndex === spilTilstand.spillerIndex) {
        afslørMalmviserMiner(centerIndex);
    }
}

export function afslørMalmviserMiner(centerIndex: number = spilTilstand.spillerIndex) {
    if (!harRygsaekItem('malmviser')) return false;

    const kendte = new Set(spilTilstand.mineKendteFelter);
    let aendret = false;

    spilTilstand.gitter.forEach((felt, indeks) => {
        if (!felt?.hasGoldmine) return;
        if (regnHexAfstand(centerIndex, indeks) > 2) return;

        if (!kendte.has(indeks)) {
            kendte.add(indeks);
            aendret = true;
        }
    });

    if (aendret) {
        spilTilstand.mineKendteFelter = Array.from(kendte);
    }

    return aendret;
}

export function afslørFalkebueSyn(centerIndex: number) {
    let indeks: number | null = centerIndex;

    for (let afstand = 1; afstand <= 3; afstand++) {
        indeks = hentNaboIRetning(indeks, 'E');
        if (indeks === null) break;

        if (spilTilstand.gitter[indeks] && !spilTilstand.mineKendteFelter.includes(indeks)) {
            spilTilstand.mineKendteFelter.push(indeks);
        }
    }
}

function indeksTilKube(index: number) {
    const bredde = hentKortBredde();
    const raekke = Math.floor(index / bredde);
    const kolonne = index % bredde;
    const x = kolonne - Math.floor(raekke / 2);
    const z = raekke;
    const y = -x - z;
    return { x, y, z };
}

function kubeTilIndeks(kube: { x: number; z: number }) {
    const bredde = hentKortBredde();
    const hoejde = hentKortHoejde();
    const raekke = kube.z;
    const kolonne = kube.x + Math.floor(raekke / 2);
    if (raekke < 0 || raekke >= hoejde || kolonne < 0 || kolonne >= bredde) return null;
    return raekke * bredde + kolonne;
}

function afrundKube(kube: { x: number; y: number; z: number }) {
    let rx = Math.round(kube.x);
    let ry = Math.round(kube.y);
    let rz = Math.round(kube.z);

    const xDiff = Math.abs(rx - kube.x);
    const yDiff = Math.abs(ry - kube.y);
    const zDiff = Math.abs(rz - kube.z);

    if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
    else if (yDiff > zDiff) ry = -rx - rz;
    else rz = -rx - ry;

    return { x: rx, y: ry, z: rz };
}

function erSynBlokeretAfBjerg(centerIndex: number, targetIndex: number) {
    const afstand = regnHexAfstand(centerIndex, targetIndex);
    if (afstand <= 1) return false;

    const start = indeksTilKube(centerIndex);
    const slut = indeksTilKube(targetIndex);

    for (let trin = 1; trin < afstand; trin++) {
        const t = trin / afstand;
        const kube = afrundKube({
            x: start.x + (slut.x - start.x) * t,
            y: start.y + (slut.y - start.y) * t,
            z: start.z + (slut.z - start.z) * t
        });
        const indeks = kubeTilIndeks(kube);
        if (indeks !== null && spilTilstand.gitter[indeks]?.biome === 'bjerg') return true;
    }

    return false;
}

export interface BevaegelseOptions {
    erITaagen: boolean;
    langsomsteDag: number;
    maxDageForan: number;
    synsRadius: number;
    onKameraFoelg?: (nytIndeks: number) => void;
    onBaadStart?: (nytIndeks: number) => void;
}

type AnkomstKilde = 'gang' | 'stav' | 'portal' | 'byg_portal' | 'event';

export interface TeleportOptions {
    kilde: AnkomstKilde;
    afstand?: number;
    kraeverStav?: boolean;
    opretPortalVedStart?: boolean;
    energiPris?: number;
    startLog?: string;
}

interface AnkomstOptions {
    startLog?: string;
    onBaadStart?: (nytIndeks: number) => void;
    triggerPortal?: boolean;
}

function kanPlacerePortal(index: number) {
    const bredde = hentKortBredde();
    return index % bredde <= bredde - 5;
}

function erKoebbarShopVare(id: string) {
    const item = itemDB[id];
    if (!item || item.kanKoebes === false) return false;
    if (id === 'hemmelighed' && !harUtydedeSkattekortSpor()) return false;
    return true;
}

function hentShopPuljeTilErstatning(felt: Felt) {
    const basisPulje = felt.biome === 'marked'
        ? markedVarePool
        : Object.keys(itemDB).filter(k => itemDB[k].pris > 0 && itemDB[k].type !== 'forbandelse' && itemDB[k].type !== 'skat');

    return basisPulje.filter(erKoebbarShopVare);
}

function fyldShopErstatninger(items: string[], felt: Felt, antal: number) {
    const valgte = [...items];
    const brugte = new Set(valgte);
    const pulje = hentShopPuljeTilErstatning(felt)
        .filter(id => !brugte.has(id))
        .sort(() => Math.random() - 0.5);

    const godeErstatninger = pulje.filter(kanModtageItem);
    const resten = pulje.filter(id => !godeErstatninger.includes(id));

    for (const id of [...godeErstatninger, ...resten]) {
        if (valgte.length >= antal) break;
        valgte.push(id);
        brugte.add(id);
    }

    return valgte;
}

function hentKoebbareShopItems(shopItems: string[] | undefined, felt: Felt) {
    const originaleItems = shopItems || [];
    const filtreredeItems = originaleItems.filter(erKoebbarShopVare);

    if (filtreredeItems.length >= originaleItems.length) return filtreredeItems;
    return fyldShopErstatninger(filtreredeItems, felt, originaleItems.length);
}

function naegterHandelTilAktuelSpiller(felt: Felt | null | undefined) {
    return !!spilTilstand.spillerNavn && !!felt?.naegterHandelFor?.includes(spilTilstand.spillerNavn);
}

function skraemNaboHandlende(centerIndeks: number) {
    if (!spilTilstand.spillerNavn) return 0;

    let antal = 0;
    for (const naboIndeks of hentNaboIndices(centerIndeks)) {
        const nabo = spilTilstand.gitter[naboIndeks];
        if (!nabo) continue;

        const harHandel = nabo.hasWorkshop || hentKoebbareShopItems(nabo.shopItems, nabo).length > 0;
        if (!harHandel) continue;

        const naegter = new Set(nabo.naegterHandelFor || []);
        const foer = naegter.size;
        naegter.add(spilTilstand.spillerNavn);
        if (naegter.size === foer) continue;

        nabo.naegterHandelFor = Array.from(naegter);
        spilTilstand.gitter[naboIndeks] = { ...nabo };
        broadcastFelt(naboIndeks, spilTilstand.gitter[naboIndeks]);
        antal++;
    }

    if (antal > 0) {
        spilTilstand.gitter = [...spilTilstand.gitter];
        syncKortTilDbSenere();
    }

    return antal;
}

export function udfoerBevaegelse(nytIndeks: number, options: BevaegelseOptions) {
    if (!spilTilstand.valgtKarakter) return false;

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    if (mig && mig.sidstAktiv && (Date.now() - mig.sidstAktiv > 5 * 60 * 1000) && options.erITaagen) {
        spilTilstand.livspoint = 0;
        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }
        spilTilstand.logBesked = "Du har været væk for længe. Tågen har indhentet dig.";
        syncTilDb(true);
        return false;
    }

    if (spilTilstand.dag >= options.langsomsteDag + options.maxDageForan) {
        spilTilstand.logBesked = 'Du må vente på de andre spillere.';
        startVenteSpil(false);
        return false;
    }

    const felt = spilTilstand.gitter[nytIndeks];
    if (!felt) return false;

    const grundPris = biomeTerraenCost[felt.biome as Biome] || 1;
    const biomeRabat = spilTilstand.valgtKarakter.biomeMod?.[felt.biome as string] || 0;
    const pris = Math.max(1, spilTilstand.valgtKarakter.moveCost + spilTilstand.rygsækEffekt.move + grundPris + biomeRabat);

    const gratisBevaegelse = spilTilstand.gratisNaesteBevaegelse;
    const gratisBevaegelseKilde = spilTilstand.gratisBevaegelseKilde;
    spilTilstand.nuvaerendeEnergi -= gratisBevaegelse ? 0 : (options.erITaagen ? pris + 2 : pris);
    if (gratisBevaegelse) {
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
    }

    const gammelIndex = spilTilstand.spillerIndex;
    spilTilstand.spillerIndex = nytIndeks;
    if (nytIndeks !== gammelIndex) spilTilstand.venteGratisFeltBrugt = null;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(nytIndeks);

    options.onKameraFoelg?.(nytIndeks);
    afslørOmraade(nytIndeks, Math.max(felt.biome === 'bjerg' ? 2 : 1, options.synsRadius));
    const nyKolonne = nytIndeks % hentKortBredde();
    if (nyKolonne > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nyKolonne;

    const ankomstResultat = haandterAnkomstPaaFelt(nytIndeks, 'gang', {
        startLog: gratisBevaegelse ? (gratisBevaegelseKilde === 'bersaerk' ? "Bersærkergangen bærer dig frem. Bevægelsen koster 0 energi." : "Maden holder dig i gang. Bevægelsen koster 0 energi.") : "",
        onBaadStart: options.onBaadStart
    });
    tjekAutoTracker();
    return ankomstResultat;
}

function haandterAnkomstPaaFelt(nytIndeks: number, ankomstKilde: AnkomstKilde, options: AnkomstOptions = {}) {
    const felt = spilTilstand.gitter[nytIndeks];
    let ekstraLog = "";
    let mapAendret = false;
    const charId = spilTilstand.valgtKarakter?.id;

    const nulHp = ['mark', 'by', 'eng', 'marked', 'hoejland', 'skov'];
    const toHp = ['bjerg', 'hule'];
    const erDvaerg = charId === 'dwarf_m' || charId === 'dwarf_f';
    let hpStraf = 0;
    
    if (nulHp.includes(felt.biome as string)) hpStraf = 0;
    else if (toHp.includes(felt.biome as string)) hpStraf = 3;
    if (erDvaerg && felt.biome === 'bjerg') hpStraf = 1;

    if (hpStraf > 0) {
        hpStraf = spilTilstand.beregnSkade(hpStraf);
        spilTilstand.livspoint -= hpStraf;
        ekstraLog += ` Terrænet slider på dig. (-${hpStraf} HP)${udloesBersaerkHvisRelevant(hpStraf)}`;
    }

    const nuBlok = hentAfgroedeBlok(spilTilstand.dag);
    const insektPlageAktiv = erInsektPlageAktiv(spilTilstand.gitter, nuBlok);
    const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok;
    const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok;
    
    if (felt.biome === 'mark' && felt.afgroede && !erSmadret && !erHoestet) {
        const erModen = erAfgroedeModen(felt, nuBlok);
        if (erModen) {
            if (insektPlageAktiv) {
                felt.hoestetFremTilBlok = nuBlok;
                ekstraLog += " Græshopperne har spist den modne afgrøde.";
            } else {
                spilTilstand.livspoint += 3;
                felt.hoestetFremTilBlok = nuBlok;
            }
        } else {
            felt.smadretFremTilBlok = nuBlok + 1;
        }
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
    }

    if (erVandBiome(felt.biome) && !felt.hasBoat) {
        tagSkadeOgTjekDød(30, `Du ender i åbent vand. (-30 HP)`, "Du druknede i det åbne vand.");
        if (spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'dead') {
            return false;
        }
    }

    const b = felt.biome as string;

    if ((charId === 'thief_m' || charId === 'thief_f') && (b === 'marked' || b === 'by')) {
        spilTilstand.guldTotal += 5;
        ekstraLog += " Du finder 5 guld i byens uro.";
    } else if ((charId === 'joker_m' || charId === 'joker_f') && b === 'marked') {
        spilTilstand.guldTotal += 20;
        ekstraLog += " Din optræden giver 20 guld.";
    } else if ((charId === 'royal_m' || charId === 'royal_f') && b === 'by') {
        spilTilstand.guldTotal += 5;
        ekstraLog += " Du opkræver 5 guld i lokal skat.";
    } else if ((charId === 'magician_m' || charId === 'magician_f') && b === 'ritual') {
        spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 5);
        ekstraLog += " Ritualpladsen giver dig 5 HP.";
    }

    const harRunekvist = spilTilstand.mitUdstyr.some(ting => ting.id === 'runekvist' && ting.maengde > 0);
    const harRodhjertet = spilTilstand.mitUdstyr.some(ting => ting.id === 'rodhjertet' && ting.maengde > 0);
    const skjultLiv = felt.skjultLiv ?? 0;
    if (harRunekvist && !felt.gravet && skjultLiv > 0 && spilTilstand.livspoint < spilTilstand.maxLivspoint) {
        const hpFoer = spilTilstand.livspoint;
        spilTilstand.livspoint += harRodhjertet ? skjultLiv * 2 : skjultLiv;
        const faktiskHeling = spilTilstand.livspoint - hpFoer;
        spilTilstand.nuvaerendeEnergi -= 1;
        felt.skjultLiv = 0;
        felt.skjultGuld = 0;
        felt.skjultLoot = null;
        felt.skjultFaelde = false;
        ekstraLog += faktiskHeling > 0
            ? ` Runekvisten trækker rødderne op uden at grave. Jorden falder sammen til sten og orme. (+${faktiskHeling} HP, -1 energi)`
            : " Runekvisten trækker rødderne op uden at grave, men du kan ikke rumme mere liv. Jorden falder sammen til sten og orme. (-1 energi)";
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
    }

    if (felt.hasGoldmine) {
        const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (!spiller.besoegteMiner) spiller.besoegteMiner = [];
        
        const varEjer = felt.mineOwner === spilTilstand.spillerNavn;
        const tidligereEjer = felt.mineOwner;
        const harBesoegt = spiller.besoegteMiner.includes(nytIndeks);
        
        if (!varEjer) {
            if (felt.mineLocked) {
                ekstraLog += " Minen er låst af ejeren.";
            } else {
                const ejedeMiner = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
                felt.mineOwner = spilTilstand.spillerNavn;
                
                if (!harBesoegt) {
                    spiller.besoegteMiner.push(nytIndeks);
                    const basisGuld = 100 + (ejedeMiner * 50);
                    const faktiskGuld = spilTilstand.beregnGuldIndkomst ? spilTilstand.beregnGuldIndkomst(basisGuld) : basisGuld;
                    spilTilstand.guldTotal += faktiskGuld;
                    ekstraLog += tidligereEjer
                        ? ` Du overtager ${tidligereEjer}s mine og udbetaler ${faktiskGuld} guld til dig selv.`
                        : ` Du overtager minen og udbetaler ${faktiskGuld} guld til dig selv.`;
                } else {
                    felt.mineLocked = true;
                    ekstraLog += ` Du låser minen. Andre spillere kan ikke overtage den.`;
                }
                spilTilstand.gitter[nytIndeks] = { ...felt };
                broadcastFelt(nytIndeks, spilTilstand.gitter[nytIndeks]);
                mapAendret = true;
            }
        }
    }

    if (spilTilstand.livspoint <= 0 && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map') {
        fremtvingKollaps(ekstraLog.trim() || "Terrænet tog dine sidste kræfter.");
        spilTilstand.gitter = [...spilTilstand.gitter];
        syncTilDb(mapAendret);
        return false;
    }

    const startLog = options.startLog ?? (
        ankomstKilde === 'gang'
            ? ""
            : ankomstKilde === 'stav' 
            ? "Staven flytter dig fire felter mod øst." 
            : "Portalen slynger dig mod øst."
    );
    const slidLog = felt.hasBoat ? "" : tjekMiljoeSlitage(felt.biome as string);
    const samletLog = `${startLog}${ekstraLog}${slidLog}`.trim();
    
    if (samletLog) {
        spilTilstand.logBesked = samletLog;
    }

    if (options.triggerPortal !== false && felt.hasPortal && hentKoebbareShopItems(felt.shopItems, felt).length === 0 && !felt.hasWorkshop) {
        udfoerPortalTeleport();
        spilTilstand.gitter = [...spilTilstand.gitter];
        syncTilDb(mapAendret);
        return true;
    }

    fremrykTid();
    
    if (felt.hasBoat) {
        const baadeTilbage = Math.max(0, (felt.boatCount || 1) - 1);
        felt.boatCount = baadeTilbage > 0 ? baadeTilbage : undefined;
        felt.hasBoat = baadeTilbage > 0;
        options.onBaadStart?.(nytIndeks);
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = true;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].escapeIndex = nytIndeks;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].escapeIcon = spilTilstand.valgtKarakter?.ikon ?? null;
        }
        spilTilstand.logBesked = "Du går ombord i båden og forlader øen.";
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
        else if (felt.hasWorkshop) {
            if (naegterHandelTilAktuelSpiller(felt)) {
                spilTilstand.logBesked = "Værkstedet lukker porten, da de ser dig. Rygtet om dine smadrede naboer er nået hertil.";
            } else {
                spilTilstand.aktivVaerksted = true;
            }
        }
        else {
            const koebbareShopItems = hentKoebbareShopItems(felt.shopItems, felt);
            if (koebbareShopItems.length > 0) {
                if (naegterHandelTilAktuelSpiller(felt)) {
                    spilTilstand.logBesked = "Boderne lukker skodderne, da de ser dig. Rygtet om dine smadrede naboer er nået hertil.";
                } else {
                    spilTilstand.aktivShop = koebbareShopItems;
                }
            }
        }
    }

    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(mapAendret); // Uploades kun hvis nødvendigt

    if (spilTilstand.livspoint <= 0 && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map') {
        fremtvingKollaps("Kræfterne rev din sidste livsgnist væk.");
    }
    return true;
}

function beregnTeleportMaal(startIndeks: number, afstand: number) {
    const bredde = hentKortBredde();
    const raekke = Math.floor(startIndeks / bredde);
    const kolonne = startIndeks % bredde;
    const nyKolonne = Math.min(kolonne + afstand, bredde - 1);

    return {
        indeks: raekke * bredde + nyKolonne,
        kolonne: nyKolonne
    };
}

function beregnTeleportRuteModOest(startIndeks: number, afstand: number) {
    const rute: number[] = [];
    let nu = startIndeks;

    for (let trin = 0; trin < afstand; trin++) {
        const naeste = hentNaboIRetning(nu, 'E');
        if (naeste === null || naeste === nu) break;
        rute.push(naeste);
        nu = naeste;
    }

    return rute;
}

function nedgraderDragestav() {
    spilTilstand.mitUdstyr = [
        ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'dragestav' && ting.id !== 'stav'),
        { id: 'stav', maengde: 1, anskaffetDag: spilTilstand.dag }
    ];
}

function afslorTeleportRute(rute: number[]) {
    const synsRadius = Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn);

    for (const indeks of rute) {
        const felt = spilTilstand.gitter[indeks];
        afslørOmraade(indeks, Math.max(felt?.biome === 'bjerg' ? 2 : 1, synsRadius));
    }
}

export function udfoerTeleportMedOptions(options: TeleportOptions) {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;

    if (options.kraeverStav) {
        const stavItem = spilTilstand.mitUdstyr.find(i => i.id === 'stav' || i.id === 'dragestav');
        if (!stavItem || stavItem.maengde <= 0) return;
    }

    const pris = options.energiPris ?? spilTilstand.valgtKarakter.baseEnergi;
    spilTilstand.nuvaerendeEnergi -= pris;

    const gammeltIndeks = spilTilstand.spillerIndex;
    const maal = beregnTeleportMaal(gammeltIndeks, options.afstand ?? 4);

    if (options.opretPortalVedStart && kanPlacerePortal(gammeltIndeks)) {
        spilTilstand.gitter[gammeltIndeks].hasPortal = true;
        broadcastFelt(gammeltIndeks, spilTilstand.gitter[gammeltIndeks]);
    }

    spilTilstand.spillerIndex = maal.indeks;
    if (maal.indeks !== gammeltIndeks) spilTilstand.venteGratisFeltBrugt = null;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(maal.indeks);
    
    afslørOmraade(maal.indeks, Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));

    if (maal.kolonne > spilTilstand.maxKolonne) {
        spilTilstand.maxKolonne = maal.kolonne;
    }

    haandterAnkomstPaaFelt(maal.indeks, options.kilde, {
        startLog: options.startLog
    });
    tjekAutoTracker();
    return true;
}

export function udfoerTeleport() {
    const harDragestav = spilTilstand.mitUdstyr.some(i => i.id === 'dragestav' && i.maengde > 0);
    if (harDragestav) return udfoerDrageTeleport();

    return udfoerTeleportMedOptions({
        kilde: 'stav',
        kraeverStav: true,
        startLog: "Staven flytter dig fire felter mod øst."
    });
}

export function udfoerDrageTeleport() {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;

    const dragestav = spilTilstand.mitUdstyr.find(i => i.id === 'dragestav');
    if (!dragestav || dragestav.maengde <= 0) return;

    const gammeltIndeks = spilTilstand.spillerIndex;
    const rute = beregnTeleportRuteModOest(gammeltIndeks, 5);
    if (rute.length === 0) return;

    const planlagtMaal = rute[rute.length - 1];
    const planlagtFelt = spilTilstand.gitter[planlagtMaal];
    let maalIndeks = planlagtMaal;
    let nedgraderet = false;

    if (erVandBiome(planlagtFelt?.biome) && !planlagtFelt.hasBoat) {
        const sikkertMaal = [...rute].reverse().find((indeks) => {
            const felt = spilTilstand.gitter[indeks];
            return felt && (!erVandBiome(felt.biome) || felt.hasBoat);
        });

        maalIndeks = sikkertMaal ?? gammeltIndeks;
        nedgraderDragestav();
        nedgraderet = true;
    }

    const pris = spilTilstand.valgtKarakter.baseEnergi;
    spilTilstand.nuvaerendeEnergi -= pris;
    spilTilstand.spillerIndex = maalIndeks;
    if (maalIndeks !== gammeltIndeks) spilTilstand.venteGratisFeltBrugt = null;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(maalIndeks);

    afslorTeleportRute(rute);

    const kolonne = maalIndeks % hentKortBredde();
    if (kolonne > spilTilstand.maxKolonne) {
        spilTilstand.maxKolonne = kolonne;
    }

    haandterAnkomstPaaFelt(maalIndeks, 'stav', {
        startLog: nedgraderet
            ? "Dragestaven kaster dig mod øst, men åbent vand svarer igen. Den redder dig til sidste sikre felt og brænder ned til en almindelig stav."
            : "Dragestaven flytter dig fem felter mod øst og viser ruten imellem."
    });
    tjekAutoTracker();
    return true;
}

export function udfoerPortalTeleport() {
    const afstand = 4 + Math.floor(Math.random() * 3);
    return udfoerTeleportMedOptions({
        kilde: 'portal',
        afstand,
        startLog: `Portalen slynger dig ${afstand} felter mod øst.`
    });
}

export function hvil() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    const vildmark = ['eng', 'skov', 'mark', 'bjerg', 'hoejland' ];
    
    if (!felt || !vildmark.includes(felt.biome as string)) {
        spilTilstand.logBesked = "Miljøet er uegnet til at slå lejr i.";
        return;
    }
    
    const harSilkesovepose = spilTilstand.mitUdstyr?.some(ting => ting.id === 'silkesovepose');
    const harSovepose = harSilkesovepose || spilTilstand.mitUdstyr?.some(ting => ting.id === 'sovepose');
    if (!harSovepose) {
        spilTilstand.logBesked = "Du mangler en sovepose for at slå lejr.";
        return;
    }

    if ((spilTilstand.nuvaerendeEnergi || 0) >= spilTilstand.valgtKarakter.baseEnergi) {
        spilTilstand.logBesked = "Du er allerede udhvilet.";
        return;
    }

    const heling = harSilkesovepose ? 40 : 20;
    spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + heling); 
    
    spilTilstand.nuvaerendeEnergi = 0;
    
    spilTilstand.logBesked = harSilkesovepose
        ? "Du hviler i silkesoveposen. Du får 40 HP, og tiden går."
        : "Du hviler i soveposen. Du får 20 HP, og tiden går.";
    
    fremrykTid();
    syncTilDb(); // Soveposen ændrer intet i landskabet. Drop (true).
}

export function aktiverHemmelighed() {
    const kort = spilTilstand.mitUdstyr.find(i => i.id === 'hemmelighed');
    if (!kort || kort.maengde <= 0) return;

    brugFraRygsæk('hemmelighed', 1);

    const kendteKortFelter = new Set(spilTilstand.mineSkattekortFelter || []);
    const klynger = hentSkatteKlynger()
        .filter((klynge) => klynge.felter.every((idx) => !kendteKortFelter.has(idx)));

    if (klynger.length > 0) {
        const valgtKlynge = vaelgVægtetSkatteKlynge(klynger, spilTilstand.spillerIndex);
        const nyeKortFelter = new Set(spilTilstand.mineSkattekortFelter || []);
        valgtKlynge.felter.forEach(idx => nyeKortFelter.add(idx));
        spilTilstand.mineSkattekortFelter = Array.from(nyeKortFelter);

        spilTilstand.kameraFokus = valgtKlynge.center;
        spilTilstand.logBesked = "Du læser skattekortet. Det gamle pergament peger på et område, men ikke på sandheden under jorden.";
    } else {
        spilTilstand.guldTotal += 50;
        spilTilstand.logBesked = "Skattekortet er for gammelt. Alle dets mærker fører til steder, du allerede har tydet, men pergamentet er stadig 50 guld værd for en samler.";
    }
    
    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(); // Du ruller et kort ud. Kun dig og din rygsæk er involveret. Drop (true).
}

function hentSkatteKlynger() {
    const grupper = new Map<number, number[]>();

    spilTilstand.gitter.forEach((felt, idx) => {
        if (!felt.isSkatteKlynge) return;
        const id = felt.skatId ?? idx;
        grupper.set(id, [...(grupper.get(id) || []), idx]);
    });

    return Array.from(grupper.entries()).map(([id, felter]) => ({
        id,
        felter,
        center: findSkatteKlyngeCenter(felter)
    }));
}

function harUtydedeSkattekortSpor() {
    const kendteKortFelter = new Set(spilTilstand.mineSkattekortFelter || []);
    return hentSkatteKlynger().some((klynge) => klynge.felter.every((idx) => !kendteKortFelter.has(idx)));
}

function findSkatteKlyngeCenter(klynge: number[]) {
    const klyngeSet = new Set(klynge);
    return klynge.find((index) => hentNaboIndices(index).filter((nabo) => klyngeSet.has(nabo)).length === 6)
        ?? klynge[Math.floor(klynge.length / 2)];
}

function vaelgVægtetSkatteKlynge(klynger: Array<{ id: number; felter: number[]; center: number }>, spillerIndex: number) {
    const bredde = hentKortBredde();
    const vægtede = klynger.map((klynge) => ({
        klynge,
        vægt: 1 / Math.max(1, regnHexAfstand(spillerIndex, klynge.center, bredde))
    }));
    const samletVægt = vægtede.reduce((sum, entry) => sum + entry.vægt, 0);
    let roll = Math.random() * samletVægt;

    for (const entry of vægtede) {
        roll -= entry.vægt;
        if (roll <= 0) return entry.klynge;
    }

    return vægtede[vægtede.length - 1].klynge;
}

function harUdstyr(genstandId: string) {
    return harRygsaekItem(genstandId);
}

function erTyveklasse() {
    const id = spilTilstand.valgtKarakter?.id;
    return id === 'thief_m' || id === 'thief_f';
}

function erTungKrigerklasse() {
    const id = spilTilstand.valgtKarakter?.id;
    return id === 'orc_m' || id === 'orc_f' || id === 'viking_m' || id === 'viking_f' || id === 'knight_m' || id === 'knight_f';
}

export function kanBegaaIndbrudPaaFelt(felt: Felt | null | undefined) {
    if (!felt || felt.indbrudt) return false;
    if (felt.biome !== 'by') return false;
    return !felt.shopItems || felt.shopItems.length === 0;
}

export function kanPlyndreFelt(felt: Felt | null | undefined) {
    if (!felt || felt.plyndret || !harRygsaekItem('koelle')) return false;
    if (felt.hasWorkshop && !harRygsaekItem('koelle_upgr')) return false;
    return felt.biome === 'by' || felt.biome === 'marked';
}

function erHunter() {
    const id = spilTilstand.valgtKarakter?.id;
    return id === 'hunter_m' || id === 'hunter_f';
}

function hentMuligeTrackerMaal() {
    if (!erHunter() || spilTilstand.gameState !== 'play') return [] as string[];

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    if (mig?.aktivTracker && mig.aktivTracker.slutterDag >= spilTilstand.dag) return [];

    const trackede = new Set(mig?.trackedeSpillere || []);

    return Object.entries(spilTilstand.alleSpillere)
        .filter(([navn, spiller]) => {
            if (navn === spilTilstand.spillerNavn) return false;
            if (trackede.has(navn)) return false;
            if (!erFriskAktivSpiller(spiller)) return false;
            return spiller.index === spilTilstand.spillerIndex;
        })
        .map(([navn]) => navn);
}

export function erTrackerAktivPaa(navn: string) {
    const tracker = spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker;
    return !!tracker && tracker.targetNavn === navn && tracker.slutterDag >= spilTilstand.dag;
}

function saetTracker(targetNavn: string, visLog = true) {
    if (!erHunter()) {
        spilTilstand.logBesked = 'Kun jægere kan sætte en tracker.';
        return;
    }

    const target = spilTilstand.alleSpillere[targetNavn];
    if (!target || target.index !== spilTilstand.spillerIndex || !erFriskAktivSpiller(target)) {
        spilTilstand.logBesked = 'Du skal stå på samme felt som spilleren for at sætte en tracker.';
        return;
    }

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn] || {};
    const trackede = mig.trackedeSpillere || [];
    if (mig.aktivTracker && mig.aktivTracker.slutterDag >= spilTilstand.dag) {
        spilTilstand.logBesked = `Du følger allerede ${mig.aktivTracker.targetNavn}s spor.`;
        return;
    }

    if (trackede.includes(targetNavn)) {
        spilTilstand.logBesked = `Du har allerede fulgt ${targetNavn}s spor på denne ø.`;
        return;
    }

    spilTilstand.alleSpillere[spilTilstand.spillerNavn] = {
        ...mig,
        index: spilTilstand.spillerIndex,
        kolonne: spilTilstand.maxKolonne,
        hp: spilTilstand.livspoint,
        guld: spilTilstand.guldTotal,
        isDead: false,
        isWinner: false,
        score: spilTilstand.samletScore,
        retning: spilTilstand.retning,
        turNummer: mig.turNummer || 0,
        aktivTracker: {
            targetNavn,
            slutterDag: spilTilstand.dag + 10
        },
        trackedeSpillere: [...trackede, targetNavn]
    };

    opdaterTrackerSyn();
    if (visLog) {
        spilTilstand.logBesked = `Du følger ${targetNavn}s spor. I ti dage ser du de felter, spilleren ser.`;
    }
    syncTilDb();
}

export function tjekAutoTracker() {
    const maal = hentMuligeTrackerMaal();
    if (maal.length === 0) return false;

    saetTracker(maal[0], true);
    return true;
}

export function opdaterTrackerSyn() {
    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const tracker = mig?.aktivTracker;
    if (!tracker || tracker.slutterDag < spilTilstand.dag) {
        if (tracker && mig) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn] = { ...mig, aktivTracker: null };
            syncTilDb();
        }
        return false;
    }

    const target = spilTilstand.alleSpillere[tracker.targetNavn];
    const felter = new Set(target?.kendteFelter || []);
    if (typeof target?.index === 'number') {
        felter.add(target.index);
    }
    if (felter.size === 0) return false;

    const kendte = new Set(spilTilstand.mineKendteFelter);
    let aendret = false;
    for (const felt of felter) {
        if (!kendte.has(felt)) {
            kendte.add(felt);
            aendret = true;
        }
    }

    if (aendret) {
        spilTilstand.mineKendteFelter = Array.from(kendte);
        syncTilDb();
    }

    return aendret;
}

export function begaaIndbrud() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const indeks = spilTilstand.spillerIndex;
    const felt = spilTilstand.gitter[indeks];

    if (!harUdstyr('dirk')) {
        spilTilstand.logBesked = "Du mangler en dirk.";
        return;
    }

    if (!kanBegaaIndbrudPaaFelt(felt)) {
        spilTilstand.logBesked = "Dirken kan kun bruges på tomme byfelter.";
        return;
    }

    const energiPris = Math.ceil(spilTilstand.valgtKarakter.baseEnergi / 2);
    const harMesterdirk = harRygsaekItem('mesterdirk');
    const basisUdbytte = 35 + Math.floor(Math.random() * 16);
    const udbytte = harMesterdirk ? basisUdbytte * 2 : basisUdbytte;
    const opdagelsesChance = erTyveklasse() ? 0.1 : erTungKrigerklasse() ? 0.45 : 0.25;
    const opdaget = Math.random() < opdagelsesChance;

    spilTilstand.nuvaerendeEnergi -= energiPris;
    felt.indbrudt = true;
    spilTilstand.guldTotal += udbytte;
    spilTilstand.gitter[indeks] = { ...felt };

    if (opdaget) {
        const grundSkade = erTungKrigerklasse() ? 16 : 22;
        tagSkadeOgTjekDød(
            grundSkade,
            `Du begår indbrud${harMesterdirk ? ' med mesterdirken' : ''} og finder ${udbytte} guld. Det koster ${energiPris} energi. Du bliver opdaget og får tæv.`,
            "Vagterne slog dig ihjel."
        );
    } else {
        spilTilstand.logBesked = `Du begår indbrud${harMesterdirk ? ' med mesterdirken' : ''} og finder ${udbytte} guld. Det koster ${energiPris} energi. Ingen når at stoppe dig.`;
    }

    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(indeks, spilTilstand.gitter[indeks]);
    syncKortTilDbSenere();

    if (spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'dead' && spilTilstand.gameState !== 'win_map') {
        fremrykTid();
    }

    syncTilDb();
}

export function plyndrFelt() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const indeks = spilTilstand.spillerIndex;
    const felt = spilTilstand.gitter[indeks];

    if (!harRygsaekItem('koelle')) {
        spilTilstand.logBesked = "Du skal bruge en kølle for at smadre byer og markeder.";
        return;
    }

    if (felt?.hasWorkshop && !harRygsaekItem('koelle_upgr')) {
        spilTilstand.logBesked = "Værkstedets murværk holder. Du skal bruge en opgraderet kølle for at smadre det.";
        return;
    }

    if (!kanPlyndreFelt(felt)) {
        spilTilstand.logBesked = "Køllen kan kun smadre hele by- og markedsfelter.";
        return;
    }

    const varMarked = felt.biome === 'marked';
    const havdeButik = (felt.shopItems || []).some((itemId) => itemDB[itemId]?.kanKoebes !== false);
    const havdeVaerksted = !!felt.hasWorkshop;
    const energiPris = varMarked ? 8 : havdeVaerksted ? 24 : 16;
    const skadePris = varMarked ? 30 : havdeVaerksted ? 75 : 45;
    const kasseIndhold = Math.max(0, felt.kasseGuld || 0);
    const kasseLoot = Math.floor((kasseIndhold * 2) / 3);
    const basisLoot = varMarked
        ? 45 + Math.floor(Math.random() * 31)
        : havdeVaerksted
            ? 225
            : 90 + Math.floor(Math.random() * 61);
    const raaLoot = kasseLoot + basisLoot;
    const loot = spilTilstand.beregnGuldIndkomst(raaLoot);

    spilTilstand.nuvaerendeEnergi -= energiPris;
    spilTilstand.guldTotal += loot;
    felt.plyndret = undefined;
    felt.indbrudt = undefined;
    felt.kasseGuld = undefined;
    felt.naegterHandelFor = undefined;
    felt.biome = 'ruin';
    felt.shopItems = undefined;
    felt.hasWorkshop = false;
    felt.hasPortal = false;
    felt.eventID = undefined;
    felt.eventFuldført = false;
    felt.kanGraves = true;
    spilTilstand.gitter[indeks] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];

    const ekstra = havdeVaerksted
        ? " Værkstedet styrter sammen."
        : havdeButik
            ? " Boderne står tilbage som splinter."
            : "";
    const kasseLog = kasseIndhold > 0 ? " Det meste af kassen ryger med i byttet." : "";
    const skraemteHandlende = skraemNaboHandlende(indeks);
    const skraemmeLog = skraemteHandlende > 0 ? " Naboernes handlende har set nok og nægter at handle med dig." : "";
    const smadreLog = `Du smadrer ${varMarked ? 'markedet' : havdeVaerksted ? 'værkstedet' : 'byen'} i blodrus og skraber ${loot} guld ud af resterne. Det koster ${energiPris} energi.${kasseLog}${ekstra}${skraemmeLog}`;

    broadcastFelt(indeks, spilTilstand.gitter[indeks]);
    syncKortTilDbSenere();

    tagSkadeOgTjekDød(skadePris, smadreLog, "Blodrusen blev for dyr.");

    if (spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'dead' && spilTilstand.gameState !== 'win_map') {
        fremrykTid();
    }

    syncTilDb(true);
}

function findMuligeBaadFelter() {
    const bredde = hentKortBredde();
    const hoejde = hentKortHoejde();
    const kystFelter = new Set<number>();
    for (let r = 1; r < hoejde - 1; r++) {
        const landIndeks = r * bredde + (bredde - 2);
        const vandIndeks = r * bredde + (bredde - 1);
        if (
            !erVandBiome(spilTilstand.gitter[landIndeks]?.biome) &&
            spilTilstand.gitter[vandIndeks]?.biome === 'hav'
        ) {
            kystFelter.add(vandIndeks);
        }
    }

    if (kystFelter.size === 0) {
        for (let indeks = 0; indeks < spilTilstand.gitter.length; indeks++) {
            const felt = spilTilstand.gitter[indeks];
            const kolonne = indeks % bredde;
            if (kolonne < bredde * 0.75 || felt?.biome !== 'hav') continue;

            const naboLand = hentNaboIndices(indeks).some((naboIndeks) => !erVandBiome(spilTilstand.gitter[naboIndeks]?.biome));
            if (naboLand) kystFelter.add(indeks);
        }
    }

    return Array.from(kystFelter);
}

function placerFlugtBaade(antalBaade = 3) {
    const kystFelter = findMuligeBaadFelter();
    if (kystFelter.length === 0) return [];

    for (let i = kystFelter.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kystFelter[i], kystFelter[j]] = [kystFelter[j], kystFelter[i]];
    }

    const valgte: number[] = [];
    for (let i = 0; i < antalBaade; i++) {
        const indeks = kystFelter[i % kystFelter.length];
        spilTilstand.gitter[indeks].hasBoat = true;
        spilTilstand.gitter[indeks].boatCount = Math.max(0, spilTilstand.gitter[indeks].boatCount || 0) + 1;
        valgte.push(indeks);
    }

    return valgte;
}

function findEllerSkabBaad() {
    const eksisterendeBaade = spilTilstand.gitter
        .map((felt, index) => ({ felt, index }))
        .filter(({ felt }) => felt.hasBoat)
        .flatMap(({ felt, index }) => Array.from({ length: Math.max(1, felt.boatCount || 1) }, () => ({ felt, index })));

    if (eksisterendeBaade.length > 0) {
        return eksisterendeBaade[Math.floor(Math.random() * eksisterendeBaade.length)].index;
    }

    const nyeBaade = placerFlugtBaade(1);
    return nyeBaade[0] ?? null;
}

export function lysBaadForAlle() {
    const baadIndex = findEllerSkabBaad();
    if (baadIndex === null) {
        return 'Lyset rammer havet, men finder ingen båd.';
    }

    const kendteFelter = new Set(spilTilstand.mineKendteFelter);
    kendteFelter.add(baadIndex);
    spilTilstand.mineKendteFelter = Array.from(kendteFelter);

    for (const spiller of Object.values(spilTilstand.alleSpillere)) {
        const spillerKendte = new Set(spiller.kendteFelter || []);
        spillerKendte.add(baadIndex);
        spiller.kendteFelter = Array.from(spillerKendte);
    }

    spilTilstand.kameraFokus = baadIndex;
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(baadIndex, spilTilstand.gitter[baadIndex]);
    sendSynSignal(baadIndex, 0, baadIndex);
    syncTilDb();
    syncKortTilDbSenere();

    return 'Lyset finder en båd mod øst. Alle på øen kan se den nu.';
}

export function holdTaagenTilbage(antalDage: number) {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!felt) return;

    felt.taagenHoldtTilDag = Math.max(felt.taagenHoldtTilDag || 0, (spilTilstand.dag || 1) + antalDage);
    spilTilstand.gitter[spilTilstand.spillerIndex] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(spilTilstand.spillerIndex, spilTilstand.gitter[spilTilstand.spillerIndex]);
    syncTilDb();
    syncKortTilDbSenere();
}

export function opretTaageblokker() {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!felt) return;

    felt.taageBlokker = true;
    spilTilstand.gitter[spilTilstand.spillerIndex] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(spilTilstand.spillerIndex, spilTilstand.gitter[spilTilstand.spillerIndex]);
    syncTilDb();
    syncKortTilDbSenere();
}

export function plantSkat(gitter: Felt[]) {
    const bredde = hentKortBredde();
    gitter.forEach(f => {
        f.isSkatteKlynge = false;
        f.tomSkattekiste = false;
        f.skatId = undefined;
    });

    const antalSkatte = beregnAntalSkatte(bredde);
    const brugteCentre: number[] = [];
    const minKol = Math.floor(bredde * 0.35);
    const maxKol = Math.floor(bredde * 0.85);

    for (let skatNr = 0; skatNr < antalSkatte; skatNr++) {
        const zoneStart = minKol + Math.floor(((maxKol - minKol + 1) * skatNr) / antalSkatte);
        const zoneSlut = minKol + Math.floor(((maxKol - minKol + 1) * (skatNr + 1)) / antalSkatte) - 1;
        let muligeCentre = findMuligeSkatteCentre(gitter, Math.max(minKol, zoneStart), Math.min(maxKol, zoneSlut), brugteCentre);

        if (muligeCentre.length === 0) {
            muligeCentre = findMuligeSkatteCentre(gitter, minKol, maxKol, brugteCentre);
        }

        if (muligeCentre.length === 0) continue;

        const center = muligeCentre[Math.floor(Math.random() * muligeCentre.length)];
        brugteCentre.push(center);
        const klynge = [center, ...hentNaboIndices(center)];
        const skatteFelt = klynge[Math.floor(Math.random() * klynge.length)];

        klynge.forEach(idx => {
            gitter[idx].isSkatteKlynge = true;
            gitter[idx].skatId = skatNr + 1;
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

function beregnAntalSkatte(bredde: number) {
    void bredde;
    const roll = Math.random();
    if (roll < 0.45) return 1;
    if (roll < 0.85) return 2;
    return 3;
}

function findMuligeSkatteCentre(gitter: Felt[], minKol: number, maxKol: number, brugteCentre: number[]) {
    const bredde = hentKortBredde();
    const minAfstand = Math.max(4, Math.floor(bredde / 8));
    const muligeCentre: number[] = [];

    for (let i = 0; i < gitter.length; i++) {
        const kol = i % bredde;
        if (kol >= minKol && kol <= maxKol && brugteCentre.every(center => regnHexAfstand(i, center, bredde) >= minAfstand)) {
            const naboer = hentNaboIndices(i);
            if (naboer.length === 6) {
                const alleGyldige = [i, ...naboer].every(idx => {
                    const felt = gitter[idx];
                    return felt.kanGraves && !felt.isSkatteKlynge && !erVandBiome(felt.biome) && felt.biome !== 'by' && felt.biome !== 'marked' && felt.biome !== 'meteor' && !felt.hasPortal && !felt.eventID;
                });
                if (alleGyldige) {
                    muligeCentre.push(i);
                }
            }
        }
    }

    return muligeCentre;
}

function placerVaerksteder(gitter: Felt[]) {
    const besoegte = new Set<number>();

    for (let start = 0; start < gitter.length; start++) {
        if (besoegte.has(start) || gitter[start]?.biome !== 'by') continue;

        const koe = [start];
        const byFelter: number[] = [];
        besoegte.add(start);

        while (koe.length > 0) {
            const indeks = koe.shift()!;
            byFelter.push(indeks);

            for (const nabo of hentNaboIndices(indeks)) {
                if (besoegte.has(nabo) || gitter[nabo]?.biome !== 'by') continue;
                besoegte.add(nabo);
                koe.push(nabo);
            }
        }

        if (byFelter.length < 3) continue;

        const centrum = byFelter
            .map(index => ({
                index,
                naboer: hentNaboIndices(index).filter(nabo => gitter[nabo]?.biome === 'by').length
            }))
            .sort((a, b) => b.naboer - a.naboer || a.index - b.index)[0]?.index;

        if (centrum === undefined) continue;
        const felt = gitter[centrum];
        felt.hasWorkshop = true;
        felt.shopItems = undefined;
        felt.kasseGuld = undefined;
        felt.naegterHandelFor = undefined;
        felt.eventID = undefined;
        felt.hasPortal = false;
    }
}

function placerEkstraGuldmine(gitter: Felt[]) {
    const muligeFelter = gitter
        .map((felt, index) => ({ felt, index }))
        .filter(({ felt }) =>
            felt.biome === 'bjerg' &&
            !felt.hasGoldmine &&
            !felt.eventID &&
            !felt.hasPortal &&
            !felt.hasWorkshop
        )
        .sort(() => Math.random() - 0.5);

    if (muligeFelter[0]) muligeFelter[0].felt.hasGoldmine = true;
}

function ladHavOvertrumfeSoe(raaKort: string[], bredde: number, hoejde: number) {
    const aabne: number[] = [];
    const besoegte = new Set<number>();
    const tilfoejHvisVand = (indeks: number) => {
        if (besoegte.has(indeks) || !erVandBiome(raaKort[indeks])) return;
        besoegte.add(indeks);
        aabne.push(indeks);
    };

    for (let kolonne = 0; kolonne < bredde; kolonne++) {
        tilfoejHvisVand(kolonne);
        tilfoejHvisVand((hoejde - 1) * bredde + kolonne);
    }

    for (let raekke = 1; raekke < hoejde - 1; raekke++) {
        tilfoejHvisVand(raekke * bredde);
        tilfoejHvisVand(raekke * bredde + bredde - 1);
    }

    while (aabne.length > 0) {
        const indeks = aabne.shift()!;
        raaKort[indeks] = 'hav';

        for (const nabo of hentNaboIndices(indeks)) {
            tilfoejHvisVand(nabo);
        }
    }
}

export function initialiserGitter(breddeInput?: number | null, hoejdeInput?: number | null) {
    const { bredde, hoejde } = saetKortDimensioner(breddeInput ?? hentKortBredde(), hoejdeInput ?? hentKortHoejde());
    const antal = bredde * hoejde;
    const totalVaegt = biomeVægte.reduce((sum, biome) => sum + biome.vaegt, 0);

    let raaKort = Array(antal).fill('').map((_, indeks) => {
        const raekke = Math.floor(indeks / bredde);
        const kolonne = indeks % bredde;
        if (raekke === 0 || raekke === hoejde - 1 || kolonne === 0 || kolonne === bredde - 1) return 'hav';
        
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
            const raekke = Math.floor(indeks / bredde);
            const kolonne = indeks % bredde;
            if (raekke === 0 || raekke === hoejde - 1 || kolonne === 0 || kolonne === bredde - 1) continue;
            
            const naboer = hentNaboIndices(indeks);
            if (Math.random() < 0.7) {
                const tilfaeldigNabo = raaKort[naboer[Math.floor(Math.random() * naboer.length)]];
                const erSjaelden = ['hule', 'ritual', 'ruin', 'bandit'].includes(tilfaeldigNabo);
                if (!erSjaelden || Math.random() < 0.1) nytKort[indeks] = tilfaeldigNabo;
            }
        }
        raaKort = nytKort;
    }

    ladHavOvertrumfeSoe(raaKort, bredde, hoejde);

    const bySementer = Math.max(1, Math.round(antal / 333));
    const markedSementer = Math.max(1, Math.round(antal / 300));

    function findBygbareSeeds(undgaaBiomer: string[] = []) {
        const seeds: number[] = [];
        for (let indeks = 0; indeks < antal; indeks++) {
            const raekke = Math.floor(indeks / bredde);
            const kolonne = indeks % bredde;
            if (raekke <= 0 || raekke >= hoejde - 1 || kolonne <= 0 || kolonne >= bredde - 1) continue;
            if (erVandBiome(raaKort[indeks]) || undgaaBiomer.includes(raaKort[indeks])) continue;
            seeds.push(indeks);
        }
        return seeds;
    }

    function findTilfaeldigBygbartSeed(undgaaBiomer: string[] = []) {
        const seeds = findBygbareSeeds(undgaaBiomer);
        if (seeds.length === 0) return Math.floor(antal / 2);
        return seeds[Math.floor(Math.random() * seeds.length)];
    }

    function spredBiome(startIndeks: number, type: 'by' | 'marked', maxStr: number) {
        const aabne = [startIndeks];
        const lukkede = new Set<number>();
        let bygget = 0;

        while (aabne.length > 0 && bygget < maxStr) {
            const nu = aabne.shift()!;
            if (lukkede.has(nu)) continue;
            lukkede.add(nu);

            const raekke = Math.floor(nu / bredde);
            const kolonne = nu % bredde;
            
            if (raekke === 0 || raekke === hoejde - 1 || kolonne === 0 || kolonne === bredde - 1) continue;
            if (erVandBiome(raaKort[nu])) continue;

            raaKort[nu] = type;
            bygget++;

            const naboer = hentNaboIndices(nu).sort(() => Math.random() - 0.5);
            aabne.push(...naboer);
        }
    }

    for (let i = 0; i < bySementer; i++) {
        const seed = findTilfaeldigBygbartSeed();
        const tilfaeldigByStoerrelse = Math.floor(Math.random() * 6) + 5; 
        spredBiome(seed, 'by', tilfaeldigByStoerrelse);
    }
    
    for (let i = 0; i < markedSementer; i++) {
        const seed = findTilfaeldigBygbartSeed(['by']);
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
        'hav': 0.005, 'soe': 0, 'bjerg': 0.01, 'skov': 0.01, 'eng': 0.01, 'mark': 0.01
    };

    const tilfaeldigeFelter = Array.from({length: antal}, (_, i) => i).sort((a, b) => {
        const kolA = a % bredde;
        const kolB = b % bredde;
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
                const event = eventBibliotek[noegle];
                const kolonne = indeks % bredde;
                const kolonnePct = kolonne / Math.max(1, bredde - 1);

                if (event.minKolonnePct !== undefined && kolonnePct < event.minKolonnePct) return false;
                if (event.maxKolonnePct !== undefined && kolonnePct > event.maxKolonnePct) return false;

                const kraevetBiome = event.biome;
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
        
        if (!erVandBiome(felt.biome) && felt.biome !== 'by' && felt.biome !== 'marked' && !felt.eventID && kanPlacerePortal(indeks) && Math.random() < 0.005) {
            felt.hasPortal = true;
        }

        if (erVandBiome(felt.biome) || felt.eventID) continue;

        if (felt.biome === 'bjerg' && Math.random() < 0.05) {
            felt.hasGoldmine = true;
        } else if (vildmark.includes(felt.biome as string) && Math.random() < 0.008) {
            felt.isCampfire = true;
            felt.eventID = 'campfire';
        } else if ((felt.biome === 'by' || felt.biome === 'marked') && !felt.hasPortal) {
            if (Math.random() < 0.6) {
                const antalVarer = felt.biome === 'by' ? 2 : 1;
                const pulje = felt.biome === 'marked' 
                    ? markedVarePool.filter(k => itemDB[k]?.kanKoebes !== false)
                    : Object.keys(itemDB).filter(k => itemDB[k].pris > 0 && itemDB[k].kanKoebes !== false && itemDB[k].type !== 'forbandelse' && itemDB[k].type !== 'skat');                
                const valgte: string[] = [];
                for(let j=0; j < antalVarer; j++) {
                    const vare = pulje[Math.floor(Math.random() * pulje.length)];
                    if (!valgte.includes(vare)) valgte.push(vare);
                }
                felt.shopItems = valgte;
            }
        }
    }

    placerVaerksteder(nytGitter);
    placerEkstraGuldmine(nytGitter);

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
    for (let raekke = 1; raekke < hoejde - 1; raekke++) {
        if (!erVandBiome(spilTilstand.gitter[raekke * bredde + 1].biome)) muligeStartFelter.push(raekke * bredde + 1);
    }
    
    spilTilstand.retning = 'E';
    spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
    
    afslørOmraade(spilTilstand.spillerIndex);
    delNyeKort();
}

export function tjekMiljoeSlitage(biome: string): string {
    const logBeskeder: string[] = [];
    let mistetFintToej = 0;
    let nedgraderetRoyaltToej = 0;
    let nedgraderetMalmviser = false;
    let nedgraderetSilkesovepose = false;

    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter(vare => {
        if (erVandBiome(biome)) {
            if (vare.id === 'rustning' || vare.id === 'kongepanser') {
                logBeskeder.push(vare.id === 'kongepanser' ? "Kongepanseret er for tungt i vandet. Du mister det." : "Rustningen er for tung i vandet. Du mister den.");
                return false;
            }
            if (vare.id === 'fakkel' || vare.id === 'solfakkel') {
                logBeskeder.push(vare.id === 'solfakkel' ? "Vandet slukker din solfakkel." : "Vandet slukker din fakkel.");
                return false;
            }
        } else if (biome === 'hule') {
            if (vare.id === 'royalt_toej') {
                nedgraderetRoyaltToej += vare.maengde;
                logBeskeder.push("Hulen flænser dit royale tøj. Det kan stadig bruges som fint tøj.");
                return false;
            }
            if (vare.id === 'flot_toej') {
                mistetFintToej += vare.maengde;
                logBeskeder.push("Hulen ødelægger dit fine tøj. Du får klude tilbage.");
                return false;
            }
            if (vare.id === 'sovepose') {
                logBeskeder.push("Fugten ødelægger din sovepose.");
                return false;
            }
            if (vare.id === 'silkesovepose') {
                nedgraderetSilkesovepose = true;
                logBeskeder.push("Hulefugten ødelægger foret i silkesoveposen. Den kan stadig bruges som almindelig sovepose.");
                return false;
            }
        } else if (biome === 'blodskov') {
            if (vare.id === 'royalt_toej') {
                nedgraderetRoyaltToej += vare.maengde;
                logBeskeder.push("Tornene flænser dit royale tøj. Det bliver til almindeligt fint tøj.");
                return false;
            }
            if (vare.id === 'flot_toej') {
                mistetFintToej += vare.maengde;
                logBeskeder.push("Tornene ødelægger dit fine tøj.");
                return false;
            }
        } else if (biome === 'krystal') {
            if (vare.id === 'malmviser') {
                logBeskeder.push("Krystallerne får Malmviseren til at hyle. Den kortslutter ned til en almindelig detektor.");
                nedgraderetMalmviser = true;
                return false;
            }
            if (vare.id === 'metaldetektor') {
                logBeskeder.push("Krystallerne ødelægger din metaldetektor.");
                return false;
            }
            if (vare.id === 'kikkert_250' || vare.id === 'kikkert_45') {
                logBeskeder.push("Krystallerne ødelægger kikkertens linser.");
                return false;
            }
        } else if (biome === 'ruin') {
            if (vare.id === 'mad') {
                logBeskeder.push("Skadedyrene i ruinen stjæler din mad.");
                return false;
            }
        } else if (biome === 'ritual') {
            if (vare.id === 'soegekvist') {
                logBeskeder.push("Ritualpladsen ødelægger din søgekvist.");
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

    if (nedgraderetRoyaltToej > 0) {
        spilTilstand.mitUdstyr.push({ id: 'flot_toej', maengde: 1 });
    }

    if (nedgraderetMalmviser) {
        spilTilstand.mitUdstyr.push({ id: 'metaldetektor', maengde: 1 });
    }

    if (nedgraderetSilkesovepose) {
        spilTilstand.mitUdstyr.push({ id: 'sovepose', maengde: 1 });
    }

    return logBeskeder.length > 0 ? " " + logBeskeder.join(" ") : "";
}

export async function sendBaalSignal(centerIndex: number, radius: number) {
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.rumKode) return;
    void supabase.channel(eventKanalNavn()).send({
        type: 'broadcast',
        event: 'baal',
        payload: { ...eventKanalPayload(), centerIndex, radius }
    }).catch((error) => console.warn('Bålsignal kunne ikke sendes', error));
}

export async function sendSynSignal(centerIndex: number, radius: number, fokusIndex: number | null = null) {
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.rumKode) return;
    void supabase.channel(eventKanalNavn()).send({
        type: 'broadcast',
        event: 'syn_signal',
        payload: { ...eventKanalPayload(), centerIndex, radius, fokusIndex }
    }).catch((error) => console.warn('Synssignal kunne ikke sendes', error));
}

export function taendBaal() {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const fakkel = spilTilstand.mitUdstyr.find(i => i.id === 'fakkel' || i.id === 'solfakkel');
    if (!fakkel || fakkel.maengde <= 0) return;

    const erSolfakkel = fakkel.id === 'solfakkel';
    brugFraRygsæk(fakkel.id, 1);

    const radius = Math.max(1, spilTilstand.valgtKarakter.synsRadius + spilTilstand.rygsækEffekt.syn) + (erSolfakkel ? 4 : 2);
    afslørOmraade(spilTilstand.spillerIndex, radius);
    spilTilstand.livspoint = spilTilstand.maxLivspoint;
    spilTilstand.guldTotal += erSolfakkel ? 100 : 50;
    
    spilTilstand.logBesked = erSolfakkel
        ? "Du tænder et solbål. Lyset river tågen op i et stort område, som alle kan se. Folk stimler sammen om flammen: Du får fuld HP og 100 guld."
        : "Du tænder et stort bål. Området omkring dig bliver synligt for alle. Folk stimler sammen om lyset: Du får fuld HP og 50 guld.";
    
    sendBaalSignal(spilTilstand.spillerIndex, radius);
    fremrykTid();
    syncTilDb(); // Tænder bål og rykker tid. Gør intet ved grundkortet. Drop (true).
}

export function bygOgHopGennemPortal() {
    return udfoerTeleportMedOptions({
        kilde: 'byg_portal',
        opretPortalVedStart: true,
        startLog: "Der opstår en portal bag dig. Du flyttes fire felter mod øst."
    });
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
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = 'meteor';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].kasseGuld = undefined;
        felter[idx].naegterHandelFor = undefined;
        felter[idx].hasWorkshop = false;
        felter[idx].eventID = 'meteor_skat';
        felter[idx].eventFuldført = false;
        felter[idx].hasMeteorStone = true;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        tagSkadeOgTjekDød(30, "Meteoren rammer dit felt. (-30 HP)", "Nedslaget dræbte dig.");
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
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        if (erVandBiome(felter[idx].biome)) continue; 
        
        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = Math.random() < 0.2 ? 'ruin' : 'bjerg';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].kasseGuld = undefined;
        felter[idx].naegterHandelFor = undefined;
        felter[idx].hasWorkshop = false;
        felter[idx].eventID = undefined;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        tagSkadeOgTjekDød(40, "Jorden brød op under dig. (-40 HP)", "Jordskælvet dræbte dig.");
    }

    syncTilDb(true); // Landskab skifter fuldstændig. Æd data.
}

function fjernUdstyrVedOversvoemmelse() {
    let mistedeRustning = false;
    let mistedeFakkel = false;

    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter((ting) => {
        if (ting.id === 'rustning' || ting.id === 'kongepanser') {
            mistedeRustning = true;
            return false;
        }
        if (ting.id === 'fakkel' || ting.id === 'solfakkel') {
            mistedeFakkel = true;
            return false;
        }
        return true;
    });

    return { mistedeRustning, mistedeFakkel };
}

function bevarDragestavEfterOversvoemmelse(havdeDragestav: boolean) {
    if (!havdeDragestav) return "";
    if (spilTilstand.mitUdstyr.some((ting) => ting.id === 'dragestav' && ting.maengde > 0)) return "";

    const nedgraderetStav = spilTilstand.mitUdstyr.find((ting) => ting.id === 'stav');
    spilTilstand.mitUdstyr = [
        ...spilTilstand.mitUdstyr.filter((ting) => ting.id !== 'stav'),
        { id: 'dragestav', maengde: nedgraderetStav?.maengde || 1, anskaffetDag: nedgraderetStav?.anskaffetDag ?? spilTilstand.dag }
    ];

    return " Dragestaven ulmer, men oversvømmelsen kan ikke nedgradere den.";
}

export async function udloesOversvoemmelse(centerIndex: number) {
    rystSkaerm(1500);
    const havdeDragestav = spilTilstand.mitUdstyr.some((ting) => ting.id === 'dragestav' && ting.maengde > 0);

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
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = 'hav';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].kasseGuld = undefined;
        felter[idx].naegterHandelFor = undefined;
        felter[idx].hasWorkshop = false;
        felter[idx].eventID = undefined;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        const { mistedeRustning, mistedeFakkel } = fjernUdstyrVedOversvoemmelse();
        const dragestavLog = bevarDragestavEfterOversvoemmelse(havdeDragestav);
        const udstyrsLog = [
            mistedeFakkel ? "Vandet slukker din fakkel." : "",
            mistedeRustning ? "Du mister din rustning i vandet." : "",
            dragestavLog
        ].filter(Boolean).join(" ");

        if (mistedeRustning) {
            tagSkadeOgTjekDød(80, `Oversvømmelsen rammer dig hårdt. ${udstyrsLog}`.trim(), "Du druknede i oversvømmelsen.");
        } else {
            tagSkadeOgTjekDød(30, `Oversvømmelsen rammer dit felt. ${udstyrsLog}`.trim(), "Du druknede i oversvømmelsen.");
        }
    }

    syncTilDb(true); // Bjerge ændres til hav. Enorm opdatering.
}

export async function udloesDoedeSlagmark(centerIndex: number) {
    rystSkaerm(1500);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.80) paavirkede.add(r1);
    }

    const paavirkedeArray = Array.from(paavirkede);
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        if (erVandBiome(felter[idx].biome)) continue;

        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = 'slagmark';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].kasseGuld = undefined;
        felter[idx].naegterHandelFor = undefined;
        felter[idx].eventID = undefined;
        felter[idx].eventFuldført = false;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    syncTilDb(true);
}

export function udloesInsektPlage(centerIndex: number) {
    const blok = hentAfgroedeBlok(spilTilstand.dag);
    const felt = spilTilstand.gitter[centerIndex];
    if (!felt) return 0;

    felt.insektPlageBlok = blok;
    spilTilstand.gitter[centerIndex] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(centerIndex, spilTilstand.gitter[centerIndex]);
    syncTilDb();
    syncKortTilDbSenere();

    const hvedeBlok = erHvedeBlok(blok);
    return spilTilstand.gitter.filter((markFelt) => {
        const erModen = (markFelt.afgroede === 'hvede' && hvedeBlok) || (markFelt.afgroede === 'boenner' && !hvedeBlok);
        const erSmadret = markFelt.smadretFremTilBlok !== undefined && blok <= markFelt.smadretFremTilBlok;
        const erHoestet = markFelt.hoestetFremTilBlok !== undefined && blok <= markFelt.hoestetFremTilBlok;
        return markFelt.biome === 'mark' && erModen && !erSmadret && !erHoestet;
    }).length;
}

export function udvindMeteorSkat(metode: string): { logBesked: string; hpNed?: number; guldOp?: number; itemUd?: string } {
    const pris = spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.baseEnergi * 2 : 10;
    spilTilstand.nuvaerendeEnergi -= pris;
    
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    felt.hasMeteorStone = false;
    broadcastFelt(spilTilstand.spillerIndex, felt);
    
    if (metode === 'haender') {
        return {
            logBesked: `Du får noget af guldet fri af stenen.`,
            hpNed: 20,
            guldOp: 150
        };
    } else {
        return {
            logBesked: `Værktøjet går tabt, men du får stenen åbnet.`,
            guldOp: metode === 'mesterskovl' ? 600 : 300,
            itemUd: 'diamant' 
        };
    }
}

export function nulstilKort() {
    spilTilstand.gitter.forEach(felt => {
        felt.gravet = false;
        felt.eventFuldført = false;
        felt.hasBoat = false;
        felt.boatCount = undefined;
        felt.smadretFremTilBlok = undefined;
        felt.hoestetFremTilBlok = undefined;
        felt.insektPlageBlok = undefined;
        felt.indbrudt = undefined;
        felt.plyndret = undefined;
        felt.kasseGuld = undefined;
        felt.naegterHandelFor = undefined;
        felt.mineOwner = undefined;
        felt.mineLocked = undefined;
        felt.hasMeteorStone = false;
        felt.taagenHoldtTilDag = undefined;
        felt.taageBlokker = undefined;

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
