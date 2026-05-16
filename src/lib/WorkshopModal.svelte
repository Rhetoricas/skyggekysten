<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { syncTilDb } from '$lib/netvaerk';

    let { lukVaerksted } = $props<{ lukVaerksted: () => void }>();

    const SKOVL_OPGRADERING_PRIS = 150;
    const STAV_OPGRADERING_PRIS = 200;
    const KVIST_OPGRADERING_PRIS = 175;

    let harSkovl = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'skovl' && ting.maengde > 0));
    let harMesterskovl = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterskovl' && ting.maengde > 0));
    let kanOpgradereSkovl = $derived(harSkovl && !harMesterskovl && spilTilstand.guldTotal >= SKOVL_OPGRADERING_PRIS);
    let harStav = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'stav' && ting.maengde > 0));
    let harDragestav = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'dragestav' && ting.maengde > 0));
    let kanOpgradereStav = $derived(harStav && !harDragestav && spilTilstand.guldTotal >= STAV_OPGRADERING_PRIS);
    let harKvist = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'soegekvist' && ting.maengde > 0));
    let harRunekvist = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'runekvist' && ting.maengde > 0));
    let kanOpgradereKvist = $derived(harKvist && !harRunekvist && spilTilstand.guldTotal >= KVIST_OPGRADERING_PRIS);

    function opgraderSkovl() {
        if (harMesterskovl) {
            spilTilstand.logBesked = "Din skovl er allerede opgraderet.";
            return;
        }

        if (!harSkovl) {
            spilTilstand.logBesked = "Værkstedet kan ikke opgradere en skovl, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < SKOVL_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren ryster på hovedet. Du har ikke guld nok til arbejdet.";
            syncTilDb();
            return;
        }

        spilTilstand.guldTotal -= SKOVL_OPGRADERING_PRIS;
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'skovl' && ting.id !== 'mesterskovl'),
            { id: 'mesterskovl', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet afbalancerer skaftet og hærder bladet. Din skovl er nu en mesterskovl.";
        syncTilDb();
    }

    function opgraderStav() {
        if (harDragestav) {
            spilTilstand.logBesked = "Din stav er allerede opgraderet.";
            return;
        }

        if (!harStav) {
            spilTilstand.logBesked = "Værkstedet kan ikke vække dragen i en stav, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < STAV_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren peger på guldet. Dragestaven kræver mere arbejde.";
            syncTilDb();
            return;
        }

        spilTilstand.guldTotal -= STAV_OPGRADERING_PRIS;
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'stav' && ting.id !== 'dragestav'),
            { id: 'dragestav', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet tvinder dragekraft ind i staven. Den er nu en dragestav.";
        syncTilDb();
    }

    function opgraderKvist() {
        if (harRunekvist) {
            spilTilstand.logBesked = "Din søgekvist er allerede opgraderet.";
            return;
        }

        if (!harKvist) {
            spilTilstand.logBesked = "Værkstedet kan ikke indridse runer i en kvist, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < KVIST_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren mangler guld til runerne.";
            syncTilDb();
            return;
        }

        spilTilstand.guldTotal -= KVIST_OPGRADERING_PRIS;
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'soegekvist' && ting.id !== 'runekvist'),
            { id: 'runekvist', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet skærer runer i kvisten. Den kan nu trække rødder op uden at grave.";
        syncTilDb();
    }
</script>

