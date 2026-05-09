import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import type { RealtimeChannel } from '@supabase/supabase-js';

let syncKoe: ReturnType<typeof setTimeout> | null = null;
let kortSkalOpdateres = false;
let lokalUploadTid = 0;

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;

    if (opdaterKort) kortSkalOpdateres = true;

    if (syncKoe) return;

    syncKoe = setTimeout(async () => {
        syncKoe = null;
        const sendKort = kortSkalOpdateres;
        kortSkalOpdateres = false; 

        const isDead = spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map' || (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isDead ?? false);
        const isWinner = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map' || (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isWinner ?? false);

        spilTilstand.alleSpillere[spilTilstand.spillerNavn] = {
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
        besoegteMiner: spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.besoegteMiner || [] // <-- Denne linje
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
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
    }, 1000); 
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'spil_sessioner', filter: `rum_kode=eq.${spilTilstand.rumKode}` }, (payload: any) => {
            const nyData = payload.new;
            
            if (Date.now() - lokalUploadTid > 2000) {
                if (nyData.kort) spilTilstand.gitter = nyData.kort;
            }
            
            if (nyData.fog_x !== undefined) spilTilstand.fogX = nyData.fog_x;
            
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