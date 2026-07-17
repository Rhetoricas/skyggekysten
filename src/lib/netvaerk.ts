import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import { authState } from './auth.svelte';
import { gemOfflineGravsten, gemOfflineScore, gemOfflineSpil, hentOfflineScores } from './offlineStorage';
import { beregnSpillerScore, findMedaljeNiveau, findMedaljeSti, taelScoreSpillere } from './score';
import { KORT_VERSION } from './kortDimensioner';
import { hentKarakterKlasseNoegle, hentKarakterNavneIKlasse } from './spildata';
import { tekst } from './i18n.svelte';
import { lavTrofaeMaalinger } from './trofaeer';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Felt, GravstenMinde, SpillerData } from './types';

let syncKoe: ReturnType<typeof setTimeout> | null = null;
let syncKoeRundeId = '';
let kortSkalOpdateres = false;
let kortSkalOpdateresRundeId = '';
let dbSaveKoe: ReturnType<typeof setTimeout> | null = null;
let dbSaveKoeRundeId = '';
let kortSaveKoe: ReturnType<typeof setTimeout> | null = null;
let kortSaveKoeRundeId = '';
let subRumKode = '';
const aktiveGravstenGemninger = new Map<string, Promise<boolean>>();
const ventendeGravstenIHukommelse = new Map<string, VentendeGravsten>();
let gravstenSynkKoe: Promise<void> = Promise.resolve();
let gravstenSynkGeneration = 0;
let realtimeGeneration = 0;
const VENTENDE_HIGHSCORE_KEY = 'taage_pending_highscores';
const VENTENDE_GRAVSTEN_KEY = 'taage_pending_gravsten_v2';
const HIGHSCORE_MAX_PR_NAVN = 3;
const HIGHSCORE_MAX_PR_NAVN_KLASSE = 1;

export function realtimeRumNoegle(rumKode: string) {
    const normaliseret = (rumKode || '').trim().toLowerCase();
    let hash = 2166136261;

    for (let i = 0; i < normaliseret.length; i++) {
        hash ^= normaliseret.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    const laesbarDel = normaliseret.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'oe';
    return `${laesbarDel}_${(hash >>> 0).toString(36)}_v${KORT_VERSION}`;
}

type ScoreRaekke = {
    id?: number;
    user_id?: string;
    player_name: string;
    room_code?: string;
    score: number;
    character?: string;
    is_winner?: boolean;
    is_dead?: boolean;
    death_cause?: 'vand' | 'taage' | null;
    days?: number;
    gold?: number;
    max_column?: number;
    known_fields_count?: number;
    mines_owned?: number;
    player_count?: number;
    final_log?: string | null;
    medal_path?: string | null;
    medal_level?: number | null;
    route_indices?: unknown;
    route_width?: number | null;
    route_height?: number | null;
    trophy_stats?: Record<string, unknown> | null;
    created_at?: string;
};

type HighscorePayload = {
    user_id?: string;
    player_name: string;
    room_code: string;
    score: number;
    character?: string;
    is_winner: boolean;
    is_dead: boolean;
    death_cause?: 'vand' | 'taage' | null;
    days: number;
    gold: number;
    max_column: number;
    known_fields_count: number;
    mines_owned: number;
    player_count: number;
    final_log: string;
    medal_path?: string;
    medal_level?: number;
    route_indices?: number[];
    route_width?: number;
    route_height?: number;
    trophy_stats?: Record<string, unknown>;
};

type VentendeHighscore = HighscorePayload & {
    pending_id: string;
    created_at: string;
};

type VentendeGravsten = {
    rumKode: string;
    kortVersion: number;
    rundeId: string;
    feltIndex: number;
    minde: GravstenMinde & { id: string };
};

const timeoutLabelsEn: Record<string, string> = {
    'Gemning af øen': 'Saving the island',
    'Hentning af aktuel spillerliste': 'Loading the current players',
    'Login-tjek': 'Checking your login',
    'Hentning af ø-session': 'Loading the island',
    'Gemning af afsluttet spiller': 'Saving your finished game',
    'Gemning af score': 'Saving the score',
    'Hentning af ø-score': 'Loading the island leaderboard',
    'Hentning af global score': 'Loading the global leaderboard',
    'Hentning af ugens globale score': "Loading this week's leaderboard",
    'Hentning af filtreret highscore': 'Loading the selected leaderboard',
    'Hentning af highscore-resultat': 'Loading the leaderboard result',
    'Hentning af topmedalje-spil': 'Loading the top medal game',
    'Hentning af offentlig profil': 'Loading the public profile',
    'Hentning af gemt score-id': 'Loading the saved score',
    'Opdatering af highscore-medalje': 'Updating the leaderboard medal',
    'Hentning af global rekord': 'Loading the global record',
    'Gemning af gravsten': 'Saving the memorial',
    'Hentning af gravsten': 'Loading memorials'
};

function medTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(tekst(`${label} tog for lang tid, fordi forbindelsen ikke svarede. Prøv igen.`, `${timeoutLabelsEn[label] || label} took too long because the connection did not respond. Try again.`))),
            ms
        );
        Promise.resolve(promise)
            .then(resolve, reject)
            .finally(() => clearTimeout(timer));
    });
}

function vaelgNyesteSpillerData(serverData?: SpillerData, lokalData?: SpillerData, rundeId?: string) {
    const gyldigServerData = !rundeId || serverData?.rundeSeed === rundeId ? serverData : undefined;
    const gyldigLokalData = !rundeId || lokalData?.rundeSeed === rundeId ? lokalData : undefined;

    if (!gyldigServerData) return gyldigLokalData;
    if (!gyldigLokalData) return gyldigServerData;
    if (gyldigServerData.rundeSeed && gyldigLokalData.rundeSeed && gyldigServerData.rundeSeed !== gyldigLokalData.rundeSeed) return undefined;

    const serverDag = gyldigServerData.dag || 1;
    const lokalDag = gyldigLokalData.dag || 1;
    if (serverDag !== lokalDag) return lokalDag > serverDag ? gyldigLokalData : gyldigServerData;

    return (gyldigLokalData.sidstAktiv || 0) > (gyldigServerData.sidstAktiv || 0) ? gyldigLokalData : gyldigServerData;
}

function harLocalStorage() {
    return typeof localStorage !== 'undefined';
}

function highscorePendingId(payload: HighscorePayload) {
    return [
        payload.user_id ?? 'venter-paa-login',
        payload.player_name,
        payload.room_code,
        payload.score,
        payload.days,
        payload.gold,
        payload.max_column,
        payload.known_fields_count,
        payload.mines_owned,
        payload.player_count,
        payload.is_winner ? 'w' : 'nw',
        payload.is_dead ? 'd' : 'nd'
    ].join('|');
}

function hentVentendeHighscores() {
    if (!harLocalStorage()) return [] as VentendeHighscore[];

    try {
        const gemt = localStorage.getItem(VENTENDE_HIGHSCORE_KEY);
        return gemt ? JSON.parse(gemt) as VentendeHighscore[] : [];
    } catch {
        return [];
    }
}

function gemVentendeHighscores(scores: VentendeHighscore[]) {
    if (!harLocalStorage()) return false;
    try {
        localStorage.setItem(VENTENDE_HIGHSCORE_KEY, JSON.stringify(scores.slice(-20)));
        return true;
    } catch (error) {
        console.warn('Kunne ikke gemme scorekøen lokalt', error);
        return false;
    }
}

function huskVentendeHighscore(payload: HighscorePayload) {
    const pending_id = highscorePendingId(payload);
    const scores = hentVentendeHighscores().filter((score) => score.pending_id !== pending_id);
    scores.push({ ...payload, pending_id, created_at: new Date().toISOString() });
    return gemVentendeHighscores(scores) ? pending_id : null;
}

