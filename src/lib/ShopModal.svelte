<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { tilfoejTilRygsæk, brugFraRygsæk, kanModtageItem, laegGuldIKasseForAktueltFelt, tagGuldFraKasseForAktueltFelt, fjernVareFraAktuelShop, naegtHandelForAktuelSpillerPaaAktueltFelt } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';
    import { fremtvingKollaps } from '$lib/overlevelse.svelte';
    import { beregnSalgspris, diamantSalgspris } from '$lib/score';
    import { markerTutorialHandling } from '$lib/tutorial.svelte';
    import { tekst } from '$lib/i18n.svelte';
    import { itemBeskrivelse, itemNavn } from '$lib/spilTekst';

    let { lukShop } = $props<{ lukShop: () => void }>();

    function kanKoebeFintToejMedKlude(id: string) {
        if (id !== 'flot_toej') return false;
        const harKlude = spilTilstand.mitUdstyr.some((ting) => ting.id === 'klude' && ting.maengde > 0);
        const harBedreToej = spilTilstand.mitUdstyr.some((ting) => (ting.id === 'flot_toej' || ting.id === 'royalt_toej') && ting.maengde > 0);
        return harKlude && !harBedreToej;
    }

    function vareKoebspris(id: string) {
        const vareData = itemDB[id];
        if (!vareData) return 0;
        const kludeRabat = kanKoebeFintToejMedKlude(id) ? beregnSalgspris('klude') : 0;
        return Math.max(0, vareData.pris - kludeRabat);
    }

    function købVare(id: string) {
        const vareData = itemDB[id];
        if (!vareData) return;

        if (vareData.kanKoebes === false) {
            spilTilstand.logBesked = tekst(`${itemNavn(id)} kan ikke købes her.`, `${itemNavn(id)} cannot be bought here.`);
            syncTilDb();
            return;
        }

        const brugerKludeSomRabat = kanKoebeFintToejMedKlude(id);

        if (!brugerKludeSomRabat && !kanModtageItem(id)) {
            spilTilstand.logBesked = id === 'skovl' || id === 'mesterskovl'
                ? tekst('Du har allerede en skovl. Find et værksted, hvis den skal forbedres.', 'You already have a shovel. Find a workshop if it needs upgrading.')
                : id === 'stav' || id === 'dragestav'
                    ? tekst('Du har allerede en stav. Find et værksted, hvis den skal forbedres.', 'You already have a staff. Find a workshop if it needs upgrading.')
                    : id === 'soegekvist' || id === 'runekvist'
                        ? tekst('Du har allerede en søgekvist. Find et værksted, hvis den skal forbedres.', 'You already have a dowsing rod. Find a workshop if it needs upgrading.')
                        : id === 'dirk' || id === 'mesterdirk'
                            ? tekst('Du har allerede en dirk. Find et værksted, hvis den skal forbedres.', 'You already have a lockpick. Find a workshop if it needs upgrading.')
                            : id === 'kniv' || id === 'mesterkniv'
                                ? tekst('Du har allerede en kniv. Find et værksted, hvis den skal forbedres.', 'You already have a knife. Find a workshop if it needs upgrading.')
                                : id === 'rustning' || id === 'kongepanser'
                                    ? tekst('Du har allerede en rustning. Find et værksted, hvis den skal forbedres.', 'You already have armor. Find a workshop if it needs upgrading.')
                                    : id === 'oekse' || id === 'stormoekse'
                                        ? tekst('Du har allerede en økse. Find et værksted, hvis den skal forbedres.', 'You already have an axe. Find a workshop if it needs upgrading.')
                                        : id === 'koelle' || id === 'koelle_upgr'
                                            ? tekst('Du har allerede en kølle. Find et værksted, hvis den skal forbedres.', 'You already have a club. Find a workshop if it needs upgrading.')
                                            : id === 'bue' || id === 'mesterbue'
                                                ? tekst('Du har allerede en bue. Find et værksted, hvis den skal forbedres.', 'You already have a bow. Find a workshop if it needs upgrading.')
                                                : id === 'klude' || id === 'flot_toej' || id === 'royalt_toej'
                                                    ? tekst('Du har allerede tøj. Find et værksted, hvis det skal forbedres.', 'You already have clothes. Find a workshop if they need upgrading.')
                                                    : id === 'fakkel' || id === 'solfakkel'
                                                        ? tekst('Du har allerede en fakkel. Find et værksted, hvis den skal forbedres.', 'You already have a torch. Find a workshop if it needs upgrading.')
                                                        : id === 'metaldetektor' || id === 'malmviser'
                                                            ? tekst('Du har allerede en detektor. Find et værksted, hvis den skal forbedres.', 'You already have a detector. Find a workshop if it needs upgrading.')
                                                            : id === 'sovepose' || id === 'silkesovepose'
                                                                ? tekst('Du har allerede en sovepose. Find et værksted, hvis den skal forbedres.', 'You already have a sleeping bag. Find a workshop if it needs upgrading.')
                                                                : tekst(`Du har allerede ${itemNavn(id)}.`, `You already have ${itemNavn(id)}.`);
            syncTilDb();
            return;
        }

        const kludeRabat = brugerKludeSomRabat ? beregnSalgspris('klude') : 0;
        const pris = Math.max(0, vareData.pris - kludeRabat);

        if (spilTilstand.guldTotal >= pris) {
            spilTilstand.guldTotal -= pris;
            laegGuldIKasseForAktueltFelt(pris);
            fjernVareFraAktuelShop(id);
            if (brugerKludeSomRabat) brugFraRygsæk('klude', 1);
            spilTilstand.logBesked = brugerKludeSomRabat
                ? tekst(`Du købte ${itemNavn(id)} for ${pris} guld. Købmanden tog dit gamle tøj som ${kludeRabat} guld i rabat.`, `You bought ${itemNavn(id)} for ${pris} gold. The merchant took your old clothes as a ${kludeRabat} gold discount.`)
                : tekst(`Du købte ${itemNavn(id)} for ${vareData.pris} guld.`, `You bought ${itemNavn(id)} for ${vareData.pris} gold.`);
            tilfoejTilRygsæk(id, 1);
            markerTutorialHandling('shop');
            if (spilTilstand.mitUdstyr.some((ting) => (ting.id === 'koelle' || ting.id === 'koelle_upgr') && ting.maengde > 0)) {
                naegtHandelForAktuelSpillerPaaAktueltFelt();
                spilTilstand.logBesked = brugerKludeSomRabat
                    ? tekst(`Du købte ${itemNavn(id)} for ${pris} guld med dit gamle tøj som rabat. Købmanden får øje på køllen og tør ikke handle mere med dig.`, `You bought ${itemNavn(id)} for ${pris} gold with your old clothes as discount. The merchant notices the club and no longer dares to trade with you.`)
                    : tekst(`Du købte ${itemNavn(id)} for ${vareData.pris} guld. Købmanden får øje på køllen og tør ikke handle mere med dig.`, `You bought ${itemNavn(id)} for ${vareData.pris} gold. The merchant notices the club and no longer dares to trade with you.`);
                lukShop();
            }
        } else {
            spilTilstand.livspoint -= 2;
            spilTilstand.logBesked = tekst('Købmanden smider dig ud for at røre ved noget du ikke har råd til.', 'The merchant throws you out for touching something you cannot afford.');
            syncTilDb();
            lukShop();
            if (spilTilstand.livspoint <= 0) fremtvingKollaps();
        }
    }

    function sælgVare(id: string) {
        const vareData = itemDB[id];
        if (!vareData) return;

        const rygsaekTing = spilTilstand.mitUdstyr.find((ting) => ting.id === id);
        const antal = Math.max(1, rygsaekTing?.maengde || 1);
        const salgspris = id === 'diamant'
            ? diamantSalgspris(rygsaekTing)
            : beregnSalgspris(id);
        if (salgspris <= 0) {
            spilTilstand.logBesked = tekst(`Købmanden vil ikke købe ${itemNavn(id)}.`, `The merchant will not buy ${itemNavn(id)}.`);
            syncTilDb();
            return;
        }

        tagGuldFraKasseForAktueltFelt(salgspris);
        spilTilstand.guldTotal += salgspris;
        spilTilstand.logBesked = id === 'diamant' && antal > 1
            ? tekst(`Du solgte ${antal} diamanter for ${salgspris} guld.`, `You sold ${antal} diamonds for ${salgspris} gold.`)
            : tekst(`Du solgte ${itemNavn(id)} for ${salgspris} guld.`, `You sold ${itemNavn(id)} for ${salgspris} gold.`);
        brugFraRygsæk(id, id === 'diamant' ? antal : 1);
    }

    function salgsHjaelp(vare: { id: string; maengde: number; diamanter?: number[] }) {
        const dbInfo = itemDB[vare.id];
        if (!dbInfo) return tekst('Genstand i din rygsæk.', 'Item in your backpack.');
        if (vare.id === 'diamant') {
            return vare.maengde > 1
                ? tekst(`${vare.maengde} diamanter. De sælges samlet for ${diamantSalgspris(vare)} guld.`, `${vare.maengde} diamonds. They sell together for ${diamantSalgspris(vare)} gold.`)
                : tekst(`Diamanten sælges for ${diamantSalgspris(vare)} guld.`, `The diamond sells for ${diamantSalgspris(vare)} gold.`);
        }
        return `${itemBeskrivelse(vare.id)} ${tekst('Klik her for at sælge den for 75% af værdien.', 'Click here to sell it for 75% of its value.')}`;
    }

    function vareSalgspris(vare: { id: string; maengde: number; diamanter?: number[] }) {
        return vare.id === 'diamant' ? diamantSalgspris(vare) : beregnSalgspris(vare.id);
    }
