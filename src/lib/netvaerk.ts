import { supabase } from '$lib/supabaseClient';
import { spilTilstand } from '$lib/spilTilstand.svelte';
import type { SpillerData, Felt } from '$lib/types'; 

export async function hentHighscores() {
    if (!spilTilstand.rumKode) return []; 
    const { data, error } = await supabase
        .from('highscores')
        .select('navn, score, karakter')
        .eq('rum_kode', spilTilstand.rumKode)
        .order('score', { ascending: false })
        .limit(3);
    
    return (!error && data) ? data : [];
}

export async function gemHighscore() {
    if (spilTilstand.samletScore > 0 && spilTilstand.rumKode) {
        await supabase
            .from('highscores')
            .insert([{ 
                navn: spilTilstand.spillerNavn, 
                score: spilTilstand.samletScore, 
                rum_kode: spilTilstand.rumKode,
                karakter: spilTilstand.valgtKarakter?.navn || 'Ukendt'
            }]);
    }
    return await hentHighscores(); 
}

export async function syncTilDb(sendKort = false) {
    const { data } = await supabase.from('spil_sessioner').select('spillere').eq('rum_kode', spilTilstand.rumKode).single();
    
    if (data) {
        const opdateredeSpillere = data.spillere || {};
        
        opdateredeSpillere[spilTilstand.spillerNavn] = {
            index: spilTilstand.spillerIndex,
            kolonne: spilTilstand.maxKolonne,
            hp: spilTilstand.livspoint,
            guld: spilTilstand.guldTotal,
            dag: spilTilstand.dag,
            // NY LINJE: Gemmer din aktuelle energi i skyen
            energi: spilTilstand.nuvaerendeEnergi, 
            sidstAktiv: Date.now(),
            isDead: spilTilstand.livspoint <= 0,
            isWinner: spilTilstand.gameState === 'win',
            score: spilTilstand.samletScore,
            ikon: spilTilstand.valgtKarakter?.ikon,
            inventory: spilTilstand.inventory,
            kendteFelter: spilTilstand.mineKendteFelter
        };

        const opdatering: { spillere: Record<string, SpillerData>; fog_x?: number; kort?: Felt[] } = { 
            spillere: opdateredeSpillere, 
            fog_x: spilTilstand.fogX 
        }; 
        
        if (sendKort) opdatering.kort = spilTilstand.gitter;

        await supabase.from('spil_sessioner').update(opdatering).eq('rum_kode', spilTilstand.rumKode);
    }
}

export function startRealtime() {
    supabase.channel('rum_' + spilTilstand.rumKode)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'spil_sessioner', 
            filter: `rum_kode=eq.${spilTilstand.rumKode}` 
        }, payload => {
            spilTilstand.alleSpillere = payload.new.spillere || {};
            
            if (payload.new.kort) {
                spilTilstand.gitter = [...payload.new.kort]; 
            }
            if (payload.new.fog_x !== undefined) {
                spilTilstand.fogX = payload.new.fog_x;
            }
        })
        .subscribe();
}