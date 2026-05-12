<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { tilfoejTilRygsæk } from '$lib/spilmotor';

    let { lukShop } = $props();

    function købVare(id: string) {
        const dbItem = itemDB[id];
        if (!dbItem) return;

        const grundPris = dbItem.pris;

        if (spilTilstand.guldTotal >= grundPris) {
            spilTilstand.guldTotal -= grundPris;
            tilfoejTilRygsæk(id, 1);
            spilTilstand.logBesked = `Du købte ${dbItem.navn}.`;
        } else {
            spilTilstand.logBesked = `Købmanden ryster på hovedet. Du mangler ${grundPris - spilTilstand.guldTotal} guld.`;
        }
    }
</script>

<div class="shop-overlay">
    <div class="shop-content">
        <h2>{spilTilstand.gitter[spilTilstand.spillerIndex]?.biome === 'by' ? 'Byens Butik' : 'Markedet'}</h2>
        <p class="shop-desc">Her kan du forsyne dig med udstyr til den videre rejse gennem tågen.</p>

        <div class="shop-grid">
            {#each spilTilstand.aktivShop as itemId (itemId)}
                {@const tilbud = itemDB[itemId]}

                <div class="vare-kort">
                    <div>
                        <img src={tilbud.billede} alt={tilbud.navn} class="vare-ikon" /><br />
                        <strong class="vare-navn">{tilbud.navn}</strong><br />
                        <span class="vare-pris">Pris: <strong>{tilbud.pris} Guld</strong></span>
                    </div>

                    <div class="køb-sektion">
                        <button class="action-btn" onclick={() => købVare(itemId)}>Køb</button>
                    </div>
                </div>
            {/each}
        </div>

        <button class="forlad-btn" onclick={lukShop}>Nej tak, forlad butikken</button>
    </div>
</div>

<style>
    .shop-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; }
    .shop-content { background: #1a1a1a; padding: 30px; border-radius: 8px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    .shop-content h2 { margin-top: 0; color: #ffcc00; text-align: center; }
    .shop-desc { font-size: 16px; line-height: 1.5; margin-bottom: 25px; text-align: center; }
    .shop-grid { display: flex; gap: 20px; margin-bottom: 25px; flex-wrap: wrap; }
    .vare-kort { flex: 1; min-width: 200px; background: #222; padding: 15px; border: 1px solid gold; border-radius: 6px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }
    .vare-ikon { height: 80px; width: auto; object-fit: contain; margin-bottom: 10px; }
    .vare-navn { font-size: 18px; }
    .vare-pris { color: #ccc; display: block; margin: 10px 0; }
    .vare-pris strong { color: gold; }
    .køb-sektion { margin-top: 15px; }
    .action-btn { background: #2a4a2a; border: 1px solid #444; color: white; padding: 12px; font-size: 16px; cursor: pointer; border-radius: 4px; width: 100%; transition: 0.2s; }
    .action-btn:hover { background: #3a5a3a; border-color: #666; }
    .forlad-btn { background: #2a2a2a; border: 1px solid #444; color: white; padding: 12px; font-size: 16px; cursor: pointer; border-radius: 4px; width: 100%; text-align: center; transition: 0.2s; }
    .forlad-btn:hover { background: #3a3a3a; border-color: #666; }
</style>