</script>

<div class="shop-overlay">
    <div class="shop-content">
        <h2>{spilTilstand.gitter[spilTilstand.spillerIndex]?.biome === 'by' ? tekst('Byens Butik', 'Town Shop') : tekst('Markedet', 'Market')}</h2>
        
        <div class="shop-grid">
            {#each spilTilstand.aktivShop || [] as itemId (itemId)}
                {@const tilbud = itemDB[itemId]}
                {#if tilbud && tilbud.kanKoebes !== false}
                    <div class="vare-kort" 
                         data-help-title={itemNavn(itemId)}
                         data-help-body={`${itemBeskrivelse(itemId)} ${tekst('Pris:', 'Price:')} ${vareKoebspris(itemId)} ${tekst('guld', 'gold')}${kanKoebeFintToejMedKlude(itemId) ? tekst(` efter ${beregnSalgspris('klude')} guld i rabat for dit gamle tøj`, ` after ${beregnSalgspris('klude')} gold discount for your old clothes`) : ''}.`}
                         onclick={() => købVare(itemId)} 
                         onkeydown={(e) => { if (e.key === 'Enter') købVare(itemId); }}
                         role="button" tabindex="0">
                        <img src={tilbud.billede} alt="" class="vare-ikon" />
                        <strong class="vare-navn">{itemNavn(itemId)}</strong>
                        <span class="vare-pris">{vareKoebspris(itemId)} {tekst('Guld', 'Gold')}</span>
                        {#if tilbud.beskrivelse}
                            <p class="vare-regler">{itemBeskrivelse(itemId)}</p>
                        {/if}
                    </div>
                {/if}
            {/each}
        </div>

        <div class="sell-section">
            <p>{tekst('Dine ting (klik for at sælge for 75% af værdien):', 'Your items (click to sell for 75% of value):')}</p>
            
            <div class="inventory-small-row">
                <div class="small-item guld-item" title={tekst('Din formue', 'Your wealth')} data-help-title={tekst('Guld', 'Gold')} data-help-body={tekst('Din nuværende formue. Guld bruges til køb og tæller med i score.', 'Your current wealth. Gold is used for purchases and counts toward score.')}>
                    <img src="/inventory/guld.webp" alt={tekst('Guld', 'Gold')} />
                    <span class="count">{spilTilstand.guldTotal}</span>
                </div>

                {#each spilTilstand.mitUdstyr as vare (vare.id)}
                    {@const dbInfo = itemDB[vare.id]}
                    {#if dbInfo}
                        <div class="small-item clickable" 
                             data-help-title={itemNavn(vare.id)}
                             data-help-body={salgsHjaelp(vare)}
                             onclick={() => sælgVare(vare.id)} 
                             onkeydown={(e) => { if (e.key === 'Enter') sælgVare(vare.id); }}
                            role="button" tabindex="0">
                            <img src={dbInfo.billede} alt={itemNavn(vare.id)} />
                            <span class="count">{vare.maengde}</span>
                            <span class="sell-price">{vareSalgspris(vare)}</span>
                        </div>
                    {/if}
                {/each}
            </div>
        </div>

        <button class="forlad-btn" onclick={lukShop}>{tekst('Forlad stedet', 'Leave')}</button>
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
    .small-item .sell-price {
        position: absolute;
        left: 50%;
        bottom: -18px;
        transform: translateX(-50%);
        min-width: 30px;
        padding: 1px 4px;
        border-radius: 3px;
        background: rgba(0, 0, 0, 0.84);
        color: #ffd95a;
        font-family: monospace;
        font-size: 0.68rem;
        line-height: 1.1;
        white-space: nowrap;
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

        .inventory-small-row {
            row-gap: 24px;
        }
    }
</style>
