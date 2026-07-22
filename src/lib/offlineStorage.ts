import { spilTilstand } from './spilTilstand.svelte';
import { KORT_VERSION, STANDARD_KORT_BREDDE, STANDARD_KORT_HOEJDE } from './kortDimensioner';
import { taelScoreSpillere } from './score';
import type { Felt, GravstenMinde, Karakter } from './types';
import { hentKarakterNavneIKlasse } from './spildata';
import { tekst } from './i18n.svelte';
import { TROFAE_GENERATION } from './klientVersioner';

const OFFLINE_GAME_KEY = 'taage_offline_spil';
const OFFLINE_SCORES_KEY = 'taage_offline_scores';
const OFFLINE_GRAVSTEN_KEY = 'taage_offline_gravsten_v1';

type OfflineGravstenStore = Record<string, Record<string, GravstenMinde[]>>;

export interface OfflineScore {
    rundeId?: string;
    navn: string;
    score: number;
    karakter?: string;
    oeNavn: string;
    createdAt: string;
    erVinder?: boolean;
    erDoed?: boolean;
    doedsAarsag?: 'vand' | 'taage' | null;
    dage?: number;
    guld?: number;
    maxKolonne?: number;
    kendteFelter?: number;
    miner?: number;
    antalSpillere?: number;
}

interface OfflineSnapshot {
    version: 1 | 2;
    kortVersion?: number;
    trofaeGeneration?: number;
    savedAt: string;
    spillerNavn: string;
    rumKode: string;
    rundeSeed?: string;
    gameMode?: typeof spilTilstand.gameMode;
    erHost: boolean;
    gameState: typeof spilTilstand.gameState;
    gitter: typeof spilTilstand.gitter;
    kortBredde?: number;
    kortHoejde?: number;
    spillerIndex: number;
    maxLivspoint: number;
    livspoint: number;
    guldTotal: number;
    valgtKarakter: Karakter | null;
    dag: number;
    retning: string;
    maxKolonne: number;
    samletScore: number;
    logHistorik: string[];
    fogX: number;
    alleSpillere: typeof spilTilstand.alleSpillere;
    mitUdstyr: typeof spilTilstand.mitUdstyr;
    mineKendteFelter: number[];
    mineSkattekortFelter?: number[];
    trofaeStats?: typeof spilTilstand.trofaeStats;
    nyeTrofaeIds?: typeof spilTilstand.nyeTrofaeIds;
    nyeMytiskeTrofaeIds?: typeof spilTilstand.nyeMytiskeTrofaeIds;
    historik: number[];
    nuvaerendeEnergi: number;
    gratisNaesteBevaegelse?: boolean;
    gratisBevaegelseKilde?: '' | 'mad' | 'bersaerk';
    sidsteBersaerkDag?: number;
    harEnergisyn?: boolean;
    musikTaendt: boolean;
}

function harLocalStorage() {
    return typeof localStorage !== 'undefined';
}

function normaliserRumKode(rumKode: string) {
    return (rumKode || '').trim().toLowerCase().slice(0, 20);
}

function normaliserGravstenMinde(minde: unknown): GravstenMinde | null {
    if (!minde || typeof minde !== 'object') return null;
    const data = minde as Partial<GravstenMinde>;
    if (typeof data.ikon !== 'string' || !data.ikon || typeof data.navn !== 'string' || !data.navn) return null;

    const dag = Number(data.dag);
    return {
        ...(typeof data.id === 'string' && data.id ? { id: data.id } : {}),
        ikon: data.ikon,
        navn: data.navn,
        dag: Number.isFinite(dag) ? Math.max(0, Math.floor(dag)) : 0,
        ...(typeof data.tekst === 'string' && data.tekst ? { tekst: data.tekst } : {}),
        ...(typeof data.tidspunkt === 'string' && data.tidspunkt ? { tidspunkt: data.tidspunkt } : {})
    };
}

function gravstenNoegle(minde: GravstenMinde) {
    return minde.id || [minde.ikon, minde.navn, minde.dag, minde.tekst || '', minde.tidspunkt || ''].join('\u0000');
}

function fletGravstenMinder(...samlinger: unknown[]): GravstenMinde[] {
    const resultat: GravstenMinde[] = [];

    for (const samling of samlinger) {
        if (!Array.isArray(samling)) continue;
        for (const raMinde of samling) {
            const minde = normaliserGravstenMinde(raMinde);
            if (!minde) continue;
            const noegle = gravstenNoegle(minde);
            const eksisterendeIndex = resultat.findIndex((andet) => gravstenNoegle(andet) === noegle);
            if (eksisterendeIndex >= 0) resultat.splice(eksisterendeIndex, 1);
            resultat.push(minde);
        }
    }

    return resultat.slice(-3);
}

