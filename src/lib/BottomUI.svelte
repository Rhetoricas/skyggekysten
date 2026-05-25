<script lang="ts">
    import { untrack } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { grav } from '$lib/undergrund.svelte';
    import { hvil, brugFraRygsæk, udfoerTeleport, taendBaal, aktiverHemmelighed, begaaIndbrud, kanBegaaIndbrudPaaFelt, kanPlyndreFelt, plyndrFelt } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';

    let aktueltFelt = $derived(
        spilTilstand.valgtKarakter && spilTilstand.gitter?.length > 0 
            ? spilTilstand.gitter[spilTilstand.spillerIndex] 
            : null
    );

    let kanGrave = $derived(aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves);
    let kanBegaaIndbrud = $derived(kanBegaaIndbrudPaaFelt(aktueltFelt));
    let kanPlyndre = $derived(kanPlyndreFelt(aktueltFelt));
    let aktivTracker = $derived(spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker);
    let aktivTrackerSpiller = $derived(aktivTracker ? spilTilstand.alleSpillere[aktivTracker.targetNavn] : null);
    let trackerDageTilbage = $derived(aktivTracker ? Math.max(0, aktivTracker.slutterDag - spilTilstand.dag + 1) : 0);
    let harMesterskovl = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'mesterskovl' && ting.maengde > 0) ?? false);
    let harSkovl = $derived(spilTilstand.mitUdstyr?.some((ting) => (ting.id === 'skovl' || ting.id === 'mesterskovl') && ting.maengde > 0) ?? false);
    let graveIkon = $derived(harMesterskovl ? itemDB.mesterskovl.billede : harSkovl ? itemDB.skovl.billede : '/ui/haandgrav.webp');
    let graveNavn = $derived(harMesterskovl ? 'Mesterskovl' : harSkovl ? 'Skovl' : 'Grav med hænderne');
    let graveAlt = $derived(kanGrave ? (harSkovl ? `Grav med ${harMesterskovl ? 'mesterskovl' : 'skovl'}` : 'Grav med hænderne') : 'Her kan ikke graves');
    let graveEnergiPris = $derived(spilTilstand.valgtKarakter?.digCost ?? 3);
    let haandGraveEnergiPris = $derived(graveEnergiPris + 4);
    let haandGraveSkade = $derived(spilTilstand.beregnSkade(4));
    let hpHjaelp = $derived('Dit helbred. På land kollapser du normalt ved 0 HP. I tåge eller vand dør du, medmindre en livseliksir redder dig først. Mad giver +20 HP.');
    let energiHjaelp = $derived(
        spilTilstand.gratisNaesteBevaegelse
            ? (spilTilstand.gratisBevaegelseKilde === 'bersaerk'
                ? 'Din næste energikrævende handling koster 0 energi på grund af bersærkergang.'
                : 'Din næste bevægelse koster 0 energi på grund af mad.')
            : 'Energi bruges på bevægelse, gravning og visse handlinger. Når energien løber tør, går dagen videre efter handlingen.'
    );
    let graveHjaelp = $derived.by(() => {
        if (!kanGrave) return 'Du kan ikke grave på dette felt lige nu.';
        if (harMesterskovl) return `Graver for ${graveEnergiPris} energi. Mesterskovlen giver normalt dobbelt guld og finder nedgravede fælder uden skade.`;
        if (harSkovl) return `Graver for ${graveEnergiPris} energi. Nedgravede fælder udløses stadig.`;
        return `Graver med hænderne for ${haandGraveEnergiPris} energi og ${haandGraveSkade} HP. Nedgravede fælder kan stadig udløses.`;
    });
    const hvileBiomer = ['eng', 'skov', 'mark', 'bjerg', 'hoejland'];

    let visLog = $state(false);
    let logContainerRef = $state<HTMLDivElement | null>(null);

    let totalMove = $derived((spilTilstand.valgtKarakter?.moveCost ?? 1) + spilTilstand.rygsækEffekt.move);
    let totalArmor = $derived(100 - Math.round(((spilTilstand.valgtKarakter?.dmgMod ?? 1.0) + spilTilstand.rygsækEffekt.dmg) * 100));
    let totalGoldMod = $derived(Math.round(((spilTilstand.valgtKarakter?.goldMod ?? 1.0) + spilTilstand.rygsækEffekt.gold) * 100));
    let totalSyn = $derived((spilTilstand.valgtKarakter?.synsRadius ?? 1) + spilTilstand.rygsækEffekt.syn);
    let moveBadgeHjaelp = $derived(`Din grundpris for et skridt er ${totalMove} energi før terræn. Terrænet lægges oveni, og prisen kan aldrig komme under 1.`);
    let skadeBadgeHjaelp = $derived(totalArmor >= 0
        ? `Du tager ${totalArmor}% mindre skade fra karakter og udstyr.`
        : `Du tager ${Math.abs(totalArmor)}% mere skade fra karakter og udstyr.`
    );
    let guldBadgeHjaelp = $derived(`Din guldindkomst er ${totalGoldMod}% af grundbeløbet, før særlige udstyrseffekter på selve fundet.`);
    let synBadgeHjaelp = $derived(`Dit syn er radius ${totalSyn}. Karakter, fakler og andet udstyr kan ændre tallet.`);

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
        const harGratisBevaegelse = spilTilstand.gratisNaesteBevaegelse;

        if (fuldHp && harGratisBevaegelse) {
            spilTilstand.logBesked = "Du er allerede mæt og fuldt udhvilet.";
            return;
        }

        const foerHp = spilTilstand.livspoint;
        brugFraRygsæk('mad', 1);
        spilTilstand.livspoint += 20;
        spilTilstand.gratisNaesteBevaegelse = true;
        spilTilstand.gratisBevaegelseKilde = 'mad';
        const faktiskHeling = spilTilstand.livspoint - foerHp;
        spilTilstand.logBesked = `Du spiser din madration. (+${faktiskHeling} HP, næste bevægelse koster 0 energi)`;
        syncTilDb();
    }

    function haandterInventoryKlik(vareId: string) {
        if (vareId === 'skovl' || vareId === 'mesterskovl') {
            grav();
        } else if (vareId === 'sovepose' || vareId === 'silkesovepose') {
            hvil();
        } else if (vareId === 'mad') {
            spisMad();
        } else if (vareId === 'stav' || vareId === 'dragestav') {
            udfoerTeleport();
        } else if (vareId === 'fakkel' || vareId === 'solfakkel') {
            taendBaal();
        } else if (vareId === 'hemmelighed') {
            aktiverHemmelighed();
        } else if (vareId === 'dirk' || vareId === 'mesterdirk') {
            begaaIndbrud();
        } else if (vareId === 'koelle' || vareId === 'koelle_upgr') {
            plyndrFelt();
        }
    }

    function kanBrugeInventoryVare(vareId: string) {
        if (vareId === 'skovl' || vareId === 'mesterskovl') return !!(aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves);
        if (vareId === 'sovepose' || vareId === 'silkesovepose') {
            return !!(
                aktueltFelt &&
                hvileBiomer.includes(aktueltFelt.biome as string) &&
                spilTilstand.valgtKarakter
            );
        }
        if (vareId === 'mad') return spilTilstand.livspoint < spilTilstand.maxLivspoint || !spilTilstand.gratisNaesteBevaegelse;
        if (vareId === 'dirk' || vareId === 'mesterdirk') return !!kanBegaaIndbrud;
        if (vareId === 'koelle' || vareId === 'koelle_upgr') return !!kanPlyndre;
        return vareId === 'stav' || vareId === 'dragestav' || vareId === 'fakkel' || vareId === 'solfakkel' || vareId === 'hemmelighed';
    }

    function erSituationsVare(vareId: string) {
        return vareId === 'skovl' || vareId === 'mesterskovl' || vareId === 'sovepose' || vareId === 'silkesovepose' || vareId === 'mad' || vareId === 'dirk' || vareId === 'mesterdirk' || vareId === 'koelle' || vareId === 'koelle_upgr';
    }

    function erOpgraderetVare(vareId: string) {
        return [
            'kongepanser',
            'royalt_toej',
            'mesterkniv',
            'mesterdirk',
            'dragestav',
            'mesterbue',
            'stormoekse',
            'koelle_upgr',
            'mesterskovl',
            'malmviser',
            'runekvist',
            'solfakkel',
            'silkesovepose'
        ].includes(vareId);
    }

    function formaterNavn(tekst: string) {
        if (!tekst) return '';
        return tekst.charAt(0).toUpperCase() + tekst.slice(1).toLowerCase();
    }

    function forklaringForVare(vareId: string, aktiv: boolean) {
        const info = itemDB[vareId];
        if (!info) return 'Ukendt genstand.';

        if (vareId === 'metaldetektor' || vareId === 'malmviser') {
            return `${info.beskrivelse} Den virker passivt, mens du bevæger dig.`;
        }

        if (vareId === 'soegekvist' || vareId === 'runekvist') {
            return `${info.beskrivelse} Den virker passivt, mens du bevæger dig.`;
        }

        if (vareId === 'livseliksir') {
            return `${info.beskrivelse} Den bruges automatisk ved dødelig skade.`;
        }

        if (vareId === 'diamant') {
            return `${info.beskrivelse} Den kan sælges i butikker.`;
        }

        const status = aktiv
            ? 'Den kan bruges lige nu.'
            : erSituationsVare(vareId)
                ? 'Den kan ikke bruges i den nuværende situation.'
                : 'Effekten virker automatisk eller i events; den skal ikke aktiveres fra inventory.';

        return `${info.beskrivelse} ${status}`;
    }
