import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import { authState } from './auth.svelte';
import { gemOfflineScore, gemOfflineSpil, hentOfflineScores } from './offlineStorage';
import { beregnSpillerScore } from './score';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Felt, SpillerData } from './types';

let syncKoe: ReturnType<typeof setTimeout> | null = null;
let kortSkalOpdateres = false;
let dbSaveKoe: ReturnType<typeof setTimeout> | null = null;
let kortSaveKoe: ReturnType<typeof setTimeout> | null = null;
let subRumKode = '';
const VENTENDE_HIGHSCORE_KEY = 'taage_pending_highscores';

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
    player_name: string;
    room_code?: string;
    score: number;
    character?: string;
};

type HighscorePayload = {
    user_id: string;
    player_name: string;
    room_code: string;
    score: number;
    character?: string;
    is_winner: boolean;
    is_dead: boolean;
    days: number;
    gold: number;
    max_column: number;
    known_fields_count: number;
    mines_owned: number;
    final_log: string;
};

type VentendeHighscore = HighscorePayload & {
    pending_id: string;
    created_at: string;
};

function medTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} tog for lang tid.`)), ms);
        Promise.resolve(promise)
            .then(resolve, reject)
            .finally(() => clearTimeout(timer));
    });
}

function harLocalStorage() {
    return typeof localStorage !== 'undefined';
}

function highscorePendingId(payload: HighscorePayload) {
    return [
        payload.user_id,
        payload.player_name,
        payload.room_code,
        payload.score,
        payload.days,
        payload.gold,
        payload.max_column,
        payload.known_fields_count,
        payload.mines_owned,
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
        spilTilstand.logBesked = `Du mistede en guldmine til ${nyEjer}.`;
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
        spilTilstand.statusBesked = error instanceof Error ? error.message : 'Øen kunne ikke gemmes.';
        return false;
    });
}

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

    const isDead = spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map' || (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isDead ?? false);
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isWinner ?? false);

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
        historik: spilTilstand.historik || [],
        tidligereHistorik: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.tidligereHistorik || [],
        isDead: isDead,
        isWinner: isWinner,
        escapeIndex: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.escapeIndex ?? null,
        escapeIcon: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.escapeIcon ?? spilTilstand.valgtKarakter?.ikon ?? null,
        sidstAktiv: Date.now(), 
        activeAlarm: false,
        browserId: localStorage.getItem('taage_browser_id'),
        userId: authState.user?.id ?? null,
        rumKode: aktivRumKode,
        kanalNoegle: aktivKanalNoegle,
        besoegteMiner: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.besoegteMiner || [],
        harSkattekort: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.harSkattekort || false,
        aktivTracker: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker || null,
        trackedeSpillere: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.trackedeSpillere || [],
        venteGratisFeltBrugt: spilTilstand.venteGratisFeltBrugt,
        gratisNaesteBevaegelse: spilTilstand.gratisNaesteBevaegelse,
        gratisBevaegelseKilde: spilTilstand.gratisBevaegelseKilde,
        sidsteBersaerkDag: spilTilstand.sidsteBersaerkDag
    };
    const scoreData = {
        ...mig,
        kendteFelter: spilTilstand.mineKendteFelter
    };
    const score = beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, spilTilstand.spillerNavn, scoreData, isWinner);

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
            payload: { kanalNoegle: aktivKanalNoegle, rumKode: aktivRumKode, navn: spilTilstand.spillerNavn, data: mig, fogX: spilTilstand.fogX }
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
        spilTilstand.statusBesked = `Øen kunne ikke gemmes: ${hentError.message}`;
        return false;
    }

    const serverSpillere = filtrerSpillereTilKanal((aktuelSession?.spillere || {}) as Record<string, SpillerData>, aktivKanalNoegle, aktivRumKode);
    const lokaleSpillere = filtrerSpillereTilKanal(spilTilstand.alleSpillere, aktivKanalNoegle, aktivRumKode);
    const minSpiller = lokaleSpillere[spilTilstand.spillerNavn];
    const spillereTilUpload = {
        ...serverSpillere,
        ...Object.fromEntries(Object.entries(lokaleSpillere).filter(([navn]) => !serverSpillere[navn])),
        ...(minSpiller ? { [spilTilstand.spillerNavn]: minSpiller } : {})
    };

    const opdatering: any = {
        spillere: spillereTilUpload,
        fog_x: Math.round(spilTilstand.fogX)
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
        spilTilstand.statusBesked = `Øen kunne ikke gemmes: ${error.message}`;
        return false;
    }

    if (count === 0) {
        console.error('Kunne ikke gemme spil-session: ingen række matchede ø-navnet', spilTilstand.rumKode);
        spilTilstand.statusBesked = 'Øen kunne ikke gemmes: ingen session matchede ø-navnet.';
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
    const sessionResultat = await medTimeout(supabase.auth.getSession(), 12000, 'Login-tjek').catch((error) => {
        console.error('Kunne ikke tjekke login før scoregemning', error);
        return null;
    });
    const sessionUser = sessionResultat?.data.session?.user ?? authState.user;
    if (!sessionUser) {
        gemOfflineScore(true);
        spilTilstand.statusBesked = 'Login mangler eller er udløbet. Log ind igen og prøv at gemme scoren.';
        return false;
    }

    const minePoint = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map';
    const isDead = spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map';
    const payload: HighscorePayload = {
        user_id: sessionUser.id,
        player_name: authState.profil?.display_name || spilTilstand.spillerNavn,
        room_code: spilTilstand.rumKode,
        score: spilTilstand.samletScore,
        character: spilTilstand.valgtKarakter?.navn,
        is_winner: isWinner,
        is_dead: isDead,
        days: spilTilstand.dag,
        gold: spilTilstand.guldTotal,
        max_column: spilTilstand.maxKolonne,
        known_fields_count: spilTilstand.mineKendteFelter?.length || 0,
        mines_owned: minePoint,
        final_log: spilTilstand.logBesked
    };

    const pendingId = huskVentendeHighscore(payload);
    const error = await sendHighscorePayload(payload);

    if (error) {
        console.error('Kunne ikke gemme highscore', error);
        gemOfflineScore(true);
        spilTilstand.statusBesked = `Scoren kunne ikke gemmes globalt: ${error.message} Den prøves igen automatisk fra denne browser.`;
        return false;
    }

    fjernVentendeHighscore(pendingId);
    return true;
}

export async function retryVentendeHighscores() {
    const brugerId = authState.user?.id;
    if (!brugerId || spilTilstand.offlineMode) return 0;

    const sessionResultat = await medTimeout(supabase.auth.getSession(), 12000, 'Login-tjek').catch(() => null);
    if (sessionResultat?.data.session?.user?.id !== brugerId) return 0;

    const ventende = hentVentendeHighscores().filter((score) => score.user_id === brugerId);
    let gemt = 0;

    for (const score of ventende) {
        const { pending_id, created_at, ...payload } = score;
        void created_at;
        const error = await sendHighscorePayload(payload);
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

    if (!sessionResultat?.data.session?.user) {
        return new Error('Du er ikke logget ind længere. Log ind igen og prøv at gemme scoren.');
    }

    let sidsteFejl: Error | null = null;

    for (let forsoeg = 1; forsoeg <= 3; forsoeg++) {
        const findesAllerede = await highscoreFindes(payload).catch(() => false);
        if (findesAllerede) return null;

        try {
            const { error } = await medTimeout(
                supabase.from('game_results').insert([payload]),
                20000,
                'Gemning af score'
            );

            if (!error) return null;
            sidsteFejl = error;
        } catch (error) {
            sidsteFejl = error instanceof Error ? error : new Error('Gemning af score fejlede.');
        }

        await new Promise(resolve => setTimeout(resolve, 900 * forsoeg));
    }

    if (await highscoreFindes(payload).catch(() => false)) return null;

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

function formaterTopTi(data: ScoreRaekke[] | null | undefined) {
    const unikke = [];
    const fundne = new Set();
    for (const raekke of data || []) {
        const noegle = `${raekke.player_name}-${raekke.score}-${raekke.room_code || ''}-${raekke.character}`;
        if (!fundne.has(noegle)) {
            fundne.add(noegle);
            unikke.push({
                spillerNavn: raekke.player_name,
                oeNavn: raekke.room_code || '',
                point: raekke.score,
                karakter: raekke.character
            });
            if (unikke.length === 10) break;
        }
    }
    return unikke;
}

export async function hentHighscores() {
    if (spilTilstand.offlineMode) {
        return hentOfflineScores(spilTilstand.rumKode).slice(0, 10).map((score) => ({
            navn: score.navn,
            score: score.score,
            karakter: score.karakter
        }));
    }

    const { data } = await medTimeout(
        supabase
            .from('game_results')
            .select('player_name, score, character')
            .eq('room_code', spilTilstand.rumKode)
            .order('score', { ascending: false })
            .limit(30),
        8000,
        'Hentning af ø-score'
    ).catch((error) => {
        console.warn('Kunne ikke hente highscores', error);
        return { data: [] };
    });

    const unikke = [];
    const fundne = new Set();
    for (const raekke of data || []) {
        const noegle = `${raekke.player_name}-${raekke.score}-${raekke.character}`;
        if (!fundne.has(noegle)) {
            fundne.add(noegle);
            unikke.push({
                navn: raekke.player_name,
                score: raekke.score,
                karakter: raekke.character
            });
            if (unikke.length === 10) break;
        }
    }
    return unikke;
}

export async function hentGlobalTopTi() {
    if (spilTilstand.offlineMode) return [];

    const { data } = await medTimeout(
        supabase
            .from('game_results')
            .select('player_name, room_code, score, character')
            .order('score', { ascending: false })
            .limit(30),
        8000,
        'Hentning af global score'
    ).catch((error) => {
        console.warn('Kunne ikke hente global top 10', error);
        return { data: [] };
    });

    return formaterTopTi(data);
}

export async function hentGlobalTopScore() {
    if (spilTilstand.offlineMode) return 0;

    const { data } = await medTimeout(
        supabase
            .from('game_results')
            .select('score')
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
export function startRealtime() {
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.rumKode) return;
    const aktivRumKode = spilTilstand.rumKode;
    const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

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
                spilTilstand.alleSpillere[data.navn] = data.data;
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
