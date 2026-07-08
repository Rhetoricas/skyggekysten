import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import { authState } from './auth.svelte';
import { gemOfflineScore, gemOfflineSpil, hentOfflineScores } from './offlineStorage';
import { beregnSpillerScore, findMedaljeNiveau, findMedaljeSti, taelScoreSpillere } from './score';
import { KORT_VERSION } from './kortDimensioner';
import { hentKarakterKlasseNoegle, hentKarakterNavneIKlasse } from './spildata';
import { tekst } from './i18n.svelte';
import { lavTrofaeMaalinger } from './trofaeer';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Felt, SpillerData } from './types';

let syncKoe: ReturnType<typeof setTimeout> | null = null;
let kortSkalOpdateres = false;
let dbSaveKoe: ReturnType<typeof setTimeout> | null = null;
let kortSaveKoe: ReturnType<typeof setTimeout> | null = null;
let subRumKode = '';
const VENTENDE_HIGHSCORE_KEY = 'taage_pending_highscores';
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
    return `${laesbarDel}_${(hash >>> 0).toString(36)}`;
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

const timeoutLabelsEn: Record<string, string> = {
    'Gemning af øen': 'Island save',
    'Hentning af aktuel spillerliste': 'Current player list fetch',
    'Login-tjek': 'Login check',
    'Hentning af ø-session': 'Island session fetch',
    'Gemning af afsluttet spiller': 'Finished player save',
    'Gemning af score': 'Score save',
    'Hentning af ø-score': 'Island score fetch',
    'Hentning af global score': 'Global score fetch',
    'Hentning af ugens globale score': 'Weekly global score fetch',
    'Hentning af filtreret highscore': 'Filtered highscore fetch',
    'Hentning af highscore-resultat': 'Highscore result fetch',
    'Hentning af topmedalje-spil': 'Top medal game fetch',
    'Hentning af offentlig profil': 'Public profile fetch',
    'Hentning af gemt score-id': 'Saved score id fetch',
    'Opdatering af highscore-medalje': 'Highscore medal update',
    'Hentning af global rekord': 'Global record fetch'
};

function medTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(tekst(`${label} tog for lang tid.`, `${timeoutLabelsEn[label] || label} took too long.`))),
            ms
        );
        Promise.resolve(promise)
            .then(resolve, reject)
            .finally(() => clearTimeout(timer));
    });
}

function vaelgNyesteSpillerData(serverData?: SpillerData, lokalData?: SpillerData) {
    if (!serverData) return lokalData;
    if (!lokalData) return serverData;
    if (serverData.rundeSeed && lokalData.rundeSeed && serverData.rundeSeed !== lokalData.rundeSeed) {
        return (lokalData.sidstAktiv || 0) > (serverData.sidstAktiv || 0) ? lokalData : serverData;
    }

    const serverDag = serverData.dag || 1;
    const lokalDag = lokalData.dag || 1;
    if (serverDag !== lokalDag) return lokalDag > serverDag ? lokalData : serverData;

    return (lokalData.sidstAktiv || 0) > (serverData.sidstAktiv || 0) ? lokalData : serverData;
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
    if (!harLocalStorage()) return;
    localStorage.setItem(VENTENDE_HIGHSCORE_KEY, JSON.stringify(scores.slice(-20)));
}

function huskVentendeHighscore(payload: HighscorePayload) {
    const pending_id = highscorePendingId(payload);
    const scores = hentVentendeHighscores().filter((score) => score.pending_id !== pending_id);
    scores.push({ ...payload, pending_id, created_at: new Date().toISOString() });
    gemVentendeHighscores(scores);
    return pending_id;
}

function fjernVentendeHighscore(pendingId: string) {
    gemVentendeHighscores(hentVentendeHighscores().filter((score) => score.pending_id !== pendingId));
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
    return renset;
}

function rensKortTilSync(kort: Felt[]) {
    return kort.map((felt) => rensVisuelleFeltData(felt));
}

function erTaageLaengereFremme(nyFogX: number, gammelFogX: number) {
    if (nyFogX < 0 && gammelFogX >= 0) return true;
    if (nyFogX >= 0 && gammelFogX < 0) return false;
    if (nyFogX < 0 && gammelFogX < 0) return Math.abs(nyFogX) > Math.abs(gammelFogX);
    return nyFogX > gammelFogX;
}