</script>

{#if visLog}
    <div class="log-modal-overlay" onclick={() => visLog = false} role="presentation">
        <div class="log-modal-content" onclick={(e) => e.stopPropagation()} role="presentation">
            <div class="log-header">
                <h2>Logbog</h2>
                <button class="luk-btn" onclick={() => visLog = false} aria-label="Luk logbog">×</button>
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
    <div class="island-overskrift">{formaterNavn(spilTilstand.rumKode)}</div>
    
    <div 
        class="log-container klikbar" 
        onclick={() => visLog = true}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') visLog = true; }}
        data-help-title="Logbog"
        data-help-body="Her ser du de seneste beskeder. Tryk på loggen for at åbne hele logbogen."
        role="button"
        tabindex="0"
    >
        <div class="log-line aktuel">{aktuelLog || '\u00A0'}</div>
        <div class="log-line forrige">{forrigeLog || '\u00A0'}</div>
    </div>

    <div class="instrument-braet">
        {#if aktivTracker && aktivTrackerSpiller && trackerDageTilbage > 0}
            <div class="tracker-status" title="Du ser de felter, denne spiller ser.">
                <img src={aktivTrackerSpiller.ikon || '/tiles/player.webp'} alt="" />
                <span>{aktivTracker.targetNavn}</span>
                <small>{trackerDageTilbage} dage</small>
            </div>
        {/if}

        {#if totalMove !== 1}
            <span class="mod-badge move {totalMove > 1 ? 'negativ' : ''}" data-help-title="Bevægelse" data-help-body={moveBadgeHjaelp}>
                <img src="/ui/stat_move.webp" alt="" />
                {totalMove}
            </span>
        {/if}
        {#if totalArmor !== 0}
            <span class="mod-badge dmg {totalArmor < 0 ? 'negativ' : ''}" data-help-title="Skade" data-help-body={skadeBadgeHjaelp}>
                <img src="/ui/stat_dmg.webp" alt="" />
                {totalArmor}%
            </span>
        {/if}
        {#if totalGoldMod !== 100}
            <span class="mod-badge gold {totalGoldMod < 100 ? 'negativ' : ''}" data-help-title="Guldmodifier" data-help-body={guldBadgeHjaelp}>
                <img src="/ui/stat_gold.webp" alt="" />
                {totalGoldMod}%
            </span>
        {/if}
        {#if totalSyn !== 1}
            <span class="mod-badge syn {totalSyn < 1 ? 'negativ' : ''}" data-help-title="Syn" data-help-body={synBadgeHjaelp}>
                <img src="/ui/stat_syn.webp" alt="" />
                {totalSyn}
            </span>
        {/if}
    </div>

    <div class="ui-content">
        <div class="status-row">
            <div class="status-item" class:kritisk={spilTilstand.livspoint < 30} data-help-title="HP" data-help-body={hpHjaelp}>
                <img src="/inventory/hp.webp" alt="Liv" class="status-icon" />
                <span class="status-value">{spilTilstand.livspoint}</span>
            </div>
            
            <div class="status-item" data-help-title="Guld" data-help-body="Guld bruges i butikker og tæller med i score. Nogle karakterer tjener mere eller mindre guld.">
                <img src="/inventory/guld.webp" alt="Guld" class="status-icon" />
                <span class="status-value">{spilTilstand.guldTotal}</span>
            </div>
        
            <div class="energi-sektion" data-help-title="Energi" data-help-body={energiHjaelp}>
                <div class="energi-container">
                    <div class="energi-grid">
                        {#each Array(9) as tomPlads, i (i)}
                            <div
                                data-dummy={tomPlads}
                                class="lysprik {i >= spilTilstand.maxEnergi ? 'inaktiv' : i < (spilTilstand.nuvaerendeEnergi || 0) ? 'taendt' : ''}"
                            ></div>
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
                data-help-title={graveNavn}
                data-help-body={graveHjaelp}
                onclick={() => { if (kanGrave) grav(); }}
                onkeydown={(e) => { if (kanGrave && (e.key === 'Enter' || e.key === ' ')) grav(); }}
            >
                <div class="ikon-container">
                    <img src={graveIkon} alt={graveAlt} class="inventory-icon grave-icon {harMesterskovl ? 'opgraderet' : ''} {kanGrave ? '' : 'deaktiveret'}" data-help-title={graveNavn} data-help-body={graveHjaelp} />
                </div>
            </div>

            {#each spilTilstand.mitUdstyr as vare (vare.id)}
                {@const dbInfo = itemDB[vare.id]}
                {#if dbInfo && vare.id !== 'skovl' && vare.id !== 'mesterskovl'}
                    <div 
                        class="inventory-item {kanBrugeInventoryVare(vare.id) ? 'klikbar' : ''}" 
                        data-help-title={dbInfo.navn}
                        data-help-body={forklaringForVare(vare.id, kanBrugeInventoryVare(vare.id))}
                        onclick={() => {
                            if (kanBrugeInventoryVare(vare.id)) {
                                haandterInventoryKlik(vare.id);
                            }
                        }}
                        onkeydown={(e) => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                                if (kanBrugeInventoryVare(vare.id)) {
                                    haandterInventoryKlik(vare.id);
                                }
                            }
                        }}
                        role="button"
                        tabindex={kanBrugeInventoryVare(vare.id) ? 0 : -1}
                    >
                        <div class="ikon-container">
                            <img 
                                src={dbInfo.billede} 
                                alt={dbInfo.navn} 
                                class="inventory-icon {erOpgraderetVare(vare.id) ? 'opgraderet' : ''} {erSituationsVare(vare.id) && !kanBrugeInventoryVare(vare.id) ? 'deaktiveret' : ''}" 
                                data-help-title={dbInfo.navn}
                                data-help-body={forklaringForVare(vare.id, kanBrugeInventoryVare(vare.id))}
                            />
                            {#if vare.maengde > 1}
                                <span class="maengde-badge">{vare.maengde}</span>
                            {/if}
                        </div>
                    </div>
                {/if}
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
        padding-bottom: 2.5rem;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
    }

    .ui::before {
        content: '';
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100vw;
        height: 20vh;
        background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.15) 30%, rgba(0, 0, 0, 0.4) 100%);
        z-index: -1;
        pointer-events: none;
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
        touch-action: manipulation;
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
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        pointer-events: auto;
        flex-wrap: wrap;
        user-select: none;
        -webkit-user-select: none;
    }
    .tracker-status {
        display: flex;
        align-items: center;
        gap: 7px;
        min-height: 34px;
        padding: 0.2rem 0.55rem 0.2rem 0.3rem;
        border-radius: 999px;
        background: rgba(8, 18, 24, 0.68);
        color: #e9f7ff;
        font-family: 'Cinzel', serif;
        font-size: 0.9rem;
        box-shadow: 0 0 14px rgba(126, 214, 255, 0.22);
    }
    .tracker-status img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        border-radius: 50%;
        filter: drop-shadow(0 0 5px rgba(126, 214, 255, 0.8));
    }
    .tracker-status small {
        color: #9fd7f4;
        font-family: system-ui, sans-serif;
        font-size: 0.72rem;
        white-space: nowrap;
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
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
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
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-x;
    }

    .inventory-icon {
        height: 68px;
        width: auto;
        filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9));
        user-select: none;
        -webkit-user-select: none;
        -webkit-user-drag: none;
    }
    .grave-icon {
        object-fit: contain;
    }
    .inventory-icon.opgraderet {
        filter: drop-shadow(0 0 10px rgba(255, 210, 90, 0.95)) drop-shadow(0 2px 5px rgba(0,0,0,0.9)) brightness(1.12);
    }
    .inventory-icon.deaktiveret {
        filter: grayscale(100%) opacity(50%);
    }
    .inventory-icon.opgraderet.deaktiveret {
        filter: grayscale(60%) opacity(70%) drop-shadow(0 0 9px rgba(255, 210, 90, 0.85)) drop-shadow(0 2px 5px rgba(0,0,0,0.9));
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
    .lysprik.inaktiv {
        background-image: url('/tiles/energi_slukket.webp');
        filter: grayscale(100%) opacity(24%);
        transform: scale(0.82);
    }

    .log-modal-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100dvh;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
        z-index: 5200; display: flex;
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
    .log-header h2 { color: #ffcc00; font-family: 'Cinzel', serif; margin: 0;
    }
    .luk-btn {
        width: 42px;
        height: 42px;
        border: 1px solid #666;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        font-size: 1.6rem;
        line-height: 1;
        cursor: pointer;
        flex: 0 0 auto;
    }
    .luk-btn:hover {
        background: rgba(255, 255, 255, 0.16);
    }
    .log-liste { padding: 20px; overflow-y: auto; flex-grow: 1; }
    .log-post { color: #aaa;
        border-left: 2px solid #333; padding-left: 12px; margin-bottom: 10px; }
    .log-post.nyeste { color: white; border-left-color: #ffcc00; }

    @media (max-width: 700px) {
        .ui {
            padding: 0 8px calc(env(safe-area-inset-bottom, 0px) + 8px);
            gap: 4px;
        }

        .ui::before {
            height: 34dvh;
            background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.45) 35%, rgba(0, 0, 0, 0.9) 100%);
        }

        .island-overskrift {
            font-size: 1rem;
            margin-bottom: 0;
        }

        .log-container {
            margin-bottom: 4px;
        }

        .log-line {
            max-width: 96vw;
        }

        .log-line.aktuel {
            font-size: 0.82rem;
            min-height: 1rem;
        }

        .log-line.forrige {
            display: none;
        }

        .instrument-braet {
            gap: 4px;
            margin-bottom: 4px;
            min-height: 18px;
        }

        .mod-badge {
            font-size: 0.75rem;
            padding: 0 2px;
        }

        .mod-badge img {
            width: 16px;
        }

        .ui-content {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: end;
            gap: 8px;
            padding: 0;
        }

        .status-row {
            gap: 8px;
            margin-right: 0;
        }

        .status-item {
            font-size: 0.82rem;
        }

        .status-icon {
            height: 30px;
        }

        .energi-container {
            margin: 0;
        }

        .energi-grid {
            grid-template-columns: repeat(3, 12px);
            gap: 2px;
        }

        .lysprik {
            width: 12px;
            height: 12px;
        }

        .inventory-row {
            gap: 7px;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 2px 36px 2px 0;
            scrollbar-width: none;
            user-select: none;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
        }

        .inventory-row::-webkit-scrollbar {
            display: none;
        }

        .inventory-item {
            flex: 0 0 auto;
        }

        .inventory-icon {
            height: 43px;
        }

        .maengde-badge {
            bottom: 2px;
            right: 2px;
            font-size: 0.68rem;
            padding: 1px 4px;
        }

        .log-modal-overlay {
            align-items: stretch;
            padding: 12px;
            box-sizing: border-box;
        }

        .log-modal-content {
            position: relative;
            width: 100%;
            height: auto;
            max-height: calc(100dvh - 24px);
        }

        .log-header {
            padding: 12px 64px 12px 14px;
        }

        .luk-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 48px;
            height: 48px;
            font-size: 1.9rem;
            z-index: 2;
        }
    }
</style>
