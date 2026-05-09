<script lang="ts">
    import { untrack } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { grav } from '$lib/undergrund.svelte';
    import { hvil, brugFraRygsæk, udfoerTeleport, taendBaal } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';

    let aktueltFelt = $derived(
        spilTilstand.valgtKarakter && spilTilstand.gitter?.length > 0 
            ? spilTilstand.gitter[spilTilstand.spillerIndex] 
            : null
    );

    let kanGrave = $derived(aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves);

    let visLog = $state(false);
    let logContainerRef = $state<HTMLDivElement | null>(null);

    // KORREKTE UDSREGNINGER (Karakter + Rygsæk)
    let totalMove = $derived((spilTilstand.valgtKarakter?.moveCost ?? 1) + spilTilstand.rygsækEffekt.move);
    let totalArmor = $derived(100 - Math.round(((spilTilstand.valgtKarakter?.dmgMod ?? 1.0) + spilTilstand.rygsækEffekt.dmg) * 100));
    let totalGoldMod = $derived(Math.round(((spilTilstand.valgtKarakter?.goldMod ?? 1.0) + spilTilstand.rygsækEffekt.gold) * 100));
    let totalSyn = $derived((spilTilstand.valgtKarakter?.synsRadius ?? 1) + spilTilstand.rygsækEffekt.syn);

    let aktuelLog = $derived(spilTilstand.logHistorik.length > 0 ? spilTilstand.logHistorik[spilTilstand.logHistorik.length - 1] : '');
    let forrigeLog = $derived(spilTilstand.logHistorik.length > 1 ? spilTilstand.logHistorik[spilTilstand.logHistorik.length - 2] : '');

    let rensedeLogLinjer = $derived(spilTilstand.logHistorik.filter(linje => linje.includes(' - ')));

    $effect(() => {
        const dag = spilTilstand.dag;
        untrack(() => {
            const prefix = `DAG ${dag}`;
            if (dag > 1 && spilTilstand.gameState === 'play' && (!aktuelLog || !aktuelLog.startsWith(prefix))) {
                spilTilstand.logBesked = "";
            }
        });
    });

    $effect(() => {
        if (visLog && rensedeLogLinjer.length && logContainerRef) {
            logContainerRef.scrollTop = logContainerRef.scrollHeight;
        }
    });

    function spisMad() {
        const fuldHp = spilTilstand.livspoint >= spilTilstand.maxLivspoint;
        const fuldEnergi = spilTilstand.nuvaerendeEnergi >= spilTilstand.maxEnergi;

        if (fuldHp && fuldEnergi) {
            spilTilstand.logBesked = "Du er allerede mæt og fuldt udhvilet.";
            return;
        }

        brugFraRygsæk('mad', 1);
        spilTilstand.livspoint += 10;
        spilTilstand.nuvaerendeEnergi += 1;
        spilTilstand.logBesked = "Du spiser din madration. (+10 HP, +1 Energi)";
        syncTilDb(true);
    }

    function haandterInventoryKlik(vareId: string) {
        if (vareId === 'skovl') {
            grav();
        } else if (vareId === 'sovepose') {
            hvil();
        } else if (vareId === 'mad') {
            spisMad();
        } else if (vareId === 'stav') {
            udfoerTeleport();
        } else if (vareId === 'fakkel') {
            taendBaal();
        }
    }
</script>

