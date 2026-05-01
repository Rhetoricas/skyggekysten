<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { eventState, kanViseValg, tagValg, startEvent } from '$lib/eventMotor.svelte';
    import { eventBibliotek } from '$lib/eventBibliotek';
    import { fremtvingKollaps } from '$lib/overlevelse.svelte';

    let { lukEvent } = $props<{ lukEvent: () => void }>();

    let aktueltFelt = $derived(spilTilstand.gitter[spilTilstand.spillerIndex]);
    let rootEvent = $derived(aktueltFelt?.eventID ? eventBibliotek[aktueltFelt.eventID] : null);
    let grundBiome = $derived(rootEvent ? (Array.isArray(rootEvent.biome) ? rootEvent.biome[0] : rootEvent.biome) : 'event');

    function haandterKlikVidere() {
        if (!eventState.valgLåst) return;
        
        if (eventState.naesteTrin) {
            startEvent(eventState.naesteTrin);
        } else if (eventState.afventerKollaps) {
            lukEvent();
            fremtvingKollaps();
        } else if (eventState.erFaerdig) {
            lukEvent();
        }
    }
</script>

{#if eventState.aktivt}

{#if spilTilstand.erBevidstløs}
    <div class="stun-overlay"></div>
{/if}

<!-- Hele baggrunden lytter nu efter klik, hvis valget er låst -->
<div class="event-overlay" role="presentation" onclick={() => eventState.valgLåst && haandterKlikVidere()}>
    <div class="event-boks" class:klik-klar={eventState.valgLåst}>
        <img
            src={eventState.aktivt.billede || `/events/ev_${grundBiome}.webp`}
            alt="Event baggrund"
            onerror={(e) => {
                (e.currentTarget as HTMLImageElement).onerror = null;
                (e.currentTarget as HTMLImageElement).src = '/events/event.webp';
            }}
        />

        <h2>{eventState.aktivt.titel}</h2>

        <div class="log-container">
            {#each eventState.log as linje, i (i)}
                <p>{linje}</p>
            {/each}
        </div>

        <div class="knap-panel">
            {#if !eventState.valgLåst}
                {#each eventState.aktivt.valg as valg (valg.tekst)}
                    {#if kanViseValg(valg)}
                        <!-- e.stopPropagation() stopper klikket fra at aktivere baggrunden -->
                        <button class="valg-btn" onclick={(e) => { e.stopPropagation(); tagValg(valg); }}>
                            {valg.tekst}
                            {#if valg.kosterItem}
                                <span class="pris">(Koster {valg.kosterItem})</span>
                            {/if}
                            {#if valg.puljeVaerdi}
                                <span class="pris">(Koster {valg.puljeVaerdi} Guld)</span>
                            {/if}
                        </button>
                    {/if}
                {/each}
                
                <button class="valg-btn" onclick={(e) => { e.stopPropagation(); lukEvent(); }}>Forlad stedet</button>
            {:else}
                <p class="klik-videre-tekst">Klik for at fortsætte...</p>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .stun-overlay { 
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 150;
        box-shadow: inset 0 0 150px rgba(200, 0, 0, 0.8); animation: blodPuls 2s infinite;
    }
    
    @keyframes blodPuls { 
        0%, 100% { opacity: 0.4; } 
        50% { opacity: 1; } 
    }
    
    .event-overlay { 
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 1000;
        font-family: system-ui, -apple-system, sans-serif;
    }
    
    .event-boks { 
        background: #1a1a1a; color: #e0e0e0; border: 2px solid #4a4a4a; padding: 20px; width: 600px; max-width: 90%;
        min-height: 650px;
        max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; border-radius: 8px;
    }

    .klik-klar {
        cursor: pointer;
        transition: border-color 0.3s;
    }

    .klik-klar:hover {
        border-color: #777;
    }
    
    .event-boks img { 
        width: 100%; height: 200px; object-fit: cover; border-bottom: 2px solid #333; border-radius: 4px;
    }
    
    .event-boks h2 { 
        margin: 0; color: #ffcc00; font-family: 'Cinzel', serif; font-size: 1.8rem;
    }
    
    .log-container {
        flex-grow: 1;
    }
    
    .log-container p { 
        margin: 5px 0; line-height: 1.5; font-size: 1.05rem;
    }
    
    .knap-panel { 
        display: flex; flex-direction: column; gap: 10px; margin-top: auto;
    }
    
    .valg-btn { 
        padding: 14px; background: #2a2a2a; color: white; border: 1px solid #555; cursor: pointer; 
        text-align: left; border-radius: 4px; transition: 0.2s; font-size: 1rem; font-family: system-ui, -apple-system, sans-serif;
    }
    
    .valg-btn:hover { background: #3a3a3a; border-color: #777; transform: translateX(5px); }
    .pris { color: #ff5555; font-size: 0.85em; margin-left: 10px; }

    .klik-videre-tekst {
        text-align: center;
        color: #888;
        font-style: italic;
        animation: tekstPuls 2s infinite;
        margin-top: 10px;
        user-select: none;
    }
    
    @keyframes tekstPuls {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
</style>