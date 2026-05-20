<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { afslørMalmviserMiner, laegGuldIKasseForAktueltFelt } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';

    let { lukVaerksted } = $props<{ lukVaerksted: () => void }>();

    const SKOVL_OPGRADERING_PRIS = 150;
    const STAV_OPGRADERING_PRIS = 200;
    const KVIST_OPGRADERING_PRIS = 175;
    const DIRK_OPGRADERING_PRIS = 150;
    const KNIV_OPGRADERING_PRIS = 150;
    const RUSTNING_OPGRADERING_PRIS = 250;
    const OEKSE_OPGRADERING_PRIS = 175;
    const KOELLE_OPGRADERING_PRIS = 185;
    const BUE_OPGRADERING_PRIS = 175;
    const KLUDER_OPGRADERING_PRIS = 100;
    const ROYALT_TOEJ_OPGRADERING_PRIS = 500;
    const FAKKEL_OPGRADERING_PRIS = 225;
    const DETEKTOR_OPGRADERING_PRIS = 250;
    const SOVEPOSE_OPGRADERING_PRIS = 150;

    let harSkovl = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'skovl' && ting.maengde > 0));
    let harMesterskovl = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterskovl' && ting.maengde > 0));
    let kanOpgradereSkovl = $derived(harSkovl && !harMesterskovl && spilTilstand.guldTotal >= SKOVL_OPGRADERING_PRIS);
    let harStav = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'stav' && ting.maengde > 0));
    let harDragestav = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'dragestav' && ting.maengde > 0));
    let kanOpgradereStav = $derived(harStav && !harDragestav && spilTilstand.guldTotal >= STAV_OPGRADERING_PRIS);
    let harKvist = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'soegekvist' && ting.maengde > 0));
    let harRunekvist = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'runekvist' && ting.maengde > 0));
    let kanOpgradereKvist = $derived(harKvist && !harRunekvist && spilTilstand.guldTotal >= KVIST_OPGRADERING_PRIS);
    let harDirk = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'dirk' && ting.maengde > 0));
    let harMesterdirk = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterdirk' && ting.maengde > 0));
    let kanOpgradereDirk = $derived(harDirk && !harMesterdirk && spilTilstand.guldTotal >= DIRK_OPGRADERING_PRIS);
    let harKniv = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'kniv' && ting.maengde > 0));
    let harMesterkniv = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterkniv' && ting.maengde > 0));
    let kanOpgradereKniv = $derived(harKniv && !harMesterkniv && spilTilstand.guldTotal >= KNIV_OPGRADERING_PRIS);
    let harRustning = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'rustning' && ting.maengde > 0));
    let harKongepanser = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'kongepanser' && ting.maengde > 0));
    let kanOpgradereRustning = $derived(harRustning && !harKongepanser && spilTilstand.guldTotal >= RUSTNING_OPGRADERING_PRIS);
    let harOekse = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'oekse' && ting.maengde > 0));
    let harStormoekse = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'stormoekse' && ting.maengde > 0));
    let kanOpgradereOekse = $derived(harOekse && !harStormoekse && spilTilstand.guldTotal >= OEKSE_OPGRADERING_PRIS);
    let harKoelle = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'koelle' && ting.maengde > 0));
    let harOpgraderetKoelle = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'koelle_upgr' && ting.maengde > 0));
    let kanOpgradereKoelle = $derived(harKoelle && !harOpgraderetKoelle && spilTilstand.guldTotal >= KOELLE_OPGRADERING_PRIS);
    let harBue = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'bue' && ting.maengde > 0));
    let harMesterbue = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterbue' && ting.maengde > 0));
    let kanOpgradereBue = $derived(harBue && !harMesterbue && spilTilstand.guldTotal >= BUE_OPGRADERING_PRIS);
    let harKlude = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'klude' && ting.maengde > 0));
    let harFintToej = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'flot_toej' && ting.maengde > 0));
    let harRoyaltToej = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'royalt_toej' && ting.maengde > 0));
    let kanOpgradereKlude = $derived(harKlude && !harFintToej && !harRoyaltToej && spilTilstand.guldTotal >= KLUDER_OPGRADERING_PRIS);
    let kanOpgradereFintToej = $derived(harFintToej && !harRoyaltToej && spilTilstand.guldTotal >= ROYALT_TOEJ_OPGRADERING_PRIS);
    let harFakkel = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'fakkel' && ting.maengde > 0));
    let harSolfakkel = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'solfakkel' && ting.maengde > 0));
    let kanOpgradereFakkel = $derived(harFakkel && !harSolfakkel && spilTilstand.guldTotal >= FAKKEL_OPGRADERING_PRIS);
    let harDetektor = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'metaldetektor' && ting.maengde > 0));
    let harMalmviser = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'malmviser' && ting.maengde > 0));
    let kanOpgradereDetektor = $derived(harDetektor && !harMalmviser && spilTilstand.guldTotal >= DETEKTOR_OPGRADERING_PRIS);
    let harSovepose = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'sovepose' && ting.maengde > 0));
    let harSilkesovepose = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'silkesovepose' && ting.maengde > 0));
    let kanOpgradereSovepose = $derived(harSovepose && !harSilkesovepose && spilTilstand.guldTotal >= SOVEPOSE_OPGRADERING_PRIS);

    function betalTilVaerksted(pris: number) {
        spilTilstand.guldTotal -= pris;
        laegGuldIKasseForAktueltFelt(pris);
    }

    function harKoelleEllerMurknuser() {
        return spilTilstand.mitUdstyr.some((ting) => (ting.id === 'koelle' || ting.id === 'koelle_upgr') && ting.maengde > 0);
    }

    function afslutOpgradering() {
        if (harKoelleEllerMurknuser()) {
            spilTilstand.logBesked += " Mesteren får øje på køllen og tør ikke arbejde mere for dig.";
            lukVaerksted();
            return;
        }

        syncTilDb();
    }

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

        betalTilVaerksted(SKOVL_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'skovl' && ting.id !== 'mesterskovl'),
            { id: 'mesterskovl', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet afbalancerer skaftet og hærder bladet. Din skovl er nu en mesterskovl.";
        afslutOpgradering();
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

        betalTilVaerksted(STAV_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'stav' && ting.id !== 'dragestav'),
            { id: 'dragestav', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet tvinder dragekraft ind i staven. Den er nu en dragestav.";
        afslutOpgradering();
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

        betalTilVaerksted(KVIST_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'soegekvist' && ting.id !== 'runekvist'),
            { id: 'runekvist', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet skærer runer i kvisten. Den kan nu trække rødder op uden at grave.";
        afslutOpgradering();
    }

    function opgraderDirk() {
        if (harMesterdirk) {
            spilTilstand.logBesked = "Din dirk er allerede opgraderet.";
            return;
        }

        if (!harDirk) {
            spilTilstand.logBesked = "Værkstedet kan ikke file en dirk, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < DIRK_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld for det fine låsearbejde.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(DIRK_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'dirk' && ting.id !== 'mesterdirk'),
            { id: 'mesterdirk', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet sliber dirkens tænder og skjuler nye fjedre i tasken. Den er nu en mesterdirk.";
        afslutOpgradering();
    }

    function opgraderKniv() {
        if (harMesterkniv) {
            spilTilstand.logBesked = "Din kniv er allerede opgraderet.";
            return;
        }

        if (!harKniv) {
            spilTilstand.logBesked = "Værkstedet kan ikke balancere en kniv, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < KNIV_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren mangler guld til hærdning og indlæg.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(KNIV_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'kniv' && ting.id !== 'mesterkniv'),
            { id: 'mesterkniv', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet hærder bladet og afbalancerer grebet. Din kniv er nu en mesterkniv.";
        afslutOpgradering();
    }

    function opgraderRustning() {
        if (harKongepanser) {
            spilTilstand.logBesked = "Din rustning er allerede opgraderet.";
            return;
        }

        if (!harRustning) {
            spilTilstand.logBesked = "Værkstedet kan ikke forgylde en rustning, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < RUSTNING_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til panserplader og ædelstensfatninger.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(RUSTNING_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'rustning' && ting.id !== 'kongepanser'),
            { id: 'kongepanser', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet forgylder pladerne og låser ædelsten i brystet. Din rustning er nu et kongepanser.";
        afslutOpgradering();
    }

    function opgraderOekse() {
        if (harStormoekse) {
            spilTilstand.logBesked = "Din økse er allerede opgraderet.";
            return;
        }

        if (!harOekse) {
            spilTilstand.logBesked = "Værkstedet kan ikke vække stormen i en økse, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < OEKSE_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til runer og hærdet æg.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(OEKSE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'oekse' && ting.id !== 'stormoekse'),
            { id: 'stormoekse', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet lægger runer i øksehovedet og hærder æggen. Din økse er nu en stormøkse.";
        afslutOpgradering();
    }

    function opgraderKoelle() {
        if (harOpgraderetKoelle) {
            spilTilstand.logBesked = "Din kølle er allerede opgraderet.";
            return;
        }

        if (!harKoelle) {
            spilTilstand.logBesked = "Værkstedet kan ikke forstærke en kølle, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < KOELLE_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til jernbånd, blykerne og nitter.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(KOELLE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'koelle' && ting.id !== 'koelle_upgr'),
            { id: 'koelle_upgr', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet binder jern om hovedet og fylder kernen med bly. Din kølle er nu en murknuser.";
        afslutOpgradering();
    }

    function opgraderBue() {
        if (harMesterbue) {
            spilTilstand.logBesked = "Din bue er allerede opgraderet.";
            return;
        }

        if (!harBue) {
            spilTilstand.logBesked = "Værkstedet kan ikke spænde en bue, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < BUE_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til horn, sene og afbalancering.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(BUE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'bue' && ting.id !== 'mesterbue'),
            { id: 'mesterbue', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet spænder buen med ny sene og indlægger horn i grebet. Din bue er nu en falkebue.";
        afslutOpgradering();
    }

    function opgraderKlude() {
        if (harFintToej || harRoyaltToej) {
            spilTilstand.logBesked = "Dit tøj er allerede bedre end klude.";
            return;
        }

        if (!harKlude) {
            spilTilstand.logBesked = "Værkstedet kan ikke sy fint tøj uden stof at starte med.";
            return;
        }

        if (spilTilstand.guldTotal < KLUDER_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til stof, tråd og syning.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(KLUDER_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'klude' && ting.id !== 'flot_toej' && ting.id !== 'royalt_toej'),
            { id: 'flot_toej', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet vasker, farver og syr dine klude om. Du har nu fint tøj.";
        afslutOpgradering();
    }

    function opgraderFintToej() {
        if (harRoyaltToej) {
            spilTilstand.logBesked = "Dit tøj er allerede royalt.";
            return;
        }

        if (!harFintToej) {
            spilTilstand.logBesked = "Værkstedet kan ikke brodere et hofskrud uden fint tøj.";
            return;
        }

        if (spilTilstand.guldTotal < ROYALT_TOEJ_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til hermelin, brokade og guldbroderi.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(ROYALT_TOEJ_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'klude' && ting.id !== 'flot_toej' && ting.id !== 'royalt_toej'),
            { id: 'royalt_toej', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet broderer guldkant og lægger pels over skuldrene. Dit fine tøj er nu royalt.";
        afslutOpgradering();
    }

    function opgraderFakkel() {
        if (harSolfakkel) {
            spilTilstand.logBesked = "Din fakkel er allerede en solfakkel.";
            return;
        }

        if (!harFakkel) {
            spilTilstand.logBesked = "Værkstedet kan ikke forgylde en fakkel, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < FAKKEL_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til olie, guldtråd og ildsten.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(FAKKEL_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'fakkel' && ting.id !== 'solfakkel'),
            { id: 'solfakkel', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet binder ildstenen i faklens krone. Din fakkel er nu en solfakkel.";
        afslutOpgradering();
    }

    function opgraderDetektor() {
        if (harMalmviser) {
            spilTilstand.logBesked = "Din detektor er allerede en malmviser.";
            return;
        }

        if (!harDetektor) {
            spilTilstand.logBesked = "Værkstedet kan ikke kalibrere en detektor, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < DETEKTOR_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til linser, spoler og malmkalibrering.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(DETEKTOR_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'metaldetektor' && ting.id !== 'malmviser'),
            { id: 'malmviser', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        afslørMalmviserMiner();
        spilTilstand.logBesked = "Værkstedet kalibrerer spolen til ren malmklang. Din detektor er nu en malmviser.";
        afslutOpgradering();
    }

    function opgraderSovepose() {
        if (harSilkesovepose) {
            spilTilstand.logBesked = "Din sovepose er allerede opgraderet.";
            return;
        }

        if (!harSovepose) {
            spilTilstand.logBesked = "Værkstedet kan ikke fore en sovepose, du ikke har.";
            return;
        }

        if (spilTilstand.guldTotal < SOVEPOSE_OPGRADERING_PRIS) {
            spilTilstand.logBesked = "Mesteren kræver mere guld til silke, voksdug og guldsyning.";
            syncTilDb();
            return;
        }

        betalTilVaerksted(SOVEPOSE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'sovepose' && ting.id !== 'silkesovepose'),
            { id: 'silkesovepose', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = "Værkstedet syr voksdug og silke omkring varmen. Din sovepose er nu en silkesovepose.";
        afslutOpgradering();
    }

    type Opgradering = {
        titel: string;
        fraId: string;
        tilId: string;
        pris: number;
        harBasis: boolean;
        kanOpgradere: boolean;
        kortTekst: string;
        helpTitle: string;
        helpBody: string;
        opgrader: () => void;
    };

    let relevanteOpgraderinger = $derived<Opgradering[]>([
        {
            titel: 'Skovl til Mesterskovl',
            fraId: 'skovl',
            tilId: 'mesterskovl',
            pris: SKOVL_OPGRADERING_PRIS,
            harBasis: harSkovl && !harMesterskovl,
            kanOpgradere: kanOpgradereSkovl,
            kortTekst: 'Dobbelt guld ved gravning. Nedgravede fælder bliver fundet uden at udløse.',
            helpTitle: 'Skovl-opgradering',
            helpBody: 'Kræver en almindelig skovl og 150 guld. Mesterskovlen giver dobbelt guld ved gravning og udløser ikke nedgravede fælder.',
            opgrader: opgraderSkovl
        },
        {
            titel: 'Stav til Dragestav',
            fraId: 'stav',
            tilId: 'dragestav',
            pris: STAV_OPGRADERING_PRIS,
            harBasis: harStav && !harDragestav,
            kanOpgradere: kanOpgradereStav,
            kortTekst: '5 felter mod øst. Viser ruten imellem. Hvis teleporten ville ende i vand, stopper den sikkert og bliver til almindelig stav.',
            helpTitle: 'Stav-opgradering',
            helpBody: 'Kræver en almindelig stav og 200 guld. Dragestaven teleporterer 5 felter mod øst og afslører ruten imellem. Kun hvis selve teleporten ville ende i åbent vand, stopper den på sidste sikre felt og bliver til en almindelig stav.',
            opgrader: opgraderStav
        },
        {
            titel: 'Søgekvist til Runekvist',
            fraId: 'soegekvist',
            tilId: 'runekvist',
            pris: KVIST_OPGRADERING_PRIS,
            harBasis: harKvist && !harRunekvist,
            kanOpgradere: kanOpgradereKvist,
            kortTekst: 'Trækker skjult liv op ved ankomst, hvis du mangler HP. Koster 1 energi og efterlader feltet ugravet, men tomt.',
            helpTitle: 'Kvist-opgradering',
            helpBody: 'Kræver søgekvist og 175 guld. Runekvisten viser rødder i samme radius 3 og trækker automatisk skjult liv op, når du mangler HP og går ind på feltet.',
            opgrader: opgraderKvist
        },
        {
            titel: 'Dirk til Mesterdirk',
            fraId: 'dirk',
            tilId: 'mesterdirk',
            pris: DIRK_OPGRADERING_PRIS,
            harBasis: harDirk && !harMesterdirk,
            kanOpgradere: kanOpgradereDirk,
            kortTekst: 'Dobbelt guld ved indbrud på tomme byfelter. Risikoen for at blive opdaget er den samme.',
            helpTitle: 'Dirk-opgradering',
            helpBody: 'Kræver en almindelig dirk og 150 guld. Mesterdirken giver dobbelt guld ved indbrud og tæller stadig som dirk.',
            opgrader: opgraderDirk
        },
        {
            titel: 'Kniv til Mesterkniv',
            fraId: 'kniv',
            tilId: 'mesterkniv',
            pris: KNIV_OPGRADERING_PRIS,
            harBasis: harKniv && !harMesterkniv,
            kanOpgradere: kanOpgradereKniv,
            kortTekst: 'Tæller som kniv i events. Knivvalg giver mere guld og mindre skade.',
            helpTitle: 'Kniv-opgradering',
            helpBody: 'Kræver en almindelig kniv og 150 guld. Mesterkniven tæller som kniv i events og gør knivvalg bedre.',
            opgrader: opgraderKniv
        },
        {
            titel: 'Rustning til Kongepanser',
            fraId: 'rustning',
            tilId: 'kongepanser',
            pris: RUSTNING_OPGRADERING_PRIS,
            harBasis: harRustning && !harKongepanser,
            kanOpgradere: kanOpgradereRustning,
            kortTekst: '70% skadesreduktion. Stadig tung: +1 energi pr. skridt. Går tabt i vand som almindelig rustning.',
            helpTitle: 'Rustning-opgradering',
            helpBody: 'Kræver almindelig rustning og 250 guld. Kongepanseret reducerer skade med 70%, men koster stadig 1 ekstra energi pr. skridt.',
            opgrader: opgraderRustning
        },
        {
            titel: 'Økse til Stormøkse',
            fraId: 'oekse',
            tilId: 'stormoekse',
            pris: OEKSE_OPGRADERING_PRIS,
            harBasis: harOekse && !harStormoekse,
            kanOpgradere: kanOpgradereOekse,
            kortTekst: 'Tæller som økse i events. Øksevalg giver 50% mere guld og halverer eventskade fra selve valget.',
            helpTitle: 'Økse-opgradering',
            helpBody: 'Kræver en almindelig økse og 175 guld. Stormøksen tæller som økse i events og gør øksevalg mere brutale: mere guld og mindre skade.',
            opgrader: opgraderOekse
        },
        {
            titel: 'Kølle til Murknuser',
            fraId: 'koelle',
            tilId: 'koelle_upgr',
            pris: KOELLE_OPGRADERING_PRIS,
            harBasis: harKoelle && !harOpgraderetKoelle,
            kanOpgradere: kanOpgradereKoelle,
            kortTekst: 'Kan smadre værksteder og tømme feltets kasse. Smadring koster stadig meget energi.',
            helpTitle: 'Kølle-opgradering',
            helpBody: 'Kræver en almindelig kølle og 185 guld. Murknuseren kan smadre værkstedsfelter, som en almindelig kølle ikke kan knuse.',
            opgrader: opgraderKoelle
        },
        {
            titel: 'Klude til Fint tøj',
            fraId: 'klude',
            tilId: 'flot_toej',
            pris: KLUDER_OPGRADERING_PRIS,
            harBasis: harKlude && !harFintToej && !harRoyaltToej,
            kanOpgradere: kanOpgradereKlude,
            kortTekst: 'Fint tøj giver +15% guldindkomst og lidt beskyttelse, men kan blive flænset i huler og blodskov.',
            helpTitle: 'Tøj-opgradering',
            helpBody: 'Kræver klude og 100 guld. Værkstedet syr dem om til fint tøj, som giver bedre guldindkomst.',
            opgrader: opgraderKlude
        },
        {
            titel: 'Fint tøj til Royalt tøj',
            fraId: 'flot_toej',
            tilId: 'royalt_toej',
            pris: ROYALT_TOEJ_OPGRADERING_PRIS,
            harBasis: harFintToej && !harRoyaltToej,
            kanOpgradere: kanOpgradereFintToej,
            kortTekst: '+40% guldindkomst og lidt bedre beskyttelse. Hvis det flænses, bliver det til almindeligt fint tøj.',
            helpTitle: 'Royalt tøj',
            helpBody: 'Kræver fint tøj og 500 guld. Royalt tøj giver stor guldindkomst og bliver nedgraderet til fint tøj, hvis det flænses.',
            opgrader: opgraderFintToej
        },
        {
            titel: 'Fakkel til Solfakkel',
            fraId: 'fakkel',
            tilId: 'solfakkel',
            pris: FAKKEL_OPGRADERING_PRIS,
            harBasis: harFakkel && !harSolfakkel,
            kanOpgradere: kanOpgradereFakkel,
            kortTekst: '+2 syn. Solbålet afslører et større område for alle, giver fuld HP og 100 guld.',
            helpTitle: 'Fakkel-opgradering',
            helpBody: 'Kræver en almindelig fakkel og 225 guld. Solfaklen giver +2 syn og kan tænde et større solbål.',
            opgrader: opgraderFakkel
        },
        {
            titel: 'Sovepose til Silkesovepose',
            fraId: 'sovepose',
            tilId: 'silkesovepose',
            pris: SOVEPOSE_OPGRADERING_PRIS,
            harBasis: harSovepose && !harSilkesovepose,
            kanOpgradere: kanOpgradereSovepose,
            kortTekst: 'Hvile giver 40 HP i stedet for 20. I huler bliver den nedgraderet til almindelig sovepose.',
            helpTitle: 'Sovepose-opgradering',
            helpBody: 'Kræver en almindelig sovepose og 150 guld. Silkesoveposen giver 40 HP ved hvile og overlever hulefugt som almindelig sovepose.',
            opgrader: opgraderSovepose
        },
        {
            titel: 'Detektor til Malmviser',
            fraId: 'metaldetektor',
            tilId: 'malmviser',
            pris: DETEKTOR_OPGRADERING_PRIS,
            harBasis: harDetektor && !harMalmviser,
            kanOpgradere: kanOpgradereDetektor,
            kortTekst: 'Viser skjult guld i radius 3. Guldminer inden for radius 2 popper frem gennem bjerge. Graveguld giver 25% ekstra.',
            helpTitle: 'Detektor-opgradering',
            helpBody: 'Kræver en almindelig detektor og 250 guld. Malmviseren viser skjult guld som før, afslører guldminer inden for radius 2 og giver 25% mere, når du graver guldet frem.',
            opgrader: opgraderDetektor
        },
        {
            titel: 'Bue til Falkebue',
            fraId: 'bue',
            tilId: 'mesterbue',
            pris: BUE_OPGRADERING_PRIS,
            harBasis: harBue && !harMesterbue,
            kanOpgradere: kanOpgradereBue,
            kortTekst: 'Tæller som bue i events. Buevalg giver 25% mere guld, halverer skade og afslører tre felter mod øst.',
            helpTitle: 'Bue-opgradering',
            helpBody: 'Kræver en almindelig bue og 175 guld. Falkebuen tæller som bue, forbedrer buevalg og afslører tre felter mod øst efter skuddet.',
            opgrader: opgraderBue
        }
    ].filter(opgradering => opgradering.harBasis));

    let klarTilOpgradering = $derived(relevanteOpgraderinger.filter(opgradering => opgradering.kanOpgradere));
    let manglerGuldOpgraderinger = $derived(relevanteOpgraderinger.filter(opgradering => !opgradering.kanOpgradere));
</script>

<div class="vaerksted-overlay">
    <div
        class="vaerksted-content"
        data-help-title="Værksted"
        data-help-body="Værkstedet opgraderer udstyr. Du beholder ikke den gamle genstand ved siden af den nye: skovlen bliver erstattet af en mesterskovl, og soveposen kan blive til en silkesovepose."
    >
        <h2>Mesterværkstedet</h2>
        <p class="intro">Her kan almindeligt udstyr bygges om til noget bedre.</p>

        {#if relevanteOpgraderinger.length === 0}
            <p class="ingen-opgraderinger">Du har ikke noget, værkstedet kan forbedre lige nu.</p>
        {:else}
            {#each klarTilOpgradering as opgradering (opgradering.tilId)}
                <div
                    class="opgradering-kort"
                    data-help-title={opgradering.helpTitle}
                    data-help-body={opgradering.helpBody}
                >
                    <div class="ikon-par">
                        <img src={itemDB[opgradering.fraId].billede} alt={itemDB[opgradering.fraId].navn} />
                        <span>→</span>
                        <img src={itemDB[opgradering.tilId].billede} alt={itemDB[opgradering.tilId].navn} class="opgraderet" />
                    </div>

                    <div class="tekst">
                        <strong>{opgradering.titel}</strong>
                        <p>{opgradering.kortTekst}</p>
                        <span class="pris">{opgradering.pris} Guld</span>
                    </div>

                    <button
                        type="button"
                        onclick={opgradering.opgrader}
                        data-help-title="Opgrader"
                        data-help-body={`Bruger ${opgradering.pris} guld og erstatter ${itemDB[opgradering.fraId].navn.toLowerCase()} med ${itemDB[opgradering.tilId].navn.toLowerCase()}.`}
                    >
                        Opgrader
                    </button>
                </div>
            {/each}

            {#if manglerGuldOpgraderinger.length > 0}
                <div
                    class="mangler-guld-liste"
                    data-help-title="Mangler guld"
                    data-help-body="Du har genstanden, men mangler stadig guld til disse opgraderinger."
                >
                    {#each manglerGuldOpgraderinger as opgradering (opgradering.tilId)}
                        <div class="mangler-guld-raekke">
                            <div class="mini-ikon-par">
                                <img src={itemDB[opgradering.fraId].billede} alt={itemDB[opgradering.fraId].navn} />
                                <span>→</span>
                                <img src={itemDB[opgradering.tilId].billede} alt={itemDB[opgradering.tilId].navn} class="opgraderet" />
                            </div>
                            <strong>{opgradering.titel}</strong>
                            <span class="mangler-pris">Mangler {Math.max(0, opgradering.pris - spilTilstand.guldTotal)} guld</span>
                        </div>
                    {/each}
                </div>
            {/if}
        {/if}

        {#if false}
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
            data-help-body="Kræver en almindelig stav og 200 guld. Dragestaven teleporterer 5 felter mod øst og afslører ruten imellem. Kun hvis selve teleporten ville ende i åbent vand, stopper den på sidste sikre felt og bliver til en almindelig stav."
        >
            <div class="ikon-par">
                <img src={itemDB.stav.billede} alt="Stav" />
                <span>→</span>
                <img src={itemDB.dragestav.billede} alt="Dragestav" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Stav til Dragestav</strong>
                <p>5 felter mod øst. Viser ruten imellem. Hvis teleporten ville ende i vand, stopper den sikkert og bliver til almindelig stav.</p>
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

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereDirk}
            data-help-title="Dirk-opgradering"
            data-help-body="Kræver en almindelig dirk og 150 guld. Mesterdirken giver dobbelt guld ved indbrud og tæller stadig som dirk."
        >
            <div class="ikon-par">
                <img src={itemDB.dirk.billede} alt="Dirk" />
                <span>→</span>
                <img src={itemDB.mesterdirk.billede} alt="Mesterdirk" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Dirk til Mesterdirk</strong>
                <p>Dobbelt guld ved indbrud på tomme byfelter. Risikoen for at blive opdaget er den samme.</p>
                <span class="pris">{DIRK_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderDirk}
                disabled={!kanOpgradereDirk}
                data-help-title="Opgrader"
                data-help-body={harMesterdirk ? 'Du har allerede mesterdirken.' : harDirk ? 'Bruger 150 guld og erstatter din dirk med en mesterdirk.' : 'Du skal først have en almindelig dirk.'}
            >
                {harMesterdirk ? 'Opgraderet' : harDirk ? 'Opgrader' : 'Kræver dirk'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereKniv}
            data-help-title="Kniv-opgradering"
            data-help-body="Kræver en almindelig kniv og 150 guld. Mesterkniven tæller som kniv i events og gør knivvalg bedre."
        >
            <div class="ikon-par">
                <img src={itemDB.kniv.billede} alt="Kniv" />
                <span>→</span>
                <img src={itemDB.mesterkniv.billede} alt="Mesterkniv" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Kniv til Mesterkniv</strong>
                <p>Tæller som kniv i events. Knivvalg giver mere guld og mindre skade.</p>
                <span class="pris">{KNIV_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderKniv}
                disabled={!kanOpgradereKniv}
                data-help-title="Opgrader"
                data-help-body={harMesterkniv ? 'Du har allerede mesterkniven.' : harKniv ? 'Bruger 150 guld og erstatter din kniv med en mesterkniv.' : 'Du skal først have en almindelig kniv.'}
            >
                {harMesterkniv ? 'Opgraderet' : harKniv ? 'Opgrader' : 'Kræver kniv'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereRustning}
            data-help-title="Rustning-opgradering"
            data-help-body="Kræver almindelig rustning og 250 guld. Kongepanseret reducerer skade med 70%, men koster stadig 1 ekstra energi pr. skridt."
        >
            <div class="ikon-par">
                <img src={itemDB.rustning.billede} alt="Rustning" />
                <span>→</span>
                <img src={itemDB.kongepanser.billede} alt="Kongepanser" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Rustning til Kongepanser</strong>
                <p>70% skadesreduktion. Stadig tung: +1 energi pr. skridt. Går tabt i vand som almindelig rustning.</p>
                <span class="pris">{RUSTNING_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderRustning}
                disabled={!kanOpgradereRustning}
                data-help-title="Opgrader"
                data-help-body={harKongepanser ? 'Du har allerede kongepanseret.' : harRustning ? 'Bruger 250 guld og erstatter din rustning med et kongepanser.' : 'Du skal først have en almindelig rustning.'}
            >
                {harKongepanser ? 'Opgraderet' : harRustning ? 'Opgrader' : 'Kræver rustning'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereOekse}
            data-help-title="Økse-opgradering"
            data-help-body="Kræver en almindelig økse og 175 guld. Stormøksen tæller som økse i events og gør øksevalg mere brutale: mere guld og mindre skade."
        >
            <div class="ikon-par">
                <img src={itemDB.oekse.billede} alt="Økse" />
                <span>→</span>
                <img src={itemDB.stormoekse.billede} alt="Stormøkse" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Økse til Stormøkse</strong>
                <p>Tæller som økse i events. Øksevalg giver 50% mere guld og halverer eventskade fra selve valget.</p>
                <span class="pris">{OEKSE_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderOekse}
                disabled={!kanOpgradereOekse}
                data-help-title="Opgrader"
                data-help-body={harStormoekse ? 'Du har allerede stormøksen.' : harOekse ? 'Bruger 175 guld og erstatter din økse med en stormøkse.' : 'Du skal først have en almindelig økse.'}
            >
                {harStormoekse ? 'Opgraderet' : harOekse ? 'Opgrader' : 'Kræver økse'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereKlude}
            data-help-title="Tøj-opgradering"
            data-help-body="Kræver klude og 100 guld. Værkstedet syr dem om til fint tøj, som giver bedre guldindkomst."
        >
            <div class="ikon-par">
                <img src={itemDB.klude.billede} alt="Klude" />
                <span>→</span>
                <img src={itemDB.flot_toej.billede} alt="Fint tøj" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Klude til Fint tøj</strong>
                <p>Fint tøj giver +15% guldindkomst og lidt beskyttelse, men kan blive flænset i huler og blodskov.</p>
                <span class="pris">{KLUDER_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderKlude}
                disabled={!kanOpgradereKlude}
                data-help-title="Opgrader"
                data-help-body={harRoyaltToej ? 'Du har allerede royalt tøj.' : harFintToej ? 'Du har allerede fint tøj.' : harKlude ? 'Bruger 100 guld og syr dine klude om til fint tøj.' : 'Du skal først have klude.'}
            >
                {harRoyaltToej || harFintToej ? 'Opgraderet' : harKlude ? 'Opgrader' : 'Kræver klude'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereFintToej}
            data-help-title="Royalt tøj"
            data-help-body="Kræver fint tøj og 500 guld. Royalt tøj giver stor guldindkomst og bliver nedgraderet til fint tøj, hvis det flænses."
        >
            <div class="ikon-par">
                <img src={itemDB.flot_toej.billede} alt="Fint tøj" />
                <span>→</span>
                <img src={itemDB.royalt_toej.billede} alt="Royalt tøj" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Fint tøj til Royalt tøj</strong>
                <p>+40% guldindkomst og lidt bedre beskyttelse. Hvis det flænses, bliver det til almindeligt fint tøj.</p>
                <span class="pris">{ROYALT_TOEJ_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderFintToej}
                disabled={!kanOpgradereFintToej}
                data-help-title="Opgrader"
                data-help-body={harRoyaltToej ? 'Du har allerede royalt tøj.' : harFintToej ? 'Bruger 500 guld og erstatter dit fine tøj med royalt tøj.' : 'Du skal først have fint tøj.'}
            >
                {harRoyaltToej ? 'Opgraderet' : harFintToej ? 'Opgrader' : 'Kræver fint tøj'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereFakkel}
            data-help-title="Fakkel-opgradering"
            data-help-body="Kræver en almindelig fakkel og 225 guld. Solfaklen giver +2 syn og kan tænde et større solbål."
        >
            <div class="ikon-par">
                <img src={itemDB.fakkel.billede} alt="Fakkel" />
                <span>→</span>
                <img src={itemDB.solfakkel.billede} alt="Solfakkel" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Fakkel til Solfakkel</strong>
                <p>+2 syn. Solbålet afslører et større område for alle, giver fuld HP og 100 guld.</p>
                <span class="pris">{FAKKEL_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderFakkel}
                disabled={!kanOpgradereFakkel}
                data-help-title="Opgrader"
                data-help-body={harSolfakkel ? 'Du har allerede solfaklen.' : harFakkel ? 'Bruger 225 guld og erstatter din fakkel med en solfakkel.' : 'Du skal først have en almindelig fakkel.'}
            >
                {harSolfakkel ? 'Opgraderet' : harFakkel ? 'Opgrader' : 'Kræver fakkel'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereDetektor}
            data-help-title="Detektor-opgradering"
            data-help-body="Kræver en almindelig detektor og 250 guld. Malmviseren viser skjult guld som før, afslører guldminer inden for radius 2 og giver 25% mere, når du graver guldet frem."
        >
            <div class="ikon-par">
                <img src={itemDB.metaldetektor.billede} alt="Detektor" />
                <span>→</span>
                <img src={itemDB.malmviser.billede} alt="Malmviser" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Detektor til Malmviser</strong>
                <p>Viser skjult guld i radius 3. Guldminer inden for radius 2 popper frem gennem bjerge. Graveguld giver 25% ekstra.</p>
                <span class="pris">{DETEKTOR_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderDetektor}
                disabled={!kanOpgradereDetektor}
                data-help-title="Opgrader"
                data-help-body={harMalmviser ? 'Du har allerede malmviseren.' : harDetektor ? 'Bruger 250 guld og erstatter din detektor med en malmviser.' : 'Du skal først have en almindelig detektor.'}
            >
                {harMalmviser ? 'Opgraderet' : harDetektor ? 'Opgrader' : 'Kræver detektor'}
            </button>
        </div>

        <div
            class="opgradering-kort"
            class:inaktiv={!kanOpgradereBue}
            data-help-title="Bue-opgradering"
            data-help-body="Kræver en almindelig bue og 175 guld. Falkebuen tæller som bue, forbedrer buevalg og afslører tre felter mod øst efter skuddet."
        >
            <div class="ikon-par">
                <img src={itemDB.bue.billede} alt="Bue" />
                <span>→</span>
                <img src={itemDB.mesterbue.billede} alt="Falkebue" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Bue til Falkebue</strong>
                <p>Tæller som bue i events. Buevalg giver 25% mere guld, halverer skade og afslører tre felter mod øst.</p>
                <span class="pris">{BUE_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderBue}
                disabled={!kanOpgradereBue}
                data-help-title="Opgrader"
                data-help-body={harMesterbue ? 'Du har allerede falkebuen.' : harBue ? 'Bruger 175 guld og erstatter din bue med en falkebue.' : 'Du skal først have en almindelig bue.'}
            >
                {harMesterbue ? 'Opgraderet' : harBue ? 'Opgrader' : 'Kræver bue'}
            </button>
        </div>
        {/if}

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
        max-height: calc(100dvh - 24px);
        overflow-y: auto;
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

    .ingen-opgraderinger {
        color: #aaa;
        border: 1px dashed #3a3a3a;
        background: #171717;
        padding: 18px;
        margin: 16px 0 0;
    }

    .mangler-guld-liste {
        display: grid;
        gap: 6px;
        margin-top: 14px;
        padding: 10px;
        border: 1px solid #333;
        background: #141414;
        text-align: left;
    }

    .mangler-guld-raekke {
        display: grid;
        grid-template-columns: 82px 1fr auto;
        align-items: center;
        gap: 12px;
        min-height: 42px;
        padding: 6px 8px;
        background: #1b1b1b;
        border: 1px solid #2b2b2b;
    }

    .mangler-guld-raekke strong {
        color: #ddd;
        font-size: 0.92rem;
    }

    .mini-ikon-par {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        color: #b99732;
        font-size: 0.85rem;
    }

    .mini-ikon-par img {
        width: 28px;
        height: 28px;
        object-fit: contain;
    }

    .mini-ikon-par .opgraderet {
        filter: drop-shadow(0 0 6px rgba(255, 210, 90, 0.8)) brightness(1.1);
    }

    .mangler-pris {
        color: #ffcc00;
        font-weight: 700;
        white-space: nowrap;
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

        .mangler-guld-raekke {
            grid-template-columns: 72px 1fr;
        }

        .mangler-pris {
            grid-column: 2;
        }
    }
</style>