function fjernVentendeHighscore(pendingId: string | null) {
    if (!pendingId) return;
    gemVentendeHighscores(hentVentendeHighscores().filter((score) => score.pending_id !== pendingId));
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

function normaliserGravstenListe(minder: unknown): GravstenMinde[] {
    if (!Array.isArray(minder)) return [];
    return minder
        .map(normaliserGravstenMinde)
        .filter((minde): minde is GravstenMinde => !!minde)
        .slice(-3);
}

function fletGravstenLister(...lister: unknown[]): GravstenMinde[] {
    const resultat: GravstenMinde[] = [];
    for (const liste of lister) {
        for (const minde of normaliserGravstenListe(liste)) {
            const noegle = minde.id || [minde.ikon, minde.navn, minde.dag, minde.tekst || '', minde.tidspunkt || ''].join('\u0000');
            const eksisterendeIndex = resultat.findIndex((andet) =>
                (andet.id || [andet.ikon, andet.navn, andet.dag, andet.tekst || '', andet.tidspunkt || ''].join('\u0000')) === noegle
            );
            // Serverens placering og data er autoritative. En lokal retry af
            // samme id må ikke flytte mindet frem som kunstigt nyeste.
            if (eksisterendeIndex >= 0) continue;
            resultat.push(minde);
        }
    }
    return resultat.slice(-3);
}

function hentVentendeGravsten(): VentendeGravsten[] {
    let fraLager: VentendeGravsten[] = [];
    try {
        const gemt = harLocalStorage() ? localStorage.getItem(VENTENDE_GRAVSTEN_KEY) : null;
        const data = gemt ? JSON.parse(gemt) : null;
        fraLager = Array.isArray(data) ? data as VentendeGravsten[] : [];
    } catch {
        fraLager = [];
    }

    const samlet = new Map<string, VentendeGravsten>();
    for (const gravsten of fraLager) {
        if (typeof gravsten.minde?.id === 'string') samlet.set(gravsten.minde.id, gravsten);
    }
    for (const [id, gravsten] of ventendeGravstenIHukommelse) samlet.set(id, gravsten);
    return [...samlet.values()].slice(-100);
}

function gemVentendeGravsten(gravsten: VentendeGravsten[]) {
    const seneste = gravsten.slice(-100);
    ventendeGravstenIHukommelse.clear();
    for (const minde of seneste) ventendeGravstenIHukommelse.set(minde.minde.id, minde);
    if (!harLocalStorage()) return;
    try {
        localStorage.setItem(VENTENDE_GRAVSTEN_KEY, JSON.stringify(seneste));
    } catch (error) {
        console.warn('Kunne ikke gemme gravstenskøen lokalt; den bevares i hukommelsen', error);
    }
}

function huskVentendeGravsten(gravsten: VentendeGravsten) {
    const eksisterende = hentVentendeGravsten().filter((anden) => anden.minde?.id !== gravsten.minde.id);
    eksisterende.push(gravsten);
    gemVentendeGravsten(eksisterende);
}

function fjernVentendeGravsten(id: string) {
    gemVentendeGravsten(hentVentendeGravsten().filter((gravsten) => gravsten.minde?.id !== id));
}

function erManglendeRuteKolonneFejl(error: unknown) {
    const besked = error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message).toLowerCase()
        : '';
    return (
        besked.includes('route_indices') ||
        besked.includes('route_width') ||
        besked.includes('route_height')
    );
}

function erManglendeMedaljeKolonneFejl(error: unknown) {
    const besked = error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message).toLowerCase()
        : '';
    return besked.includes('medal_path') || besked.includes('medal_level');
}

function erManglendeTrofaeStatsKolonneFejl(error: unknown) {
    const besked = error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message).toLowerCase()
        : '';
    return besked.includes('trophy_stats');
}

function erManglendeEkstraHighscoreKolonneFejl(error: unknown) {
    return erManglendeRuteKolonneFejl(error) || erManglendeMedaljeKolonneFejl(error) || erManglendeTrofaeStatsKolonneFejl(error);
}

function udenRuteFelter<T extends HighscorePayload>(payload: T) {
    const { route_indices, route_width, route_height, ...udenRute } = payload;
    void route_indices;
    void route_width;
    void route_height;
    return udenRute;
}

function udenMedaljeFelter<T extends HighscorePayload>(payload: T) {
    const { medal_path, medal_level, ...udenMedalje } = payload;
    void medal_path;
    void medal_level;
    return udenMedalje;
}

function udenTrofaeStatsFelt<T extends HighscorePayload>(payload: T) {
    const { trophy_stats, ...udenTrofaeStats } = payload;
    void trophy_stats;
    return udenTrofaeStats;
}

function markerLoginUdlobet() {
    authState.user = null;
    authState.profil = null;
}

function rensVisuelleFeltData(felt: Felt) {
    const renset = { ...felt };
    delete renset.katastrofeFraBiome;
    delete renset.katastrofeVisuelAktiv;
    delete renset.katastrofeVisuelId;
    delete renset.gravstenListe;
    delete renset.gravstenIkon;
    return renset;
}

export function rensKortTilLagring(kort: Felt[]) {
    return kort.map((felt) => rensVisuelleFeltData(felt));
}

const GRUNDFELTER = [
    'grundBiome', 'grundEvent', 'grundIsCampfire', 'grundHasWorkshop', 'grundHasGoldmine',
    'grundHasPortal', 'grundAfgroede', 'grundShopItems', 'grundShopBasisItems'
] as const satisfies ReadonlyArray<keyof Felt>;

function fletIndkommendeFeltMedBaseline(eksisterende: Felt, indkommende: Felt) {
    const flettet = rensVisuelleFeltData({ ...indkommende });
    for (const noegle of GRUNDFELTER) {
        if (flettet[noegle] === undefined && eksisterende[noegle] !== undefined) {
            (flettet as Record<string, unknown>)[noegle] = eksisterende[noegle];
        }
    }
    if (eksisterende.gravstenListe?.length) {
        flettet.gravstenListe = eksisterende.gravstenListe;
        flettet.gravstenIkon = eksisterende.gravstenIkon || eksisterende.gravstenListe.at(-1)?.ikon;
    } else if (eksisterende.gravstenIkon) {
        flettet.gravstenIkon = eksisterende.gravstenIkon;
    }
    return flettet;
}

function erTaageLaengereFremme(nyFogX: number, gammelFogX: number) {
    if (nyFogX < 0 && gammelFogX >= 0) return true;
    if (nyFogX >= 0 && gammelFogX < 0) return false;
    if (nyFogX < 0 && gammelFogX < 0) return Math.abs(nyFogX) > Math.abs(gammelFogX);
    return nyFogX > gammelFogX;
}

function filtrerSpillereTilKanal(spillere: Record<string, SpillerData> = {}, kanalNoegle: string, rumKode: string, rundeId?: string) {
    return Object.fromEntries(
        Object.entries(spillere).filter(([, spiller]) => {
            if (rundeId && spiller.rundeSeed !== rundeId) return false;
            if (spiller.kanalNoegle) return spiller.kanalNoegle === kanalNoegle;
            if (spiller.rumKode) return spiller.rumKode === rumKode;
            return true;
        })
    );
}

function afvisRundeskiftVedGemning() {
    spilTilstand.statusBesked = tekst(
        'Øen er startet forfra i en ny runde. Genindlæs siden, før du fortsætter.',
        'The island has started a new round. Reload the page before continuing.'
    );
}

function logMineEjerskifte(index: number, nytFelt: Felt) {
    const gammeltFelt = spilTilstand.gitter[index];
    if (!gammeltFelt?.hasGoldmine || !nytFelt?.hasGoldmine) return;

    const gammelEjer = gammeltFelt.mineOwner;
    const nyEjer = nytFelt.mineOwner;
    if (gammelEjer === nyEjer) return;

    if (gammelEjer === spilTilstand.spillerNavn && nyEjer && nyEjer !== spilTilstand.spillerNavn) {
        spilTilstand.logBesked = tekst(
            `Du mistede en guldmine til ${nyEjer}.`,
            `You lost a gold mine to ${nyEjer}.`
        );
    }
}

function annullerVentendeSyncFraAndenRunde(rundeId: string) {
    if (syncKoe && syncKoeRundeId !== rundeId) {
        clearTimeout(syncKoe); syncKoe = null; syncKoeRundeId = '';
    }
    if (dbSaveKoe && dbSaveKoeRundeId !== rundeId) {
        clearTimeout(dbSaveKoe); dbSaveKoe = null; dbSaveKoeRundeId = '';
    }
    if (kortSaveKoe && kortSaveKoeRundeId !== rundeId) {
        clearTimeout(kortSaveKoe); kortSaveKoe = null; kortSaveKoeRundeId = '';
    }
    if (kortSkalOpdateres && kortSkalOpdateresRundeId !== rundeId) {
        kortSkalOpdateres = false; kortSkalOpdateresRundeId = '';
    }
}

export function syncKortTilDbSenere(delayMs = 45000) {
    const rundeId = spilTilstand.rundeSeed;
    if (!spilTilstand.offlineMode && !rundeId) return;
    annullerVentendeSyncFraAndenRunde(rundeId);
    if (kortSaveKoe) return;

    kortSaveKoeRundeId = rundeId;
    kortSaveKoe = setTimeout(() => {
        kortSaveKoe = null;
        kortSaveKoeRundeId = '';
        if (!spilTilstand.offlineMode && spilTilstand.rundeSeed !== rundeId) return;
        syncTilDb(true);
    }, delayMs);
}

