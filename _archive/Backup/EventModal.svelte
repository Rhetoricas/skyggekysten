<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { eventState, kanViseValg, tagValg } from '$lib/eventMotor.svelte';

    let { lukEvent } = $props();
</script>

{#if eventState.aktivt}

{#if spilTilstand.erBevidstløs}
    <div class="stun-overlay"></div>
{/if}

<div class="event-overlay">
    <div class="event-boks">
<img
    src={eventState.aktivt.billede || `/events/ev_${Array.isArray(eventState.aktivt.biome) ? eventState.aktivt.biome[0] : eventState.aktivt.biome}.webp`}
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

        {#if !eventState.valgLåst}
            <div class="knap-panel">
                {#each eventState.aktivt.valg as valg (valg.tekst)}
                    {#if kanViseValg(valg)}
                        <button class="valg-btn" onclick={() => tagValg(valg)}>
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
            </div>
        {/if}

        <button class="luk-knap" onclick={lukEvent}>Forlad stedet</button>
    </div>
</div>
 {/if}


<style>
    .stun-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 150; box-shadow: inset 0 0 150px rgba(200, 0, 0, 0.8); animation: blodPuls 2s infinite; }
    @keyframes blodPuls { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    .event-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .event-boks { background: #1a1a1a; color: #e0e0e0; border: 2px solid #4a4a4a; padding: 20px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; border-radius: 8px; }
    .event-boks img { width: 100%; height: 200px; object-fit: cover; border-bottom: 2px solid #333; border-radius: 4px; }
    .event-boks h2 { margin: 0; color: #ffcc00; }
    .log-container p { margin: 5px 0; line-height: 1.5; }
    .knap-panel { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
    .valg-btn { padding: 12px; background: #2a2a2a; color: white; border: 1px solid #555; cursor: pointer; text-align: left; border-radius: 4px; transition: 0.2s; font-size: 16px; }
    .valg-btn:hover { background: #3a3a3a; border-color: #777; }
    .pris { color: #ff5555; font-size: 0.8em; margin-left: 10px; }
    .luk-knap { margin-top: 20px; background: #4a1111; color: white; padding: 12px; border: 1px solid #661111; border-radius: 4px; text-align: center; cursor: pointer; transition: 0.2s; font-size: 16px; }
    .luk-knap:hover { background: #6a1111; }
</style>