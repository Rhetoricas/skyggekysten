import { spilTilstand } from './spilTilstand.svelte';
import type { Karakter } from './types';

const OFFLINE_GAME_KEY = 'taage_offline_spil';
const OFFLINE_SCORES_KEY = 'taage_offline_scores';

export interface OfflineScore {
    navn: string;
    score: number;
    karakter?: string;
    oeNavn: string;
    createdAt: string;
}

interface OfflineSnapshot {
    version: 1;
    savedAt: string;
    spillerNavn: string;
    rumKode: string;
    gameMode?: typeof spilTilstand.gameMode;
    erHost: boolean;
    gameState: typeof spilTilstand.gameState;
    gitter: typeof spilTilstand.gitter;
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
    historik: number[];
    nuvaerendeEnergi: number;
    gratisNaesteBevaegelse?: boolean;
    gratisBevaegelseKilde?: '' | 'mad' | 'bersaerk';
    sidsteBersaerkDag?: number;
    musikTaendt: boolean;
}

function harLocalStorage() {
    return typeof localStorage !== 'undefined';
}

export function harOfflineSpil() {
    if (!harLocalStorage()) return false;
    return !!localStorage.getItem(OFFLINE_GAME_KEY);
}

export function hentOfflineSpilInfo() {
    if (!harLocalStorage()) return null;

    try {
        const gemt = localStorage.getItem(OFFLINE_GAME_KEY);
        if (!gemt) return null;
        const data = JSON.parse(gemt) as OfflineSnapshot;
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
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode) return;

    const snapshot: OfflineSnapshot = {
        version: 1,
        savedAt: new Date().toISOString(),
        spillerNavn: spilTilstand.spillerNavn,
        rumKode: spilTilstand.rumKode,
        gameMode: spilTilstand.gameMode,
        erHost: spilTilstand.erHost,
        gameState: spilTilstand.gameState,
        gitter: spilTilstand.gitter,
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
        historik: spilTilstand.historik,
        nuvaerendeEnergi: spilTilstand.nuvaerendeEnergi,
        gratisNaesteBevaegelse: spilTilstand.gratisNaesteBevaegelse,
        gratisBevaegelseKilde: spilTilstand.gratisBevaegelseKilde,
        sidsteBersaerkDag: spilTilstand.sidsteBersaerkDag,
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

        spilTilstand.offlineMode = true;
        spilTilstand.gameMode = data.gameMode === 'open' ? 'open' : 'offline';
        spilTilstand.spillerNavn = data.spillerNavn || 'Spiller';
        spilTilstand.rumKode = data.rumKode || 'offline';
        spilTilstand.erHost = data.erHost;
        spilTilstand.gameState = data.gameState || 'start';
        spilTilstand.gitter = data.gitter || [];
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
        spilTilstand.historik = data.historik || [];
        spilTilstand.nuvaerendeEnergi = data.nuvaerendeEnergi ?? data.valgtKarakter?.baseEnergi ?? 10;
        spilTilstand.gratisNaesteBevaegelse = data.gratisNaesteBevaegelse ?? false;
        spilTilstand.gratisBevaegelseKilde = data.gratisBevaegelseKilde ?? '';
        spilTilstand.sidsteBersaerkDag = data.sidsteBersaerkDag ?? 0;
        spilTilstand.musikTaendt = data.musikTaendt ?? true;
        spilTilstand.statusBesked = 'Offline-spil indlæst.';

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

    const scores = hentOfflineScores();
    const score: OfflineScore = {
        navn: spilTilstand.spillerNavn,
        score: spilTilstand.samletScore,
        karakter: spilTilstand.valgtKarakter?.navn,
        oeNavn: spilTilstand.rumKode,
        createdAt: new Date().toISOString()
    };

    scores.push(score);
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem(OFFLINE_SCORES_KEY, JSON.stringify(scores.slice(0, 50)));
}

export function hentOfflineScores(oeNavn?: string) {
    if (!harLocalStorage()) return [] as OfflineScore[];

    try {
        const gemt = localStorage.getItem(OFFLINE_SCORES_KEY);
        const scores = gemt ? JSON.parse(gemt) as OfflineScore[] : [];
        const filtreret = oeNavn ? scores.filter((score) => score.oeNavn === oeNavn) : scores;
        return filtreret.sort((a, b) => b.score - a.score);
    } catch {
        return [];
    }
}
