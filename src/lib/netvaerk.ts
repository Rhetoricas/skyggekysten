import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import { authState } from './auth.svelte';
import { gemOfflineScore, gemOfflineSpil, hentOfflineScores } from './offlineStorage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Felt } from './types';

let syncKoe: ReturnType<typeof setTimeout> | null = null;
let kortSkalOpdateres = false;
let dbSaveKoe: ReturnType<typeof setTimeout> | null = null;
let kortSaveKoe: ReturnType<typeof setTimeout> | null = null;

function medTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} tog for lang tid.`)), ms);
        Promise.resolve(promise)
            .then(resolve, reject)
            .finally(() => clearTimeout(timer));
    });
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
    if (spilTilstand.soloMode) return true;

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
        sidstAktiv: Date.now(), 
        activeAlarm: false,
        browserId: localStorage.getItem('taage_browser_id'),
        userId: authState.user?.id ?? null,
        besoegteMiner: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.besoegteMiner || [],
        harSkattekort: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.harSkattekort || false,
        aktivTracker: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker || null,
        trackedeSpillere: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.trackedeSpillere || [],
        venteGratisFeltBrugt: spilTilstand.venteGratisFeltBrugt
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spilTilstand.alleSpillere[spilTilstand.spillerNavn] = mig as any;

    if (spilTilstand.offlineMode) {
        gemOfflineSpil();
        return;
    }
    if (spilTilstand.soloMode) return;

    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'spiller_sync',
            payload: { navn: spilTilstand.spillerNavn, data: mig, fogX: spilTilstand.fogX }
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
    if (spilTilstand.offlineMode || spilTilstand.soloMode) return;

    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'felt_sync',
            payload: { index, feltData: rensVisuelleFeltData(feltData) }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcastFelter(felter: Array<{ index: number; feltData: any }>) {
    if (spilTilstand.offlineMode || spilTilstand.soloMode) return;

    if (sub && felter.length > 0) {
        sub.send({
            type: 'broadcast',
            event: 'felter_sync',
            payload: {
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
    if (spilTilstand.soloMode) return true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opdatering: any = {
        spillere: spilTilstand.alleSpillere,
        fog_x: Math.round(spilTilstand.fogX)
    };

    if (sendKort) {
        opdatering['kort'] = rensKortTilSync(spilTilstand.gitter);
    }

    const { error, count } = await medTimeout(
        supabase
            .from('spil_sessioner')
            .update(opdatering, { count: 'exact' })
            .eq('rum_kode', spilTilstand.rumKode),
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
    if (!authState.user) return false;

    const minePoint = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
    const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map';
    const isDead = spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map';

    const { error } = await medTimeout(
        supabase.from('game_results').insert([{
            user_id: authState.user.id,
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
        }]),
        12000,
        'Gemning af score'
    );

    if (error) {
        console.error('Kunne ikke gemme highscore', error);
        spilTilstand.statusBesked = `Scoren kunne ikke gemmes: ${error.message}`;
        return false;
    }

    return true;
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

    const unikke = [];
    const fundne = new Set();
    for (const raekke of data || []) {
        const noegle = `${raekke.player_name}-${raekke.score}-${raekke.room_code}-${raekke.character}`;
        if (!fundne.has(noegle)) {
            fundne.add(noegle);
            unikke.push({
                spillerNavn: raekke.player_name,
                oeNavn: raekke.room_code,
                point: raekke.score,
                karakter: raekke.character
            });
            if (unikke.length === 10) break;
        }
    }
    return unikke;
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
    if (spilTilstand.offlineMode || spilTilstand.soloMode) return;
    if (!spilTilstand.rumKode || sub) return;
    sub = supabase
        .channel(`room:${spilTilstand.rumKode}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'spiller_sync' }, (payload: any) => {
            const data = payload.payload;
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
            if (spilTilstand.gitter[data.index]) {
                spilTilstand.gitter[data.index] = data.feltData;
                spilTilstand.gitter = [...spilTilstand.gitter];
            }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'felter_sync' }, (payload: any) => {
            const data = payload.payload;
            let aendret = false;
            for (const opdatering of data.felter || []) {
                if (spilTilstand.gitter[opdatering.index]) {
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
}
