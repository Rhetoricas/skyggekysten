<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { eventState, kanViseValg, tagValg, startEvent } from '$lib/eventMotor.svelte';
    import { eventBibliotek, eventTitel, valgTekst, type Valg } from '$lib/eventBibliotek';
    import { fremtvingKollaps } from '$lib/overlevelse.svelte';
    import { itemDB } from '$lib/spildata';
    import { tekst } from '$lib/i18n.svelte';
    import { itemNavn } from '$lib/spilTekst';

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

    type ItemMarkoerType = 'kraever' | 'risikerer' | 'mister';

    function splitItemListe(itemListe: string | undefined) {
        return itemListe
            ? itemListe.split(',').map((itemId) => itemId.trim()).filter(Boolean)
            : [];
    }

    function mistedeItemsFraValg(valg: Valg) {
        const itemIds = valg.udfaldListe?.flatMap((udfald) => splitItemListe(udfald.mistItem)) ?? [];
        return [...new Set(itemIds)];
    }

    function itemMarkoererForValg(valg: Valg) {
        if (valg.kosterItem) return [{ itemId: valg.kosterItem, type: 'mister' as ItemMarkoerType }];

        const risikoItems = mistedeItemsFraValg(valg);
        if (risikoItems.length) {
            return risikoItems.map((itemId) => ({ itemId, type: 'risikerer' as ItemMarkoerType }));
        }

        if (valg.kraeverItem) return [{ itemId: valg.kraeverItem, type: 'kraever' as ItemMarkoerType }];

        return (valg.kraeverEtAfItems ?? []).map((itemId) => ({ itemId, type: 'kraever' as ItemMarkoerType }));
    }

    function itemMarkoerTitel(type: ItemMarkoerType, itemId: string) {
        if (itemId === 'alle_toej') {
            if (type === 'mister') return tekst('Mister tøj', 'Consumes clothes');
            if (type === 'risikerer') return tekst('Risikerer tøj', 'May lose clothes');
            return tekst('Kræver tøj', 'Requires clothes');
        }
        if (type === 'mister') return tekst(`Mister ${itemNavn(itemId)}`, `Consumes ${itemNavn(itemId)}`);
        if (type === 'risikerer') return tekst(`Risikerer ${itemNavn(itemId)}`, `May lose ${itemNavn(itemId)}`);
        return tekst(`Kræver ${itemNavn(itemId)}`, `Requires ${itemNavn(itemId)}`);
    }

    function itemMarkoerIkonId(itemId: string) {
        return itemId === 'alle_toej' ? 'klude' : itemId;
    }
</script>