function hentOfflineGravstenStore(): OfflineGravstenStore {
    if (!harLocalStorage()) return {};
    try {
        const gemt = localStorage.getItem(OFFLINE_GRAVSTEN_KEY);
        const data = gemt ? JSON.parse(gemt) : null;
        return data && typeof data === 'object' && !Array.isArray(data) ? data as OfflineGravstenStore : {};
    } catch {
        return {};
    }
}

function gemOfflineGravstenStore(store: OfflineGravstenStore) {
    if (!harLocalStorage()) return;
    localStorage.setItem(OFFLINE_GRAVSTEN_KEY, JSON.stringify(store));
}

function indlejredeGravsten(felt: Felt): GravstenMinde[] {
    if (felt.gravstenListe?.length) return fletGravstenMinder(felt.gravstenListe);
    if (felt.gravstenIkon) return [{ ikon: felt.gravstenIkon, navn: 'Ukendt', dag: 0 }];
    return [];
}

function huskOfflineGravstenFraGitter(rumKode: string, gitter: Felt[]) {
    const noegle = normaliserRumKode(rumKode);
    if (!harLocalStorage() || !noegle || !Array.isArray(gitter)) return;

    const store = hentOfflineGravstenStore();
    const oeStore = { ...(store[noegle] || {}) };
    let aendret = false;

    gitter.forEach((felt, index) => {
        const indlejrede = indlejredeGravsten(felt);
        if (indlejrede.length === 0) return;
        oeStore[String(index)] = fletGravstenMinder(oeStore[String(index)], indlejrede);
        aendret = true;
    });

    if (aendret) {
        store[noegle] = oeStore;
        gemOfflineGravstenStore(store);
    }
}

export function fletOfflineGravstenIGitter(rumKode: string, gitter: Felt[]): Felt[] {
    const noegle = normaliserRumKode(rumKode);
    if (!noegle || !Array.isArray(gitter)) return gitter;

    huskOfflineGravstenFraGitter(noegle, gitter);
    const oeStore = hentOfflineGravstenStore()[noegle] || {};

    return gitter.map((felt, index) => {
        const minder = fletGravstenMinder(indlejredeGravsten(felt), oeStore[String(index)]);
        if (minder.length === 0) return felt;
        return {
            ...felt,
            gravstenListe: minder,
            gravstenIkon: minder[minder.length - 1].ikon
        };
    });
}

export function gemOfflineGravsten(rumKode: string, feltIndex: number, minde: GravstenMinde): GravstenMinde[] {
    const noegle = normaliserRumKode(rumKode);
    if (!harLocalStorage() || !noegle || !Number.isInteger(feltIndex) || feltIndex < 0) return [];

    const store = hentOfflineGravstenStore();
    const oeStore = { ...(store[noegle] || {}) };
    const minder = fletGravstenMinder(oeStore[String(feltIndex)], [minde]);
    oeStore[String(feltIndex)] = minder;
    store[noegle] = oeStore;
    gemOfflineGravstenStore(store);
    return minder;
}

function erAktueltSnapshot(data: OfflineSnapshot) {
    return data.kortVersion === KORT_VERSION && data.trofaeGeneration === TROFAE_GENERATION;
}

function rensKatastrofeVisuals(gitter: typeof spilTilstand.gitter) {
    return (gitter || []).map((felt) => {
        const renset = { ...felt };
        delete renset.katastrofeFraBiome;
        delete renset.katastrofeVisuelAktiv;
        delete renset.katastrofeVisuelId;
        return renset;
    });
}

export function harOfflineSpil() {
    if (!harLocalStorage()) return false;
    const gemt = localStorage.getItem(OFFLINE_GAME_KEY);
    if (!gemt) return false;

    try {
        const data = JSON.parse(gemt) as OfflineSnapshot;
        if (erAktueltSnapshot(data)) return true;
        huskOfflineGravstenFraGitter(data.rumKode, data.gitter || []);
    } catch {
        // En ulæselig gemning kan ikke fortsættes sikkert.
    }

    localStorage.removeItem(OFFLINE_GAME_KEY);
    return false;
}

export function hentOfflineSpilInfo() {
    if (!harLocalStorage()) return null;

    try {
        const gemt = localStorage.getItem(OFFLINE_GAME_KEY);
        if (!gemt) return null;
        const data = JSON.parse(gemt) as OfflineSnapshot;
        if (!erAktueltSnapshot(data)) return null;
        return {
            spillerNavn: data.spillerNavn,
            rumKode: data.rumKode,
            gameState: data.gameState,
            dag: data.dag,
            savedAt: data.savedAt
        };
    } catch {
        return null;
    }
}

