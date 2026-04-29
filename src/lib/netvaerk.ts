import { supabase } from '$lib/supabaseClient';
import { spilTilstand } from '$lib/spilTilstand.svelte';
import type { SpillerData, Felt } from '$lib/types'; 

export interface GlobalScore {
    spillerNavn: string;
    oeNavn: string;
    point: number;
}

export async function hentHighscores() {
    if (!spilTilstand.rumKode) return []; 
    const { data, error } = await supabase
        .from('highscores')
        .select('navn, score, karakter')
        .eq('rum_kode', spilTilstand.rumKode)
        .order('score', { ascending: false })
        .limit(10); 
    
    return (!error && data) ? data : [];
}

export async function hentGlobalTopTi(): Promise<GlobalScore[]> {
    const { data, error } = await supabase
        .from('highscores')
        .select('navn, score, rum_kode')
        .order('score', { ascending: false })
        .limit(10);
    
    if (error || !data) {
        console.error("Kunne ikke læse de globale runer:", error);
        return [];
    }

    return data.map(raekke => ({
        spillerNavn: raekke.navn || 'Anonym',
        oeNavn: raekke.rum_kode || 'Ukendt Ø',
        point: raekke.score || 0
    }));
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
if (!spilTilstand.rumKode) return;
    try {
        const { data, error: fetchError } = await supabase.from('spil_sessioner').select('spillere').eq('rum_kode', spilTilstand.rumKode).single();
        
        if (fetchError) {
            console.warn("Lille forsinkelse fra serveren:", fetchError);
            return;
        }

        if (data) {
            const opdateredeSpillere = data.spillere || {};
            
            opdateredeSpillere[spilTilstand.spillerNavn] = {
                index: spilTilstand.spillerIndex,
                kolonne: spilTilstand.maxKolonne,
                hp: spilTilstand.livspoint,
                guld: spilTilstand.guldTotal,
                dag: spilTilstand.dag,
                energi: spilTilstand.nuvaerendeEnergi, 
                sidstAktiv: Date.now(),
                isDead: spilTilstand.livspoint <= 0,
                isWinner: spilTilstand.gameState === 'win',
                score: spilTilstand.samletScore,
                ikon: spilTilstand.valgtKarakter?.ikon,
                udstyr: spilTilstand.mitUdstyr,
                kendteFelter: spilTilstand.mineKendteFelter,
                retning: spilTilstand.retning
            };

            const opdatering: { spillere: Record<string, SpillerData>; fog_x?: number; kort?: Felt[] } = { 
                spillere: opdateredeSpillere, 
                fog_x: spilTilstand.fogX 
            }; 
            
            if (sendKort) opdatering.kort = spilTilstand.gitter;

            const { error: updateError } = await supabase.from('spil_sessioner').update(opdatering).eq('rum_kode', spilTilstand.rumKode);
            
            if (updateError) {
                console.error("Kunne ikke skubbe data til skyen lige nu:", updateError);
            }
        }
    } catch (err) {
        console.error("Netværket koblede fra i et øjeblik.", err);
    }
}

let realtimeKanal: ReturnType<typeof supabase.channel> | null = null;

export function startRealtime() {
    if (realtimeKanal) {
        supabase.removeChannel(realtimeKanal);
    }

    realtimeKanal = supabase.channel('rum_' + spilTilstand.rumKode)
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

export function stopRealtime() {
    if (realtimeKanal) {
        supabase.removeChannel(realtimeKanal);
        realtimeKanal = null;
    }
}