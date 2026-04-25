<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { eventState, kanViseValg, tagValg } from '$lib/eventMotor.svelte';
    import { itemDB } from '$lib/spildata';
    import { startVenteSpil, vendKort, stopVenteSpil, lukVenteSpil } from '$lib/ventespil.svelte';

    let { lukEventOgShop, købEllerOpgrader, hentLangsomsteDag } = $props<{
        lukEventOgShop: () => void;
        købEllerOpgrader: (id: string) => void;
        hentLangsomsteDag: () => number;
    }>();

    const MAX_DAGE_FORAN = 5;
</script>

{#if eventState.aktivt}
    {#if spilTilstand.erBevidstløs}
        <div class="stun-overlay"></div>
    {/if}
    <div class="event-overlay">
        <div class="event-boks">
            
            <img src={eventState.aktivt.billede || `/events/ev_${eventState.aktivt.biome[0]}.webp`} 
                 alt="Event baggrund" 
                 onerror={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/events/event.webp'; }} />
             
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
                            <button onclick={() => tagValg(valg)}>
                                {valg.tekst}
                                {#if valg.kosterItem} <span class="pris">(Koster {valg.kosterItem})</span>{/if}
                                {#if valg.puljeVaerdi} <span class="pris">(Koster {valg.puljeVaerdi} Guld)</span>{/if}
                            </button>
                        {/if}
                    {/each}
                </div>
            {/if}

            <button class="luk-knap" onclick={lukEventOgShop}>
                Forlad stedet
            </button>

        </div>
    </div>
{/if}

{#if spilTilstand.aktivShop && spilTilstand.aktivShop.length > 0}
    {@const erMarked = spilTilstand.gitter[spilTilstand.spillerIndex].biome === 'marked'}
    
    <div class="event-modal">
        <div class="event-content" style="max-width: 700px;">
            <h2>{erMarked ? 'Markedet' : 'Byens Smedje & Apotek'}</h2>
            <p class="event-desc">
                {erMarked ? 'Her kan du købe nyt udstyr, men ikke opgradere det.' : 'Byen tilbyder både salg af nyt udstyr og opgradering af dit eksisterende grej.'}
            </p>
            
            <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                {#each spilTilstand.aktivShop as itemId (itemId)}                             
                    {@const tilbud = itemDB[itemId]}
                    {@const grundPris = tilbud.pris} 
                    {@const ejetVare = spilTilstand.inventory.find(i => i.id === itemId)}
                    {@const aktuelPris = ejetVare ? grundPris * Math.pow(2, ejetVare.level) : grundPris}                
                    <div style="flex: 1; background: #222; padding: 15px; border: 1px solid gold; border-radius: 6px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <img src={tilbud.billede} alt={tilbud.navn} style="height: 80px; width: auto; object-fit: contain; margin-bottom: 10px;" /><br>
                            <strong style="font-size: 18px;">{tilbud.navn} {#if ejetVare}(Lvl {ejetVare.level}){/if}</strong><br>
                            <span style="color: #ccc; display: block; margin: 10px 0;">Pris: <strong style="color: gold;">{aktuelPris} Guld</strong></span>
                            
                            {#if ejetVare && erMarked}
                                <p style="color: #ff5555; font-size: 14px;">Markedet kan ikke opgradere denne.</p>
                            {/if}
                        </div>
                        
                        <div style="margin-top: 15px;">
                            {#if !ejetVare || !erMarked}
                                <button class="action-btn" onclick={() => købEllerOpgrader(itemId)}>
                                    {#if ejetVare}Opgrader{:else}Køb{/if}
                                </button>
                            {:else}
                                <button class="action-btn" style="background: #444; color: #888; cursor: not-allowed;" disabled>Ejes allerede</button>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <button class="valg-btn" style="width: 100%; text-align: center;" onclick={lukEventOgShop}>Nej tak, forlad butikken</button>
        </div>
    </div>
{/if}

{#if spilTilstand.venteSpilAktiv}
    <div class="event-modal" style="background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px);">
        <div class="event-content" style="max-width: 800px; text-align: center;">
            <h2>Tiden står stille</h2>
            <p class="event-desc">Du må vente på, at de andre indhenter dig. Træk et kort.</p>

            <div class="vente-board">
                {#each spilTilstand.venteKort as kort, i (i)}
                    <div class="vente-kort" class:flipped={kort.afsloeret} onclick={() => vendKort(i)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') vendKort(i); }} role="button" tabindex="0">
                        <div class="vente-kort-inner">
                            <div class="vente-kort-front" style="background-image: url('/events/kort_bag.webp')"></div>
                            <div class="vente-kort-back" style="background-image: url('/events/kort_{kort.type}.webp')">
                                {#if kort.type !== 'slut'}
                                    <span class="kort-vaerdi">{kort.vaerdi}</span>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

            <div style="margin: 25px 0; font-size: 24px; font-weight: bold; color: gold; display: flex; align-items: center; justify-content: center; gap: 20px;">
                <span style="color: #aaa; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Pulje på bordet:</span>
                <span style="display: flex; align-items: center; gap: 8px;">
                    <img src="/inventory/hp.webp" style="height: 32px; filter: drop-shadow(0 0 2px black);" alt="HP"> 
                    {spilTilstand.ventePuljeLiv}
                </span>
                <span style="color: #444;">|</span>
                <span style="display: flex; align-items: center; gap: 8px;">
                    <img src="/inventory/guld.webp" style="height: 32px; filter: drop-shadow(0 0 2px black);" alt="Guld"> 
                    {spilTilstand.ventePuljeGuld}
                </span>
            </div>

            <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                {#if spilTilstand.venteFase === 'spiller' || spilTilstand.venteFase === 'viser_gevinst'}
                    {#if spilTilstand.ventePuljeLiv > 0 || spilTilstand.ventePuljeGuld > 0}
                        <button class="action-btn" onclick={stopVenteSpil}>Stop og behold puljen</button>
                    {/if}
                    
                {:else if spilTilstand.venteFase === 'tabt' || spilTilstand.venteFase === 'vundet' || spilTilstand.venteFase === 'venter' || spilTilstand.venteFase === 'trukket'}
                    <button class="action-btn" onclick={lukVenteSpil}>Forlad bordet</button>
                    
                    {#if spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN}
                        {@const totalFormue = spilTilstand.guldTotal + spilTilstand.ventePuljeGuld}
                        <button class="action-btn" 
                                style="background: #8b6508; opacity: {totalFormue >= 5 ? '1' : '0.4'};" 
                                disabled={totalFormue < 5} 
                                onclick={() => startVenteSpil(true)}>
                            Spil igen (Koster 5 Guld)
                        </button>
                    {:else}
                        <button class="action-btn" style="background: #444; color: #888; cursor: not-allowed;" disabled>
                            De andre har indhentet dig.
                        </button>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .event-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .event-boks { background: #1a1a1a; color: #e0e0e0; border: 2px solid #4a4a4a; padding: 20px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
    .event-boks img { width: 100%; height: 200px; object-fit: cover; border-bottom: 2px solid #333; }
    .log-container p { margin: 5px 0; line-height: 1.5; }
    .knap-panel { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
    .event-boks button { padding: 10px; background: #2a2a2a; color: white; border: 1px solid #555; cursor: pointer; text-align: left; }
    .event-boks button:hover { background: #3a3a3a; }
    .pris { color: #ff5555; font-size: 0.8em; margin-left: 10px; }
    .luk-knap { margin-top: 20px; background: #4a1111 !important; text-align: center !important; }
</style>