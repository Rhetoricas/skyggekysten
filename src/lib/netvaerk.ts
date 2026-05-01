import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import type { RealtimeChannel } from '@supabase/supabase-js';

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;

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
        isDead: spilTilstand.gameState === 'dead',
        isWinner: spilTilstand.gameState === 'win',
        activeAlarm: false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opdatering: any = {
        spillere: spilTilstand.alleSpillere,
        fog_x: Math.round(spilTilstand.fogX)
    };

    if (opdaterKort) {
        opdatering['kort'] = spilTilstand.gitter;
    }

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'spil_sessioner', filter: `rum_kode=eq.${spilTilstand.rumKode}` }, (payload: any) => {
            const nyData = payload.new;
            if (nyData.kort) spilTilstand.gitter = nyData.kort;
            if (nyData.fog_x !== undefined) spilTilstand.fogX = nyData.fog_x;
            if (nyData.spillere) spilTilstand.alleSpillere = nyData.spillere;
        })
        .subscribe();
}

export function stopRealtime() {
    if (sub) {
        supabase.removeChannel(sub);
        sub = null;
    }
}