<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { eventState, kanViseValg, tagValg, startEvent } from '$lib/eventMotor.svelte';
    import { eventBibliotek, type Valg } from '$lib/eventBibliotek';
    import { fremtvingKollaps } from '$lib/overlevelse.svelte';
    import { itemDB } from '$lib/spildata';

    let { lukEvent } = $props<{ lukEvent: () => void }>();

    let aktueltFelt = $derived(spilTilstand.gitter[spilTilstand.spillerIndex]);
    let rootEvent = $derived(aktueltFelt?.eventID ? eventBibliotek[aktueltFelt.eventID] : null);
    let grundBiome = $derived(rootEvent ? (Array.isArray(rootEvent.biome) ? rootEvent.biome[0] : rootEvent.biome) : 'event');

    $effect(() => {
        if (eventState.log.length > 0) {
            const container = document.querySelector('.log-container');
            if (container) container.scrollTop = container.scrollHeight;
        }
    });

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
                    {@const harAdgang = kanViseValg(valg)}
                    
                    <button 
                        class="valg-btn" 
                        class:ulåst={harAdgang}
                        class:låst={!harAdgang}
                        disabled={!harAdgang}
                        onclick={(e) => { e.stopPropagation(); tagValg(valg); }}
                    >
                        <span class="valg-tekst">{valg.tekst}</span>
                        
                        {#if !harAdgang}
                            <div class="manglende-betingelse">
                                {#if valg.kraeverKarakter}
                                    <span class="mangel-ikon karakter-mangel" title="Kræver specifik helt"></span>
                                {/if}
                                {#if valg.kraeverItem && itemDB[valg.kraeverItem]}
                                    <img src={itemDB[valg.kraeverItem].billede} alt="Mangler genstand" class="mangel-ikon" title="Du mangler dette" />
                                {/if}
                                {#if valg.kosterItem && itemDB[valg.kosterItem]}
                                    <img src={itemDB[valg.kosterItem].billede} alt="Koster genstand" class="mangel-ikon koster-mangel" title="Du skal betale med dette" />
                                {/if}
                                {#if valg.puljeVaerdi}
                                    <span class="mangel-guld">Mangler {valg.puljeVaerdi} Guld</span>
                                {/if}
                                {#if valg.kosterEnergi}
                                    <span class="mangel-guld">Mangler {valg.kosterEnergi} Energi</span>
                                {/if}
                            </div>
                        {/if}
                    </button>
                {/each}
                
                {#if eventState.aktivt.valg.every((v: Valg) => !kanViseValg(v))}
                    <button class="valg-btn ulåst flygt-btn" onclick={(e) => { e.stopPropagation(); lukEvent(); }}>Flygt fra faren!</button>
                {/if}
            {:else}
                <p class="klik-videre-tekst">Klik for at fortsætte...</p>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .stun-overlay { 
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 150;
        box-shadow: inset 0 0 150px rgba(200, 0, 0, 0.8); animation: blodPuls 2s infinite;
    }
    
    @keyframes blodPuls { 
        0%, 100% { opacity: 0.4; } 
        50% { opacity: 1; } 
    }
    
    .event-overlay { 
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100dvh;
        background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center;
        z-index: 1000;
        font-family: system-ui, -apple-system, sans-serif;
    }
    
    .event-boks { 
        background: #1a1a1a;
        color: #e0e0e0; border: 2px solid #4a4a4a; padding: 20px; width: 600px; max-width: 90%;
        min-height: 650px;
        max-height: 90vh; overflow-y: auto; display: flex;
        flex-direction: column; gap: 15px; border-radius: 8px;
    }

    .klik-klar {
        cursor: pointer;
        transition: border-color 0.3s;
    }

    .klik-klar:hover {
        border-color: #777;
    }
    
    .event-boks img { 
        width: 100%;
        height: 200px; object-fit: cover; border-bottom: 2px solid #333; border-radius: 4px;
    }
    
    .event-boks h2 { 
        margin: 0;
        color: #ffcc00; font-family: 'Cinzel', serif; font-size: 1.8rem;
    }
    
    .log-container {
        flex-grow: 1;
        overflow-y: auto;
    }
    
    .log-container p { 
        margin: 5px 0;
        line-height: 1.5; font-size: 1.05rem;
    }
    
    .knap-panel { 
        display: flex;
        flex-direction: column; gap: 10px; margin-top: auto;
    }
    
    .valg-btn { 
        padding: 14px;
        background: #2a2a2a; color: white; border: 1px solid #555; cursor: pointer; 
        text-align: left; border-radius: 4px; transition: 0.2s; font-size: 1rem;
        font-family: system-ui, -apple-system, sans-serif;
        display: flex; justify-content: space-between; align-items: center;
    }
    
    .ulåst:hover { background: #3a3a3a; border-color: #777; transform: translateX(5px); }
    
    .låst {
        background: #111;
        color: #555;
        border-color: #222;
        cursor: not-allowed;
    }
    
    .valg-tekst {
        flex-grow: 1;
        padding-right: 15px;
        line-height: 1.3;
    }

    .manglende-betingelse {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        justify-content: center;
        opacity: 0.65;
        filter: grayscale(100%);
        min-width: 50px;
        max-width: 60px;
        border-left: 1px solid #333;
        padding-left: 10px;
    }

    .mangel-ikon {
        width: 32px !important; 
        height: 32px !important;
        max-width: 32px !important; 
        max-height: 32px !important; 
        object-fit: contain;
        display: block;
    }

    .karakter-mangel {
        background: url('/tiles/player.webp') center/contain no-repeat;
    }

    .koster-mangel {
        border-bottom: 1px solid #880000;
        padding-bottom: 1px;
    }
    
    .mangel-guld {
        font-size: 0.7em;
        color: #888;
        font-weight: bold;
        text-align: center;
        line-height: 1;
    }

    .flygt-btn {
        background-color: #4a1111;
        border-color: #8a2222;
        justify-content: center;
        font-weight: bold;
        color: #ffcccc;
    }

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

    @media (max-width: 700px) {
        .event-overlay {
            align-items: stretch;
            padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px);
            box-sizing: border-box;
        }

        .event-boks {
            width: 100%;
            max-width: none;
            min-height: 0;
            max-height: 100%;
            padding: 12px;
            gap: 8px;
            box-sizing: border-box;
        }

        .event-boks img {
            height: 120px;
        }

        .event-boks h2 {
            font-size: 1.25rem;
        }

        .log-container p {
            font-size: 0.92rem;
            line-height: 1.35;
        }

        .valg-btn {
            padding: 10px;
            font-size: 0.9rem;
        }

        .knap-panel {
            gap: 7px;
        }
    }
</style>
