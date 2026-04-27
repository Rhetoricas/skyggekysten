<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { startVenteSpil, vendKort, stopVenteSpil, lukVenteSpil } from '$lib/ventespil.svelte';

    let { kanSpilleIgen } = $props();
</script>

<div class="vente-overlay">
    <div class="vente-content">
        <h2>Tiden står stille</h2>
        <p class="vente-desc">Du må vente på, at de andre indhenter dig. Træk et kort.</p>

        <div class="vente-board">
            {#each spilTilstand.venteKort as kort, i (i)}
                <div
                    class="vente-kort {kort.afsloeret ? 'flipped' : ''}"
                    onclick={() => vendKort(i)}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') vendKort(i); }}
                    role="button"
                    tabindex="0"
                >
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

        <div class="pulje-sektion">
            <span class="pulje-label">Pulje på bordet:</span>
            <span class="pulje-item">
                <img src="/inventory/hp.webp" alt="HP" />
                {spilTilstand.ventePuljeLiv}
            </span>
            <span class="pulje-divider">|</span>
            <span class="pulje-item">
                <img src="/inventory/guld.webp" alt="Guld" />
                {spilTilstand.ventePuljeGuld}
            </span>
        </div>

        <div class="handling-sektion">
            {#if spilTilstand.venteFase === 'spiller' || spilTilstand.venteFase === 'viser_gevinst'}
                {#if spilTilstand.ventePuljeLiv > 0 || spilTilstand.ventePuljeGuld > 0}
                    <button class="vente-btn stop-btn" onclick={stopVenteSpil}>Stop og behold puljen</button>
                {/if}
            {:else if spilTilstand.venteFase === 'tabt' || spilTilstand.venteFase === 'vundet' || spilTilstand.venteFase === 'venter' || spilTilstand.venteFase === 'trukket'}
                <button class="vente-btn forlad-btn" onclick={lukVenteSpil}>Forlad bordet</button>

                {#if kanSpilleIgen}
                    {@const totalFormue = spilTilstand.guldTotal + spilTilstand.ventePuljeGuld}
                    <button
                        class="vente-btn spil-igen-btn"
                        disabled={totalFormue < 5}
                        onclick={() => startVenteSpil(true)}
                    >
                        Spil igen (Koster 5 Guld)
                    </button>
                {:else}
                    <button class="vente-btn udsolgt-btn" disabled>
                        De andre har indhentet dig.
                    </button>
                {/if}
            {/if}
        </div>
    </div>
</div>

<style>
    .vente-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .vente-content { background: #1a1a1a; padding: 30px; border-radius: 8px; max-width: 800px; width: 95%; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    .vente-content h2 { margin-top: 0; color: #ffcc00; }
    .vente-desc { font-size: 16px; margin-bottom: 20px; color: #ccc; }
    .vente-board { display: flex; gap: 20px; justify-content: center; margin: 40px 0; flex-wrap: wrap; }
    .vente-kort { width: 160px; height: 224px; cursor: pointer; perspective: 1000px; }
    .vente-kort-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
    .vente-kort.flipped .vente-kort-inner { transform: rotateY(180deg); }
    .vente-kort-front, .vente-kort-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 12px; background-size: cover; background-position: center; box-shadow: 0 5px 15px rgba(0,0,0,0.8); border: 2px solid #444; }
    .vente-kort-back { transform: rotateY(180deg); display: flex; align-items: center; justify-content: center; }
    .kort-vaerdi { font-size: 56px; font-weight: 900; color: white; text-shadow: 3px 3px 6px black, -1px -1px 0 black; background: rgba(0,0,0,0.4); padding: 10px 25px; border-radius: 50%; }
    .pulje-sektion { margin: 25px 0; font-size: 24px; font-weight: bold; color: gold; display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .pulje-label { color: #aaa; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
    .pulje-item { display: flex; align-items: center; gap: 8px; }
    .pulje-item img { height: 32px; filter: drop-shadow(0 0 2px black); }
    .pulje-divider { color: #444; }
    .handling-sektion { display: flex; gap: 20px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
    .vente-btn { padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; border: 1px solid #444; transition: 0.2s; color: white; }
    .stop-btn { background: #2a4a2a; }
    .stop-btn:hover { background: #3a5a3a; }
    .forlad-btn { background: #2a2a2a; }
    .forlad-btn:hover { background: #3a3a3a; }
    .spil-igen-btn { background: #8b6508; }
    .spil-igen-btn:hover:not(:disabled) { background: #a67c00; }
    .spil-igen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .udsolgt-btn { background: #444; color: #888; cursor: not-allowed; }
</style>