export function gemOfflineSpil() {
    if (!harLocalStorage() || !spilTilstand.offlineMode) return;
    if (spilTilstand.gameMode === 'tutorial') return;
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode) return;

    spilTilstand.gitter = fletOfflineGravstenIGitter(spilTilstand.rumKode, spilTilstand.gitter);

    const snapshot: OfflineSnapshot = {
        version: 2,
        kortVersion: KORT_VERSION,
        trofaeGeneration: TROFAE_GENERATION,
        savedAt: new Date().toISOString(),
        spillerNavn: spilTilstand.spillerNavn,
        rumKode: spilTilstand.rumKode,
        rundeSeed: spilTilstand.rundeSeed,
        gameMode: spilTilstand.gameMode,
        erHost: spilTilstand.erHost,
        gameState: spilTilstand.gameState,
        gitter: rensKatastrofeVisuals(spilTilstand.gitter),
        kortBredde: spilTilstand.kortBredde,
        kortHoejde: spilTilstand.kortHoejde,
        spillerIndex: spilTilstand.spillerIndex,
        maxLivspoint: spilTilstand.maxLivspoint,
        livspoint: spilTilstand.livspoint,
        guldTotal: spilTilstand.guldTotal,
        valgtKarakter: spilTilstand.valgtKarakter,
        dag: spilTilstand.dag,
        retning: spilTilstand.retning,
        maxKolonne: spilTilstand.maxKolonne,
        samletScore: spilTilstand.samletScore,
        logHistorik: spilTilstand.logHistorik,
        fogX: spilTilstand.fogX,
        alleSpillere: spilTilstand.alleSpillere,
        mitUdstyr: spilTilstand.mitUdstyr,
        mineKendteFelter: spilTilstand.mineKendteFelter,
        mineSkattekortFelter: spilTilstand.mineSkattekortFelter,
        trofaeStats: spilTilstand.trofaeStats,
        nyeTrofaeIds: spilTilstand.nyeTrofaeIds,
        nyeMytiskeTrofaeIds: spilTilstand.nyeMytiskeTrofaeIds,
        historik: spilTilstand.historik,
        nuvaerendeEnergi: spilTilstand.nuvaerendeEnergi,
        gratisNaesteBevaegelse: spilTilstand.gratisNaesteBevaegelse,
        gratisBevaegelseKilde: spilTilstand.gratisBevaegelseKilde,
        sidsteBersaerkDag: spilTilstand.sidsteBersaerkDag,
        harEnergisyn: spilTilstand.harEnergisyn,
        musikTaendt: spilTilstand.musikTaendt
    };

    localStorage.setItem(OFFLINE_GAME_KEY, JSON.stringify(snapshot));
}

export function indlaesOfflineSpil() {
    if (!harLocalStorage()) return false;

    try {
        const gemt = localStorage.getItem(OFFLINE_GAME_KEY);
        if (!gemt) return false;
        const data = JSON.parse(gemt) as OfflineSnapshot;
        if (!erAktueltSnapshot(data)) {
            huskOfflineGravstenFraGitter(data.rumKode, data.gitter || []);
            localStorage.removeItem(OFFLINE_GAME_KEY);
            return false;
        }

        spilTilstand.offlineMode = true;
        spilTilstand.gameMode = data.gameMode === 'open' ? 'open' : 'offline';
        spilTilstand.spillerNavn = data.spillerNavn || 'Spiller';
        spilTilstand.rumKode = data.rumKode || 'offline';
        spilTilstand.rundeSeed = data.rundeSeed || spilTilstand.rumKode;
        spilTilstand.erHost = data.erHost;
        spilTilstand.gameState = data.gameState || 'start';
        spilTilstand.kortBredde = data.kortBredde || STANDARD_KORT_BREDDE;
        spilTilstand.kortHoejde = data.kortHoejde || STANDARD_KORT_HOEJDE;
        spilTilstand.gitter = fletOfflineGravstenIGitter(
            data.rumKode,
            rensKatastrofeVisuals(data.gitter || [])
        );
        spilTilstand.spillerIndex = data.spillerIndex || 0;
        spilTilstand.maxLivspoint = data.maxLivspoint || 100;
        spilTilstand.livspoint = data.livspoint ?? data.maxLivspoint ?? 100;
        spilTilstand.guldTotal = data.guldTotal || 0;
        spilTilstand.valgtKarakter = data.valgtKarakter;
        spilTilstand.dag = data.dag || 1;
        spilTilstand.retning = data.retning || 'E';
        spilTilstand.maxKolonne = data.maxKolonne || 0;
        spilTilstand.samletScore = data.samletScore || 0;
        spilTilstand.logHistorik = data.logHistorik || [];
        spilTilstand.fogX = data.fogX || 0;
        spilTilstand.alleSpillere = data.alleSpillere || {};
        spilTilstand.mitUdstyr = data.mitUdstyr || [];
        spilTilstand.mineKendteFelter = data.mineKendteFelter || [];
        spilTilstand.mineSkattekortFelter = data.mineSkattekortFelter || [];
        spilTilstand.trofaeStats = data.trofaeStats || null;
        spilTilstand.nyeTrofaeIds = data.nyeTrofaeIds || [];
        spilTilstand.nyeMytiskeTrofaeIds = data.nyeMytiskeTrofaeIds || [];
        spilTilstand.historik = data.historik || [];
        spilTilstand.nuvaerendeEnergi = data.nuvaerendeEnergi ?? data.valgtKarakter?.baseEnergi ?? 10;
        spilTilstand.gratisNaesteBevaegelse = data.gratisNaesteBevaegelse ?? false;
        spilTilstand.gratisBevaegelseKilde = data.gratisBevaegelseKilde ?? '';
        spilTilstand.sidsteBersaerkDag = data.sidsteBersaerkDag ?? 0;
        spilTilstand.harEnergisyn = data.harEnergisyn ?? false;
        spilTilstand.musikTaendt = data.musikTaendt ?? true;
        spilTilstand.statusBesked = tekst('Dit offline-spil er indlæst.', 'Your offline game is loaded.');

        return true;
    } catch {
        return false;
    }
}

