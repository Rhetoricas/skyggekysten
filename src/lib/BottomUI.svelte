<script lang="ts">
    import { untrack } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { erSpillerITaagen, udfoerBlodofring } from '$lib/overlevelse.svelte';
    import { grav } from '$lib/undergrund.svelte';
    import { hvil, brugFraRygsæk } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';

    let erITågen = $derived(erSpillerITaagen());
    let aktueltFelt = $derived(
        spilTilstand.valgtKarakter && spilTilstand.gitter?.length > 0 
            ? spilTilstand.gitter[spilTilstand.spillerIndex] 
            : null
    );
    let kanGrave = $derived(aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves);

    let logHistorik = $state<string[]>([]);
    let visLog = $state(false);
    let logContainerRef = $state<HTMLDivElement | null>(null);

    $effect(() => {
        const besked = spilTilstand.logBesked;
        if (besked) {
            untrack(() => {
                if (logHistorik.length === 0 || besked !== logHistorik[logHistorik.length - 1]) {
                    logHistorik = [...logHistorik, besked];
                }
            });
        }
    });

    $effect(() => {
        if (visLog && logHistorik.length && logContainerRef) {
            logContainerRef.scrollTop = logContainerRef.scrollHeight;
        }
    });

    let aktuelLog = $derived(logHistorik[logHistorik.length - 1] || '');
    let forrigeLog = $derived(logHistorik[logHistorik.length - 2] || '');

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
                {#each logHistorik as linje, i (i)}
                    <p class="log-post" class:nyeste={i === logHistorik.length - 1}>
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
        title="Åbn logbogen"
    >
        <div class="log-line aktuel">{aktuelLog || '\u00A0'}</div>
        <div class="log-line forrige">{forrigeLog || '\u00A0'}</div>
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
            <div
                class="grav-knap inventory-item {kanGrave ? 'klikbar' : ''}"
                role="button"
                tabindex={kanGrave ? 0 : -1}
                onclick={() => { if (kanGrave) grav(); }}
                onkeydown={(e) => { if (kanGrave && (e.key === 'Enter' || e.key === ' ')) grav(); }}
            >
                <div class="ikon-container">
                    <img src="/screens/gravhaand.webp" alt="Grav" class="inventory-icon {kanGrave ? '' : 'deaktiveret'}" style="height: 60px;" />
                </div>
            </div>

            {#each spilTilstand.mitUdstyr as vare (vare.id)}
                {@const dbInfo = itemDB[vare.id]}
                {#if dbInfo}
                    <div 
                        class="inventory-item {(vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) || (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi) || (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi)) ? 'klikbar' : ''}" 
                        onclick={() => {
                            if (vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || spilTilstand.nuvaerendeEnergi < spilTilstand.maxEnergi)) {
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
                title={spilTilstand.musikTaendt ? 'Sluk al lyd' : 'Tænd al lyd'}
            >
                <img 
                    src={spilTilstand.musikTaendt ? '/screens/musicon.webp' : '/screens/musicoff.webp'} 
                    alt="Lyd afspiller" 
                />
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
        pointer-events: none;
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
        transition: transform 0.1s;
    }
    .log-container.klikbar:hover {
        transform: scale(1.02);
    }
    .log-line {
        text-align: center;
        width: 100%;
        font-family: 'Cinzel', serif;
        text-shadow: 1px 1px 4px black, 0 0 10px black;
    }
    .log-line.aktuel {
        color: white;
        font-size: 1.2rem;
        min-height: 1.5rem;
    }
    .log-line.forrige {
        color: #888;
        font-size: 0.95rem;
        min-height: 1.2rem;
        margin-top: 2px;
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
        gap: 14px;
        flex-wrap: wrap;
        flex: 1 1 40%;
        min-width: 200px;
    }
    .musik-toggle-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        transition: transform 0.2s, filter 0.2s;
    }
    .musik-toggle-btn.lille {
        margin-left: auto;
        align-self: flex-end;
        margin-bottom: 5px;
    }
    .musik-toggle-btn.lille img {
        height: 30px;
        width: auto;
        opacity: 0.6;
        transition: opacity 0.2s;
    }
    .musik-toggle-btn.lille:hover img {
        opacity: 1;
        transform: scale(1.1);
    }
    .musik-toggle-btn:active {
        transform: scale(0.95);
    }
    .status-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;
        font-family: monospace;
        font-size: 1.2rem;
        transition: color 0.3s ease;
    }
    .status-icon {
        height: 50px;
        width: auto;
        margin-bottom: 4px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .inventory-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        outline: none;
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
    .ikon-container {
        position: relative;
        display: inline-block;
    }
    .inventory-icon {
        height: 92px;
        width: auto;
        border-radius: 4px;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9));
    }
    .inventory-icon.deaktiveret {
        filter: grayscale(100%) opacity(50%);
    }
    .maengde-badge {
        position: absolute;
        bottom: 5px;
        right: 5px;
        background-color: rgba(0, 0, 0, 0.8);
        color: gold;
        font-family: monospace;
        font-size: 1.1rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #444;
        pointer-events: none;
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
        align-self: flex-start;
        margin-left: 10px; 
        margin-right: 10px;
        margin-top: 4px;
    }
    .dag-taeller {
        margin-top: 6px;
        font-size: 14px;
        color: #ccc;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .energi-grid {
        display: grid;
        grid-template-columns: repeat(3, 20px);
        gap: 4px;
    }
    .lysprik {
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
        background-image: url('/tiles/energi_slukket.webp');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border: none;
        box-shadow: none;
        border-radius: 0;
        background-color: transparent;
    }
    .lysprik.taendt {
        background-image: url('/tiles/energi_taendt.webp');
        filter: drop-shadow(0 0 5px rgba(0, 255, 204, 0.6));
        border: none;
        box-shadow: none;
        background-color: transparent;
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

    .status-item.kritisk {
        color: #ff4444;
    }
    .status-item.kritisk .status-icon {
        animation: hpPuls 0.6s infinite alternate ease-in-out;
    }
    @keyframes hpPuls {
        0% { transform: scale(1); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 2px darkred); }
        100% { transform: scale(1.3); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 10px red) brightness(1.2); }
    }

    .log-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
        z-index: 1500; display: flex; align-items: center; justify-content: center;
        pointer-events: auto;
    }
    .log-modal-content {
        background: #1a1a1a; width: 90%; max-width: 600px; height: 60dvh; max-height: 800px;
        border: 1px solid #444; border-radius: 8px; display: flex; flex-direction: column;
        box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    }
    .log-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 15px 20px; border-bottom: 1px solid #333;
    }
    .log-header h2 { 
        margin: 0; color: #ffcc00; font-family: 'Cinzel', serif; font-size: 1.5rem; 
    }
    .luk-btn {
        background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer; padding: 0;
    }
    .luk-btn:hover { color: white; }
    .log-liste {
        padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        flex-grow: 1;
    }
    .log-post {
        margin: 0; color: #aaa; line-height: 1.5; border-left: 2px solid #333; padding-left: 12px;
        font-family: system-ui, -apple-system, sans-serif;
    }
    .log-post.nyeste {
        color: white; border-left-color: #ffcc00; font-size: 1.05rem;
    }
</style>