export async function flushVentendeSync() {
    if (spilTilstand.offlineMode) {
        gemOfflineSpil();
        return true;
    }

    const rundeId = spilTilstand.rundeSeed;
    if (!rundeId) { afvisRundeskiftVedGemning(); return false; }
    annullerVentendeSyncFraAndenRunde(rundeId);

    const harVentendeSync = syncKoe || dbSaveKoe || kortSaveKoe || kortSkalOpdateres;
    if (!harVentendeSync) return true;

    if (syncKoe) {
        clearTimeout(syncKoe);
        syncKoe = null;
        syncKoeRundeId = '';
    }

    if (dbSaveKoe) {
        clearTimeout(dbSaveKoe);
        dbSaveKoe = null;
        dbSaveKoeRundeId = '';
    }

    const sendKort = (kortSkalOpdateres && kortSkalOpdateresRundeId === rundeId) || (kortSaveKoeRundeId === rundeId && !!kortSaveKoe);
    if (kortSaveKoe) {
        clearTimeout(kortSaveKoe);
        kortSaveKoe = null;
        kortSaveKoeRundeId = '';
    }

    kortSkalOpdateres = false;
    kortSkalOpdateresRundeId = '';
    return await medTimeout(udfoerDbUpload(sendKort, rundeId), 12000, 'Gemning af øen').catch((error) => {
        console.error('Kunne ikke gemme ventende sync', error);
        spilTilstand.statusBesked = tekst(
            'Øen blev ikke gemt. Tjek forbindelsen, og prøv igen om lidt.',
            'The island was not saved. Check your connection and try again in a moment.'
        );
        return false;
    });
}

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);
    const rundeSeed = spilTilstand.rundeSeed || (spilTilstand.offlineMode
        ? spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.rundeSeed || `${aktivRumKode}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`
        : '');
    if (!rundeSeed) { afvisRundeskiftVedGemning(); return; }
    spilTilstand.rundeSeed = rundeSeed;
    annullerVentendeSyncFraAndenRunde(rundeSeed);

    const aktuelSpiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (aktuelSpiller?.isWinner ?? false);
    const isDead = !isWinner && (
        spilTilstand.gameState === 'dead' ||
        spilTilstand.gameState === 'dead_map' ||
        (aktuelSpiller?.isDead ?? false)
    );

    const mig = {
        index: spilTilstand.spillerIndex,
        hp: spilTilstand.livspoint,
        maxHp: spilTilstand.maxLivspoint, 
        guld: spilTilstand.guldTotal,
        kolonne: spilTilstand.maxKolonne,
        dag: spilTilstand.dag,
        retning: spilTilstand.retning,
        ikon: spilTilstand.valgtKarakter?.ikon,
        energi: spilTilstand.nuvaerendeEnergi,
        mitUdstyr: spilTilstand.mitUdstyr,
        kendteFelter: spilTilstand.mineKendteFelter,
        skattekortFelter: spilTilstand.mineSkattekortFelter,
        historik: spilTilstand.historik || [],
        tidligereHistorik: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.tidligereHistorik || [],
        isDead: isDead,
        isWinner: isWinner,
        deathCause: isDead ? spilTilstand.doedsAarsag : null,
        escapeIndex: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.escapeIndex ?? null,
        escapeIcon: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.escapeIcon ?? spilTilstand.valgtKarakter?.ikon ?? null,
        sidstAktiv: Date.now(), 
        activeAlarm: false,
        browserId: localStorage.getItem('taage_browser_id'),
        userId: authState.user?.id ?? null,
        rumKode: aktivRumKode,
        kanalNoegle: aktivKanalNoegle,
        rundeSeed,
        besoegteMiner: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.besoegteMiner || [],
        harSkattekort: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.harSkattekort || false,
        aktivTracker: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker || null,
        trackedeSpillere: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.trackedeSpillere || [],
        royalSkatDage: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.royalSkatDage || {},
        piratRovDage: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.piratRovDage || {},
        gratisNaesteBevaegelse: spilTilstand.gratisNaesteBevaegelse,
        gratisBevaegelseKilde: spilTilstand.gratisBevaegelseKilde,
        sidsteBersaerkDag: spilTilstand.sidsteBersaerkDag,
        harEnergisyn: spilTilstand.harEnergisyn,
        venteFriIndtilDag: spilTilstand.venteFriIndtilDag || 0
    };
    const scoreData = {
        ...mig,
        kendteFelter: spilTilstand.mineKendteFelter
    };
    const score = beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, spilTilstand.spillerNavn, scoreData, isWinner, spilTilstand.kortBredde, spilTilstand.kortHoejde);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spilTilstand.alleSpillere[spilTilstand.spillerNavn] = { ...mig, score } as any;

    if (spilTilstand.offlineMode) {
        gemOfflineSpil();
        return;
    }

    if (isDead && !(await flushVentendeGravsten(rundeSeed))) {
        spilTilstand.statusBesked = tekst(
            'Gravstenen er gemt på denne enhed, men forbindelsen svarede ikke. Resultatet sendes, så snart forbindelsen er tilbage.',
            'The memorial is saved on this device, but the connection did not respond. The result will be sent when the connection returns.'
        );
        return;
    }

    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'spiller_sync',
            payload: {
                kanalNoegle: aktivKanalNoegle,
                rumKode: aktivRumKode,
                rundeId: rundeSeed,
                navn: spilTilstand.spillerNavn,
                data: mig,
                fogX: spilTilstand.fogX,
                kortBredde: spilTilstand.kortBredde,
                kortHoejde: spilTilstand.kortHoejde
            }
        });
    }

    if (opdaterKort) {
        kortSkalOpdateres = true;
        kortSkalOpdateresRundeId = rundeSeed;
        if (kortSaveKoe) {
            clearTimeout(kortSaveKoe);
            kortSaveKoe = null;
            kortSaveKoeRundeId = '';
        }
    }

    if (syncKoe) return;

    syncKoeRundeId = rundeSeed;
    syncKoe = setTimeout(async () => {
        syncKoe = null;
        syncKoeRundeId = '';
        if (!spilTilstand.offlineMode && spilTilstand.rundeSeed !== rundeSeed) return;
        
        if (!kortSkalOpdateres || kortSkalOpdateresRundeId !== rundeSeed) {
            if (!dbSaveKoe) {
                dbSaveKoeRundeId = rundeSeed;
                dbSaveKoe = setTimeout(async () => {
                    dbSaveKoe = null;
                    dbSaveKoeRundeId = '';
                    if (!spilTilstand.offlineMode && spilTilstand.rundeSeed !== rundeSeed) return;
                    await udfoerDbUpload(false, rundeSeed);
                }, 10000);
            }
            return;
        }

        if (dbSaveKoe) {
            clearTimeout(dbSaveKoe);
            dbSaveKoe = null;
            dbSaveKoeRundeId = '';
        }

        const sendKort = kortSkalOpdateres && kortSkalOpdateresRundeId === rundeSeed;
        if (sendKort) { kortSkalOpdateres = false; kortSkalOpdateresRundeId = ''; }
        await udfoerDbUpload(sendKort, rundeSeed);
        
    }, 1000); 
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastFelt(index: number, feltData: any) {
    if (spilTilstand.offlineMode) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);
    const rundeId = spilTilstand.rundeSeed;
    if (!rundeId) return;

    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'felt_sync',
            payload: { kanalNoegle: aktivKanalNoegle, rumKode: aktivRumKode, rundeId, index, feltData: rensVisuelleFeltData(feltData) }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastFelter(felter: Array<{ index: number; feltData: any }>) {
    if (spilTilstand.offlineMode) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);
    const rundeId = spilTilstand.rundeSeed;
    if (!rundeId) return;

    if (sub && felter.length > 0) {
        sub.send({
            type: 'broadcast',
            event: 'felter_sync',
            payload: {
                kanalNoegle: aktivKanalNoegle,
                rumKode: aktivRumKode,
                rundeId,
                felter: felter.map(({ index, feltData }) => ({
                    index,
                    feltData: rensVisuelleFeltData(feltData)
                }))
            }
        });
    }
}

function anvendPermanenteGravsten(rumKode: string, feltIndex: number, raMinder: unknown) {
    if (normaliserRumKode(spilTilstand.rumKode) !== normaliserRumKode(rumKode)) return;
    const felt = spilTilstand.gitter[feltIndex];
    if (!felt) return;

    const minder = normaliserGravstenListe(raMinder);
    if (minder.length === 0) return;
    felt.gravstenListe = minder;
    felt.gravstenIkon = minder[minder.length - 1].ikon;
    spilTilstand.gitter = [...spilTilstand.gitter];
}

function koeGravstenOpgave<T>(opgave: () => Promise<T> | T): Promise<T> {
    const resultat = gravstenSynkKoe
        .catch(() => undefined)
        .then(opgave);
    gravstenSynkKoe = resultat.then(() => undefined, () => undefined);
    return resultat;
}

function invaliderGravstenSynkronisering() {
    gravstenSynkGeneration++;
    gravstenSynkKoe = Promise.resolve();
}

async function sendVentendeGravsten(gravsten: VentendeGravsten) {
    const { data, error } = await medTimeout(
        supabase.rpc('registrer_oe_gravsten', {
            p_rum_kode: gravsten.rumKode,
            p_kort_version: gravsten.kortVersion,
            p_runde_id: gravsten.rundeId,
            p_felt_index: gravsten.feltIndex,
            p_minde: gravsten.minde
        }),
        12000,
        'Gemning af gravsten'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error) {
        console.warn('Kunne ikke gemme den permanente gravsten endnu', error);
        const fejltekst = error instanceof Error
            ? error.message
            : typeof error === 'object' && error && 'message' in error
                ? String(error.message)
                : '';
        if (fejltekst.includes('Runden er afsluttet')) fjernVentendeGravsten(gravsten.minde.id);
        return false;
    }

    const minder = normaliserGravstenListe(data);
    if (minder.length === 0) return false;
    fjernVentendeGravsten(gravsten.minde.id);
    await koeGravstenOpgave(() => {
        anvendPermanenteGravsten(gravsten.rumKode, gravsten.feltIndex, minder);
    });
    return true;
}