<div class="vaerksted-overlay">
    <div
        class="vaerksted-content"
        data-help-title="Værksted"
        data-help-body="Værkstedet opgraderer udstyr. Du beholder ikke den gamle genstand ved siden af den nye: skovlen bliver erstattet af en mesterskovl."
    >
        <h2>Mesterværkstedet</h2>
        <p class="intro">Her kan almindeligt udstyr bygges om til noget bedre.</p>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereSkovl}
            data-help-title="Skovl-opgradering"
            data-help-body="Kræver en almindelig skovl og 150 guld. Mesterskovlen giver dobbelt guld ved gravning og udløser ikke nedgravede fælder."
        >
            <div class="ikon-par">
                <img src={itemDB.skovl.billede} alt="Skovl" />
                <span>→</span>
                <img src={itemDB.mesterskovl.billede} alt="Mesterskovl" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Skovl til Mesterskovl</strong>
                <p>Dobbelt guld ved gravning. Nedgravede fælder bliver fundet uden at udløse.</p>
                <span class="pris">{SKOVL_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderSkovl}
                disabled={!kanOpgradereSkovl}
                data-help-title="Opgrader"
                data-help-body={harMesterskovl ? 'Du har allerede mesterskovlen.' : harSkovl ? 'Bruger 150 guld og erstatter din skovl med en mesterskovl.' : 'Du skal først have en almindelig skovl.'}
            >
                {harMesterskovl ? 'Opgraderet' : harSkovl ? 'Opgrader' : 'Kræver skovl'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereStav}
            data-help-title="Stav-opgradering"
            data-help-body="Kræver en almindelig stav og 200 guld. Dragestaven teleporterer 5 felter mod øst, afslører ruten imellem og redder dig fra åbent vand ved at blive til en almindelig stav."
        >
            <div class="ikon-par">
                <img src={itemDB.stav.billede} alt="Stav" />
                <span>→</span>
                <img src={itemDB.dragestav.billede} alt="Dragestav" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Stav til Dragestav</strong>
                <p>5 felter mod øst. Viser ruten imellem. Redder dig fra åbent vand og bliver til almindelig stav.</p>
                <span class="pris">{STAV_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderStav}
                disabled={!kanOpgradereStav}
                data-help-title="Opgrader"
                data-help-body={harDragestav ? 'Du har allerede dragestaven.' : harStav ? 'Bruger 200 guld og erstatter din stav med en dragestav.' : 'Du skal først have en almindelig stav.'}
            >
                {harDragestav ? 'Opgraderet' : harStav ? 'Opgrader' : 'Kræver stav'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereKvist}
            data-help-title="Kvist-opgradering"
            data-help-body="Kræver søgekvist og 175 guld. Runekvisten viser rødder i samme radius 3 og trækker automatisk skjult liv op, når du mangler HP og går ind på feltet."
        >
            <div class="ikon-par">
                <img src={itemDB.soegekvist.billede} alt="Søgekvist" />
                <span>→</span>
                <img src={itemDB.runekvist.billede} alt="Runekvist" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Søgekvist til Runekvist</strong>
                <p>Trækker skjult liv op ved ankomst, hvis du mangler HP. Koster 1 energi og efterlader feltet ugravet, men tomt.</p>
                <span class="pris">{KVIST_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderKvist}
                disabled={!kanOpgradereKvist}
                data-help-title="Opgrader"
                data-help-body={harRunekvist ? 'Du har allerede runekvisten.' : harKvist ? 'Bruger 175 guld og erstatter din søgekvist med en runekvist.' : 'Du skal først have en søgekvist.'}
            >
                {harRunekvist ? 'Opgraderet' : harKvist ? 'Opgrader' : 'Kræver kvist'}
            </button>
        </div>

        <button class="forlad-btn" onclick={lukVaerksted}>Forlad værkstedet</button>
    </div>
</div>

<style>
    .vaerksted-overlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100dvh;
        background: rgba(0, 0, 0, 0.85);
        z-index: 210;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        box-sizing: border-box;
    }

    .vaerksted-content {
        background: #111;
        border: 1px solid #333;
        border-radius: 4px;
        max-width: 720px;
        width: 100%;
        padding: 28px;
        text-align: center;
        box-sizing: border-box;
    }

    h2 {
        margin: 0 0 8px;
        color: #ffcc00;
        text-transform: uppercase;
    }

    .intro {
        color: #aaa;
        margin: 0 0 22px;
    }

    .opgradering-kort {
        display: grid;
        grid-template-columns: 180px 1fr auto;
        align-items: center;
        gap: 18px;
        padding: 16px;
        border: 1px solid #3a3a3a;
        background: #181818;
        text-align: left;
        margin-top: 12px;
    }

    .opgradering-kort.inaktiv {
        opacity: 0.62;
    }

    .ikon-par {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #ffcc00;
        font-size: 1.4rem;
    }

    .ikon-par img {
        width: 56px;
        height: 56px;
        object-fit: contain;
    }

    .ikon-par .opgraderet {
        filter: drop-shadow(0 0 10px rgba(255, 210, 90, 0.9)) brightness(1.12);
    }

    .tekst strong {
        color: #eee;
        font-size: 1.05rem;
    }

    .tekst p {
        color: #aaa;
        line-height: 1.4;
        margin: 6px 0;
    }

    .pris {
        color: gold;
        font-weight: 700;
    }

    button {
        border-radius: 4px;
        border: 1px solid #5f4b16;
        background: #2f260d;
        color: #ffdd73;
        padding: 10px 16px;
        cursor: pointer;
        font-weight: 700;
    }

    button:disabled {
        cursor: default;
        color: #777;
        border-color: #333;
        background: #151515;
    }

    .forlad-btn {
        margin-top: 28px;
        background: transparent;
        border-color: #444;
        color: #aaa;
    }

    .forlad-btn:hover {
        background: #333;
        color: #fff;
    }

    @media (max-width: 700px) {
        .vaerksted-content {
            padding: 16px;
        }

        .opgradering-kort {
            grid-template-columns: 1fr;
            text-align: center;
        }
    }
</style>