function filtrerSpillereTilKanal(spillere: Record<string, SpillerData> = {}, kanalNoegle: string, rumKode: string) {
    return Object.fromEntries(
        Object.entries(spillere).filter(([, spiller]) => {
            if (spiller.kanalNoegle) return spiller.kanalNoegle === kanalNoegle;
            if (spiller.rumKode) return spiller.rumKode === rumKode;
            return true;
        })
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

export function syncKortTilDbSenere(delayMs = 45000) {
    if (kortSaveKoe) return;

    kortSaveKoe = setTimeout(() => {
        kortSaveKoe = null;
        syncTilDb(true);
    }, delayMs);
}

export async function flushVentendeSync() {
    if (spilTilstand.offlineMode) {
        gemOfflineSpil();
        return true;
    }

    const harVentendeSync = syncKoe || dbSaveKoe || kortSaveKoe || kortSkalOpdateres;
    if (!harVentendeSync) return true;

    if (syncKoe) {
        clearTimeout(syncKoe);
        syncKoe = null;
    }

    if (dbSaveKoe) {
        clearTimeout(dbSaveKoe);
        dbSaveKoe = null;
    }

    const sendKort = kortSkalOpdateres || !!kortSaveKoe;
    if (kortSaveKoe) {
        clearTimeout(kortSaveKoe);
        kortSaveKoe = null;
    }

    kortSkalOpdateres = false;
    return await medTimeout(udfoerDbUpload(sendKort), 12000, 'Gemning af øen').catch((error) => {
        console.error('Kunne ikke gemme ventende sync', error);
        spilTilstand.statusBesked = error instanceof Error ? error.message : tekst('Øen kunne ikke gemmes.', 'The island could not be saved.');
        return false;
    });
}

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);
    const rundeSeed = spilTilstand.rundeSeed ||
        spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.rundeSeed ||
        `${aktivRumKode}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
    spilTilstand.rundeSeed = rundeSeed;

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

    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'spiller_sync',
            payload: {
                kanalNoegle: aktivKanalNoegle,
                rumKode: aktivRumKode,
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
        if (kortSaveKoe) {
            clearTimeout(kortSaveKoe);
            kortSaveKoe = null;
        }
    }

    if (syncKoe) return;

    syncKoe = setTimeout(async () => {
        syncKoe = null;
        
        if (!kortSkalOpdateres) {
            if (!dbSaveKoe) {
                dbSaveKoe = setTimeout(async () => {
                    dbSaveKoe = null;
                    await udfoerDbUpload(false);
                }, 10000);
            }
            return;
        }

        if (dbSaveKoe) {
            clearTimeout(dbSaveKoe);
            dbSaveKoe = null;
        }

        const sendKort = kortSkalOpdateres;
        kortSkalOpdateres = false; 
        await udfoerDbUpload(sendKort);
        
    }, 1000); 
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastFelt(index: number, feltData: any) {
    if (spilTilstand.offlineMode) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'felt_sync',
            payload: { kanalNoegle: aktivKanalNoegle, rumKode: aktivRumKode, index, feltData: rensVisuelleFeltData(feltData) }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastFelter(felter: Array<{ index: number; feltData: any }>) {
    if (spilTilstand.offlineMode) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

    if (sub && felter.length > 0) {
        sub.send({
            type: 'broadcast',
            event: 'felter_sync',
            payload: {
                kanalNoegle: aktivKanalNoegle,
                rumKode: aktivRumKode,
                felter: felter.map(({ index, feltData }) => ({
                    index,
                    feltData: rensVisuelleFeltData(feltData)
                }))
            }
        });
    }
}

async function udfoerDbUpload(sendKort: boolean) {
    if (spilTilstand.offlineMode) {
        gemOfflineSpil();
        return true;
    }
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: aktuelSession, error: hentError } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .select('spillere')
            .eq('rum_kode', aktivRumKode)
            .maybeSingle(),
        12000,
        'Hentning af aktuel spillerliste'
    );

    if (hentError) {
        console.error('Kunne ikke hente aktuel spillerliste', hentError);
        spilTilstand.statusBesked = tekst(
            `Øen kunne ikke gemmes: ${hentError.message}`,
            `The island could not be saved: ${hentError.message}`
        );
        return false;
    }

    const serverSpillere = filtrerSpillereTilKanal((aktuelSession?.spillere || {}) as Record<string, SpillerData>, aktivKanalNoegle, aktivRumKode);
    const lokaleSpillere = filtrerSpillereTilKanal(spilTilstand.alleSpillere, aktivKanalNoegle, aktivRumKode);
    const minSpiller = lokaleSpillere[spilTilstand.spillerNavn];
    const spillernavne = new Set([...Object.keys(serverSpillere), ...Object.keys(lokaleSpillere)]);
    const spillereTilUpload = Object.fromEntries(
        Array.from(spillernavne).map((navn) => [
            navn,
            vaelgNyesteSpillerData(serverSpillere[navn], lokaleSpillere[navn])
        ]).filter(([, spiller]) => !!spiller)
    ) as Record<string, SpillerData>;
    if (minSpiller) spillereTilUpload[spilTilstand.spillerNavn] = minSpiller;

    const opdatering: any = {
        spillere: spillereTilUpload,
        fog_x: Math.round(spilTilstand.fogX),
        kort_bredde: spilTilstand.kortBredde,
        kort_hoejde: spilTilstand.kortHoejde,
        kort_version: KORT_VERSION
    };

    if (sendKort) {
        opdatering['kort'] = rensKortTilSync(spilTilstand.gitter);
    }

    const { error, count } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .update(opdatering, { count: 'exact' })
            .eq('rum_kode', aktivRumKode),
        12000,
        'Gemning af øen'
    );

    if (error) {
        console.error('Kunne ikke gemme spil-session', error);
        spilTilstand.statusBesked = tekst(
            `Øen kunne ikke gemmes: ${error.message}`,
            `The island could not be saved: ${error.message}`
        );
        return false;
    }

    if (count === 0) {
        console.error('Kunne ikke gemme spil-session: ingen række matchede ø-navnet', spilTilstand.rumKode);
        spilTilstand.statusBesked = tekst(
            'Øen kunne ikke gemmes: ingen session matchede ø-navnet.',
            'The island could not be saved: no session matched the island name.'
        );
        return false;
    }

    return true;
}

export async function gemHighscore() {
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode || spilTilstand.samletScore <= 0) return false;
    if (spilTilstand.offlineMode) {
        gemOfflineScore();
        return true;
    }
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
    const lavPayload = (userId?: string): HighscorePayload => {
        const payload: HighscorePayload = {
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
            payload.route_indices = aktivRute;
            payload.route_width = spilTilstand.kortBredde;
            payload.route_height = spilTilstand.kortHoejde;
        }

        return payload;
    };

    const sessionResultat = await medTimeout(supabase.auth.getSession(), 12000, 'Login-tjek').catch((error) => {
        console.error('Kunne ikke tjekke login før scoregemning', error);
        return null;
    });
    const sessionUser = sessionResultat?.data.session?.user;
    if (!sessionUser) {
        markerLoginUdlobet();
        huskVentendeHighscore(lavPayload());
        gemOfflineScore(true);
        spilTilstand.statusBesked = tekst(
            'Login mangler eller er udløbet. Scoren er gemt i browseren og sendes, når du logger ind igen.',
            'Login is missing or expired. The score is saved in the browser and will be sent when you log in again.'
        );
        return false;
    }

    const payload = lavPayload(sessionUser.id);

    const pendingId = huskVentendeHighscore(payload);
    const error = await sendHighscorePayload(payload);

    if (error) {
        console.error('Kunne ikke gemme highscore', error);
        if (error.message.toLowerCase().includes('logget ind')) {
            markerLoginUdlobet();
            spilTilstand.statusBesked = tekst(
                'Login mangler eller er udløbet. Scoren er gemt i browseren og sendes, når du logger ind igen.',
                'Login is missing or expired. The score is saved in the browser and will be sent when you log in again.'
            );
            return false;
        }
        gemOfflineScore(true);
        spilTilstand.statusBesked = tekst(
            `Scoren kunne ikke gemmes globalt: ${error.message} Den prøves igen automatisk fra denne browser.`,
            `The score could not be saved globally: ${error.message} It will be retried automatically from this browser.`
        );
        return false;
    }

    fjernVentendeHighscore(pendingId);
    return true;
}

export async function gemAfsluttetSpillerISession() {
    if (spilTilstand.offlineMode) return true;
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return false;

    const eksisterende = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (eksisterende?.isWinner ?? false);
    const isDead = !isWinner && (
        spilTilstand.gameState === 'dead' ||
        spilTilstand.gameState === 'dead_map' ||
        (eksisterende?.isDead ?? false)
    );
    if (!isWinner && !isDead) return true;

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
        rundeSeed: spilTilstand.rundeSeed || eksisterende?.rundeSeed,
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
        venteFriIndtilDag: spilTilstand.venteFriIndtilDag || 0
    };

    spilTilstand.alleSpillere[navn] = afsluttetSpiller;

    const { data, error: hentError } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .select('spillere')
            .eq('rum_kode', aktivRumKode)
            .maybeSingle(),
        12000,
        'Hentning af ø-session'
    ).catch((error) => ({ data: null, error }));

    if (hentError) {
        console.error('Kunne ikke hente ø-session ved afslutning', hentError);
        return false;
    }

    const serverSpillere = filtrerSpillereTilKanal((data?.spillere || {}) as Record<string, SpillerData>, aktivKanalNoegle, aktivRumKode);
    const spillere = {
        ...serverSpillere,
        [navn]: afsluttetSpiller
    };

    const { error: gemError } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .update({
                spillere,
                kort: rensKortTilSync(spilTilstand.gitter),
                fog_x: Math.round(spilTilstand.fogX),
                kort_bredde: spilTilstand.kortBredde,
                kort_hoejde: spilTilstand.kortHoejde,
                kort_version: KORT_VERSION
            })
            .eq('rum_kode', aktivRumKode),
        12000,
        'Gemning af afsluttet spiller'
    ).catch((error) => ({ error }));

    if (gemError) {
        console.error('Kunne ikke gemme afsluttet spiller i ø-session', gemError);
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
        return new Error('Du er ikke logget ind længere. Log ind igen og prøv at gemme scoren.');
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
            sidsteFejl = error instanceof Error ? error : new Error('Gemning af score fejlede.');
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
            .select('display_name, profile_character_id')
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
        profileCharacterId: typeof data?.profile_character_id === 'string' ? data.profile_character_id : ''
    };
}

export async function hentHighscoreDetaljer(id: number) {
    if (spilTilstand.offlineMode) return null;

    let { data, error }: { data: any; error: any } = await supabase
        .from('game_results')
        .select('is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log, medal_path, medal_level, route_indices, route_width, route_height, trophy_stats')
        .eq('id', id)
        .single();

    if (error && erManglendeEkstraHighscoreKolonneFejl(error)) {
        const fallback = await supabase
            .from('game_results')
            .select('is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, player_count, final_log')
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
        trophyStats: data.trophy_stats && typeof data.trophy_stats === 'object' ? data.trophy_stats : undefined
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

    if (forceReconnect && sub) stopRealtime();
    if (sub && subRumKode === aktivKanalNoegle) return;
    if (sub) stopRealtime();

    subRumKode = aktivKanalNoegle;
    sub = supabase
        .channel(`room:${aktivKanalNoegle}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'spiller_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
            if (data.navn !== spilTilstand.spillerNavn) {
                if (typeof data.kortBredde === 'number') spilTilstand.kortBredde = data.kortBredde;
                if (typeof data.kortHoejde === 'number') spilTilstand.kortHoejde = data.kortHoejde;
                const eksisterende = spilTilstand.alleSpillere[data.navn];
                spilTilstand.alleSpillere[data.navn] = vaelgNyesteSpillerData(eksisterende, data.data) || data.data;
                if (data.fogX !== undefined && erTaageLaengereFremme(data.fogX, spilTilstand.fogX)) {
                    spilTilstand.fogX = data.fogX;
                }
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'felt_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
            if (spilTilstand.gitter[data.index]) {
                logMineEjerskifte(data.index, data.feltData);
                spilTilstand.gitter[data.index] = data.feltData;
                spilTilstand.gitter = [...spilTilstand.gitter];
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'felter_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
            let aendret = false;
            for (const opdatering of data.felter || []) {
                if (spilTilstand.gitter[opdatering.index]) {
                    logMineEjerskifte(opdatering.index, opdatering.feltData);
                    spilTilstand.gitter[opdatering.index] = opdatering.feltData;
                    aendret = true;
                }
            }
            if (aendret) spilTilstand.gitter = [...spilTilstand.gitter];
        })
        .subscribe();
}

export function stopRealtime() {
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
    dbSaveKoe = null;
    kortSaveKoe = null;
    kortSkalOpdateres = false;
}