async function koerGravstenGemning(gravsten: VentendeGravsten) {
    const eksisterende = aktiveGravstenGemninger.get(gravsten.minde.id);
    if (eksisterende) return eksisterende;

    const gemning = sendVentendeGravsten(gravsten);
    aktiveGravstenGemninger.set(gravsten.minde.id, gemning);
    try {
        return await gemning;
    } finally {
        if (aktiveGravstenGemninger.get(gravsten.minde.id) === gemning) {
            aktiveGravstenGemninger.delete(gravsten.minde.id);
        }
    }
}

export async function registrerPermanentGravsten(
    feltIndex: number,
    minde: GravstenMinde & { id: string }
) {
    const rumKode = normaliserRumKode(spilTilstand.rumKode);
    if (!rumKode || !Number.isInteger(feltIndex) || feltIndex < 0) return false;

    if (spilTilstand.offlineMode) {
        const minder = gemOfflineGravsten(rumKode, feltIndex, minde);
        anvendPermanenteGravsten(rumKode, feltIndex, minder);
        return minder.length > 0;
    }

    const rundeId = spilTilstand.rundeSeed;
    if (!rundeId) return false;

    const gravsten: VentendeGravsten = {
        rumKode,
        kortVersion: KORT_VERSION,
        rundeId,
        feltIndex,
        minde
    };
    huskVentendeGravsten(gravsten);
    return koerGravstenGemning(gravsten);
}

export async function flushVentendeGravsten(forventetRundeId = spilTilstand.rundeSeed) {
    if (spilTilstand.offlineMode) return true;
    const rumKode = normaliserRumKode(spilTilstand.rumKode);
    if (!rumKode || !forventetRundeId) return false;

    const relevante = hentVentendeGravsten().filter((gravsten) =>
        gravsten.rumKode === rumKode &&
        gravsten.kortVersion === KORT_VERSION &&
        gravsten.rundeId === forventetRundeId
    );
    for (const gravsten of relevante) {
        await koerGravstenGemning(gravsten);
    }

    return !hentVentendeGravsten().some((gravsten) =>
        gravsten.rumKode === rumKode &&
        gravsten.kortVersion === KORT_VERSION &&
        gravsten.rundeId === forventetRundeId
    );
}

async function retryVentendeGravsten(rumKode: string, forventetRundeId: string) {
    if (spilTilstand.offlineMode) return;
    const normaliseretRum = normaliserRumKode(rumKode);
    const ventende = hentVentendeGravsten().filter((gravsten) =>
        gravsten.rumKode === normaliseretRum &&
        gravsten.kortVersion === KORT_VERSION &&
        gravsten.rundeId === forventetRundeId
    );

    for (const gravsten of ventende) {
        await koerGravstenGemning(gravsten);
    }
}

async function udfoerSynkroniseringAfPermanenteGravsten(
    generation: number,
    forventetRundeId: string,
    rumKode = spilTilstand.rumKode,
    feltIndex?: number
) {
    if (spilTilstand.offlineMode) return true;
    const normaliseretRum = normaliserRumKode(rumKode);
    if (!normaliseretRum) return false;

    let forespoergsel = supabase
        .from('oe_gravsten')
        .select('felt_index,minder')
        .eq('rum_kode', normaliseretRum)
        .eq('kort_version', KORT_VERSION);
    if (Number.isInteger(feltIndex) && (feltIndex as number) >= 0) {
        forespoergsel = forespoergsel.eq('felt_index', feltIndex as number);
    }

    const { data, error } = await medTimeout(
        forespoergsel,
        10000,
        'Hentning af gravsten'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error) {
        console.warn('Kunne ikke hente permanente gravsten', error);
        return false;
    }
    if (generation !== gravstenSynkGeneration ||
        normaliserRumKode(spilTilstand.rumKode) !== normaliseretRum) return false;

    if (Number.isInteger(feltIndex) && (feltIndex as number) >= 0) {
        const raekke = (data || [])[0];
        if (raekke) {
            const ventende = hentVentendeGravsten()
                .filter((gravsten) =>
                    gravsten.rumKode === normaliseretRum &&
                    gravsten.kortVersion === KORT_VERSION &&
                    gravsten.rundeId === forventetRundeId &&
                    gravsten.feltIndex === Number(raekke.felt_index)
                )
                .map((gravsten) => gravsten.minde);
            anvendPermanenteGravsten(
                normaliseretRum,
                Number(raekke.felt_index),
                fletGravstenLister(raekke.minder, ventende)
            );
        }
        return true;
    }

    const minderPrFelt = new Map<number, GravstenMinde[]>((data || []).map((raekke) => [
        Number(raekke.felt_index),
        normaliserGravstenListe(raekke.minder)
    ]));
    for (const gravsten of hentVentendeGravsten()) {
        if (gravsten.rumKode !== normaliseretRum ||
            gravsten.kortVersion !== KORT_VERSION ||
            gravsten.rundeId !== forventetRundeId) continue;
        minderPrFelt.set(
            gravsten.feltIndex,
            fletGravstenLister(minderPrFelt.get(gravsten.feltIndex), [gravsten.minde])
        );
    }
    spilTilstand.gitter = spilTilstand.gitter.map((felt, index) => {
        const renset = { ...felt };
        delete renset.gravstenListe;
        delete renset.gravstenIkon;
        const minder = minderPrFelt.get(index) || [];
        if (minder.length > 0) {
            renset.gravstenListe = minder;
            renset.gravstenIkon = minder[minder.length - 1].ikon;
        }
        return renset;
    });
    return true;
}

export function synkroniserPermanenteGravsten(
    rumKode = spilTilstand.rumKode,
    feltIndex?: number
) {
    const generation = gravstenSynkGeneration;
    const forventetRundeId = spilTilstand.rundeSeed;
    return koeGravstenOpgave(() => udfoerSynkroniseringAfPermanenteGravsten(
        generation,
        forventetRundeId,
        rumKode,
        feltIndex
    ));
}

async function udfoerDbUpload(sendKort: boolean, forventetRundeId = spilTilstand.rundeSeed) {
    if (spilTilstand.offlineMode) {
        gemOfflineSpil();
        return true;
    }
    const capturedRundeId = forventetRundeId;
    if (!capturedRundeId || spilTilstand.rundeSeed !== capturedRundeId) {
        afvisRundeskiftVedGemning();
        return false;
    }
    const lokalSpiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const gemmerDoedsfald = spilTilstand.gameState === 'dead' ||
        spilTilstand.gameState === 'dead_map' ||
        !!lokalSpiller?.isDead;
    if (gemmerDoedsfald && !(await flushVentendeGravsten(capturedRundeId))) return false;

    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

    const { data: aktuelSession, error: hentError } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .select('spillere,kort_version,runde_id')
            .eq('rum_kode', aktivRumKode)
            .maybeSingle(),
        12000,
        'Hentning af aktuel spillerliste'
    );

    if (hentError) {
        console.error('Kunne ikke hente aktuel spillerliste', hentError);
        spilTilstand.statusBesked = tekst(
            'Øen blev ikke gemt. Tjek forbindelsen, og prøv igen om lidt.',
            'The island was not saved. Check your connection and try again in a moment.'
        );
        return false;
    }

    if (Number(aktuelSession?.kort_version) !== KORT_VERSION) {
        spilTilstand.statusBesked = tekst(
            'Spillet er blevet opdateret. Genindlæs siden, før du fortsætter.',
            'The game has been updated. Reload the page before continuing.'
        );
        return false;
    }

    if (aktuelSession?.runde_id !== capturedRundeId || spilTilstand.rundeSeed !== capturedRundeId) {
        console.warn('Afviste gemning fra en forældet runde', { lokalRundeId: capturedRundeId, serverRundeId: aktuelSession?.runde_id });
        afvisRundeskiftVedGemning();
        return false;
    }

    const serverSpillere = filtrerSpillereTilKanal((aktuelSession?.spillere || {}) as Record<string, SpillerData>, aktivKanalNoegle, aktivRumKode, capturedRundeId);
    const lokaleSpillere = filtrerSpillereTilKanal(spilTilstand.alleSpillere, aktivKanalNoegle, aktivRumKode, capturedRundeId);
    const minSpiller = lokaleSpillere[spilTilstand.spillerNavn];
    const spillernavne = new Set([...Object.keys(serverSpillere), ...Object.keys(lokaleSpillere)]);
    const spillereTilUpload = Object.fromEntries(
        Array.from(spillernavne).map((navn) => [
            navn,
            vaelgNyesteSpillerData(serverSpillere[navn], lokaleSpillere[navn], capturedRundeId)
        ]).filter(([, spiller]) => !!spiller)
    ) as Record<string, SpillerData>;
    if (minSpiller) spillereTilUpload[spilTilstand.spillerNavn] = minSpiller;

    const opdatering: { spillere: Record<string, SpillerData>; fog_x: number; kort_bredde: number; kort_hoejde: number; kort_version: number; kort?: Felt[] } = {
        spillere: spillereTilUpload,
        fog_x: Math.round(spilTilstand.fogX),
        kort_bredde: spilTilstand.kortBredde,
        kort_hoejde: spilTilstand.kortHoejde,
        kort_version: KORT_VERSION
    };

    if (sendKort) {
        opdatering.kort = rensKortTilLagring(spilTilstand.gitter);
    }

    const { error, count } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .update(opdatering, { count: 'exact' })
            .eq('rum_kode', aktivRumKode)
            .eq('kort_version', KORT_VERSION)
            .eq('runde_id', capturedRundeId),
        12000,
        'Gemning af øen'
    );

    if (error) {
        console.error('Kunne ikke gemme spil-session', error);
        spilTilstand.statusBesked = tekst(
            'Øen blev ikke gemt. Tjek forbindelsen, og prøv igen om lidt.',
            'The island was not saved. Check your connection and try again in a moment.'
        );
        return false;
    }

    if (count === 0) {
        console.warn('Afviste gemning, fordi runden blev skiftet undervejs', capturedRundeId);
        afvisRundeskiftVedGemning();
        return false;
    }

    return true;
}

