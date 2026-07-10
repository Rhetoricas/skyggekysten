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
    let graveNavn = $derived(harMesterskovl ? itemNavn('mesterskovl') : harSkovl ? itemNavn('skovl') : tekst('Grav med hænderne', 'Dig by hand'));
    let graveAlt = $derived(kanGrave ? (harSkovl ? tekst(`Grav med ${harMesterskovl ? 'mesterskovl' : 'skovl'}`, `Dig with ${harMesterskovl ? 'master shovel' : 'shovel'}`) : tekst('Grav med hænderne', 'Dig by hand')) : tekst('Du kan ikke grave her', 'You cannot dig here'));
    let graveEnergiPris = $derived(spilTilstand.valgtKarakter?.digCost ?? 3);
    let haandGraveEnergiPris = $derived(graveEnergiPris + 4);
    let haandGraveSkade = $derived(spilTilstand.beregnSkade(4));
    let hpHjaelp = $derived(tekst('Dit helbred. Ved 0 HP kollapser du normalt på land, men dør i tåge og vand. En livseliksir kan redde dig fra dødelig skade, og en madration genvinder 20 HP.', 'Your health. At 0 HP, you normally collapse on land but die in fog and water. A life elixir can save you from lethal damage, and a food ration restores 20 HP.'));
    let energiHjaelp = $derived(
        spilTilstand.gratisNaesteBevaegelse
            ? (spilTilstand.gratisBevaegelseKilde === 'bersaerk'
                ? tekst('Bersærkergangen gør din næste handling med energiforbrug gratis.', 'Your berserk rage makes your next action with an energy cost free.')
                : tekst('Madrationen gør din næste bevægelse gratis.', 'The food ration makes your next move free.'))
            : tekst('Du bruger energi på at bevæge dig, grave og udføre visse handlinger. Når energien slipper op, slutter dagen efter din handling.', 'You spend energy to move, dig and perform certain actions. When your energy runs out, the day ends after your action.')
    );
    let graveHjaelp = $derived.by(() => {
        if (!kanGrave) return tekst('Du kan ikke grave på dette felt lige nu.', 'You cannot dig on this tile right now.');
        if (harMesterskovl) return tekst(`Koster ${graveEnergiPris} energi. Mesterskovlen giver normalt dobbelt guld og finder nedgravede fælder uden at udløse dem.`, `Costs ${graveEnergiPris} energy. The master shovel normally gives double gold and finds buried traps without triggering them.`);
        if (harSkovl) return tekst(`Koster ${graveEnergiPris} energi. Nedgravede fælder kan stadig blive udløst.`, `Costs ${graveEnergiPris} energy. Buried traps can still be triggered.`);
        return tekst(`Koster ${haandGraveEnergiPris} energi og ${haandGraveSkade} HP at grave med hænderne. Nedgravede fælder kan stadig blive udløst.`, `Costs ${haandGraveEnergiPris} energy and ${haandGraveSkade} HP to dig by hand. Buried traps can still be triggered.`);
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
            spilTilstand.logBesked = tekst('Du har fuld HP, og din næste bevægelse er allerede gratis.', 'You have full HP, and your next move is already free.');
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
            `Du spiser madrationen og genvinder ${faktiskHeling} HP. Din næste bevægelse er gratis.`,
            `You eat the food ration and recover ${faktiskHeling} HP. Your next move is free.`
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
            taendBaal(vareId);
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
        if (vaerdier.length === 0) return tekst('En sjælden ædelsten, som kan sælges i butikker.', 'A rare gem that can be sold in shops.');
        if (vaerdier.length === 1) {
            const stoerrelse = diamantStoerrelsesNavn(vaerdier[0]);
            const enStoerrelse = stoerrelse === 'enorm' ? 'huge' : stoerrelse === 'stor' ? 'large' : 'small';
            return tekst(`En ${stoerrelse} diamant med en værdi på ${vaerdier[0]} guld. Butikker betaler 75 % af værdien.`, `A ${enStoerrelse} diamond worth ${vaerdier[0]} gold. Shops pay 75% of its value.`);
        }
        const danskeStoerrelser = vaerdier.map((vaerdi) => `${diamantStoerrelsesNavn(vaerdi)} (${vaerdi} guld)`).join(', ');
        const engelskeStoerrelser = vaerdier.map((vaerdi) => {
            const stoerrelse = diamantStoerrelsesNavn(vaerdi);
            return `${stoerrelse === 'enorm' ? 'huge' : stoerrelse === 'stor' ? 'large' : 'small'} (${vaerdi} gold)`;
        }).join(', ');
        return tekst(`${vaerdier.length} diamanter med en samlet værdi på ${diamantSamletVaerdi(vare)} guld: ${danskeStoerrelser}. Butikker betaler 75 % af den samlede værdi.`, `${vaerdier.length} diamonds worth ${diamantSamletVaerdi(vare)} gold in total: ${engelskeStoerrelser}. Shops pay 75% of the combined value.`);
    }

    function vareBadgeTekst(vare: RygsækTing) {
        if (vare.id === 'diamant') return `${diamantSamletVaerdi(vare)}`;
        return vare.maengde > 1 ? `${vare.maengde}` : '';
    }

    function forklaringForVare(vareId: string, aktiv: boolean, vare?: RygsækTing) {
        const info = itemDB[vareId];
        if (!info) return tekst('Ukendt genstand.', 'Unknown item.');

        if (vareId === 'metaldetektor' || vareId === 'malmviser') {
            return `${itemBeskrivelse(vareId)} ${tekst('Virker automatisk, mens du bevæger dig.', 'Works automatically while you move.')}`;
        }

        if (vareId === 'soegekvist' || vareId === 'runekvist') {
            return `${itemBeskrivelse(vareId)} ${tekst('Virker automatisk, mens du bevæger dig.', 'Works automatically while you move.')}`;
        }

        if (vareId === 'livseliksir') {
            return `${itemBeskrivelse(vareId)} ${tekst('Du behøver ikke selv aktivere den.', 'You do not need to activate it yourself.')}`;
        }

        if (vareId === 'diamant') {
            return vare ? diamantForklaring(vare) : `${itemBeskrivelse(vareId)} ${tekst('Den kan sælges i butikker.', 'It can be sold in shops.')}`;
        }

        const status = aktiv
            ? tekst('Kan bruges nu.', 'Can be used now.')
            : erSituationsVare(vareId)
                ? tekst('Kan ikke bruges her.', 'Cannot be used here.')
                : tekst('Virker automatisk eller giver særlige valgmuligheder. Den kan ikke aktiveres direkte fra rygsækken.', 'Works automatically or unlocks special choices. It cannot be activated directly from the backpack.');

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
            
            <div class="status-item" data-help-title={tekst('Guld', 'Gold')} data-help-body={tekst('Guld kan bruges i butikker og tæller med i din endelige score. Din karakter og dit tøj kan ændre, hvor meget du tjener.', 'Gold can be spent in shops and counts toward your final score. Your character and clothes can change how much you earn.')}>
                <img src="/inventory/guld.webp" alt={tekst('Guld', 'Gold')} class="status-icon" />
                <span class="status-value">{spilTilstand.guldTotal}</span>
            </div>
        
            <div class="energi-sektion" data-help-title={tekst('Energi', 'Energy')} data-help-body={energiHjaelp}>
                <div class="energi-container">
                    <div class="energi-grid">
                        {#each Array(9) as tomPlads, i (i)}
                            <div
                                data-dummy={tomPlads}
                                class="lysprik {i < (spilTilstand.nuvaerendeEnergi || 0) ? 'taendt' : i >= spilTilstand.maxEnergi ? 'inaktiv' : ''}"
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
