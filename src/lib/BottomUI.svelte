<script lang="ts">
    import { untrack } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { grav } from '$lib/undergrund.svelte';
    import { hvil, brugFraRygsæk, udfoerTeleport, taendBaal, aktiverHemmelighed, begaaIndbrud, kanBegaaIndbrudPaaFelt, kanPlyndreFelt, plyndrFelt } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';
    import { diamantSamletVaerdi, diamantStoerrelsesNavn, diamantVaerdier } from '$lib/score';
    import { registrerHeling } from '$lib/trofaeer';
    import { markerTutorialHandling } from '$lib/tutorial.svelte';
    import { tekst } from '$lib/i18n.svelte';
    import { itemBeskrivelse, itemNavn } from '$lib/spilTekst';
    import type { RygsækTing } from '$lib/types';

    let aktueltFelt = $derived(
        spilTilstand.valgtKarakter && spilTilstand.gitter?.length > 0 
            ? spilTilstand.gitter[spilTilstand.spillerIndex] 
            : null
    );

    let kanGrave = $derived(aktueltFelt && !aktueltFelt.gravet && aktueltFelt.kanGraves);
    let kanBegaaIndbrud = $derived(kanBegaaIndbrudPaaFelt(aktueltFelt));
    let kanPlyndre = $derived(kanPlyndreFelt(aktueltFelt));
    let harMesterskovl = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'mesterskovl' && ting.maengde > 0) ?? false);
    let harSkovl = $derived(spilTilstand.mitUdstyr?.some((ting) => (ting.id === 'skovl' || ting.id === 'mesterskovl') && ting.maengde > 0) ?? false);
    let graveIkon = $derived(harMesterskovl ? itemDB.mesterskovl.billede : harSkovl ? itemDB.skovl.billede : '/ui/haandgrav.webp');
    let graveNavn = $derived(harMesterskovl ? itemNavn('mesterskovl') : harSkovl ? itemNavn('skovl') : tekst('Grav med hænderne', 'Dig with hands'));
    let graveAlt = $derived(kanGrave ? (harSkovl ? tekst(`Grav med ${harMesterskovl ? 'mesterskovl' : 'skovl'}`, `Dig with ${harMesterskovl ? 'master shovel' : 'shovel'}`) : tekst('Grav med hænderne', 'Dig with hands')) : tekst('Her kan ikke graves', 'You cannot dig here'));
    let graveEnergiPris = $derived(spilTilstand.valgtKarakter?.digCost ?? 3);
    let haandGraveEnergiPris = $derived(graveEnergiPris + 4);
    let haandGraveSkade = $derived(spilTilstand.beregnSkade(4));
    let hpHjaelp = $derived(tekst('Dit helbred. På land kollapser du normalt ved 0 HP. I tåge eller vand dør du, medmindre en livseliksir redder dig først. Mad giver +20 HP.', 'Your health. On land you normally collapse at 0 HP. In fog or water you die unless a life elixir saves you first. Food gives +20 HP.'));
    let energiHjaelp = $derived(
        spilTilstand.gratisNaesteBevaegelse
            ? (spilTilstand.gratisBevaegelseKilde === 'bersaerk'
                ? tekst('Din næste energikrævende handling koster 0 energi på grund af bersærkergang.', 'Your next energy-costing action costs 0 energy because of berserk.')
                : tekst('Din næste bevægelse koster 0 energi på grund af mad.', 'Your next move costs 0 energy because of food.'))
            : tekst('Energi bruges på bevægelse, gravning og visse handlinger. Når energien løber tør, går dagen videre efter handlingen.', 'Energy is used for movement, digging and some actions. When energy runs out, the day advances after the action.')
    );
    let graveHjaelp = $derived.by(() => {
        if (!kanGrave) return tekst('Du kan ikke grave på dette felt lige nu.', 'You cannot dig on this field right now.');
        if (harMesterskovl) return tekst(`Graver for ${graveEnergiPris} energi. Mesterskovlen giver normalt dobbelt guld og finder nedgravede fælder uden skade.`, `Dig for ${graveEnergiPris} energy. The master shovel normally gives double gold and finds buried traps without damage.`);
        if (harSkovl) return tekst(`Graver for ${graveEnergiPris} energi. Nedgravede fælder udløses stadig.`, `Dig for ${graveEnergiPris} energy. Buried traps still trigger.`);
        return tekst(`Graver med hænderne for ${haandGraveEnergiPris} energi og ${haandGraveSkade} HP. Nedgravede fælder kan stadig udløses.`, `Dig with hands for ${haandGraveEnergiPris} energy and ${haandGraveSkade} HP. Buried traps can still trigger.`);
    });
    const hvileBiomer = ['eng', 'skov', 'mark', 'bjerg', 'hoejland'];

    let aktuelLog = $derived(spilTilstand.logHistorik.length > 0 ? spilTilstand.logHistorik[spilTilstand.logHistorik.length - 1] : '');
    let forrigeLog = $derived(spilTilstand.logHistorik.length > 1 ? spilTilstand.logHistorik[spilTilstand.logHistorik.length - 2] : '');
    let tredjeLog = $derived(spilTilstand.logHistorik.length > 2 ? spilTilstand.logHistorik[spilTilstand.logHistorik.length - 3] : '');

    $effect(() => {
        const dag = spilTilstand.dag;
        untrack(() => {
            const prefix = `DAG ${dag}`;
            if (dag > 1 && spilTilstand.gameState === 'play' && (!aktuelLog || !aktuelLog.startsWith(prefix))) {
                spilTilstand.logBesked = "";
            }
        });
    });

    function spisMad() {
        const fuldHp = spilTilstand.livspoint >= spilTilstand.maxLivspoint;
        const harGratisBevaegelse = spilTilstand.gratisNaesteBevaegelse;

        if (fuldHp && harGratisBevaegelse) {
            spilTilstand.logBesked = tekst('Du er allerede mæt og fuldt udhvilet.', 'You are already fed and fully rested.');
            return;
        }

        const foerHp = spilTilstand.livspoint;
        brugFraRygsæk('mad', 1);
        spilTilstand.livspoint += 20;
        registrerHeling(foerHp, spilTilstand.livspoint);
        spilTilstand.gratisNaesteBevaegelse = true;
        spilTilstand.gratisBevaegelseKilde = 'mad';
        const faktiskHeling = spilTilstand.livspoint - foerHp;
        spilTilstand.logBesked = tekst(
            `Du spiser din madration. (+${faktiskHeling} HP, næste bevægelse koster 0 energi)`,
            `You eat your food ration. (+${faktiskHeling} HP, next move costs 0 energy)`
        );
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

        if (vareId !== 'skovl' && vareId !== 'mesterskovl') {
            markerTutorialHandling('item');
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

    function diamantForklaring(vare: RygsækTing) {
        const vaerdier = diamantVaerdier(vare);
        if (vaerdier.length === 0) return tekst('En sjælden ædelsten. Den kan sælges i butikker.', 'A rare gem. It can be sold in shops.');
        if (vaerdier.length === 1) {
            const stoerrelse = diamantStoerrelsesNavn(vaerdier[0]);
            const enStoerrelse = stoerrelse === 'enorm' ? 'huge' : stoerrelse === 'stor' ? 'large' : 'small';
            return tekst(`Det er en ${stoerrelse} diamant til ${vaerdier[0]} guld. I butikker får du 75% af værdien.`, `It is a ${enStoerrelse} diamond worth ${vaerdier[0]} gold. Shops pay 75% of the value.`);
        }
        const danskeStoerrelser = vaerdier.map((vaerdi) => `${diamantStoerrelsesNavn(vaerdi)} ${vaerdi}`).join(', ');
        const engelskeStoerrelser = vaerdier.map((vaerdi) => {
            const stoerrelse = diamantStoerrelsesNavn(vaerdi);
            return `${stoerrelse === 'enorm' ? 'huge' : stoerrelse === 'stor' ? 'large' : 'small'} ${vaerdi}`;
        }).join(', ');
        return tekst(`${vaerdier.length} diamanter, samlet værdi ${diamantSamletVaerdi(vare)} guld. Størrelser: ${danskeStoerrelser}. I butikker sælges de samlet for 75% af værdien.`, `${vaerdier.length} diamonds, total value ${diamantSamletVaerdi(vare)} gold. Sizes: ${engelskeStoerrelser}. Shops buy them together for 75% of the value.`);
    }

    function vareBadgeTekst(vare: RygsækTing) {
        if (vare.id === 'diamant') return `${diamantSamletVaerdi(vare)}`;
        return vare.maengde > 1 ? `${vare.maengde}` : '';
    }

    function forklaringForVare(vareId: string, aktiv: boolean, vare?: RygsækTing) {
        const info = itemDB[vareId];
        if (!info) return tekst('Ukendt genstand.', 'Unknown item.');

        if (vareId === 'metaldetektor' || vareId === 'malmviser') {
            return `${itemBeskrivelse(vareId)} ${tekst('Den virker passivt, mens du bevæger dig.', 'It works passively while you move.')}`;
        }

        if (vareId === 'soegekvist' || vareId === 'runekvist') {
            return `${itemBeskrivelse(vareId)} ${tekst('Den virker passivt, mens du bevæger dig.', 'It works passively while you move.')}`;
        }

        if (vareId === 'livseliksir') {
            return `${itemBeskrivelse(vareId)} ${tekst('Den bruges automatisk ved dødelig skade.', 'It is used automatically on lethal damage.')}`;
        }

        if (vareId === 'diamant') {
            return vare ? diamantForklaring(vare) : `${itemBeskrivelse(vareId)} ${tekst('Den kan sælges i butikker.', 'It can be sold in shops.')}`;
        }

        const status = aktiv
            ? tekst('Den kan bruges lige nu.', 'It can be used right now.')
            : erSituationsVare(vareId)
                ? tekst('Den kan ikke bruges i den nuværende situation.', 'It cannot be used in the current situation.')
                : tekst('Effekten virker automatisk eller i events; den skal ikke aktiveres fra inventory.', 'The effect works automatically or in events; it does not need to be activated from the inventory.');

        return `${itemBeskrivelse(vareId)} ${status}`;
    }
</script>

<footer class="ui">
    <div class="island-overskrift">{formaterNavn(spilTilstand.rumKode)}</div>
    
    <div class="log-container">
        <div class="log-line aktuel">{aktuelLog || '\u00A0'}</div>
        <div class="log-line forrige">{forrigeLog || '\u00A0'}</div>
        <div class="log-line tredje">{tredjeLog || '\u00A0'}</div>
    </div>

    <div class="ui-content">
        <div class="status-row">
            <div class="status-item" class:kritisk={spilTilstand.livspoint < 30} data-help-title="HP" data-help-body={hpHjaelp}>
                <img src="/inventory/hp.webp" alt={tekst('Liv', 'Health')} class="status-icon" />
                <span class="status-value">{spilTilstand.livspoint}</span>
            </div>
            
            <div class="status-item" data-help-title={tekst('Guld', 'Gold')} data-help-body={tekst('Guld bruges i butikker og tæller med i score. Nogle karakterer tjener mere eller mindre guld.', 'Gold is used in shops and counts toward score. Some characters earn more or less gold.')}>
                <img src="/inventory/guld.webp" alt={tekst('Guld', 'Gold')} class="status-icon" />
                <span class="status-value">{spilTilstand.guldTotal}</span>
            </div>
        
            <div class="energi-sektion" data-help-title={tekst('Energi', 'Energy')} data-help-body={energiHjaelp}>
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
                    {#if kanGrave}
                        <span class="brugbar-prik" aria-hidden="true"></span>
                    {/if}
                </div>
            </div>

            {#each spilTilstand.mitUdstyr as vare (vare.id)}
                {@const dbInfo = itemDB[vare.id]}
                {#if dbInfo && vare.id !== 'skovl' && vare.id !== 'mesterskovl'}
                    <div 
                        class="inventory-item {kanBrugeInventoryVare(vare.id) ? 'klikbar' : ''}" 
                        data-help-title={itemNavn(vare.id)}
                        data-help-body={forklaringForVare(vare.id, kanBrugeInventoryVare(vare.id), vare)}
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
                                alt={itemNavn(vare.id)}
                                class="inventory-icon {erOpgraderetVare(vare.id) ? 'opgraderet' : ''} {erSituationsVare(vare.id) && !kanBrugeInventoryVare(vare.id) ? 'deaktiveret' : ''}" 
                                data-help-title={itemNavn(vare.id)}
                                data-help-body={forklaringForVare(vare.id, kanBrugeInventoryVare(vare.id), vare)}
                            />
                            {#if vareBadgeTekst(vare)}
                                <span class="maengde-badge {vare.id === 'diamant' ? 'diamant-badge' : ''}">{vareBadgeTekst(vare)}</span>
                            {/if}
                            {#if kanBrugeInventoryVare(vare.id)}
                                <span class="brugbar-prik" aria-hidden="true"></span>
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
        background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.45) 24%, rgba(0, 0, 0, 0.92) 100%);
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
    .log-line.forrige,
    .log-line.tredje {
        color: #888;
        font-size: 0.9rem;
        min-height: 1.2rem;
        margin-top: 2px;
    }
    .log-line.tredje {
        color: #666;
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
    .ikon-container {
        position: relative;
    }
    .brugbar-prik {
        position: absolute;
        left: 50%;
        bottom: -9px;
        transform: translateX(-50%);
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.65), 0 0 8px rgba(255, 255, 255, 0.5);
        pointer-events: none;
    }
    :global(body.inspect-global) .ui,
    :global(body.inspect-global) .ui *,
    :global(body.inspect-global) .inventory-item,
    :global(body.inspect-global) .inventory-item * {
        cursor: none !important;
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
    .maengde-badge.diamant-badge {
        background: rgba(0, 0, 0, 0.72);
        color: #ffe066;
        font-size: 0.8rem;
        line-height: 1;
        min-width: 2.2em;
        text-align: center;
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

        .log-line.forrige,
        .log-line.tredje {
            display: block;
            font-size: 0.68rem;
            min-height: 0.82rem;
            margin-top: 1px;
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

        .brugbar-prik {
            bottom: -7px;
            width: 4px;
            height: 4px;
        }

    }
</style>
