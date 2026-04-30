// netvaerk.ts
import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';

export async function syncTilDb(opdaterKort = false) {
    if (!spilTilstand.rumKode || !spilTilstand.spillerNavn) return;

    const opdatering: any = {};
    opdatering[`spillere.${spilTilstand.spillerNavn}`] = {
        index: spilTilstand.spillerIndex,
        hp: spilTilstand.livspoint,
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
        .limit(10);
    return data || [];
}

let sub: any;
export function startRealtime() {
    if (!spilTilstand.rumKode || sub) return;
    sub = supabase
        .channel(`room:${spilTilstand.rumKode}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'spil_sessioner', filter: `rum_kode=eq.${spilTilstand.rumKode}` }, payload => {
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