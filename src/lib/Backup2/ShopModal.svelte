<script lang="ts">
    // ShopModal.svelte
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { tilfoejTilRygsæk, brugFraRygsæk } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';
    import { fremtvingKollaps } from '$lib/overlevelse.svelte';

    let { lukShop } = $props<{ lukShop: () => void }>();

    function købVare(id: string) {
        const vareData = itemDB[id];
        if (!vareData) return;

        if (spilTilstand.guldTotal >= vareData.pris) {
            spilTilstand.guldTotal -= vareData.pris;
            tilfoejTilRygsæk(id, 1);
            spilTilstand.logBesked = `Du købte ${vareData.navn}.`;
            syncTilDb(true);
        } else {
            spilTilstand.livspoint -= 2;
            spilTilstand.logBesked = `Købmanden smider dig ud for at røre ved noget du ikke har råd til.`;
            syncTilDb(true);
            lukShop();
            if (spilTilstand.livspoint <= 0) fremtvingKollaps();
        }
    }

    function sælgVare(id: string) {
        const vareData = itemDB[id];
        if (!vareData) return;
        
        const salgspris = Math.floor(vareData.pris / 1.5);
        spilTilstand.guldTotal += salgspris;
        brugFraRygsæk(id, 1);
        spilTilstand.logBesked = `Du solgte ${vareData.navn} for ${salgspris} guld.`;
        syncTilDb(true);
    }
</script>

<div class="shop-overlay">
    <div class="shop-content">
        <h2>{spilTilstand.gitter[spilTilstand.spillerIndex]?.biome === 'by' ? 'Byens Butik' : 'Markedet'}</h2>
        
        <div class="shop-grid">
            {#each spilTilstand.aktivShop || [] as itemId (itemId)}
                {@const tilbud = itemDB[itemId]}
                {#if tilbud}
                    <div class="vare-kort" 
                         onclick={() => købVare(itemId)} 
                         onkeydown={(e) => { if (e.key === 'Enter') købVare(itemId); }}
                         role="button" tabindex="0">
                        <img src={tilbud.billede} alt="" class="vare-ikon" />
                        <strong class="vare-navn">{tilbud.navn}</strong>
                        <span class="vare-pris">{tilbud.pris} Guld</span>
                    </div>
                {/if}
            {/each}
        </div>

        <div class="sell-section">
            <p>Dine ting (klik for at sælge):</p>
            <div class="inventory-small-row">
                {#each spilTilstand.mitUdstyr as vare (vare.id)}
                    {@const dbInfo = itemDB[vare.id]}
                    {#if dbInfo}
                        <div class="small-item" 
                             onclick={() => sælgVare(vare.id)} 
                             onkeydown={(e) => { if (e.key === 'Enter') sælgVare(vare.id); }}
                             role="button" tabindex="0">
                            <img src={dbInfo.billede} alt={dbInfo.navn} />
                            <span class="count">{vare.maengde}</span>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        <button class="forlad-btn" onclick={lukShop}>Forlad stedet</button>
    </div>
</div>

<style>
    .shop-overlay { 
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
        background: rgba(0,0,0,0.85); z-index: 200; display: flex; 
        align-items: center; justify-content: center;
    }
    .shop-content { 
        background: #111; padding: 30px; border-radius: 4px; border: 1px solid #333;
        max-width: 600px; width: 90%; text-align: center;
    }
    h2 { color: #ffcc00; text-transform: uppercase; margin-bottom: 30px; }
    .shop-grid { display: flex; gap: 40px; justify-content: center; margin-bottom: 40px; }
    .vare-kort { 
        cursor: pointer; transition: transform 0.1s; display: flex; 
        flex-direction: column; align-items: center; gap: 10px;
    }
    .vare-kort:hover { transform: scale(1.1); }
    .vare-ikon { height: 100px; width: auto; }
    .vare-navn { color: #eee; }
    .vare-pris { color: gold; font-weight: bold; }
    
    .sell-section { border-top: 1px solid #222; padding-top: 20px; margin-top: 20px; }
    .sell-section p { font-size: 0.9rem; color: #666; margin-bottom: 10px; }
    .inventory-small-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    .small-item { 
        position: relative; width: 40px; height: 40px; border: 1px solid #333; 
        cursor: pointer; background: #080808; 
    }
    .small-item img { width: 100%; height: 100%; object-fit: contain; }
    .small-item .count { 
        position: absolute; bottom: -2px; right: -2px; background: black; 
        color: gold; font-size: 0.7rem; padding: 0 3px; 
    }
    
    .forlad-btn { 
        margin-top: 40px; background: transparent; border: 1px solid #444; 
        color: #888; padding: 10px 20px; cursor: pointer; 
    }
</style>