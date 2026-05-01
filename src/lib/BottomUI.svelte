<script lang="ts">
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

    let aktuelLog = $state(spilTilstand.logBesked || '');
    let forrigeLog = $state('');

    $effect(() => {
        if (spilTilstand.logBesked && spilTilstand.logBesked !== aktuelLog) {
            forrigeLog = aktuelLog;
            aktuelLog = spilTilstand.logBesked;
        }
    });

    function spisMad() {
        const maxEnergi = spilTilstand.valgtKarakter?.baseEnergi || 0;
        const aktuelEnergi = spilTilstand.nuvaerendeEnergi || 0;
        const fuldHp = spilTilstand.livspoint >= spilTilstand.maxLivspoint;
        const fuldEnergi = aktuelEnergi >= maxEnergi;

        if (fuldHp && fuldEnergi) {
            spilTilstand.logBesked = "Du er allerede mæt og fuldt udhvilet.";
            return;
        }

        brugFraRygsæk('mad', 1);
        spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 10);
        spilTilstand.nuvaerendeEnergi = Math.min(maxEnergi, aktuelEnergi + 1);
        
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

<footer class="ui">
    <div class="island-overskrift">{spilTilstand.rumKode}</div>
    
    <div class="log-container">
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
                        class="inventory-item {(vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) || (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && (spilTilstand.nuvaerendeEnergi || 0) < (spilTilstand.valgtKarakter?.baseEnergi || 0)) || (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || (spilTilstand.nuvaerendeEnergi || 0) < (spilTilstand.valgtKarakter?.baseEnergi || 0))) ? 'klikbar' : ''}" 
                        onclick={() => {
                            if (vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && (spilTilstand.nuvaerendeEnergi || 0) < (spilTilstand.valgtKarakter?.baseEnergi || 0)) {
                                haandterInventoryKlik(vare.id);
                            } else if (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || (spilTilstand.nuvaerendeEnergi || 0) < (spilTilstand.valgtKarakter?.baseEnergi || 0))) {
                                haandterInventoryKlik(vare.id);
                            }
                        }}
                        onkeydown={(e) => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                                if (vare.id === 'skovl' && aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves) {
                                    haandterInventoryKlik(vare.id);
                                } else if (vare.id === 'sovepose' && aktueltFelt?.biome !== 'hav' && (spilTilstand.nuvaerendeEnergi || 0) < (spilTilstand.valgtKarakter?.baseEnergi || 0)) {
                                    haandterInventoryKlik(vare.id);
                                } else if (vare.id === 'mad' && (spilTilstand.livspoint < spilTilstand.maxLivspoint || (spilTilstand.nuvaerendeEnergi || 0) < (spilTilstand.valgtKarakter?.baseEnergi || 0))) {
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
                                class="inventory-icon {(vare.id === 'skovl' && aktueltFelt && (aktueltFelt.gravet || !aktueltFelt.kanGraves)) || (vare.id === 'sovepose' && (aktueltFelt?.biome === 'hav' || (spilTilstand.nuvaerendeEnergi || 0) === (spilTilstand.valgtKarakter?.baseEnergi || 0))) || (vare.id === 'mad' && spilTilstand.livspoint >= spilTilstand.maxLivspoint && (spilTilstand.nuvaerendeEnergi || 0) >= (spilTilstand.valgtKarakter?.baseEnergi || 0)) ? 'deaktiveret' : ''}" 
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
        pointer-events: none;
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
</style>