function lavAktueltHighscorePayload(userId?: string): HighscorePayload | null {
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode || spilTilstand.samletScore <= 0) return null;

    const minePoint = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
    const antalSpillere = taelScoreSpillere(spilTilstand.alleSpillere);
    const aktuelSpiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (aktuelSpiller?.isWinner ?? false);
    const isDead = !isWinner && (
        spilTilstand.gameState === 'dead' ||
        spilTilstand.gameState === 'dead_map' ||
        (aktuelSpiller?.isDead ?? false)
    );
    const fuldLog = spilTilstand.logHistorik.filter((linje) => linje.includes(' - ')).join('\n') || spilTilstand.logBesked;
    const aktivRute = (spilTilstand.historik || []).filter((index) => Number.isFinite(index));
    // Frys hele resultatet før første await. Ellers kan et langsomt login-tjek
    // nå at læse state fra en efterfølgende runde og gemme et blandet resultat.
    const frossetPayload: HighscorePayload = {
        user_id: userId,
        player_name: authState.profil?.display_name || spilTilstand.spillerNavn,
        room_code: spilTilstand.rumKode,
        score: spilTilstand.samletScore,
        character: spilTilstand.valgtKarakter?.navn,
        is_winner: isWinner,
        is_dead: isDead,
        death_cause: isDead ? spilTilstand.doedsAarsag : null,
        days: spilTilstand.dag,
        gold: spilTilstand.guldTotal,
        max_column: spilTilstand.maxKolonne,
        known_fields_count: spilTilstand.mineKendteFelter?.length || 0,
        mines_owned: minePoint,
        player_count: antalSpillere,
        final_log: fuldLog,
        medal_path: findMedaljeSti(spilTilstand.samletScore, false),
        medal_level: findMedaljeNiveau(spilTilstand.samletScore),
        trophy_stats: lavTrofaeMaalinger()
    };

    if (aktivRute.length > 1) {
        frossetPayload.route_indices = aktivRute;
        frossetPayload.route_width = spilTilstand.kortBredde;
        frossetPayload.route_height = spilTilstand.kortHoejde;
    }

    return frossetPayload;
}

// Resultatet skal ligge i den vedvarende browserkø, før den første
// netværksoperation begynder. Så overlever det genindlæsning, rundeskift og
// forbindelsesudfald og kan sendes af retryVentendeHighscores senere.
export function sikrAktueltResultatLokalt() {
    if (spilTilstand.offlineMode) return true;
    if (spilTilstand.samletScore <= 0) return true;
    const payload = lavAktueltHighscorePayload(authState.user?.id);
    return payload ? huskVentendeHighscore(payload) !== null : false;
}

export async function gemHighscore() {
    if (spilTilstand.offlineMode) {
        gemOfflineScore();
        return true;
    }
    const frossetPayload = lavAktueltHighscorePayload();
    if (!frossetPayload) return false;

    const sessionResultat = await medTimeout(supabase.auth.getSession(), 12000, 'Login-tjek').catch((error) => {
        console.error('Kunne ikke tjekke login før scoregemning', error);
        return null;
    });
    const sessionUser = sessionResultat?.data.session?.user;
    if (!sessionUser) {
        markerLoginUdlobet();
        huskVentendeHighscore(frossetPayload);
        gemOfflineScore(true);
        spilTilstand.statusBesked = tekst(
            'Du er blevet logget ud. Scoren er gemt på denne enhed og sendes, næste gang du logger ind.',
            'You have been logged out. The score is saved on this device and will be sent the next time you log in.'
        );
        return false;
    }

    const payload = { ...frossetPayload, user_id: sessionUser.id };

    const pendingId = huskVentendeHighscore(payload);
    const error = await sendHighscorePayload(payload);

    if (error) {
        console.error('Kunne ikke gemme highscore', error);
        if (error.message.toLowerCase().includes('logget ind')) {
            markerLoginUdlobet();
            spilTilstand.statusBesked = tekst(
                'Du er blevet logget ud. Scoren er gemt på denne enhed og sendes, næste gang du logger ind.',
                'You have been logged out. The score is saved on this device and will be sent the next time you log in.'
            );
            return false;
        }
        gemOfflineScore(true);
        spilTilstand.statusBesked = tekst(
            'Scoren er gemt på denne enhed, men kunne ikke sendes til toplisten endnu. Vi prøver automatisk igen.',
            'The score is saved on this device but could not be sent to the leaderboard yet. We will try again automatically.'
        );
        return false;
    }

    fjernVentendeHighscore(pendingId);
    return true;
}

export async function gemAfsluttetSpillerISession() {
    if (spilTilstand.offlineMode) return true;
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return false;
    const capturedRundeId = spilTilstand.rundeSeed;
    if (!capturedRundeId) { afvisRundeskiftVedGemning(); return false; }

    const eksisterende = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (eksisterende?.isWinner ?? false);
    const isDead = !isWinner && (
        spilTilstand.gameState === 'dead' ||
        spilTilstand.gameState === 'dead_map' ||
        (eksisterende?.isDead ?? false)
    );
    if (!isWinner && !isDead) return true;
    if (isDead && !(await flushVentendeGravsten(capturedRundeId))) return false;

    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);
    const navn = spilTilstand.spillerNavn;
    const afsluttetSpiller: SpillerData = {
        ...(eksisterende || {}),
        index: spilTilstand.spillerIndex,
        hp: spilTilstand.livspoint,
        maxHp: spilTilstand.maxLivspoint,
        guld: spilTilstand.guldTotal,
        kolonne: spilTilstand.maxKolonne,
        dag: spilTilstand.dag,
        retning: spilTilstand.retning,
        ikon: spilTilstand.valgtKarakter?.ikon ?? eksisterende?.ikon,
        energi: spilTilstand.nuvaerendeEnergi,
        mitUdstyr: spilTilstand.mitUdstyr,
        kendteFelter: spilTilstand.mineKendteFelter,
        skattekortFelter: spilTilstand.mineSkattekortFelter,
        historik: spilTilstand.historik || [],
        tidligereHistorik: eksisterende?.tidligereHistorik || [],
        isDead,
        isWinner,
        deathCause: isDead ? spilTilstand.doedsAarsag : null,
        escapeIndex: eksisterende?.escapeIndex ?? null,
        escapeIcon: eksisterende?.escapeIcon ?? spilTilstand.valgtKarakter?.ikon ?? null,
        score: spilTilstand.samletScore,
        turNummer: eksisterende?.turNummer ?? 0,
        rundeSeed: capturedRundeId,
        sidstAktiv: Date.now(),
        activeAlarm: false,
        browserId: localStorage.getItem('taage_browser_id'),
        userId: authState.user?.id ?? null,
        rumKode: aktivRumKode,
        kanalNoegle: aktivKanalNoegle,
        besoegteMiner: eksisterende?.besoegteMiner || [],
        harSkattekort: eksisterende?.harSkattekort || false,
        aktivTracker: null,
        trackedeSpillere: [],
        royalSkatDage: {},
        piratRovDage: {},
        gratisNaesteBevaegelse: false,
        gratisBevaegelseKilde: '',
        sidsteBersaerkDag: spilTilstand.sidsteBersaerkDag,
        harEnergisyn: spilTilstand.harEnergisyn,
        venteFriIndtilDag: spilTilstand.venteFriIndtilDag || 0
    };

    spilTilstand.alleSpillere[navn] = afsluttetSpiller;

    const { data, error: hentError } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .select('spillere,kort_version,runde_id')
            .eq('rum_kode', aktivRumKode)
            .maybeSingle(),
        12000,
        'Hentning af ø-session'
    ).catch((error) => ({ data: null, error }));

    if (hentError) {
        console.error('Kunne ikke hente ø-session ved afslutning', hentError);
        return false;
    }

    if (Number(data?.kort_version) !== KORT_VERSION) {
        console.error('Kunne ikke gemme afsluttet spiller: kortversionen matcher ikke klienten');
        return false;
    }

    if (data?.runde_id !== capturedRundeId || spilTilstand.rundeSeed !== capturedRundeId) {
        console.warn('Afviste afsluttet spiller fra en forældet runde');
        afvisRundeskiftVedGemning();
        return false;
    }

    const serverSpillere = filtrerSpillereTilKanal((data?.spillere || {}) as Record<string, SpillerData>, aktivKanalNoegle, aktivRumKode, capturedRundeId);
    const spillere = {
        ...serverSpillere,
        [navn]: afsluttetSpiller
    };

    const { error: gemError, count } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .update({
                spillere,
                kort: rensKortTilLagring(spilTilstand.gitter),
                fog_x: Math.round(spilTilstand.fogX),
                kort_bredde: spilTilstand.kortBredde,
                kort_hoejde: spilTilstand.kortHoejde,
                kort_version: KORT_VERSION
            }, { count: 'exact' })
            .eq('rum_kode', aktivRumKode)
            .eq('kort_version', KORT_VERSION)
            .eq('runde_id', capturedRundeId),
        12000,
        'Gemning af afsluttet spiller'
    ).catch((error) => ({ error, count: null }));

    if (gemError) {
        console.error('Kunne ikke gemme afsluttet spiller i ø-session', gemError);
        return false;
    }

    if (count === 0) {
        afvisRundeskiftVedGemning();
        return false;
    }

    return true;
}