{#if visLog}
    <div class="log-modal-overlay" onclick={() => visLog = false} role="presentation">
        <div class="log-modal-content" onclick={(e) => e.stopPropagation()} role="presentation">
            <div class="log-header">
                <h2>Logbog</h2>
                <button class="luk-btn" onclick={() => visLog = false}>✕</button>
            </div>
            
            <div class="log-liste" bind:this={logContainerRef}>
                {#each rensedeLogLinjer as linje, i (i)}
                    <p class="log-post" class:nyeste={i === rensedeLogLinjer.length - 1}>
                        {linje}
                    </p>
                {/each}
            </div>
        </div>
    </div>
{/if}

<footer class="ui">
    <div class="island-overskrift">{spilTilstand.rumKode}</div>
    
    <div 
        class="log-container klikbar" 
        onclick={() => visLog = true}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') visLog = true; }}
        role="button"
        tabindex="0"
    >
        <div class="log-line aktuel">{aktuelLog || '\u00A0'}</div>
        <div class="log-line forrige">{forrigeLog || '\u00A0'}</div>
    </div>

    <div class="instrument-braet">
        {#if totalMove !== 1}
            <span class="mod-badge move {totalMove > 1 ? 'negativ' : ''}">
                <img src="/ui/stat_move.webp" alt="" />
                {totalMove}
            </span>
        {/if}
        {#if totalArmor !== 0}
            <span class="mod-badge dmg {totalArmor < 0 ? 'negativ' : ''}">
                <img src="/ui/stat_dmg.webp" alt="" />
                {totalArmor}%
            </span>
        {/if}
        {#if totalGoldMod !== 100}
            <span class="mod-badge gold {totalGoldMod < 100 ? 'negativ' : ''}">
                <img src="/ui/stat_gold.webp" alt="" />
                {totalGoldMod}%
            </span>
        {/if}
        {#if totalSyn !== 1}
            <span class="mod-badge syn {totalSyn < 1 ? 'negativ' : ''}">
                <img src="/ui/stat_syn.webp" alt="" />
                {totalSyn}
            </span>
        {/if}
    </div>

    <div class="ui-content">
        <div class="status-row">
            <div class="status-item" class:kritisk={spilTilstand.livspoint < 30}>
                <img src="/inventory/hp.webp" alt="Liv" class="status-icon" />
                <span class="status-value">{spilTilstand.livspoint}</span>
            </div>
            
            <div class="status-item">
                <img src="/inventory/guld.webp" alt="Guld" class="status-icon" />
                <span class="status-value">{spilTilstand.guldTotal}</span>
            </div>
        
            <div class="energi-sektion">
                <div class="energi-container">
                    <div class="energi-grid">
                        {#each Array(9) as tomPlads, i (i)}
                            <div data-dummy={tomPlads} class="lysprik {i < (spilTilstand.nuvaerendeEnergi || 0) ? 'taendt' : ''}"></div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="inventory-row">
            <div
                class="grav-knap inventory-item {kanGrave ? 'klikbar' : ''}"
                role="button"
                tabindex={kanGrave ? 0 : -1}
                onclick={() => { if (kanGrave) grav(); }}
                onkeydown={(e) => { if (kanGrave && (e.key === 'Enter' || e.key === ' ')) grav(); }}
            >
                <div class="ikon-container">
                    <img src="/screens/gravhaand.webp" alt="Grav" class="inventory-icon {kanGrave ? '' : 'deaktiveret'}" />
                </div>
            </div>

            {#each spilTilstand.mitUdstyr as vare (vare.id)}
                {@const dbInfo = itemDB[vare.id]}
                {#if dbInfo}
                    <div 
                        class="inventory-item {(vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) || (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi) || (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi)) || (vare.id === 'stav') || (vare.id === 'fakkel') ? 'klikbar' : ''}" 
                        onclick={() => {
                            if (vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi)) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'stav') {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'fakkel') {
                                haandterInventoryKlik(vare.id);
                            }
                        }}
                        onkeydown={(e) => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                                if (vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) {
                                    haandterInventoryKlik(vare.id);
                                } else if (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi) {
                                    haandterInventoryKlik(vare.id);
                                } else if (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi)) {
                                    haandterInventoryKlik(vare.id);
                                } else if (vare.id === 'stav') {
                                    haandterInventoryKlik(vare.id);
                                } else if (vare.id === 'fakkel') {
                                    haandterInventoryKlik(vare.id);
                                }
                            }
                        }}
                        role="button"
                        tabindex="0"
                    >
                        <div class="ikon-container">
                            <img 
                                src={dbInfo.billede} 
                                alt={dbInfo.navn} 
                                class="inventory-icon {(vare.id === 'skovl' && aktueltFelt && (aktueltFelt.gravet || !aktueltFelt.kanGraves)) || (vare.id === 'sovepose' && (aktueltFelt?.biome === 'hav' || spilTilstand.nuvaerendeEnergi >= spilTilstand.maxEnergi)) || (vare.id === 'mad' && spilTilstand.livspoint >= spilTilstand.maxLivspoint && spilTilstand.nuvaerendeEnergi >= spilTilstand.maxEnergi) ? 'deaktiveret' : ''}" 
                            />
                            {#if vare.maengde > 1}
                                <span class="maengde-badge">{vare.maengde}</span>
                            {/if}
                        </div>
                    </div>
                {/if}
            {/each}

            <button 
                class="musik-toggle-btn lille" 
                onclick={() => spilTilstand.musikTaendt = !spilTilstand.musikTaendt} 
            >
                <img src={spilTilstand.musikTaendt ? '/screens/musicon.webp' : '/screens/musicoff.webp'} alt="Lyd" />
            </button>
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
        padding-bottom: 2.5rem;
        pointer-events: none;
        display: flex;
        flex-direction: column;
    }
    .island-overskrift {
        text-align: center;
        width: 100%;
        font-family: 'Cinzel', serif;
        font-size: 1.9rem;
        color: white;
        text-shadow: 2px 2px 4px #000, -1px -1px 2px #000;
        letter-spacing: 4px;
        text-transform: uppercase;
        margin-bottom: 0.2rem;
    }
    .log-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 0.8rem;
    }
    .log-container.klikbar {
        pointer-events: auto;
        cursor: pointer;
    }
    .log-line {
        text-align: center;
        width: 100%;
        font-family: 'Cinzel', serif;
        text-shadow: 1px 1px 4px black, 0 0 10px black;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 80vw;
    }
    .log-line.aktuel {
        color: white;
        font-size: 1.2rem;
        min-height: 1.5rem;
    }
    .log-line.forrige {
        color: #888;
        font-size: 0.9rem;
        min-height: 1.2rem;
        margin-top: 2px;
    }
    
    .instrument-braet {
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 12px;
    }
    .mod-badge {
        background: transparent;
        color: #aaa;
        padding: 2px 6px;
        font-family: monospace;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 0;
    }
    .mod-badge img {
        width: 24px;
        height: auto;
        opacity: 0.85;
        margin-right: 0px;
    }
    .mod-badge.negativ {
        color: #cc5555 !important;
    }
    .mod-badge.negativ img {
        filter: grayscale(100%) !important;
        opacity: 0.5 !important;
    }

    .ui-content {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: center;
        width: 100%;
        gap: 0.5rem;
        padding: 0 1rem;
        box-sizing: border-box;
        pointer-events: auto;
    }
    .status-row {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-right: 1.5rem;
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
        height: 50px;
        width: auto;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .inventory-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .inventory-item.klikbar {
        cursor: pointer;
        transition: transform 0.1s;
    }
    .inventory-item.klikbar:hover {
        transform: scale(1.05);
    }
    .inventory-row {
        display: flex;
        align-items: flex-start;
        gap: 14px;
    }

    .inventory-icon {
        height: 68px;
        width: auto;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9));
    }
    .inventory-icon.deaktiveret {
        filter: grayscale(100%) opacity(50%);
    }
    .maengde-badge {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background: black;
        color: gold;
        font-family: monospace;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
    }
    .energi-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 10px;
    }
    .energi-grid {
        display: grid;
        grid-template-columns: repeat(3, 20px);
        gap: 4px;
    }
    .lysprik {
        width: 20px;
        height: 20px;
        background-image: url('/tiles/energi_slukket.webp');
        background-size: cover;
    }
    .lysprik.taendt {
        background-image: url('/tiles/energi_taendt.webp');
    }

    .musik-toggle-btn.lille {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        z-index: 100;
    }
    .musik-toggle-btn.lille img {
        height: 30px;
        width: auto;
        opacity: 0.5;
        transition: transform 0.2s, opacity 0.2s;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .musik-toggle-btn.lille:hover img {
        opacity: 1;
        transform: scale(1.1);
    }
    .log-modal-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100dvh;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
        z-index: 1500; display: flex;
        align-items: center; justify-content: center;
        pointer-events: auto;
    }
    .log-modal-content {
        background: #1a1a1a;
        width: 90%;
        max-width: 600px; height: 60dvh;
        border: 1px solid #444; border-radius: 8px; display: flex; flex-direction: column;
    }
    .log-header {
        display: flex; justify-content: space-between; padding: 15px 20px;
        border-bottom: 1px solid #333;
    }
    .log-header h2 { color: #ffcc00; font-family: 'Cinzel', serif; margin: 0; }
    .log-liste { padding: 20px; overflow-y: auto; flex-grow: 1; }
    .log-post { color: #aaa;
        border-left: 2px solid #333; padding-left: 12px; margin-bottom: 10px; }
    .log-post.nyeste { color: white; border-left-color: #ffcc00; }
</style> 