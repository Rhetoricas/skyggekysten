<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { itemDB } from '$lib/spildata';
    import { afslørMalmviserMiner, laegGuldIKasseForAktueltFelt, naegtHandelForAktuelSpillerPaaAktueltFelt } from '$lib/spilmotor';
    import { syncTilDb } from '$lib/netvaerk';
    import { tekst } from '$lib/i18n.svelte';
    import { itemNavn } from '$lib/spilTekst';
    import { kanBetaleMedRoyalPres, kanRoyalPressePris, royalBetaling } from '$lib/royalHandel';

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
    let kanOpgradereSkovl = $derived(harSkovl && !harMesterskovl && kanBetaleVaerkstedPris(SKOVL_OPGRADERING_PRIS));
    let harStav = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'stav' && ting.maengde > 0));
    let harDragestav = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'dragestav' && ting.maengde > 0));
    let kanOpgradereStav = $derived(harStav && !harDragestav && kanBetaleVaerkstedPris(STAV_OPGRADERING_PRIS));
    let harKvist = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'soegekvist' && ting.maengde > 0));
    let harRunekvist = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'runekvist' && ting.maengde > 0));
    let kanOpgradereKvist = $derived(harKvist && !harRunekvist && kanBetaleVaerkstedPris(KVIST_OPGRADERING_PRIS));
    let harDirk = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'dirk' && ting.maengde > 0));
    let harMesterdirk = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterdirk' && ting.maengde > 0));
    let kanOpgradereDirk = $derived(harDirk && !harMesterdirk && kanBetaleVaerkstedPris(DIRK_OPGRADERING_PRIS));
    let harKniv = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'kniv' && ting.maengde > 0));
    let harMesterkniv = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterkniv' && ting.maengde > 0));
    let kanOpgradereKniv = $derived(harKniv && !harMesterkniv && kanBetaleVaerkstedPris(KNIV_OPGRADERING_PRIS));
    let harRustning = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'rustning' && ting.maengde > 0));
    let harKongepanser = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'kongepanser' && ting.maengde > 0));
    let kanOpgradereRustning = $derived(harRustning && !harKongepanser && kanBetaleVaerkstedPris(RUSTNING_OPGRADERING_PRIS));
    let harOekse = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'oekse' && ting.maengde > 0));
    let harStormoekse = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'stormoekse' && ting.maengde > 0));
    let kanOpgradereOekse = $derived(harOekse && !harStormoekse && kanBetaleVaerkstedPris(OEKSE_OPGRADERING_PRIS));
    let harKoelle = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'koelle' && ting.maengde > 0));
    let harOpgraderetKoelle = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'koelle_upgr' && ting.maengde > 0));
    let kanOpgradereKoelle = $derived(harKoelle && !harOpgraderetKoelle && kanBetaleVaerkstedPris(KOELLE_OPGRADERING_PRIS));
    let harBue = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'bue' && ting.maengde > 0));
    let harMesterbue = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'mesterbue' && ting.maengde > 0));
    let kanOpgradereBue = $derived(harBue && !harMesterbue && kanBetaleVaerkstedPris(BUE_OPGRADERING_PRIS));
    let harKlude = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'klude' && ting.maengde > 0));
    let harFintToej = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'flot_toej' && ting.maengde > 0));
    let harRoyaltToej = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'royalt_toej' && ting.maengde > 0));
    let kanOpgradereKlude = $derived(harKlude && !harFintToej && !harRoyaltToej && kanBetaleVaerkstedPris(KLUDER_OPGRADERING_PRIS));
    let kanOpgradereFintToej = $derived(harFintToej && !harRoyaltToej && kanBetaleVaerkstedPris(ROYALT_TOEJ_OPGRADERING_PRIS));
    let harFakkel = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'fakkel' && ting.maengde > 0));
    let harSolfakkel = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'solfakkel' && ting.maengde > 0));
    let kanOpgradereFakkel = $derived(harFakkel && !harSolfakkel && kanBetaleVaerkstedPris(FAKKEL_OPGRADERING_PRIS));
    let harDetektor = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'metaldetektor' && ting.maengde > 0));
    let harMalmviser = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'malmviser' && ting.maengde > 0));
    let kanOpgradereDetektor = $derived(harDetektor && !harMalmviser && kanBetaleVaerkstedPris(DETEKTOR_OPGRADERING_PRIS));
    let harSovepose = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'sovepose' && ting.maengde > 0));
    let harSilkesovepose = $derived(spilTilstand.mitUdstyr.some(ting => ting.id === 'silkesovepose' && ting.maengde > 0));
    let kanOpgradereSovepose = $derived(harSovepose && !harSilkesovepose && kanBetaleVaerkstedPris(SOVEPOSE_OPGRADERING_PRIS));

    let royalPrisPressetLog = '';

    function kanBetaleVaerkstedPris(pris: number) {
        return kanBetaleMedRoyalPres(spilTilstand.valgtKarakter?.id, spilTilstand.guldTotal, pris);
    }

    function betalTilVaerksted(pris: number) {
        const royalPrisPresset = kanRoyalPressePris(spilTilstand.valgtKarakter?.id, spilTilstand.guldTotal, pris);
        const betaltPris = royalBetaling(spilTilstand.valgtKarakter?.id, spilTilstand.guldTotal, pris);
        spilTilstand.guldTotal -= betaltPris;
        laegGuldIKasseForAktueltFelt(betaltPris);
        royalPrisPressetLog = royalPrisPresset
            ? tekst(
                ' Mesteren ser din titel og nøjes med beløbet. Ingen på værkstedet protesterer.',
                ' The master sees your title and accepts the amount. No one in the workshop objects.'
            )
            : '';
    }

    function harKoelleEllerMurknuser() {
        return spilTilstand.mitUdstyr.some((ting) => (ting.id === 'koelle' || ting.id === 'koelle_upgr') && ting.maengde > 0);
    }

    function afslutOpgradering() {
        if (royalPrisPressetLog) {
            const senesteBesked = spilTilstand.logBesked.replace(/^DAG \d+ - /, '');
            spilTilstand.logBesked = `${senesteBesked}${royalPrisPressetLog}`;
            royalPrisPressetLog = '';
        }

        if (harKoelleEllerMurknuser()) {
            naegtHandelForAktuelSpillerPaaAktueltFelt();
            const senesteBesked = spilTilstand.logBesked.replace(/^DAG \d+ - /, '');
            spilTilstand.logBesked = `${senesteBesked} ${tekst('Mesteren får øje på køllen og vil ikke arbejde for dig igen.', 'The master notices the club and refuses to work for you again.')}`;
            lukVaerksted();
            return;
        }

        syncTilDb();
    }

    function brugEnFakkelOgTilfoejSolfakkel() {
        const fakkel = spilTilstand.mitUdstyr.find(ting => ting.id === 'fakkel' && ting.maengde > 0);
        if (!fakkel) return false;

        fakkel.maengde -= 1;
        const solfakkel = spilTilstand.mitUdstyr.find(ting => ting.id === 'solfakkel');
        if (solfakkel) {
            solfakkel.maengde = Math.max(0, solfakkel.maengde || 0) + 1;
            solfakkel.anskaffetDag = Math.min(solfakkel.anskaffetDag ?? spilTilstand.dag, spilTilstand.dag);
        } else {
            spilTilstand.mitUdstyr.push({ id: 'solfakkel', maengde: 1, anskaffetDag: spilTilstand.dag });
        }

        spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter(ting => ting.maengde > 0);
        return true;
    }

    function opgraderSkovl() {
        if (harMesterskovl) {
            spilTilstand.logBesked = tekst('Din skovl er allerede opgraderet.', 'Your shovel is already upgraded.');
            return;
        }

        if (!harSkovl) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig skovl at opgradere.', 'You do not have a regular shovel to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(SKOVL_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere skovlen.', 'You need more gold to upgrade the shovel.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(SKOVL_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'skovl' && ting.id !== 'mesterskovl'),
            { id: 'mesterskovl', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet afbalancerer skaftet og hærder bladet. Din skovl er nu en mesterskovl.', 'The workshop balances the handle and hardens the blade. Your shovel is now a master shovel.');
        afslutOpgradering();
    }

    function opgraderStav() {
        if (harDragestav) {
            spilTilstand.logBesked = tekst('Din stav er allerede opgraderet.', 'Your staff is already upgraded.');
            return;
        }

        if (!harStav) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig stav at opgradere.', 'You do not have a regular staff to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(STAV_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere staven.', 'You need more gold to upgrade the staff.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(STAV_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'stav' && ting.id !== 'dragestav'),
            { id: 'dragestav', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Mesteren sætter en glødende kerne i staven. Den er nu en dragestav.', 'The master fits a glowing core into the staff. It is now a dragon staff.');
        afslutOpgradering();
    }

    function opgraderKvist() {
        if (harRunekvist) {
            spilTilstand.logBesked = tekst('Din søgekvist er allerede opgraderet.', 'Your dowsing rod is already upgraded.');
            return;
        }

        if (!harKvist) {
            spilTilstand.logBesked = tekst('Du har ingen søgekvist at opgradere.', 'You do not have a dowsing rod to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(KVIST_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere søgekvisten.', 'You need more gold to upgrade the dowsing rod.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(KVIST_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'soegekvist' && ting.id !== 'runekvist'),
            { id: 'runekvist', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet skærer runer i kvisten. Den kan nu trække rødder op uden at grave.', 'The workshop cuts runes into the rod. It can now pull up roots without digging.');
        afslutOpgradering();
    }

    function opgraderDirk() {
        if (harMesterdirk) {
            spilTilstand.logBesked = tekst('Din dirk er allerede opgraderet.', 'Your lockpick is already upgraded.');
            return;
        }

        if (!harDirk) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig dirk at opgradere.', 'You do not have a regular lockpick to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(DIRK_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere dirken.', 'You need more gold to upgrade the lockpick.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(DIRK_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'dirk' && ting.id !== 'mesterdirk'),
            { id: 'mesterdirk', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Mesteren sliber dirkens tænder og bygger fine fjedre ind i skaftet. Den er nu en mesterdirk.', 'The master sharpens the lockpick’s teeth and fits fine springs into its shaft. It is now a master lockpick.');
        afslutOpgradering();
    }

    function opgraderKniv() {
        if (harMesterkniv) {
            spilTilstand.logBesked = tekst('Din kniv er allerede opgraderet.', 'Your knife is already upgraded.');
            return;
        }

        if (!harKniv) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig kniv at opgradere.', 'You do not have a regular knife to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(KNIV_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere kniven.', 'You need more gold to upgrade the knife.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(KNIV_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'kniv' && ting.id !== 'mesterkniv'),
            { id: 'mesterkniv', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet hærder bladet og afbalancerer grebet. Din kniv er nu en mesterkniv.', 'The workshop hardens the blade and balances the grip. Your knife is now a master knife.');
        afslutOpgradering();
    }

    function opgraderRustning() {
        if (harKongepanser) {
            spilTilstand.logBesked = tekst('Din rustning er allerede opgraderet.', 'Your armor is already upgraded.');
            return;
        }

        if (!harRustning) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig rustning at opgradere.', 'You do not have regular armor to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(RUSTNING_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere rustningen.', 'You need more gold to upgrade the armor.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(RUSTNING_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'rustning' && ting.id !== 'kongepanser'),
            { id: 'kongepanser', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Mesteren forgylder pladerne og fæstner ædelsten i brystpladen. Din rustning er nu et kongepanser.', 'The master gilds the plates and sets gems into the breastplate. Your armor is now royal armor.');
        afslutOpgradering();
    }

    function opgraderOekse() {
        if (harStormoekse) {
            spilTilstand.logBesked = tekst('Din økse er allerede opgraderet.', 'Your axe is already upgraded.');
            return;
        }

        if (!harOekse) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig økse at opgradere.', 'You do not have a regular axe to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(OEKSE_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere øksen.', 'You need more gold to upgrade the axe.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(OEKSE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'oekse' && ting.id !== 'stormoekse'),
            { id: 'stormoekse', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet lægger runer i øksehovedet og hærder æggen. Din økse er nu en stormøkse.', 'The workshop sets runes into the axe head and hardens the edge. Your axe is now a storm axe.');
        afslutOpgradering();
    }

    function opgraderKoelle() {
        if (harOpgraderetKoelle) {
            spilTilstand.logBesked = tekst('Din kølle er allerede opgraderet.', 'Your club is already upgraded.');
            return;
        }

        if (!harKoelle) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig kølle at opgradere.', 'You do not have a regular club to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(KOELLE_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere køllen.', 'You need more gold to upgrade the club.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(KOELLE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'koelle' && ting.id !== 'koelle_upgr'),
            { id: 'koelle_upgr', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet binder jern om hovedet og fylder kernen med bly. Din kølle er nu en murknuser.', 'The workshop binds iron around the head and fills the core with lead. Your club is now a wallbreaker.');
        afslutOpgradering();
    }

    function opgraderBue() {
        if (harMesterbue) {
            spilTilstand.logBesked = tekst('Din bue er allerede opgraderet.', 'Your bow is already upgraded.');
            return;
        }

        if (!harBue) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig bue at opgradere.', 'You do not have a regular bow to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(BUE_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere buen.', 'You need more gold to upgrade the bow.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(BUE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'bue' && ting.id !== 'mesterbue'),
            { id: 'mesterbue', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet spænder buen med ny sene og indlægger horn i grebet. Din bue er nu en falkebue.', 'The workshop strings the bow with new cord and sets horn into the grip. Your bow is now a falcon bow.');
        afslutOpgradering();
    }

    function opgraderKlude() {
        if (harFintToej || harRoyaltToej) {
            spilTilstand.logBesked = tekst('Dit tøj er allerede fint nok.', 'Your clothes are already fine enough.');
            return;
        }

        if (!harKlude) {
            spilTilstand.logBesked = tekst('Du har ikke noget almindeligt tøj at opgradere.', 'You do not have regular clothes to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(KLUDER_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere tøjet.', 'You need more gold to upgrade the clothes.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(KLUDER_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'klude' && ting.id !== 'flot_toej' && ting.id !== 'royalt_toej'),
            { id: 'flot_toej', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet vasker, farver og syr dit tøj om. Du har nu fint tøj.', 'The workshop washes, dyes and resews your clothes. You now have fine clothes.');
        afslutOpgradering();
    }

    function opgraderFintToej() {
        if (harRoyaltToej) {
            spilTilstand.logBesked = tekst('Dit tøj er allerede royalt.', 'Your clothes are already royal.');
            return;
        }

        if (!harFintToej) {
            spilTilstand.logBesked = tekst('Du har ikke fint tøj at opgradere.', 'You do not have fine clothes to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(ROYALT_TOEJ_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere det fine tøj.', 'You need more gold to upgrade the fine clothes.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(ROYALT_TOEJ_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'klude' && ting.id !== 'flot_toej' && ting.id !== 'royalt_toej'),
            { id: 'royalt_toej', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet broderer guldkant og lægger pels over skuldrene. Dit fine tøj er nu royalt.', 'The workshop embroiders golden trim and lays fur over your shoulders. Your fine clothes are now royal.');
        afslutOpgradering();
    }

    function opgraderFakkel() {
        if (harSolfakkel) {
            spilTilstand.logBesked = tekst('Du har allerede en solfakkel. Værkstedet opgraderer ikke flere fakler.', 'You already have a sun torch. The workshop will not upgrade another torch.');
            return;
        }

        if (!harFakkel) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig fakkel at opgradere.', 'You do not have a regular torch to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(FAKKEL_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere faklen.', 'You need more gold to upgrade the torch.');
            syncTilDb();
            return;
        }

        if (!brugEnFakkelOgTilfoejSolfakkel()) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig fakkel at opgradere.', 'You do not have a regular torch to upgrade.');
            return;
        }

        betalTilVaerksted(FAKKEL_OPGRADERING_PRIS);
        spilTilstand.logBesked = tekst('Værkstedet binder ildstenen i faklens krone. Din fakkel er nu en solfakkel.', 'The workshop binds the firestone into the torch crown. Your torch is now a sun torch.');
        afslutOpgradering();
    }

    function opgraderDetektor() {
        if (harMalmviser) {
            spilTilstand.logBesked = tekst('Din detektor er allerede en malmviser.', 'Your detector is already an ore finder.');
            return;
        }

        if (!harDetektor) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig detektor at opgradere.', 'You do not have a regular detector to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(DETEKTOR_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere detektoren.', 'You need more gold to upgrade the detector.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(DETEKTOR_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'metaldetektor' && ting.id !== 'malmviser'),
            { id: 'malmviser', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        afslørMalmviserMiner();
        spilTilstand.logBesked = tekst('Mesteren kalibrerer spolen til at finde malm. Din detektor er nu en malmviser.', 'The master calibrates the coil to detect ore. Your detector is now an ore finder.');
        afslutOpgradering();
    }

    function opgraderSovepose() {
        if (harSilkesovepose) {
            spilTilstand.logBesked = tekst('Din sovepose er allerede opgraderet.', 'Your sleeping bag is already upgraded.');
            return;
        }

        if (!harSovepose) {
            spilTilstand.logBesked = tekst('Du har ingen almindelig sovepose at opgradere.', 'You do not have a regular sleeping bag to upgrade.');
            return;
        }

        if (!kanBetaleVaerkstedPris(SOVEPOSE_OPGRADERING_PRIS)) {
            spilTilstand.logBesked = tekst('Du mangler guld til at opgradere soveposen.', 'You need more gold to upgrade the sleeping bag.');
            syncTilDb();
            return;
        }

        betalTilVaerksted(SOVEPOSE_OPGRADERING_PRIS);
        spilTilstand.mitUdstyr = [
            ...spilTilstand.mitUdstyr.filter(ting => ting.id !== 'sovepose' && ting.id !== 'silkesovepose'),
            { id: 'silkesovepose', maengde: 1, anskaffetDag: spilTilstand.dag }
        ];
        spilTilstand.logBesked = tekst('Værkstedet syr blødt silkefoer og dun i posen. Din sovepose er nu en silkesovepose.', 'The workshop sews soft silk lining and down into the bag. Your sleeping bag is now a silk sleeping bag.');
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
            titel: tekst('Skovl til Mesterskovl', 'Shovel to Master Shovel'),
            fraId: 'skovl',
            tilId: 'mesterskovl',
            pris: SKOVL_OPGRADERING_PRIS,
            harBasis: harSkovl && !harMesterskovl,
            kanOpgradere: kanOpgradereSkovl,
            kortTekst: tekst('Dobbelt guld ved gravning. Nedgravede fælder findes uden at blive udløst.', 'Double gold when digging. Buried traps are found without being triggered.'),
            helpTitle: tekst('Skovl-opgradering', 'Shovel upgrade'),
            helpBody: tekst('Kræver en almindelig skovl og 150 guld. Mesterskovlen giver dobbelt guld ved gravning og finder nedgravede fælder uden at udløse dem.', 'Requires a regular shovel and 150 gold. The master shovel gives double gold when digging and finds buried traps without triggering them.'),
            opgrader: opgraderSkovl
        },
        {
            titel: tekst('Stav til Dragestav', 'Staff to Dragon Staff'),
            fraId: 'stav',
            tilId: 'dragestav',
            pris: STAV_OPGRADERING_PRIS,
            harBasis: harStav && !harDragestav,
            kanOpgradere: kanOpgradereStav,
            kortTekst: tekst('Fører dig 5 felter mod øst og viser ruten. Ender turen i vand, stopper du på det sidste sikre felt, og dragestaven bliver til en almindelig stav.', 'Carries you 5 tiles east and reveals the route. If the journey ends in water, you stop on the last safe tile, and the dragon staff becomes a regular staff.'),
            helpTitle: tekst('Stav-opgradering', 'Staff upgrade'),
            helpBody: tekst('Kræver en almindelig stav og 200 guld. Dragestaven fører dig 5 felter mod øst og afslører ruten. Hvis turen ender i åbent vand, standser du på det sidste sikre felt, og dragestaven bliver til en almindelig stav.', 'Requires a regular staff and 200 gold. The dragon staff carries you 5 tiles east and reveals the route. If the journey ends in open water, you stop on the last safe tile, and the dragon staff becomes a regular staff.'),
            opgrader: opgraderStav
        },
        {
            titel: tekst('Søgekvist til Runekvist', 'Dowsing Rod to Rune Rod'),
            fraId: 'soegekvist',
            tilId: 'runekvist',
            pris: KVIST_OPGRADERING_PRIS,
            harBasis: harKvist && !harRunekvist,
            kanOpgradere: kanOpgradereKvist,
            kortTekst: tekst('Trækker automatisk helende rødder op, når du mangler HP. Koster 1 energi. Du kan stadig grave bagefter, men der er intet tilbage at finde.', 'Automatically pulls up healing roots when you are missing HP. Costs 1 energy. You can still dig afterward, but there is nothing left to find.'),
            helpTitle: tekst('Kvist-opgradering', 'Rod upgrade'),
            helpBody: tekst('Kræver en søgekvist og 175 guld. Runekvisten viser rødder op til 3 felter væk og trækker dem automatisk op, når du mangler HP og går ind på feltet. Det koster 1 energi. Du kan stadig grave bagefter, men der er intet tilbage at finde.', 'Requires a dowsing rod and 175 gold. The rune rod reveals roots up to 3 tiles away and automatically pulls them up when you are missing HP and enter the tile. It costs 1 energy. You can still dig afterward, but there is nothing left to find.'),
            opgrader: opgraderKvist
        },
        {
            titel: tekst('Dirk til Mesterdirk', 'Lockpick to Master Lockpick'),
            fraId: 'dirk',
            tilId: 'mesterdirk',
            pris: DIRK_OPGRADERING_PRIS,
            harBasis: harDirk && !harMesterdirk,
            kanOpgradere: kanOpgradereDirk,
            kortTekst: tekst('Dobbelt guld ved indbrud på tomme byfelter. Risikoen for at blive opdaget er uændret.', 'Double gold from burglary on empty town tiles. The risk of being caught is unchanged.'),
            helpTitle: tekst('Dirk-opgradering', 'Lockpick upgrade'),
            helpBody: tekst('Kræver en almindelig dirk og 150 guld. Mesterdirken giver dobbelt guld ved indbrud og kan bruges til alle valg, der kræver en dirk.', 'Requires a regular lockpick and 150 gold. The master lockpick gives double gold from burglary and works for every choice that requires a lockpick.'),
            opgrader: opgraderDirk
        },
        {
            titel: tekst('Kniv til Mesterkniv', 'Knife to Master Knife'),
            fraId: 'kniv',
            tilId: 'mesterkniv',
            pris: KNIV_OPGRADERING_PRIS,
            harBasis: harKniv && !harMesterkniv,
            kanOpgradere: kanOpgradereKniv,
            kortTekst: tekst('Kan bruges til alle valg, der kræver en kniv. De valg giver mere guld og mindre skade.', 'Works for every choice that requires a knife. Those choices give more gold and less damage.'),
            helpTitle: tekst('Kniv-opgradering', 'Knife upgrade'),
            helpBody: tekst('Kræver en almindelig kniv og 150 guld. Mesterkniven kan bruges til alle knivvalg og forbedrer deres udbytte.', 'Requires a regular knife and 150 gold. The master knife works for every knife choice and improves its outcome.'),
            opgrader: opgraderKniv
        },
        {
            titel: tekst('Rustning til Kongepanser', 'Armor to Royal Armor'),
            fraId: 'rustning',
            tilId: 'kongepanser',
            pris: RUSTNING_OPGRADERING_PRIS,
            harBasis: harRustning && !harKongepanser,
            kanOpgradere: kanOpgradereRustning,
            kortTekst: tekst('70 % skadesreduktion. Koster normalt 1 ekstra energi pr. skridt, men ikke for Ridder og Skjoldmø. Går tabt i vand.', '70% damage reduction. Normally costs 1 extra energy per step, but not for the Knight and Shieldmaiden. Lost in water.'),
            helpTitle: tekst('Rustning-opgradering', 'Armor upgrade'),
            helpBody: tekst('Kræver almindelig rustning og 250 guld. Kongepanseret reducerer skade med 70 %, men koster normalt 1 ekstra energi pr. skridt. Ridder og Skjoldmø ignorerer vægten. Panseret går tabt i vand.', 'Requires regular armor and 250 gold. Royal armor reduces damage by 70% but normally costs 1 extra energy per step. The Knight and Shieldmaiden ignore the weight. The armor is lost in water.'),
            opgrader: opgraderRustning
        },
        {
            titel: tekst('Økse til Stormøkse', 'Axe to Storm Axe'),
            fraId: 'oekse',
            tilId: 'stormoekse',
            pris: OEKSE_OPGRADERING_PRIS,
            harBasis: harOekse && !harStormoekse,
            kanOpgradere: kanOpgradereOekse,
            kortTekst: tekst('Kan bruges til alle valg, der kræver en økse. De valg giver 50 % mere guld og halverer skaden.', 'Works for every choice that requires an axe. Those choices give 50% more gold and halve the damage.'),
            helpTitle: tekst('Økse-opgradering', 'Axe upgrade'),
            helpBody: tekst('Kræver en almindelig økse og 175 guld. Stormøksen kan bruges til alle øksevalg og giver mere guld med mindre skade.', 'Requires a regular axe and 175 gold. The storm axe works for every axe choice and gives more gold with less damage.'),
            opgrader: opgraderOekse
        },
        {
            titel: tekst('Kølle til Murknuser', 'Club to Wallbreaker'),
            fraId: 'koelle',
            tilId: 'koelle_upgr',
            pris: KOELLE_OPGRADERING_PRIS,
            harBasis: harKoelle && !harOpgraderetKoelle,
            kanOpgradere: kanOpgradereKoelle,
            kortTekst: tekst('Kan ødelægge værksteder og tage guldet fra kassen. Det koster stadig meget energi.', 'Can destroy workshops and take the gold from the till. It still costs a lot of energy.'),
            helpTitle: tekst('Kølle-opgradering', 'Club upgrade'),
            helpBody: tekst('Kræver en almindelig kølle og 185 guld. Murknuseren kan ødelægge værksteder, som en almindelig kølle ikke kan bryde ned.', 'Requires a regular club and 185 gold. The wallbreaker can destroy workshops that a regular club cannot break down.'),
            opgrader: opgraderKoelle
        },
        {
            titel: tekst('Tøj til Fint tøj', 'Clothes to Fine Clothes'),
            fraId: 'klude',
            tilId: 'flot_toej',
            pris: KLUDER_OPGRADERING_PRIS,
            harBasis: harKlude && !harFintToej && !harRoyaltToej,
            kanOpgradere: kanOpgradereKlude,
            kortTekst: tekst('Fint tøj giver 15 % mere guld og lidt beskyttelse, men kan blive flænset i huler og blodskov.', 'Fine clothes give 15% more gold and some protection but can be torn in caves and the bloodwood.'),
            helpTitle: tekst('Tøj-opgradering', 'Clothes upgrade'),
            helpBody: tekst('Kræver tøj og 100 guld. Værkstedet syr det om til fint tøj, som giver 15 % mere guld og lidt beskyttelse.', 'Requires clothes and 100 gold. The workshop turns them into fine clothes that give 15% more gold and some protection.'),
            opgrader: opgraderKlude
        },
        {
            titel: tekst('Fint tøj til Royalt tøj', 'Fine Clothes to Royal Clothes'),
            fraId: 'flot_toej',
            tilId: 'royalt_toej',
            pris: ROYALT_TOEJ_OPGRADERING_PRIS,
            harBasis: harFintToej && !harRoyaltToej,
            kanOpgradere: kanOpgradereFintToej,
            kortTekst: tekst('40 % mere guld og lidt bedre beskyttelse. Hvis tøjet flænses, bliver det til almindeligt fint tøj.', '40% more gold and slightly better protection. If the clothes are torn, they become regular fine clothes.'),
            helpTitle: tekst('Royalt tøj', 'Royal clothes'),
            helpBody: tekst('Kræver fint tøj og 500 guld. Royalt tøj giver 40 % mere guld og bliver til fint tøj, hvis det flænses.', 'Requires fine clothes and 500 gold. Royal clothes give 40% more gold and become fine clothes if torn.'),
            opgrader: opgraderFintToej
        },
        {
            titel: tekst('Fakkel til Solfakkel', 'Torch to Sun Torch'),
            fraId: 'fakkel',
            tilId: 'solfakkel',
            pris: FAKKEL_OPGRADERING_PRIS,
            harBasis: harFakkel && !harSolfakkel,
            kanOpgradere: kanOpgradereFakkel,
            kortTekst: tekst('Du ser 2 felter længere. Solbålet afslører et større område for alle, giver fuld HP og 100 guld.', 'You see 2 tiles farther. The sunfire reveals a larger area for everyone, gives full HP and 100 gold.'),
            helpTitle: tekst('Fakkel-opgradering', 'Torch upgrade'),
            helpBody: tekst('Kræver en almindelig fakkel og 225 guld. Solfaklen lader dig se 2 felter længere og kan tænde et større solbål.', 'Requires a regular torch and 225 gold. The sun torch lets you see 2 tiles farther and can light a larger sunfire.'),
            opgrader: opgraderFakkel
        },
        {
            titel: tekst('Sovepose til Silkesovepose', 'Sleeping Bag to Silk Sleeping Bag'),
            fraId: 'sovepose',
            tilId: 'silkesovepose',
            pris: SOVEPOSE_OPGRADERING_PRIS,
            harBasis: harSovepose && !harSilkesovepose,
            kanOpgradere: kanOpgradereSovepose,
            kortTekst: tekst('Hvile genvinder op til 40 HP i stedet for 20. I huler bliver den til en almindelig sovepose.', 'Rest recovers up to 40 HP instead of 20. In caves, it becomes a regular sleeping bag.'),
            helpTitle: tekst('Sovepose-opgradering', 'Sleeping bag upgrade'),
            helpBody: tekst('Kræver en almindelig sovepose og 150 guld. Silkesoveposen genvinder op til 40 HP ved hvile. Hulefugt gør den til en almindelig sovepose.', 'Requires a regular sleeping bag and 150 gold. The silk sleeping bag recovers up to 40 HP when resting. Cave damp turns it into a regular sleeping bag.'),
            opgrader: opgraderSovepose
        },
        {
            titel: tekst('Detektor til Malmviser', 'Detector to Ore Finder'),
            fraId: 'metaldetektor',
            tilId: 'malmviser',
            pris: DETEKTOR_OPGRADERING_PRIS,
            harBasis: harDetektor && !harMalmviser,
            kanOpgradere: kanOpgradereDetektor,
            kortTekst: tekst('Viser skjult guld op til 3 felter væk og guldminer op til 2 felter væk, selv bag bjerge. Du finder 25 % mere guld, når du graver.', 'Shows hidden gold up to 3 tiles away and gold mines up to 2 tiles away, even behind mountains. You find 25% more gold when digging.'),
            helpTitle: tekst('Detektor-opgradering', 'Detector upgrade'),
            helpBody: tekst('Kræver en almindelig detektor og 250 guld. Malmviseren afslører skjult guld op til 3 felter væk, finder guldminer op til 2 felter væk og giver 25 % mere guld ved gravning. Krystaller gør den til en almindelig detektor igen.', 'Requires a regular detector and 250 gold. The ore finder reveals hidden gold up to 3 tiles away, finds gold mines up to 2 tiles away and gives 25% more gold when digging. Crystals turn it back into a regular detector.'),
            opgrader: opgraderDetektor
        },
        {
            titel: tekst('Bue til Falkebue', 'Bow to Falcon Bow'),
            fraId: 'bue',
            tilId: 'mesterbue',
            pris: BUE_OPGRADERING_PRIS,
            harBasis: harBue && !harMesterbue,
            kanOpgradere: kanOpgradereBue,
            kortTekst: tekst('Kan bruges til alle valg, der kræver en bue. De valg giver 25 % mere guld og halverer skaden. Når du går, afslører buen et lille område foran dig.', 'Works for every choice that requires a bow. Those choices give 25% more gold and halve the damage. When you move, the bow reveals a small area ahead of you.'),
            helpTitle: tekst('Bue-opgradering', 'Bow upgrade'),
            helpBody: tekst('Kræver en almindelig bue og 175 guld. Falkebuen forbedrer alle buevalg og afslører et lille område foran dig, når du går.', 'Requires a regular bow and 175 gold. The falcon bow improves every bow choice and reveals a small area ahead of you when you move.'),
            opgrader: opgraderBue
        }
    ].filter(opgradering => opgradering.harBasis));

    let klarTilOpgradering = $derived(relevanteOpgraderinger.filter(opgradering => opgradering.kanOpgradere));
    let manglerGuldOpgraderinger = $derived(relevanteOpgraderinger.filter(opgradering => !opgradering.kanOpgradere));
</script>

<div class="vaerksted-overlay">
    <div
        class="vaerksted-content"
        data-help-title={tekst('Værksted', 'Workshop')}
        data-help-body={tekst('Værkstedet opgraderer dit udstyr og erstatter den gamle genstand. Har du en kølle eller murknuser, afslutter mesteren handlen efter én opgradering.', 'The workshop upgrades your equipment and replaces the old item. If you have a club or wallbreaker, the master ends the trade after one upgrade.')}
    >
        <h2>{tekst('Mesterværkstedet', 'Master Workshop')}</h2>
        <p class="intro">{tekst('Her kan almindeligt udstyr bygges om til noget bedre.', 'Here, ordinary equipment can be rebuilt into something better.')}</p>

        {#if relevanteOpgraderinger.length === 0}
            <p class="ingen-opgraderinger">{tekst('Du har ikke noget, værkstedet kan forbedre lige nu.', 'You do not have anything the workshop can improve right now.')}</p>
        {:else}
            {#each klarTilOpgradering as opgradering (opgradering.tilId)}
                <div
                    class="opgradering-kort"
                    data-help-title={opgradering.helpTitle}
                    data-help-body={opgradering.helpBody}
                >
                    <div class="ikon-par">
                        <img src={itemDB[opgradering.fraId].billede} alt={itemNavn(opgradering.fraId)} />
                        <span>→</span>
                        <img src={itemDB[opgradering.tilId].billede} alt={itemNavn(opgradering.tilId)} class="opgraderet" />
                    </div>

                    <div class="tekst">
                        <strong>{opgradering.titel}</strong>
                        <p>{opgradering.kortTekst}</p>
                        <span class="pris">{opgradering.pris} {tekst('guld', 'gold')}</span>
                    </div>

                    <button
                        type="button"
                        onclick={opgradering.opgrader}
                        data-help-title={tekst('Opgrader', 'Upgrade')}
                        data-help-body={tekst(`Koster ${opgradering.pris} guld. Opgraderingen erstatter ${itemNavn(opgradering.fraId).toLowerCase()} med ${itemNavn(opgradering.tilId).toLowerCase()}.`, `Costs ${opgradering.pris} gold. The upgrade replaces ${itemNavn(opgradering.fraId).toLowerCase()} with ${itemNavn(opgradering.tilId).toLowerCase()}.`)}
                    >
                        {tekst('Opgrader', 'Upgrade')}
                    </button>
                </div>
            {/each}

            {#if manglerGuldOpgraderinger.length > 0}
                <div
                    class="mangler-guld-liste"
                    data-help-title={tekst('Mangler guld', 'Missing gold')}
                    data-help-body={tekst('Du har genstanden, men mangler stadig guld til disse opgraderinger.', 'You have the item, but still need gold for these upgrades.')}
                >
                    {#each manglerGuldOpgraderinger as opgradering (opgradering.tilId)}
                        <div class="mangler-guld-raekke">
                            <div class="mini-ikon-par">
                                <img src={itemDB[opgradering.fraId].billede} alt={itemNavn(opgradering.fraId)} />
                                <span>→</span>
                                <img src={itemDB[opgradering.tilId].billede} alt={itemNavn(opgradering.tilId)} class="opgraderet" />
                            </div>
                            <strong>{opgradering.titel}</strong>
                            <span class="mangler-pris">{tekst(`Mangler ${Math.max(0, opgradering.pris - spilTilstand.guldTotal)} guld`, `Missing ${Math.max(0, opgradering.pris - spilTilstand.guldTotal)} gold`)}</span>
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
            data-help-body="Kræver almindelig rustning og 250 guld. Kongepanseret reducerer skade med 70%, men koster normalt 1 ekstra energi pr. skridt. Ridder og Skjoldmø ignorerer vægten."
        >
            <div class="ikon-par">
                <img src={itemDB.rustning.billede} alt="Rustning" />
                <span>→</span>
                <img src={itemDB.kongepanser.billede} alt="Kongepanser" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Rustning til Kongepanser</strong>
                <p>70% skadesreduktion. Normalt tung: +1 energi pr. skridt, men ikke for Ridder/Skjoldmø. Går tabt i vand.</p>
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
            data-help-body="Kræver tøj og 100 guld. Værkstedet syr det om til fint tøj, som giver bedre guldindkomst."
        >
            <div class="ikon-par">
                <img src={itemDB.klude.billede} alt="Tøj" />
                <span>→</span>
                <img src={itemDB.flot_toej.billede} alt="Fint tøj" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Tøj til Fint tøj</strong>
                <p>Fint tøj giver +15% guldindkomst og lidt beskyttelse, men kan blive flænset i huler og blodskov.</p>
                <span class="pris">{KLUDER_OPGRADERING_PRIS} Guld</span>
            </div>

            <button
                type="button"
                onclick={opgraderKlude}
                disabled={!kanOpgradereKlude}
                data-help-title="Opgrader"
                data-help-body={harRoyaltToej ? 'Du har allerede royalt tøj.' : harFintToej ? 'Du har allerede fint tøj.' : harKlude ? 'Bruger 100 guld og syr dit tøj om til fint tøj.' : 'Du skal først have tøj.'}
            >
                {harRoyaltToej || harFintToej ? 'Opgraderet' : harKlude ? 'Opgrader' : 'Kræver tøj'}
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
                data-help-body={harFakkel ? 'Bruger 225 guld og opgraderer én fakkel til én solfakkel.' : 'Du skal først have en almindelig fakkel.'}
            >
                {harFakkel ? 'Opgrader' : 'Kræver fakkel'}
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
            data-help-body="Kræver en almindelig bue og 175 guld. Falkebuen tæller som bue, forbedrer buevalg og afslører en lille vifte foran dig, når du går."
        >
            <div class="ikon-par">
                <img src={itemDB.bue.billede} alt="Bue" />
                <span>→</span>
                <img src={itemDB.mesterbue.billede} alt="Falkebue" class="opgraderet" />
            </div>

            <div class="tekst">
                <strong>Bue til Falkebue</strong>
                <p>Tæller som bue i events. Buevalg giver 25% mere guld og halverer skade. Når du går, afslører den en lille vifte lige uden for dit syn i bevægelsesretningen.</p>
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

        <button class="forlad-btn" onclick={lukVaerksted}>{tekst('Forlad værkstedet', 'Leave workshop')}</button>
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