export async function retryVentendeHighscores() {
    const brugerId = authState.user?.id;
    if (!brugerId || spilTilstand.offlineMode) return 0;

    const sessionResultat = await medTimeout(supabase.auth.getSession(), 12000, 'Login-tjek').catch(() => null);
    if (sessionResultat?.data.session?.user?.id !== brugerId) return 0;

    const ventende = hentVentendeHighscores().filter((score) => !score.user_id || score.user_id === brugerId);
    let gemt = 0;

    for (const score of ventende) {
        const { pending_id, created_at, ...payload } = score;
        void created_at;
        const error = await sendHighscorePayload({ ...payload, user_id: payload.user_id ?? brugerId });
        if (!error) {
            fjernVentendeHighscore(pending_id);
            gemt++;
        }
    }

    return gemt;
}

async function sendHighscorePayload(payload: HighscorePayload) {
    const sessionResultat = await medTimeout(supabase.auth.getSession(), 12000, 'Login-tjek').catch((error) => {
        console.error('Kunne ikke tjekke login før scoregemning', error);
        return null;
    });

    const sessionUser = sessionResultat?.data.session?.user;
    if (!sessionUser) {
        markerLoginUdlobet();
        return new Error('Du er ikke logget ind længere. Scoren er gemt på denne enhed og sendes, når du logger ind igen.');
    }
    let payloadMedBruger = { ...payload, user_id: payload.user_id ?? sessionUser.id };

    let sidsteFejl: Error | null = null;

    for (let forsoeg = 1; forsoeg <= 3; forsoeg++) {
        const findesAllerede = await highscoreFindes(payloadMedBruger).catch(() => false);
        if (findesAllerede) return null;

        try {
            const { error } = await medTimeout(
                supabase.from('game_results').insert([payloadMedBruger]),
                20000,
                'Gemning af score'
            );

            if (!error) return null;
            if (erManglendeMedaljeKolonneFejl(error) && payloadMedBruger.medal_path) {
                payloadMedBruger = udenMedaljeFelter(payloadMedBruger);
                continue;
            }
            if (erManglendeRuteKolonneFejl(error) && payloadMedBruger.route_indices) {
                payloadMedBruger = udenRuteFelter(payloadMedBruger);
                continue;
            }
            if (erManglendeTrofaeStatsKolonneFejl(error) && payloadMedBruger.trophy_stats) {
                payloadMedBruger = udenTrofaeStatsFelt(payloadMedBruger);
                continue;
            }
            sidsteFejl = error;
        } catch (error) {
            sidsteFejl = error instanceof Error ? error : new Error('Scoren kunne ikke gemmes.');
        }

        await new Promise(resolve => setTimeout(resolve, 900 * forsoeg));
    }

    if (await highscoreFindes(payloadMedBruger).catch(() => false)) return null;

    return sidsteFejl ?? new Error('Scoren kunne ikke gemmes.');
}

async function highscoreFindes(payload: HighscorePayload) {
    const { data, error } = await medTimeout(
        supabase
            .from('game_results')
            .select('id')
            .eq('user_id', payload.user_id)
            .eq('room_code', payload.room_code)
            .eq('score', payload.score)
            .eq('days', payload.days)
            .eq('gold', payload.gold)
            .eq('max_column', payload.max_column)
            .eq('is_winner', payload.is_winner)
            .eq('is_dead', payload.is_dead)
            .limit(1),
        12000,
        'Tjek af score'
    );

    if (error) return false;
    return !!data?.length;
}

function normaliserHighscoreNavn(navn?: string | null) {
    return (navn || '').trim().toLowerCase() || 'ukendt';
}

function highscoreKlasseNoegle(karakter?: string | null) {
    return hentKarakterKlasseNoegle(karakter || null) || (karakter || 'ukendt').trim().toLowerCase();
}

function kanVisesPaaTopliste(
    navn: string | null | undefined,
    karakter: string | null | undefined,
    antalPrNavn: Map<string, number>,
    klassePrNavn: Set<string>
) {
    const navnNoegle = normaliserHighscoreNavn(navn);
    const klasseNoegle = highscoreKlasseNoegle(karakter);
    const antalForNavn = antalPrNavn.get(navnNoegle) || 0;
    const navnKlasseNoegle = `${navnNoegle}:${klasseNoegle}`;

    if (antalForNavn >= HIGHSCORE_MAX_PR_NAVN) return false;
    if (klassePrNavn.has(navnKlasseNoegle)) return false;

    antalPrNavn.set(navnNoegle, antalForNavn + 1);
    klassePrNavn.add(navnKlasseNoegle);
    return true;
}

function formaterTopScores(data: ScoreRaekke[] | null | undefined, antal = 10) {
    const unikke = [];
    const antalPrNavn = new Map<string, number>();
    const klassePrNavn = new Set<string>();
    for (const raekke of data || []) {
        if (kanVisesPaaTopliste(raekke.player_name, raekke.character, antalPrNavn, klassePrNavn)) {
            unikke.push({
                id: raekke.id,
                userId: raekke.user_id,
                spillerNavn: raekke.player_name,
                oeNavn: raekke.room_code || '',
                point: raekke.score,
                karakter: raekke.character,
                erVinder: raekke.is_winner,
                erDoed: raekke.is_dead,
                doedsAarsag: raekke.death_cause,
                dage: raekke.days,
                guld: raekke.gold,
                maxKolonne: raekke.max_column,
                kendteFelter: raekke.known_fields_count,
                miner: raekke.mines_owned
            });
            if (unikke.length === antal) break;
        }
    }
    return unikke;
}

function formaterSpillerScores(data: ScoreRaekke[] | null | undefined) {
    return (data || []).map((raekke) => ({
        id: raekke.id,
        userId: raekke.user_id,
        spillerNavn: raekke.player_name,
        oeNavn: raekke.room_code || '',
        point: raekke.score,
        karakter: raekke.character,
        erVinder: raekke.is_winner,
        erDoed: raekke.is_dead,
        doedsAarsag: raekke.death_cause,
        medalPath: raekke.medal_path,
        medalLevel: raekke.medal_level,
        dage: raekke.days,
        guld: raekke.gold,
        maxKolonne: raekke.max_column,
        kendteFelter: raekke.known_fields_count,
        miner: raekke.mines_owned
    }));
}

function formaterOeScores(data: ScoreRaekke[] | null | undefined, antal = 100) {
    const unikke = [];
    const antalPrNavn = new Map<string, number>();
    const klassePrNavn = new Set<string>();
    for (const raekke of data || []) {
        if (kanVisesPaaTopliste(raekke.player_name, raekke.character, antalPrNavn, klassePrNavn)) {
            unikke.push({
                id: raekke.id,
                userId: raekke.user_id,
                navn: raekke.player_name,
                score: raekke.score,
                karakter: raekke.character,
                erVinder: raekke.is_winner,
                erDoed: raekke.is_dead,
                doedsAarsag: raekke.death_cause,
                dage: raekke.days,
                guld: raekke.gold,
                maxKolonne: raekke.max_column,
                kendteFelter: raekke.known_fields_count,
                miner: raekke.mines_owned,
                antalSpillere: raekke.player_count
            });
            if (unikke.length === antal) break;
        }
    }
    return unikke;
}

function filtrerOfflineScoresTilTopliste<T extends { navn?: string; karakter?: string }>(scores: T[], antal = 100) {
    const antalPrNavn = new Map<string, number>();
    const klassePrNavn = new Set<string>();
    const unikke = [];
    for (const score of scores) {
        if (kanVisesPaaTopliste(score.navn, score.karakter, antalPrNavn, klassePrNavn)) {
            unikke.push(score);
            if (unikke.length === antal) break;
        }
    }
    return unikke;
}