export function sletOfflineSpil() {
    if (!harLocalStorage()) return;
    localStorage.removeItem(OFFLINE_GAME_KEY);
}

export function gemOfflineScore(force = false) {
    if (!harLocalStorage() || (!force && !spilTilstand.offlineMode) || spilTilstand.samletScore <= 0) return;
    if (spilTilstand.gameMode === 'tutorial') return;

    const scores = hentOfflineScores();
    const score: OfflineScore = {
        rundeId: spilTilstand.rundeSeed || undefined,
        navn: spilTilstand.spillerNavn,
        score: spilTilstand.samletScore,
        karakter: spilTilstand.valgtKarakter?.navn,
        oeNavn: spilTilstand.rumKode,
        createdAt: new Date().toISOString(),
        erVinder: spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map',
        erDoed: spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map',
        doedsAarsag: spilTilstand.doedsAarsag,
        dage: spilTilstand.dag,
        guld: spilTilstand.guldTotal,
        maxKolonne: spilTilstand.maxKolonne,
        kendteFelter: spilTilstand.mineKendteFelter?.length || 0,
        miner: spilTilstand.gitter.filter(felt => felt.hasGoldmine && felt.mineOwner === spilTilstand.spillerNavn).length,
        antalSpillere: taelScoreSpillere(spilTilstand.alleSpillere)
    };

    const unikkeScores = new Map<string, OfflineScore>();
    for (const gemtScore of [...scores, score]) {
        const noegle = gemtScore.rundeId
            ? `runde:${gemtScore.rundeId}:${gemtScore.navn}`
            : [
                gemtScore.navn,
                gemtScore.oeNavn,
                gemtScore.score,
                gemtScore.karakter || '',
                gemtScore.erVinder ? 'w' : 'nw',
                gemtScore.erDoed ? 'd' : 'nd',
                gemtScore.dage || 0,
                gemtScore.guld || 0,
                gemtScore.maxKolonne || 0,
                gemtScore.kendteFelter || 0,
                gemtScore.miner || 0,
                gemtScore.antalSpillere || 0
            ].join('|');
        unikkeScores.set(noegle, gemtScore);
    }

    const sorteredeScores = [...unikkeScores.values()].sort((a, b) => b.score - a.score);
    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(sorteredeScores.slice(0, 500)));
}

export function hentOfflineScores(oeNavn?: string, karakterKlasse?: string | null) {
    if (!harLocalStorage()) return [] as OfflineScore[];

    try {
        const gemt = localStorage.getItem(OFFLINE_SCORES_KEY);
        const scores = gemt ? JSON.parse(gemt) as OfflineScore[] : [];
        const klasseNavne = hentKarakterNavneIKlasse(karakterKlasse);
        const filtreret = scores.filter((score) => {
            if (oeNavn && score.oeNavn !== oeNavn) return false;
            if (klasseNavne.length > 0 && !klasseNavne.includes(score.karakter || '')) return false;
            return true;
        });
        return filtreret.sort((a, b) => b.score - a.score);
    } catch {
        return [];
    }
}
