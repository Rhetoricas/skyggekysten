import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import type { RealtimeChannel } from '@supabase/supabase-js';

let syncKoe: ReturnType<typeof setTimeout> | null = null;
let kortSkalOpdateres = false;
let lokalUploadTid = 0;
let dbSaveKoe: ReturnType<typeof setTimeout> | null = null;

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;

    // 1. Byg spillerobjektet med det samme
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
        isDead: isDead,
        isWinner: isWinner,
        sidstAktiv: Date.now(), 
        activeAlarm: false,
        browserId: localStorage.getItem('taage_browser_id'),
        besoegteMiner: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.besoegteMiner || [],
        harSkattekort: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.harSkattekort || false
    };

    // Opdater lokalt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spilTilstand.alleSpillere[spilTilstand.spillerNavn] = mig as any;

    // 2. BROADCAST LYNHURTIGT TIL ANDRE (Koster ingen database-writes)
    if (sub) {
        sub.send({
            type: 'broadcast',
            event: 'spiller_sync',
            payload: { navn: spilTilstand.spillerNavn, data: mig, fogX: spilTilstand.fogX }
        });
    }

    if (opdaterKort) kortSkalOpdateres = true;

    if (syncKoe) return;

    // 3. DATABASE UPLOAD KONTROL
    syncKoe = setTimeout(async () => {
        syncKoe = null;
        
        // Hvis kortet IKKE er ændret, venter vi 10 sekunder med at stresse databasen
        if (!kortSkalOpdateres) {
            if (!dbSaveKoe) {
                dbSaveKoe = setTimeout(async () => {
                    dbSaveKoe = null;
                    await udfoerDbUpload(false);
                }, 10000);
            }
            return;
        }

        // Hvis kortet HAR ændret sig, flår vi timeouten i stykker og uploader omgående
        if (dbSaveKoe) {
            clearTimeout(dbSaveKoe);
            dbSaveKoe = null;
        }

        const sendKort = kortSkalOpdateres;
        kortSkalOpdateres = false; 
        await udfoerDbUpload(sendKort);
        
    }, 1000); 
}

async function udfoerDbUpload(sendKort: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opdatering: any = {
        spillere: spilTilstand.alleSpillere,
        fog_x: Math.round(spilTilstand.fogX)
    };

    if (sendKort) {
        opdatering['kort'] = spilTilstand.gitter;
    }

    lokalUploadTid = Date.now();
    await supabase.from('spil_sessioner').update(opdatering).eq('rum_kode', spilTilstand.rumKode);
}

export async function gemHighscore() {
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode || spilTilstand.samletScore <= 0) return;

    await supabase.from('highscores').insert([{
        navn: spilTilstand.spillerNavn,
        rum_kode: spilTilstand.rumKode,
        score: spilTilstand.samletScore,
        karakter: spilTilstand.valgtKarakter?.navn
    }]);
}

export async function hentHighscores() {
    const { data } = await supabase
        .from('highscores')
        .select('navn, score, karakter')
        .eq('rum_kode', spilTilstand.rumKode)
        .order('score', { ascending: false })
        .limit(30);

    const unikke = [];
    const fundne = new Set();
    for (const raekke of data || []) {
        const noegle = `${raekke.navn}-${raekke.score}-${raekke.karakter}`;
        if (!fundne.has(noegle)) {
            fundne.add(noegle);
            unikke.push(raekke);
            if (unikke.length === 10) break;
        }
    }
    return unikke;
}

export async function hentGlobalTopTi() {
    const { data } = await supabase
        .from('highscores')
        .select('navn, rum_kode, score, karakter')
        .order('score', { ascending: false })
        .limit(30);

    const unikke = [];
    const fundne = new Set();
    for (const raekke of data || []) {
        const noegle = `${raekke.navn}-${raekke.score}-${raekke.rum_kode}-${raekke.karakter}`;
        if (!fundne.has(noegle)) {
            fundne.add(noegle);
            unikke.push({
                spillerNavn: raekke.navn,
                oeNavn: raekke.rum_kode,
                point: raekke.score,
                karakter: raekke.karakter
            });
            if (unikke.length === 10) break;
        }
    }
    return unikke;
}

let sub: RealtimeChannel | null = null;
export function startRealtime() {
    if (!spilTilstand.rumKode || sub) return;
    sub = supabase
        .channel(`room:${spilTilstand.rumKode}`)
        // Lytter til den billige broadcast kanal for andre spilleres lynhurtige træk
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('broadcast', { event: 'spiller_sync' }, (payload: any) => {
            const data = payload.payload;
            if (data.navn !== spilTilstand.spillerNavn) {
                spilTilstand.alleSpillere[data.navn] = data.data;
                if (data.fogX !== undefined && data.fogX > spilTilstand.fogX) {
                    spilTilstand.fogX = data.fogX;
                }
            }
        })
        // Lytter til den tunge database kun når landkortet (eller timer-backup) ændres
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'spil_sessioner', filter: `rum_kode=eq.${spilTilstand.rumKode}` }, (payload: any) => {
            const nyData = payload.new;
            
            if (Date.now() - lokalUploadTid > 2000) {
                if (nyData.kort) spilTilstand.gitter = nyData.kort;
            }
            
            if (nyData.fog_x !== undefined && nyData.fog_x > spilTilstand.fogX) spilTilstand.fogX = nyData.fog_x;
            
            if (nyData.spillere) {
                Object.keys(nyData.spillere).forEach(navn => {
                    if (navn !== spilTilstand.spillerNavn) {
                        spilTilstand.alleSpillere[navn] = nyData.spillere[navn];
                    }
                });
            }
        })
        .subscribe();
}

export function stopRealtime() {
    if (sub) {
        supabase.removeChannel(sub);
        sub = null;
    }
}