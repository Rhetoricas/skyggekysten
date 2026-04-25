<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { erSpillerITaagen, udfoerBlodofring } from '$lib/overlevelse.svelte';

    let erITågen = $derived(erSpillerITaagen());
</script>

<footer class="ui">
    <div class="ui-content">
        <div class="status-row">
            <div class="status-item">
                <img src="/inventory/hp.webp" alt="Liv" class="status-icon" />
                <span class="status-value">{spilTilstand.livspoint}</span>
            </div>
            <div class="status-item">
                <img src="/inventory/guld.webp" alt="Guld" class="status-icon" />
                <span class="status-value">{spilTilstand.guldTotal}</span>
            </div>
            
            <div class="energi-sektion">
                {#if erITågen}
                    <button class="blodofring-btn" onclick={udfoerBlodofring} title="Ofring: 10 HP for 1 Energi">
                        <img src="/tiles/blodofring.webp" alt="Blodofring" />
                    </button>
                {/if}
                <div class="energi-container">
                    <div class="energi-grid">
                        {#each Array(9) as tomPlads, i (i)}
                            <div data-dummy={tomPlads} class="lysprik {i < (spilTilstand.nuvaerendeEnergi || 0) ? 'taendt' : ''}"></div>
                        {/each}
                    </div>
                    <div class="dag-taeller">Dag {spilTilstand.dag || 1}</div>
                </div>
            </div>

        </div>
        
        <div class="inventory-row">
            {#each spilTilstand.inventory as vare (vare.id)}
                <div class="inventory-item">
                    <img src={vare.billede} alt={vare.navn} class="inventory-icon" />
                    {#if vare.level > 1}
                        <span class="level-text">Lvl {vare.level}</span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <div class="log-line">
        {#if spilTilstand.logBesked}{spilTilstand.logBesked}{:else}&nbsp;{/if}
    </div>
</footer>

<style>
    .energi-sektion { display: flex; flex-direction: column; align-items: center; position: relative; }
    .blodofring-btn { background: transparent; border: none; cursor: pointer; padding: 0; margin-bottom: -5px; z-index: 10; animation: hjertebanken 1.5s infinite; filter: drop-shadow(0 0 6px darkred); transition: filter 0.2s; }
    .blodofring-btn:hover { filter: drop-shadow(0 0 12px red) brightness(1.2); }
    .blodofring-btn img { height: 45px; width: auto; }
    @keyframes hjertebanken { 0% { transform: scale(1); } 15% { transform: scale(1.15); } 30% { transform: scale(1); } 45% { transform: scale(1.15); } 100% { transform: scale(1); } }
</style>