function formaterHighscoreResultat(data: ScoreRaekke | null | undefined) {
    if (!data) return null;
    return {
        id: data.id,
        userId: data.user_id,
        navn: data.player_name,
        spillerNavn: data.player_name,
        oeNavn: data.room_code || '',
        point: data.score,
        karakter: data.character,
        erVinder: data.is_winner,
        erDoed: data.is_dead,
        doedsAarsag: data.death_cause,
        dage: data.days,
        guld: data.gold,
        maxKolonne: data.max_column,
        kendteFelter: data.known_fields_count,
        miner: data.mines_owned,
        antalSpillere: data.player_count,
        finalLog: data.final_log,
        medalPath: data.medal_path,
        medalLevel: data.medal_level,
        rute: Array.isArray(data.route_indices) ? data.route_indices.filter((index: unknown) => typeof index === 'number' && Number.isFinite(index)) : undefined,
        ruteBredde: data.route_width,
        ruteHoejde: data.route_height,
        trophyStats: data.trophy_stats && typeof data.trophy_stats === 'object' ? data.trophy_stats : undefined
    };
}

function startPaaAktuelIsoUge() {
    const nu = new Date();
    const start = new Date(nu);
    const dag = start.getDay() || 7;
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - dag + 1);
    return start;
}

export async function hentHighscores(karakterKlasse?: string | null) {
    const klasseNavne = hentKarakterNavneIKlasse(karakterKlasse);
    if (spilTilstand.offlineMode) {
        return filtrerOfflineScoresTilTopliste(hentOfflineScores(spilTilstand.rumKode, karakterKlasse), 100).map((score) => ({
            navn: score.navn,
            score: score.score,
            karakter: score.karakter,
            erVinder: score.erVinder,
            erDoed: score.erDoed,
            doedsAarsag: score.doedsAarsag,
            dage: score.dage,
            guld: score.guld,
            maxKolonne: score.maxKolonne,
            kendteFelter: score.kendteFelter,
            miner: score.miner,
            antalSpillere: score.antalSpillere
        }));
    }

    let query = supabase
        .from('game_results')
        .select('id, user_id, player_name, score, character, is_winner, is_dead, death_cause')
        .eq('room_code', spilTilstand.rumKode);

    if (klasseNavne.length > 0) query = query.in('character', klasseNavne);

    const { data } = await medTimeout(
        query
            .order('score', { ascending: false })
            .limit(500),
        8000,
        'Hentning af ø-score'
    ).catch((error) => {
        console.warn('Kunne ikke hente highscores', error);
        return { data: [] };
    });

    return formaterOeScores(data, 100);
}

export async function hentGlobalTopTi(karakterKlasse?: string | null) {
    return hentGlobalTopHundrede(karakterKlasse).then((scores) => scores.slice(0, 10));
}

export async function hentGlobalTopHundrede(karakterKlasse?: string | null) {
    if (spilTilstand.offlineMode) return [];
    const klasseNavne = hentKarakterNavneIKlasse(karakterKlasse);

    let query = supabase
        .from('game_results')
        .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause');

    if (klasseNavne.length > 0) query = query.in('character', klasseNavne);

    const { data } = await medTimeout(
        query
            .order('score', { ascending: false })
            .limit(500),
        8000,
        'Hentning af global score'
    ).catch((error) => {
        console.warn('Kunne ikke hente global topliste', error);
        return { data: [] };
    });

    return formaterTopScores(data, 100);
}

export async function hentGlobalTopHundredeIUgen(karakterKlasse?: string | null) {
    if (spilTilstand.offlineMode) return [];
    const klasseNavne = hentKarakterNavneIKlasse(karakterKlasse);
    const ugeStart = startPaaAktuelIsoUge().toISOString();

    let query = supabase
        .from('game_results')
        .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause')
        .gte('created_at', ugeStart);

    if (klasseNavne.length > 0) query = query.in('character', klasseNavne);

    const { data } = await medTimeout(
        query
            .order('score', { ascending: false })
            .limit(500),
        8000,
        'Hentning af ugens globale score'
    ).catch((error) => {
        console.warn('Kunne ikke hente ugens globale topliste', error);
        return { data: [] };
    });

    return formaterTopScores(data, 100);
}

export async function hentGlobalHighscoresForFilter(filter: { spillerNavn?: string; brugerId?: string; karakter?: string; karakterKlasse?: string | null; oeNavn?: string }, antal = 100) {
    if (spilTilstand.offlineMode) return [];
    const klasseNavne = filter.karakterKlasse ? hentKarakterNavneIKlasse(filter.karakterKlasse) : [];

    let query = supabase
        .from('game_results')
        .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause');

    if (filter.spillerNavn) query = query.eq('player_name', filter.spillerNavn);
    if (filter.brugerId) query = query.eq('user_id', filter.brugerId);
    if (filter.karakter) query = query.eq('character', filter.karakter);
    if (klasseNavne.length > 0) query = query.in('character', klasseNavne);
    if (filter.oeNavn) query = query.eq('room_code', filter.oeNavn);

    const { data } = await medTimeout(
        query
            .order('score', { ascending: false })
            .limit(Math.max(50, antal * 5)),
        8000,
        'Hentning af filtreret highscore'
    ).catch((error) => {
        console.warn('Kunne ikke hente filtreret highscore', error);
        return { data: [] };
    });

    return formaterTopScores(data, antal);
}

export async function hentSpillerTopScores(filter: { spillerNavn?: string; brugerId?: string }, antal = 3) {
    if (spilTilstand.offlineMode) return [];

    let query = supabase
        .from('game_results')
        .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause, medal_path, medal_level');

    if (filter.brugerId) query = query.eq('user_id', filter.brugerId);
    else if (filter.spillerNavn) query = query.eq('player_name', filter.spillerNavn);
    else return [];

    const { data } = await medTimeout(
        query
            .order('score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(Math.max(1, antal)),
        8000,
        'Hentning af filtreret highscore'
    ).catch((error) => {
        console.warn('Kunne ikke hente spillerens top-scores', error);
        return { data: [] };
    });

    return formaterSpillerScores(data).slice(0, antal);
}

export async function hentOffentligProfil(userId: string | null | undefined) {
    if (!userId || spilTilstand.offlineMode) return null;

    const { data, error } = await medTimeout(
        supabase
            .from('profiles')
            .select('display_name, profile_character_id, trophies, mythic_trophies')
            .eq('id', userId)
            .maybeSingle(),
        8000,
        'Hentning af offentlig profil'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error) {
        console.warn('Kunne ikke hente offentlig profil', error);
        return null;
    }

    return {
        displayName: typeof data?.display_name === 'string' ? data.display_name : '',
        profileCharacterId: typeof data?.profile_character_id === 'string' ? data.profile_character_id : '',
        trophies: Array.isArray(data?.trophies) ? data.trophies : [],
        mythicTrophies: Array.isArray(data?.mythic_trophies) ? data.mythic_trophies : []
    };
}

export async function hentHighscoreDetaljer(id: number) {
    if (spilTilstand.offlineMode) return null;

    let { data, error }: { data: any; error: any } = await medTimeout(
        supabase
            .from('game_results')
            .select('is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log, medal_path, medal_level, route_indices, route_width, route_height, trophy_stats, created_at')
            .eq('id', id)
            .single(),
        8000,
        'Hentning af highscore-detaljer'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error && erManglendeEkstraHighscoreKolonneFejl(error)) {
        const fallback = await supabase
            .from('game_results')
            .select('is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log, created_at')
            .eq('id', id)
            .single();
        data = fallback.data;
        error = fallback.error;
    }

    if (error || !data) {
        console.warn('Kunne ikke hente highscore-detaljer', error);
        return null;
    }

    return {
        erVinder: data.is_winner,
        erDoed: data.is_dead,
        doedsAarsag: data.death_cause,
        dage: data.days,
        guld: data.gold,
        maxKolonne: data.max_column,
        kendteFelter: data.known_fields_count,
        miner: data.mines_owned,
        antalSpillere: data.player_count,
        finalLog: data.final_log,
        medalPath: data.medal_path,
        medalLevel: data.medal_level,
        rute: Array.isArray(data.route_indices) ? data.route_indices.filter((index: unknown) => typeof index === 'number' && Number.isFinite(index)) : undefined,
        ruteBredde: data.route_width,
        ruteHoejde: data.route_height,
        trophyStats: data.trophy_stats && typeof data.trophy_stats === 'object' ? data.trophy_stats : undefined,
        createdAt: data.created_at
    };
}

export async function hentHighscoreResultat(id: number) {
    if (!id || spilTilstand.offlineMode) return null;

    let { data, error }: { data: ScoreRaekke | null; error: any } = await medTimeout(
        supabase
            .from('game_results')
            .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log, medal_path, medal_level, route_indices, route_width, route_height, trophy_stats')
            .eq('id', id)
            .single(),
        8000,
        'Hentning af highscore-resultat'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error && erManglendeEkstraHighscoreKolonneFejl(error)) {
        const fallback = await medTimeout(
            supabase
                .from('game_results')
                .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log')
                .eq('id', id)
                .single(),
            8000,
            'Hentning af highscore-resultat'
        ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));
        data = fallback.data as ScoreRaekke | null;
        error = fallback.error;
    }

    if (error || !data) {
        console.warn('Kunne ikke hente highscore-resultat', error);
        return null;
    }

    return formaterHighscoreResultat(data);
}

