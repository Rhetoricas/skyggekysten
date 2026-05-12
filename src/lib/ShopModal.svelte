<script lang="ts">
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
            syncTilDb();
        } else {
            spilTilstand.livspoint -= 2;
            spilTilstand.logBesked = `Købmanden smider dig ud for at røre ved noget du ikke har råd til.`;
            syncTilDb();
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
        syncTilDb();
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
                        {#if tilbud.beskrivelse}
                            <p class="vare-regler">{tilbud.beskrivelse}</p>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>

        <div class="sell-section">
            <p>Dine ting (klik for at sælge):</p>
            
            <div class="inventory-small-row">
                <div class="small-item guld-item" title="Din formue">
                    <img src="/inventory/guld.webp" alt="Guld" />
                    <span class="count">{spilTilstand.guldTotal}</span>
                </div>

                {#each spilTilstand.mitUdstyr as vare (vare.id)}
                    {@const dbInfo = itemDB[vare.id]}
                    {#if dbInfo}
                        <div class="small-item clickable" 
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
        position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; 
        background: rgba(0,0,0,0.85); z-index: 200; display: flex; 
        align-items: center; justify-content: center;
    }
    .shop-content { 
        background: #111; padding: 30px; border-radius: 4px;
        border: 1px solid #333;
        max-width: 800px; width: 90%; text-align: center;
    }
    h2 { color: #ffcc00; text-transform: uppercase; margin-bottom: 30px; }
    
    .shop-grid { 
        display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px;
    }
    .vare-kort { 
        cursor: pointer; transition: transform 0.1s;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        width: 160px;
        padding: 10px; border: 1px solid transparent; border-radius: 6px;
    }
    .vare-kort:hover { 
        transform: scale(1.05); background: rgba(255, 255, 255, 0.05);
        border-color: #333;
    }
    .vare-ikon { height: 80px; width: auto; }
    .vare-navn { color: #eee; font-size: 1.1rem; }
    .vare-pris { color: gold; font-weight: bold; }
    
    .vare-regler {
        font-size: 0.9rem; color: #999; line-height: 1.4;
        margin: 5px 0 0 0; font-style: italic; border-top: 1px solid #333;
        padding-top: 8px; text-align: center;
    }
    
    .sell-section { border-top: 1px solid #222; padding-top: 20px; margin-top: 20px; }
    .sell-section p { font-size: 0.9rem; color: #666; margin-bottom: 15px; }
    
    .inventory-small-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    
    .small-item { 
        position: relative; width: 40px; height: 40px; border: 1px solid #333; 
        background: #080808;
    }
    .small-item.clickable { cursor: pointer; }
    .small-item.guld-item { cursor: default; border-color: #554400; }
    .small-item img { width: 100%; height: 100%; object-fit: contain; }
    .small-item .count { 
        position: absolute; bottom: -2px; right: -2px; background: black; 
        color: gold; font-size: 0.7rem; padding: 0 3px;
    }
    
    .forlad-btn { 
        margin-top: 40px; background: transparent; border: 1px solid #444; 
        color: #888; padding: 10px 20px; cursor: pointer; 
        border-radius: 4px; transition: 0.2s;
    }
    .forlad-btn:hover { background: #333; color: white; }

    @media (max-width: 700px) {
        .shop-overlay {
            align-items: stretch;
            padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px);
            box-sizing: border-box;
        }

        .shop-content {
            width: 100%;
            max-width: none;
            max-height: 100%;
            overflow-y: auto;
            padding: 16px;
            box-sizing: border-box;
        }

        h2 {
            margin-bottom: 14px;
            font-size: 1.25rem;
        }

        .shop-grid {
            gap: 8px;
            margin-bottom: 18px;
        }

        .vare-kort {
            width: calc(50% - 8px);
            min-width: 130px;
            padding: 8px;
            gap: 5px;
        }

        .vare-ikon {
            height: 54px;
        }

        .vare-navn {
            font-size: 0.92rem;
        }

        .vare-regler {
            font-size: 0.76rem;
        }

        .forlad-btn {
            margin-top: 18px;
        }
    }
</style>
