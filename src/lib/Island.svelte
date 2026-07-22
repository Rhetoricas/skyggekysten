<script lang="ts">
    import { onMount, onDestroy, untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { authState, initAuth } from '$lib/auth.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { M10_SCORE, beregnSpillerScore, beskrivSlutSalg } from '$lib/score';
    import { hentHighscores, gemHighscore, sikrAktueltResultatLokalt, syncTilDb, startRealtime, stopRealtime, hentGlobalTopHundrede, hentGlobalTopHundredeIUgen, flushVentendeSync, flushVentendeGravsten, synkroniserPermanenteGravsten, annullerVentendeNetvaerkSync, realtimeRumNoegle, retryVentendeHighscores, gemAfsluttetSpillerISession, opdaterHighscoreMedalje, hentAktueltHighscoreResultatId, rensKortTilLagring } from '$lib/netvaerk';
    import { fletOfflineGravstenIGitter, harOfflineSpil, hentOfflineSpilInfo, indlaesOfflineSpil, sletOfflineSpil } from '$lib/offlineStorage';
    import { hvil, hentNaboIndices, hentNaboIRetning, afslørOmraade, initialiserGitter, tilfoejTilRygsæk, regnHexAfstand, udfoerPortalTeleport, nulstilKort, udloesOversvoemmelse, udloesJordskaelv, udfoerBevaegelse, beregnBevaegelsesEnergiPris, erTrackerAktivPaa, opdaterTrackerSyn, tjekAutoTracker, tjekAutoSpillerMoede, anvendFaellesEventEffekt, saetKortDimensioner } from '$lib/spilmotor';
    import { grav, nulstilUndergrundKlientState } from '$lib/undergrund.svelte';
    import { erSpillerITaagen, nulstilOverlevelseKlientState } from '$lib/overlevelse.svelte';
    import { eventState, startEvent, lukEvent as motorLukEvent } from '$lib/eventMotor.svelte';
    import { erFriskAktivSpiller } from '$lib/aktivSpiller';
    import {
        BREDDE,
        HOEJDE,
        HEX_W,
        ROW_H,
        tilgaengeligeKarakterer,
        itemDB,
        hentKarakterKlasseNoegle
    } from '$lib/spildata';
    import { vaelgStandardKortDimensioner } from '$lib/kortDimensioner';
    import { KORT_VERSION, kortPixelBredde, kortPixelHoejde } from '$lib/kortDimensioner';
    import { erStandardOeNavn } from '$lib/oeNavne';
    import type { Felt, GravstenMinde, Karakter, SpillerData } from '$lib/types';
    import { eventBibliotek } from '$lib/eventBibliotek';
    import { erAfgroedeModen, hentAfgroedeBlok, hentInsektPlageBlok } from '$lib/afgroeder';
    import { erFeltITaagen, hentTaageNiveauForFelt } from '$lib/taage';
    import { findNyeMytiskeTrofaeer, findNyeTrofaeer, gemMytiskeTrofaeIds, gemSupabaseTrofaeAwards, gemTrofaeAwards, gemTrofaeIds, hentGemteMytiskeTrofaeIds, hentGemteTrofaeAwards, hentGemteTrofaeIds, huskVentendeSupabaseMytiskeTrofaeer, huskVentendeSupabaseTrofaeer, lavTrofaeAwardData, lavTrofaeOwnerKey, normaliserTrofaeAwards, normaliserTrofaeIds, nulstilTrofaeStats, retryVentendeSupabaseMytiskeTrofaeer, retryVentendeSupabaseTrofaeer } from '$lib/trofaeer';

    import Skaerme from './Skaerme.svelte';
    import ShopModal from '$lib/ShopModal.svelte';
    import WorkshopModal from '$lib/WorkshopModal.svelte';
    import EventModal from '$lib/EventModal.svelte';
    import VenteModal from '$lib/VenteModal.svelte';
    import BottomUI from './BottomUI.svelte';
    import Regelbog from '$lib/Regelbog.svelte';
    import LydKnap from '$lib/LydKnap.svelte';
    import SprogKnap from '$lib/SprogKnap.svelte';
    import { hentLydVolumen, lydKontrol } from '$lib/lydKontrol.svelte';
    import { erVenteTidUdlobet, lukVenteSpil, nulstilVenteSpilKlientState } from '$lib/ventespil.svelte';
    import { initSprog, tekst } from '$lib/i18n.svelte';
    import {
        TUTORIAL_BREDDE,
        TUTORIAL_HOEJDE,
        TUTORIAL_RUMKODE,
        TUTORIAL_SPILLERNAVN,
        TUTORIAL_START_INDEX,
        hentAktueltTutorialTrin,
        lavTutorialGitter,
        markerTutorialHandling,
        nulstilTutorialState,
        skjulTutorialKnap,
        stopTutorial,
        tutorialKarakter,
        tutorialState,
        tutorialTrin
    } from '$lib/tutorial.svelte';

    const cam = skabKamera();
    const MAX_DAGE_FORAN = 5;
    const VENTE_TAAGE_VARSEL_FELTER = 2;
    const SESSION_SELECT = 'rum_kode,kort,start_index,spillere,fog_x,kort_bredde,kort_hoejde,kort_version,runde_id';
    const START_AUTO_REFRESH_MS = 10000;
    const START_AUTO_REFRESH_KEY = 'taage_pending_start';
    const RUTE_ARKIV_STORAGE_PREFIX = 'taage_route_archive';
    const RUTE_ARKIV_MAX_RUNS = 50;
    const SCORE_GEMNING_TIMEOUT_MS = 30000;

    let lokaleScores = $state<Array<{ navn: string; score: number; karakter?: string }>>([]);
    let klasseScores = $state<Array<{ id?: number; spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);
    let globaleScores = $state<Array<{ id?: number; spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);    
    let ugensGlobaleScores = $state<Array<{ id?: number; spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);
    
    let flytterNu = false;
    let kameraTimerGeneration = 0;
    let bevaegelsesTimerGeneration = 0;
    let sejlendeBaadIndex = $state<number | null>(null);
    let visDoedsLog = $state(false);
    let visTutorialPanel = $state(true);
    let langsomtKamera = $state(false);
    let sidsteKikkertMode = '';
    let ruteOverblikState = '';
    let venteUrTick = $state(Date.now());
    let sidstAutoUdfyldtProfilNavn = '';

    function aktuelHighscoreKlasse() {
        return hentKarakterKlasseNoegle(spilTilstand.valgtKarakter);
    }

    function erTågenTætPåVentespilfelt() {
        if (!spilTilstand.venteSpilAktiv) return false;
        const varselAfstand = HEX_W * VENTE_TAAGE_VARSEL_FELTER;
        const varsletFogX = spilTilstand.fogX < 0
            ? spilTilstand.fogX - varselAfstand
            : spilTilstand.fogX + varselAfstand;
        return erFeltITaagen(spilTilstand.gitter, spilTilstand.spillerIndex, varsletFogX, kortBredde);
    }

    type PendingStart = {
        navn: string;
        rumKode: string;
        refreshes: number;
        startet: number;
    };

    function laesPendingStart() {
        if (!browser) return null;
        try {
            const gemt = sessionStorage.getItem(START_AUTO_REFRESH_KEY);
            return gemt ? JSON.parse(gemt) as PendingStart : null;
        } catch {
            return null;
        }
    }

    function gemPendingStart(navn: string, rumKode: string, refreshes = 0) {
        if (!browser) return;
        sessionStorage.setItem(START_AUTO_REFRESH_KEY, JSON.stringify({
            navn,
            rumKode,
            refreshes,
            startet: Date.now()
        } satisfies PendingStart));
    }

    function rydPendingStart() {
        if (!browser) return;
        sessionStorage.removeItem(START_AUTO_REFRESH_KEY);
    }

    function erForbindelsesStatus() {
        return [
            'Forbinder dig til øen...',
            'Connecting to the island...',
            'Øen svarer langsomt. Prøver igen...',
            'The island is responding slowly. Trying again...'
        ].includes(spilTilstand.statusBesked);
    }

    function planlaegAutoRefreshVedStart(navn: string, rumKode: string) {
        if (!browser) return null;

        return window.setTimeout(() => {
            const pending = laesPendingStart();
            if (!pending || pending.navn !== navn || pending.rumKode !== rumKode) return;
            if (spilTilstand.gameState !== 'start' || !erForbindelsesStatus()) return;

            if (pending.refreshes >= 1) {
                spilTilstand.statusBesked = tekst('Forbindelsen svarer stadig ikke. Prøv igen, eller genindlæs siden.', 'The connection is still not responding. Try again or reload the page.');
                return;
            }

            gemPendingStart(navn, rumKode, pending.refreshes + 1);
            window.location.reload();
        }, START_AUTO_REFRESH_MS);
    }

    let ruteArkivForNaesteTur = $state<Record<string, number[][]>>({});
    let introAktiv = $state(false);
    let sidstePinchAfstand = 0;
    let inspectAktiv = $state(false);
    let inspectBoble = $state<{ titel: string; tekst: string; x: number; y: number } | null>(null);
    let inspectCursor = $state({ x: 0, y: 0, synlig: false });

    $effect(() => {
        if (!browser) return;
        document.documentElement.classList.toggle('inspect-global', inspectAktiv);
        return () => document.documentElement.classList.remove('inspect-global');
    });
    
    let harDetektor = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'metaldetektor' || ting.id === 'malmviser') ?? false);
    let harMalmviser = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'malmviser') ?? false);
    let harRunekvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'runekvist') ?? false);
    let harKvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'soegekvist' || ting.id === 'runekvist') ?? false);
    let aktuelSynsRadius = $derived(Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));
    let pejleRadius = $derived(3);
    let erITågen = $derived(erSpillerITaagen());
    let rensedeLogLinjer = $derived(spilTilstand.logHistorik.filter(linje => linje.includes(' - ')));
    let aktivInsektPlageBlok = $derived(hentInsektPlageBlok(spilTilstand.gitter));
    let kortBredde = $derived(spilTilstand.kortBredde || BREDDE);
    let kortHoejde = $derived(spilTilstand.kortHoejde || HOEJDE);
    let aktuelTutorialTrin = $derived(hentAktueltTutorialTrin());
    let tutorialTrinAntal = $derived(Math.max(1, tutorialTrin.length - 1));
    let bevaegelsesNaboer = $derived(new Set(
        spilTilstand.gameState === 'play' ? hentNaboIndices(spilTilstand.spillerIndex) : []
    ));
    const erLocalhost = () => browser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

    let harSkattekortAktivt = $derived((spilTilstand.mineSkattekortFelter?.length || 0) > 0);

    function taageNiveauForFelt(index: number, erOpslugt: boolean) {
        if (!erOpslugt) return 0;
        return hentTaageNiveauForFelt(spilTilstand.gitter, index, spilTilstand.fogX, kortBredde);
    }

    function hexMidtpunkt(index: number) {
        const raekke = Math.floor(index / kortBredde);
        const kolonne = index % kortBredde;
        return {
            x: kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2),
            y: raekke * ROW_H + 55
        };
    }

    function energiAnimationPunkt(ting: { feltIndex: number; tilFeltIndex?: number; ruteAndel?: number }) {
        const fra = hexMidtpunkt(ting.feltIndex);
        if (ting.tilFeltIndex === undefined) return fra;
        const til = hexMidtpunkt(ting.tilFeltIndex);
        const andel = ting.ruteAndel ?? 0.5;
        return {
            x: fra.x + (til.x - fra.x) * andel,
            y: fra.y + (til.y - fra.y) * andel
        };
    }

    function energiPrisForNabofelt(index: number, erUdforsket: boolean) {
        if (!erUdforsket) return null;
        if (spilTilstand.gameState !== 'play') return null;
        if (!spilTilstand.harEnergisyn) return null;
        if (introAktiv || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted) return null;
        if (spilTilstand.erBevidstløs) return null;
        if (!bevaegelsesNaboer.has(index)) return null;
        return beregnBevaegelsesEnergiPris(index, erITågen, true);
    }

    function findSkatteKlyngeCenter(klynge: number[]) {
        const klyngeSet = new Set(klynge);
        return klynge.find((index) => hentNaboIndices(index).filter((nabo) => klyngeSet.has(nabo)).length === 6)
            ?? klynge[Math.floor(klynge.length / 2)];
    }

    function beregnSkattekortRadius(klynge: number[], centerIndex: number) {
        const center = hexMidtpunkt(centerIndex);
        const afstande = klynge
            .filter((index) => index !== centerIndex)
            .map((index) => {
                const punkt = hexMidtpunkt(index);
                return Math.hypot(punkt.x - center.x, punkt.y - center.y);
            });

        // Pixelgitterets afrundede ROW_H gør de seks afstande højst ca. én
        // pixel forskellige. Middelradius giver derfor den cirkel, der går
        // gennem alle seks nabomidtpunkter med den rigtige klynge-midte.
        return afstande.length > 0
            ? afstande.reduce((sum, afstand) => sum + afstand, 0) / afstande.length
            : Math.hypot(HEX_W / 2, ROW_H);
    }

    function erSkatteKlyngeAfsluttet(klynge: number[]) {
        return klynge.some((index) =>
            (spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(index)) &&
            !!spilTilstand.gitter[index]?.tomSkattekiste
        );
    }

    function hentAktiveSkattekortKlynger() {
        const felter = (spilTilstand.mineSkattekortFelter || [])
            .filter((index) => spilTilstand.gitter[index]?.isSkatteKlynge);

        const klynger = new Map<number, number[]>();
        for (const index of felter) {
            const id = spilTilstand.gitter[index]?.skatId ?? index;
            klynger.set(id, [...(klynger.get(id) || []), index]);
        }

        return Array.from(klynger.entries())
            .map(([id, klynge]) => {
                const center = findSkatteKlyngeCenter(klynge);
                return {
                    id,
                    klynge,
                    center,
                    radius: beregnSkattekortRadius(klynge, center)
                };
            })
            .filter(({ klynge }) => !erSkatteKlyngeAfsluttet(klynge));
    }

    let aktiveSkattekortFelter = $derived.by(() =>
        hentAktiveSkattekortKlynger().flatMap(({ klynge }) => klynge)
    );

    let skattekortCirkler = $derived.by(() =>
        hentAktiveSkattekortKlynger().map(({ id, center, radius }) => ({
            id,
            center: hexMidtpunkt(center),
            radius
        }))
    );

    function forskydPunktMod(
        fra: { x: number; y: number },
        til: { x: number; y: number },
        afstand: number
    ) {
        const dx = til.x - fra.x;
        const dy = til.y - fra.y;
        const laengde = Math.hypot(dx, dy);
        if (laengde <= afstand || laengde === 0) return fra;
        return {
            x: fra.x + (dx / laengde) * afstand,
            y: fra.y + (dy / laengde) * afstand
        };
    }

    function lavSkattekortLinje(
        fraCenter: { x: number; y: number },
        tilCenter: { x: number; y: number },
        fraRadius: number,
        tilRadius: number
    ) {
        const afstand = Math.hypot(tilCenter.x - fraCenter.x, tilCenter.y - fraCenter.y);
        if (afstand === 0) return { fra: fraCenter, til: tilCenter };

        // Ved overlappende cirkler samles enderne på midten, så linjen
        // aldrig vender retning eller fortsætter ind gennem et skatteområde.
        const skala = Math.min(1, afstand / Math.max(1, fraRadius + tilRadius));
        return {
            fra: forskydPunktMod(fraCenter, tilCenter, fraRadius * skala),
            til: forskydPunktMod(tilCenter, fraCenter, tilRadius * skala)
        };
    }

    let skattekortLinjer = $derived.by(() => {
        if (!harSkattekortAktivt || spilTilstand.spillerIndex < 0) return [];

        const klynger = [...hentAktiveSkattekortKlynger()];
        const sorteret = [];
        let kildeIndex = spilTilstand.spillerIndex;

        while (klynger.length > 0) {
            klynger.sort((a, b) =>
                regnHexAfstand(kildeIndex, a.center, kortBredde) -
                regnHexAfstand(kildeIndex, b.center, kortBredde)
            );
            const naeste = klynger.shift();
            if (!naeste) break;
            sorteret.push(naeste);
            kildeIndex = naeste.center;
        }

        let fraCenter = hexMidtpunkt(spilTilstand.spillerIndex);
        let fraRadius = 34;
        return sorteret.map((klynge, index) => {
            const tilCenter = hexMidtpunkt(klynge.center);
            const linje = {
                id: klynge.id,
                ...lavSkattekortLinje(fraCenter, tilCenter, index === 0 ? 34 : fraRadius, klynge.radius)
            };
            // Rækkefølge og retning beregnes fortsat fra den sande midte;
            // kun den synlige streg klippes ved cirklens omkreds.
            fraCenter = tilCenter;
            fraRadius = klynge.radius;
            return linje;
        });
    });

    let baadLinjer = $derived.by(() => {
        if (spilTilstand.spillerIndex < 0) return [];

        const fra = hexMidtpunkt(spilTilstand.spillerIndex);
        return spilTilstand.gitter
            .map((felt, index) => ({ felt, index }))
            .filter(({ felt, index }) =>
                !!felt.hasBoat &&
                (felt.boatCount || 1) > 0 &&
                (spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(index))
            )
            .map(({ index }) => ({
                id: index,
                fra,
                til: hexMidtpunkt(index)
            }));
    });

    const biomeNavne: Record<string, () => string> = {
        mark: () => tekst('mark', 'field'),
        eng: () => tekst('eng', 'meadow'),
        skov: () => tekst('skov', 'forest'),
        bjerg: () => tekst('bjerg', 'mountain'),
        hule: () => tekst('hule', 'cave'),
        ritual: () => tekst('ritualfelt', 'ritual field'),
        ruin: () => tekst('ruin', 'ruin'),
        bandit: () => tekst('banditlejr', 'bandit camp'),
        hoejland: () => tekst('højland', 'highland'),
        blodskov: () => tekst('blodskov', 'bloodwood'),
        by: () => tekst('by', 'town'),
        hav: () => tekst('hav', 'sea'),
        soe: () => tekst('sø', 'lake'),
        krystal: () => tekst('krystal', 'crystal'),
        marked: () => tekst('marked', 'market'),
        slagmark: () => tekst('slagmark', 'battlefield'),
        meteor: () => tekst('meteor', 'meteor')
    };

    const biomeForklaringer: Record<string, () => string> = {
        mark: () => tekst('Du kan grave på marker, og senere kan der vokse afgrøder her. Under jorden ligger oftest små fund som guld, rødder og fakler – men en fælde kan også gemme sig.', 'You can dig in fields, and crops may grow here later. Most buried finds are small, such as gold, roots and torches, but a trap may also be waiting.'),
        eng: () => tekst('Engen er let at krydse og kan graves. Du kan finde lidt guld, en helende rod eller en fakkel, men sjældent en fælde.', 'Meadow is easy to cross and can be dug. You may find a little gold, a healing root or a torch, but rarely a trap.'),
        skov: () => tekst('Skoven gemmer ofte gode helende rødder. Graver du, er der også en lille chance for at finde en livseliksir.', 'Forest often hides strong healing roots. Digging also gives you a small chance to find a life elixir.'),
        bjerg: () => tekst('Bjerge er tunge at krydse for de fleste. Der ligger ofte guld i jorden, men også fælder og enkelte fakler.', 'Mountains are hard to cross for most characters. The ground often holds gold, but also traps and the occasional torch.'),
        hule: () => tekst('Huler er farlige, og fugten kan ødelægge soveposer og fint tøj. Til gengæld kan det, du graver frem, være værdifuldt.', 'Caves are dangerous, and the damp can ruin sleeping bags and fine clothes. In return, what you dig up may be valuable.'),
        ritual: () => tekst('På ritualfelter sker der ofte noget uventet. Du kan også grave efter guld, rødder og livseliksir, men fælderne følger med.', 'Something unexpected often happens on ritual tiles. You can also dig for gold, roots and life elixirs, but traps come with them.'),
        ruin: () => tekst('Ruiner er farlige, men rummer ofte mere guld end åbent land. Grav med omtanke – fælderne er ikke væk.', 'Ruins are dangerous, but often hold more gold than open ground. Dig with care; the traps are still here.'),
        bandit: () => tekst('Der ligger ofte guld omkring en banditlejr. Det gør fælderne også.', 'Gold is often buried around a bandit camp. So are traps.'),
        hoejland: () => tekst('Højlandet er åbent og roligt at krydse. Du kan grave efter guld, rødder og fakler med en mindre risiko for fælder.', 'Highland is open and easy to cross. You can dig for gold, roots and torches with a lower risk of traps.'),
        blodskov: () => tekst('Blodskoven er farlig og fuld af skarpe torne. Under jorden kan du finde guld, rødder og livseliksir – eller en fælde.', 'Bloodwood is dangerous and thick with sharp thorns. Beneath the ground you may find gold, roots and life elixirs, or a trap.'),
        by: () => tekst('En by kan rumme en butik eller et værksted. Har du en dirk, kan du bryde ind i tomme byfelter; med en kølle kan du smadre dem til ruiner.', 'A town may hold a shop or workshop. A lockpick lets you burgle empty town tiles, while a club can smash them into ruins.'),
        hav: () => tekst('Åbent hav skader dig uden en båd. Rustning, kongepanser og fakler går tabt i vandet. Mister du alle HP her, drukner du, medmindre en livseliksir redder dig.', 'Open sea hurts you without a boat. Armor, royal armor and torches are lost in the water. If you lose all HP here, you drown unless a life elixir saves you.'),
        soe: () => tekst('En sø er lige så farlig som havet uden en båd, men tæller ikke som kyst. Sørøvere bruger lidt mindre energi her.', 'A lake is as dangerous as the sea without a boat, but does not count as coast. Sea Raiders spend slightly less energy here.'),
        krystal: () => tekst('Krystalfelter er sjældne og kan ødelægge visse redskaber. Du kan grave små guldfund, fælder eller diamanter frem. Står du her med en stav, afslører den andre krystalfelter i nærheden.', 'Crystal tiles are rare and can destroy certain tools. You may dig up small gold finds, traps or diamonds. If you stand here with a staff, it reveals other crystal tiles nearby.'),
        marked: () => tekst('Et marked kan have en butik, hvor spillerne deles om varerne. En spiller med kølle kan smadre hele feltet til en ruin.', 'A market may have a shop where players share the goods. A player with a club can smash the whole tile into a ruin.'),
        slagmark: () => tekst('Slagmarken er farlig at grave i. Her kan ligge guld, rødder og livseliksir side om side med gamle fælder.', 'The battlefield is dangerous to dig in. Gold, roots and life elixirs may lie beside old traps.'),
        meteor: () => tekst('Meteorstenen varsler en særlig hændelse. Gå ind på feltet for at undersøge den.', 'The meteor stone signals a special encounter. Enter the tile to investigate it.')
    };
    
    let glHp = $state(0);
    let glGuld = $state(0);
    let scoreErGemt = $state(false);
    let scoreGemmer = $state(false);
    let scoreGemningFejlet = $state(false);
    let scoreGemningDeadline = $state<number | null>(null);
    let scoreGemningSekunderTilbage = $state(0);
    let scoreGemningRunId = 0;
    let aktivScoreGemningRunId: number | null = null;
    let nyGlobalRekord = $state(false);
    let harGemtOfflineSpil = $state(false);
    let offlineSpilInfo = $state<ReturnType<typeof hentOfflineSpilInfo>>(null);

    let bgMusik: HTMLAudioElement | null = null;
    
    onMount(() => {
        bgMusik = new Audio('/audio/ambient.mp3');
        bgMusik.loop = true;
        bgMusik.volume = 0.3;
    });

    $effect(() => {
        if (bgMusik) {
            bgMusik.volume = Math.min(0.3, hentLydVolumen());
            if (spilTilstand.musikTaendt && spilTilstand.gameState === 'play') {
                bgMusik.play().catch(() => {});
            } else {
                bgMusik.pause();
                if (spilTilstand.gameState === 'win' || spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'win_map' || spilTilstand.gameState === 'dead_map') {
                    bgMusik.currentTime = 0;
                }
            }
        }
    });

    $effect(() => {
        const niveau = lydKontrol.niveau;
        if (bgMusik) bgMusik.volume = Math.min(0.3, hentLydVolumen());
        void niveau;
    });

    $effect(() => {
        const state = spilTilstand.gameState;
        
        untrack(() => {
            if (state === 'play') {
                scoreErGemt = false;
                scoreGemmer = false;
                scoreGemningFejlet = false;
                scoreGemningDeadline = null;
                scoreGemningSekunderTilbage = 0;
                nyGlobalRekord = false;
                spilTilstand.nyeTrofaeIds = [];
                spilTilstand.nyeMytiskeTrofaeIds = [];
            } else if (
                state === 'win' || state === 'dead' || state === 'win_map' || state === 'dead_map'
            ) {
                opdaterSamletScore();

                if (spilTilstand.gameMode === 'tutorial') {
                    scoreErGemt = true;
                    scoreGemmer = false;
                    scoreGemningFejlet = false;
                    scoreGemningDeadline = null;
                    scoreGemningSekunderTilbage = 0;
                    return;
                }

                if (
                    !scoreErGemt &&
                    !scoreGemmer &&
                    !scoreGemningFejlet
                ) {
                    gemScoreIgen();
                }
            }
        });
    });

    $effect(() => {
        const tjekFokus = () => {
            if (!document.hidden && spilTilstand.gameState === 'play' && spilTilstand.kameraFokus === null) {
                cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
            }
        };
        document.addEventListener('visibilitychange', tjekFokus);
        return () => document.removeEventListener('visibilitychange', tjekFokus);
    });

    $effect(() => {
        const fokus = spilTilstand.kameraFokus;
        if (fokus !== null) {
            untrack(() => {
                const generation = ++kameraTimerGeneration;
                const rundeId = spilTilstand.rundeSeed;
                langsomtKamera = true;
                cam.centrerPåHex(fokus, kortBredde, HEX_W, ROW_H);
                spilTilstand.kameraFokus = null;
                
                setTimeout(() => {
                    if (kameraTimerGeneration !== generation || spilTilstand.rundeSeed !== rundeId) return;
                    if (spilTilstand.gameState === 'play') {
                        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
                        setTimeout(() => {
                            if (kameraTimerGeneration === generation && spilTilstand.rundeSeed === rundeId) {
                                langsomtKamera = false;
                            }
                        }, 1500);
                    } else {
                        langsomtKamera = false;
                    }
                }, 2000);
            });
        }
    });

    $effect(() => {
        const aktueltIndex = spilTilstand.spillerIndex;
        if (spilTilstand.gameState === 'play' && spilTilstand.kameraFokus === null && !langsomtKamera) {
            untrack(() => {
                cam.foelgSpiller(aktueltIndex, kortBredde, HEX_W, ROW_H);
            });
        }
    });

    $effect(() => {
        const kikkertMode = spilTilstand.mitUdstyr?.some(i => i.id === 'kikkert_250')
            ? 'kikkert_250'
            : spilTilstand.mitUdstyr?.some(i => i.id === 'kikkert_45')
                ? 'kikkert_45'
                : '';

        if (kikkertMode === sidsteKikkertMode) return;
        sidsteKikkertMode = kikkertMode;

        if (spilTilstand.gameState !== 'play' || !kikkertMode || langsomtKamera) return;

        untrack(() => {
            const generation = ++kameraTimerGeneration;
            const rundeId = spilTilstand.rundeSeed;
            setTimeout(() => {
                if (kameraTimerGeneration === generation &&
                    spilTilstand.rundeSeed === rundeId &&
                    spilTilstand.gameState === 'play' &&
                    !langsomtKamera) {
                    cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
                }
            }, 0);
        });
    });

    $effect(() => {
        const state = spilTilstand.gameState;
        const dag = spilTilstand.dag;
        const tracker = spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker;
        const target = tracker ? spilTilstand.alleSpillere[tracker.targetNavn] : null;
        const egetIndex = spilTilstand.spillerIndex;
        const spillerMoedeStatus = Object.entries(spilTilstand.alleSpillere)
            .map(([navn, spiller]) => `${navn}:${spiller.index}:${spiller.guld}:${spiller.ikon}`)
            .join('|');
        const targetIndex = target?.index;
        const targetSyn = target?.kendteFelter?.length || 0;
        void dag;
        void egetIndex;
        void spillerMoedeStatus;
        void targetIndex;
        void targetSyn;

        untrack(() => {
            if (state === 'play') {
                opdaterTrackerSyn();
                tjekAutoTracker();
                tjekAutoSpillerMoede();
            }
        });
    });

    $effect(() => {
        const venteAktiv = spilTilstand.venteSpilAktiv;
        const state = spilTilstand.gameState;
        const dag = spilTilstand.dag;
        const ur = venteUrTick;
        const iTaagen = erITågen;
        const taagenNaerVentespil = erTågenTætPåVentespilfelt();
        const spillereStatus = Object.values(spilTilstand.alleSpillere)
            .map((spiller) => `${spiller.dag || 1}:${spiller.sidstAktiv || 0}:${spiller.isDead ? 1 : 0}:${spiller.isWinner ? 1 : 0}:${spiller.rundeSeed || ''}`)
            .join('|');
        void dag;
        void ur;
        void iTaagen;
        void taagenNaerVentespil;
        void spillereStatus;

        if (!venteAktiv || state !== 'play') return;

        untrack(() => {
            if (!spilTilstand.venteStartTid) spilTilstand.venteStartTid = ur;
            const erMidtIRunde = spilTilstand.venteFase === 'spiller' || spilTilstand.venteFase === 'viser_gevinst';
            const langsomsteHarIndhentet = spilTilstand.dag <= hentLangsomsteDag();
            const impensTidErGaaet = erVenteTidUdlobet(ur);
            if (iTaagen || taagenNaerVentespil) {
                const puljeGuld = spilTilstand.ventePuljeGuld;
                const puljeLiv = spilTilstand.ventePuljeLiv;
                lukVenteSpil();
                const aarsag = iTaagen
                    ? tekst('Tågen vælter ind over lejren.', 'The fog rolls into the camp.')
                    : tekst('Tågen kryber tæt på lejren.', 'The fog creeps close to the camp.');
                spilTilstand.logBesked = puljeGuld > 0 || puljeLiv > 0
                    ? tekst(
                        `${aarsag} Impen samler kortene og forsvinder. Du beholder bordets gevinst: ${puljeGuld} guld og ${puljeLiv} HP.`,
                        `${aarsag} The imp gathers the cards and vanishes. You keep the table's reward: ${puljeGuld} gold and ${puljeLiv} HP.`
                    )
                    : tekst(
                        `${aarsag} Impen samler kortene og forsvinder.`,
                        `${aarsag} The imp gathers the cards and vanishes.`
                    );
                return;
            }
            if (!erMidtIRunde && (langsomsteHarIndhentet || impensTidErGaaet)) {
                const puljeGuld = spilTilstand.ventePuljeGuld;
                const puljeLiv = spilTilstand.ventePuljeLiv;
                const aarsag = langsomsteHarIndhentet
                    ? tekst('De andre har indhentet dig.', 'The others have caught up with you.')
                    : tekst('Impen pakker bordet sammen.', 'The imp packs up the table.');
                lukVenteSpil();
                spilTilstand.logBesked = puljeGuld > 0 || puljeLiv > 0
                    ? tekst(
                        `${aarsag} Du beholder bordets gevinst: ${puljeGuld} guld og ${puljeLiv} HP.`,
                        `${aarsag} You keep the table's reward: ${puljeGuld} gold and ${puljeLiv} HP.`
                    )
                    : tekst(
                        `${aarsag} Du kan spille videre.`,
                        `${aarsag} You can keep playing.`
                    );
            }
        });
    });

    $effect(() => {
        const state = spilTilstand.gameState;
        const erSlutkort = state === 'win_map' || state === 'dead_map';

        if (!erSlutkort) {
            ruteOverblikState = '';
            return;
        }

        if (ruteOverblikState === state) return;

        untrack(() => {
            visRuteOverblik();
            ruteOverblikState = state;
        });
    });

    $effect(() => {
        if (spilTilstand.gameState !== 'play') {
            glHp = spilTilstand.livspoint;
            glGuld = spilTilstand.guldTotal;
            return;
        }
        
        if (spilTilstand.livspoint !== glHp) {
            const diff = spilTilstand.livspoint - glHp;
            affyrTal(diff > 0 ? `+${diff}hp` : `${diff}hp`, 'hp');
            glHp = spilTilstand.livspoint;
        }
        
        if (spilTilstand.guldTotal !== glGuld) {
            const diff = spilTilstand.guldTotal - glGuld;
            affyrTal(diff > 0 ? `+${diff}g` : `${diff}g`, 'guld');
            glGuld = spilTilstand.guldTotal;
        }
    });

    let uniktTalId = 0;
    
    function affyrTal(tekst: string, type: string) {
        if (!spilTilstand.aktiveTal) spilTilstand.aktiveTal = [];
        uniktTalId++;
        const id = uniktTalId;
        const feltIndex = spilTilstand.spillerIndex;
        const offsetX = Math.floor(Math.random() * 60) - 30;
        const offsetY = Math.floor(Math.random() * 40) - 20;
        
        spilTilstand.aktiveTal = [...spilTilstand.aktiveTal, { id, tekst, type, feltIndex, offsetX, offsetY }];
        setTimeout(() => {
            spilTilstand.aktiveTal = spilTilstand.aktiveTal.filter(t => t.id !== id);
        }, 3800);
    }

    function hexCenter(index: number) {
        const raekke = Math.floor(index / kortBredde);
        const kolonne = index % kortBredde;
        return {
            x: kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2),
            y: raekke * ROW_H + (ROW_H / 2)
        };
    }

    function rutePunkt(index: number) {
        const raekke = Math.floor(index / kortBredde);
        const kolonne = index % kortBredde;
        return {
            x: kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2),
            y: raekke * ROW_H + 55
        };
    }

    function ruteSegmentNoegle(a: number, b: number) {
        return a < b ? `${a}-${b}` : `${b}-${a}`;
    }

    function bygGamleRuteSegmenter(ruter: number[][] = []) {
        const segmenter = new Map<string, { fraIndex: number; tilIndex: number; antal: number }>();
        for (const rute of ruter) {
            for (let i = 1; i < rute.length; i++) {
                const fraIndex = rute[i - 1];
                const tilIndex = rute[i];
                if (!Number.isInteger(fraIndex) || !Number.isInteger(tilIndex) || fraIndex === tilIndex) continue;
                const noegle = ruteSegmentNoegle(fraIndex, tilIndex);
                const eksisterende = segmenter.get(noegle);
                if (eksisterende) {
                    eksisterende.antal++;
                } else {
                    segmenter.set(noegle, { fraIndex, tilIndex, antal: 1 });
                }
            }
        }

        return Array.from(segmenter.entries()).map(([noegle, segment]) => ({
            noegle,
            antal: segment.antal,
            fra: rutePunkt(segment.fraIndex),
            til: rutePunkt(segment.tilIndex)
        }));
    }

    const gamleRuteSpor = [
        { bredde: 1.1, opacity: 0.3 },
        { bredde: 1.42, opacity: 0.34 },
        { bredde: 1.74, opacity: 0.38 },
        { bredde: 2.07, opacity: 0.42 },
        { bredde: 2.39, opacity: 0.46 },
        { bredde: 2.71, opacity: 0.5 },
        { bredde: 3.03, opacity: 0.54 },
        { bredde: 3.36, opacity: 0.59 },
        { bredde: 3.68, opacity: 0.64 },
        { bredde: 4, opacity: 0.7 }
    ];

    function gammeltRuteSporStil(antal: number) {
        return gamleRuteSpor[Math.min(Math.max(antal, 1), 10) - 1];
    }

    function visRuteOverblik() {
        const rute = spilTilstand.historik?.length > 1
            ? spilTilstand.historik
            : (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.historik || []);

        if (!rute.length) {
            cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
            cam.saetZoom(window.innerWidth <= 700 ? 0.45 : 0.6);
            return;
        }

        const punkter = rute.map(hexCenter);
        const minX = Math.min(...punkter.map(p => p.x));
        const maxX = Math.max(...punkter.map(p => p.x));
        const minY = Math.min(...punkter.map(p => p.y));
        const maxY = Math.max(...punkter.map(p => p.y));

        cam.x = (minX + maxX) / 2;
        cam.y = (minY + maxY) / 2;
        cam.saetZoom(window.innerWidth <= 700 ? 0.42 : 0.58);
    }

    function ruteArkivNoegle(navn = spilTilstand.spillerNavn) {
        return navn.trim().toLowerCase();
    }

    function ruteArkivStorageNoegle(navn = spilTilstand.spillerNavn, rumKode = spilTilstand.rumKode) {
        const oeNoegle = encodeURIComponent((rumKode || '').trim().toLowerCase() || 'oe');
        const spillerNoegle = encodeURIComponent(ruteArkivNoegle(navn) || 'spiller');
        return `${RUTE_ARKIV_STORAGE_PREFIX}:v${KORT_VERSION}:${oeNoegle}:${spillerNoegle}`;
    }

    function rydForaeldedeRuteArkiver() {
        if (!browser) return;
        const alleRuteNoegler: string[] = [];
        const aktuelPrefix = `${RUTE_ARKIV_STORAGE_PREFIX}:v${KORT_VERSION}:`;
        const enhverRutePrefix = `${RUTE_ARKIV_STORAGE_PREFIX}:`;

        for (let i = 0; i < localStorage.length; i++) {
            const noegle = localStorage.key(i);
            if (noegle?.startsWith(enhverRutePrefix) && !noegle.startsWith(aktuelPrefix)) {
                alleRuteNoegler.push(noegle);
            }
        }

        for (const noegle of alleRuteNoegler) localStorage.removeItem(noegle);
    }

    function ruteSignatur(rute: number[]) {
        return rute.join(',');
    }

    function normaliserRute(rute: unknown) {
        if (!Array.isArray(rute)) return [];
        return rute
            .map((index) => Number(index))
            .filter((index) => Number.isInteger(index) && index >= 0);
    }

    function normaliserRuteListe(ruter: unknown) {
        if (!Array.isArray(ruter)) return [];
        return ruter
            .map(normaliserRute)
            .filter((rute) => rute.length > 1);
    }

    function laesGemteRuter(navn = spilTilstand.spillerNavn) {
        if (!browser) return [];
        try {
            return normaliserRuteListe(JSON.parse(localStorage.getItem(ruteArkivStorageNoegle(navn)) || '[]'));
        } catch {
            return [];
        }
    }

    function gemRuteArkiv(navn: string, ruter: number[][]) {
        if (!browser || !navn) return;
        const unikke = samlUnikkeRuter(ruter).slice(-RUTE_ARKIV_MAX_RUNS);
        try {
            localStorage.setItem(ruteArkivStorageNoegle(navn), JSON.stringify(unikke));
        } catch {
            // Hvis browseren blokerer localStorage, virker sessions-ruterne stadig.
        }
    }

    function samlTidligereRuter(spiller?: SpillerData | null) {
        const ruter = [...(spiller?.tidligereHistorik || [])];
        if ((spiller?.historik?.length || 0) > 1) {
            ruter.push(spiller!.historik!);
        }
        return ruter.filter((rute) => rute.length > 1);
    }

    function samlUnikkeRuter(...ruteLister: Array<number[][] | undefined>) {
        const set = new Set<string>();
        const ruter: number[][] = [];

        for (const liste of ruteLister) {
            for (const rute of liste || []) {
                if (rute.length <= 1) continue;
                const signatur = ruteSignatur(rute);
                if (set.has(signatur)) continue;
                set.add(signatur);
                ruter.push(rute);
            }
        }

        return ruter;
    }

    function arkiverRuterForNaesteTur(navn: string, spiller?: SpillerData | null) {
        const noegle = ruteArkivNoegle(navn);
        const ruter = samlUnikkeRuter(laesGemteRuter(navn), ruteArkivForNaesteTur[noegle], samlTidligereRuter(spiller));
        if (ruter.length > 0) {
            ruteArkivForNaesteTur = { ...ruteArkivForNaesteTur, [noegle]: ruter };
            gemRuteArkiv(navn, ruter);
        }
        return ruter;
    }

    function hentArkiveredeRuter(navn = spilTilstand.spillerNavn) {
        return samlUnikkeRuter(laesGemteRuter(navn), ruteArkivForNaesteTur[ruteArkivNoegle(navn)]);
    }

    function arkiverAktuelleRuterForNaesteTur(navn = spilTilstand.spillerNavn) {
        if (!navn) return [];
        const eksisterende = spilTilstand.alleSpillere[navn];
        const spiller = {
            ...(eksisterende || {}),
            historik: spilTilstand.historik?.length > 1 ? spilTilstand.historik : eksisterende?.historik,
            tidligereHistorik: samlUnikkeRuter(hentArkiveredeRuter(navn), eksisterende?.tidligereHistorik)
        } as SpillerData;
        return arkiverRuterForNaesteTur(navn, spiller);
    }

    function genererRundeSeed() {
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
        return `${spilTilstand.rumKode || 'oe'}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
    }

    function startNyRundeSeed() {
        spilTilstand.rundeSeed = genererRundeSeed();
        return spilTilstand.rundeSeed;
    }

    function sikrRundeSeed() {
        if (!spilTilstand.rundeSeed) return startNyRundeSeed();
        return spilTilstand.rundeSeed;
    }

    function nulstilFlygtigRundeState() {
        nulstilUndergrundKlientState();
        nulstilOverlevelseKlientState();
        nulstilVenteSpilKlientState();
        motorLukEvent();
        spilTilstand.aktivShop = null;
        spilTilstand.aktivVaerksted = false;
        spilTilstand.venteSpilAktiv = false;
        spilTilstand.ventePuljeGuld = 0;
        spilTilstand.ventePuljeLiv = 0;
        spilTilstand.venteFase = 'venter';
        spilTilstand.sidsteVenteDag = 0;
        spilTilstand.venteRunde = 0;
        spilTilstand.venteStartTid = 0;
        spilTilstand.venteFriIndtilDag = 0;
        spilTilstand.venteGratisFeltBrugt = null;
        spilTilstand.venteKort = [];
        spilTilstand.aktiveTal = [];
        spilTilstand.aktiveEnergiKugler = [];
        spilTilstand.aktiveEnergiTal = [];
        spilTilstand.kameraFokus = null;
        kameraTimerGeneration++;
        bevaegelsesTimerGeneration++;

        sejlendeBaadIndex = null;
        visDoedsLog = false;
        introAktiv = false;
        flytterNu = false;
        langsomtKamera = false;
        sidstePinchAfstand = 0;
        ruteOverblikState = '';
        preloadedEvents.clear();
        lukInspect();
        cam.nulstil();

        scoreGemningRunId++;
        aktivScoreGemningRunId = null;
        scoreErGemt = false;
        scoreGemmer = false;
        scoreGemningFejlet = false;
        scoreGemningDeadline = null;
        scoreGemningSekunderTilbage = 0;
        nyGlobalRekord = false;

        if (typeof document !== 'undefined') {
            document.body.classList.remove('jordskaelv', 'katastrofe-lys');
        }
    }

    function forberedNyRundeLokalt() {
        annullerVentendeNetvaerkSync();
        nulstilFlygtigRundeState();
        spilTilstand.alleSpillere = {};
        startNyRundeSeed();
        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        spilTilstand.historik = [];
        spilTilstand.logHistorik = [];
        spilTilstand.valgtKarakter = null;
        spilTilstand.maxLivspoint = 100;
        spilTilstand.livspoint = 100;
        spilTilstand.guldTotal = 0;
        spilTilstand.maxKolonne = 0;
        spilTilstand.doedsAarsag = null;
        spilTilstand.nuvaerendeEnergi = 0;
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];
        spilTilstand.mineSkattekortFelter = [];
        spilTilstand.trofaeStats = nulstilTrofaeStats();
        spilTilstand.nyeTrofaeIds = [];
        spilTilstand.nyeMytiskeTrofaeIds = [];
        spilTilstand.samletScore = 0;
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        spilTilstand.sidsteBersaerkDag = 0;
        spilTilstand.harEnergisyn = false;
        nulstilKort();
        spilTilstand.gameState = 'select';
    }

    async function genindlaesSessionEfterTabtReset() {
        const { data, error } = await hentSpilSession(spilTilstand.rumKode);
        if (error || !data || typeof data.runde_id !== 'string') {
            startRealtime(true);
            return false;
        }

        laesSessionDimensioner(data);
        spilTilstand.rundeSeed = data.runde_id;
        spilTilstand.gitter = data.kort || [];
        spilTilstand.alleSpillere = filtrerSpillereTilKanal(
            data.spillere || {},
            realtimeRumNoegle(spilTilstand.rumKode)
        );
        spilTilstand.fogX = data.fog_x || 0;
        spilTilstand.erHost = false;
        startRealtime(true);
        await synkroniserPermanenteGravsten(spilTilstand.rumKode);
        return true;
    }

    let kameraStyle = $derived(`
        transform-origin: ${cam.x}px ${cam.y}px;
        transform: translate(calc(50vw - ${cam.x}px), calc(var(--camera-center-y, 50dvh) - ${cam.y}px)) scale(${cam.zoomLevel});
        transition: ${cam.isDragging ? 'none' : (langsomtKamera ? 'transform 1.5s ease-in-out' : 'transform 0.3s ease-out')};
        width: ${kortPixelBredde(kortBredde)}px;
        height: ${kortPixelHoejde(kortHoejde)}px;
    `);

    let alarmKanal: RealtimeChannel | null = null;
    let preloadedEvents = new SvelteSet<string>();

    $effect(() => {
        if (spilTilstand.gameState !== 'play' || !spilTilstand.mineKendteFelter || !spilTilstand.gitter) return;
        
        for (const indeks of spilTilstand.mineKendteFelter) {
            const felt = spilTilstand.gitter[indeks];
            if (felt && felt.eventID && felt.eventID !== 'campfire' && !preloadedEvents.has(felt.eventID)) {
                preloadedEvents.add(felt.eventID);
                const evt = eventBibliotek[felt.eventID];
                if (evt) {
                    const sti = evt.billede || `/events/ev_${Array.isArray(evt.biome) ? evt.biome[0] : evt.biome}.webp`;
                    const img = new Image();
                    img.src = sti;
                }
            }
        }
    });

    function preloadFiler() {
        const standardBiomer = ['mark', 'eng', 'skov', 'bjerg', 'hule', 'ritual', 'ruin', 'bandit', 'blodskov', 'by', 'hav', 'soe', 'krystal', 'marked', 'slagmark', 'meteor'];
        const billederTilPreload = [
            '/tiles/byshop.webp', '/tiles/markedshop.webp', '/tiles/udgravning.webp', '/tiles/empty_treasure.webp', '/tiles/treasuremark.webp',
            '/tiles/event.png', '/tiles/campfire.webp', '/events/ev_campfire.webp', '/tiles/guldtaage.webp', '/tiles/livtaage.webp',
            '/inventory/hp.webp', '/inventory/guld.webp', '/tiles/player.webp', '/tiles/energi_slukket.webp', '/tiles/energi_taendt.webp', '/tiles/blodofring.webp', '/tiles/baad.webp', '/tiles/gravsted.webp', '/tiles/vaerksted.webp',
            '/tiles/wheat.webp', '/tiles/growingwheat.webp', '/tiles/brokenwheat.webp',
            '/tiles/beans.webp', '/tiles/growingbean.webp', '/tiles/brokenbean.webp', '/tiles/portal.webp', '/tiles/goldmine.webp',
            '/tiles/meteorsten.webp', '/tiles/openlock.webp'
        ];

        standardBiomer.forEach(biome => {
            const tileNavn = biome === 'soe' ? 'hav' : biome;
            billederTilPreload.push(`/tiles/${tileNavn}.webp`);
            billederTilPreload.push(`/tiles/${tileNavn}_taage.webp`);
        });
        Object.values(itemDB).forEach(item => billederTilPreload.push(item.billede));
        tilgaengeligeKarakterer.forEach(karakter => billederTilPreload.push(karakter.ikon));

        billederTilPreload.forEach(sti => {
            const billede = new Image();
            billede.src = sti;
        });
    }

    function lukAktivModalMedEscape() {
        if (document.querySelector('.regelbog-overlay')) return false;

        if (visDoedsLog) {
            visDoedsLog = false;
            return true;
        }

        if (spilTilstand.venteSpilAktiv) {
            lukVenteSpil();
            return true;
        }

        if (spilTilstand.aktivVaerksted || spilTilstand.aktivShop) {
            lukEventOgShop();
            return true;
        }

        if (eventState.aktivt && eventState.erFaerdig) {
            lukEventOgShop();
            return true;
        }

        if (introAktiv) {
            afslutIntro();
            return true;
        }

        if (inspectAktiv || inspectBoble) {
            lukInspect();
            return true;
        }

        if (tutorialState.aktiv && visTutorialPanel) {
            visTutorialPanel = false;
            return true;
        }

        return false;
    }

    function håndterTastatur(ev: KeyboardEvent) {
        if (ev.key === 'Escape' && lukAktivModalMedEscape()) {
            ev.preventDefault();
            return;
        }
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

        if (!ev.repeat && (ev.key === '+' || ev.code === 'NumpadAdd') && spilTilstand.gameState === 'play' && !introAktiv && !spilTilstand.venteSpilAktiv) {
            startInspect();
            ev.preventDefault();
            return;
        }

        if (introAktiv || ev.repeat || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || spilTilstand.gameState !== 'play' || spilTilstand.venteSpilAktiv) return;

        const tast = ev.key.toLowerCase();
        if (tast === 'g') {
            grav();
        }
        else if (tast === 'h') hvil();
        else if (tast === 'f') {
            fokuserPaaSpiller();
        }
        else if (tast === 'q') flytHex('NW');
        else if (tast === 'e') flytHex('NE');
        else if (tast === 'a') flytHex('W');
        else if (tast === 'd') flytHex('E');
        else if (tast === 'z') flytHex('SW');
        else if (tast === 'c') flytHex('SE');
        else if (tast === 'o') udloesOversvoemmelse(spilTilstand.spillerIndex);
        else if (tast === 'j') udloesJordskaelv(spilTilstand.spillerIndex);
        else if (tast === 'm') {
            const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
            if (felt.eventID === 'meteor_skat' && !felt.eventFuldført) {
                startEvent('meteor_skat');
            } else {
                felt.eventID = 'stjernekald';
                felt.eventFuldført = false;
                startEvent('stjernekald');
            }
        }
    }

    function fokuserPaaSpiller() {
        if (introAktiv || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || spilTilstand.gameState !== 'play' || spilTilstand.venteSpilAktiv) return;
        langsomtKamera = false;
        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
    }

    function afslutTutorial() {
        skjulTutorialKnap();
        stopTutorial();
        stopRealtime();
        annullerVentendeNetvaerkSync();
        nulstilFlygtigRundeState();
        motorLukEvent();
        spilTilstand.aktivShop = null;
        spilTilstand.aktivVaerksted = false;
        sejlendeBaadIndex = null;
        introAktiv = false;
        flytterNu = false;
        lukInspect();
        cam.nulstil();

        const dimensioner = vaelgStandardKortDimensioner();
        saetKortDimensioner(dimensioner.bredde, dimensioner.hoejde);

        spilTilstand.gameMode = 'open';
        spilTilstand.offlineMode = false;
        spilTilstand.erHost = false;
        spilTilstand.gameState = 'start';
        spilTilstand.rumKode = '';
        spilTilstand.statusBesked = '';
        spilTilstand.gitter = [];
        spilTilstand.valgtKarakter = null;
        spilTilstand.alleSpillere = {};
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];
        spilTilstand.mineSkattekortFelter = [];
        spilTilstand.historik = [];
        spilTilstand.logHistorik = [];
        spilTilstand.samletScore = 0;
        spilTilstand.doedsAarsag = null;
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        spilTilstand.harEnergisyn = false;
        scoreErGemt = false;
        scoreGemmer = false;
        scoreGemningFejlet = false;
        scoreGemningDeadline = null;
        scoreGemningSekunderTilbage = 0;
    }

    async function genstartBane() {
        if (spilTilstand.gameMode === 'tutorial') {
            afslutTutorial();
            return;
        }

        if (!sikrAktueltResultatLokalt()) {
            alert(tekst(
                'Resultatet kunne ikke gemmes på denne enhed. Bliv på siden, og prøv igen.',
                'The result could not be saved on this device. Stay on this page and try again.'
            ));
            return;
        }

        if (!spilTilstand.offlineMode && !(await flushVentendeGravsten(spilTilstand.rundeSeed))) {
            alert(tekst(
                'Gravstenen er endnu ikke nået frem til øen. Tjek forbindelsen, og prøv igen, før du starter forfra.',
                'The memorial has not reached the island yet. Check the connection and try again before restarting.'
            ));
            return;
        }

        const aktiveSpillere = Object.values(spilTilstand.alleSpillere).filter(erAktivSessionSpiller);

        if (!spilTilstand.offlineMode && aktiveSpillere.length > 0 && spilTilstand.rumKode) {
            alert(tekst(
                'Du kan ikke genstarte øen for alle, mens der stadig er andre aktive spillere ude i tågen.',
                'You cannot restart the island for everyone while other active players are still out in the fog.'
            ));
            return;
        }

        stopRealtime();
        annullerVentendeNetvaerkSync();
        arkiverAktuelleRuterForNaesteTur();
        const gammelRundeId = spilTilstand.rundeSeed;
        forberedNyRundeLokalt();
        if (spilTilstand.offlineMode) {
            await syncTilDb(true);
            return;
        }

        const { error: resetError, count: resetCount } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
            kort: rensKortTilLagring(spilTilstand.gitter),
            start_index: spilTilstand.spillerIndex,
            spillere: {},
            fog_x: 0,
            ...kortSessionMeta()
        }, { count: 'exact' })
            .eq('rum_kode', spilTilstand.rumKode)
            .eq('kort_version', KORT_VERSION)
            .eq('runde_id', gammelRundeId)));

        if (resetError || resetCount !== 1) {
            await genindlaesSessionEfterTabtReset();
            spilTilstand.statusBesked = tekst('Øen kunne ikke gøres klar til et nyt spil. Tjek forbindelsen, og prøv igen.', 'The island could not be prepared for a new game. Check your connection and try again.');
            spilTilstand.gameState = 'start';
            return;
        }

        startRealtime();
    }

    async function opretEllerDeltag() {
        spilTilstand.gameMode = 'open';
        spilTilstand.offlineMode = false;

        if (browser && !navigator.onLine) {
            spilTilstand.statusBesked = tekst('Du er offline. Tryk START for at spille lokalt på denne enhed.', 'You are offline. Press START to play locally on this device.');
            return;
        }

        let rentNavn = (spilTilstand.spillerNavn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = (spilTilstand.rumKode || '').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = tekst('Skriv både dit spillernavn og øens navn.', 'Enter both your player name and island name.');
            return;
        }

        stopRealtime();
        annullerVentendeNetvaerkSync();
        nulstilFlygtigRundeState();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        let mitBrowserId = localStorage.getItem('taage_browser_id');
        if (!mitBrowserId) {
            mitBrowserId = Math.random().toString(36).substring(2);
            localStorage.setItem('taage_browser_id', mitBrowserId);
        }

        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = tekst('Forbinder dig til øen...', 'Connecting to the island...');
        const pendingStart = laesPendingStart();
        const refreshes = pendingStart?.navn === rentNavn && pendingStart.rumKode === renKode ? pendingStart.refreshes : 0;
        gemPendingStart(rentNavn, renKode, refreshes);
        let autoRefreshTimer = planlaegAutoRefreshVedStart(rentNavn, renKode);
        
        const aktivRumKode = renKode;
        const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

        alarmKanal = supabase
            .channel(`room:${aktivKanalNoegle}:events`)
            .on('broadcast', { event: 'alarm' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode || !payload.rundeId || payload.rundeId !== spilTilstand.rundeSeed || spilTilstand.gameState !== 'play') return;
                if (payload.senderNavn === spilTilstand.spillerNavn) return;
                if (spilTilstand.alleSpillere[payload.senderNavn]) {
                    spilTilstand.alleSpillere[payload.senderNavn].activeAlarm = true;
                }
            })
            .on('broadcast', { event: 'baal' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode || !payload.rundeId || payload.rundeId !== spilTilstand.rundeSeed || spilTilstand.gameState !== 'play') return;
                afslørOmraade(payload.centerIndex, payload.radius);
                syncTilDb();
            })
            .on('broadcast', { event: 'syn_signal' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode || !payload.rundeId || payload.rundeId !== spilTilstand.rundeSeed || spilTilstand.gameState !== 'play') return;
                afslørOmraade(payload.centerIndex, payload.radius);
                if (typeof payload.fokusIndex === 'number') {
                    spilTilstand.kameraFokus = payload.fokusIndex;
                }
                syncTilDb();
            })
            .on('broadcast', { event: 'faelles_event' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode || !payload.rundeId || payload.rundeId !== spilTilstand.rundeSeed || spilTilstand.gameState !== 'play') return;
                anvendFaellesEventEffekt(payload);
            })
            .subscribe();

        try {
            const { data: hentetData, error } = await hentSpilSession(spilTilstand.rumKode);
            if (error) {
                console.error("Netværksfejl:", error);
                spilTilstand.statusBesked = tekst('Forbindelsen til øen mislykkedes. Tjek forbindelsen, og prøv igen om lidt.', 'The connection to the island failed. Check your connection and try again in a moment.');
                return;
            }

            let data = hentetData;
            if (data) {
                const serverRundeId = typeof data.runde_id === 'string' ? data.runde_id : '';
                if (!serverRundeId) {
                    spilTilstand.statusBesked = tekst(
                        'Øen mangler den nye rundebeskyttelse. Kør Supabase-migrationen, og prøv igen.',
                        'The island is missing the new round protection. Run the Supabase migration and try again.'
                    );
                    return;
                }
                spilTilstand.rundeSeed = serverRundeId;
            }
            if (data && Number(data.kort_version || 1) !== KORT_VERSION) {
                const gammelKortVersion = Number(data.kort_version || 1);
                if (gammelKortVersion > KORT_VERSION) {
                    spilTilstand.statusBesked = tekst(
                        'Spillet er blevet opdateret. Genindlæs siden for at besøge øen.',
                        'The game has been updated. Reload the page to visit the island.'
                    );
                    return;
                }

                const dimensioner = vaelgStandardKortDimensioner();
                saetKortDimensioner(dimensioner.bredde, dimensioner.hoejde);
                spilTilstand.alleSpillere = {};
                spilTilstand.fogX = 0;
                initialiserGitter(spilTilstand.kortBredde, spilTilstand.kortHoejde);

                const nytKort = spilTilstand.gitter;
                const nytStartIndex = spilTilstand.spillerIndex;
                const { error: versionsError, count } = await medRetry(() => medTimeout(
                    supabase
                        .from('spil_sessioner')
                        .update({
                            kort: rensKortTilLagring(nytKort),
                            start_index: nytStartIndex,
                            spillere: {},
                            fog_x: 0,
                            ...kortSessionMeta()
                        }, { count: 'exact' })
                        .eq('rum_kode', spilTilstand.rumKode)
                        .eq('kort_version', gammelKortVersion)
                        .eq('runde_id', spilTilstand.rundeSeed)
                ));

                if (versionsError) {
                    spilTilstand.statusBesked = tekst(
                        'Øen kunne ikke opdateres til den nye kortversion. Prøv igen om lidt.',
                        'The island could not be updated to the new map version. Try again shortly.'
                    );
                    return;
                }

                if (count === 0) {
                    const { data: samtidigtOpdateret, error: genhentError } = await hentSpilSession(spilTilstand.rumKode);
                    if (genhentError || !samtidigtOpdateret || Number(samtidigtOpdateret.kort_version) !== KORT_VERSION) {
                        spilTilstand.statusBesked = tekst(
                            'Øen blev opdateret fra en anden enhed. Prøv at forbinde igen.',
                            'The island was updated from another device. Try connecting again.'
                        );
                        return;
                    }
                    data = samtidigtOpdateret;
                } else {
                    data = {
                        ...data,
                        kort: rensKortTilLagring(nytKort),
                        start_index: nytStartIndex,
                        spillere: {},
                        fog_x: 0,
                        kort_bredde: spilTilstand.kortBredde,
                        kort_hoejde: spilTilstand.kortHoejde,
                        kort_version: KORT_VERSION
                    };
                }
            }

            if (data) {
                laesSessionDimensioner(data);
                spilTilstand.gitter = data.kort;
                spilTilstand.alleSpillere = filtrerSpillereTilKanal(data.spillere || {}, aktivKanalNoegle);
                spilTilstand.fogX = data.fog_x || 0;
                spilTilstand.erHost = false;

                const sessionKlar = await haandterUdloebneSpillereVedIndgang(rentNavn, mitBrowserId);
                if (!sessionKlar) return;
                
                const fundetNavn = Object.keys(spilTilstand.alleSpillere).find(n => n.toLowerCase() === rentNavn.toLowerCase());

                if (fundetNavn) {
                    const eksisterende = spilTilstand.alleSpillere[fundetNavn];
                    if (eksisterende.rundeSeed) spilTilstand.rundeSeed = eksisterende.rundeSeed;
                    const sammeLogin = !!eksisterende.userId && !!authState.user?.id && eksisterende.userId === authState.user.id;
                    const sammeBrowser = !!eksisterende.browserId && eksisterende.browserId === mitBrowserId;
                    
                    if (!eksisterende.isDead && !eksisterende.isWinner && !sammeLogin && !sammeBrowser) {
                        if (!erAktivSessionSpiller(eksisterende)) {
                            delete spilTilstand.alleSpillere[fundetNavn];
                            spilTilstand.gameState = 'select';
                            spilTilstand.statusBesked = tekst(`Det tidligere spil med navnet '${fundetNavn}' er udløbet. Vælg en karakter for at begynde igen.`, `The previous game named '${fundetNavn}' has expired. Choose a character to begin again.`);
                            startRealtime();
                            return;
                        }

                        spilTilstand.statusBesked = tekst(`Navnet '${fundetNavn}' bruges allerede af en anden rejsende på øen.`, `The name '${fundetNavn}' is already being used by another traveler on the island.`);
                        return;
                    }

                    if (eksisterende.isDead || eksisterende.isWinner) {
                        const spillereArr = Object.values(spilTilstand.alleSpillere);
                        const aktiveSpillere = spillereArr.filter(erAktivSessionSpiller);
                        const maxAktivDag = aktiveSpillere.length > 0 ? Math.max(...aktiveSpillere.map((s: SpillerData) => s.dag || 1)) : 1;

                        if (aktiveSpillere.length > 0 && maxAktivDag > 5) {
                            spilTilstand.statusBesked = tekst(`Du er for sent på den. Tågen har nået kysten (Dag ${maxAktivDag}).`, `You are too late. The fog has reached the coast (Day ${maxAktivDag}).`);
                            return;
                        }

                        let tidligereRuter = samlTidligereRuter(eksisterende);
                        if (aktiveSpillere.length === 0) {
                            tidligereRuter = arkiverRuterForNaesteTur(fundetNavn, eksisterende);
                            const gammelRundeId = spilTilstand.rundeSeed;
                            if (!spilTilstand.offlineMode && !(await flushVentendeGravsten(gammelRundeId))) {
                                spilTilstand.statusBesked = tekst('Dødsfaldet kunne ikke gemmes endnu. Tjek forbindelsen, og prøv igen.', 'The death could not be saved yet. Check the connection and try again.');
                                return;
                            }
                            spilTilstand.erHost = true;
                            annullerVentendeNetvaerkSync();
                            nulstilFlygtigRundeState();
                            spilTilstand.alleSpillere = {};
                            startNyRundeSeed();
                            spilTilstand.fogX = 0;
                            spilTilstand.dag = 1;
                            spilTilstand.historik = [];
                            spilTilstand.logHistorik = [];
                            spilTilstand.venteGratisFeltBrugt = null;
                            spilTilstand.gratisNaesteBevaegelse = false;
                            spilTilstand.gratisBevaegelseKilde = '';
                            spilTilstand.sidsteBersaerkDag = 0;
                            spilTilstand.harEnergisyn = false;
                            spilTilstand.venteSpilAktiv = false;
                            spilTilstand.ventePuljeGuld = 0;
                            spilTilstand.ventePuljeLiv = 0;
                            spilTilstand.venteRunde = 0;
                            spilTilstand.venteStartTid = 0;
                            spilTilstand.venteFriIndtilDag = 0;
                            nulstilKort();

                            const { error: resetError, count: resetCount } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
                                kort: rensKortTilLagring(spilTilstand.gitter),
                                start_index: spilTilstand.spillerIndex,
                                spillere: {},
                                fog_x: 0,
                                ...kortSessionMeta()
                            }, { count: 'exact' })
                                .eq('rum_kode', spilTilstand.rumKode)
                                .eq('kort_version', KORT_VERSION)
                                .eq('runde_id', gammelRundeId)));

                            if (resetError || resetCount !== 1) {
                                await genindlaesSessionEfterTabtReset();
                                spilTilstand.statusBesked = tekst('Øen kunne ikke gøres klar til et nyt spil. Tjek forbindelsen, og prøv igen.', 'The island could not be prepared for a new game. Check your connection and try again.');
                                return;
                            }
                        }

                        spilTilstand.spillerNavn = fundetNavn;
                        spilTilstand.valgtKarakter = null;
                        spilTilstand.maxLivspoint = 100;
                        spilTilstand.livspoint = 100;
                        spilTilstand.guldTotal = 0;
                        spilTilstand.maxKolonne = 0;
                        spilTilstand.dag = 1;
                        spilTilstand.nuvaerendeEnergi = 0;
                        spilTilstand.mitUdstyr = [];
                        spilTilstand.mineKendteFelter = [];
                        spilTilstand.mineSkattekortFelter = [];
                        spilTilstand.historik = [];
                        if (tidligereRuter.length > 0) {
                            spilTilstand.alleSpillere[fundetNavn] = {
                                ...eksisterende,
                                historik: [],
                                tidligereHistorik: tidligereRuter,
                                isDead: true,
                                isWinner: true,
                                sidstAktiv: 0
                            };
                        }
                        spilTilstand.logHistorik = [];
                        spilTilstand.venteGratisFeltBrugt = null;
                        spilTilstand.gratisNaesteBevaegelse = false;
                        spilTilstand.gratisBevaegelseKilde = '';
                        spilTilstand.sidsteBersaerkDag = 0;
                        spilTilstand.harEnergisyn = false;
                        spilTilstand.venteFriIndtilDag = 0;
                        spilTilstand.gameState = 'select';
                        spilTilstand.statusBesked = eksisterende.isWinner
                            ? tekst('Dit forrige spil var afsluttet. Vælg en karakter for at begynde på ny.', 'Your previous run was complete. Choose a character to begin again.')
                            : tekst('Din karakter fra det forrige spil er død. Vælg en ny for at begynde igen.', 'Your character from the previous run is dead. Choose a new one to begin again.');
                        startRealtime();
                        return;
                    }

                    spilTilstand.spillerNavn = fundetNavn;
                    spilTilstand.spillerIndex = eksisterende.index;
                    
                    spilTilstand.maxLivspoint = eksisterende.maxHp || 100;
                    spilTilstand.livspoint = eksisterende.hp;
                    
                    spilTilstand.guldTotal = eksisterende.guld;
                    spilTilstand.maxKolonne = eksisterende.kolonne;
                    spilTilstand.dag = eksisterende.dag || 1;
                    spilTilstand.retning = eksisterende.retning || 'S';
                    spilTilstand.valgtKarakter = tilgaengeligeKarakterer.find((k) => k.ikon === eksisterende.ikon) || null;
                    spilTilstand.nuvaerendeEnergi = eksisterende.energi ?? (spilTilstand.valgtKarakter?.baseEnergi || 0);
                    spilTilstand.mitUdstyr = eksisterende.mitUdstyr || [];
                    spilTilstand.mineKendteFelter = eksisterende.kendteFelter || [];
                    spilTilstand.mineSkattekortFelter = eksisterende.skattekortFelter || [];
                    spilTilstand.historik = eksisterende.historik || [];
                    spilTilstand.venteGratisFeltBrugt = null;
                    spilTilstand.gratisNaesteBevaegelse = eksisterende.gratisNaesteBevaegelse ?? false;
                    spilTilstand.gratisBevaegelseKilde = eksisterende.gratisBevaegelseKilde ?? '';
                    spilTilstand.sidsteBersaerkDag = eksisterende.sidsteBersaerkDag ?? 0;
                    spilTilstand.harEnergisyn = eksisterende.harEnergisyn ?? false;
                    spilTilstand.venteFriIndtilDag = eksisterende.venteFriIndtilDag ?? 0;

                    afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
                    startRealtime();
                    
                    if (eksisterende.isDead || eksisterende.isWinner) {
                        spilTilstand.gameState = eksisterende.isWinner ? 'win_map' : 'dead_map';
                        spilTilstand.statusBesked = eksisterende.isWinner ? tekst('Du slap væk fra øen.', 'You escaped the island.') : tekst('Du døde i tågen.', 'You died in the fog.');
                    } else {
                        spilTilstand.gameState = 'play';
                        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
                    }
                } else {
                    const aktivSammeBruger = findAktivSpillerForBruger();
                    if (aktivSammeBruger) {
                        spilTilstand.statusBesked = tekst(`Du spiller allerede på denne ø som ${aktivSammeBruger.navn}. Log ud eller afslut den karakter først.`, `You are already playing on this island as ${aktivSammeBruger.navn}. Log out or finish that character first.`);
                        return;
                    }

                    const spillereArr = Object.values(spilTilstand.alleSpillere);
                    const aktiveSpillere = spillereArr.filter(erAktivSessionSpiller);
                    const maxAktivDag = aktiveSpillere.length > 0 ? Math.max(...aktiveSpillere.map((s: SpillerData) => s.dag || 1)) : 1;
                    const maxDag = maxAktivDag;

                    if (maxAktivDag > 5) {
                        spilTilstand.statusBesked = tekst(`Du er for sent på den. Tågen har nået kysten (Dag ${maxDag}).`, `You are too late. The fog has reached the coast (Day ${maxDag}).`);
                        return;
                    }

                    if (spillereArr.length > 0 && aktiveSpillere.length === 0) {
                        const gammelRundeId = spilTilstand.rundeSeed;
                        if (!spilTilstand.offlineMode && !(await flushVentendeGravsten(gammelRundeId))) {
                            spilTilstand.statusBesked = tekst('Dødsfaldet kunne ikke gemmes endnu. Tjek forbindelsen, og prøv igen.', 'The death could not be saved yet. Check the connection and try again.');
                            return;
                        }
                        spilTilstand.erHost = true;
                        annullerVentendeNetvaerkSync();
                        nulstilFlygtigRundeState();
                        spilTilstand.alleSpillere = {};
                        startNyRundeSeed();
                        spilTilstand.fogX = 0;
                        spilTilstand.dag = 1;
                        spilTilstand.historik = [];
                        spilTilstand.logHistorik = [];
                        spilTilstand.venteGratisFeltBrugt = null;
                        spilTilstand.gratisNaesteBevaegelse = false;
                        spilTilstand.gratisBevaegelseKilde = '';
                        spilTilstand.sidsteBersaerkDag = 0;
                        spilTilstand.harEnergisyn = false;
                        spilTilstand.venteSpilAktiv = false;
                        spilTilstand.ventePuljeGuld = 0;
                        spilTilstand.ventePuljeLiv = 0;
                        spilTilstand.venteRunde = 0;
                        spilTilstand.venteStartTid = 0;
                        spilTilstand.venteFriIndtilDag = 0;
                        nulstilKort();

                        const { error: resetError, count: resetCount } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
                            kort: rensKortTilLagring(spilTilstand.gitter),
                            start_index: spilTilstand.spillerIndex,
                            spillere: {},
                            fog_x: 0,
                            ...kortSessionMeta()
                        }, { count: 'exact' })
                            .eq('rum_kode', spilTilstand.rumKode)
                            .eq('kort_version', KORT_VERSION)
                            .eq('runde_id', gammelRundeId)));

                        if (resetError || resetCount !== 1) {
                            await genindlaesSessionEfterTabtReset();
                            spilTilstand.statusBesked = tekst('Øen kunne ikke gøres klar til et nyt spil. Tjek forbindelsen, og prøv igen.', 'The island could not be prepared for a new game. Check your connection and try again.');
                            return;
                        }
                    }

                    spilTilstand.gameState = 'select';
                    startRealtime();
                }
            } else {
                spilTilstand.erHost = true;
                spilTilstand.alleSpillere = {};
                startNyRundeSeed();
                spilTilstand.fogX = 0;
                spilTilstand.dag = 1;
                spilTilstand.historik = [];
                spilTilstand.logHistorik = [];
                spilTilstand.venteGratisFeltBrugt = null;
                spilTilstand.venteSpilAktiv = false;
                spilTilstand.ventePuljeGuld = 0;
                spilTilstand.ventePuljeLiv = 0;
                spilTilstand.venteRunde = 0;
                spilTilstand.venteStartTid = 0;
                spilTilstand.venteFriIndtilDag = 0;
                if (!erLocalhost()) {
                    const dimensioner = vaelgStandardKortDimensioner();
                    saetKortDimensioner(dimensioner.bredde, dimensioner.hoejde);
                }
                initialiserGitter(spilTilstand.kortBredde, spilTilstand.kortHoejde);
                const { error: insertError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: rensKortTilLagring(spilTilstand.gitter),
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0,
                    ...kortSessionMeta()
                }])));

                if (insertError) {
                    const { data: eksisterendeSession, error: hentEfterInsertError } = await hentSpilSession(spilTilstand.rumKode);

                    if (hentEfterInsertError || !eksisterendeSession) {
                        spilTilstand.statusBesked = tekst('Øen kunne ikke oprettes. Tjek forbindelsen, og prøv igen om lidt.', 'The island could not be created. Check your connection and try again in a moment.');
                        spilTilstand.gameState = 'start';
                        return;
                    }

                    if (typeof eksisterendeSession.runde_id !== 'string') {
                        spilTilstand.statusBesked = tekst('Øen mangler rundebeskyttelse. Kør Supabase-migrationen, og prøv igen.', 'The island is missing round protection. Run the Supabase migration and try again.');
                        spilTilstand.gameState = 'start';
                        return;
                    }
                    laesSessionDimensioner(eksisterendeSession);
                    spilTilstand.rundeSeed = eksisterendeSession.runde_id;
                    spilTilstand.gitter = eksisterendeSession.kort;
                    spilTilstand.alleSpillere = filtrerSpillereTilKanal(eksisterendeSession.spillere || {}, aktivKanalNoegle);
                    spilTilstand.fogX = eksisterendeSession.fog_x || 0;
                    spilTilstand.erHost = false;
                }

                startRealtime();
                spilTilstand.gameState = 'select';
            }
        } catch (err) {
            console.error("Motorfejl:", err);
            spilTilstand.statusBesked = err instanceof Error && err.message === 'timeout'
                ? tekst('Forbindelsen til øen tog for lang tid. Prøv igen.', 'The connection to the island took too long. Try again.')
                : tekst('Der opstod en fejl under forbindelsen.', 'An error occurred while connecting.');
        } finally {
            if (autoRefreshTimer !== null) {
                window.clearTimeout(autoRefreshTimer);
                autoRefreshTimer = null;
            }
            if (spilTilstand.gameState !== 'start' || !erForbindelsesStatus()) {
                rydPendingStart();
            }
        }
    }

    async function startOfflineSpil() {
        const rentNavn = (spilTilstand.spillerNavn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        const renKode = (spilTilstand.rumKode || '').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = tekst('Skriv både dit spillernavn og øens navn.', 'Enter both your player name and island name.');
            return;
        }

        stopRealtime();
        annullerVentendeNetvaerkSync();
        nulstilFlygtigRundeState();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        spilTilstand.offlineMode = true;
        spilTilstand.gameMode = 'offline';
        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = tekst('Offline. Spillet gemmes lokalt på denne enhed.', 'Offline. The game is saved locally on this device.');
        spilTilstand.erHost = true;
        spilTilstand.alleSpillere = {};
        startNyRundeSeed();
        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        spilTilstand.historik = [];
        spilTilstand.logHistorik = [];
        spilTilstand.samletScore = 0;
        spilTilstand.doedsAarsag = null;
        spilTilstand.trofaeStats = nulstilTrofaeStats();
        spilTilstand.nyeTrofaeIds = [];
        spilTilstand.nyeMytiskeTrofaeIds = [];
        spilTilstand.harEnergisyn = false;
        scoreErGemt = false;
        nyGlobalRekord = false;
        initialiserGitter(spilTilstand.kortBredde, spilTilstand.kortHoejde);
        spilTilstand.gitter = fletOfflineGravstenIGitter(spilTilstand.rumKode, spilTilstand.gitter);
        spilTilstand.gameState = 'select';
        await syncTilDb(true);
    }

    function startTutorialSpil() {
        stopRealtime();
        annullerVentendeNetvaerkSync();
        nulstilFlygtigRundeState();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }
        motorLukEvent();
        spilTilstand.aktivShop = null;
        spilTilstand.aktivVaerksted = false;
        sejlendeBaadIndex = null;
        visDoedsLog = false;
        visTutorialPanel = true;
        introAktiv = false;
        flytterNu = false;
        lukInspect();
        cam.nulstil();

        nulstilTutorialState(true);
        saetKortDimensioner(TUTORIAL_BREDDE, TUTORIAL_HOEJDE);
        startNyRundeSeed();

        const navn = TUTORIAL_SPILLERNAVN;

        spilTilstand.offlineMode = true;
        spilTilstand.gameMode = 'tutorial';
        spilTilstand.spillerNavn = navn;
        spilTilstand.rumKode = TUTORIAL_RUMKODE;
        spilTilstand.statusBesked = tekst('Tutorialen foregår kun på denne enhed og tæller ikke med på toplisten.', 'The tutorial stays on this device and does not count toward the leaderboard.');
        spilTilstand.erHost = true;
        spilTilstand.gitter = lavTutorialGitter();
        spilTilstand.spillerIndex = TUTORIAL_START_INDEX;
        spilTilstand.valgtKarakter = tutorialKarakter;
        spilTilstand.maxLivspoint = tutorialKarakter.startHp;
        spilTilstand.livspoint = tutorialKarakter.startHp;
        spilTilstand.guldTotal = tutorialKarakter.startGuld;
        spilTilstand.nuvaerendeEnergi = tutorialKarakter.baseEnergi;
        spilTilstand.dag = 1;
        spilTilstand.retning = 'S';
        spilTilstand.maxKolonne = TUTORIAL_START_INDEX % TUTORIAL_BREDDE;
        spilTilstand.fogX = 0;
        spilTilstand.doedsAarsag = null;
        spilTilstand.samletScore = 0;
        spilTilstand.logHistorik = [];
        spilTilstand.historik = [TUTORIAL_START_INDEX];
        spilTilstand.mineKendteFelter = [];
        spilTilstand.mineSkattekortFelter = [];
        spilTilstand.trofaeStats = nulstilTrofaeStats();
        spilTilstand.nyeTrofaeIds = [];
        spilTilstand.nyeMytiskeTrofaeIds = [];
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        spilTilstand.sidsteBersaerkDag = 0;
        spilTilstand.harEnergisyn = false;
        spilTilstand.venteSpilAktiv = false;
        spilTilstand.venteGratisFeltBrugt = null;
        spilTilstand.venteFriIndtilDag = 0;
        spilTilstand.erBevidstløs = false;
        spilTilstand.aktiveTal = [];
        spilTilstand.aktiveEnergiKugler = [];
        spilTilstand.aktiveEnergiTal = [];
        spilTilstand.mitUdstyr = [
            { id: 'skovl', maengde: 1, anskaffetDag: 1 },
            { id: 'mad', maengde: 2, anskaffetDag: 1 },
            { id: 'sovepose', maengde: 1, anskaffetDag: 1 }
        ];

        const spillerData: SpillerData = {
            index: TUTORIAL_START_INDEX,
            kolonne: TUTORIAL_START_INDEX % TUTORIAL_BREDDE,
            hp: spilTilstand.livspoint,
            maxHp: spilTilstand.maxLivspoint,
            guld: spilTilstand.guldTotal,
            isDead: false,
            isWinner: false,
            deathCause: null,
            escapeIndex: null,
            escapeIcon: null,
            score: 0,
            ikon: tutorialKarakter.ikon,
            mitUdstyr: spilTilstand.mitUdstyr,
            kendteFelter: [],
            historik: [...spilTilstand.historik],
            energi: spilTilstand.nuvaerendeEnergi,
            turNummer: 0,
            rundeSeed: spilTilstand.rundeSeed,
            dag: spilTilstand.dag,
            sidstAktiv: Date.now(),
            retning: spilTilstand.retning,
            besoegteMiner: [],
            rumKode: TUTORIAL_RUMKODE
        };
        spilTilstand.alleSpillere = { [navn]: spillerData };

        afslørOmraade(TUTORIAL_START_INDEX, tutorialKarakter.synsRadius);
        spilTilstand.alleSpillere[navn].kendteFelter = [...spilTilstand.mineKendteFelter];
        spilTilstand.logBesked = tekst('Du er gået i land på tutorial-øen.', 'You have landed on the tutorial island.');
        scoreErGemt = true;
        scoreGemmer = false;
        scoreGemningFejlet = false;
        scoreGemningDeadline = null;
        scoreGemningSekunderTilbage = 0;
        nyGlobalRekord = false;
        spilTilstand.gameState = 'play';

        const kameraGeneration = ++kameraTimerGeneration;
        const tutorialRundeId = spilTilstand.rundeSeed;
        window.setTimeout(() => {
            if (kameraTimerGeneration === kameraGeneration &&
                spilTilstand.rundeSeed === tutorialRundeId &&
                spilTilstand.gameMode === 'tutorial') {
                cam.centrerPåHex(TUTORIAL_START_INDEX, TUTORIAL_BREDDE, HEX_W, ROW_H);
            }
        }, 0);
    }

    function fortsaetOfflineSpil() {
        annullerVentendeNetvaerkSync();
        nulstilFlygtigRundeState();
        if (!indlaesOfflineSpil()) {
            spilTilstand.statusBesked = tekst('Der blev ikke fundet et offline-spil.', 'No offline game was found.');
            harGemtOfflineSpil = false;
            offlineSpilInfo = null;
            return;
        }
        spilTilstand.gameMode = 'offline';

        stopRealtime();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        harGemtOfflineSpil = true;
        offlineSpilInfo = hentOfflineSpilInfo();
        if (spilTilstand.gameState === 'play') {
            cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
        }
        if (spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map') {
            scoreErGemt = true;
        }
    }

    function nulstilHukommelse() {
        if (!sikrAktueltResultatLokalt()) {
            scoreGemningFejlet = true;
            spilTilstand.statusBesked = tekst(
                'Resultatet kunne ikke gemmes på denne enhed. Siden er ikke blevet genindlæst.',
                'The result could not be saved on this device. The page was not reloaded.'
            );
            return;
        }
        arkiverAktuelleRuterForNaesteTur();
        if (spilTilstand.offlineMode) {
            sletOfflineSpil();
            harGemtOfflineSpil = false;
            offlineSpilInfo = null;
        }
        if (browser) window.location.reload();
    }

    onMount(() => {
        initSprog();
        initAuth();
        preloadFiler();
        rydForaeldedeRuteArkiver();
        let genopretterForbindelse = false;
        let sidstGenopfrisketVedFokus = 0;
        const pendingStart = laesPendingStart();
        if (pendingStart && pendingStart.refreshes > 0 && Date.now() - pendingStart.startet < 2 * 60 * 1000) {
            spilTilstand.spillerNavn = pendingStart.navn;
            spilTilstand.rumKode = pendingStart.rumKode;
            spilTilstand.statusBesked = tekst('Forbindelsen gik i stå. Genindlæser og prøver igen...', 'The connection stalled. Reloading and trying again...');
            window.setTimeout(() => {
                if (spilTilstand.gameState === 'start') void opretEllerDeltag();
            }, 350);
        } else if (pendingStart) {
            rydPendingStart();
        }

        const sekundTimer = window.setInterval(() => {
            if (spilTilstand.venteSpilAktiv) venteUrTick = Date.now();
            if (scoreGemmer && scoreGemningDeadline !== null) {
                scoreGemningSekunderTilbage = Math.max(1, Math.ceil((scoreGemningDeadline - Date.now()) / 1000));
            }
        }, 1000);

        const erAktivtOnlinespil = () => spilTilstand.gameState === 'play' && !spilTilstand.offlineMode;
        const harOnlineSession = () => {
            if (spilTilstand.offlineMode || !spilTilstand.rumKode || !spilTilstand.spillerNavn) return false;
            return ['play', 'win', 'win_map', 'dead', 'dead_map'].includes(spilTilstand.gameState);
        };

        const heartbeat = async () => {
            if (spilTilstand.offlineMode && spilTilstand.gameState === 'play') {
                await flushVentendeSync();
                return;
            }

            if (!harOnlineSession()) return;

            if (browser && !navigator.onLine) {
                spilTilstand.statusBesked = tekst('Forbindelsen er afbrudt. Spillet fortsætter lokalt indtil videre.', 'The connection is offline. The game continues locally for now.');
                return;
            }

            if (erAktivtOnlinespil()) {
                startRealtime();
                await syncTilDb(false);
                const gemt = await flushVentendeSync();
                if (!gemt) {
                    spilTilstand.statusBesked = spilTilstand.statusBesked || tekst('Forbindelsen til øen er ustabil. Spillet prøver igen.', 'The connection to the island is unstable. The game is trying again.');
                }
            } else {
                startRealtime(true);
            }
        };

        const genopretForbindelse = async () => {
            if (genopretterForbindelse) return;

            if (spilTilstand.offlineMode) {
                await flushVentendeSync();
                return;
            }

            if (!harOnlineSession()) return;

            genopretterForbindelse = true;
            try {
                stopRealtime();
                startRealtime();
                await heartbeat();
            } finally {
                genopretterForbindelse = false;
            }
        };

        const genopfriskListerEfterReconnect = async () => {
            if (spilTilstand.offlineMode) {
                lokaleScores = await hentHighscores();
                return;
            }

            if (authState.user?.id) {
                void retryVentendeSupabaseTrofaeer(authState.user.id);
            }
            const gemteVentende = authState.user?.id ? await retryVentendeHighscores() : 0;
            if (gemteVentende > 0) {
                scoreErGemt = true;
                scoreGemningFejlet = false;
                spilTilstand.statusBesked = gemteVentende === 1
                    ? tekst('En score, der ventede på forbindelse, er nu sendt til toplisten.', 'A score that was waiting for a connection has now been sent to the leaderboard.')
                    : tekst(`${gemteVentende} scores, der ventede på forbindelse, er nu sendt til toplisten.`, `${gemteVentende} scores that were waiting for a connection have now been sent to the leaderboard.`);
            }

            const klasse = aktuelHighscoreKlasse();
            const [nyeLokaleScores, nyeGlobaleScores, nyeUgensGlobaleScores, nyeKlasseScores] = await Promise.all([
                hentHighscores(),
                hentGlobalTopHundrede(),
                hentGlobalTopHundredeIUgen(),
                klasse ? hentGlobalTopHundrede(klasse) : Promise.resolve([])
            ]);
            lokaleScores = nyeLokaleScores;
            globaleScores = nyeGlobaleScores;
            ugensGlobaleScores = nyeUgensGlobaleScores;
            klasseScores = nyeKlasseScores;
        };

        const genopfriskEfterFokus = async () => {
            const nu = Date.now();
            if (nu - sidstGenopfrisketVedFokus < 2500) return;
            sidstGenopfrisketVedFokus = nu;

            await genopretForbindelse();
            if (browser && !navigator.onLine) return;
            await genopfriskListerEfterReconnect();
        };

        const gemHvisSidenForsvinder = () => {
            if (['win', 'win_map', 'dead', 'dead_map'].includes(spilTilstand.gameState)) {
                sikrAktueltResultatLokalt();
            }
            void flushVentendeSync();
        };
        const gemHvisSkjult = () => {
            if (document.hidden) {
                gemHvisSidenForsvinder();
            } else {
                void genopfriskEfterFokus();
            }
        };
        const haandterOnline = () => {
            if (authState.user?.id) void retryVentendeSupabaseTrofaeer(authState.user.id);
            void genopfriskEfterFokus();
        };
        const haandterOffline = () => {
            if (harOnlineSession()) {
                spilTilstand.statusBesked = tekst('Forbindelsen er afbrudt. Spillet fortsætter lokalt indtil videre.', 'The connection is offline. The game continues locally for now.');
            }
        };

        const heartbeatTimer = window.setInterval(() => {
            void heartbeat();
        }, 30 * 1000);

        document.addEventListener('visibilitychange', gemHvisSkjult);
        window.addEventListener('focus', haandterOnline);
        window.addEventListener('online', haandterOnline);
        window.addEventListener('offline', haandterOffline);
        window.addEventListener('pagehide', gemHvisSidenForsvinder);
        window.addEventListener('beforeunload', gemHvisSidenForsvinder);

        (async () => {
            harGemtOfflineSpil = harOfflineSpil();
            offlineSpilInfo = hentOfflineSpilInfo();
            lokaleScores = await hentHighscores();
            globaleScores = await hentGlobalTopHundrede();
            ugensGlobaleScores = await hentGlobalTopHundredeIUgen();
        })();

        return () => {
            window.clearInterval(sekundTimer);
            window.clearInterval(heartbeatTimer);
            document.removeEventListener('visibilitychange', gemHvisSkjult);
            window.removeEventListener('focus', haandterOnline);
            window.removeEventListener('online', haandterOnline);
            window.removeEventListener('offline', haandterOffline);
            window.removeEventListener('pagehide', gemHvisSidenForsvinder);
            window.removeEventListener('beforeunload', gemHvisSidenForsvinder);
        };
    });

    $effect(() => {
        const profilNavn = authState.profil?.display_name;
        if (spilTilstand.gameState === 'start' && profilNavn && profilNavn !== sidstAutoUdfyldtProfilNavn) {
            spilTilstand.spillerNavn = profilNavn;
            sidstAutoUdfyldtProfilNavn = profilNavn;
        }
    });

    $effect(() => {
        if (spilTilstand.offlineMode) return;
        const brugerId = authState.user?.id;
        if (brugerId) {
            (async () => {
                void retryVentendeSupabaseTrofaeer(brugerId);
                const gemteVentende = await retryVentendeHighscores();
                if (gemteVentende > 0) {
                    scoreErGemt = true;
                    scoreGemningFejlet = false;
                    spilTilstand.statusBesked = gemteVentende === 1
                        ? tekst('En score, der ventede på forbindelse, er nu sendt til toplisten.', 'A score that was waiting for a connection has now been sent to the leaderboard.')
                        : tekst(`${gemteVentende} scores, der ventede på forbindelse, er nu sendt til toplisten.`, `${gemteVentende} scores that were waiting for a connection have now been sent to the leaderboard.`);
                }
                const klasse = aktuelHighscoreKlasse();
                globaleScores = await hentGlobalTopHundrede();
                ugensGlobaleScores = await hentGlobalTopHundredeIUgen();
                klasseScores = klasse ? await hentGlobalTopHundrede(klasse) : [];
                lokaleScores = await hentHighscores();
            })();
        }
    });

    onDestroy(() => {
        void flushVentendeSync();
        stopRealtime();
        if (alarmKanal) supabase.removeChannel(alarmKanal);
    });

    function opdaterSamletScore() {
        const erVinder =
            spilTilstand.gameState === 'win' ||
            spilTilstand.gameState === 'win_map' ||
            !!spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isWinner;
        const slutSalg = beskrivSlutSalg(spilTilstand.mitUdstyr);

        if (slutSalg.tekst && !spilTilstand.logHistorik.some((linje) =>
            linje.includes('Dit resterende udstyr og dine diamanter omregnes') ||
            linje.includes('Your remaining equipment and diamonds are converted')
        )) {
            spilTilstand.logBesked = slutSalg.tekst;
        }

        spilTilstand.samletScore = beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, spilTilstand.spillerNavn, {
            guld: spilTilstand.guldTotal,
            hp: spilTilstand.livspoint,
            kolonne: spilTilstand.maxKolonne,
            kendteFelter: spilTilstand.mineKendteFelter,
            mitUdstyr: spilTilstand.mitUdstyr,
            isWinner: erVinder
        }, erVinder, spilTilstand.kortBredde, spilTilstand.kortHoejde);
    }

    function opdaterLokaleTrofaeer() {
        spilTilstand.nyeTrofaeIds = [];
        spilTilstand.nyeMytiskeTrofaeIds = [];

        const ownerKey = lavTrofaeOwnerKey(authState.user?.id, spilTilstand.spillerNavn);
        const gemteIds = authState.user?.id
            ? normaliserTrofaeIds(authState.profil?.trophies || [])
            : normaliserTrofaeIds([
                ...hentGemteTrofaeIds(ownerKey),
                ...(authState.profil?.trophies || [])
            ]);
        const gemteMytiskeIds = authState.user?.id
            ? normaliserTrofaeIds(authState.profil?.mythic_trophies || [])
            : normaliserTrofaeIds([
                ...hentGemteMytiskeTrofaeIds(ownerKey),
                ...(authState.profil?.mythic_trophies || [])
            ]);
        const nyeTrofaeer = findNyeTrofaeer(gemteIds);
        const nyeIds = nyeTrofaeer.map((trofae) => trofae.id);
        const samledeIds = normaliserTrofaeIds([...gemteIds, ...nyeIds]);
        const nyeMytiskeTrofaeer = findNyeMytiskeTrofaeer(gemteMytiskeIds, samledeIds);
        const nyeMytiskeIds = nyeMytiskeTrofaeer.map((trofae) => trofae.id);
        const samledeMytiskeIds = normaliserTrofaeIds([...gemteMytiskeIds, ...nyeMytiskeIds]);

        if (nyeIds.length > 0 || nyeMytiskeIds.length > 0) {
            gemTrofaeIds(ownerKey, samledeIds);
            gemMytiskeTrofaeIds(ownerKey, samledeMytiskeIds);
            if (authState.user?.id) {
                huskVentendeSupabaseTrofaeer(authState.user.id, samledeIds, nyeIds);
                huskVentendeSupabaseMytiskeTrofaeer(authState.user.id, samledeMytiskeIds, nyeMytiskeIds);
                void retryVentendeSupabaseTrofaeer(authState.user.id);
                void retryVentendeSupabaseMytiskeTrofaeer(authState.user.id);
            }
            if (authState.profil) {
                authState.profil = { ...authState.profil, trophies: samledeIds, mythic_trophies: samledeMytiskeIds };
            }
            spilTilstand.nyeTrofaeIds = nyeIds;
            spilTilstand.nyeMytiskeTrofaeIds = nyeMytiskeIds;
            return;
        }
    }

    type ScoreGemningToken = { id: number; rundeId: string };

    function erAktuelScoreGemning(token: ScoreGemningToken) {
        return scoreGemningRunId === token.id && spilTilstand.rundeSeed === token.rundeId;
    }

    async function gemNyeTrofaeAwardsForHighscore(highscoreGemt: boolean, token: ScoreGemningToken) {
        const brugerId = authState.user?.id;
        if (!erAktuelScoreGemning(token) || !highscoreGemt || !brugerId || spilTilstand.offlineMode) return;

        const nyeIds = normaliserTrofaeIds(spilTilstand.nyeTrofaeIds || []);
        const nyeMytiskeIds = normaliserTrofaeIds(spilTilstand.nyeMytiskeTrofaeIds || []);
        if (nyeIds.length === 0 && nyeMytiskeIds.length === 0) return;

        // Alt award-indhold fryses før første await. Så kan en afsluttet rundes
        // trofæ stadig knyttes til dens eget resultat, selv hvis spilleren når
        // videre til en ny runde, mens Supabase svarer.
        const ownerKey = lavTrofaeOwnerKey(brugerId, spilTilstand.spillerNavn);
        const awardedAt = new Date().toISOString();
        const awardGrundlag = [
            ...nyeIds.map((id) => ({
                id,
                tier: 'normal' as const,
                awardedAt,
                awardData: lavTrofaeAwardData(id)
            })),
            ...nyeMytiskeIds.map((id) => ({
                id,
                tier: 'mythic' as const,
                awardedAt,
                awardData: lavTrofaeAwardData(id)
            }))
        ];

        const gameResultId = await medTimeout(hentAktueltHighscoreResultatId(), 10000).catch((error) => {
            console.warn('Kunne ikke finde highscore-id til trofae-award', error);
            return null;
        });
        if (!gameResultId) return;

        const eksisterendeAwards = hentGemteTrofaeAwards(ownerKey);
        const nyeAwards = awardGrundlag.map((award) => ({ ...award, gameResultId }));
        const samledeAwards = normaliserTrofaeAwards([...eksisterendeAwards, ...nyeAwards]);
        gemTrofaeAwards(ownerKey, samledeAwards);
        void gemSupabaseTrofaeAwards(brugerId, nyeAwards);
    }

    async function opdaterScoreTavlerEfterGemning(
        highscoreGemt: boolean,
        afslutningGemt: boolean,
        token: ScoreGemningToken
    ) {
        const klasse = aktuelHighscoreKlasse();
        const afsluttetScore = spilTilstand.samletScore;
        const highscoreNavn = authState.profil?.display_name || spilTilstand.spillerNavn;
        const oeNavn = spilTilstand.rumKode;
        const karakterNavn = spilTilstand.valgtKarakter?.navn;
        const offlineMode = spilTilstand.gameMode === 'offline';

        try {
            await gemNyeTrofaeAwardsForHighscore(highscoreGemt, token);
            if (!erAktuelScoreGemning(token)) return;

            if (highscoreGemt && !afslutningGemt) {
                await medTimeout(gemAfsluttetSpillerISession(), 15000).catch((error) => {
                    console.warn('Kunne ikke eftergemme oe-session efter score', error);
                    return false;
                });
                if (!erAktuelScoreGemning(token)) return;
            }

            nyGlobalRekord = false;

            const nyeLokaleScores = await medTimeout(hentHighscores(), 10000).catch((error) => {
                console.warn('Kunne ikke genhente lokale highscores efter score', error);
                return lokaleScores;
            });
            if (!erAktuelScoreGemning(token)) return;
            lokaleScores = nyeLokaleScores;

            if (offlineMode) return;

            const [nyeKlasseScores, nyeGlobaleScores, nyeUgensGlobaleScores] = await medTimeout(
                Promise.all([
                    klasse ? hentGlobalTopHundrede(klasse) : Promise.resolve([]),
                    hentGlobalTopHundrede(),
                    hentGlobalTopHundredeIUgen()
                ]),
                12000
            ).catch((error) => {
                console.warn('Kunne ikke genhente globale highscores efter score', error);
                return [klasseScores, globaleScores, ugensGlobaleScores] as const;
            });
            if (!erAktuelScoreGemning(token)) return;

            klasseScores = nyeKlasseScores;
            globaleScores = nyeGlobaleScores;
            ugensGlobaleScores = nyeUgensGlobaleScores;

            const kanTjekkeUgeTop = highscoreGemt && !!authState.user;
            const ugensTopScore = ugensGlobaleScores[0];
            nyGlobalRekord = !!kanTjekkeUgeTop &&
                afsluttetScore >= M10_SCORE &&
                ugensTopScore?.point === afsluttetScore &&
                ugensTopScore.spillerNavn === highscoreNavn &&
                ugensTopScore.oeNavn === oeNavn &&
                ugensTopScore.karakter === karakterNavn;
            const gemtScore = ugensGlobaleScores.find((resultat) =>
                resultat.point === afsluttetScore &&
                resultat.spillerNavn === highscoreNavn &&
                resultat.oeNavn === oeNavn &&
                resultat.karakter === karakterNavn
            ) || globaleScores.find((resultat) =>
                resultat.point === afsluttetScore &&
                resultat.spillerNavn === highscoreNavn &&
                resultat.oeNavn === oeNavn &&
                resultat.karakter === karakterNavn
            );

            await medTimeout(opdaterHighscoreMedalje(gemtScore?.id, afsluttetScore, nyGlobalRekord), 10000).catch((error) => {
                console.warn('Kunne ikke opdatere highscore-medalje efter score', error);
                return false;
            });
        } catch (error) {
            console.warn('Efterarbejde efter scoregemning fejlede', error);
        }
    }

    async function opdaterOgGemHighscore(token: ScoreGemningToken) {
        try {
            if (!erAktuelScoreGemning(token)) return;
            opdaterSamletScore();
            opdaterLokaleTrofaeer();
            await syncTilDb(true);
            if (!erAktuelScoreGemning(token)) return;
            let sessionGemt = await flushVentendeSync();
            if (!erAktuelScoreGemning(token)) return;
            if (!sessionGemt) {
                await syncTilDb(true);
                if (!erAktuelScoreGemning(token)) return;
                sessionGemt = await flushVentendeSync();
                if (!erAktuelScoreGemning(token)) return;
            }
            const afslutningGemt = await gemAfsluttetSpillerISession();
            if (!erAktuelScoreGemning(token)) return;
            sessionGemt = sessionGemt && afslutningGemt;
            if (!sessionGemt) {
                console.warn('Ø-sessionen blev ikke gemt før highscore. Forsøger stadig at gemme scoren.');
            }
            
            const highscoreGemt = await gemHighscore();
            if (!erAktuelScoreGemning(token)) return;
            harGemtOfflineSpil = harOfflineSpil();
            offlineSpilInfo = hentOfflineSpilInfo();
            scoreErGemt = highscoreGemt;
            scoreGemningFejlet = !highscoreGemt;
            void opdaterScoreTavlerEfterGemning(highscoreGemt, afslutningGemt, token);
        } catch (error) {
            if (!erAktuelScoreGemning(token)) return;
            console.error('Score-flowet fejlede', error);
            spilTilstand.statusBesked = tekst(
                'Scoren blev ikke gemt. Tjek forbindelsen, og prøv igen.',
                'The score was not saved. Check your connection and try again.'
            );
            scoreGemningFejlet = true;
        } finally {
            if (erAktuelScoreGemning(token)) {
                scoreGemmer = false;
                scoreGemningDeadline = null;
                scoreGemningSekunderTilbage = 0;
                if (aktivScoreGemningRunId === token.id) aktivScoreGemningRunId = null;
            }
        }
    }

    function gemScoreIgen() {
        if (spilTilstand.gameMode === 'tutorial') {
            scoreErGemt = true;
            scoreGemmer = false;
            scoreGemningFejlet = false;
            scoreGemningDeadline = null;
            scoreGemningSekunderTilbage = 0;
            return;
        }
        if (aktivScoreGemningRunId !== null) return;
        opdaterSamletScore();
        const resultatSikretLokalt = sikrAktueltResultatLokalt();
        scoreGemningFejlet = false;
        scoreGemmer = true;
        scoreGemningDeadline = Date.now() + SCORE_GEMNING_TIMEOUT_MS;
        scoreGemningSekunderTilbage = Math.ceil(SCORE_GEMNING_TIMEOUT_MS / 1000);
        if (!resultatSikretLokalt) {
            spilTilstand.statusBesked = tekst(
                'Resultatet kunne ikke sikres lokalt. Hold siden åben, mens vi prøver at gemme det online.',
                'The result could not be secured locally. Keep this page open while we try to save it online.'
            );
        }
        const token: ScoreGemningToken = {
            id: ++scoreGemningRunId,
            rundeId: spilTilstand.rundeSeed
        };
        aktivScoreGemningRunId = token.id;
        window.setTimeout(() => {
            if (scoreGemmer && erAktuelScoreGemning(token)) {
                scoreGemmer = false;
                scoreGemningFejlet = true;
                scoreGemningDeadline = null;
                scoreGemningSekunderTilbage = 0;
                if (aktivScoreGemningRunId === token.id) aktivScoreGemningRunId = null;
                scoreGemningRunId++;
                spilTilstand.statusBesked = tekst('Det tager længere tid end ventet at sende scoren. Den er gemt på denne enhed, og vi prøver automatisk igen.', 'Sending the score is taking longer than expected. It is saved on this device, and we will try again automatically.');
            }
        }, SCORE_GEMNING_TIMEOUT_MS);
        void opdaterOgGemHighscore(token);
    }

    async function bekræftValg(karakter: Karakter) {
        const aktivSammeBruger = spilTilstand.offlineMode ? null : findAktivSpillerForBruger();
        if (aktivSammeBruger && aktivSammeBruger.navn !== spilTilstand.spillerNavn) {
            spilTilstand.statusBesked = tekst(`Du spiller allerede på denne ø som ${aktivSammeBruger.navn}.`, `You are already playing on this island as ${aktivSammeBruger.navn}.`);
            spilTilstand.gameState = 'start';
            return;
        }

        nulstilFlygtigRundeState();
        sikrRundeSeed();
        spilTilstand.valgtKarakter = karakter;
        spilTilstand.maxLivspoint = karakter.startHp || 100;
        spilTilstand.livspoint = karakter.startHp;
        
        spilTilstand.guldTotal = karakter.startGuld;
        spilTilstand.maxKolonne = 1;
        spilTilstand.doedsAarsag = null;
        spilTilstand.dag = 1;
        spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];
        spilTilstand.mineSkattekortFelter = [];
        spilTilstand.trofaeStats = nulstilTrofaeStats();
        spilTilstand.nyeTrofaeIds = [];
        spilTilstand.nyeMytiskeTrofaeIds = [];
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        spilTilstand.sidsteBersaerkDag = 0;
        spilTilstand.harEnergisyn = false;
        
        spilTilstand.logHistorik = []; 

        const arkiveredeRuter = hentArkiveredeRuter();

        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
            spiller.tidligereHistorik = samlUnikkeRuter(
                arkiveredeRuter,
                spiller.tidligereHistorik,
                spiller.historik && spiller.historik.length > 1 ? [spiller.historik] : []
            );
            spiller.historik = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].deathCause = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].dag = 1; 
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].besoegteMiner = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].harSkattekort = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].skattekortFelter = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].aktivTracker = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].trackedeSpillere = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].royalSkatDage = {};
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].piratRovDage = {};
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].escapeIndex = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].escapeIcon = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].gratisNaesteBevaegelse = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].gratisBevaegelseKilde = '';
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].sidsteBersaerkDag = 0;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].harEnergisyn = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].venteFriIndtilDag = 0;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].rundeSeed = spilTilstand.rundeSeed;
        } else if (arkiveredeRuter.length > 0) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn] = {
                index: spilTilstand.spillerIndex,
                kolonne: 0,
                hp: spilTilstand.livspoint,
                guld: spilTilstand.guldTotal,
                score: 0,
                turNummer: 0,
                retning: spilTilstand.retning,
                rundeSeed: spilTilstand.rundeSeed,
                historik: [],
                tidligereHistorik: arkiveredeRuter,
                isDead: false,
                isWinner: false,
                deathCause: null,
                venteFriIndtilDag: 0,
                sidstAktiv: 0
            };
        }

        const muligeStartFelter = [];
        for (let raekke = 1; raekke < kortHoejde - 1; raekke++) {
            if (spilTilstand.gitter[raekke * kortBredde + 1] && spilTilstand.gitter[raekke * kortBredde + 1].biome !== 'hav' && spilTilstand.gitter[raekke * kortBredde + 1].biome !== 'soe') {
                muligeStartFelter.push(raekke * kortBredde + 1);
            }
        }
        
        if (muligeStartFelter.length > 0) {
            spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
        } else {
            spilTilstand.spillerIndex = kortBredde + 1;
        }
        
        spilTilstand.retning = 'E';
        for (const itemId of karakter.startUdstyr) { tilfoejTilRygsæk(itemId, 1); }
        
        spilTilstand.historik = [];
        spilTilstand.historik.push(spilTilstand.spillerIndex);
        spilTilstand.venteGratisFeltBrugt = null;

        afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
        
        if (spilTilstand.erHost && !spilTilstand.offlineMode) {
            const { data, error } = await medTimeout(
                supabase.from('spil_sessioner').select('rum_kode,runde_id').eq('rum_kode', spilTilstand.rumKode).maybeSingle()
            );
            if (error) {
                spilTilstand.statusBesked = tekst('Øen kunne ikke oprettes. Tjek forbindelsen, og prøv igen om lidt.', 'The island could not be created. Check your connection and try again in a moment.');
                spilTilstand.gameState = 'start';
                return;
            }

            if (!data) {
                const { error: insertError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: rensKortTilLagring(spilTilstand.gitter),
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0,
                    ...kortSessionMeta()
                }])));

                if (insertError) {
                    spilTilstand.statusBesked = tekst('Øen kunne ikke oprettes. Tjek forbindelsen, og prøv igen om lidt.', 'The island could not be created. Check your connection and try again in a moment.');
                    spilTilstand.gameState = 'start';
                    return;
                }
            } else if (data.runde_id !== spilTilstand.rundeSeed) {
                spilTilstand.statusBesked = tekst('En ny runde er allerede startet. Tryk START igen for at deltage i den.', 'A new round has already started. Press START again to join it.');
                spilTilstand.gameState = 'start';
                return;
            }
        }
        
        await syncTilDb(true);
        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
        spilTilstand.logBesked = tekst(
            `Du er drevet i land på kysten af ${formaterOeNavn()}. Tågen ligger bag dig og venter på at omslutte dig. Du må prøve at finde en båd på den anden side af ${formaterOeNavn()}.`,
            `You have washed ashore on the coast of ${formaterOeNavn()}. The fog waits behind you, ready to swallow you. Try to find a boat on the far side of ${formaterOeNavn()}.`
        );
        spilTilstand.gameState = 'play';
        introAktiv = true;
    }

    function afslutIntro() {
        introAktiv = false;
        requestAnimationFrame(() => {
            cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
        });
    }

    function formaterOeNavn() {
        const navn = spilTilstand.rumKode || 'øen';
        return navn.charAt(0).toUpperCase() + navn.slice(1);
    }

    function lukEventOgShop() {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        const lukkedeInteraktion = !!spilTilstand.aktivShop || spilTilstand.aktivVaerksted;
        const lukkedeEvent = eventState.aktivt;
        
        if (felt && eventState.aktivt && felt.eventID !== 'campfire' && felt.eventID !== 'meteor_skat' && felt.eventID !== 'stjernekald') {
            felt.eventFuldført = true;
        }
        
        motorLukEvent();
        spilTilstand.aktivShop = null;
        spilTilstand.aktivVaerksted = false;
        
        if (felt && felt.hasPortal && !lukkedeInteraktion && !lukkedeEvent) {
            udfoerPortalTeleport();
        } else {
            syncTilDb(!lukkedeInteraktion);
        }
    }

    function hentLangsomsteDag() {
        const aktive = Object.entries(spilTilstand.alleSpillere)
            .filter(([navn, spiller]) => navn !== spilTilstand.spillerNavn && erAktivSessionSpiller(spiller))
            .map(([, spiller]) => spiller);

        const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (spilTilstand.spillerNavn && spilTilstand.valgtKarakter && spilTilstand.gameState === 'play') {
            aktive.push({
                ...(mig || {}),
                dag: spilTilstand.dag,
                sidstAktiv: Date.now(),
                isDead: false,
                isWinner: false,
                deathCause: null
            } as SpillerData);
        }
        
        if (aktive.length === 0) return spilTilstand.dag;
        return Math.min(...aktive.map((s: SpillerData) => s.dag || 1));
    }

    function hentKortRangliste() {
        return Object.entries(spilTilstand.alleSpillere)
            .map(([navn, data]) => ({
                navn,
                data,
                score: data.score || beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, navn, data, !!data.isWinner, spilTilstand.kortBredde, spilTilstand.kortHoejde)
            }))
            .sort((a, b) => b.score - a.score);
    }

    function erAktivSessionSpiller(spiller: SpillerData) {
        if (!erFriskAktivSpiller(spiller)) return false;
        return !!spilTilstand.rundeSeed && spiller.rundeSeed === spilTilstand.rundeSeed;
    }

    function erSammeSpiller(spiller: SpillerData, browserId: string) {
        const sammeLogin = !!spiller.userId && !!authState.user?.id && spiller.userId === authState.user.id;
        const sammeBrowser = !!spiller.browserId && spiller.browserId === browserId;
        return sammeLogin || sammeBrowser;
    }

    function kanGenoptagePrivatUdloebetSpil(spiller: SpillerData, navn: string, browserId: string, alleEntries: Array<[string, SpillerData]>) {
        if (erStandardOeNavn(spilTilstand.rumKode)) return false;
        if (spiller.isDead || spiller.isWinner) return false;
        if (erAktivSessionSpiller(spiller)) return false;
        if (navn.toLowerCase() !== spilTilstand.spillerNavn.toLowerCase()) return false;
        if (!erSammeSpiller(spiller, browserId)) return false;

        return alleEntries.every(([andetNavn]) => andetNavn === navn);
    }

    async function haandterUdloebneSpillereVedIndgang(rentNavn: string, browserId: string) {
        const alleEntries = Object.entries(spilTilstand.alleSpillere);
        const uafsluttede = alleEntries.filter(([, spiller]) => !spiller.isDead && !spiller.isWinner);
        if (uafsluttede.length === 0) return true;

        const erEgenUafsluttetSpiller = (navn: string, spiller: SpillerData) =>
            !spiller.isDead &&
            !spiller.isWinner &&
            navn.toLowerCase() === rentNavn.toLowerCase() &&
            erSammeSpiller(spiller, browserId);

        const egetNavn = alleEntries.find(([navn]) => navn.toLowerCase() === rentNavn.toLowerCase())?.[0] ?? rentNavn;
        const egenSpiller = spilTilstand.alleSpillere[egetNavn];
        if (egenSpiller && kanGenoptagePrivatUdloebetSpil(egenSpiller, egetNavn, browserId, alleEntries)) {
            return true;
        }

        const aktiveUafsluttede = uafsluttede.filter(([navn, spiller]) =>
            erEgenUafsluttetSpiller(navn, spiller) || erAktivSessionSpiller(spiller)
        );

        if (aktiveUafsluttede.length === 0) {
            const gammelRundeId = spilTilstand.rundeSeed;
            if (!spilTilstand.offlineMode && !(await flushVentendeGravsten(gammelRundeId))) {
                spilTilstand.statusBesked = tekst('Dødsfaldet kunne ikke gemmes endnu. Tjek forbindelsen, og prøv igen.', 'The death could not be saved yet. Check the connection and try again.');
                return false;
            }
            spilTilstand.erHost = true;
            annullerVentendeNetvaerkSync();
            nulstilFlygtigRundeState();
            spilTilstand.alleSpillere = {};
            startNyRundeSeed();
            spilTilstand.fogX = 0;
            spilTilstand.dag = 1;
            spilTilstand.historik = [];
            spilTilstand.logHistorik = [];
            spilTilstand.venteGratisFeltBrugt = null;
            spilTilstand.gratisNaesteBevaegelse = false;
            spilTilstand.gratisBevaegelseKilde = '';
            spilTilstand.sidsteBersaerkDag = 0;
            spilTilstand.harEnergisyn = false;
            spilTilstand.venteSpilAktiv = false;
            spilTilstand.ventePuljeGuld = 0;
            spilTilstand.ventePuljeLiv = 0;
            spilTilstand.venteRunde = 0;
            spilTilstand.venteStartTid = 0;
            spilTilstand.venteFriIndtilDag = 0;
            nulstilKort();

            const { error, count } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
                kort: rensKortTilLagring(spilTilstand.gitter),
                start_index: spilTilstand.spillerIndex,
                spillere: {},
                fog_x: 0,
                ...kortSessionMeta()
            }, { count: 'exact' })
                .eq('rum_kode', spilTilstand.rumKode)
                .eq('kort_version', KORT_VERSION)
                .eq('runde_id', gammelRundeId), 8000));

            if (error || count !== 1) {
                await genindlaesSessionEfterTabtReset();
                spilTilstand.statusBesked = tekst('Øen kunne ikke gøres klar til nye rejsende. Tjek forbindelsen, og prøv igen.', 'The island could not be prepared for new travelers. Check your connection and try again.');
                return false;
            }

            return true;
        }

        const rensede = Object.fromEntries(
            alleEntries.filter(([navn, spiller]) =>
                spiller.isDead ||
                spiller.isWinner ||
                erEgenUafsluttetSpiller(navn, spiller) ||
                erAktivSessionSpiller(spiller)
            )
        );
        if (Object.keys(rensede).length === alleEntries.length) return true;

        spilTilstand.alleSpillere = rensede;
        const { error, count } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
            spillere: rensede
        }, { count: 'exact' })
            .eq('rum_kode', spilTilstand.rumKode)
            .eq('kort_version', KORT_VERSION)
            .eq('runde_id', spilTilstand.rundeSeed), 8000));

        if (error || count !== 1) {
            spilTilstand.statusBesked = tekst('Øen kunne ikke ryddes efter tidligere rejsende. Tjek forbindelsen, og prøv igen.', 'The island could not be cleared after previous travelers. Check your connection and try again.');
            return false;
        }

        return true;
    }

    function filtrerSpillereTilKanal(spillere: Record<string, SpillerData>, kanalNoegle: string) {
        return Object.fromEntries(
            Object.entries(spillere).filter(([, spiller]) => {
                if (spilTilstand.rundeSeed && spiller.rundeSeed !== spilTilstand.rundeSeed) return false;
                if (spiller.kanalNoegle) return spiller.kanalNoegle === kanalNoegle;
                if (spiller.rumKode) return spiller.rumKode === spilTilstand.rumKode;
                return true;
            })
        );
    }

    function findAktivSpillerForBruger() {
        if (spilTilstand.offlineMode) return null;
        const brugerId = authState.user?.id;
        if (!brugerId) return null;

        const fundet = Object.entries(spilTilstand.alleSpillere).find(([, spiller]) => {
            return spiller.userId === brugerId && erAktivSessionSpiller(spiller);
        });

        return fundet ? { navn: fundet[0], spiller: fundet[1] } : null;
    }

    function farvelBaadeForFelt(index: number) {
        return Object.entries(spilTilstand.alleSpillere)
            .filter(([, spiller]) => spiller?.isWinner && spiller.escapeIndex === index)
            .map(([navn, spiller]) => ({
                navn,
                ikon: spiller.escapeIcon || spiller.ikon || '/tiles/player.webp'
            }));
    }

    function gravstenListeForFelt(felt: Felt): GravstenMinde[] {
        if (felt.gravstenListe?.length) return felt.gravstenListe;
        if (felt.gravstenIkon) return [{ ikon: felt.gravstenIkon, navn: tekst('Ukendt', 'Unknown'), dag: 0 }];
        return [];
    }

    function senesteGravstenForFelt(felt: Felt) {
        return [...gravstenListeForFelt(felt)].reverse().slice(0, 3);
    }

    function formaterBiomeNavn(biome: string | undefined) {
        if (!biome) return tekst('felt', 'field');
        return biomeNavne[biome]?.() ?? biome.replace('hoejland', tekst('højland', 'highland')).replace('soe', tekst('sø', 'lake'));
    }

    function tileBaggrundForBiome(biome: string, erOpslugt: boolean) {
        if (biome === 'soe') {
            const billede = erOpslugt ? '/tiles/hav_taage.webp' : '/tiles/hav.webp';
            return `url('${billede}')`;
        }

        return `url('/tiles/${biome}${erOpslugt ? '_taage' : ''}.webp')`;
    }

    function harKoebbarShop(felt: Felt) {
        if (felt.taageLukketShop) return false;
        return (felt.shopBasisItems || []).length > 0 || (felt.shopItems || []).some((itemId) => itemDB[itemId]?.kanKoebes !== false);
    }

    function forklaringForFelt(felt: Felt, index: number, erUdforsket: boolean, erOpslugt: boolean, erSkattekortRygte = false) {
        if (erSkattekortRygte && !erUdforsket) {
            return {
                titel: tekst('Skattekortspor', 'Treasure map clue'),
                tekst: tekst(
                    'Et gammelt skattekort peger på området. Farven og krydset er et spor, ikke et udforsket felt. Kortet kan heller ikke vise, om kisten allerede er taget.',
                    'An old treasure map points to this area. The color and cross are a clue, not an explored tile. The map also cannot show whether the chest has already been taken.'
                )
            };
        }

        if (!erUdforsket) {
            return {
                titel: tekst('Ukendt felt', 'Unknown field'),
                tekst: tekst(
                    'Du har ikke udforsket feltet endnu. Gå tættere på, eller brug en fakkel eller bedre udsyn til at afsløre det.',
                    'You have not explored this tile yet. Move closer, or use a torch or better vision to reveal it.'
                )
            };
        }

        const biome = String(felt.biome || 'felt');
        const dele: string[] = [biomeForklaringer[biome]?.() || tekst('Du har udforsket dette felt.', 'You have explored this tile.')];

        if (erOpslugt) dele.push(tekst('Tågen har taget feltet. Bliver du her, er du i fare.', 'The fog has taken this tile. Staying here puts you in danger.'));
        if (biome === 'hav') dele.push(tekst('Vandet ødelægger almindelig rustning og kongepanser og slukker fakler. Elverrustning klarer turen.', 'The water destroys normal armor and royal armor and puts out torches. Elven armor survives the crossing.'));
        if (biome === 'soe') dele.push(tekst('Søer er indlandsvand. De er farlige uden båd, men de tæller ikke som havkyst.', 'Lakes are inland water. They are dangerous without a boat, but do not count as sea coast.'));
        if (biome === 'hule') dele.push(tekst('Huler kan ødelægge soveposer og fint tøj.', 'Caves can ruin sleeping bags and fine clothes.'));
        if (biome === 'ruin') dele.push(tekst('I ruiner kan du miste en madration.', 'You may lose a food ration in ruins.'));
        if (biome === 'krystal') dele.push(tekst('Krystaller ødelægger metaldetektorer og gyldne kikkerter. En malmviser bliver til en almindelig metaldetektor.', 'Crystals destroy metal detectors and golden spyglasses. An ore finder becomes a normal metal detector.'));
        if (biome === 'ritual') dele.push(tekst('Ritualfelter kan ødelægge en søgekvist. En runekvist bliver til en almindelig søgekvist.', 'Ritual tiles can destroy a dowsing rod. A rune rod becomes a normal dowsing rod.'));
        if (felt.hasBoat) dele.push(tekst(
            `Der ${felt.boatCount && felt.boatCount > 1 ? `ligger ${felt.boatCount} både` : 'ligger en flugtbåd'} her. Går du ombord, har du vundet.`,
            `${felt.boatCount && felt.boatCount > 1 ? `There are ${felt.boatCount} boats` : 'There is an escape boat'} here. Board it to win.`
        ));
        if (felt.eventID && !felt.eventFuldført) dele.push(tekst('En hændelse venter her og starter, når du går ind på feltet.', 'An encounter is waiting here and begins when you enter the tile.'));
        if (harKoebbarShop(felt)) dele.push(tekst('Feltet har en butik. Dagens varer deles af spillerne og genfyldes næste dag.', 'This field has a shop. The daily stock is shared by players and refills the next day.'));
        if (felt.hasWorkshop && !felt.taageLukketVaerksted) dele.push(tekst('Feltet har et værksted, hvor udstyr kan opgraderes. Har du kølle eller murknuser, tør mesteren kun arbejde for dig én gang.', 'This field has a workshop where equipment can be upgraded. If you have a club or wallbreaker, the master only dares to work for you once.'));
        if (felt.hasGoldmine) dele.push(felt.mineOwner ? tekst(`Guldminen ejes af ${felt.mineOwner}.`, `The gold mine is owned by ${felt.mineOwner}.`) : tekst('Der er en guldmine her.', 'There is a gold mine here.'));
        if (felt.hasPortal && !(felt.eventID && !felt.eventFuldført)) dele.push(tekst('Portalen kan flytte dig mod øst.', 'The portal can move you east.'));
        if (felt.taageBlokker) dele.push(tekst('Tågeblokkeren holder tågen nede på niveau 1 omkring sig, også når resten af tågen bliver tungere.', 'The fog blocker keeps the fog at level 1 around it, even when the rest of the fog grows heavier.'));
        if (farvelBaadeForFelt(index).length > 0) dele.push(tekst('Farvelbåden viser, at en spiller slap væk fra øen her.', 'The farewell boat shows that a player escaped the island here.'));
        if (felt.gravet) dele.push(tekst('Feltet er allerede gravet op.', 'This field has already been dug.'));
        else if (felt.kanGraves) dele.push(tekst('Feltet kan graves.', 'This field can be dug.'));
        else dele.push(tekst('Feltet kan ikke graves.', 'This field cannot be dug.'));

        return {
            titel: formaterBiomeNavn(biome),
            tekst: dele.join(' ')
        };
    }

    function placerInspectBoble(clientX: number, clientY: number) {
        const bredde = Math.min(280, Math.max(220, window.innerWidth - 24));
        const hoejde = 170;
        const margin = 12;
        const cursorAfstand = 52;
        let x = clientX + cursorAfstand;
        let y = clientY + cursorAfstand;

        if (x + bredde > window.innerWidth - margin) x = clientX - bredde - cursorAfstand;
        if (y + hoejde > window.innerHeight - margin) y = clientY - hoejde - cursorAfstand;

        return {
            x: Math.max(margin, Math.min(x, window.innerWidth - bredde - margin)),
            y: Math.max(margin, Math.min(y, window.innerHeight - hoejde - margin))
        };
    }

    function startInspect() {
        inspectAktiv = !inspectAktiv;
        if (inspectAktiv) {
            inspectCursor = {
                x: inspectCursor.x || (browser ? window.innerWidth / 2 : 0),
                y: inspectCursor.y || (browser ? window.innerHeight / 2 : 0),
                synlig: true
            };
        } else {
            inspectBoble = null;
            inspectCursor.synlig = false;
        }
    }

    function lukInspect() {
        inspectAktiv = false;
        inspectBoble = null;
        inspectCursor.synlig = false;
    }

    function haandterInspectPointerMove(e: PointerEvent) {
        if (e.pointerType === 'touch') {
            inspectCursor.synlig = false;
            return;
        }

        inspectCursor = { x: e.clientX, y: e.clientY, synlig: inspectAktiv };
    }

    function skjulInspectCursor() {
        inspectCursor.synlig = false;
    }

    function haandterInspectKlik(e: MouseEvent) {
        if (!inspectAktiv) return;
        const target = e.target as HTMLElement | null;
        if (cam.harTrukket && target?.closest('.game-container')) return;
        if (target?.closest('.inspect-knap, .inspect-boble, .fokus-knap, .regelbog-knap, .musik-toggle-btn')) return;
        const element = target?.closest('[data-help-title]') as HTMLElement | null;
        if (element?.dataset.helpTitle === tekst('Ukendt felt', 'Unknown field')) {
            lukInspect();
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const placering = placerInspectBoble(e.clientX, e.clientY);
        inspectBoble = {
            titel: element?.dataset.helpTitle || tekst('Hjælp', 'Help'),
            tekst: element?.dataset.helpBody || tekst('Tryk på et felt, ikon eller en knap for at få en forklaring.', 'Tap a field, icon or button to get an explanation.'),
            ...placering
        };
        markerTutorialHandling('help');
    }

    function touchAfstand(touches: TouchList) {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    function startTouchZoom(e: TouchEvent) {
        if (eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted) return;
        if (e.touches.length === 2) {
            sidstePinchAfstand = touchAfstand(e.touches);
            cam.stopTræk();
            e.preventDefault();
        }
    }

    function haandterTouchZoom(e: TouchEvent) {
        if (eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted) return;
        if (e.touches.length !== 2 || sidstePinchAfstand <= 0) return;

        const nyAfstand = touchAfstand(e.touches);
        cam.justerZoom((nyAfstand - sidstePinchAfstand) / 260, false);
        sidstePinchAfstand = nyAfstand;
        e.preventDefault();
    }

    function stopTouchZoom() {
        sidstePinchAfstand = 0;
    }

    async function medTimeout<T>(kald: PromiseLike<T>, ms = 25000): Promise<T> {
        let timer: ReturnType<typeof setTimeout>;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('timeout')), ms);
        });

        return Promise.race([kald, timeout]).finally(() => clearTimeout(timer));
    }

    function vent(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function kortSessionMeta() {
        return {
            kort_bredde: spilTilstand.kortBredde,
            kort_hoejde: spilTilstand.kortHoejde,
            kort_version: KORT_VERSION,
            runde_id: spilTilstand.rundeSeed
        };
    }

    function laesSessionDimensioner(data: { kort_bredde?: number | null; kort_hoejde?: number | null } | null | undefined) {
        saetKortDimensioner(data?.kort_bredde ?? BREDDE, data?.kort_hoejde ?? HOEJDE);
    }

    async function medRetry<T>(kald: () => PromiseLike<T>, antalForsoeg = 2): Promise<T> {
        let sidsteFejl: unknown;

        for (let forsoeg = 1; forsoeg <= antalForsoeg; forsoeg++) {
            try {
                return await kald();
            } catch (error) {
                sidsteFejl = error;
                if (!(error instanceof Error) || error.message !== 'timeout' || forsoeg === antalForsoeg) break;
                spilTilstand.statusBesked = tekst('Øen svarer langsomt. Prøver igen...', 'The island is responding slowly. Trying again...');
                await vent(800);
            }
        }

        throw sidsteFejl;
    }

    function hentSpilSession(rumKode: string) {
        return medRetry(() => medTimeout(
            supabase
                .from('spil_sessioner')
                .select(SESSION_SELECT)
                .eq('rum_kode', rumKode)
                .maybeSingle()
        ), 2);
    }

function udførBevægelse(nytIndeks: number) {
    if (flytterNu || !spilTilstand.valgtKarakter) return;

    flytterNu = true;
    const bevaegelsesGeneration = ++bevaegelsesTimerGeneration;
    const bevaegelsesRundeId = spilTilstand.rundeSeed;
    const gammelIndex = spilTilstand.spillerIndex;
    udfoerBevaegelse(nytIndeks, {
        erITaagen: erITågen,
        langsomsteDag: hentLangsomsteDag(),
        maxDageForan: MAX_DAGE_FORAN,
        synsRadius: aktuelSynsRadius,
        onKameraFoelg: (indeks) => cam.foelgSpiller(indeks, kortBredde, HEX_W, ROW_H),
        onBaadStart: (indeks) => {
            sejlendeBaadIndex = indeks;
        }
    });

    if (spilTilstand.spillerIndex !== gammelIndex) markerTutorialHandling('move');
    if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isWinner) {
        markerTutorialHandling('boat');
        skjulTutorialKnap();
    }

    setTimeout(() => {
        if (bevaegelsesTimerGeneration === bevaegelsesGeneration &&
            spilTilstand.rundeSeed === bevaegelsesRundeId) {
            flytterNu = false;
        }
    }, 200);
}

    function flytHex(retning: string) {
        if (introAktiv || spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
        const gyldigeRetninger = ['NW', 'NE', 'W', 'E', 'SW', 'SE'] as const;
        if (!gyldigeRetninger.includes(retning as typeof gyldigeRetninger[number])) return;

        const nytIndeks = hentNaboIRetning(
            spilTilstand.spillerIndex,
            retning as typeof gyldigeRetninger[number],
            kortBredde,
            kortBredde * kortHoejde
        );

        if (nytIndeks !== null) udførBevægelse(nytIndeks);
    }

    function klikPåHex(nytIndeks: number) {
        if (introAktiv || spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
        if (spilTilstand.gameState === 'play' && hentNaboIndices(spilTilstand.spillerIndex).includes(nytIndeks)) udførBevægelse(nytIndeks);
    }
</script>

<svelte:head>
    <style>
        html.inspect-global,
        html.inspect-global *,
        body.inspect-global,
        body.inspect-global * {
            cursor: none !important;
        }
    </style>
</svelte:head>

<svelte:window
    onkeydown={håndterTastatur}
    onclickcapture={haandterInspectKlik}
    onpointermove={haandterInspectPointerMove}
    onpointerleave={skjulInspectCursor}
/>
<svelte:body class:inspect-global={inspectAktiv} />

{#if spilTilstand.gameState === 'play'}
    <BottomUI />
{/if}

<Skaerme 
    {opretEllerDeltag}
    {startOfflineSpil}
    {startTutorialSpil}
    {fortsaetOfflineSpil}
    {bekræftValg} 
    {genstartBane} 
    {nulstilHukommelse}
    {lokaleScores} 
    {klasseScores}
    {globaleScores}
    {ugensGlobaleScores}
    {nyGlobalRekord}
    {harGemtOfflineSpil}
    {offlineSpilInfo}
    {scoreGemmer}
    {scoreGemningFejlet}
    {scoreGemningSekunderTilbage}
/>

{#if spilTilstand.gameState === 'play'}
    <div class="game-help-actions">
        <button
            type="button"
            class="top-ikon-knap fokus-knap"
            onclick={fokuserPaaSpiller}
            title={tekst('Fokuser på dig', 'Focus on you')}
            aria-label={tekst('Fokuser på dig', 'Focus on you')}
        >
            <svg class="top-ikon-svg fokus-ikon" viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="9" />
                <path d="M24 7v8M24 33v8M7 24h8M33 24h8" />
            </svg>
        </button>
        <button
            type="button"
            class="top-ikon-knap inspect-knap"
            class:aktiv={inspectAktiv}
            onclick={startInspect}
            title={inspectAktiv ? tekst('Slå hjælpen fra', 'Turn help off') : tekst('Slå hjælpen til', 'Turn help on')}
            aria-label={inspectAktiv ? tekst('Slå hjælpen fra', 'Turn help off') : tekst('Slå hjælpen til', 'Turn help on')}
        >
            <svg class="top-ikon-svg inspect-ikon" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M18 18a6.5 6.5 0 0 1 12.2 3.2c0 5.8-6.2 5.5-6.2 11" />
                <circle cx="24" cy="38" r="1.8" />
            </svg>
        </button>
        <Regelbog onOpen={() => markerTutorialHandling('rulebook')} />
        <SprogKnap />
        <LydKnap />
        {#if tutorialState.aktiv && !visTutorialPanel}
            <button
                type="button"
                class="tutorial-aabn-knap"
                onclick={() => visTutorialPanel = true}
                title={tekst('Åbn tutorial', 'Open tutorial')}
                aria-label={tekst('Åbn tutorial', 'Open tutorial')}
            >
                <span aria-hidden="true">?</span>
                <span>{tekst('Tutorial', 'Tutorial')}</span>
            </button>
        {/if}
    </div>
    <div class="zoom-actions" aria-label={tekst('Zoom', 'Zoom')}>
        <button type="button" onclick={() => cam.justerZoom(0.18, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)} aria-label={tekst('Zoom ind', 'Zoom in')}>+</button>
        <button type="button" onclick={() => cam.justerZoom(-0.18, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)} aria-label={tekst('Zoom ud', 'Zoom out')}>-</button>
    </div>
{/if}

{#if tutorialState.aktiv && spilTilstand.gameState === 'play' && visTutorialPanel}
    <aside
        class="tutorial-panel"
        aria-label={tekst('Tutorial', 'Tutorial')}
        data-help-title={tekst('Tutorial', 'Tutorial')}
        data-help-body={tekst('Tutorialboksen viser din næste øvelse. Tutorialen påvirker ikke gemte spil eller toplister.', 'The tutorial box shows your next exercise. The tutorial does not affect saved games or leaderboards.')}
    >
        <button
            type="button"
            class="tutorial-luk-knap"
            onclick={() => visTutorialPanel = false}
            title={tekst('Luk tutorial', 'Close tutorial')}
            aria-label={tekst('Luk tutorial', 'Close tutorial')}
        >×</button>
        <span class="tutorial-progress">
            {Math.min(tutorialState.trin + 1, tutorialTrinAntal)}/{tutorialTrinAntal}
        </span>
        <div class="tutorial-copy">
            <h2>{aktuelTutorialTrin.titel}</h2>
            <p>{aktuelTutorialTrin.tekst}</p>
            {#if aktuelTutorialTrin.popupTekst}
                <p class="tutorial-detail">{aktuelTutorialTrin.popupTekst}</p>
            {/if}
            {#if aktuelTutorialTrin.popupPunkter?.length}
                <ul class="tutorial-points">
                    {#each aktuelTutorialTrin.popupPunkter as punkt}
                        <li>{punkt}</li>
                    {/each}
                </ul>
            {/if}
            {#if aktuelTutorialTrin.laesMere}
                <p class="tutorial-more">{aktuelTutorialTrin.laesMere}</p>
            {/if}
        </div>
    </aside>
{/if}

<div class="game-container" class:inspect-mode={inspectAktiv}>
    <div class="camera" role="presentation"
        ondragstart={(e) => e.preventDefault()}
        onwheel={(e) => cam.håndterZoom(e, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)}
        onpointerdown={(e) => cam.startTræk(e, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)}
        onpointermove={cam.træk}
        onpointerup={cam.stopTræk}
        ontouchstart={startTouchZoom}
        ontouchmove={haandterTouchZoom}
        ontouchend={stopTouchZoom}
        ontouchcancel={stopTouchZoom}
        style="cursor: {inspectAktiv ? 'none' : cam.isDragging ? 'grabbing' : 'grab'}; touch-action: none;"
    >
        <div class="map" style={kameraStyle}>
            {#each spilTilstand.aktiveEnergiKugler || [] as kugle (kugle.id)}
                {@const punkt = energiAnimationPunkt(kugle)}
                <img
                    src="/tiles/energi_taendt.webp"
                    alt=""
                    class="flyvende-energi-kugle"
                    style="left: {punkt.x}px; top: {punkt.y}px; --energi-x: {kugle.offsetX}px; --energi-y: {kugle.offsetY}px; --energi-delay: {kugle.delay}ms;"
                />
            {/each}
            {#each spilTilstand.gitter as felt, i (i)}
                {@const raekke = Math.floor(i / kortBredde)}
                {@const kolonne = i % kortBredde}
                {@const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0)}
                {@const posY = raekke * ROW_H}
                {@const erUdforsket = spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(i)}
                {@const erSkattekortRygte = !erUdforsket && aktiveSkattekortFelter.includes(i)}
                {@const erOpslugt = !spilTilstand.devVisHeleKort && erFeltITaagen(spilTilstand.gitter, i, spilTilstand.fogX, kortBredde)}
                {@const taageNiveau = taageNiveauForFelt(i, erOpslugt)}
                {@const vistBiome = felt.katastrofeVisuelAktiv && felt.katastrofeFraBiome ? felt.katastrofeFraBiome : felt.biome}
                {@const baggrund = !erUdforsket && !erSkattekortRygte ? 'none' : tileBaggrundForBiome(String(vistBiome), erOpslugt)}
                {@const feltHjaelp = forklaringForFelt(felt, i, erUdforsket, erOpslugt, erSkattekortRygte)}
                {@const energiPris = energiPrisForNabofelt(i, erUdforsket)}

                <div class="hex" class:active={spilTilstand.spillerIndex === i} class:unexplored={!erUdforsket && !erSkattekortRygte}
                    class:skattekort-rygte={erSkattekortRygte}
                    class:katastrofe-venter={!!felt.katastrofeVisuelAktiv}
                    onclick={() => klikPåHex(i)}
                    onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                    data-help-title={feltHjaelp.titel}
                    data-help-body={feltHjaelp.tekst}
                    role="button" tabindex="0"
                    style="{erSkattekortRygte ? `--rygte-bg: ${baggrund};` : `background-image: ${baggrund};`} left: {posX}px; top: {posY}px;"
                >
                    <div class="inner" class:opslugt={erOpslugt} class:taageNiveau1={taageNiveau === 1} class:taageNiveau2={taageNiveau === 2} class:taageNiveau3={taageNiveau === 3}>
                        {#if erUdforsket && felt.hasBoat}
                            {#if !erOpslugt}
                                <div class="sejr-lys"></div>
                            {/if}
                            {#each Array.from({ length: Math.min(felt.boatCount || 1, 4) }, (_ignore, index) => index) as baadNr (baadNr)}
                                <img src="/tiles/baad.webp" alt={tekst('Flugtbåd', 'Escape boat')} class="escape-boat boat-{baadNr}" data-help-title={tekst('Flugtbåd', 'Escape boat')} data-help-body={tekst('Gå ind på feltet, og tag båden væk fra øen. Hver båd kan kun bruges én gang.', 'Enter the tile and take the boat off the island. Each boat can only be used once.')} />
                            {/each}
                            {#if (felt.boatCount || 1) > 4}
                                <span class="boat-count">×{felt.boatCount}</span>
                            {/if}
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.afgroede && felt.biome === 'mark'}                            
                            {@const nuBlok = hentAfgroedeBlok(spilTilstand.dag)}
                            {@const erModen = erAfgroedeModen(felt, nuBlok)}
                            {@const erPlageramt = aktivInsektPlageBlok === nuBlok && erModen}
                            {@const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok}
                            {@const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok}

                            {#if erSmadret}
                                <img src="/tiles/{felt.afgroede === 'hvede' ? 'brokenwheat.webp' : 'brokenbean.webp'}" class="crop-icon" alt="" data-help-title={tekst('Ødelagt afgrøde', 'Ruined crop')} data-help-body={tekst('Afgrøden er ødelagt og giver ikke længere mad eller heling.', 'The crop is ruined and no longer gives food or healing.')} />
                            {:else if !erHoestet && !erPlageramt}
                                {#if erModen}
                                    <img src="/tiles/{felt.afgroede === 'hvede' ? 'wheat.webp' : 'beans.webp'}" class="crop-icon moden" alt="" data-help-title={tekst('Moden afgrøde', 'Ripe crop')} data-help-body={tekst('En moden afgrøde. Når du går ind på feltet, kan den give lidt HP, medmindre en insektplage rammer.', 'A ripe crop. When you enter the field, it can give a little HP unless an insect plague strikes.')} />
                                {:else}
                                    <img src="/tiles/{felt.afgroede === 'hvede' ? 'growingwheat.webp' : 'growingbean.webp'}" class="crop-icon" alt="" data-help-title={tekst('Voksende afgrøde', 'Growing crop')} data-help-body={tekst('Afgrøden er ikke moden endnu. Hvis du tramper gennem den for tidligt, bliver den skadet.', 'The crop is not ripe yet. If you trample through it too early, it is damaged.')} />
                                {/if}
                            {/if}
                        {/if}

                        {#if erUdforsket && felt.biome === 'meteor' && felt.hasMeteorStone}
                            <img src="/tiles/meteorsten.webp" class="meteor-stone-icon" class:meteor-stone-icon-taage={erOpslugt} alt="" data-help-title={tekst('Meteorsten', 'Meteor stone')} data-help-body={tekst('Meteorstenen varsler en særlig hændelse med sin egen fare og belønning. Gå ind på feltet for at undersøge den.', 'The meteor stone signals a special encounter with its own danger and reward. Enter the tile to investigate it.')} />
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.taageBlokker}
                            <img src="/tiles/blokker.webp" class="taageblokker-icon" alt={tekst('Tågeblokker', 'Fog blocker')} data-help-title={tekst('Tågeblokker', 'Fog blocker')} data-help-body={tekst('Holder tågen på det laveste niveau omkring sig, selv når den bliver tættere andre steder.', 'Keeps the surrounding fog at its lowest level, even when it grows thicker elsewhere.')} />
                        {/if}

                        {#if !erOpslugt && !felt.gravet && felt.jordskredsSkatSpor}
                            <img src="/tiles/treasuremark.webp" alt={tekst('Jordskælvskryds', 'Earthquake mark')} class="treasure-mark-icon jordskreds-skat-icon" data-help-title={tekst('Jordskælvskryds', 'Earthquake mark')} data-help-body={tekst('Jordskælvet har mærket dette nye bjergfelt. Ét af krydserne skjuler en kiste; de andre kan udløse farlige sammenstyrtninger.', 'The earthquake marked this new mountain tile. One cross hides a chest; the others may trigger dangerous collapses.')} />
                        {/if}

                        {#if (erUdforsket || erSkattekortRygte) && !felt.gravet}
                            {@const erIndenForPejling = regnHexAfstand(spilTilstand.spillerIndex, i, kortBredde) <= pejleRadius}
                            {#if felt.isSkatteKlynge && (erSkattekortRygte || aktiveSkattekortFelter.includes(i))}
                                <img src="/tiles/treasuremark.webp" alt={tekst('Mulig skat', 'Possible treasure')} class="treasure-mark-icon" data-help-title={tekst('Mulig skat', 'Possible treasure')} data-help-body={tekst('Skattekortet peger på dette område. Et af felterne kan gemme kisten, men kortet viser ikke, om den allerede er taget.', 'The treasure map points to this area. One of the tiles may hide the chest, but the map cannot show whether it has already been taken.')} />
                            {/if}
                            {#if erUdforsket && harDetektor && erIndenForPejling && (felt.skjultGuld ?? 0) > 0}
                                <img src="/tiles/guldtaage.webp" alt="" class="mist-icon" data-help-title={tekst('Guldspor', 'Gold trace')} data-help-body={harMalmviser ? tekst('Din malmviser mærker skjult guld på kendte felter op til tre felter væk. Grav her for at få guldet frem; malmviseren øger fundet.', 'Your ore finder senses hidden gold on known tiles up to three tiles away. Dig here to reveal it; the ore finder increases the amount.') : tekst('Din metaldetektor mærker skjult guld på kendte felter op til tre felter væk. Grav her for at få guldet frem.', 'Your metal detector senses hidden gold on known tiles up to three tiles away. Dig here to reveal it.')} style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultGuld ?? 0) / 80});" />
                            {/if}
                            {#if erUdforsket && harKvist && erIndenForPejling && (felt.skjultLiv ?? 0) > 0}
                                <img src="/tiles/livtaage.webp" alt="" class="mist-icon" data-help-title={tekst('Rodspor', 'Root trace')} data-help-body={harRunekvist ? tekst('Runekvisten mærker helende rødder på kendte felter op til tre felter væk. Mangler du HP, trækker den rødderne op, når du går ind på feltet.', 'The rune rod senses healing roots on known tiles up to three tiles away. If you are missing HP, it pulls up the roots when you enter the tile.') : tekst('Søgekvisten mærker helende rødder på kendte felter op til tre felter væk. Grav her for at finde dem.', 'The dowsing rod senses healing roots on known tiles up to three tiles away. Dig here to find them.')} style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultLiv ?? 0) / 40});" />
                            {/if}
                        {/if}
                        
                        {#if erUdforsket && felt.gravet}
                            <img src="/tiles/udgravning.webp" alt="" class="dug-image" data-help-title={tekst('Udgravning', 'Dig site')} data-help-body={tekst('Feltet er allerede gravet op. Her er ingen skjulte fund eller fælder tilbage.', 'This tile has already been dug up. No hidden finds or traps remain.')} />
                        {/if}

                        {#if erUdforsket && felt.tomSkattekiste}
                            <img src="/tiles/empty_treasure.webp" alt={tekst('Tom skattekiste', 'Empty treasure chest')} class="empty-treasure-icon" data-help-title={tekst('Tom skattekiste', 'Empty treasure chest')} data-help-body={tekst('Skatten er taget. Den tomme kiste viser kun, hvor den lå.', 'The treasure is gone. The empty chest only marks where it once lay.')} />
                        {/if}
                        
                        {#if erUdforsket && felt.hasGoldmine}
                            <div class="goldmine-container" data-help-title={tekst('Guldmine', 'Gold mine')} data-help-body={felt.mineOwner ? tekst(`Guldminen ejes af ${felt.mineOwner}. Ejeren får score, og andre kan forsøge at overtage den, hvis den ikke er låst.`, `The gold mine is owned by ${felt.mineOwner}. The owner gets score, and others can try to take it over if it is not locked.`) : tekst('Guldmine giver guld og score, når du overtager den. Besøg den igen for at låse den.', 'A gold mine gives gold and score when you take it over. Visit it again to lock it.')}>
                                <img src="/tiles/goldmine.webp" alt={tekst('Guldmine', 'Gold mine')} class="goldmine-icon" />
                                {#if felt.mineOwner}
                                    <div class="owner-badge" class:locked={felt.mineLocked}>
                                        <img src={felt.mineOwner === spilTilstand.spillerNavn ? spilTilstand.valgtKarakter?.ikon : (spilTilstand.alleSpillere[felt.mineOwner]?.ikon || '/tiles/player.webp')} alt={tekst('Ejer', 'Owner')} class="mine-owner-portrait" data-help-title={tekst('Minens ejer', 'Mine owner')} data-help-body={tekst(`${felt.mineOwner} ejer minen.`, `${felt.mineOwner} owns the mine.`)} />
                                        {#if felt.mineLocked}
                                            <span class="lock-icon" data-help-title={tekst('Låst mine', 'Locked mine')} data-help-body={tekst('Minen er låst af ejeren og kan ikke overtages lige nu.', 'The mine is locked by the owner and cannot be taken over right now.')}>🔒</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        {#if erUdforsket && felt.eventID && !felt.eventFuldført}
                            {#if felt.eventID === 'campfire'}
                                <img src="/tiles/campfire.webp" alt="" class="campfire-icon" data-help-title={tekst('Lejrbål', 'Campfire')} data-help-body={tekst('Ved lejrbålet venter en hændelse eller et hvilested. Gå ind på feltet for at se, hvad der sker.', 'An encounter or a place to rest awaits at the campfire. Enter the tile to see what happens.')} />
                            {:else if felt.eventID !== 'meteor_skat'}
                                <img src="/tiles/event.png" alt="" class="event-crystal" data-help-title={tekst('Hændelse', 'Encounter')} data-help-body={tekst('Noget venter på dette felt. Når du går ind, møder du en situation med et valg.', 'Something is waiting on this tile. Enter it to face a situation and make a choice.')} />
                            {/if}
                        {/if}

                        {#if erUdforsket && felt.hasPortal && !(felt.eventID && !felt.eventFuldført)}
                            <img src="/tiles/portal.webp" alt={tekst('Portal', 'Portal')} class="portal-icon" data-help-title={tekst('Portal', 'Portal')} data-help-body={tekst('Portalen slynger dig 4, 5 eller 6 felter mod øst. Det, der venter på landingsfeltet, rammer dig med det samme.', 'The portal throws you 4, 5 or 6 tiles east. Whatever awaits on the landing tile affects you immediately.')} />
                        {/if}

                        {#if erUdforsket && harKoebbarShop(felt)}
                            <img 
                                src="/tiles/{felt.biome === 'by' ? 'byshop.webp' : 'markedshop.webp'}" 
                                alt="" 
                                class="shop-icon" 
                                data-help-title={felt.biome === 'by' ? tekst('Bybutik', 'Town shop') : tekst('Marked', 'Market')}
                                data-help-body={tekst("Butikken sælger dagens varer for guld. Spillerne deles om varerne, og de faste varer kommer igen næste dag. Har du kølle eller murknuser, handler købmanden kun med dig én gang.", "The shop sells today's goods for gold. Players share the goods, and the regular stock returns the next day. If you have a club or wallbreaker, the merchant only trades with you once.")}
                                onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} 
                            />
                        {/if}

                        {#if erUdforsket && felt.hasWorkshop && !felt.taageLukketVaerksted}
                            <img
                                src="/tiles/vaerksted.webp"
                                alt=""
                                class="workshop-icon"
                                data-help-title={tekst('Værksted', 'Workshop')}
                                data-help-body={tekst('Værkstedet opgraderer dit udstyr og erstatter den gamle genstand med den nye. Har du kølle eller murknuser, arbejder mesteren kun for dig én gang.', 'The workshop upgrades your equipment and replaces the old item with the new one. If you have a club or wallbreaker, the master only works for you once.')}
                            />
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.indbrudt && felt.biome === 'by'}
                            <span class="indbrud-marker" aria-label={tekst('Indbrudt', 'Burgled')} data-help-title={tekst('Indbrud', 'Burglary')} data-help-body={tekst('Låsen markerer, at der allerede har været indbrud.', 'The lock shows that a burglary has already happened here.')}>
                                <img src="/tiles/openlock.webp" alt="" class="indbrud-icon" />
                            </span>
                        {/if}

                        {#if erUdforsket && gravstenListeForFelt(felt).length > 0}
                            {@const senesteGravsten = senesteGravstenForFelt(felt)}
                            <div class="gravsten-lille">
                                <img src="/tiles/gravsted.webp" alt="" class="gravsten-lille-ikon" />
                                {#if senesteGravsten[0]}
                                    <img src={senesteGravsten[0].ikon} alt="" class="gravsten-lille-portraet" />
                                {/if}
                            </div>
                            <div class="gravsten-tekster">
                                {#each senesteGravsten as minde}
                                    <span>{minde.navn}: {minde.dag > 0 ? tekst(`Dag ${minde.dag}`, `Day ${minde.dag}`) : tekst('Dag ?', 'Day ?')}</span>
                                {/each}
                            </div>
                        {/if}
                        
                        {#if erUdforsket}
                            {@const farvelBaade = farvelBaadeForFelt(i)}
                            {#if farvelBaade.length > 0}
                                <div class="farvel-baade-container">
                                    {#each farvelBaade as farvel, farvelNr (farvel.navn)}
                                    <span class="farvel-baad" data-help-title={tekst('Farvelbåd', 'Farewell boat')} data-help-body={tekst(`${farvel.navn} slap væk fra øen her. Båden bliver stående som et minde, indtil øen begynder forfra.`, `${farvel.navn} escaped the island here. The boat remains as a memorial until the island begins again.`)} style="--farvel-offset: {(farvelNr - (farvelBaade.length - 1) / 2) * 18}px;">
                                            <img src="/tiles/baad.webp" alt="" class="farvel-baad-ikon" />
                                            <img src={farvel.ikon} alt={tekst('Sluppet væk', 'Escaped')} class="farvel-baad-portraet" />
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        {/if}

                        {#each Object.entries(spilTilstand.alleSpillere) as [navn, mod] (navn)}
                            {#if navn !== spilTilstand.spillerNavn && mod.index === i && !mod.isDead && !mod.isWinner}
                                {@const afstand = regnHexAfstand(spilTilstand.spillerIndex, mod.index, kortBredde)}
                                {@const tracket = erTrackerAktivPaa(navn)}
                                {@const synlig = afstand <= aktuelSynsRadius || tracket}
                                <span class="modstander-icon" data-help-title={synlig ? navn : tekst('Ukendt spiller', 'Unknown player')} data-help-body={synlig ? tekst(`${navn} står på dette felt.`, `${navn} is standing on this field.`) : (mod.activeAlarm ? tekst('Du kan høre en anden spillers alarm her, men du kan ikke se, hvem det er.', 'You can hear another player\'s alarm here, but you cannot see who it is.') : tekst('En spiller er tæt på, men uden for dit syn.', 'A player is nearby, but outside your vision.'))} class:alarm-aktiv={mod.activeAlarm && !synlig} class:skjult-lyd={!synlig && !mod.activeAlarm} class:tracker-aktiv={tracket}>
                                    <img src={synlig ? (mod.ikon || '/tiles/player.webp') : '/tiles/player.webp'} alt="" style="height: {synlig ? '58px' : '70px'};" />
                                </span>
                            {/if}
                        {/each}

                        {#if spilTilstand.spillerIndex === i && sejlendeBaadIndex !== i && spilTilstand.gameState !== 'dead' && spilTilstand.gameState !== 'win'}
                            <span class="player-icon" data-help-title={tekst('Dig', 'You')} data-help-body={tekst('Din karakter står her. Tryk på nabofelter for at bevæge dig.', 'Your character is standing here. Tap neighboring fields to move.')} style="position: relative; display: inline-flex; justify-content: center; z-index: 20;">
                                <img src={spilTilstand.valgtKarakter?.ikon} alt="" style="height: 58px;" />
                            </span>
                        {/if}

                        {#each spilTilstand.aktiveTal || [] as tal (tal.id)}
                            {#if tal.feltIndex === i}
                                <div class="flydende-tal {tal.tekst.startsWith('-') ? 'skade' : 'gevinst'}" style="margin-left: {tal.offsetX}px; margin-bottom: {tal.offsetY}px;">
                                    {tal.tekst}
                                </div>
                            {/if}
                        {/each}

                        {#if energiPris !== null}
                            <span class="move-energy-cost" aria-hidden="true">{energiPris}</span>
                        {/if}
                    </div>
                </div>

                {#if sejlendeBaadIndex === i}
                    <div class="sailing-container" data-help-title={tekst('Afrejse', 'Departure')} data-help-body={tekst('Du er på vej væk fra øen. Om lidt ser du resultatet.', 'You are leaving the island. Your result will appear shortly.')} style="left: {posX}px; top: {posY}px;">
                        <img src="/tiles/baad.webp" alt={tekst('Flugtbåd', 'Escape boat')} class="escape-boat" />
                        <img src={spilTilstand.valgtKarakter?.ikon} alt="" class="sejler-ikon" />
                    </div>
                {/if}
            {/each}

            {#if skattekortLinjer.length > 0}
                <svg class="skattekort-linje-canvas" aria-hidden="true">
                    {#each skattekortCirkler as cirkel (cirkel.id)}
                        <circle
                            cx={cirkel.center.x}
                            cy={cirkel.center.y}
                            r={cirkel.radius}
                            class="skattekort-cirkel"
                        />
                    {/each}
                    {#each skattekortLinjer as linje (linje.id)}
                        <line
                            x1={linje.fra.x}
                            y1={linje.fra.y}
                            x2={linje.til.x}
                            y2={linje.til.y}
                            class="skattekort-linje"
                        />
                    {/each}
                </svg>

                {#each spilTilstand.gitter as felt, i (i)}
                    {@const raekke = Math.floor(i / kortBredde)}
                    {@const kolonne = i % kortBredde}
                    {@const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0)}
                    {@const posY = raekke * ROW_H}
                    {@const erUdforsket = spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(i)}
                    {@const erOpslugt = !spilTilstand.devVisHeleKort && erFeltITaagen(spilTilstand.gitter, i, spilTilstand.fogX, kortBredde)}
                    {#if erUdforsket && !erOpslugt && felt.eventID && !felt.eventFuldført}
                        {#if felt.eventID === 'campfire'}
                            <img src="/tiles/campfire.webp" alt="" class="campfire-icon skattekort-ikon-overlag" aria-hidden="true" style="left: {posX + HEX_W / 2}px; top: {posY + 55}px;" />
                        {:else if felt.eventID !== 'meteor_skat'}
                            <img src="/tiles/event.png" alt="" class="event-crystal skattekort-ikon-overlag" aria-hidden="true" style="left: {posX + HEX_W / 2}px; top: {posY + 55}px;" />
                        {/if}
                    {/if}
                {/each}
            {/if}

            {#if baadLinjer.length > 0}
                <svg class="baad-linje-canvas" aria-hidden="true">
                    {#each baadLinjer as linje (linje.id)}
                        <line
                            x1={linje.fra.x}
                            y1={linje.fra.y}
                            x2={linje.til.x}
                            y2={linje.til.y}
                            class="baad-linje"
                        />
                    {/each}
                </svg>
            {/if}

            {#if spilTilstand.gameState === 'win_map' || spilTilstand.gameState === 'dead_map'}
                <svg class="rute-canvas">
                    {#each Object.entries(spilTilstand.alleSpillere) as [navn, data] (navn)}
                        {#if navn === spilTilstand.spillerNavn}
                            {#each bygGamleRuteSegmenter(data.tidligereHistorik || []) as segment (segment.noegle)}
                                {@const spor = gammeltRuteSporStil(segment.antal)}
                                <line
                                    x1={segment.fra.x}
                                    y1={segment.fra.y}
                                    x2={segment.til.x}
                                    y2={segment.til.y}
                                    stroke="rgb(255, 255, 255)"
                                    stroke-opacity={spor.opacity}
                                    stroke-width={spor.bredde}
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class:flugtrute-gammel-staerk={segment.antal >= 8}
                                    class="flugtrute-gammel"
                                />
                            {/each}
                        {/if}

                        {#if data.historik && data.historik.length > 1}
                            {@const pointsArray = data.historik.map((idx: number) => {
                                const raekke = Math.floor(idx / kortBredde);
                                const kolonne = idx % kortBredde;
                                const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2);
                                const posY = raekke * ROW_H + 55;
                                return {x: posX, y: posY};
                            })}
                            {@const points = pointsArray.map(p => `${p.x},${p.y}`).join(' ')}
                            {@const startPoint = pointsArray[0]}
                            {@const endPoint = pointsArray[pointsArray.length - 1]}
                            {@const erMig = navn === spilTilstand.spillerNavn}
                            
                            <polyline 
                                points={points} 
                                fill="none" 
                                stroke={erMig ? '#ffffff' : 'rgba(192, 238, 78, 0.82)'} 
                                stroke-width={erMig ? "8" : "4"}
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class={erMig ? 'flugtrute' : 'flugtrute flugtrute-modspiller'}
                            />
                            
                            <image 
                                href={data.ikon || '/tiles/player.webp'} 
                                x={startPoint.x - 20} 
                                y={startPoint.y - 20} 
                                width="40" 
                                height="40" 
                                class="rute-start-icon" 
                                opacity={erMig ? "1" : "0.5"}
                            />

                            <image 
                                href={data.ikon || '/tiles/player.webp'} 
                                x={endPoint.x - 25} 
                                y={endPoint.y - 25} 
                                width="50" 
                                height="50" 
                                class="rute-end-icon" 
                                opacity={erMig ? "1" : "0.8"}
                            />
                        {/if}
                    {/each}
                </svg>
            {/if}

            {#each spilTilstand.aktiveEnergiTal || [] as tal (tal.id)}
                {@const punkt = energiAnimationPunkt({ ...tal, ruteAndel: 0.5 })}
                <div
                    class="flyvende-energi-tal"
                    style="left: {punkt.x}px; top: {punkt.y}px;"
                >
                    {tal.antal}
                </div>
            {/each}
        </div>
    </div>
</div>

{#if inspectAktiv && inspectCursor.synlig}
    <div
        class="inspect-cursor-follow"
        style="left: {inspectCursor.x}px; top: {inspectCursor.y}px;"
        aria-hidden="true"
    >
        <svg viewBox="0 0 64 64">
            <path class="cursor-pil" d="M5 4l17 12-8.1 2.2 5.5 10.2-5 2.6-5.4-10.2-5.8 6.1z" />
            <g class="cursor-spoergsmaal" transform="translate(9 -7) scale(0.78)">
                <path d="M18 18a6.5 6.5 0 0 1 12.2 3.2c0 5.8-6.2 5.5-6.2 11" />
                <circle cx="24" cy="38" r="1.8" />
            </g>
        </svg>
    </div>
{/if}

{#if inspectBoble}
    <div
        class="inspect-boble"
        style="left: {inspectBoble.x}px; top: {inspectBoble.y}px;"
        role="dialog"
        aria-live="polite"
    >
        <h3>{inspectBoble.titel}</h3>
        <p>{inspectBoble.tekst}</p>
    </div>
{/if}

{#if introAktiv}
    <div class="intro-overlay">
        <div class="intro-box">
            <div class="intro-media">
                <video autoplay muted playsinline aria-label={tekst('Startvideo', 'Start video')}>
                    <source src="/video/start_video.mp4" type="video/mp4" />
                </video>
                <div class="intro-taage"></div>
            </div>
            <h2>{tekst('Dag 1', 'Day 1')}</h2>
        <p>
            {tekst(
                `Du er drevet i land på kysten af ${formaterOeNavn()}. Tågen ligger bag dig og venter på at omslutte dig. Du må prøve at finde en båd på den anden side af ${formaterOeNavn()}.`,
                `You have washed ashore on the coast of ${formaterOeNavn()}. The fog waits behind you, ready to swallow you. Try to find a boat on the far side of ${formaterOeNavn()}.`
            )}
        </p>
            <button type="button" class="intro-knap" onclick={afslutIntro}>{tekst('Gå i land', 'Go ashore')}</button>
        </div>
    </div>
{/if}

{#if eventState.aktivt} <EventModal lukEvent={lukEventOgShop} /> {/if}
{#if spilTilstand.aktivShop} <ShopModal lukShop={lukEventOgShop} /> {/if}
{#if spilTilstand.aktivVaerksted} <WorkshopModal lukVaerksted={lukEventOgShop} /> {/if}
{#if spilTilstand.venteSpilAktiv} <VenteModal kanSpilleIgen={spilTilstand.dag > hentLangsomsteDag() && !erVenteTidUdlobet(venteUrTick)} /> {/if}

{#if spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win_map'}
    <div class="slut-panel" class:vundet={spilTilstand.gameState === 'win_map'}>
        <div class="slut-header">
            <h2>{spilTilstand.gameState === 'win_map' ? tekst('Du slap væk', 'You escaped') : tekst('Du døde', 'You died')}</h2>
            <p>{spilTilstand.logBesked}</p>
        </div>
        
        <div class="rangliste">
            {#each hentKortRangliste() as { navn, data, score } (navn)}
                <div class="raekke" class:mig={navn === spilTilstand.spillerNavn}>
                    <img src={data.ikon || '/tiles/player.webp'} alt="" />
                    <div class="info">
                        <strong>{navn}</strong>
                        <span>{data.isWinner ? tekst('Sluppet væk', 'Escaped') : (data.isDead ? (data.deathCause ? tekst(`Død i ${data.deathCause === 'vand' ? 'vand' : 'tåge'}`, `Dead in ${data.deathCause === 'vand' ? 'water' : 'fog'}`) : tekst('Død', 'Dead')) : tekst('I tågen', 'In the fog'))}</span>
                    </div>
                    <div class="stats">
                        <span title="Score">{score}</span>
                        <span title={tekst('Guld', 'Gold')}>🪙 {data.guld}</span>
                    </div>
                </div>
            {/each}
        </div>

        <button class="log-ikon-btn" onclick={() => visDoedsLog = true} title={tekst('Læs din fulde log', 'Read your full log')}>
            <img src="/ui/log_ikon.webp" alt={tekst('Log', 'Log')} />
            <span>{tekst('Logbog', 'Logbook')}</span>
        </button>

        <button class="se-resultat-btn" onclick={() => spilTilstand.gameState = spilTilstand.gameState === 'win_map' ? 'win' : 'dead'}>
            {tekst('Se point-fordeling', 'See score breakdown')}
        </button>

    </div>
{/if}

{#if visDoedsLog}
    <div class="log-modal-overlay" onclick={() => visDoedsLog = false} role="presentation">
        <div class="log-modal" onclick={(e) => e.stopPropagation()} role="presentation">
            <h3>{tekst('Logbog', 'Logbook')}</h3>
            <div class="log-liste">
                {#each rensedeLogLinjer as linje, index (index)}
                    <p>{linje}</p>
                {/each}
            </div>
            <button class="luk-log-btn" onclick={() => visDoedsLog = false}>{tekst('Luk', 'Close')}</button>
        </div>
    </div>
{/if}

<style>
    :global(:root) { --camera-center-y: 50dvh; }
    @media (max-width: 700px) {
        :global(:root) { --camera-center-y: calc((100dvh - 128px) / 2); }

        .intro-box {
            padding: 16px;
        }

        .intro-box h2 {
            font-size: 1.5rem;
        }

        .intro-box p {
            font-size: 0.95rem;
        }

        .game-help-actions {
            top: 10px;
            right: 10px;
        }

        .zoom-actions {
            display: flex;
            top: calc(env(safe-area-inset-top, 0px) + 64px);
            right: 10px;
        }

        .tutorial-panel {
            top: auto;
            left: 10px;
            right: 10px;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 146px);
            width: auto;
            grid-template-columns: auto minmax(0, 1fr);
            padding: 11px 12px;
        }

        .top-ikon-knap {
            width: 42px;
            height: 42px;
            font-size: 1.55rem;
        }
    }

    .game-container { position: fixed; inset: 0; width: 100vw; height: 100dvh; overflow: hidden; background: #000; user-select: none; -webkit-user-select: none; }
    .game-container.inspect-mode {
        cursor: none;
    }
    .game-container.inspect-mode [data-help-title] {
        cursor: none;
        pointer-events: auto;
    }
    .inspect-cursor-follow {
        position: fixed;
        z-index: 4200;
        width: 64px;
        height: 64px;
        transform: translate(1px, 1px);
        pointer-events: none;
        filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.95));
    }
    .inspect-cursor-follow svg {
        width: 64px;
        height: 64px;
        overflow: visible;
    }
    .inspect-cursor-follow .cursor-pil {
        fill: #f5f5ee;
        stroke: #050505;
        stroke-width: 1.8;
        stroke-linejoin: round;
    }
    .inspect-cursor-follow .cursor-spoergsmaal path {
        fill: none;
        stroke: #ffd66f;
        stroke-width: 3.1;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    .inspect-cursor-follow .cursor-spoergsmaal circle {
        fill: #ffd66f;
        stroke: none;
    }
    .game-container img {
        -webkit-user-drag: none;
        user-select: none;
        -webkit-user-select: none;
    }
    .game-help-actions {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 14px);
        right: 14px;
        z-index: 2100;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .tutorial-panel {
        position: fixed;
        top: clamp(96px, calc(50dvh - 310px), 250px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 2120;
        width: min(620px, calc(100vw - 132px));
        min-height: 86px;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: start;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid rgba(245, 208, 113, 0.45);
        border-radius: 8px;
        background: rgba(14, 18, 16, 0.9);
        color: #f5efe2;
        box-shadow: 0 16px 42px rgba(0, 0, 0, 0.48);
        pointer-events: auto;
    }
    .tutorial-luk-knap {
        position: absolute;
        top: 7px;
        right: 8px;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        color: #f5efe2;
        font: 700 1.35rem/1 system-ui, sans-serif;
        cursor: pointer;
    }
    .tutorial-luk-knap:hover,
    .tutorial-luk-knap:focus-visible {
        background: rgba(195, 65, 53, 0.4);
        outline: 2px solid #ffd66f;
        outline-offset: 1px;
    }
    .tutorial-aabn-knap {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 7px 11px;
        border: 1px solid rgba(245, 208, 113, 0.55);
        border-radius: 999px;
        background: rgba(14, 18, 16, 0.9);
        color: #fff8e8;
        font: 700 0.78rem/1 'Cinzel', Georgia, serif;
        cursor: pointer;
        box-shadow: 0 5px 18px rgba(0, 0, 0, 0.36);
    }
    .tutorial-aabn-knap > span:first-child {
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(195, 65, 53, 0.3);
        color: #ffd66f;
        font-family: system-ui, sans-serif;
        font-size: 0.95rem;
    }
    .tutorial-aabn-knap:hover,
    .tutorial-aabn-knap:focus-visible {
        border-color: #ffd66f;
        background: rgba(35, 40, 35, 0.96);
        outline: 2px solid rgba(255, 214, 111, 0.45);
        outline-offset: 2px;
    }
    .tutorial-progress {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(195, 65, 53, 0.55);
        background: rgba(195, 65, 53, 0.18);
        color: #ffd66f;
        font-weight: 800;
        font-size: 0.82rem;
        white-space: nowrap;
    }
    .tutorial-copy {
        min-width: 0;
        padding-right: 28px;
    }
    .tutorial-copy h2 {
        margin: 0 0 4px;
        color: #fff8e8;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1rem;
        line-height: 1.15;
    }
    .tutorial-copy p {
        margin: 0;
        color: #ddd2bd;
        font-size: 0.88rem;
        line-height: 1.28;
    }
    .tutorial-copy .tutorial-detail {
        margin-top: 8px;
        color: #e5dbc7;
    }
    .tutorial-points {
        margin: 8px 0 0;
        padding-left: 18px;
        color: #e9dfcc;
        font-size: 0.84rem;
        line-height: 1.28;
    }
    .tutorial-points li + li {
        margin-top: 4px;
    }
    .tutorial-copy .tutorial-more {
        margin-top: 8px;
        color: #b9cbbf;
        font-size: 0.82rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 8px;
    }
    @media (max-width: 700px) {
        .tutorial-panel {
            top: auto;
            left: 10px;
            right: 10px;
            transform: none;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 146px);
            width: auto;
            grid-template-columns: auto minmax(0, 1fr);
            padding: 11px 12px;
        }

    }
    .top-ikon-knap {
        width: 48px;
        height: 48px;
        border: none;
        background: transparent;
        color: #f4f4f4;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.25rem;
        line-height: 1;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
        transition: transform 0.2s, color 0.2s, text-shadow 0.2s;
    }
    .top-ikon-svg {
        width: 34px;
        height: 34px;
        overflow: visible;
        fill: none;
        stroke: #e2ebe7;
        stroke-width: 3.1;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.72));
    }
    .inspect-ikon circle {
        fill: #e2ebe7;
        stroke: none;
    }
    .inspect-ikon {
        width: 37px;
        height: 37px;
    }
    .inspect-knap {
        position: relative;
    }
    .inspect-knap.aktiv .inspect-ikon {
        stroke: #ffd66f;
        filter: drop-shadow(0 0 10px rgba(255, 214, 111, 0.75)) drop-shadow(0 3px 5px rgba(0, 0, 0, 0.72));
    }
    .inspect-knap.aktiv .inspect-ikon circle {
        fill: #ffd66f;
    }
    .inspect-knap.aktiv::after {
        content: '';
        position: absolute;
        inset: 2px;
        border: 1.5px solid rgba(255, 214, 111, 0.88);
        border-radius: 999px;
        box-shadow: 0 0 12px rgba(255, 214, 111, 0.38);
        pointer-events: none;
        animation: inspect-svaj 2.4s ease-in-out infinite;
    }
    @keyframes inspect-svaj {
        0%, 100% {
            transform: rotate(-2deg) scale(0.98);
            opacity: 0.76;
        }
        50% {
            transform: rotate(2deg) scale(1.03);
            opacity: 1;
        }
    }
    .top-ikon-knap:hover,
    .top-ikon-knap.aktiv {
        color: #fff;
        transform: scale(1.04);
        text-shadow: 0 0 14px rgba(255, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.95);
    }
    .inspect-boble {
        position: fixed;
        z-index: 4300;
        width: min(280px, calc(100vw - 24px));
        max-height: min(52dvh, 260px);
        overflow-y: auto;
        box-sizing: border-box;
        padding: 14px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 8px;
        background: rgba(20, 20, 20, 0.94);
        color: #f2f2f2;
        box-shadow: 0 18px 55px rgba(0,0,0,0.62);
        cursor: auto;
    }
    .inspect-boble h3 {
        margin: 0 0 7px;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.05rem;
        letter-spacing: 0;
    }
    .inspect-boble p {
        margin: 0;
        color: #d9d9d9;
        font-size: 0.92rem;
        line-height: 1.4;
        white-space: pre-line;
    }
    .zoom-actions {
        position: fixed;
        right: 14px;
        top: calc(env(safe-area-inset-top, 0px) + 72px);
        z-index: 2100;
        display: none;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
    }
    .zoom-actions button {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: rgba(12, 14, 14, 0.78);
        color: #fff;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        touch-action: manipulation;
    }
    .camera { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
    .map { position: absolute; top: 0; left: 0; }

    .intro-overlay {
        position: fixed;
        inset: 0;
        z-index: 2600;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.92);
        font-family: system-ui, -apple-system, sans-serif;
    }
    .intro-box {
        width: min(760px, 92vw);
        max-height: 92dvh;
        overflow-y: auto;
        background: #151515;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        padding: 24px;
        box-sizing: border-box;
        text-align: center;
        color: white;
    }
    .intro-media {
        position: relative;
        overflow: hidden;
        border-radius: 6px;
        background: #050706;
        margin-bottom: 20px;
    }
    .intro-media video {
        width: 100%;
        aspect-ratio: 16 / 9;
        display: block;
        margin: 0 auto;
        object-fit: cover;
        filter: saturate(0.9) contrast(0.98);
    }
    .intro-taage {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(90deg, rgba(176, 205, 186, 0.25), transparent 35%, rgba(19, 24, 22, 0.75)),
            radial-gradient(circle at 15% 45%, rgba(195, 230, 208, 0.38), transparent 32%);
        pointer-events: none;
    }
    .intro-box h2 {
        margin: 0 0 12px;
        font-family: 'Cinzel', serif;
        font-size: 2rem;
    }
    .intro-box p {
        max-width: 620px;
        margin: 0 auto 22px;
        color: #ddd;
        line-height: 1.55;
        font-size: 1.05rem;
    }
    .intro-knap {
        min-width: 180px;
        padding: 12px 20px;
        border: 1px solid #777;
        border-radius: 6px;
        background: #2a2a2a;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
    }
    .intro-knap:hover {
        background: #383838;
    }

    .hex { 
        position: absolute; width: 96px; height: 110px;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); 
        background-size: cover;
    }
    .hex.katastrofe-venter {
        filter: brightness(0.9) saturate(0.85);
    }
    .hex.katastrofe-venter::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 30;
        pointer-events: none;
        background: radial-gradient(circle at 50% 50%, rgba(255, 240, 180, 0.18), rgba(0, 0, 0, 0) 62%);
        animation: feltVenterKatastrofe 0.9s ease-in-out infinite alternate;
    }
    .hex.skattekort-rygte {
        background-image: none;
        opacity: 1;
    }
    .hex.skattekort-rygte .inner::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
            linear-gradient(rgba(226, 163, 66, 0.46), rgba(139, 75, 24, 0.36)),
            var(--rygte-bg);
        background-size: cover;
        filter: sepia(0.62) saturate(1.35) hue-rotate(-8deg) brightness(0.92) contrast(1.03);
        opacity: 0.92;
    }
    .hex.unexplored { background-color: #000; }
    .inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

    .move-energy-cost {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #8ee8ff;
        font-family: 'Cinzel', serif;
        font-size: 1.15rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0;
        pointer-events: none;
        text-shadow: 0 0 7px rgba(87, 218, 255, 0.95), 0 0 14px rgba(55, 160, 255, 0.55), 0 2px 4px rgba(0, 0, 0, 0.95);
        transform: translate(-50%, -50%);
    }
    
    .crop-icon {
        position: absolute; bottom: 22px; right: 18px; width: 40px; height: auto;
        z-index: 11; pointer-events: none; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.8));
    }
    .crop-icon.moden { width: 40px; bottom: 20px; right: 15px; z-index: 12; }
    
    .meteor-stone-icon {
        position: absolute; bottom: 38%; left: 50%; transform: translateX(-50%);
        height: 50px; z-index: 13; pointer-events: none; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    .meteor-stone-icon-taage {
        opacity: 0.85;
        filter: grayscale(0.25) brightness(0.85) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    .taageblokker-icon {
        position: absolute;
        width: 54px;
        height: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 14;
        pointer-events: none;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.8)) saturate(0.8);
        opacity: 0.92;
    }
    .sailing-container {
        position: absolute; width: 96px; height: 110px; z-index: 100; display: flex;
        justify-content: center; align-items: center;
        animation: sailAway 3s forwards cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sejler-ikon { height: 40px; position: relative; z-index: 2; margin-bottom: 15px; }
    @keyframes sailAway {
        0% { transform: translateX(0) scale(1); opacity: 1; }
        100% { transform: translateX(300px) scale(0.5); opacity: 0; }
    }
    
    .escape-boat {
        position: absolute; width: 75px; height: auto; top: 50%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 15; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    .escape-boat.boat-1 { transform: translate(-68%, -54%) scale(0.88) rotate(-7deg); z-index: 14; }
    .escape-boat.boat-2 { transform: translate(-32%, -47%) scale(0.88) rotate(7deg); z-index: 16; }
    .escape-boat.boat-3 { transform: translate(-50%, -28%) scale(0.78) rotate(2deg); z-index: 13; }
    .boat-count {
        position: absolute;
        left: 57%;
        top: 62%;
        z-index: 17;
        color: #fff6d8;
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 1rem;
        text-shadow: 0 2px 5px #000, 0 0 8px #000;
        pointer-events: none;
    }
    .sejr-lys {
        position: absolute; width: 100%; height: 100%;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(255, 180, 0, 0.5) 70%, rgba(255, 215, 0, 0.9) 100%);
        mix-blend-mode: color-dodge; pointer-events: none; z-index: 5;
        animation: guldPuls 2.5s infinite alternate ease-in-out;
    }
    @keyframes guldPuls {
        0% { opacity: 0.4; filter: brightness(1); }
        100% { opacity: 1; filter: brightness(1.6); }
    }
    
    .mist-icon {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        pointer-events: none; width: 50px; z-index: 12;
    }
    .treasure-mark-icon {
        position: absolute; width: 35px; height: auto; top: 65%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 13; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .jordskreds-skat-icon {
        top: 45%;
        z-index: 15;
        filter: sepia(45%) saturate(1.25) drop-shadow(0 0 7px rgba(255, 222, 125, 0.95)) drop-shadow(0 3px 5px rgba(0,0,0,0.9));
    }
    .dug-image {
        position: absolute; width: 90px; height: 52px; top: 58%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 10;
    }
    .empty-treasure-icon {
        position: absolute; width: 70px; height: auto; top: 38%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 11; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    
    .goldmine-container {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -45%);
        width: 80px; z-index: 12; pointer-events: none; display: flex; justify-content: center; align-items: center;
    }
    .goldmine-icon { width: 100%; height: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); }
    .owner-badge { position: absolute; bottom: -5px; right: -5px; z-index: 13; }
    .owner-badge .mine-owner-portrait {
        width: 34px; height: 34px; border-radius: 50%; border: 2px solid #ffcc00; 
        background: #111; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.9);
    }
    .owner-badge.locked .mine-owner-portrait { border-color: #ff4444; }
    .lock-icon { position: absolute; bottom: -5px; left: -10px; font-size: 18px; filter: drop-shadow(0 2px 2px black); }

    .skattekort-linje-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 8;
        overflow: visible;
    }

    .skattekort-linje {
        stroke: rgba(210, 58, 42, 0.56);
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-dasharray: 5 7;
    }

    .skattekort-cirkel {
        fill: none;
        stroke: rgba(210, 58, 42, 0.56);
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-dasharray: 5 7;
    }

    .baad-linje-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 28;
        overflow: visible;
    }

    .baad-linje {
        stroke: rgba(255, 255, 255, 0.42);
        stroke-width: 1.2;
        stroke-linecap: round;
        stroke-dasharray: 8 10;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.45));
    }

    .rute-canvas {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 18; overflow: visible;
    }
    .flugtrute {
        animation: tegnRute 3s linear forwards;
        filter:
            drop-shadow(0 0 3px rgba(255,255,255,0.95))
            drop-shadow(0 0 10px rgba(255,255,255,0.62))
            drop-shadow(0 0 18px rgba(255,255,255,0.28));
    }
    .flugtrute-modspiller { filter: drop-shadow(0 0 6px rgba(190, 238, 78, 0.55)); }
    .flugtrute-gammel { pointer-events: none; }
    .flugtrute-gammel-staerk { filter: drop-shadow(0 0 4px rgba(255,255,255,0.18)); }
    @keyframes tegnRute { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
    
    .rute-end-icon {
        animation: fadeInIcon 0.5s 2.5s both;
        filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.9));
    }
    @keyframes fadeInIcon {
        from { opacity: 0; transform: scale(0); }
        to { opacity: 1; transform: scale(1); }
    }

    .event-crystal { height: 60px; animation: float 3s infinite ease-in-out; z-index: 15; position: relative; }
    .campfire-icon { position: absolute; width: 80px; height: 80px; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 14; }
    .skattekort-ikon-overlag {
        position: absolute;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 20;
        animation: none;
    }
    .portal-icon {
        position: absolute; width: 65px; height: 65px; z-index: 9; pointer-events: none;
        animation: portalPuls 2.5s infinite alternate ease-in-out;
    }
    @keyframes portalPuls {
        0% { transform: scale(0.95); filter: drop-shadow(0 0 5px rgba(0, 150, 255, 0.6)); }
        100% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(0, 220, 255, 1)) brightness(1.2); }
    }
    .shop-icon {
        position: absolute; width: 80px; height: 80px; top: 55%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 14;
        filter: drop-shadow(0 0 15px rgba(255, 165, 0, 0.9)) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    .workshop-icon {
        position: absolute; width: auto; height: 83px; top: calc(54% - 2px); left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 15;
        object-fit: contain;
        filter: drop-shadow(0 0 12px rgba(255, 210, 90, 0.85)) drop-shadow(0 5px 7px rgba(0,0,0,0.9));
    }
    .indbrud-marker {
        position: absolute;
        width: 74px;
        height: 74px;
        left: 50%;
        top: 64%;
        z-index: 17;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 239, 176, 0.72) 0%, rgba(255, 191, 74, 0.34) 48%, rgba(0, 0, 0, 0) 72%);
        filter: drop-shadow(0 5px 6px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 10px rgba(255, 220, 130, 0.7));
        transform: translate(-50%, -50%) rotate(-10deg);
    }
    .indbrud-icon {
        width: 58px;
        height: 58px;
        opacity: 0.98;
        filter: brightness(1.18) contrast(1.18);
    }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    
    .modstander-icon { position: absolute; top: 10px; z-index: 16; display: flex; justify-content: center; width: 100%; }
    .gravsten-lille {
        position: absolute;
        top: 56%;
        left: 50%;
        z-index: 13;
        width: 46px;
        height: 46px;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }
    .gravsten-lille-ikon {
        position: absolute;
        z-index: 1;
        width: 100%;
        height: auto;
        filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.85));
    }
    .gravsten-lille-portraet {
        position: relative;
        z-index: 2;
        width: 29px;
        height: auto;
        margin-top: -6px;
        opacity: 0.85;
        filter: grayscale(100%) sepia(10%) brightness(0.6) contrast(1.2);
    }
    .gravsten-tekster {
        position: absolute;
        top: 22px;
        left: 50%;
        z-index: 18;
        width: 84px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        pointer-events: none;
        color: #fff;
        font-size: 0.58rem;
        font-weight: 800;
        line-height: 1.15;
        text-align: center;
        text-shadow: 0 1px 2px #000, 0 0 4px #000;
    }
    .gravsten-tekster span {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .farvel-baade-container {
        position: absolute;
        left: 50%;
        bottom: 8px;
        width: 0;
        height: 42px;
        z-index: 12;
        pointer-events: none;
    }
    .farvel-baad {
        position: absolute;
        left: var(--farvel-offset, 0px);
        bottom: 0;
        width: 46px;
        height: 38px;
        transform: translateX(-50%);
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }
    .farvel-baad-ikon {
        position: absolute;
        bottom: 0;
        width: 48px;
        height: auto;
        filter: grayscale(100%) brightness(0.55) contrast(1.15) drop-shadow(0 3px 5px rgba(0,0,0,0.8));
        opacity: 0.62;
    }
    .farvel-baad-portraet {
        position: relative;
        z-index: 2;
        width: 25px;
        margin-bottom: 7px;
        filter: grayscale(100%) sepia(10%) brightness(0.62) contrast(1.18);
        opacity: 0.78;
    }
    
    .skjult-lyd img { opacity: 1; animation: whisper 2s infinite alternate; }
    .alarm-aktiv img { animation: alarmPuls 0.8s infinite alternate ease-in-out; }
    .tracker-aktiv img {
        filter: drop-shadow(0 0 8px rgba(126, 214, 255, 0.95)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9));
    }
    @keyframes alarmPuls {
        0% { transform: scale(1); filter: drop-shadow(0 0 2px white); }
        100% { transform: scale(1.1); filter: drop-shadow(0 0 10px orange) brightness(1.2); }
    }
    @keyframes whisper { 0% { opacity: 0.2; } 100% { opacity: 0.5; } }
    
    .flydende-tal {
        position: absolute; bottom: 50px; font-family: serif; font-weight: bold;
        animation: rise 3.4s forwards; pointer-events: none; z-index: 100;
    }
    @keyframes rise {
        0% { opacity: 0; transform: translateY(0); }
        18% { opacity: 1; transform: translateY(-5px); }
        100% { opacity: 0; transform: translateY(-34px); }
    }
    .flyvende-energi-kugle {
        position: absolute;
        width: 16px;
        height: 16px;
        z-index: 101;
        pointer-events: none;
        transform: translate(calc(-50% + var(--energi-x, 0px)), calc(-50% + var(--energi-y, 0px))) scale(1);
        filter: drop-shadow(0 0 6px rgba(255, 221, 97, 0.65));
        animation: energiKugleFlyv 1.15s ease-out forwards;
        animation-delay: var(--energi-delay, 0ms);
    }
    @keyframes energiKugleFlyv {
        0% {
            opacity: 0;
            transform: translate(calc(-50% + var(--energi-x, 0px)), calc(-50% + var(--energi-y, 0px) + 8px)) scale(0.72);
        }
        16% {
            opacity: 1;
            transform: translate(calc(-50% + var(--energi-x, 0px)), calc(-50% + var(--energi-y, 0px))) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--energi-x, 0px)), calc(-50% + var(--energi-y, 0px) - 58px)) scale(0.38);
        }
    }
    .flyvende-energi-tal {
        position: absolute;
        z-index: 220;
        pointer-events: none;
        color: #8ee8ff;
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 1.15rem;
        line-height: 1;
        text-shadow: 0 0 7px rgba(87, 218, 255, 0.95), 0 0 14px rgba(55, 160, 255, 0.55), 0 2px 4px rgba(0, 0, 0, 0.95);
        transform: translate(-50%, -50%);
        animation: energiTalFlyv 1.45s ease-in forwards;
    }
    @keyframes energiTalFlyv {
        0% { opacity: 0; transform: translate(-50%, calc(-50% + 8px)) scale(0.82); }
        18% { opacity: 1; transform: translate(-50%, calc(-50% - 2px)) scale(1); }
        100% { opacity: 0; transform: translate(-50%, calc(-50% - 48px)) scale(0.78); }
    }
    .opslugt { opacity: 0.8; filter: grayscale(0.8) brightness(0.6); }
    .opslugt.taageNiveau2 {
        opacity: 0.86;
        filter: grayscale(0.68) sepia(0.22) hue-rotate(126deg) saturate(1.08) brightness(0.47) contrast(1.13);
    }
    .opslugt.taageNiveau3 {
        opacity: 0.94;
        filter: grayscale(1) sepia(0.42) hue-rotate(-24deg) saturate(1.35) brightness(0.22) contrast(1.45) blur(0.7px);
    }

    .slut-panel {
        position: fixed; bottom: 20px; right: 20px; width: 350px; max-width: 90vw;
        background: rgba(20, 0, 0, 0.95); border: 2px solid #ff4444; border-radius: 8px;
        padding: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8); pointer-events: auto;
    }
    .slut-panel.vundet { background: rgba(30, 25, 0, 0.95); border-color: #ffcc00; }
    .slut-header { text-align: center; border-bottom: 1px solid #ff4444; padding-bottom: 15px; }
    .slut-panel.vundet .slut-header { border-color: #ffcc00; }
    .slut-header h2 { margin: 0 0 5px 0; color: #ff4444; font-family: 'Cinzel', serif; }
    .slut-panel.vundet .slut-header h2 { color: #ffcc00; }
    .slut-header p { margin: 0; color: #ddd; font-size: 0.9rem; line-height: 1.4; }

    .rute-start-icon {
        animation: fadeInIcon 0.5s 0.5s both;
        filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.9));
    }

    .se-resultat-btn {
        background: #ffcc00; color: #000; border: none; border-radius: 4px;
        padding: 12px; font-family: 'Cinzel', serif; font-weight: bold;
        text-transform: uppercase; cursor: pointer; margin-top: 5px; transition: 0.2s;
    }
    .se-resultat-btn:hover { transform: scale(1.02); filter: brightness(1.1); }
    
    .rangliste { display: flex; flex-direction: column; gap: 10px; max-height: 40vh; overflow-y: auto; }
    .raekke { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; }
    .raekke.mig { border: 1px solid #777; background: rgba(255,255,255,0.1); }
    .raekke img { width: 40px; height: 40px; object-fit: contain; }
    .raekke .info { flex-grow: 1; display: flex; flex-direction: column; }
    .raekke .info strong { color: white; font-size: 1.1rem; }
    .raekke .info span { color: #aaa; font-size: 0.8rem; text-transform: uppercase; }
    .raekke .stats { color: #ffcc00; font-weight: bold; font-family: monospace; font-size: 1.1rem; }

    .log-ikon-btn {
        background: transparent; border: 1px solid #555; border-radius: 6px; cursor: pointer;
        transition: 0.2s; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;
        color: white; font-family: 'Cinzel', serif; font-size: 1rem; text-transform: uppercase; margin-top: 10px;
    }
    .log-ikon-btn:hover { background: rgba(255,255,255,0.1); border-color: white; }
    .log-ikon-btn img { width: 30px; height: 30px; }

    .log-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 3000; }
    .log-modal { background: #111; border: 2px solid #555; border-radius: 8px; width: 600px; max-width: 90%; max-height: 80vh; display: flex; flex-direction: column; padding: 20px; }
    .log-modal h3 { color: #ffcc00; margin-top: 0; font-family: 'Cinzel', serif; text-align: center; }
    .log-liste { flex-grow: 1; overflow-y: auto; margin: 15px 0; padding-right: 10px; display: flex; flex-direction: column; gap: 10px; }
    .log-liste p { color: #ddd; margin: 0; line-height: 1.4; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .log-liste p:last-child { border-bottom: none; }
    .luk-log-btn { background: #333; color: white; border: 1px solid #777; padding: 10px; cursor: pointer; border-radius: 4px; font-weight: bold; transition: 0.2s; }
    .luk-log-btn:hover { background: #555; }

    :global(body.jordskaelv) { animation: rystelse 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; overflow: hidden; }
    :global(body.katastrofe-lys)::after {
        content: '';
        position: fixed;
        inset: 0;
        z-index: 6000;
        pointer-events: none;
        background:
            radial-gradient(circle at 50% 45%, rgba(255, 245, 205, 0.22), rgba(255, 245, 205, 0) 34%),
            rgba(255, 255, 255, 0.08);
        animation: katastrofeGlimt 0.55s ease-out both;
    }
    @keyframes rystelse { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 10%, 30%, 50%, 70%, 90% { transform: translate(-12px, 8px) rotate(-1.5deg); } 20%, 40%, 60%, 80% { transform: translate(12px, -8px) rotate(1.5deg); } }
    @keyframes katastrofeGlimt { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes feltVenterKatastrofe { from { opacity: 0.18; } to { opacity: 0.65; } }
</style>