{#if eventState.aktivt}

{#if spilTilstand.erBevidstløs}
    <div class="stun-overlay"></div>
{/if}

<div class="event-overlay" role="presentation">
    <div class="event-boks">
        <img
            src={eventState.aktivt.billede || `/events/ev_${grundBiome}.webp`}
            alt={tekst('Event baggrund', 'Event background')}
            onerror={(e) => {
                (e.currentTarget as HTMLImageElement).onerror = null;
                (e.currentTarget as HTMLImageElement).src = '/events/event.webp';
            }}
        />

        <h2>{eventTitel(eventState.aktivt)}</h2>

        <div class="log-container">
            {#each eventState.log as linje, i (i)}
                <p>{linje}</p>
            {/each}
        </div>

        <div class="knap-panel">
        
            {#if !eventState.valgLåst}
                {#each eventState.aktivt.valg as valg (valg.tekst)}
                    {@const harAdgang = kanViseValg(valg)}
                    {@const itemMarkoerer = itemMarkoererForValg(valg)}
                    
                    <button 
                        class="valg-btn" 
                        class:ulåst={harAdgang}
                        class:låst={!harAdgang}
                        disabled={!harAdgang}
                        onclick={(e) => { e.stopPropagation(); tagValg(valg); }}
                    >
                        <span class="valg-tekst">{valgTekst(valg)}</span>
                        
                        {#if itemMarkoerer.length || !harAdgang}
                            <div class="manglende-betingelse">
                                {#if itemMarkoerer.length}
                                    <div class="mangel-ikon-raekke">
                                        {#each itemMarkoerer.slice(0, 3) as markoer (`${markoer.type}-${markoer.itemId}`)}
                                            {@const ikonId = itemMarkoerIkonId(markoer.itemId)}
                                            {#if itemDB[ikonId]}
                                                <span
                                                    class="item-markoer"
                                                    class:kraever-markoer={markoer.type === 'kraever'}
                                                    class:risikerer-markoer={markoer.type === 'risikerer'}
                                                    class:mister-markoer={markoer.type === 'mister'}
                                                    title={itemMarkoerTitel(markoer.type, markoer.itemId)}
                                                >
                                                    <img src={itemDB[ikonId].billede} alt={itemMarkoerTitel(markoer.type, markoer.itemId)} class="mangel-ikon" />
                                                </span>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                                {#if valg.kraeverKarakter}
                                    <span class="mangel-ikon karakter-mangel" title={tekst('Kræver specifik helt', 'Requires a specific hero')}></span>
                                {/if}
                                {#if !itemMarkoerer.length && valg.kraeverItem && itemDB[valg.kraeverItem]}
                                    <img src={itemDB[valg.kraeverItem].billede} alt={tekst('Mangler genstand', 'Missing item')} class="mangel-ikon" title={tekst(`Du mangler ${itemNavn(valg.kraeverItem)}`, `You need ${itemNavn(valg.kraeverItem)}`)} />
                                {/if}
                                {#if !itemMarkoerer.length && valg.kraeverEtAfItems?.length}
                                    <span class="mangel-guld">{tekst('Kræver våben', 'Requires weapon')}</span>
                                    <div class="mangel-ikon-raekke">
                                        {#each valg.kraeverEtAfItems.slice(0, 3) as itemId (itemId)}
                                            {#if itemDB[itemId]}
                                                <img src={itemDB[itemId].billede} alt={tekst('Muligt våben', 'Possible weapon')} class="mangel-ikon lille-mangel-ikon" title={tekst('Du mangler et våben', 'You need a weapon')} />
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                                {#if !itemMarkoerer.length && valg.kosterItem && itemDB[valg.kosterItem]}
                                    <img src={itemDB[valg.kosterItem].billede} alt={tekst('Koster genstand', 'Costs item')} class="mangel-ikon koster-mangel" title={tekst(`Du skal betale med ${itemNavn(valg.kosterItem)}`, `You must pay with ${itemNavn(valg.kosterItem)}`)} />
                                {/if}
                                {#if valg.puljeVaerdi}
                                    <span class="mangel-guld">{tekst('Mangler', 'Need')} {valg.puljeVaerdi} {tekst('Guld', 'Gold')}</span>
                                {/if}
                                {#if valg.kosterEnergi}
                                    <span class="mangel-guld">{tekst('Mangler', 'Need')} {valg.kosterEnergi} {tekst('Energi', 'Energy')}</span>
                                {/if}
                            </div>
                        {/if}
                    </button>
                {/each}
                
                {#if eventState.aktivt.valg.every((v: Valg) => !kanViseValg(v))}
                    <button class="valg-btn ulåst flygt-btn" onclick={(e) => { e.stopPropagation(); lukEvent(); }}>{tekst('Flygt fra faren!', 'Flee the danger!')}</button>
                {/if}
            {:else}
                <button class="fortsaet-btn" onclick={(e) => { e.stopPropagation(); haandterKlikVidere(); }}>
                    {tekst('Fortsæt', 'Continue')}
                </button>
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
        padding: calc(env(safe-area-inset-top, 0px) + 12px) 12px calc(env(safe-area-inset-bottom, 0px) + 12px);
        box-sizing: border-box;
    }
    
    .event-boks { 
        background: #1a1a1a;
        color: #e0e0e0; border: 2px solid #4a4a4a; padding: 20px; width: 600px; max-width: 100%;
        min-height: 0;
        max-height: 100%; overflow-y: auto; overflow-x: hidden; display: flex;
        flex-direction: column; gap: 15px; border-radius: 8px;
        box-sizing: border-box;
        -webkit-overflow-scrolling: touch;
    }

    .event-boks img { 
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        height: 200px; object-fit: cover; border-bottom: 2px solid #333; border-radius: 4px;
    }
    
    .event-boks h2 { 
        margin: 0;
        color: #ffcc00; font-family: 'Cinzel', serif; font-size: 1.8rem;
    }
    
    .log-container {
        width: 100%;
        box-sizing: border-box;
        flex: 0 0 auto;
        min-height: 0;
        overflow-x: hidden;
        overflow-y: visible;
        padding-right: 6px;
    }
    
    .log-container p { 
        margin: 5px 0;
        line-height: 1.5; font-size: 1.05rem;
    }
    
    .knap-panel { 
        display: flex;
        flex-direction: column; gap: 10px; margin-top: auto;
        width: 100%;
        box-sizing: border-box;
        flex: 0 0 auto;
        max-height: none;
        overflow-x: hidden;
        overflow-y: visible;
        padding-right: 4px;
    }
    
    .valg-btn { 
        padding: 14px;
        background: #2a2a2a; color: white; border: 1px solid #555; cursor: pointer; 
        text-align: left; border-radius: 4px; transition: 0.2s; font-size: 1rem;
        font-family: system-ui, -apple-system, sans-serif;
        display: flex; justify-content: space-between; align-items: center;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }
    
    .ulåst:hover {
        background: #3a3a3a;
        border-color: #777;
        box-shadow: inset 4px 0 0 rgba(255, 204, 0, 0.35);
    }
    
    .låst {
        background: #111;
        color: #555;
        border-color: #222;
        cursor: not-allowed;
    }
    
    .valg-tekst {
        flex-grow: 1;
        min-width: 0;
        padding-right: 15px;
        line-height: 1.3;
        overflow-wrap: anywhere;
    }

    .manglende-betingelse {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
        justify-content: center;
        min-width: 50px;
        max-width: 140px;
        flex-shrink: 0;
        border-left: 1px solid #333;
        padding-left: 10px;
    }

    .låst .manglende-betingelse {
        opacity: 0.8;
    }

    .mangel-ikon {
        width: 32px !important; 
        height: 32px !important;
        max-width: 32px !important; 
        max-height: 32px !important; 
        object-fit: contain;
        display: block;
    }

    .mangel-ikon-raekke {
        display: flex;
        gap: 5px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .item-markoer {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #72d07b;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.34);
        box-shadow: 0 0 10px rgba(114, 208, 123, 0.28), inset 0 0 8px rgba(255, 255, 255, 0.06);
        flex: 0 0 auto;
    }

    .item-markoer .mangel-ikon {
        width: 28px !important;
        height: 28px !important;
        max-width: 28px !important;
        max-height: 28px !important;
    }

    .kraever-markoer {
        border-color: #60c46f;
        box-shadow: 0 0 10px rgba(96, 196, 111, 0.32), inset 0 0 8px rgba(96, 196, 111, 0.1);
    }

    .risikerer-markoer {
        border-color: #e0bf45;
        box-shadow: 0 0 12px rgba(224, 191, 69, 0.34), inset 0 0 8px rgba(224, 191, 69, 0.12);
    }

    .mister-markoer {
        border-color: #c94f4f;
        box-shadow: 0 0 12px rgba(201, 79, 79, 0.36), inset 0 0 8px rgba(201, 79, 79, 0.13);
    }

    .lille-mangel-ikon {
        width: 18px !important;
        height: 18px !important;
        max-width: 18px !important;
        max-height: 18px !important;
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

    .fortsaet-btn {
        align-self: center;
        min-width: 180px;
        padding: 12px 20px;
        background: #2a2a2a;
        color: #eee;
        border: 1px solid #666;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        font-family: system-ui, -apple-system, sans-serif;
        transition: 0.2s;
    }

    .fortsaet-btn:hover {
        background: #3a3a3a;
        border-color: #888;
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
            height: clamp(90px, 20dvh, 120px);
        }

        .event-boks h2 {
            font-size: 1.25rem;
        }

        .log-container p {
            font-size: 0.92rem;
            line-height: 1.35;
        }

        .log-container {
            min-height: 0;
        }

        .knap-panel {
            max-height: none;
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