export async function hentBedsteHighscoreForBruger(userId: string | null | undefined) {
    if (!userId || spilTilstand.offlineMode) return null;

    let { data, error }: { data: ScoreRaekke | null; error: any } = await medTimeout(
        supabase
            .from('game_results')
            .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log, medal_path, medal_level, route_indices, route_width, route_height, trophy_stats')
            .eq('user_id', userId)
            .order('score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        8000,
        'Hentning af topmedalje-spil'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error && erManglendeEkstraHighscoreKolonneFejl(error)) {
        const fallback = await medTimeout(
            supabase
                .from('game_results')
                .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log')
                .eq('user_id', userId)
                .order('score', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            8000,
            'Hentning af topmedalje-spil'
        ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));
        data = fallback.data as ScoreRaekke | null;
        error = fallback.error;
    }

    if (error || !data) {
        if (error) console.warn('Kunne ikke hente topmedalje-spil', error);
        return null;
    }

    return formaterHighscoreResultat(data as ScoreRaekke);
}

export async function hentBedsteHighscoreForBrugerKarakter(userId: string | null | undefined, karakterNavn: string | null | undefined) {
    if (!userId || !karakterNavn || spilTilstand.offlineMode) return null;

    const { data, error } = await medTimeout(
        supabase
            .from('game_results')
            .select('id, user_id, player_name, room_code, score, character, is_winner, is_dead, death_cause, medal_path, medal_level')
            .eq('user_id', userId)
            .eq('character', karakterNavn)
            .order('score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        8000,
        'Hentning af topmedalje-spil'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error || !data) {
        if (error) console.warn('Kunne ikke hente karakterens topmedalje-spil', error);
        return null;
    }

    return formaterHighscoreResultat(data as ScoreRaekke);
}

export async function hentAktueltHighscoreResultatId() {
    const brugerId = authState.user?.id;
    if (!brugerId || spilTilstand.offlineMode) return null;

    const aktuelSpiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (aktuelSpiller?.isWinner ?? false);
    const isDead = !isWinner && (
        spilTilstand.gameState === 'dead' ||
        spilTilstand.gameState === 'dead_map' ||
        (aktuelSpiller?.isDead ?? false)
    );

    const { data, error } = await medTimeout(
        supabase
            .from('game_results')
            .select('id')
            .eq('user_id', brugerId)
            .eq('room_code', spilTilstand.rumKode)
            .eq('score', spilTilstand.samletScore)
            .eq('days', spilTilstand.dag)
            .eq('gold', spilTilstand.guldTotal)
            .eq('max_column', spilTilstand.maxKolonne)
            .eq('known_fields_count', spilTilstand.mineKendteFelter?.length || 0)
            .eq('is_winner', isWinner)
            .eq('is_dead', isDead)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        8000,
        'Hentning af gemt score-id'
    ).catch((fangetFejl) => ({ data: null, error: fangetFejl }));

    if (error || !data?.id) {
        if (error) console.warn('Kunne ikke hente gemt score-id', error);
        return null;
    }

    return data.id as number;
}

export async function opdaterHighscoreMedalje(id: number | undefined, score: number, erNyGlobalRekord: boolean) {
    if (!id || spilTilstand.offlineMode) return false;

    const medalPath = findMedaljeSti(score, erNyGlobalRekord);
    const medalLevel = findMedaljeNiveau(score) + (erNyGlobalRekord ? 1 : 0);
    const { error } = await medTimeout(
        supabase
            .from('game_results')
            .update({ medal_path: medalPath, medal_level: medalLevel })
            .eq('id', id),
        8000,
        'Opdatering af highscore-medalje'
    ).catch((fangetFejl) => {
        console.warn('Kunne ikke opdatere highscore-medalje', fangetFejl);
        return { error: fangetFejl };
    });

    if (error) {
        if (!erManglendeMedaljeKolonneFejl(error)) console.warn('Kunne ikke opdatere highscore-medalje', error);
        return false;
    }

    return true;
}

export async function hentGlobalTopScore(karakterKlasse?: string | null) {
    if (spilTilstand.offlineMode) return 0;
    const klasseNavne = hentKarakterNavneIKlasse(karakterKlasse);

    let query = supabase
        .from('game_results')
        .select('score');

    if (klasseNavne.length > 0) query = query.in('character', klasseNavne);

    const { data } = await medTimeout(
        query
            .order('score', { ascending: false })
            .limit(1),
        8000,
        'Hentning af global rekord'
    ).catch((error) => {
        console.warn('Kunne ikke hente global topscore', error);
        return { data: [] };
    });

    return data?.[0]?.score ?? 0;
}

let sub: RealtimeChannel | null = null;
export function startRealtime(forceReconnect = false) {
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.rumKode) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);
    const aktivRundeId = spilTilstand.rundeSeed;

    if (forceReconnect && sub) stopRealtime();
    if (sub && subRumKode === aktivKanalNoegle) {
        void (async () => {
            await retryVentendeGravsten(aktivRumKode, aktivRundeId);
            await synkroniserPermanenteGravsten(aktivRumKode);
        })();
        return;
    }
    if (sub) stopRealtime();

    subRumKode = aktivKanalNoegle;
    const denneRealtimeGeneration = ++realtimeGeneration;
    sub = supabase
        .channel(`room:${aktivKanalNoegle}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'spiller_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data?.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode ||
                typeof data?.rundeId !== 'string' || !spilTilstand.rundeSeed ||
                data.rundeId !== spilTilstand.rundeSeed || data.data?.rundeSeed !== data.rundeId) return;
            if (data.navn !== spilTilstand.spillerNavn) {
                if (typeof data.kortBredde === 'number') spilTilstand.kortBredde = data.kortBredde;
                if (typeof data.kortHoejde === 'number') spilTilstand.kortHoejde = data.kortHoejde;
                const eksisterende = spilTilstand.alleSpillere[data.navn];
                const nyeste = vaelgNyesteSpillerData(eksisterende, data.data, data.rundeId);
                if (nyeste) spilTilstand.alleSpillere[data.navn] = nyeste;
                if (data.fogX !== undefined && erTaageLaengereFremme(data.fogX, spilTilstand.fogX)) {
                    spilTilstand.fogX = data.fogX;
                }
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'felt_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data?.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode ||
                typeof data?.rundeId !== 'string' || !spilTilstand.rundeSeed || data.rundeId !== spilTilstand.rundeSeed) return;
            if (spilTilstand.gitter[data.index]) {
                const flettetFelt = fletIndkommendeFeltMedBaseline(spilTilstand.gitter[data.index], data.feltData);
                logMineEjerskifte(data.index, flettetFelt);
                spilTilstand.gitter[data.index] = flettetFelt;
                spilTilstand.gitter = [...spilTilstand.gitter];
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'felter_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data?.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode ||
                typeof data?.rundeId !== 'string' || !spilTilstand.rundeSeed || data.rundeId !== spilTilstand.rundeSeed) return;
            let aendret = false;
            for (const opdatering of data.felter || []) {
                if (spilTilstand.gitter[opdatering.index]) {
                    const flettetFelt = fletIndkommendeFeltMedBaseline(spilTilstand.gitter[opdatering.index], opdatering.feltData);
                    logMineEjerskifte(opdatering.index, flettetFelt);
                    spilTilstand.gitter[opdatering.index] = flettetFelt;
                    aendret = true;
                }
            }
            if (aendret) spilTilstand.gitter = [...spilTilstand.gitter];
        })
        // Databaseændringen er den autoritative backup, hvis en broadcast blev
        // mistet under et kortvarigt forbindelsesudfald. Gravsten filtreres ikke
        // på runde-id, fordi de med vilje består på tværs af runder.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'oe_gravsten',
            filter: `rum_kode=eq.${normaliserRumKode(aktivRumKode)}`
        }, (payload: any) => {
            const data = payload.new;
            if (denneRealtimeGeneration !== realtimeGeneration ||
                normaliserRumKode(data?.rum_kode) !== normaliserRumKode(aktivRumKode) ||
                data?.kort_version !== KORT_VERSION) return;
            void synkroniserPermanenteGravsten(aktivRumKode, Number(data.felt_index));
        })
        .subscribe((status) => {
            if (status !== 'SUBSCRIBED' || denneRealtimeGeneration !== realtimeGeneration) return;
            void (async () => {
                await retryVentendeGravsten(aktivRumKode, aktivRundeId);
                if (denneRealtimeGeneration !== realtimeGeneration) return;
                await synkroniserPermanenteGravsten(aktivRumKode);
            })();
        });
}

export function stopRealtime() {
    realtimeGeneration++;
    invaliderGravstenSynkronisering();
    if (sub) {
        supabase.removeChannel(sub);
        sub = null;
    }
    subRumKode = '';
}

export function annullerVentendeNetvaerkSync() {
    if (syncKoe) clearTimeout(syncKoe);
    if (dbSaveKoe) clearTimeout(dbSaveKoe);
    if (kortSaveKoe) clearTimeout(kortSaveKoe);

    syncKoe = null;
    syncKoeRundeId = '';
    dbSaveKoe = null;
    dbSaveKoeRundeId = '';
    kortSaveKoe = null;
    kortSaveKoeRundeId = '';
    kortSkalOpdateres = false;
    kortSkalOpdateresRundeId = '';
}
