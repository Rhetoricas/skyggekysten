<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { erSpillerITaagen, udfoerBlodofring } from '$lib/overlevelse.svelte';
    import { grav } from '$lib/undergrund.svelte'; // Korrigeret import-sti

    let erITågen = $derived(erSpillerITaagen());

    // Central router til alt grej i tasken
    function haandterInventoryKlik(vareId: string) {
        if (vareId === 'skovl') {
            grav();
        }
    }
</script>

<footer class="ui">
    <div class="log-line">
        {#if spilTilstand.logBesked}{spilTilstand.logBesked}{:else}&nbsp;{/if}
    </div>

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
                <div 
                    class="inventory-item {vare.id === 'skovl' ? 'klikbar' : ''}" 
                    onclick={() => haandterInventoryKlik(vare.id)}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') haandterInventoryKlik(vare.id); }}
                    role="button"
                    tabindex="0"
                >
                    <img src={vare.billede} alt={vare.navn} class="inventory-icon" />
                    {#if vare.level > 1}
                        <span class="level-text">Lvl {vare.level}</span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</footer>

<style>
    .ui {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100vw;
        box-sizing: border-box;
        z-index: 50;
        padding-bottom: 1rem;
        pointer-events: none; 
    }

    .log-line {
        text-align: center;
        font-family: 'Cinzel', serif;
        color: white;
        text-shadow: 1px 1px 4px black, 0 0 10px black;
        margin-bottom: 0.5rem;
        min-height: 1.5rem;
        font-size: 1.1rem;
        pointer-events: none;
    }

    .ui-content {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: center;
        width: 100%;
        gap: 2rem;
        padding: 0 1rem;
        box-sizing: border-box;
        pointer-events: auto; 
        flex-wrap: wrap;
    }

    .status-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1.5rem;
        flex: 1 1 40%;
        min-width: 200px;
    }

    .inventory-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        flex-wrap: wrap;
        flex: 1 1 40%;
        min-width: 200px;
    }

    .status-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;
        font-family: monospace;
        font-size: 1.2rem;
    }

    .status-icon {
        height: 40px;
        width: auto;
        margin-bottom: 4px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }

    .inventory-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        outline: none; /* Fjerner den grimme blå standard-firkant, når man klikker */
    }

    .inventory-item.klikbar {
        cursor: pointer;
        transition: transform 0.1s ease;
    }
    
    .inventory-item.klikbar:hover, 
    .inventory-item.klikbar:focus {
        transform: scale(1.05) translateY(-2px);
    }
    
    .inventory-item.klikbar:active {
        transform: scale(0.95);
    }

    .inventory-icon {
        height: 50px;
        width: auto;
        border-radius: 4px;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9));
    }

    .level-text {
        position: absolute;
        bottom: -8px;
        background: black;
        color: gold;
        font-size: 0.7rem;
        padding: 2px 4px;
        border: 1px solid gold;
        border-radius: 4px;
        font-family: sans-serif;
        font-weight: bold;
    }

    .energi-sektion { 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        position: relative; 
    }
    
    .energi-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .energi-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        margin-bottom: 4px;
    }

    .lysprik {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #222;
        border: 1px solid #000;
        box-shadow: inset 0 0 4px black;
    }

    .lysprik.taendt {
        background: #00e5ff;
        border-color: #fff;
        box-shadow: 0 0 8px #00e5ff, inset 0 0 4px white;
    }

    .dag-taeller {
        font-family: 'Cinzel', serif;
        color: white;
        font-weight: bold;
        font-size: 0.9rem;
        text-shadow: 1px 1px 2px black;
    }

    .blodofring-btn { 
        background: transparent; 
        border: none; 
        cursor: pointer; 
        padding: 0; 
        margin-bottom: -5px; 
        z-index: 10; 
        animation: hjertebanken 1.5s infinite; 
        filter: drop-shadow(0 0 6px darkred); 
        transition: filter 0.2s; 
    }
    
    .blodofring-btn:hover { 
        filter: drop-shadow(0 0 12px red) brightness(1.2); 
    }
    
    .blodofring-btn img { 
        height: 45px; 
        width: auto; 
    }
    
    @keyframes hjertebanken { 
        0% { transform: scale(1); } 
        15% { transform: scale(1.15); } 
        30% { transform: scale(1); } 
        45% { transform: scale(1.15); } 
        100% { transform: scale(1); } 
    }
</style>