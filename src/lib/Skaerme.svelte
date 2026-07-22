<script lang="ts">
    import { onMount } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { PROFIL_AUTO_BEDSTE_SCORE_ID, PROFIL_TUTORIAL_KARAKTER_ID, authState, erAnonymBruger, gemProfilKarakter, gemProfilNavn, hentProfilStats, logUd, sendEmailTilAnonymProfil, sendLoginLink, startAnonymProfil, type ProfilSpil } from '$lib/auth.svelte';
    import { hentKarakterKlasseNoegle, tilgaengeligeKarakterer } from '$lib/spildata';
    import { itemNavn, karakterFordel, karakterKlasseNavn as visKarakterKlasseNavn, karakterNavn, titelNavn } from '$lib/spilTekst';
    import { beregnFremdriftPoint, beregnMinePoint, beregnMineScoreModifier, beregnMultiplayerScoreModifier, beregnSpillerScore, beregnUdstyrPoint, findMedaljeNiveau, findMedaljeSti, taelScoreSpillere } from '$lib/score';
    import { genererSlutHistorie, hentTitel } from '$lib/historieMotor';
    import { goerOfflineAppKlar, offlineAppBesked, offlineAppState, tjekOfflineAppKlar } from '$lib/offlineApp.svelte';
    import Regelbog from '$lib/Regelbog.svelte';
    import LydKnap from '$lib/LydKnap.svelte';
    import SprogKnap from '$lib/SprogKnap.svelte';
    import { tekst } from '$lib/i18n.svelte';
    import { hentBedsteHighscoreForBruger, hentBedsteHighscoreForBrugerKarakter, hentGlobalHighscoresForFilter, hentHighscoreDetaljer, hentHighscoreResultat, hentOffentligProfil, hentSpillerTopScores } from '$lib/netvaerk';
    import { hentLydVolumen, lydKontrol } from '$lib/lydKontrol.svelte';
    import { OE_NAVN_EFTERLED, OE_NAVN_FORLED } from '$lib/oeNavne';
    import { TROFAE_DEFINITIONER, findTrofae, gemMytiskeTrofaeIds, gemTrofaeAwards, gemTrofaeIds, hentGemteMytiskeTrofaeIds, hentGemteTrofaeAwards, hentGemteTrofaeIds, hentSupabaseTrofaeAwards, hentSupabaseTrofaeAwardsForHighscore, hentTrofaeFremdrift, lavTrofaeMaalinger, lavTrofaeOwnerKey, normaliserTrofaeAwards, normaliserTrofaeIds, type TrofaeAward, type TrofaeFremdrift } from '$lib/trofaeer';
    import { TUTORIAL_RUMKODE, erTutorialKnapSkjult, hentTutorialRang, hentTutorialRangtrin, tutorialKarakter } from '$lib/tutorial.svelte';
    import type { Karakter, SpillerData } from '$lib/types';

    type HighscoreDetaljer = {
        id?: number;
        erVinder?: boolean;
        erDoed?: boolean;
        doedsAarsag?: 'vand' | 'taage' | null;
        dage?: number;
        guld?: number;
        maxKolonne?: number;
        kendteFelter?: number;
        miner?: number;
        antalSpillere?: number;
        finalLog?: string | null;
        medalPath?: string | null;
        medalLevel?: number | null;
        rute?: number[];
        ruteBredde?: number | null;
        ruteHoejde?: number | null;
        trophyStats?: Record<string, unknown>;
        trofaeAwards?: TrofaeAward[];
        createdAt?: string;
        oeNulstillet?: boolean;
    };

    type LokalScore = HighscoreDetaljer & { navn: string; score: number; karakter?: string };
    type GlobalScore = HighscoreDetaljer & { userId?: string; spillerNavn: string; oeNavn: string; point: number; karakter?: string };
    type ValgtHighscore = HighscoreDetaljer & { userId?: string; navn: string; point: number; karakter?: string; oeNavn?: string; henterDetaljer?: boolean };
    type HighscoreDrilldown = { titel: string; scores: GlobalScore[]; henter: boolean };
    type OffentligProfilMedalje = { id?: string; sti: string; label: string; labelEn?: string; mytisk?: boolean; opnaaet?: boolean; bedste?: boolean; krav?: string; kravEn?: string; mytiskKrav?: string; mytiskKravEn?: string; episkTekst?: string; episkTekstEn?: string; award?: TrofaeAward | null };
    type OffentligSpillerProfil = { navn: string; userId?: string; profilKarakterId?: string; profilTitelScore?: number; scores: GlobalScore[]; trofaeer: OffentligProfilMedalje[]; henter: boolean };
    type SlutTrofaeForslag = (typeof TROFAE_DEFINITIONER)[number] & { mytisk: boolean; fremdrift: TrofaeFremdrift };
    const HIGHSCORE_DRILLDOWN_ANTAL = 3;
    const OE_RESET_TIDSPUNKT = Date.parse('2026-07-17T02:00:00+02:00');
    const PROFIL_BEDSTE_SCORE_PREFIX = 'taage_profile_best_score:';
    const ER_ITCH_BUILD = __ITCH_BUILD__;
    const LIVE_APP_URL = __LIVE_APP_URL__;
    let {
        opretEllerDeltag,
        startOfflineSpil,
        startTutorialSpil,
        fortsaetOfflineSpil,
        bekræftValg,
        genstartBane,
        nulstilHukommelse,
        lokaleScores,
        klasseScores,
        globaleScores,
        ugensGlobaleScores,
        nyGlobalRekord,
        harGemtOfflineSpil,
        offlineSpilInfo,
        gemScoreIgen,
        scoreGemmer,
        scoreGemningFejlet
    } = $props<{
        opretEllerDeltag: () => void;
        startOfflineSpil: () => void;
        startTutorialSpil: () => void;
        fortsaetOfflineSpil: () => void;
        bekræftValg: (k: Karakter) => void;
        genstartBane: () => void;
        nulstilHukommelse: () => void;
        lokaleScores: LokalScore[];
        klasseScores: GlobalScore[];
        globaleScores: GlobalScore[];
        ugensGlobaleScores: GlobalScore[];
        nyGlobalRekord: boolean;
        harGemtOfflineSpil: boolean;
        offlineSpilInfo: { spillerNavn: string; rumKode: string; gameState: string; dag: number; savedAt: string } | null;
        gemScoreIgen: () => void;
        scoreGemmer: boolean;
        scoreGemningFejlet: boolean;
    }>();

    let lydStart: HTMLAudioElement | null = null;
    let lydDoed: HTMLAudioElement | null = null;
    let lydSejr: HTMLAudioElement | null = null;
    let udvalgteSkæbner = $state<Karakter[]>([]);
    let forrigeState = spilTilstand.gameState;
    let spilletSlutLyd = false;
    let visProfil = $state(false);
    let visProfilKarakterValg = $state(false);
    let profilNavnInput = $state('');
    let profilSpilSoegning = $state('');
    let visLokaleTestKnapper = $state(false);
    let visTutorialStartKnap = $state(!erTutorialKnapSkjult());
    let globalHighscoreSide = $state(0);
    let ugensGlobalHighscoreSide = $state(0);
    let startToplisteVisning = $state<'uge' | 'global'>('uge');
    let slutToplisteVisning = $state<'uge' | 'global'>('global');
    let klasseHighscoreSide = $state(0);
    let lokalHighscoreSide = $state(0);
    let valgtHighscore = $state<ValgtHighscore | null>(null);
    let visHighscoreLog = $state(false);
    let profilNavnGemTimer: ReturnType<typeof setTimeout> | null = null;
    let highscoreDrilldown = $state<HighscoreDrilldown | null>(null);
    let offentligSpillerProfil = $state<OffentligSpillerProfil | null>(null);
    let statsHentetForUser = $state('');
    let gemtProfilBedsteScore = $state(0);
    let valgtLaastTrofae = $state<{ id?: string; sti: string; label: string; labelEn?: string; krav?: string; kravEn?: string; mytiskKrav?: string; mytiskKravEn?: string; episkTekst?: string; episkTekstEn?: string; opnaaet?: boolean; mytisk?: boolean; visNaesteKrav?: boolean; award?: TrofaeAward | null } | null>(null);
    let lokaleTrofaeIds = $state<string[]>([]);
    let lokaleMytiskeTrofaeIds = $state<string[]>([]);
    let lokaleTrofaeAwards = $state<TrofaeAward[]>([]);
    let visJoinLukketModal = $state(false);
    let karaktervalgStatus = $derived(hentKaraktervalgStatus());
    const HIGHSCORE_SIDE_STOERRELSE = 10;
    function karakterStartUdstyrTekst(karakter: Karakter) {
        const udstyr = karakter.startUdstyr?.length
            ? karakter.startUdstyr.map((id) => itemNavn(id)).join(', ')
            : tekst('intet udstyr', 'no equipment');
        return `${tekst('Starter med', 'Starts with')}: ${udstyr}`;
    }

    const lokaleKortPresets = [
        { label: '20 x 20', bredde: 20, hoejde: 20 },
        { label: '50 x 20', bredde: 50, hoejde: 20 },
        { label: '100 x 20', bredde: 100, hoejde: 20 }
    ];

    function foreslaaOeNavn() {
        const forled = OE_NAVN_FORLED[Math.floor(Math.random() * OE_NAVN_FORLED.length)];
        const efterled = OE_NAVN_EFTERLED[Math.floor(Math.random() * OE_NAVN_EFTERLED.length)];
        const oeNavn = `${forled}${efterled}`;
        spilTilstand.rumKode = oeNavn.charAt(0).toUpperCase() + oeNavn.slice(1);
    }

    function blandKarakterer() {
        const blandet = [...tilgaengeligeKarakterer].sort(() => Math.random() - 0.5);
        udvalgteSkæbner = blandet.slice(0, 8);
    }

    $effect(() => {
        if (spilTilstand.gameState !== forrigeState) {
            if (spilTilstand.gameState === 'select') {
                blandKarakterer();
                spilletSlutLyd = false;
            }

            if (spilTilstand.musikTaendt && !spilletSlutLyd) {
                if ((spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map') && lydDoed) {
                    lydDoed.currentTime = 0;
                    lydDoed.play().catch(() => {});
                    spilletSlutLyd = true;
                } else if ((spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map') && lydSejr) {
                    lydSejr.currentTime = 0;
                    lydSejr.play().catch(() => {});
                    spilletSlutLyd = true;
                }
            }
            forrigeState = spilTilstand.gameState;
        }

        if (!spilTilstand.musikTaendt) {
            if (lydStart) lydStart.pause();
            if (lydDoed) lydDoed.pause();
            if (lydSejr) lydSejr.pause();
            spilletSlutLyd = false;
        }
    });

    $effect(() => {
        if (spilTilstand.gameState === 'select' && !karaktervalgStatus.kanJoine) {
            visJoinLukketModal = true;
            spilTilstand.gameState = 'start';
        }
    });

    $effect(() => {
        if (spilTilstand.gameState === 'start') {
            visTutorialStartKnap = !erTutorialKnapSkjult();
        }
    });

    onMount(() => {
        lydStart = new Audio('/audio/start.mp3');
        lydDoed = new Audio('/audio/death.mp3');
        lydSejr = new Audio('/audio/win.mp3');

        [lydStart, lydDoed, lydSejr].forEach(l => {
            l.load();
        });
        anvendLydNiveau();
        tjekOfflineAppKlar();
        visLokaleTestKnapper = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        spilTilstand.devVisHeleKort = false;

        blandKarakterer();
    });

    function vaelgLokaltTestKort(bredde: number, hoejde: number) {
        if (!visLokaleTestKnapper) return;
        spilTilstand.kortBredde = bredde;
        spilTilstand.kortHoejde = hoejde;
        spilTilstand.devVisHeleKort = false;
        spilTilstand.statusBesked = tekst(`Testkort valgt: ${bredde} x ${hoejde}.`, `Test map selected: ${bredde} x ${hoejde}.`);
    }

    function findNiveau(score: number) {
        return findMedaljeNiveau(score);
    }

    function findMedalje(score: number) {
        return findMedaljeSti(score, nyGlobalRekord);
    }

    function erM11Medalje(sti?: string | null) {
        return !!sti && sti.endsWith('/m11.webp');
    }

    function medaljePulsStyle(index = 0) {
        return `--puls-delay: -${((index * 3.7) % 12.8).toFixed(2)}s; --puls-duration: ${(12.4 + ((index * 0.83) % 3.6)).toFixed(2)}s;`;
    }

    function findHighscoreMedalje(score: ValgtHighscore) {
        return score.medalPath || findMedaljeSti(score.point, false);
    }

    function profilBedsteScoreKey(userId: string) {
        return `${PROFIL_BEDSTE_SCORE_PREFIX}${userId}`;
    }

    function hentGemtProfilBedsteScore(userId: string) {
        if (typeof localStorage === 'undefined') return 0;
        const gemt = Number(localStorage.getItem(profilBedsteScoreKey(userId)));
        return Number.isFinite(gemt) && gemt > 0 ? gemt : 0;
    }

    function gemProfilBedsteScore(userId: string, score: number) {
        if (typeof localStorage === 'undefined' || !userId || score <= 0) return;
        localStorage.setItem(profilBedsteScoreKey(userId), String(Math.round(score)));
    }

    function profilMedaljeScore() {
        return Math.max(gemtProfilBedsteScore, authState.stats?.bedsteScore || 0);
    }

    function profilTopMedaljeSti() {
        const score = profilMedaljeScore();
        if (authState.stats?.bedsteScore === score && authState.stats?.bedsteMedalPath) return authState.stats.bedsteMedalPath;
        return `/screens/m${findMedaljeNiveau(score) + 1}.webp`;
    }

    function trofaeOwnerKey() {
        return lavTrofaeOwnerKey(authState.user?.id, spilTilstand.spillerNavn);
    }

    function opdaterLokaleTrofaeIds() {
        const ownerKey = trofaeOwnerKey();
        const gemte = authState.user?.id
            ? normaliserTrofaeIds(authState.profil?.trophies || [])
            : normaliserTrofaeIds([
                ...hentGemteTrofaeIds(ownerKey),
                ...(authState.profil?.trophies || [])
            ]);
        const gemteMytiske = authState.user?.id
            ? normaliserTrofaeIds(authState.profil?.mythic_trophies || [])
            : normaliserTrofaeIds([
                ...hentGemteMytiskeTrofaeIds(ownerKey),
                ...(authState.profil?.mythic_trophies || [])
            ]);
        const nye = spilTilstand.nyeTrofaeIds || [];
        const nyeMytiske = spilTilstand.nyeMytiskeTrofaeIds || [];
        const samlede = normaliserTrofaeIds([...gemte, ...nye]);
        const samledeMytiske = normaliserTrofaeIds([...gemteMytiske, ...nyeMytiske]);
        gemTrofaeIds(ownerKey, samlede);
        gemMytiskeTrofaeIds(ownerKey, samledeMytiske);
        lokaleTrofaeIds = samlede;
        lokaleMytiskeTrofaeIds = samledeMytiske;
    }

    function awardForTrofae(id: string, tier?: 'normal' | 'mythic') {
        return lokaleTrofaeAwards.find((award) => award.id === id && (!tier || (award.tier || 'normal') === tier)) || null;
    }

    async function opdaterLokaleTrofaeAwards() {
        const ownerKey = trofaeOwnerKey();
        const lokaleAwards = hentGemteTrofaeAwards(ownerKey);
        const onlineAwards = authState.user?.id ? await hentSupabaseTrofaeAwards(authState.user.id) : [];
        const samledeAwards = normaliserTrofaeAwards([...lokaleAwards, ...onlineAwards]);
        if (samledeAwards.length > 0) gemTrofaeAwards(ownerKey, samledeAwards);
        lokaleTrofaeAwards = samledeAwards;
    }

    function sorteredeTrofaeMedaljer() {
        const opnaaet = new Set(lokaleTrofaeIds);
        const mytiske = new Set(lokaleMytiskeTrofaeIds);
        const optjente = lokaleTrofaeIds
            .map((id) => findTrofae(id))
            .filter((trofae): trofae is NonNullable<ReturnType<typeof findTrofae>> => !!trofae)
            .map((trofae) => {
                const mytisk = mytiske.has(trofae.id);
                return { ...trofae, sti: mytisk ? trofae.mytiskSti || trofae.sti : trofae.sti, award: awardForTrofae(trofae.id, mytisk ? 'mythic' : 'normal') || awardForTrofae(trofae.id), opnaaet: true, mytisk };
            });
        const laaste = TROFAE_DEFINITIONER
            .filter((trofae) => !opnaaet.has(trofae.id))
            .map((trofae) => ({ ...trofae, award: null, opnaaet: false, mytisk: false }));
        return [...optjente, ...laaste];
    }

    function profilMedaljer() {
        return [
            {
                sti: profilTopMedaljeSti(),
                label: 'Topmedalje',
                labelEn: 'Top Medal',
                krav: 'Din bedste score afgør denne medalje.',
                kravEn: 'Your best score determines this medal.',
                bedste: true,
                opnaaet: true,
                mytisk: false
            },
            ...sorteredeTrofaeMedaljer().map((medalje) => ({ ...medalje, bedste: false }))
        ];
    }

    function loginTeaserMedaljer() {
        return [
            {
                sti: '/screens/m1.webp',
                label: 'Topmedalje',
                labelEn: 'Top Medal',
                krav: 'Log ind for at gemme medaljen fra din bedste score på profilen.',
                kravEn: 'Log in to save the medal from your best score to your profile.',
                bedste: false,
                opnaaet: false,
                mytisk: false
            },
            ...TROFAE_DEFINITIONER.map((medalje) => ({ ...medalje, bedste: false, opnaaet: false, mytisk: false }))
        ];
    }

    function profilMestSpilledeKarakter() {
        if (!authState.stats || authState.stats.spil <= 0) return tutorialKarakter;
        const karakterNavn = authState.stats?.favoritKarakter || '';
        return tilgaengeligeKarakterer.find((karakter) => karakter.navn === karakterNavn) || tutorialKarakter;
    }

    function profilBedsteScoreKarakter() {
        if (!authState.stats || authState.stats.spil <= 0) return tutorialKarakter;
        const bedste = authState.stats.karakterBedsteTitler[0];
        return tilgaengeligeKarakterer.find((karakter) => karakter.id === bedste?.karakterId || karakter.navn === bedste?.karakter) || tutorialKarakter;
    }

    function profilValgtKarakter() {
        const valgtId = authState.profil?.profile_character_id || '';
        if (valgtId === PROFIL_AUTO_BEDSTE_SCORE_ID) return profilBedsteScoreKarakter();
        if (valgtId === PROFIL_TUTORIAL_KARAKTER_ID) return tutorialKarakter;
        return tilgaengeligeKarakterer.find((karakter) => karakter.id === valgtId) || profilMestSpilledeKarakter();
    }

    function profilTitelForKarakter(karakterId?: string | null) {
        if (karakterId === PROFIL_TUTORIAL_KARAKTER_ID) return tekst('Nybegynder', 'Newbie');
        if (!karakterId) return authState.stats?.favoritKarakterBedsteTitel || 'Ingen titel endnu';
        return authState.stats?.karakterBedsteTitler.find((række) => række.karakterId === karakterId)?.titel || 'Ingen titel endnu';
    }

    function profilTitelMedLevelForKarakter(karakterId?: string | null) {
        if (karakterId === PROFIL_TUTORIAL_KARAKTER_ID) return tekst('Nybegynder', 'Newbie');
        if (!karakterId) return tekst('Mest spillet', 'Most played');
        const titelData = authState.stats?.karakterBedsteTitler.find((række) => række.karakterId === karakterId);
        if (!titelData || titelData.score <= 0 || titelData.titel === 'Ingen titel endnu') return '(0)';
        return `${titelNavn(titelData.titel)} (${findMedaljeNiveau(titelData.score) + 1})`;
    }

    function profilMestSpilletTitelTekst() {
        const karakter = profilValgtKarakter();
        const titel = profilTitelForKarakter(karakter?.id);
        if (karakter && titel && titel !== 'Ingen titel endnu') return `${karakterNavn(karakter)} - ${titelNavn(titel)}`;
        if (karakter) return karakterNavn(karakter);
        return tekst('Min profil', 'My profile');
    }

    function karakterFordelUdenKlasse(karakter: Karakter) {
        const fordel = karakterFordel(karakter);
        const kolon = fordel.indexOf(':');
        return kolon >= 0 ? fordel.slice(kolon + 1).trim() : fordel;
    }

    function karakterKlasseNavnEntal(karakter: Karakter) {
        const klasse = hentKarakterKlasseNoegle(karakter);
        const navne: Record<string, [string, string]> = {
            knight: ['Ridder', 'Knight'],
            magician: ['Magiker', 'Mage'],
            thief: ['Lovløs', 'Outlaw'],
            explorer: ['Udforsker', 'Explorer'],
            viking: ['Nordbo', 'Northerner'],
            royal: ['Adelig', 'Noble'],
            hunter: ['Spejder', 'Scout'],
            pirate: ['Sørøver', 'Sea Raider'],
            dwarf: ['Bjergbo', 'Mountain dweller'],
            orc: ['Ork', 'Orc'],
            joker: ['Fantast', 'Wildcard']
        };
        const navn = klasse ? navne[klasse] : undefined;
        return navn ? tekst(navn[0], navn[1]) : visKarakterKlasseNavn(karakter);
    }

    function medaljeLabel(medalje: { label: string; labelEn?: string }) {
        return tekst(medalje.label, medalje.labelEn || medalje.label);
    }

    function medaljeNiveauLabel(medalje: { mytisk?: boolean }) {
        return medalje.mytisk ? tekst('Mytisk', 'Mythic') : '';
    }

    function medaljeKrav(medalje: { krav?: string; kravEn?: string }) {
        return tekst(medalje.krav || '', medalje.kravEn || medalje.krav || '');
    }

    function medaljeMytiskKrav(medalje: { mytiskKrav?: string; mytiskKravEn?: string }) {
        return tekst(
            `${medalje.mytiskKrav || ''} Kun i solospil.`,
            `${medalje.mytiskKravEn || medalje.mytiskKrav || ''} Solo games only.`
        );
    }

    function mytiskKravSaetning(medalje: { mytiskKrav?: string; mytiskKravEn?: string }) {
        return tekst(
            `For at blive Mytisk: ${medalje.mytiskKrav || ''} Kun i solospil.`,
            `To become Mythic: ${medalje.mytiskKravEn || medalje.mytiskKrav || ''} Solo games only.`
        );
    }

    function medaljeEpiskTekst(medalje: { episkTekst?: string; episkTekstEn?: string }) {
        return tekst(medalje.episkTekst || '', medalje.episkTekstEn || medalje.episkTekst || '');
    }

    async function aabnLaastTrofae(medalje: { id?: string; sti: string; label: string; labelEn?: string; bedste: boolean; opnaaet?: boolean; mytisk?: boolean; krav?: string; kravEn?: string; mytiskKrav?: string; mytiskKravEn?: string; episkTekst?: string; episkTekstEn?: string; award?: TrofaeAward | null }) {
        if (medalje.bedste && authState.user?.id) {
            const bedsteSpil = await hentBedsteHighscoreForBruger(authState.user.id);
            if (bedsteSpil) {
                visHighscoreLog = false;
                highscoreDrilldown = null;
                valgtLaastTrofae = null;
                valgtHighscore = { ...bedsteSpil, henterDetaljer: false };
                return;
            }
        }

        if (medalje.opnaaet && medalje.id) {
            await opdaterLokaleTrofaeAwards();
            const award = medalje.award || awardForTrofae(medalje.id);
            if (award?.gameResultId) {
                const awardSpil = await hentHighscoreResultat(award.gameResultId);
                if (awardSpil) {
                    const trofaeAwards = normaliserTrofaeAwards([
                        ...await hentHighscoreTrofaeAwards(award.gameResultId),
                        award
                    ]);
                    visHighscoreLog = false;
                    highscoreDrilldown = null;
                    valgtLaastTrofae = null;
                    valgtHighscore = { ...awardSpil, trofaeAwards, henterDetaljer: false };
                    return;
                }
            }
        } else if (medalje.opnaaet && medalje.award?.gameResultId) {
            const awardSpil = await hentHighscoreResultat(medalje.award.gameResultId);
            if (awardSpil) {
                const trofaeAwards = normaliserTrofaeAwards([
                    ...await hentHighscoreTrofaeAwards(medalje.award.gameResultId),
                    medalje.award
                ]);
                visHighscoreLog = false;
                highscoreDrilldown = null;
                valgtLaastTrofae = null;
                valgtHighscore = { ...awardSpil, trofaeAwards, henterDetaljer: false };
                return;
            }
        }

        valgtLaastTrofae = medalje;
    }

    function aabnNaesteTrofaeKrav(medalje: { id?: string; sti: string; label: string; labelEn?: string; krav?: string; kravEn?: string; mytiskKrav?: string; mytiskKravEn?: string; episkTekst?: string; episkTekstEn?: string; award?: TrofaeAward | null }) {
        valgtLaastTrofae = { ...medalje, opnaaet: true, visNaesteKrav: true };
    }

    function aabnHighscoreTrofaeInfo(medalje: { id?: string; sti: string; label: string; labelEn?: string; krav?: string; kravEn?: string; mytiskKrav?: string; mytiskKravEn?: string; episkTekst?: string; episkTekstEn?: string; award?: TrofaeAward | null; mytisk?: boolean }) {
        if (medalje.mytisk) {
            valgtLaastTrofae = { ...medalje, opnaaet: true, mytisk: true };
            return;
        }
        aabnNaesteTrofaeKrav(medalje);
    }

    function lukLaastTrofae() {
        valgtLaastTrofae = null;
    }

    function formaterNavn(tekst: string) {
        if (!tekst) return '';
        return tekst.charAt(0).toUpperCase() + tekst.slice(1).toLowerCase();
    }

    function formaterHighscoreNavn(tekst: string) {
        return formaterNavn(tekst).slice(0, 10);
    }

    function highscoreKlasseNavn() {
        return visKarakterKlasseNavn(spilTilstand.valgtKarakter);
    }

    function highscoreSideAntal(scores: Array<unknown>) {
        return Math.max(1, Math.ceil(Math.min(scores.length, 100) / HIGHSCORE_SIDE_STOERRELSE));
    }

    function normaliserHighscoreSide(side: number, scores: Array<unknown>) {
        const antalSider = highscoreSideAntal(scores);
        return ((side % antalSider) + antalSider) % antalSider;
    }

    function highscoreSideStart(side: number, scores: Array<unknown>) {
        return normaliserHighscoreSide(side, scores) * HIGHSCORE_SIDE_STOERRELSE;
    }

    function highscoreSideSlut(side: number, scores: Array<unknown>) {
        return highscoreSideStart(side, scores) + HIGHSCORE_SIDE_STOERRELSE;
    }

    function highscoreSide(scores: GlobalScore[], side: number): GlobalScore[] {
        const start = highscoreSideStart(side, scores);
        return scores.slice(start, start + HIGHSCORE_SIDE_STOERRELSE);
    }

    function aktuelIsoUge() {
        const dato = new Date();
        const utcDato = new Date(Date.UTC(dato.getFullYear(), dato.getMonth(), dato.getDate()));
        const dag = utcDato.getUTCDay() || 7;
        utcDato.setUTCDate(utcDato.getUTCDate() + 4 - dag);
        const aarStart = new Date(Date.UTC(utcDato.getUTCFullYear(), 0, 1));
        return Math.ceil((((utcDato.getTime() - aarStart.getTime()) / 86400000) + 1) / 7);
    }

    function lokalHighscoreSideScores(scores: LokalScore[], side: number): LokalScore[] {
        const start = highscoreSideStart(side, scores);
        return scores.slice(start, start + HIGHSCORE_SIDE_STOERRELSE);
    }

    async function aabnGlobalHighscore(score: GlobalScore) {
        visHighscoreLog = false;
        highscoreDrilldown = null;
        offentligSpillerProfil = null;
        valgtHighscore = {
            ...score,
            navn: score.spillerNavn,
            point: score.point,
            oeNavn: score.oeNavn,
            henterDetaljer: !!score.id && !harHighscoreDetaljer(score)
        };
        await hentOgVisHighscoreDetaljer(score.id);
    }

    async function aabnLokalHighscore(score: LokalScore) {
        visHighscoreLog = false;
        highscoreDrilldown = null;
        offentligSpillerProfil = null;
        valgtHighscore = {
            ...score,
            navn: score.navn,
            point: score.score,
            oeNavn: spilTilstand.rumKode,
            henterDetaljer: !!score.id && !harHighscoreDetaljer(score)
        };
        await hentOgVisHighscoreDetaljer(score.id);
    }

    function harHighscoreDetaljer(score: HighscoreDetaljer | null) {
        if (!score) return false;
        return [score.dage, score.guld, score.maxKolonne, score.kendteFelter, score.miner, score.antalSpillere, score.doedsAarsag].some(v => v !== undefined && v !== null);
    }

    function talEllerUkendt(v?: number) {
        return v === undefined || v === null ? tekst('Ukendt', 'Unknown') : `${v}`;
    }

    function highscoreStatus(score: HighscoreDetaljer) {
        if (score.erVinder) return tekst('Sluppet væk', 'Escaped');
        if (score.erDoed) return score.doedsAarsag
            ? tekst(`Død i ${score.doedsAarsag === 'vand' ? 'vand' : 'tåge'}`, `Dead in ${score.doedsAarsag === 'vand' ? 'water' : 'fog'}`)
            : tekst('Død', 'Dead');
        return tekst('Ukendt', 'Unknown');
    }

    function spillerStatus(data: { isWinner?: boolean; isDead?: boolean; deathCause?: 'vand' | 'taage' | null }) {
        if (data.isWinner) return tekst('Sluppet væk', 'Escaped');
        if (!data.isDead) return tekst('I tågen', 'In the fog');
        return data.deathCause
            ? tekst(`Død i ${data.deathCause === 'vand' ? 'vand' : 'tåge'}`, `Dead in ${data.deathCause === 'vand' ? 'water' : 'fog'}`)
            : tekst('Død', 'Dead');
    }

    function formaterProfilSpilDato(createdAt?: string | null) {
        if (!createdAt) return tekst('Ukendt dato', 'Unknown date');
        const dato = new Date(createdAt);
        if (Number.isNaN(dato.getTime())) return tekst('Ukendt dato', 'Unknown date');
        return new Intl.DateTimeFormat(tekst('da-DK', 'en-US'), {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dato);
    }

    function profilSpilSoegeresultater() {
        const historik = authState.stats?.spilHistorik || [];
        const soegning = profilSpilSoegning.trim().toLowerCase();
        const minimumScore = /^\d+$/.test(soegning) ? Number(soegning) : null;
        if (minimumScore !== null) {
            return historik
                .filter((spil) => spil.score >= minimumScore)
                .slice(0, 60);
        }

        const resultater = soegning
            ? historik.filter((spil) => {
                const tekstblok = [
                    spil.playerName,
                    spil.roomCode,
                    karakterNavn(spil.character || ''),
                    `${spil.score}`,
                    `${spil.days}`,
                    `${spil.gold}`,
                    spillerStatus({ isWinner: spil.isWinner, isDead: spil.isDead, deathCause: spil.deathCause }),
                    formaterProfilSpilDato(spil.createdAt)
                ].join(' ').toLowerCase();
                return tekstblok.includes(soegning);
            })
            : historik;

        return resultater.slice(0, soegning ? 60 : 30);
    }

    async function aabnProfilSpil(spil: ProfilSpil) {
        visHighscoreLog = false;
        highscoreDrilldown = null;
        offentligSpillerProfil = null;
        valgtLaastTrofae = null;
        valgtHighscore = {
            id: spil.id,
            navn: spil.playerName,
            point: spil.score,
            karakter: spil.character || undefined,
            oeNavn: spil.roomCode,
            erVinder: spil.isWinner,
            erDoed: spil.isDead,
            doedsAarsag: spil.deathCause,
            dage: spil.days,
            guld: spil.gold,
            henterDetaljer: true
        };
        await hentOgVisHighscoreDetaljer(spil.id);
    }

    function highscoreMineBasis(score: HighscoreDetaljer) {
        if (score.miner === undefined || score.miner === null) return null;
        return score.miner * 100;
    }

    function highscoreSpillerAntal(score: HighscoreDetaljer) {
        if (score.antalSpillere === undefined || score.antalSpillere === null) return tekst('Ukendt', 'Unknown');
        return score.antalSpillere <= 1
            ? 'Solo'
            : tekst(`Spil med andre (${score.antalSpillere})`, `Multiplayer (${score.antalSpillere})`);
    }

    async function hentHighscoreTrofaeAwards(id?: number) {
        if (!id) return [];
        const ownerKey = trofaeOwnerKey();
        const lokaleAwards = normaliserTrofaeAwards([
            ...lokaleTrofaeAwards,
            ...hentGemteTrofaeAwards(ownerKey)
        ]).filter((award) => award.gameResultId === id);
        const onlineAwards = await hentSupabaseTrofaeAwardsForHighscore(id);
        return normaliserTrofaeAwards([...lokaleAwards, ...onlineAwards]);
    }

    function highscoreTrofaeer(score: HighscoreDetaljer | null) {
        return trofaeMedaljerFraAwards(score?.trofaeAwards || []);
    }

    function trofaeMedaljerFraAwards(awards: TrofaeAward[], trofaeRaekkefoelge?: string[], mytiskeIds?: string[]) {
        const trofaeOrden = new Map((trofaeRaekkefoelge?.length ? trofaeRaekkefoelge : TROFAE_DEFINITIONER.map((trofae) => trofae.id)).map((id, index) => [id, index]));
        const mytiskeFraProfil = new Set(mytiskeIds || []);
        const awardsEfterNiveau = new Map<string, TrofaeAward>();
        for (const award of normaliserTrofaeAwards(awards)) {
            const eksisterende = awardsEfterNiveau.get(award.id);
            if (!eksisterende || award.tier === 'mythic') {
                awardsEfterNiveau.set(award.id, award);
            }
        }
        return Array.from(awardsEfterNiveau.values())
            .map((award) => {
                const trofae = findTrofae(award.id);
                const mytisk = award.tier === 'mythic' || mytiskeFraProfil.has(award.id);
                return trofae ? { ...trofae, sti: mytisk ? trofae.mytiskSti || trofae.sti : trofae.sti, award, mytisk } : null;
            })
            .filter((trofae): trofae is NonNullable<ReturnType<typeof findTrofae>> & { award: TrofaeAward; mytisk: boolean } => !!trofae)
            .sort((a, b) => (trofaeOrden.get(a.id) ?? 999) - (trofaeOrden.get(b.id) ?? 999));
    }

    function offentligProfilBedsteScore(profil: OffentligSpillerProfil | null) {
        return profil?.scores[0] || null;
    }

    function karakterFraScore(score: { karakter?: string } | null | undefined) {
        const navn = score?.karakter || '';
        return tilgaengeligeKarakterer.find((karakter) => karakter.navn === navn || karakter.id === navn) || tutorialKarakter;
    }

    function offentligProfilKarakter(profil: OffentligSpillerProfil | null) {
        if (profil?.profilKarakterId === PROFIL_AUTO_BEDSTE_SCORE_ID) return karakterFraScore(offentligProfilBedsteScore(profil));
        if (profil?.profilKarakterId === PROFIL_TUTORIAL_KARAKTER_ID) return tutorialKarakter;
        if (profil?.profilKarakterId) {
            return tilgaengeligeKarakterer.find((karakter) => karakter.id === profil.profilKarakterId) || karakterFraScore(offentligProfilBedsteScore(profil));
        }
        return karakterFraScore(offentligProfilBedsteScore(profil));
    }

    function offentligProfilTitel(profil: OffentligSpillerProfil | null) {
        const karakter = offentligProfilKarakter(profil);
        if (profil?.profilKarakterId === PROFIL_TUTORIAL_KARAKTER_ID) {
            return `${karakterNavn(karakter.navn)} - ${tekst('Nybegynder', 'Newbie')}`;
        }
        const titelScore = profil?.profilKarakterId && profil.profilKarakterId !== PROFIL_AUTO_BEDSTE_SCORE_ID
            ? profil.profilTitelScore || 0
            : offentligProfilBedsteScore(profil)?.point || 0;
        if (titelScore <= 0) return `${karakterNavn(karakter.navn)} - ${tekst('Ingen titel endnu', 'No title yet')}`;
        const titel = hentTitel(karakter.id, findMedaljeNiveau(titelScore) + 1);
        return `${karakterNavn(karakter.navn)} - ${titelNavn(titel)}`;
    }

    function offentligProfilScoreMedalje(profil: OffentligSpillerProfil | null) {
        const score = offentligProfilBedsteScore(profil);
        if (!score) return null;
        return {
            sti: score.medalPath || findMedaljeSti(score.point, false),
            label: 'Topmedalje',
            labelEn: 'Top Medal',
            score
        };
    }

    function offentligProfilMedaljer(profil: OffentligSpillerProfil | null) {
        const scoreMedalje = offentligProfilScoreMedalje(profil);
        return [
            ...(scoreMedalje ? [{ ...scoreMedalje, bedste: true, opnaaet: true, mytisk: erM11Medalje(scoreMedalje.sti) }] : []),
            ...(profil?.trofaeer || []).map((medalje) => ({ ...medalje, bedste: false, opnaaet: true }))
        ];
    }

    async function aabnOffentligProfilMedalje(medalje: OffentligProfilMedalje & { score?: GlobalScore }) {
        if (medalje.score) {
            await aabnOffentligProfilScore(medalje.score);
            return;
        }
        await aabnOffentligProfilTrofae(medalje);
    }

    async function aabnSpillerProfil(navn: string, userId?: string | null) {
        const rentNavn = navn.trim();
        if (!rentNavn && !userId) return;

        const profilNoegle = userId || rentNavn;
        highscoreDrilldown = null;
        offentligSpillerProfil = { navn: rentNavn, userId: userId || undefined, scores: [], trofaeer: [], henter: true };

        const scores = await hentSpillerTopScores(userId ? { brugerId: userId } : { spillerNavn: rentNavn }, HIGHSCORE_DRILLDOWN_ANTAL);
        const profilNavn = scores[0]?.spillerNavn || rentNavn;
        const profilUserId = userId || scores[0]?.userId;
        const [offentligProfil, awards] = await Promise.all([
            profilUserId ? hentOffentligProfil(profilUserId) : Promise.resolve(null),
            profilUserId
                ? hentSupabaseTrofaeAwards(profilUserId)
                : normaliserTrofaeAwards((await Promise.all(scores.map((score) => hentHighscoreTrofaeAwards(score.id)))).flat())
        ]);
        const profilKarakter = offentligProfil?.profileCharacterId && offentligProfil.profileCharacterId !== PROFIL_AUTO_BEDSTE_SCORE_ID && offentligProfil.profileCharacterId !== PROFIL_TUTORIAL_KARAKTER_ID
            ? tilgaengeligeKarakterer.find((karakter) => karakter.id === offentligProfil.profileCharacterId)
            : null;
        const profilTitelScore = profilUserId && profilKarakter
            ? (await hentBedsteHighscoreForBrugerKarakter(profilUserId, profilKarakter.navn))?.point || 0
            : 0;
        const profilTrofaeOrden = normaliserTrofaeIds(offentligProfil?.trophies || []);
        const profilMytiskeTrofaeer = normaliserTrofaeIds(offentligProfil?.mythicTrophies || []);

        const aktuelNoegle = offentligSpillerProfil?.userId || offentligSpillerProfil?.navn;
        if (aktuelNoegle !== profilNoegle) return;

        offentligSpillerProfil = {
            navn: offentligProfil?.displayName || profilNavn,
            userId: profilUserId,
            profilKarakterId: offentligProfil?.profileCharacterId || undefined,
            profilTitelScore,
            scores,
            trofaeer: trofaeMedaljerFraAwards(awards, profilTrofaeOrden, profilMytiskeTrofaeer),
            henter: false
        };
    }

    function aabnSpillerProfilFraHighscore() {
        if (!valgtHighscore) return;
        void aabnSpillerProfil(valgtHighscore.navn, valgtHighscore.userId);
    }

    async function aabnOffentligProfilScore(score: GlobalScore) {
        offentligSpillerProfil = null;
        await aabnGlobalHighscore(score);
    }

    async function aabnOffentligProfilTrofae(medalje: OffentligProfilMedalje) {
        offentligSpillerProfil = null;
        await aabnLaastTrofae({ ...medalje, bedste: false, opnaaet: true });
    }

    function awardTal(data: Record<string, unknown> | undefined, key: string) {
        const vaerdi = Number(data?.[key]);
        return Number.isFinite(vaerdi) ? Math.round(vaerdi) : null;
    }

    function highscoreTrofaeData(score: HighscoreDetaljer | null) {
        return score?.trophyStats || {};
    }

    function trofaeMaalingerFraData(data: Record<string, unknown>) {
        const maalinger = [
            { key: 'miner', label: tekst('Miner', 'Mines') },
            { key: 'taageBevaegelser', label: tekst('Bevægelser i tågen', 'Fog moves') },
            { key: 'vandSkader', label: tekst('Skade fra vand', 'Water damage') },
            { key: 'magiskeGenstande', label: tekst('Magiske genstande', 'Magical items') },
            { key: 'guld', label: tekst('Guld', 'Gold') },
            { key: 'healetHp', label: tekst('Helet HP', 'HP healed') },
            { key: 'kendteFelter', label: tekst('Kendte felter', 'Known fields') },
            { key: 'opgraderingsPoint', label: tekst('Opgraderingspoint', 'Upgrade points') },
            { key: 'diamantRaavaerdiFundet', label: tekst('Diamantværdi', 'Diamond value') }
        ];

        return maalinger
            .map((maaling) => ({ ...maaling, value: awardTal(data, maaling.key) }))
            .filter((maaling) => maaling.value !== null);
    }

    function highscoreTrofaeMaalinger(score: HighscoreDetaljer | null) {
        return trofaeMaalingerFraData(highscoreTrofaeData(score));
    }

    function aktuelleTrofaeMaalinger() {
        return trofaeMaalingerFraData(lavTrofaeMaalinger());
    }

    function stabiltTilfaeldigtTrofaeIndeks(antal: number) {
        if (antal <= 1) return 0;
        const grundlag = `${spilTilstand.rundeSeed}:${spilTilstand.rumKode}:${spilTilstand.spillerNavn}:trofae-forslag`;
        let hash = 2166136261;
        for (let i = 0; i < grundlag.length; i++) {
            hash ^= grundlag.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0) % antal;
    }

    function findSlutTrofaeForslag(): SlutTrofaeForslag | null {
        const opnaaede = new Set(lokaleTrofaeIds);
        const mytiskOpnaaede = new Set(lokaleMytiskeTrofaeIds);
        const erSolo = taelScoreSpillere(spilTilstand.alleSpillere) === 1;
        const kandidater: SlutTrofaeForslag[] = [];

        for (const trofae of TROFAE_DEFINITIONER) {
            if (!opnaaede.has(trofae.id)) {
                kandidater.push({ ...trofae, mytisk: false, fremdrift: hentTrofaeFremdrift(trofae.id) });
            } else if (erSolo && !mytiskOpnaaede.has(trofae.id)) {
                kandidater.push({ ...trofae, mytisk: true, fremdrift: hentTrofaeFremdrift(trofae.id, true) });
            }
        }

        const taetteKandidater = kandidater
            .filter((trofae) => trofae.fremdrift.andel >= 0.8)
            .sort((a, b) => b.fremdrift.andel - a.fremdrift.andel);
        if (taetteKandidater.length > 0) return taetteKandidater[0];
        return kandidater[stabiltTilfaeldigtTrofaeIndeks(kandidater.length)] || null;
    }

    function trofaeFremdriftTekst(trofae: SlutTrofaeForslag) {
        const { vaerdi, oversvoemmelseStartet } = trofae.fremdrift;
        switch (trofae.id) {
            case 'mineejeren':
                return tekst(`Du ejede ${vaerdi} miner.`, `You owned ${vaerdi} mines.`);
            case 'taagekonge':
                return tekst(`Du tog ${vaerdi} bevægelser i tågen.`, `You made ${vaerdi} moves in the fog.`);
            case 'boelgebaereren':
                return tekst(
                    `Oversvømmelse ${oversvoemmelseStartet ? 'startet' : 'ikke startet'} · ${vaerdi} vandskader.`,
                    `Flood ${oversvoemmelseStartet ? 'started' : 'not started'} · ${vaerdi} water hits.`
                );
            case 'relikviejaegeren':
                return tekst(`Du havde ${vaerdi} magiske genstande.`, `You had ${vaerdi} magical items.`);
            case 'guldfyrsten':
                return tekst(`Du havde ${vaerdi} guld.`, `You held ${vaerdi} gold.`);
            case 'livsvogteren':
                return tekst(`Du helede ${vaerdi} HP.`, `You healed ${vaerdi} HP.`);
            case 'korttegneren':
                return tekst(`Du afslørede ${vaerdi} felter.`, `You revealed ${vaerdi} tiles.`);
            case 'udstyrsmesteren':
                return tekst(`Du havde ${vaerdi} opgraderingspoint.`, `You had ${vaerdi} upgrade points.`);
            case 'diamantjaegeren':
                return tekst(`Du fandt diamanter til ${vaerdi} guld.`, `You found diamonds worth ${vaerdi} gold.`);
        }
    }

    function trofaeKravOpfyldtUdenFlugt(trofae: SlutTrofaeForslag) {
        const erDoed = spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map';
        return erDoed && trofae.fremdrift.andel >= 1;
    }

    function trofaeAwardDetalje(trofae: { id?: string; award?: TrofaeAward | null }) {
        const data = trofae.award?.awardData;
        switch (trofae.id) {
            case 'mineejeren': {
                const miner = awardTal(data, 'miner');
                return miner === null ? '' : tekst(`${miner} miner`, `${miner} mines`);
            }
            case 'taagekonge': {
                const træk = awardTal(data, 'taageBevaegelser');
                return træk === null ? '' : tekst(`${træk} bevægelser i tågen`, `${træk} fog moves`);
            }
            case 'boelgebaereren': {
                const skader = awardTal(data, 'vandSkader');
                return skader === null ? '' : tekst(`${skader} vandskader`, `${skader} water hits`);
            }
            case 'relikviejaegeren': {
                const antal = awardTal(data, 'magiskeGenstande');
                return antal === null ? '' : tekst(`${antal} magiske genstande`, `${antal} magical items`);
            }
            case 'guldfyrsten': {
                const guld = awardTal(data, 'guld');
                return guld === null ? '' : tekst(`${guld} guld`, `${guld} gold`);
            }
            case 'livsvogteren': {
                const healet = awardTal(data, 'healetHp');
                return healet === null ? '' : tekst(`${healet} HP helet`, `${healet} HP healed`);
            }
            case 'korttegneren': {
                const felter = awardTal(data, 'kendteFelter');
                return felter === null ? '' : tekst(`${felter} kendte felter`, `${felter} known fields`);
            }
            case 'udstyrsmesteren': {
                const point = awardTal(data, 'opgraderingsPoint');
                return point === null ? '' : tekst(`${point} opgraderingspoint`, `${point} upgrade points`);
            }
            case 'diamantjaegeren': {
                const værdi = awardTal(data, 'diamantRaavaerdiFundet');
                return værdi === null ? '' : tekst(`${værdi} i diamantværdi`, `${værdi} diamond value`);
            }
        }
    }

    function lukHighscoreDetaljer() {
        visHighscoreLog = false;
        highscoreDrilldown = null;
        offentligSpillerProfil = null;
        valgtHighscore = null;
    }

    function highscoreLogLinjer(score: HighscoreDetaljer | null) {
        return (score?.finalLog || '')
            .split(/\r?\n/)
            .map((linje) => linje.trim())
            .filter(Boolean);
    }

    function highscoreRute(score: ValgtHighscore | null) {
        if (score?.rute && score.rute.length > 1) {
            return {
                rute: score.rute,
                bredde: score.ruteBredde || spilTilstand.kortBredde || 20,
                hoejde: score.ruteHoejde || spilTilstand.kortHoejde || 20
            };
        }

        const matcherAktuelSession =
            !!score &&
            score.point === spilTilstand.samletScore &&
            (!score.oeNavn || score.oeNavn.toLowerCase() === spilTilstand.rumKode.toLowerCase());

        if (matcherAktuelSession && spilTilstand.historik?.length > 1) {
            return {
                rute: spilTilstand.historik,
                bredde: spilTilstand.kortBredde || 20,
                hoejde: spilTilstand.kortHoejde || 20
            };
        }

        return null;
    }

    function highscoreMiniRute(score: ValgtHighscore | null) {
        const routeData = highscoreRute(score);
        if (!routeData) return null;

        const hexW = 38;
        const rowH = 32;
        const padding = 18;
        const punkter = routeData.rute.map((index) => {
            const raekke = Math.floor(index / routeData.bredde);
            const kolonne = index % routeData.bredde;
            return {
                x: kolonne * hexW + (raekke % 2 !== 0 ? hexW / 2 : 0) + hexW / 2 + padding,
                y: raekke * rowH + rowH / 2 + padding
            };
        });

        const kortBredde = routeData.bredde * hexW + hexW / 2 + padding * 2;
        const kortHoejde = routeData.hoejde * rowH + padding * 2;

        return {
            points: punkter.map((punkt) => `${punkt.x.toFixed(1)},${punkt.y.toFixed(1)}`).join(' '),
            viewBox: `0 0 ${kortBredde.toFixed(1)} ${kortHoejde.toFixed(1)}`,
            start: punkter[0],
            slut: punkter[punkter.length - 1]
        };
    }

    async function hentOgVisHighscoreDetaljer(id?: number) {
        if (!id) return;
        const [detaljer, trofaeAwards] = await Promise.all([
            hentHighscoreDetaljer(id),
            hentHighscoreTrofaeAwards(id)
        ]);
        if (valgtHighscore?.id !== id) return;
        if (!detaljer) {
            valgtHighscore = { ...valgtHighscore, henterDetaljer: false };
            return;
        }
        valgtHighscore = {
            ...valgtHighscore,
            ...detaljer,
            trofaeAwards,
            oeNulstillet: !!detaljer.createdAt && Date.parse(detaljer.createdAt) < OE_RESET_TIDSPUNKT,
            henterDetaljer: false
        };
    }

    async function aabnHighscoreFilter(titel: string, filter: { spillerNavn?: string; karakter?: string; karakterKlasse?: string | null; oeNavn?: string }) {
        highscoreDrilldown = { titel, scores: [], henter: true };
        const scores = await hentGlobalHighscoresForFilter(filter, HIGHSCORE_DRILLDOWN_ANTAL);
        if (highscoreDrilldown?.titel !== titel) return;
        highscoreDrilldown = { titel, scores, henter: false };
    }

    async function aabnHighscoreFraFilter(score: GlobalScore) {
        highscoreDrilldown = null;
        await aabnGlobalHighscore(score);
    }

    function aabnKarakterHighscoreFilter() {
        if (!valgtHighscore?.karakter) return;
        const klasseNoegle = hentKarakterKlasseNoegle(valgtHighscore.karakter);
        const klasseNavn = visKarakterKlasseNavn(valgtHighscore.karakter);
        void aabnHighscoreFilter(`Top ${HIGHSCORE_DRILLDOWN_ANTAL}: ${klasseNavn}`, { karakterKlasse: klasseNoegle });
    }

    function aabnOeHighscoreFilter() {
        if (!valgtHighscore?.oeNavn) return;
        void aabnHighscoreFilter(
            tekst(`Top ${HIGHSCORE_DRILLDOWN_ANTAL} på ${formaterNavn(valgtHighscore.oeNavn)}`, `Top ${HIGHSCORE_DRILLDOWN_ANTAL} on ${formaterNavn(valgtHighscore.oeNavn)}`),
            { oeNavn: valgtHighscore.oeNavn }
        );
    }

    function naesteGlobalHighscoreSide() {
        globalHighscoreSide = (normaliserHighscoreSide(globalHighscoreSide, globaleScores) + 1) % highscoreSideAntal(globaleScores);
    }

    function forrigeGlobalHighscoreSide() {
        globalHighscoreSide = normaliserHighscoreSide(globalHighscoreSide, globaleScores) - 1;
    }

    function naesteUgensGlobalHighscoreSide() {
        ugensGlobalHighscoreSide = (normaliserHighscoreSide(ugensGlobalHighscoreSide, ugensGlobaleScores) + 1) % highscoreSideAntal(ugensGlobaleScores);
    }

    function forrigeUgensGlobalHighscoreSide() {
        ugensGlobalHighscoreSide = normaliserHighscoreSide(ugensGlobalHighscoreSide, ugensGlobaleScores) - 1;
    }

    function naesteKlasseHighscoreSide() {
        klasseHighscoreSide = (normaliserHighscoreSide(klasseHighscoreSide, klasseScores) + 1) % highscoreSideAntal(klasseScores);
    }

    function forrigeKlasseHighscoreSide() {
        klasseHighscoreSide = normaliserHighscoreSide(klasseHighscoreSide, klasseScores) - 1;
    }

    function naesteLokalHighscoreSide() {
        lokalHighscoreSide = (normaliserHighscoreSide(lokalHighscoreSide, lokaleScores) + 1) % highscoreSideAntal(lokaleScores);
    }

    function forrigeLokalHighscoreSide() {
        lokalHighscoreSide = normaliserHighscoreSide(lokalHighscoreSide, lokaleScores) - 1;
    }

    function maskeretEmail(email?: string) {
        if (!email || !email.includes('@')) return '';
        const [navn, domaene] = email.split('@');
        const synligStart = navn.slice(0, Math.min(2, navn.length));
        return `${synligStart}${navn.length > 2 ? '...' : ''}@${domaene}`;
    }

    function erBrowserOffline() {
        return typeof navigator !== 'undefined' && !navigator.onLine;
    }

    function rensProfilNavn(navn: string) {
        return navn.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
    }

    async function gemProfilNavnFraStartfelt() {
        if (!authState.user) return;

        const rentNavn = rensProfilNavn(spilTilstand.spillerNavn);
        if (!rentNavn || rentNavn === authState.profil?.display_name) return;

        if (profilNavnGemTimer) {
            clearTimeout(profilNavnGemTimer);
            profilNavnGemTimer = null;
        }

        await gemProfilNavn(rentNavn);
        if (authState.profil?.display_name) {
            profilNavnInput = authState.profil.display_name;
            spilTilstand.spillerNavn = authState.profil.display_name;
        }
    }

    async function forsoegAutomatiskProfilFoerOnlineStart() {
        if (ER_ITCH_BUILD) return;
        if (!authState.user) {
            await startAnonymProfil(spilTilstand.spillerNavn);
        }
        await gemProfilNavnFraStartfelt();
        if (authState.profil?.display_name) {
            profilNavnInput = authState.profil.display_name;
            spilTilstand.spillerNavn = authState.profil.display_name;
        }
    }

    function planlaegProfilNavnGem() {
        if (!authState.user) return;
        if (profilNavnGemTimer) clearTimeout(profilNavnGemTimer);

        profilNavnGemTimer = setTimeout(() => {
            profilNavnGemTimer = null;
            void gemProfilNavnFraStartfelt();
        }, 800);
    }

    async function startSpilMedLyd() {
        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }
        if (spilTilstand.rumKode.trim().toLowerCase() === TUTORIAL_RUMKODE) {
            startTutorialSpil();
            return;
        }
        if (erBrowserOffline()) {
            startOfflineSpil();
            return;
        }
        await forsoegAutomatiskProfilFoerOnlineStart();
        opretEllerDeltag();
    }

    async function startSpilFraHero() {
        if (!spilTilstand.rumKode.trim()) foreslaaOeNavn();
        await startSpilMedLyd();
    }

    async function startTutorialMedLyd() {
        await gemProfilNavnFraStartfelt();

        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }

        startTutorialSpil();
    }

    function fortsaetOfflineMedLyd() {
        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }
        fortsaetOfflineSpil();
    }

    function anvendLydNiveau() {
        const volumen = hentLydVolumen();
        spilTilstand.musikTaendt = lydKontrol.niveau !== 'slukket';

        for (const lyd of [lydStart, lydDoed, lydSejr]) {
            if (!lyd) continue;
            lyd.volume = volumen;
            if (lydKontrol.niveau === 'slukket') lyd.pause();
        }

        if (lydKontrol.niveau === 'slukket') spilletSlutLyd = false;
    }

    $effect(() => {
        const niveau = lydKontrol.niveau;
        void niveau;
        anvendLydNiveau();
    });

    $effect(() => {
        if (authState.profil?.display_name) {
            profilNavnInput = authState.profil.display_name;
            if (spilTilstand.gameState === 'start') {
                spilTilstand.spillerNavn = authState.profil.display_name;
            }
        }
    });

    $effect(() => {
        const userId = authState.user?.id || '';
        if (!userId) {
            statsHentetForUser = '';
            gemtProfilBedsteScore = 0;
            return;
        }
        gemtProfilBedsteScore = Math.max(gemtProfilBedsteScore, hentGemtProfilBedsteScore(userId));
        if (statsHentetForUser === userId && authState.stats) return;
        statsHentetForUser = userId;
        void hentProfilStats();
    });

    $effect(() => {
        const userId = authState.user?.id || '';
        const bedsteScore = authState.stats?.bedsteScore || 0;
        if (!userId || bedsteScore <= gemtProfilBedsteScore) return;
        gemtProfilBedsteScore = bedsteScore;
        gemProfilBedsteScore(userId, bedsteScore);
    });

    $effect(() => {
        const owner = trofaeOwnerKey();
        const nyeTrofaeer = (spilTilstand.nyeTrofaeIds || []).join('|');
        const userId = authState.user?.id || '';
        void owner;
        void nyeTrofaeer;
        void userId;
        opdaterLokaleTrofaeIds();
        void opdaterLokaleTrofaeAwards();
    });

    function aabnProfil() {
        visProfil = true;
        void hentProfilStats();
    }

    function aabnLiveVersion() {
        if (typeof window === 'undefined') return;
        window.open(LIVE_APP_URL, '_blank', 'noopener,noreferrer');
    }

    async function gemProfil() {
        await gemProfilNavn(profilNavnInput);
        if (authState.profil?.display_name) {
            spilTilstand.spillerNavn = authState.profil.display_name;
        }
    }

    async function vaelgProfilKarakter(karakterId: string | null) {
        await gemProfilKarakter(karakterId);
        visProfilKarakterValg = false;
    }

    function trykEnter(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            startSpilMedLyd();
        }
    }

    function hentPointSpec() {
        const udforskning = (spilTilstand.mineKendteFelter?.length || 0) * 2;
        const antalSpillere = taelScoreSpillere(spilTilstand.alleSpillere);
        const mineModifier = beregnMineScoreModifier(antalSpillere);
        const multiplayerModifier = beregnMultiplayerScoreModifier(antalSpillere);
        const minePoint = beregnMinePoint(spilTilstand.gitter, spilTilstand.spillerNavn, antalSpillere);
        const udstyrPoint = beregnUdstyrPoint(spilTilstand.mitUdstyr);
        const erVinder = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map';
        const fremdriftPoint = beregnFremdriftPoint(spilTilstand.maxKolonne, erVinder, spilTilstand.kortBredde);
        const hpMult = (1 + Math.max(0, spilTilstand.livspoint) / 1000);
        return { udforskning, minePoint, mineModifier, multiplayerModifier, udstyrPoint, fremdriftPoint, erVinder, hpMult };
    }

    function hentSessionSpillere() {
        return Object.entries(spilTilstand.alleSpillere).map(([navn, data]) => {
            const score = beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, navn, data, !!data.isWinner, spilTilstand.kortBredde, spilTilstand.kortHoejde);
            return { navn, data, score };
        }).sort((a, b) => b.score - a.score);
    }

    function erAktivKaraktervalgSpiller(spiller: SpillerData) {
        return !spiller.isDead && !spiller.isWinner;
    }

    function hentKaraktervalgStatus() {
        const aktiveSpillere = Object.values(spilTilstand.alleSpillere).filter(erAktivKaraktervalgSpiller);
        const hoejesteDag = aktiveSpillere.length > 0
            ? Math.max(...aktiveSpillere.map((spiller) => spiller.dag || 1))
            : (spilTilstand.dag || 1);
        return {
            aktiveAntal: aktiveSpillere.length,
            dag: hoejesteDag,
            kanJoine: hoejesteDag <= 5
        };
    }

    function hentMinHistorie(erVundet: boolean) {
        const niveau = findNiveau(spilTilstand.samletScore) + 1;
        const karakterId = spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.id : 'explorer';
        const titel = hentTitel(karakterId, niveau);
        return genererSlutHistorie(titel, niveau, spilTilstand.rumKode, erVundet);
    }

    function nyeTrofaeer() {
        return (spilTilstand.nyeTrofaeIds || [])
            .map((id) => findTrofae(id))
            .filter((trofae): trofae is NonNullable<ReturnType<typeof findTrofae>> => !!trofae);
    }

    function nyeMytiskeTrofaeer() {
        return (spilTilstand.nyeMytiskeTrofaeIds || [])
            .map((id) => findTrofae(id))
            .filter((trofae): trofae is NonNullable<ReturnType<typeof findTrofae>> => !!trofae)
            .map((trofae) => ({ ...trofae, sti: trofae.mytiskSti || trofae.sti }));
    }

    function lukAktivModalMedEscape() {
        if (document.querySelector('.regelbog-overlay')) return false;

        if (valgtLaastTrofae) {
            lukLaastTrofae();
            return true;
        }

        if (visHighscoreLog) {
            visHighscoreLog = false;
            return true;
        }

        if (offentligSpillerProfil) {
            offentligSpillerProfil = null;
            return true;
        }

        if (highscoreDrilldown) {
            highscoreDrilldown = null;
            return true;
        }

        if (valgtHighscore) {
            lukHighscoreDetaljer();
            return true;
        }

        if (visProfilKarakterValg) {
            visProfilKarakterValg = false;
            return true;
        }

        if (visProfil) {
            visProfil = false;
            return true;
        }

        if (visJoinLukketModal) {
            visJoinLukketModal = false;
            return true;
        }

        return false;
    }

    function haandterEscape(e: KeyboardEvent) {
        if (e.key !== 'Escape') return;
        if (!lukAktivModalMedEscape()) return;

        e.preventDefault();
    }

</script>

<svelte:window onkeydown={haandterEscape} />

{#snippet episkeTrofaeer()}
    {@const trofaeer = nyeTrofaeer()}
    {@const mytiskeTrofaeer = nyeMytiskeTrofaeer()}
    {@const mytiskeIds = new Set(mytiskeTrofaeer.map((trofae) => trofae.id))}
    {@const almindeligeTrofaeer = trofaeer.filter((trofae) => !mytiskeIds.has(trofae.id))}
    {#if almindeligeTrofaeer.length > 0 || mytiskeTrofaeer.length > 0}
        <section class="episk-trofae-panel" aria-label={tekst('Nye trofæmedaljer', 'New trophy medals')}>
            <p class="episk-kicker">{mytiskeTrofaeer.length > 0 ? tekst('Mytisk niveau', 'Mythic tier') : tekst('Ny trofæmedalje', 'New trophy medal')}</p>
            <h2>
                {#if mytiskeTrofaeer.length > 0 && almindeligeTrofaeer.length === 0}
                    {mytiskeTrofaeer.length === 1 ? tekst(`Mytisk ${medaljeLabel(mytiskeTrofaeer[0])}`, `Mythic ${medaljeLabel(mytiskeTrofaeer[0])}`) : tekst(`${mytiskeTrofaeer.length} mytiske trofæer`, `${mytiskeTrofaeer.length} mythic trophies`)}
                {:else if almindeligeTrofaeer.length === 1 && mytiskeTrofaeer.length === 0}
                    {medaljeLabel(almindeligeTrofaeer[0])}
                {:else}
                    {tekst(`${almindeligeTrofaeer.length + mytiskeTrofaeer.length} episke trofæer`, `${almindeligeTrofaeer.length + mytiskeTrofaeer.length} epic trophies`)}
                {/if}
            </h2>
            <div class="episk-trofae-liste">
                {#each almindeligeTrofaeer as trofae (trofae.id)}
                    <div class="episk-trofae">
                        <img src={trofae.sti} alt={medaljeLabel(trofae)} draggable="false" />
                        <div>
                            <strong>{medaljeLabel(trofae)}</strong>
                            <span>{medaljeEpiskTekst(trofae)}</span>
                        </div>
                    </div>
                {/each}
                {#each mytiskeTrofaeer as trofae (`mytisk-${trofae.id}`)}
                    <div class="episk-trofae">
                        <img src={trofae.sti} alt={medaljeLabel(trofae)} draggable="false" />
                        <div>
                            <strong>{tekst(`${medaljeLabel(trofae)} - mytisk`, `${medaljeLabel(trofae)} - mythic`)}</strong>
                            <span>{medaljeMytiskKrav(trofae)}</span>
                        </div>
                    </div>
                {/each}
            </div>
        </section>
    {/if}
{/snippet}

{#snippet slutTrofaeStatus()}
    {@const foreslaaetTrofae = findSlutTrofaeForslag()}
    <section class="slut-trofae-status" aria-label={tekst('Trofæfremdrift', 'Trophy progress')}>
        <div class="highscore-detail-maalinger slut-trofae-maalinger">
            <div>
                {#each aktuelleTrofaeMaalinger() as maaling (maaling.key)}
                    <p><span>{maaling.label}</span><strong>{maaling.value}</strong></p>
                {/each}
            </div>
        </div>

        {#if foreslaaetTrofae}
            <div class="slut-naermeste-trofae">
                <img
                    src={foreslaaetTrofae.mytisk ? foreslaaetTrofae.mytiskSti || foreslaaetTrofae.sti : foreslaaetTrofae.sti}
                    alt={medaljeLabel(foreslaaetTrofae)}
                    draggable="false"
                />
                <div>
                    <p class="slut-trofae-kicker">
                        {#if trofaeKravOpfyldtUdenFlugt(foreslaaetTrofae)}
                            {tekst('Du opfyldte trofækravet, men slap ikke væk', 'You met the trophy requirement but did not escape')}
                        {:else if foreslaaetTrofae.fremdrift.andel >= 0.8}
                            {tekst('Du var tæt på en ny trofæmedalje', 'You were close to a new trophy medal')}
                        {:else}
                            {tekst('Du var ikke tæt på en ny trofæmedalje', 'You were not close to a new trophy medal')}
                            <span>{tekst('En mulig trofæmedalje kunne være:', 'One possible trophy medal could be:')}</span>
                        {/if}
                    </p>
                    <h3>
                        {medaljeLabel(foreslaaetTrofae)}{foreslaaetTrofae.mytisk ? tekst(' – mytisk', ' – mythic') : ''}
                    </h3>
                    <p class="slut-trofae-resultat">{trofaeFremdriftTekst(foreslaaetTrofae)}</p>
                    <p class="slut-trofae-krav">
                        {#if trofaeKravOpfyldtUdenFlugt(foreslaaetTrofae)}
                            {tekst('Trofæmedaljen kræver, at du slipper levende væk.', 'The trophy medal requires you to escape alive.')}
                        {:else}
                            <strong>{tekst('Krav:', 'Requirement:')}</strong>
                            {foreslaaetTrofae.mytisk ? medaljeMytiskKrav(foreslaaetTrofae) : medaljeKrav(foreslaaetTrofae)}
                        {/if}
                    </p>
                </div>
            </div>
        {:else}
            <div class="slut-alle-trofaeer">
                <h3>{tekst('Alle tilgængelige trofæer er opnået', 'All available trophies completed')}</h3>
                <p>{tekst('Du ejer allerede alle trofæer, der kan opnås i denne spiltype.', 'You already own every trophy available in this game mode.')}</p>
            </div>
        {/if}
    </section>
{/snippet}

{#snippet pointSpecifikation()}
    <div class="point-kvittering">
        <h4>{tekst('Opgørelse', 'Breakdown')}</h4>
        <div class="kvittering-linje"><span>{tekst('Guld:', 'Gold:')}</span> <span>{spilTilstand.guldTotal}</span></div>
        <div class="kvittering-linje">
            <span>{hentPointSpec().erVinder ? tekst('Overlevelsesbonus', 'Survival bonus') : tekst('Fremdrift', 'Progress')}:</span>
            <span>{hentPointSpec().fremdriftPoint}</span>
        </div>
        <div class="kvittering-linje"><span>{tekst('Udforskning:', 'Exploration:')}</span> <span>{hentPointSpec().udforskning}</span></div>
        <div class="kvittering-linje">
            <span>{tekst('Territorium (miner):', 'Territory (mines):')}</span>
            <span>{hentPointSpec().minePoint}</span>
        </div>
        <div class="kvittering-linje"><span>{tekst('Udstyr:', 'Equipment:')}</span> <span>{hentPointSpec().udstyrPoint}</span></div>
        {#if hentPointSpec().hpMult > 1 || hentPointSpec().multiplayerModifier > 1}
            <div class="kvittering-skiller"></div>
        {/if}
        {#if hentPointSpec().hpMult > 1}
            <div class="kvittering-linje mult"><span>{tekst('Helbredsbonus:', 'Health bonus:')}</span> <span>x {hentPointSpec().hpMult.toFixed(3)}</span></div>
        {/if}
        {#if hentPointSpec().multiplayerModifier > 1}
            <div class="kvittering-linje mult"><span>{tekst('Flere spillere:', 'Multiplayer:')}</span> <span>x {hentPointSpec().multiplayerModifier.toFixed(1)}</span></div>
        {/if}
        <div class="kvittering-total"><span>{tekst('Samlet score:', 'Total score:')}</span> <span>{spilTilstand.samletScore}</span></div>
    </div>
{/snippet}

{#snippet sessionTavle()}
    <div class="session-tavle">
        <h3>{tekst('Alle karakterer', 'All characters')}</h3>
        <div class="session-liste">
            {#each hentSessionSpillere() as { navn, data, score } (navn)}
                <div class="session-raekke" class:aktiv-mig={navn === spilTilstand.spillerNavn}>
                    <img src={data.ikon || '/tiles/player.webp'} alt="" class="session-ikon" />
                    <div class="session-info">
                        <span class="session-navn">{formaterNavn(navn)}</span>
                        <span class="session-status" class:vinder={data.isWinner} class:doed={data.isDead}>
                            {spillerStatus(data)}
                        </span>
                    </div>
                    <div class="session-stats">
                        <span title="Score" class="session-score">{score}</span>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/snippet}

{#snippet tutorialResultatTavle()}
    {@const vurdering = hentTutorialRang(spilTilstand.samletScore)}
    <section class="tutorial-resultat" aria-label={tekst('Resultat fra tutorialen', 'Tutorial result')}>
        <div class="tutorial-resultat-top">
            <span>{tekst('Din tutorialrang', 'Your tutorial rank')}</span>
            <strong>{vurdering.aktuel.titel}</strong>
            <p>{vurdering.aktuel.tekst}</p>
        </div>

        <div class="tutorial-rangliste">
            {#each hentTutorialRangtrin() as trin (trin.point)}
                <div class="tutorial-rangtrin" class:opnaaet={spilTilstand.samletScore >= trin.point}>
                    <span>{trin.point}</span>
                    <strong>{trin.titel}</strong>
                </div>
            {/each}
        </div>

        {#if vurdering.naeste}
            <p class="tutorial-naeste">{tekst('Næste rang:', 'Next rank:')} {vurdering.naeste.titel} {tekst('ved', 'at')} {vurdering.naeste.point} {tekst('point.', 'points.')}</p>
        {:else}
            <p class="tutorial-naeste">{tekst('Du har nået højeste tutorialrang.', 'You have reached the highest tutorial rank.')}</p>
        {/if}
        <p class="tutorial-resultat-note">{tekst('Rangen er kun til øvelse. Den bliver ikke gemt og tæller ikke i andre spil.', 'This rank is for practice only. It is not saved and does not count in other games.')}</p>
    </section>
{/snippet}

{#snippet kontoPanel()}
    <div class="konto-panel" class:har-profil={authState.user}>
        {#if authState.user}
            <div class="konto-linje">
                <button type="button" class="konto-profil-identitet" onclick={aabnProfil}>
                    {#if profilValgtKarakter()}
                        <img src={profilValgtKarakter()?.ikon} alt="" />
                    {/if}
                    <span>
                        <strong>{authState.profil?.display_name || tekst('Logget ind', 'Logged in')}</strong>
                        <em>{erAnonymBruger() ? tekst('Gæsteprofil i denne browser', 'Guest profile in this browser') : profilMestSpilletTitelTekst()}</em>
                    </span>
                </button>
                <button type="button" class="konto-aabn-profil-knap" onclick={aabnProfil}>{tekst('Åbn profil', 'Open profile')}</button>
            </div>
            <div class="konto-medaljer" aria-label={tekst('Dine medaljer', 'Your medals')}>
                {#each profilMedaljer() as medalje, index (`profil-medalje-${index}-${medalje.sti}`)}
                    <button
                        type="button"
                        class="konto-medalje-knap"
                        class:kan-aabnes={true}
                        onclick={() => aabnLaastTrofae(medalje)}
                        aria-label={medalje.bedste ? medaljeLabel(medalje) : medalje.opnaaet ? tekst(`Se ${medaljeLabel(medalje)}`, `View ${medaljeLabel(medalje)}`) : tekst(`Se krav for ${medaljeLabel(medalje)}`, `View requirement for ${medaljeLabel(medalje)}`)}
                    >
                        <img
                            src={medalje.sti}
                            alt={medaljeLabel(medalje)}
                            class:bedste={medalje.bedste}
                            class:trofae-opnaaet={medalje.opnaaet}
                            class:trofae-placeholder={!medalje.bedste && !medalje.opnaaet}
                            draggable="false"
                        />
                    </button>
                {/each}
            </div>
            {#if erAnonymBruger()}
                <p class="konto-hint konto-hint-anonym">{tekst('Profilen er gemt i denne browser. Tilknyt din e-mail, hvis du også vil kunne bruge profilen på andre enheder.', 'This profile is saved in this browser. Add your email if you also want to use the profile on other devices.')}</p>
                <div class="konto-login konto-login-anonym">
                    <input
                        type="email"
                        bind:value={authState.email}
                        placeholder={tekst('E-mailadresse', 'Email address')}
                        onkeydown={(e) => { if (e.key === 'Enter') sendEmailTilAnonymProfil(authState.email); }}
                    />
                    <button type="button" onclick={() => sendEmailTilAnonymProfil(authState.email)} disabled={authState.loader}>
                        {authState.loader ? tekst('Sender...', 'Sending...') : tekst('Tilknyt e-mail', 'Add email')}
                    </button>
                </div>
            {/if}
        {:else}
            {#if ER_ITCH_BUILD}
                <p class="konto-hint">
                    {tekst(
                        'Her på itch kan du prøve spillet uden en konto. I live-versionen får du den nyeste udgave, en gemt profil og adgang til de globale toplister.',
                        'Here on itch, you can try the game without an account. The live version gives you the latest build, a saved profile and access to the global leaderboards.'
                    )}
                </p>
                <div class="konto-medaljer konto-medaljer-login-teaser" aria-label={tekst('Medaljer du kan gemme med login', 'Medals you can save with login')}>
                    {#each loginTeaserMedaljer() as medalje, index (`itch-login-teaser-medalje-${index}-${medalje.sti}`)}
                        <button
                            type="button"
                            class="konto-medalje-knap kan-aabnes"
                            onclick={() => aabnLaastTrofae(medalje)}
                            aria-label={tekst(`Se krav for ${medaljeLabel(medalje)}`, `View requirement for ${medaljeLabel(medalje)}`)}
                        >
                            <img
                                src={medalje.sti}
                                alt={medaljeLabel(medalje)}
                                class:trofae-placeholder={true}
                                draggable="false"
                            />
                        </button>
                    {/each}
                </div>
                <div class="konto-live-link">
                    <button type="button" onclick={aabnLiveVersion}>
                        {tekst('Spil nyeste version og opret konto', 'Play latest version and create an account')}
                    </button>
                    <span>{tekst('Prøv itch-versionen uden en konto.', 'Try the itch version without an account.')}</span>
                </div>
            {:else}
            <p class="konto-hint">{tekst('Skriv dit spillernavn og et navn til øen. Du kan begynde uden e-mail og senere tilknytte den, hvis profilen skal gemmes og bruges på andre enheder.', 'Enter your player name and a name for the island. You can begin without an email and add one later if you want to save the profile and use it on other devices.')}</p>
            <div class="konto-medaljer konto-medaljer-login-teaser" aria-label={tekst('Medaljer du kan gemme med login', 'Medals you can save with login')}>
                {#each loginTeaserMedaljer() as medalje, index (`login-teaser-medalje-${index}-${medalje.sti}`)}
                    <button
                        type="button"
                        class="konto-medalje-knap kan-aabnes"
                        onclick={() => aabnLaastTrofae(medalje)}
                        aria-label={tekst(`Se krav for ${medaljeLabel(medalje)}`, `View requirement for ${medaljeLabel(medalje)}`)}
                    >
                        <img
                            src={medalje.sti}
                            alt={medaljeLabel(medalje)}
                            class:trofae-placeholder={true}
                            draggable="false"
                        />
                    </button>
                {/each}
            </div>
            <div class="konto-login">
                <input
                    type="email"
                    bind:value={authState.email}
                    placeholder={tekst('E-mailadresse', 'Email address')}
                    onkeydown={(e) => { if (e.key === 'Enter') sendLoginLink(authState.email); }}
                />
                <button type="button" onclick={() => sendLoginLink(authState.email)} disabled={authState.loader}>
                    {authState.loader ? tekst('Sender...', 'Sending...') : tekst('Log ind med e-mail', 'Log in with email')}
                </button>
            </div>
            {/if}
        {/if}
        {#if authState.besked}
            <p class="konto-besked">{authState.besked}</p>
        {/if}
    </div>
{/snippet}

{#snippet laastTrofaeModal()}
    {#if valgtLaastTrofae}
        <div class="trofae-info-overlay" role="presentation" onclick={lukLaastTrofae}>
            <div
                class="trofae-info-modal"
                class:naeste-krav={valgtLaastTrofae.visNaesteKrav}
                class:mytisk-opnaaet={valgtLaastTrofae.mytisk && !valgtLaastTrofae.visNaesteKrav}
                role="dialog"
                aria-modal="true"
                aria-labelledby="trofae-info-titel"
                tabindex="-1"
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => e.stopPropagation()}
            >
                <img
                    src={valgtLaastTrofae.sti}
                    alt={medaljeLabel(valgtLaastTrofae)}
                    class:opnaaet={valgtLaastTrofae.opnaaet}
                    draggable="false"
                />
                <h3 id="trofae-info-titel">{medaljeLabel(valgtLaastTrofae)}</h3>
                {#if valgtLaastTrofae.visNaesteKrav}
                    {#if trofaeAwardDetalje(valgtLaastTrofae)}
                        <p class="trofae-info-resultat">{trofaeAwardDetalje(valgtLaastTrofae)}</p>
                    {/if}
                    <p class="trofae-info-krav">{mytiskKravSaetning(valgtLaastTrofae)}</p>
                {:else if valgtLaastTrofae.mytisk}
                    <p>{tekst('Mytisk niveau opnået.', 'Mythic tier achieved.')}</p>
                    <p class="trofae-info-krav">{tekst('Mytisk krav:', 'Mythic requirement:')} {medaljeMytiskKrav(valgtLaastTrofae)}</p>
                {:else if valgtLaastTrofae.opnaaet && valgtLaastTrofae.episkTekst}
                    <p>{medaljeEpiskTekst(valgtLaastTrofae)}</p>
                    <p class="trofae-info-krav">{tekst('Krav:', 'Requirement:')} {medaljeKrav(valgtLaastTrofae)}</p>
                    {#if valgtLaastTrofae.mytiskKrav}
                        <p class="trofae-info-krav">{tekst('Mytisk krav:', 'Mythic requirement:')} {medaljeMytiskKrav(valgtLaastTrofae)}</p>
                    {/if}
                {:else}
                    <p>{medaljeKrav(valgtLaastTrofae)}</p>
                {/if}
                <button type="button" class="trofae-info-luk" onclick={lukLaastTrofae}>{tekst('Luk', 'Close')}</button>
            </div>
        </div>
    {/if}
{/snippet}

{#snippet profilModal()}
    {#if visProfil && authState.user}
        <div class="profil-overlay" role="presentation" onclick={() => visProfil = false}>
            <div class="profil-modal" role="presentation" onclick={(e) => e.stopPropagation()}>
                <div class="profil-header">
                    <div class="profil-header-identitet">
                        <button
                            type="button"
                            class="profil-karakter-knap"
                            onclick={() => visProfilKarakterValg = !visProfilKarakterValg}
                            aria-label={tekst('Vælg profilkarakter', 'Choose profile character')}
                            title={tekst('Vælg profilkarakter', 'Choose profile character')}
                        >
                            {#if profilValgtKarakter()}
                                <img src={profilValgtKarakter()?.ikon} alt="" />
                            {:else}
                                <span>?</span>
                            {/if}
                        </button>
                        <div>
                        <h2>{tekst('Min profil', 'My profile')}</h2>
                        {#if maskeretEmail(authState.user.email)}
                            <p>{maskeretEmail(authState.user.email)}</p>
                        {:else if erAnonymBruger()}
                            <p>{tekst('Gæsteprofil i denne browser', 'Guest profile in this browser')}</p>
                        {/if}
                        </div>
                    </div>
                    <button type="button" class="profil-luk-knap" onclick={() => visProfil = false}>
                        <span aria-hidden="true">×</span>
                        <span>{tekst('Luk', 'Close')}</span>
                    </button>
                </div>

                {#if visProfilKarakterValg}
                    <div class="profil-karaktervalg" aria-label={tekst('Profilkarakter', 'Profile character')}>
                        <button
                            type="button"
                            class:valgt={!authState.profil?.profile_character_id}
                            onclick={() => vaelgProfilKarakter(null)}
                        >
                            <span>{tekst('Auto', 'Auto')}</span>
                            <em>{tekst('Mest spillet', 'Most played')}</em>
                        </button>
                        <button
                            type="button"
                            class:valgt={authState.profil?.profile_character_id === PROFIL_AUTO_BEDSTE_SCORE_ID}
                            onclick={() => vaelgProfilKarakter(PROFIL_AUTO_BEDSTE_SCORE_ID)}
                        >
                            <span>{tekst('Auto', 'Auto')}</span>
                            <em>{tekst('Højeste score', 'Highest score')}</em>
                        </button>
                        <button
                            type="button"
                            class:valgt={authState.profil?.profile_character_id === PROFIL_TUTORIAL_KARAKTER_ID}
                            onclick={() => vaelgProfilKarakter(PROFIL_TUTORIAL_KARAKTER_ID)}
                        >
                            <img src={tutorialKarakter.ikon} alt="" />
                            <span>{karakterNavn(tutorialKarakter)}</span>
                            <em>{profilTitelMedLevelForKarakter(tutorialKarakter.id)}</em>
                        </button>
                        {#each tilgaengeligeKarakterer as karakter (karakter.id)}
                            <button
                                type="button"
                                class:valgt={authState.profil?.profile_character_id === karakter.id}
                                onclick={() => vaelgProfilKarakter(karakter.id)}
                            >
                                <img src={karakter.ikon} alt="" />
                                <span>{karakterNavn(karakter)}</span>
                                <em>{profilTitelMedLevelForKarakter(karakter.id)}</em>
                            </button>
                        {/each}
                    </div>
                {/if}

                <label class="profil-felt">
                    <span>{tekst('Ret spillernavn', 'Edit player name')}</span>
                    <div>
                        <input bind:value={profilNavnInput} maxlength="15" />
                        <button type="button" onclick={gemProfil}>{tekst('Gem', 'Save')}</button>
                    </div>
                </label>

                {#if authState.stats}
                    <div class="profil-grid">
                        <div><strong>{authState.stats.spil}</strong><span>{tekst('Spil', 'Games')}</span></div>
                        <div><strong>{authState.stats.sejre}</strong><span>{tekst('Sejre', 'Wins')}</span></div>
                        <div><strong>{authState.stats.doedsfald}</strong><span>{tekst('Dødsfald', 'Deaths')}</span></div>
                        <div><strong>{authState.stats.bedsteScore}</strong><span>{tekst('Bedste score', 'Best score')}</span></div>
                        <div><strong>{authState.stats.gennemsnitScore}</strong><span>{tekst('Gns. score', 'Avg. score')}</span></div>
                        <div><strong>{authState.stats.mestGuld}</strong><span>{tekst('Mest guld', 'Most gold')}</span></div>
                        <div><strong>{authState.stats.bedsteDag}</strong><span>{tekst('Længste spil', 'Longest game')}</span></div>
                        <div><strong>{authState.stats.flestFelter}</strong><span>{tekst('Flest felter', 'Most fields')}</span></div>
                        <div><strong>{authState.stats.flestMiner}</strong><span>{tekst('Flest miner', 'Most mines')}</span></div>
                        <div><strong>{karakterNavn(authState.stats.favoritKarakter)}</strong><span>{tekst('Mest spillet', 'Most played')}</span></div>
                    </div>
                {/if}

                <div class="profil-medaljehylde" aria-label={tekst('Profilmedaljer', 'Profile medals')}>
                    {#each profilMedaljer() as medalje, index (`profil-hylde-${index}-${medalje.sti}`)}
                        <div class="profil-medalje" class:opnaaet={medalje.bedste || medalje.opnaaet} class:mytisk={medalje.mytisk}>
                            <button
                                type="button"
                                class="profil-medalje-knap"
                                class:kan-aabnes={true}
                                onclick={() => aabnLaastTrofae(medalje)}
                                aria-label={medalje.bedste ? medaljeLabel(medalje) : medalje.opnaaet ? tekst(`Se ${medaljeLabel(medalje)}`, `View ${medaljeLabel(medalje)}`) : tekst(`Se krav for ${medaljeLabel(medalje)}`, `View requirement for ${medaljeLabel(medalje)}`)}
                            >
                                <img
                                    src={medalje.sti}
                                    alt={medaljeLabel(medalje)}
                                    class:bedste={medalje.bedste}
                                    class:trofae-opnaaet={medalje.opnaaet}
                                    class:mytiskPuls={medalje.mytisk || erM11Medalje(medalje.sti)}
                                    style={medalje.mytisk || erM11Medalje(medalje.sti) ? medaljePulsStyle(index) : undefined}
                                    draggable="false"
                                />
                            </button>
                            <div class="profil-medalje-tekst">
                                <span>{medaljeLabel(medalje)}</span>
                                {#if medalje.mytisk}
                                    <span class="profil-medalje-niveau">({medaljeNiveauLabel(medalje)})</span>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>

                {#if authState.stats}
                    <div class="profil-liste">
                        <div class="profil-spil-header">
                            <h3>{tekst('Find dine spil', 'Find your runs')}</h3>
                            <span>{tekst('Søg på ø, karakter eller dato – eller angiv en mindstescore.', 'Search by island, character or date – or enter a minimum score.')}</span>
                        </div>
                        <input
                            class="profil-spil-soeg"
                            bind:value={profilSpilSoegning}
                            placeholder={tekst('Søg i spil eller skriv en mindstescore...', 'Search runs or enter a minimum score...')}
                            aria-label={tekst('Søg i dine gemte spil', 'Search your saved runs')}
                        />
                        {#if authState.stats.spilHistorik.length === 0}
                            <p>{tekst('Ingen gemte spil endnu.', 'No saved runs yet.')}</p>
                        {:else if profilSpilSoegeresultater().length === 0}
                            <p>{tekst('Ingen spil matcher din søgning.', 'No runs match your search.')}</p>
                        {:else}
                            <div class="profil-spil-resultater">
                                {#each profilSpilSoegeresultater() as spil (spil.id)}
                                    <button type="button" class="profil-spil-row" onclick={() => aabnProfilSpil(spil)}>
                                        <span class="profil-spil-main">
                                            <strong>{formaterNavn(spil.roomCode || tekst('Ukendt ø', 'Unknown island'))}</strong>
                                            <em>{formaterProfilSpilDato(spil.createdAt)}</em>
                                        </span>
                                        <span class="profil-spil-meta">
                                            <span>{karakterNavn(spil.character || tekst('Ukendt', 'Unknown'))}</span>
                                            <span>{spillerStatus({ isWinner: spil.isWinner, isDead: spil.isDead, deathCause: spil.deathCause })}</span>
                                            <span>{tekst(`${spil.days} dage`, `${spil.days} days`)}</span>
                                            <span>{tekst(`${spil.gold} guld`, `${spil.gold} gold`)}</span>
                                        </span>
                                        <strong class="profil-spil-score">{spil.score}</strong>
                                    </button>
                                {/each}
                            </div>
                            {#if profilSpilSoegeresultater().length < authState.stats.spilHistorik.length}
                                <p class="profil-spil-hint">{tekst('Viser de første resultater. Søg mere præcist for at finde ældre spil.', 'Showing the first results. Search more precisely to find older runs.')}</p>
                            {/if}
                        {/if}
                    </div>
                {:else}
                    <p class="konto-hint">{tekst('Ingen statistik endnu. Dine spil bliver gemt her, når du er logget ind.', 'No statistics yet. Your runs are saved here when you are logged in.')}</p>
                {/if}
            </div>
        </div>
    {/if}
{/snippet}

{#snippet offentligSpillerProfilModal()}
    {#if offentligSpillerProfil}
        <div class="offentlig-profil-overlay" role="presentation">
            <button type="button" class="offentlig-profil-backdrop" onclick={() => offentligSpillerProfil = null} aria-label={tekst('Luk spillerprofil', 'Close player profile')}></button>
            <div class="offentlig-profil-modal" role="dialog" aria-modal="true" aria-labelledby="offentlig-profil-title" tabindex="-1">
                <div class="offentlig-profil-header">
                    <img src={offentligProfilKarakter(offentligSpillerProfil).ikon} alt="" />
                    <div>
                        <h2 id="offentlig-profil-title">{formaterNavn(offentligSpillerProfil.navn)}</h2>
                        <p>{offentligProfilTitel(offentligSpillerProfil)}</p>
                    </div>
                    <button type="button" onclick={() => offentligSpillerProfil = null}>{tekst('Luk', 'Close')}</button>
                </div>

                {#if offentligSpillerProfil.henter}
                    <p class="offentlig-profil-note">{tekst('Henter spillerprofil...', 'Loading player profile...')}</p>
                {:else}
                    <section class="offentlig-profil-medaljer" aria-label={tekst('Spillerens medaljer', 'Player medals')}>
                        <div class="profil-medaljehylde offentlig-profil-medaljehylde">
                            {#each offentligProfilMedaljer(offentligSpillerProfil) as medalje, i (`offentlig-profil-hylde-${i}-${medalje.sti}`)}
                                <div class="profil-medalje opnaaet" class:mytisk={medalje.mytisk}>
                                    <button
                                        type="button"
                                        class="profil-medalje-knap kan-aabnes"
                                        onclick={() => aabnOffentligProfilMedalje(medalje)}
                                        aria-label={tekst(`Se ${medaljeLabel(medalje)}`, `View ${medaljeLabel(medalje)}`)}
                                    >
                                        <img
                                            src={medalje.sti}
                                            alt={medaljeLabel(medalje)}
                                            class:bedste={medalje.bedste}
                                            class:mytiskPuls={medalje.mytisk}
                                            style={medalje.mytisk ? medaljePulsStyle(i) : undefined}
                                            draggable="false"
                                        />
                                    </button>
                                    <div class="profil-medalje-tekst">
                                        <span>{medaljeLabel(medalje)}</span>
                                        {#if medaljeNiveauLabel(medalje)}
                                            <span class="profil-medalje-niveau">({medaljeNiveauLabel(medalje)})</span>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                        {#if offentligProfilMedaljer(offentligSpillerProfil).length === 0}
                            <p class="offentlig-profil-note">{tekst('Ingen gemte medaljer endnu.', 'No saved medals yet.')}</p>
                        {/if}
                    </section>
                {/if}
            </div>
        </div>
    {/if}
{/snippet}

{#snippet highscoreDetaljeModal()}
    {#if valgtHighscore}
        <div class="highscore-detail-overlay" role="presentation">
            <button type="button" class="highscore-detail-backdrop" onclick={lukHighscoreDetaljer} aria-label={tekst('Luk scoreopgørelse', 'Close score breakdown')}></button>
            <div class="highscore-detail-modal" role="dialog" aria-modal="true" aria-labelledby="highscore-detail-title" tabindex="-1">
                <div class="highscore-detail-header">
                    <div>
                        <button
                            type="button"
                            class="highscore-filter-link highscore-name-link"
                            onclick={aabnSpillerProfilFraHighscore}
                        >
                            <h2 id="highscore-detail-title">{formaterNavn(valgtHighscore.navn)}</h2>
                        </button>
                        <p>
                            {#if valgtHighscore.karakter}
                                <button
                                    type="button"
                                    class="highscore-filter-link"
                                    onclick={aabnKarakterHighscoreFilter}
                                >
                                    {karakterNavn(valgtHighscore.karakter)}
                                </button>
                            {:else}
                                {tekst('Ukendt', 'Unknown')}
                            {/if}
                            {#if valgtHighscore.oeNavn}
                                <span>, </span>
                                <button
                                    type="button"
                                    class="highscore-filter-link"
                                    onclick={aabnOeHighscoreFilter}
                                >
                                    {formaterNavn(valgtHighscore.oeNavn)}
                                </button>
                            {/if}
                        </p>
                    </div>
                    <button type="button" onclick={lukHighscoreDetaljer}>{tekst('Luk', 'Close')}</button>
                </div>

                <div class="highscore-detail-total">
                    <span>{tekst('SAMLET SCORE', 'TOTAL SCORE')}</span>
                    <strong>{valgtHighscore.point}</strong>
                    <img
                        src={findHighscoreMedalje(valgtHighscore)}
                        alt={tekst('Medalje', 'Medal')}
                        class:mytiskPuls={erM11Medalje(findHighscoreMedalje(valgtHighscore))}
                        style={erM11Medalje(findHighscoreMedalje(valgtHighscore)) ? medaljePulsStyle(0) : undefined}
                    />
                </div>

                {#if valgtHighscore.henterDetaljer}
                    <p class="highscore-detail-note">{tekst('Henter opgørelse...', 'Loading breakdown...')}</p>
                {:else if harHighscoreDetaljer(valgtHighscore)}
                    {#if valgtHighscore.oeNulstillet}
                        <p class="highscore-detail-note">{tekst('Alle øer blev nulstillet den 17/7 kl. 02. Denne score er fra før nulstillingen.', 'All islands were reset on 17 July at 02:00. This score is from before the reset.')}</p>
                    {/if}
                    {@const miniRute = highscoreMiniRute(valgtHighscore)}
                    {#if highscoreTrofaeer(valgtHighscore).length > 0}
                        <section class="highscore-detail-trofaeer" aria-label={tekst('Trofæmedaljer opnået i dette spil', 'Trophy medals earned in this run')}>
                            <span>{tekst('Trofæmedaljer opnået', 'Trophy medals earned')}</span>
                            <div class="highscore-detail-trofae-liste">
                                {#each highscoreTrofaeer(valgtHighscore) as trofae (trofae.id)}
                                    <figure>
                                        <button
                                            type="button"
                                            class="highscore-detail-trofae-knap"
                                            onclick={() => aabnHighscoreTrofaeInfo(trofae)}
                                            aria-label={tekst(`Se mytisk krav for ${medaljeLabel(trofae)}`, `View Mythic requirement for ${medaljeLabel(trofae)}`)}
                                        >
                                            <span class="highscore-detail-trofae-navn">{medaljeLabel(trofae)}</span>
                                            {#if trofaeAwardDetalje(trofae)}
                                                <p>{trofaeAwardDetalje(trofae)}</p>
                                            {/if}
                                            <img src={trofae.sti} alt={medaljeLabel(trofae)} draggable="false" />
                                        </button>
                                    </figure>
                                {/each}
                            </div>
                        </section>
                    {/if}

                    <section class="highscore-detail-logbog" aria-label={tekst('Logbog', 'Logbook')}>
                        <span>{tekst('Logbog', 'Logbook')}</span>
                        <button type="button" class="highscore-log-button" onclick={() => visHighscoreLog = true} aria-label={tekst('Åbn logbog', 'Open logbook')} title={tekst('Åbn logbog', 'Open logbook')}>
                            <img src="/ui/logbog.webp" alt="" />
                        </button>
                    </section>

                    {#if highscoreTrofaeMaalinger(valgtHighscore).length > 0}
                        <section class="highscore-detail-maalinger" aria-label={tekst('Trofæfremdrift', 'Trophy progress')}>
                            <p class="highscore-detail-maalinger-meta">
                                {highscoreStatus(valgtHighscore)} · {talEllerUkendt(valgtHighscore.dage)} {tekst('dage', 'days')} · {highscoreSpillerAntal(valgtHighscore)}
                            </p>
                            <div>
                                {#each highscoreTrofaeMaalinger(valgtHighscore) as maaling (maaling.key)}
                                    <p><span>{maaling.label}</span><strong>{maaling.value}</strong></p>
                                {/each}
                            </div>
                        </section>
                    {/if}

                    {#if miniRute}
                        <section class="highscore-detail-rute" aria-label={tekst('Rute', 'Route')}>
                            <span>{tekst('Rute', 'Route')}</span>
                            <div class="highscore-route-preview">
                                <svg viewBox={miniRute.viewBox} preserveAspectRatio="xMidYMid meet">
                                    <polyline
                                        points={miniRute.points}
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.88)"
                                        stroke-width="8"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="highscore-route-line"
                                    />
                                    <circle cx={miniRute.start.x} cy={miniRute.start.y} r="7" class="highscore-route-start" />
                                    <circle cx={miniRute.slut.x} cy={miniRute.slut.y} r="9" class="highscore-route-end" />
                                </svg>
                            </div>
                        </section>
                    {/if}
                {:else}
                    <p class="highscore-detail-note">{tekst('Denne score er gemt før detaljeopgørelsen, så kun totalscoren er tilgængelig.', 'This score was saved before detailed breakdowns, so only the total score is available.')}</p>
                {/if}

                {#if highscoreDrilldown}
                    <div class="highscore-filter-panel">
                        <div class="highscore-filter-header">
                            <h3>{highscoreDrilldown.titel}</h3>
                            <button type="button" onclick={() => highscoreDrilldown = null}>{tekst('Skjul', 'Hide')}</button>
                        </div>
                        {#if highscoreDrilldown.henter}
                            <p class="highscore-detail-note">{tekst('Henter liste...', 'Loading list...')}</p>
                        {:else if highscoreDrilldown.scores.length === 0}
                            <p class="highscore-detail-note">{tekst('Ingen resultater fundet.', 'No results found.')}</p>
                        {:else}
                            <ol class="highscore-filter-list">
                                {#each highscoreDrilldown.scores as score, i (score.id || `${score.spillerNavn}-${score.point}-${score.oeNavn}-${i}`)}
                                    <li>
                                        <button type="button" onclick={() => aabnHighscoreFraFilter(score)}>
                                            <span>{i + 1}.</span>
                                            <strong>{formaterHighscoreNavn(score.spillerNavn)}</strong>
                                            <em>{karakterNavn(score.karakter)}, {formaterNavn(score.oeNavn)}</em>
                                            <b>{score.point}</b>
                                        </button>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                    </div>
                {/if}

            </div>

            {#if visHighscoreLog}
                <div class="highscore-log-overlay" role="presentation">
                    <button type="button" class="highscore-log-backdrop" onclick={() => visHighscoreLog = false} aria-label={tekst('Luk logbog', 'Close logbook')}></button>
                    <div class="highscore-log-modal" role="dialog" aria-modal="true" aria-labelledby="highscore-log-title" tabindex="-1">
                        <div class="highscore-log-header">
                            <h3 id="highscore-log-title">{tekst('Logbog', 'Logbook')}</h3>
                            <button type="button" onclick={() => visHighscoreLog = false} aria-label={tekst('Luk logbog', 'Close logbook')}>{tekst('Luk', 'Close')}</button>
                        </div>
                        <div class="highscore-log-list">
                            {#if highscoreLogLinjer(valgtHighscore).length > 0}
                                {#each highscoreLogLinjer(valgtHighscore) as linje, index (index)}
                                    <p>{linje}</p>
                                {/each}
                            {:else}
                                <p>{tekst('Logbogen er ikke gemt for denne score endnu.', 'The logbook has not been saved for this score yet.')}</p>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
{/snippet}

{#snippet scoreGemStatus()}
    {#if scoreGemmer || scoreGemningFejlet}
        <div class="score-save-status" class:fejl={scoreGemningFejlet}>
            {#if scoreGemmer}
                <span>{tekst('Gemmer score...', 'Saving score...')}</span>
            {:else}
                <span>{spilTilstand.statusBesked || tekst('Scoren blev ikke gemt.', 'The score was not saved.')}</span>
                <button type="button" onclick={gemScoreIgen}>{tekst('Prøv igen', 'Try again')}</button>
                {#if !authState.user && ER_ITCH_BUILD}
                    <div class="score-login-redning konto-live-link">
                        <button type="button" onclick={aabnLiveVersion}>
                            {tekst('Spil nyeste version og opret konto', 'Play latest version and create an account')}
                        </button>
                    </div>
                {:else if !authState.user}
                    <div class="score-login-redning">
                        <input
                            type="email"
                            bind:value={authState.email}
                            placeholder={tekst('E-mailadresse til login', 'Email address for login')}
                            onkeydown={(e) => { if (e.key === 'Enter') sendLoginLink(authState.email); }}
                        />
                        <button type="button" onclick={() => sendLoginLink(authState.email)} disabled={authState.loader}>
                            {authState.loader ? tekst('Sender...', 'Sending...') : tekst('Log ind igen', 'Log in again')}
                        </button>
                    </div>
                    {#if authState.besked}
                        <span class="score-login-besked">{authState.besked}</span>
                    {/if}
                {/if}
            {/if}
        </div>
    {/if}
{/snippet}

{#snippet ugensGlobalHighscoreTavle(kontekst: 'start' | 'slut')}
    {@const sideStart = highscoreSideStart(ugensGlobalHighscoreSide, ugensGlobaleScores)}
    <div class="tavle">
        <img src="/screens/boardglobal.webp" alt={tekst('Ugens globale topliste', "This week's global leaderboard")} class="tavle-billede" />
        <div class="tavle-indhold global-indhold">
            <h3 class="uge-titel">{tekst('Topliste · uge', 'Leaderboard · week')} {aktuelIsoUge()}</h3>
            {#if ugensGlobaleScores.length === 0}
                <p class="tom-liste">{tekst('Ingen resultater endnu i denne uge', 'No results yet this week')}</p>
            {:else}
                <ol start={sideStart + 1}>
                    {#each highscoreSide(ugensGlobaleScores, ugensGlobalHighscoreSide) as score, i (sideStart + i)}
                        <li>
                            <button type="button" class="highscore-række" onclick={() => aabnGlobalHighscore(score)} aria-label={tekst(`Vis scoreopgørelse for ${score.spillerNavn}`, `Show score breakdown for ${score.spillerNavn}`)}>
                                <span class="placering">{sideStart + i + 1}.</span>
                                <span class="navn">{formaterHighscoreNavn(score.spillerNavn)} <span class="karakter-navn">({karakterNavn(score.karakter)}, {formaterNavn(score.oeNavn)})</span></span>
                                <span class="point">{score.point}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
            {/if}
        </div>
        {#if ugensGlobaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
            <div class="highscore-pager">
                <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeUgensGlobalHighscoreSide} aria-label={tekst('Vis de forrige 10 resultater fra denne uge', 'Show previous 10 scores from this week')}>
                    &lt;
                </button>
                <button type="button" class="highscore-naeste" onclick={naesteUgensGlobalHighscoreSide} aria-label={tekst('Vis de næste 10 resultater fra denne uge', 'Show next 10 scores from this week')}>
                    &gt;
                </button>
            </div>
        {/if}
        <button
            type="button"
            class="topliste-skift"
            onclick={() => kontekst === 'start' ? startToplisteVisning = 'global' : slutToplisteVisning = 'global'}
            title={tekst('Ugens topliste · skift til global', "This week's leaderboard · switch to global")}
            aria-label={tekst('Ugens topliste. Skift til global topliste', "This week's leaderboard. Switch to the global leaderboard")}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                <path d="M7.5 3v4M16.5 3v4M3.5 9h17M7.5 12.5h2M11 12.5h2M14.5 12.5h2M7.5 16h2M11 16h2M14.5 16h2" />
            </svg>
        </button>
    </div>
{/snippet}

{#snippet globalHighscoreTavle(kontekst: 'start' | 'slut')}
    {@const sideStart = highscoreSideStart(globalHighscoreSide, globaleScores)}
    <div class="tavle">
        <img src="/screens/boardglobal.webp" alt={tekst('Global topliste', 'Global leaderboard')} class="tavle-billede" />
        <div class="tavle-indhold global-indhold">
            <h3>{tekst('Global topliste', 'Global leaderboard')}</h3>
            {#if globaleScores.length === 0}
                <p class="tom-liste">{tekst('Ingen data endnu', 'No data yet')}</p>
            {:else}
                <ol start={sideStart + 1}>
                    {#each highscoreSide(globaleScores, globalHighscoreSide) as score, i (sideStart + i)}
                        <li>
                            <button type="button" class="highscore-række" onclick={() => aabnGlobalHighscore(score)} aria-label={tekst(`Vis scoreopgørelse for ${score.spillerNavn}`, `Show score breakdown for ${score.spillerNavn}`)}>
                                <span class="placering">{sideStart + i + 1}.</span>
                                <span class="navn">{formaterHighscoreNavn(score.spillerNavn)} <span class="karakter-navn">({karakterNavn(score.karakter)}, {formaterNavn(score.oeNavn)})</span></span>
                                <span class="point">{score.point}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
            {/if}
        </div>
        {#if globaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
            <div class="highscore-pager">
                <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeGlobalHighscoreSide} aria-label={tekst('Vis de forrige 10 globale resultater', 'Show previous 10 global scores')}>
                    &lt;
                </button>
                <button type="button" class="highscore-naeste" onclick={naesteGlobalHighscoreSide} aria-label={tekst('Vis de næste 10 globale resultater', 'Show next 10 global scores')}>
                    &gt;
                </button>
            </div>
        {/if}
        <button
            type="button"
            class="topliste-skift"
            onclick={() => kontekst === 'start' ? startToplisteVisning = 'uge' : slutToplisteVisning = 'uge'}
            title={tekst('Global topliste · skift til uge', 'Global leaderboard · switch to week')}
            aria-label={tekst('Global topliste. Skift til ugens topliste', "Global leaderboard. Switch to this week's leaderboard")}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.8 12h16.4M12 3.5c2.4 2.2 3.7 5.1 3.7 8.5S14.4 18.3 12 20.5M12 3.5C9.6 5.7 8.3 8.6 8.3 12s1.3 6.3 3.7 8.5" />
            </svg>
        </button>
    </div>
{/snippet}

{#snippet klasseHighscoreTavle()}
    {@const sideStart = highscoreSideStart(klasseHighscoreSide, klasseScores)}
    <div class="tavle klasse-tavle">
        <img src="/screens/boardglobal.webp" alt={tekst('Topliste for karakterklassen', 'Character class leaderboard')} class="tavle-billede" />
        <div class="tavle-indhold global-indhold">
            <h3>{tekst('Toplisten', 'Leaderboard')} {highscoreKlasseNavn()}</h3>
            {#if klasseScores.length === 0}
                <p class="tom-liste">{tekst('Ingen data endnu', 'No data yet')}</p>
            {:else}
                <ol start={sideStart + 1}>
                    {#each highscoreSide(klasseScores, klasseHighscoreSide) as score, i (sideStart + i)}
                        <li>
                            <button type="button" class="highscore-række" onclick={() => aabnGlobalHighscore(score)} aria-label={tekst(`Vis scoreopgørelse for ${score.spillerNavn}`, `Show score breakdown for ${score.spillerNavn}`)}>
                                <span class="placering">{sideStart + i + 1}.</span>
                                <span class="navn">{formaterHighscoreNavn(score.spillerNavn)} <span class="karakter-navn">({karakterNavn(score.karakter)}, {formaterNavn(score.oeNavn)})</span></span>
                                <span class="point">{score.point}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
            {/if}
        </div>
        {#if klasseScores.length > HIGHSCORE_SIDE_STOERRELSE}
            <div class="highscore-pager">
                <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeKlasseHighscoreSide} aria-label={tekst('Vis de forrige 10 resultater for karakterklassen', 'Show previous 10 scores for the character class')}>
                    &lt;
                </button>
                <button type="button" class="highscore-naeste" onclick={naesteKlasseHighscoreSide} aria-label={tekst('Vis de næste 10 resultater for karakterklassen', 'Show next 10 scores for the character class')}>
                    &gt;
                </button>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet topKnapper()}
    <div class="screen-top-actions">
        <Regelbog />
        <SprogKnap />
        <LydKnap knapClass="screen-sound-btn" />
    </div>
{/snippet}

{#if spilTilstand.gameState === 'start'}
    <div class="overlay start-overlay">
        <div class="start-fog start-fog-left"></div>
        <div class="start-fog start-fog-right"></div>
        <div class="login-box combined-box start-shell">
            {@render topKnapper()}

            <section class="start-hero" aria-labelledby="start-title">
                <button type="button" class="boat-btn-wrapper start-boat" onclick={(e) => { e.preventDefault(); startSpilFraHero(); }}>
                    <img src="/screens/FogIsland.webp" alt={tekst('Båd ved tågeøen', 'Boat by the fog island')} class="launch-image clickable-boat" />
                </button>
                <div class="start-copy">
                    <p class="start-eyebrow">{tekst('En ny ø venter', 'A new island awaits')}</p>
                    <h1 id="start-title">{tekst('Tågeøerne', 'Fog Island')}</h1>
                    <p class="start-tagline">{tekst('Udforsk øen, hold dig foran tågen og find en båd mod øst.', 'Explore the island, stay ahead of the fog and find a boat to the east.')}</p>
                </div>
            </section>

            <div class="start-intel">
                <span>{tekst('Det samme ønavn skaber altid den samme ø', 'The same island name always creates the same island')}</span>
                <strong>{tekst('Andre spillere kan slutte sig til i de første fem dage.', 'Other players can join during the first five days.')}</strong>
            </div>

            <div class="login-main start-form">
                {@render kontoPanel()}
                
                {#if !authState.user}
                    <input 
                        type="text" 
                        bind:value={spilTilstand.spillerNavn} 
                        maxlength="15" 
                        placeholder={tekst('Spillernavn', 'Player name')}
                        class="large-input" 
                        oninput={planlaegProfilNavnGem}
                        onkeydown={trykEnter}
                    />
                {/if}
                
                <div class="oe-input-wrap">
                    <input 
                        type="text" 
                        bind:value={spilTilstand.rumKode} 
                        maxlength="10" 
                        placeholder={tekst('Øens navn', 'Island name')}
                        class="large-input oe-input" 
                        onkeydown={trykEnter}
                    />
                    <button type="button" class="autonavn-knap" onclick={foreslaaOeNavn} aria-label={tekst('Foreslå ønavn', 'Suggest island name')} title={tekst('Foreslå ønavn', 'Suggest island name')}>↻</button>
                </div>
                
                <div class="start-knap-raekke">
                    <button type="button" class="spil-knap login-boat-btn" onclick={(e) => { e.preventDefault(); startSpilMedLyd(); }}>
                        <span class="knap-tekst">START</span>
                    </button>
                    {#if visTutorialStartKnap}
                        <button type="button" class="tutorial-start-knap" onclick={(e) => { e.preventDefault(); startTutorialMedLyd(); }} aria-label={tekst('Start tutorial', 'Start tutorial')}>
                            <img src="/screens/tutorialstart.webp" alt="" class="tutorial-start-ikon" />
                            <span>Tutorial</span>
                        </button>
                    {/if}
                </div>

                {#if visLokaleTestKnapper}
                    <div class="localhost-testkort" aria-label="Lokale testkort">
                        {#each lokaleKortPresets as preset}
                            <button type="button" onclick={() => vaelgLokaltTestKort(preset.bredde, preset.hoejde)}>
                                {preset.label}
                            </button>
                        {/each}
                    </div>
                {/if}

            </div>

            <p class="status larger-status">{spilTilstand.statusBesked}</p>
            
            <div class="start-tavle">
                {#if startToplisteVisning === 'uge'}
                    {@render ugensGlobalHighscoreTavle('start')}
                {:else}
                    {@render globalHighscoreTavle('start')}
                {/if}
            </div>

            <div class="offline-bottom">
                <button
                    type="button"
                    class="ballon-download"
                    class:klar={offlineAppState.klar}
                    onclick={goerOfflineAppKlar}
                    disabled={offlineAppState.arbejder || offlineAppState.klar}
                    title={tekst('Offline / Flytilstand', 'Offline / Flight mode')}
                    aria-label={tekst('Offline / Flytilstand', 'Offline / Flight mode')}
                >
                    <img src="/ui/flight.webp" alt="" class="flight-ikon" />
                    <span>{offlineAppState.arbejder ? tekst('Gør klar...', 'Preparing...') : tekst('Offline / Flytilstand', 'Offline / Flight mode')}</span>
                </button>
                {#if !offlineAppState.klar}
                    <p class="fly-hint">{tekst('Tryk her, før du går offline', 'Tap here before going offline')}</p>
                {/if}
                {#if offlineAppBesked()}
                    <p class="offline-besked">{offlineAppBesked()}</p>
                {/if}

                {#if harGemtOfflineSpil}
                    <button type="button" class="offline-continue" onclick={(e) => { e.preventDefault(); fortsaetOfflineMedLyd(); }}>
                        {tekst('Fortsæt offline', 'Continue offline')}{offlineSpilInfo ? `: ${formaterNavn(offlineSpilInfo.rumKode)} ${tekst('dag', 'day')} ${offlineSpilInfo.dag}` : ''}
                    </button>
                {/if}
                {#if authState.user && !erAnonymBruger()}
                    <button type="button" class="start-logud-knap" onclick={logUd}>{tekst('Log ud', 'Log out')}</button>
                {/if}
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            {@render topKnapper()}
            <h2>{tekst('Vælg din karakter, inden du går i land på', 'Choose your character before landing on')} {formaterNavn(spilTilstand.rumKode)}</h2>
            <div class="select-island-status" class:lukket={!karaktervalgStatus.kanJoine}>
                <span>{karaktervalgStatus.aktiveAntal === 1 ? tekst('1 på øen', '1 on the island') : tekst(`${karaktervalgStatus.aktiveAntal} på øen`, `${karaktervalgStatus.aktiveAntal} on the island`)}</span>
                <span>{tekst('Dag', 'Day')} {karaktervalgStatus.dag}</span>
                <strong>{karaktervalgStatus.kanJoine ? tekst('Åben', 'Open') : tekst('Lukket', 'Closed')}</strong>
            </div>
            <p class="instruktion">
                {tekst('Øen har givet dig otte muligheder.', 'The island has given you eight options.')}
            </p>
            
            <div class="character-gallery">
                {#each udvalgteSkæbner as k (k.id)}
                    <div
                        class="char-card"
                        role="button"
                        tabindex="0"
                        onclick={() => bekræftValg(k)}
                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') bekræftValg(k); }}
                    >
                        <img src={k.ikon} alt={karakterNavn(k)} class="char-icon" />
                        <h3>{karakterNavn(k)}</h3>
                        <div class="stats">
                            <div class="stats-toplinje">
                                <span>HP: {k.startHp}</span>
                                <span class="stats-skilletegn" aria-hidden="true">|</span>
                                <span>{tekst('Energi', 'Energy')}: {k.baseEnergi}</span>
                            </div>
                            <div class="stats-guld">
                                <span class="stats-skilletegn" aria-hidden="true">|</span>
                                <span>{tekst('Guld', 'Gold')}: {k.startGuld}</span>
                            </div>
                        </div>
                        <p class="desc positive"><span class="klasse-navn">{karakterKlasseNavnEntal(k)}:</span> {karakterFordelUdenKlasse(k)}</p>
                        <p class="desc negative">{karakterStartUdstyrTekst(k)}</p>
                    </div>
                {/each}
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'dead'}
    <div class="slutskærm death-screen">
        <div class="slut-scroll">
            <div class="medalje-sektion">
                {#if authState.user}
                    <button type="button" class="medalje-profil-knap" onclick={aabnProfil} aria-label={tekst('Åbn din profil', 'Open your profile')}>
                        <img src={findMedalje(spilTilstand.samletScore)} alt={tekst('Medalje', 'Medal')} class="stor-medalje" class:mytiskPuls={erM11Medalje(findMedalje(spilTilstand.samletScore))} style={erM11Medalje(findMedalje(spilTilstand.samletScore)) ? medaljePulsStyle(0) : undefined} draggable="false" />
                    </button>
                {:else}
                    <img src={findMedalje(spilTilstand.samletScore)} alt={tekst('Medalje', 'Medal')} class="stor-medalje" class:mytiskPuls={erM11Medalje(findMedalje(spilTilstand.samletScore))} style={erM11Medalje(findMedalje(spilTilstand.samletScore)) ? medaljePulsStyle(0) : undefined} draggable="false" />
                {/if}
            </div>
            
            <h1 class="doeds-titel">{tekst(`${formaterNavn(spilTilstand.spillerNavn)} døde på ${formaterNavn(spilTilstand.rumKode)}`, `${formaterNavn(spilTilstand.spillerNavn)} died on ${formaterNavn(spilTilstand.rumKode)}`)}</h1>
            <img src="/screens/death.webp" alt={tekst('Døden', 'Death')} class="doeds-symbol" />
            <p class="beskrivelse">
                {spilTilstand.logBesked} {hentMinHistorie(false)}
            </p>
            
            <div class="score-container">
                <img src="/screens/pergament.webp" alt={tekst('Pergament', 'Parchment')} class="pergament-billede" />
                <h2 class="score-tekst">
                    <span class="lille-score">Score:</span> {spilTilstand.samletScore}
                </h2>
            </div>

            <div class="spec-paneler">
                {@render pointSpecifikation()}
                {@render sessionTavle()}
            </div>

            {#if spilTilstand.gameMode !== 'tutorial'}
                {@render slutTrofaeStatus()}
            {/if}
            
            <div class="slut-knapper">
                <button class="spil-knap slut-knap-styled" onclick={genstartBane}>
                    <span class="knap-tekst">{tekst('Samme ø igen', 'Same island again')}</span>
                </button>
                <button class="spil-knap slut-knap-styled" onclick={nulstilHukommelse}>
                    <span class="knap-tekst">{tekst('Til start', 'Main menu')}</span>
                </button>
            </div>
            
            {#if spilTilstand.gameMode === 'tutorial'}
                <div class="tutorial-resultat-container">
                    {@render tutorialResultatTavle()}
                </div>
            {:else}
            <div class="highscore-container">
                {@render scoreGemStatus()}
                <div class="tavle">
                    <img src="/screens/boardlocal.webp" alt={tekst('Øens topliste', 'Island leaderboard')} class="tavle-billede" />
                    <div class="tavle-indhold lokal-indhold">
                        <h3>{tekst('Toplisten for', 'Leaderboard for')} {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">{tekst('Ingen resultater endnu', 'No results yet')}</p>
                        {:else}
                            <ol start={highscoreSideStart(lokalHighscoreSide, lokaleScores) + 1}>
                                {#each lokalHighscoreSideScores(lokaleScores, lokalHighscoreSide) as hs, i (highscoreSideStart(lokalHighscoreSide, lokaleScores) + i)}
                                    <li>
                                        <button type="button" class="highscore-række" onclick={() => aabnLokalHighscore(hs)} aria-label={tekst(`Vis scoreopgørelse for ${hs.navn}`, `Show score breakdown for ${hs.navn}`)}>
                                            <span class="placering">{highscoreSideStart(lokalHighscoreSide, lokaleScores) + i + 1}.</span>
                                            <span class="navn">{formaterHighscoreNavn(hs.navn)} <span class="karakter-navn">({karakterNavn(hs.karakter)})</span></span>
                                            <span class="point">{hs.score}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                        {#if spilTilstand.offlineMode}
                            <p class="global-note tavle-note-bund">{tekst('Gemt lokalt i browseren.', 'Saved locally in the browser.')}</p>
                        {:else if !authState.user}
                            <p class="global-note tavle-note-bund">{tekst('Log ind for at gemme din score.', 'Log in to save your score.')}</p>
                        {/if}
                    </div>
                    {#if lokaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
                        <div class="highscore-pager">
                            <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeLokalHighscoreSide} aria-label={tekst('Vis de forrige 10 resultater på øen', 'Show previous 10 scores on the island')}>
                                &lt;
                            </button>
                            <button type="button" class="highscore-naeste" onclick={naesteLokalHighscoreSide} aria-label={tekst('Vis de næste 10 resultater på øen', 'Show next 10 scores on the island')}>
                                &gt;
                            </button>
                        </div>
                    {/if}
                </div>
                {#if !spilTilstand.offlineMode}
                    {@render klasseHighscoreTavle()}
                {/if}
                {#if !spilTilstand.offlineMode}
                    {#if slutToplisteVisning === 'uge'}
                        {@render ugensGlobalHighscoreTavle('slut')}
                    {:else}
                        {@render globalHighscoreTavle('slut')}
                    {/if}
                {/if}
            </div>
            {/if}
        </div>
    </div>

{:else if spilTilstand.gameState === 'win'}
    <div class="slutskærm sejrsskaerm">
        <div class="slut-scroll">
            <div class="medalje-sektion">
                {#if authState.user}
                    <button type="button" class="medalje-profil-knap" onclick={aabnProfil} aria-label={tekst('Åbn din profil', 'Open your profile')}>
                        <img src={findMedalje(spilTilstand.samletScore)} alt={tekst('Medalje', 'Medal')} class="stor-medalje" class:mytiskPuls={erM11Medalje(findMedalje(spilTilstand.samletScore))} style={erM11Medalje(findMedalje(spilTilstand.samletScore)) ? medaljePulsStyle(0) : undefined} draggable="false" />
                    </button>
                {:else}
                    <img src={findMedalje(spilTilstand.samletScore)} alt={tekst('Medalje', 'Medal')} class="stor-medalje" class:mytiskPuls={erM11Medalje(findMedalje(spilTilstand.samletScore))} style={erM11Medalje(findMedalje(spilTilstand.samletScore)) ? medaljePulsStyle(0) : undefined} draggable="false" />
                {/if}
            </div>
            <h1 class="sejr-titel">{tekst(`${formaterNavn(spilTilstand.spillerNavn)}, du slap væk fra ${formaterNavn(spilTilstand.rumKode)}`, `${formaterNavn(spilTilstand.spillerNavn)}, you escaped from ${formaterNavn(spilTilstand.rumKode)}`)}</h1>
            <p class="beskrivelse">
                {hentMinHistorie(true)}
            </p>
            {@render episkeTrofaeer()}
            
            <div class="score-container">
                <img src="/screens/pergament.webp" alt={tekst('Pergament', 'Parchment')} class="pergament-billede" />
                <h2 class="score-tekst">
                    <span class="lille-score">Score:</span> {spilTilstand.samletScore}
                </h2>
            </div>

            <div class="spec-paneler">
                {@render pointSpecifikation()}
                {@render sessionTavle()}
            </div>

            {#if spilTilstand.gameMode !== 'tutorial'}
                {@render slutTrofaeStatus()}
            {/if}
            
            <div class="slut-knapper">
                <button class="spil-knap slut-knap-styled" onclick={genstartBane}>
                    <span class="knap-tekst">{tekst('Samme ø igen', 'Same island again')}</span>
                </button>
                <button class="spil-knap slut-knap-styled" onclick={nulstilHukommelse}>
                    <span class="knap-tekst">{tekst('Til start', 'Main menu')}</span>
                </button>
            </div>
            
            {#if spilTilstand.gameMode === 'tutorial'}
                <div class="tutorial-resultat-container">
                    {@render tutorialResultatTavle()}
                </div>
            {:else}
            <div class="highscore-container">
                {@render scoreGemStatus()}
                <div class="tavle">
                    <img src="/screens/boardlocal.webp" alt={tekst('Øens topliste', 'Island leaderboard')} class="tavle-billede" />
                    <div class="tavle-indhold lokal-indhold">
                        <h3>{tekst('Toplisten for', 'Leaderboard for')} {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">{tekst('Ingen resultater endnu', 'No results yet')}</p>
                        {:else}
                            <ol start={highscoreSideStart(lokalHighscoreSide, lokaleScores) + 1}>
                                {#each lokalHighscoreSideScores(lokaleScores, lokalHighscoreSide) as hs, i (highscoreSideStart(lokalHighscoreSide, lokaleScores) + i)}
                                    <li>
                                        <button type="button" class="highscore-række" onclick={() => aabnLokalHighscore(hs)} aria-label={tekst(`Vis scoreopgørelse for ${hs.navn}`, `Show score breakdown for ${hs.navn}`)}>
                                            <span class="placering">{highscoreSideStart(lokalHighscoreSide, lokaleScores) + i + 1}.</span>
                                            <span class="navn">{formaterHighscoreNavn(hs.navn)} <span class="karakter-navn">({karakterNavn(hs.karakter)})</span></span>
                                            <span class="point">{hs.score}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                        {#if spilTilstand.offlineMode}
                            <p class="global-note tavle-note-bund">{tekst('Gemt lokalt i browseren.', 'Saved locally in the browser.')}</p>
                        {:else if !authState.user}
                            <p class="global-note tavle-note-bund">{tekst('Log ind for at gemme din score.', 'Log in to save your score.')}</p>
                        {/if}
                    </div>
                    {#if lokaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
                        <div class="highscore-pager">
                            <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeLokalHighscoreSide} aria-label={tekst('Vis de forrige 10 resultater på øen', 'Show previous 10 scores on the island')}>
                                &lt;
                            </button>
                            <button type="button" class="highscore-naeste" onclick={naesteLokalHighscoreSide} aria-label={tekst('Vis de næste 10 resultater på øen', 'Show next 10 scores on the island')}>
                                &gt;
                            </button>
                        </div>
                    {/if}
                </div>
                {#if !spilTilstand.offlineMode}
                    {@render klasseHighscoreTavle()}
                {/if}
                {#if !spilTilstand.offlineMode}
                    {#if slutToplisteVisning === 'uge'}
                        {@render ugensGlobalHighscoreTavle('slut')}
                    {:else}
                        {@render globalHighscoreTavle('slut')}
                    {/if}
                {/if}
            </div>
            {/if}
        </div>
    </div>
{/if}

{@render profilModal()}
{@render laastTrofaeModal()}
{@render highscoreDetaljeModal()}
{@render offentligSpillerProfilModal()}

{#if visJoinLukketModal}
    <div class="join-lukket-overlay" role="dialog" aria-modal="true" aria-labelledby="join-lukket-title">
        <div class="join-lukket-modal">
            <h2 id="join-lukket-title">{tekst('Øen er lukket for nye spillere', 'The island is closed to new players')}</h2>
            <p>{tekst(`Du nåede ikke i land på ${formaterNavn(spilTilstand.rumKode)}, før spillet lukkede for nye spillere.`, `You did not reach ${formaterNavn(spilTilstand.rumKode)} before the game closed to new players.`)}</p>
            <button type="button" onclick={() => visJoinLukketModal = false}>OK</button>
        </div>
    </div>
{/if}

<style>
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100dvh; background: #1a1a1a; display: flex; align-items: flex-start; justify-content: center; z-index: 1000; font-family: system-ui, -apple-system, sans-serif; overflow-y: auto; padding: calc(env(safe-area-inset-top, 0px) + 18px) 18px calc(env(safe-area-inset-bottom, 0px) + 18px); box-sizing: border-box; -webkit-overflow-scrolling: touch; }
    .start-overlay {
        background:
            linear-gradient(180deg, rgba(8, 10, 9, 0.4) 0%, #111 58%, #160606 100%),
            radial-gradient(ellipse at 50% -8%, rgba(166, 190, 166, 0.28) 0%, rgba(30, 58, 49, 0.12) 34%, transparent 70%),
            linear-gradient(90deg, #080909 0%, #181a17 52%, #080706 100%);
        padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 18px);
        padding-top: 0;
        overflow-x: hidden;
    }
    .start-overlay::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 92px 92px;
        opacity: 0.12;
        mask-image: linear-gradient(180deg, transparent, #000 18%, #000 78%, transparent);
    }
    .start-overlay::after {
        content: "";
        position: fixed;
        inset: -18%;
        z-index: 0;
        pointer-events: none;
        background:
            radial-gradient(ellipse at 12% 42%, rgba(115, 206, 148, 0.34), transparent 31%),
            radial-gradient(ellipse at 62% 20%, rgba(162, 224, 176, 0.26), transparent 34%),
            radial-gradient(ellipse at 45% 72%, rgba(48, 145, 111, 0.34), transparent 34%),
            radial-gradient(ellipse at 88% 54%, rgba(133, 202, 158, 0.25), transparent 30%),
            linear-gradient(105deg, transparent 0%, rgba(111, 204, 151, 0.16) 34%, transparent 52%, rgba(78, 164, 132, 0.14) 72%, transparent 100%);
        filter: blur(30px);
        opacity: 1;
        mix-blend-mode: screen;
        animation: start-taage-drift 12s ease-in-out infinite alternate;
    }
    .start-fog {
        position: fixed;
        top: 0;
        bottom: 0;
        z-index: 0;
        width: min(28vw, 360px);
        pointer-events: none;
        opacity: 0.62;
        filter: blur(14px);
        background:
            radial-gradient(ellipse at 50% 28%, rgba(177, 238, 187, 0.34), transparent 32%),
            radial-gradient(ellipse at 50% 62%, rgba(73, 172, 139, 0.36), transparent 38%),
            linear-gradient(180deg, transparent 0%, rgba(185, 225, 190, 0.34) 32%, rgba(82, 158, 132, 0.32) 62%, transparent 100%);
    }
    .start-fog-left { left: -110px; transform: translateX(0) skewX(-8deg); animation: start-taage-left 9s ease-in-out infinite alternate; }
    .start-fog-right { right: -120px; transform: translateX(0) skewX(7deg); animation: start-taage-right 10s ease-in-out infinite alternate; animation-delay: -4s; }
    @keyframes start-taage-drift {
        from {
            transform: translate3d(-5%, 1.5%, 0) scale(1);
        }
        to {
            transform: translate3d(5%, -2.5%, 0) scale(1.1);
        }
    }
    @keyframes start-taage-left {
        from {
            opacity: 0.42;
            transform: translateX(-24px) skewX(-8deg) scaleY(1);
        }
        to {
            opacity: 0.78;
            transform: translateX(78px) skewX(-4deg) scaleY(1.08);
        }
    }
    @keyframes start-taage-right {
        from {
            opacity: 0.38;
            transform: translateX(28px) skewX(7deg) scaleY(1.05);
        }
        to {
            opacity: 0.72;
            transform: translateX(-86px) skewX(3deg) scaleY(0.98);
        }
    }
    .combined-box { max-height: none; overflow: visible; }
    .login-box { position: relative; background: transparent; padding: 38px 40px 40px; border-radius: 0; border: none; text-align: center; max-width: 900px; width: 90%; display: flex; flex-direction: column; align-items: center; }
    .start-shell {
        position: relative;
        z-index: 1;
        width: min(1240px, 100vw);
        max-width: none;
        padding: 0 0 40px;
    }
    .login-main { width: min(100%, 560px); display: flex; flex-direction: column; align-items: center; }
    .start-hero {
        position: relative;
        width: min(1240px, 100vw);
        min-height: 0;
        display: block;
        margin: 0;
        isolation: isolate;
        overflow: visible;
    }
    .start-hero::before {
        content: "";
        position: absolute;
        inset: 6% 7% auto;
        height: 54%;
        z-index: -2;
        background: radial-gradient(ellipse at center, rgba(190, 218, 190, 0.18), rgba(58, 71, 62, 0.1) 42%, transparent 72%);
        border-radius: 50%;
        filter: blur(18px);
    }
    .start-hero::after {
        content: none;
    }
    
    .boat-btn-wrapper { background: none; border: none; padding: 0; margin: 0; cursor: pointer; outline: none; }
    .start-boat {
        position: relative;
        display: block;
        width: 100%;
        opacity: 1;
        filter: drop-shadow(0 28px 36px rgba(0, 0, 0, 0.6));
    }
    .launch-image {
        display: block;
        width: 100%;
        max-width: 100%;
        height: auto;
        object-fit: contain;
        object-position: center top;
        border-radius: 0;
        transition: 0.2s;
    }
    .launch-image:hover { transform: scale(1.025); filter: brightness(1.12); }
    .overlay h1 { color: #fff; margin-top: 0; font-size: 2.5rem; text-align: center; font-family: 'Cinzel', serif; }
    .login-box p { color: #ccc; margin-bottom: 20px; line-height: 1.4; }
    .start-copy {
        position: absolute;
        inset: 0;
        z-index: 1;
        width: 100%;
        box-sizing: border-box;
        margin-top: 0;
        padding: 0 16px 30px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        text-shadow: 0 4px 18px rgba(0, 0, 0, 0.92);
        pointer-events: none;
    }
    .start-copy h1 {
        margin: 0;
        font-size: clamp(4.15rem, 10.6vw, 8.9rem);
        line-height: 0.84;
        letter-spacing: 0;
        color: #f7f2e8;
    }
    .start-eyebrow {
        margin: 0 0 12px;
        color: #c34135;
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: clamp(0.9rem, 1.7vw, 1.25rem);
        text-transform: uppercase;
    }
    .start-tagline {
        max-width: 860px;
        margin: 14px auto 0;
        color: #e3ded1;
        font-family: 'Cinzel', serif;
        font-size: clamp(0.9rem, 1.65vw, 1.2rem);
        font-weight: 700;
        white-space: normal;
    }
    .start-intel {
        width: min(100%, 720px);
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 4px;
        margin: 0 0 18px;
        padding: 10px 18px 12px;
        color: #d6d0c2;
        text-align: center;
        border-top: 1px solid rgba(245, 208, 113, 0.24);
        border-bottom: 1px solid rgba(195, 65, 53, 0.28);
        background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.68), transparent);
        box-sizing: border-box;
    }
    .start-intel span {
        color: #9fb6a8;
        font-size: 0.86rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .start-intel strong {
        color: #f3ead6;
        font-size: 1.05rem;
    }
    .start-form {
        position: relative;
        padding: 18px;
        border: 1px solid rgba(245, 208, 113, 0.18);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(24, 24, 22, 0.88), rgba(9, 9, 8, 0.88));
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.32);
        box-sizing: border-box;
    }
    
    .large-input { display: block; width: 100%; padding: 15px; margin-bottom: 20px; font-size: 1.2rem; background: #0d0d0d; color: white; border: 1px solid #444; border-radius: 6px; box-sizing: border-box; font-family: inherit; }
    .oe-input-wrap { position: relative; width: 100%; margin-bottom: 20px; }
    .oe-input-wrap .large-input { margin-bottom: 0; padding-right: 56px; }
    .autonavn-knap {
        position: absolute; top: 50%; right: 8px; transform: translateY(-50%);
        width: 38px; height: 38px; border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.08); color: #f5d071;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 1.25rem; line-height: 1; cursor: pointer;
    }
    .autonavn-knap:hover { background: rgba(255, 255, 255, 0.14); }
    
    .spil-knap { background: url('/screens/button.webp') no-repeat center; background-size: contain; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 220px; height: 65px; }
    .knap-tekst { color: #fcebd5; font-weight: bold; font-size: 1.1rem; padding-bottom: 2px; pointer-events: none; font-family: 'Cinzel', serif; }
    .start-knap-raekke { display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap; }
    .login-boat-btn { width: 220px; height: 65px; margin-top: 10px; }
    .tutorial-start-knap {
        width: 104px;
        min-height: 92px;
        margin-top: 10px;
        border: none;
        background: transparent;
        color: #f3ead6;
        font-family: 'Cinzel', serif;
        font-weight: 700;
        letter-spacing: 0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 0;
    }
    .tutorial-start-knap:hover {
        transform: translateY(-1px);
    }
    .tutorial-start-ikon {
        width: 82px;
        aspect-ratio: 1;
        object-fit: contain;
        filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.42));
        transition: transform 0.18s ease, filter 0.18s ease;
    }
    .tutorial-start-knap:hover .tutorial-start-ikon {
        transform: scale(1.04);
        filter: brightness(1.08) drop-shadow(0 10px 16px rgba(0, 0, 0, 0.5));
    }
    .tutorial-start-knap span {
        color: #f3ead6;
        font-size: 0.8rem;
        line-height: 1;
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.82);
    }
    .offline-continue {
        margin-top: 8px;
        background: rgba(255, 255, 255, 0.06);
        color: #eee;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 9px 12px;
        cursor: pointer;
    }
    .offline-continue:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: #666;
    }
    .offline-bottom { width: min(100%, 560px); margin-top: 56px; display: flex; flex-direction: column; align-items: center; }
    .ballon-download {
        width: 150px;
        min-height: 82px;
        border: none;
        border-radius: 0;
        background: transparent;
        color: #eee;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        font-size: 0.78rem;
    }
    .ballon-download:hover { background: transparent; filter: brightness(1.12); }
    .ballon-download:disabled { opacity: 0.75; cursor: default; }
    .ballon-download.klar { background: transparent; color: #d7ead7; }
    .flight-ikon { width: 150px; height: auto; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35)); }
    .fly-hint { width: 150px; margin: 2px 0 14px; color: #bbb; font-size: 0.82rem; letter-spacing: 0.04em; text-transform: uppercase; text-align: center; }
    .offline-besked { max-width: 440px; margin: 8px 0 14px; color: #bbb; font-size: 0.82rem; line-height: 1.45; }
    .slut-knap-styled { width: 220px; height: 65px; }

    .localhost-testkort {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 10px;
    }
    .localhost-testkort button {
        background: rgba(255, 255, 255, 0.08);
        color: #f2f2f2;
        border: 1px solid #555;
        border-radius: 5px;
        padding: 7px 10px;
        cursor: pointer;
        font-size: 0.82rem;
    }
    .localhost-testkort button:hover {
        background: rgba(255, 255, 255, 0.16);
    }

    .start-tavle {
        display: grid;
        place-items: center;
        margin-top: 30px;
        width: 100%;
        max-width: 340px;
    }
    .global-note { color: #aaa; font-size: 0.78rem; margin: -4px 0 6px; }
    .tavle-note-bund { margin: 10px 0 0; }

    .konto-panel {
        width: 100%;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid #333;
        border-radius: 8px;
        padding: 12px;
        box-sizing: border-box;
        margin-bottom: 16px;
        text-align: left;
    }
    .konto-panel.har-profil {
        background: transparent;
        border-color: transparent;
    }
    .konto-hint {
        margin: 0 0 10px;
        color: #bbb;
        font-size: 0.9rem;
    }
    .konto-medaljer {
        position: relative;
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        gap: 4px;
        align-items: start;
        margin: 10px 0 2px;
        padding: 8px 4px 0;
    }
    .konto-medaljer::before {
        content: "";
        position: absolute;
        left: 4px;
        right: 4px;
        top: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(245, 208, 113, 0.42) 6%, rgba(245, 208, 113, 0.42) 94%, transparent 100%);
    }
    @keyframes mytiskMedaljePuls {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
        }
    }
    .konto-medalje-knap {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        cursor: default;
        justify-self: center;
        width: min(48px, 100%);
        aspect-ratio: 1;
        position: relative;
        isolation: isolate;
        overflow: visible;
    }
    .konto-medalje-knap.kan-aabnes {
        cursor: pointer;
    }
    .konto-medalje-knap:focus-visible {
        outline: 2px solid rgba(245, 208, 113, 0.75);
        outline-offset: 3px;
        border-radius: 999px;
    }
    .konto-medaljer img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        justify-self: center;
        filter: drop-shadow(0 5px 7px rgba(0, 0, 0, 0.55));
        transform: translateY(-8px);
        position: relative;
        z-index: 1;
    }
    .konto-medaljer img.bedste {
        filter: drop-shadow(0 7px 10px rgba(245, 208, 113, 0.25)) drop-shadow(0 5px 7px rgba(0, 0, 0, 0.55));
    }
    .konto-medalje-knap.kan-aabnes:hover img {
        opacity: 0.44;
        filter: grayscale(0.85) brightness(0.96) drop-shadow(0 5px 7px rgba(245, 208, 113, 0.12));
    }
    .konto-medaljer img.trofae-placeholder {
        opacity: 0.32;
        filter: grayscale(0.9) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.42));
    }
    .konto-medaljer img.trofae-opnaaet,
    .konto-medalje-knap.kan-aabnes:hover img.trofae-opnaaet {
        opacity: 1;
        filter: drop-shadow(0 7px 10px rgba(245, 208, 113, 0.25)) drop-shadow(0 5px 7px rgba(0, 0, 0, 0.55));
    }
    .konto-medaljer-login-teaser {
        margin-bottom: 12px;
    }
    .profil-medaljehylde {
        --profil-medalje-size: 150px;
        --profil-medalje-row: 184px;
        --profil-medalje-row-gap: 30px;
        position: relative;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        grid-auto-rows: var(--profil-medalje-row);
        gap: var(--profil-medalje-row-gap) 16px;
        margin: 28px 0 24px;
        padding: 0 6px;
    }
    .profil-medaljehylde::before,
    .profil-medaljehylde::after {
        content: "";
        position: absolute;
        left: 4px;
        right: 4px;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(245, 208, 113, 0.48) 6%, rgba(245, 208, 113, 0.48) 94%, transparent 100%);
    }
    .profil-medaljehylde::before {
        top: 0;
    }
    .profil-medaljehylde::after {
        top: calc(var(--profil-medalje-row) + var(--profil-medalje-row-gap));
    }
    .profil-medalje {
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
        text-align: center;
        color: #9c9c9c;
        font-size: 0.82rem;
        line-height: 1.15;
        padding-top: 0;
    }
    .profil-medalje-tekst {
        display: flex;
        min-width: 0;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }
    .profil-medalje-tekst > span {
        max-width: 100%;
    }
    .profil-medalje-niveau {
        color: #f5d071;
        font-size: 0.72rem;
        font-style: italic;
        line-height: 1;
        opacity: 0.86;
    }
    .profil-medalje-knap {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        width: min(var(--profil-medalje-size), 100%);
        aspect-ratio: 1;
        cursor: default;
        position: relative;
        isolation: isolate;
        overflow: visible;
    }
    .profil-medalje-knap.kan-aabnes {
        cursor: pointer;
    }
    .profil-medalje-knap:focus-visible {
        outline: 2px solid rgba(245, 208, 113, 0.75);
        outline-offset: 4px;
        border-radius: 999px;
    }
    .profil-medalje img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
        opacity: 0.18;
        filter: grayscale(1) brightness(0.74) drop-shadow(0 5px 8px rgba(0, 0, 0, 0.45));
        position: relative;
        z-index: 1;
        transform-origin: 50% 12%;
    }
    .profil-medalje-knap.kan-aabnes:hover img {
        opacity: 0.34;
        filter: grayscale(0.95) brightness(0.92) drop-shadow(0 6px 9px rgba(245, 208, 113, 0.14));
    }
    .profil-medalje.opnaaet {
        color: #f1dfb4;
    }
    .profil-medalje.opnaaet img {
        opacity: 1;
        filter: drop-shadow(0 7px 10px rgba(245, 208, 113, 0.25)) drop-shadow(0 5px 8px rgba(0, 0, 0, 0.55));
    }
    .profil-medalje.opnaaet img.mytiskPuls,
    .stor-medalje.mytiskPuls,
    .highscore-detail-total img.mytiskPuls {
        transform-origin: 50% 0%;
        transform: scale(1);
        animation: mytiskMedaljePuls var(--puls-duration, 6.8s) ease-in-out infinite;
        animation-delay: var(--puls-delay, 0s);
    }
    .trofae-info-overlay {
        position: fixed;
        inset: 0;
        z-index: 5200;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(0, 0, 0, 0.58);
        box-sizing: border-box;
    }
    .trofae-info-modal {
        width: min(340px, 100%);
        border: 1px solid rgba(245, 208, 113, 0.35);
        border-radius: 8px;
        background: rgba(18, 18, 18, 0.97);
        color: #f4efe5;
        padding: 20px 18px 18px;
        position: relative;
        text-align: center;
        box-shadow: 0 20px 52px rgba(0, 0, 0, 0.62);
    }
    .trofae-info-modal.naeste-krav,
    .trofae-info-modal.mytisk-opnaaet {
        padding: 0 28px 28px;
        width: min(420px, 100%);
    }
    .trofae-info-modal img {
        width: 92px;
        aspect-ratio: 1;
        object-fit: contain;
        opacity: 0.4;
        filter: grayscale(1) brightness(0.82) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
        margin-bottom: 6px;
    }
    .trofae-info-modal.naeste-krav img,
    .trofae-info-modal.mytisk-opnaaet img {
        width: 200px;
        margin: -1px auto 12px;
        object-position: top center;
    }
    .trofae-info-modal img.opnaaet {
        opacity: 1;
        filter: drop-shadow(0 8px 14px rgba(245, 208, 113, 0.28)) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.5));
    }
    .trofae-info-modal h3 {
        margin: 0 0 8px;
        font-family: 'Cinzel', serif;
        font-size: 1.25rem;
    }
    .trofae-info-modal.naeste-krav h3,
    .trofae-info-modal.mytisk-opnaaet h3 {
        margin-bottom: 6px;
        color: #f5d071;
        font-size: 1.55rem;
    }
    .trofae-info-modal p {
        margin: 0 0 16px;
        color: #d5c8aa;
        line-height: 1.35;
    }
    .trofae-info-modal .trofae-info-krav {
        margin-top: -6px;
        font-size: 0.9rem;
        color: #a99f89;
    }
    .trofae-info-modal .trofae-info-resultat {
        margin: 0 0 18px;
        color: #d5c8aa;
        font-size: 0.96rem;
        font-weight: 700;
        text-align: center;
    }
    .trofae-info-modal.naeste-krav .trofae-info-krav,
    .trofae-info-modal.mytisk-opnaaet .trofae-info-krav {
        margin: 0 auto;
        max-width: 330px;
        color: #f5d071;
        font-size: 0.86rem;
        font-style: italic;
        opacity: 0.9;
        }
    .trofae-info-modal .trofae-info-luk {
        border: 1px solid rgba(245, 208, 113, 0.45);
        border-radius: 6px;
        background: rgba(245, 208, 113, 0.1);
        color: #f4efe5;
        padding: 8px 18px;
        cursor: pointer;
    }
    .trofae-info-modal.naeste-krav .trofae-info-luk,
    .trofae-info-modal.mytisk-opnaaet .trofae-info-luk {
        position: absolute;
        right: 12px;
        top: 12px;
    }
    .trofae-info-modal .trofae-info-luk:hover,
    .trofae-info-modal .trofae-info-luk:focus-visible {
        background: rgba(245, 208, 113, 0.18);
    }
    .konto-login {
        display: flex;
        gap: 8px;
    }
    .konto-hint-anonym {
        margin: 8px 0 8px;
        font-size: 0.78rem;
        line-height: 1.35;
    }
    .konto-login-anonym {
        max-width: 520px;
    }
    .konto-login-anonym input,
    .konto-login-anonym button {
        padding: 7px 9px;
        font-size: 0.82rem;
    }
    .konto-live-link {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    .konto-live-link button {
        background: rgba(245, 208, 113, 0.92);
        color: #171100;
        border: 1px solid rgba(255, 232, 154, 0.85);
        border-radius: 6px;
        padding: 10px 14px;
        font-weight: 700;
        cursor: pointer;
    }
    .konto-live-link button:hover,
    .konto-live-link button:focus-visible {
        background: #ffd75a;
    }
    .konto-live-link span {
        color: #aaa;
        font-size: 0.84rem;
        line-height: 1.35;
    }
    .konto-login input,
    .profil-felt input {
        flex: 1;
        min-width: 0;
        background: #0d0d0d;
        color: white;
        border: 1px solid #444;
        border-radius: 5px;
        padding: 9px;
    }
    .konto-login button,
    .profil-header button,
    .profil-felt button {
        background: #2d2d2d;
        color: white;
        border: 1px solid #555;
        border-radius: 5px;
        padding: 8px 10px;
        cursor: pointer;
    }
    .profil-luk-knap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .profil-luk-knap span:first-child {
        font-size: 1.25rem;
        line-height: 0.8;
    }
    .konto-login button:disabled { opacity: 0.5; cursor: default; }
    .konto-besked { margin: 8px 0 0; color: #ddd; font-size: 0.85rem; }
    .konto-linje {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 14px;
        width: 100%;
    }
    .konto-profil-identitet {
        appearance: none;
        border: 0;
        background: transparent;
        color: inherit;
        padding: 0 0 0 14px;
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
        text-align: left;
        cursor: pointer;
    }
    .konto-profil-identitet:hover,
    .konto-profil-identitet:focus-visible {
        background: transparent;
        outline: none;
    }
    .konto-profil-identitet img {
        width: 78px;
        height: 78px;
        flex: 0 0 auto;
        object-fit: contain;
        filter: drop-shadow(0 6px 9px rgba(0, 0, 0, 0.55));
    }
    .konto-profil-identitet span,
    .konto-profil-identitet strong,
    .konto-profil-identitet em {
        display: block;
    }
    .konto-profil-identitet strong {
        font-family: 'Cinzel', serif;
        font-size: 1.52rem;
        line-height: 1.1;
        color: #f4efe4;
        letter-spacing: 0;
    }
    .konto-profil-identitet em {
        color: #aaa;
        font-size: 1rem;
        font-style: normal;
        overflow-wrap: anywhere;
    }
    .konto-aabn-profil-knap {
        flex: 0 0 auto;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        color: #f4efe4;
        padding: 10px 14px;
        font-weight: 700;
        cursor: pointer;
    }
    .konto-aabn-profil-knap:hover,
    .konto-aabn-profil-knap:focus-visible {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.36);
        outline: none;
    }
    .start-logud-knap {
        margin-top: 12px;
        border: 0;
        background: transparent;
        color: #999;
        padding: 4px 0;
        font-size: 0.8rem;
        cursor: pointer;
    }
    .start-logud-knap:hover,
    .start-logud-knap:focus-visible {
        color: #ddd;
        text-decoration: underline;
        outline: none;
    }

    .profil-overlay {
        position: fixed;
        inset: 0;
        z-index: 3000;
        background: rgba(0, 0, 0, 0.78);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
    }
    .profil-modal {
        width: 720px;
        max-width: 100%;
        max-height: 90dvh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        background: #151515;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 20px;
        color: white;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .profil-modal::-webkit-scrollbar {
        display: none;
    }
    .profil-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 18px;
    }
    .profil-header-identitet {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
    }
    .profil-header-identitet img {
        width: 108px;
        height: 108px;
        object-fit: contain;
        flex: 0 0 auto;
        filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.58));
    }
    .profil-header .profil-karakter-knap {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 0;
        margin: 0;
        cursor: pointer;
        border-radius: 6px;
        flex: 0 0 auto;
    }
    .profil-header .profil-karakter-knap:hover,
    .profil-header .profil-karakter-knap:focus-visible {
        background: rgba(255, 255, 255, 0.08);
        outline: 1px solid rgba(245, 208, 113, 0.45);
    }
    .profil-header .profil-karakter-knap img {
        display: block;
    }
    .profil-header .profil-karakter-knap > span {
        width: 108px;
        height: 108px;
        display: grid;
        place-items: center;
        color: #d9cfb8;
        font-size: 2.4rem;
        font-family: 'Cinzel', serif;
    }
    .profil-header h2 {
        margin: 0;
        font-family: 'Cinzel', serif;
    }
    .profil-karaktervalg {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
        gap: 8px;
        margin: -2px 0 18px;
        padding: 10px;
        border: 1px solid #333;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.04);
    }
    .profil-karaktervalg button {
        min-height: 118px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.28);
        color: #eee;
        padding: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        cursor: pointer;
        text-align: center;
    }
    .profil-karaktervalg button:hover,
    .profil-karaktervalg button:focus-visible,
    .profil-karaktervalg button.valgt {
        border-color: rgba(245, 208, 113, 0.64);
        background: rgba(245, 208, 113, 0.1);
        outline: none;
    }
    .profil-karaktervalg img {
        width: 54px;
        height: 54px;
        object-fit: contain;
        filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.5));
    }
    .profil-karaktervalg span,
    .profil-karaktervalg em {
        display: block;
    }
    .profil-karaktervalg span {
        font-weight: 800;
    }
    .profil-karaktervalg em {
        color: #bbb;
        font-size: 0.78rem;
        font-style: normal;
    }
    .profil-felt {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 18px;
        color: #ccc;
    }
    .profil-felt div {
        display: flex;
        gap: 8px;
    }
    .profil-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
    }
    .profil-grid div,
    .profil-liste {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #333;
        border-radius: 6px;
        padding: 12px;
    }
    .profil-grid strong {
        display: block;
        font-size: 1.4rem;
    }
    .profil-grid span {
        color: #aaa;
        font-size: 0.82rem;
    }
    .profil-liste {
        margin-top: 14px;
    }
    .profil-liste h3 {
        margin: 0;
        font-size: 1rem;
    }
    .profil-spil-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 10px;
    }
    .profil-spil-header span {
        color: #aaa;
        font-size: 0.78rem;
    }
    .profil-spil-soeg {
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 10px;
        background: rgba(0, 0, 0, 0.32);
        border: 1px solid #444;
        border-radius: 5px;
        color: #eee;
        padding: 9px 10px;
        font: inherit;
    }
    .profil-spil-soeg:focus {
        outline: 1px solid rgba(245, 208, 113, 0.55);
        border-color: rgba(245, 208, 113, 0.45);
    }
    .profil-spil-resultater {
        display: grid;
        gap: 6px;
        max-height: 360px;
        overflow-y: auto;
        padding-right: 4px;
    }
    .profil-spil-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px 12px;
        width: 100%;
        text-align: left;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 5px;
        color: inherit;
        cursor: pointer;
        font: inherit;
        padding: 9px 10px;
    }
    .profil-spil-row:hover,
    .profil-spil-row:focus-visible {
        background: rgba(245, 208, 113, 0.1);
        border-color: rgba(245, 208, 113, 0.28);
    }
    .profil-spil-main {
        min-width: 0;
    }
    .profil-spil-main strong,
    .profil-spil-main em {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .profil-spil-main strong {
        color: #fff;
    }
    .profil-spil-main em {
        color: #aaa;
        font-size: 0.78rem;
        font-style: normal;
    }
    .profil-spil-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 5px 10px;
        grid-column: 1 / -1;
        color: #aaa;
        font-size: 0.78rem;
    }
    .profil-spil-score {
        color: #f5d071;
        font-variant-numeric: tabular-nums;
        font-size: 1.05rem;
        align-self: start;
    }
    .profil-spil-hint {
        color: #aaa;
        font-size: 0.8rem;
        margin: 9px 0 0;
    }

    .character-select { position: relative; background: #1a1a1a; padding: 30px; border-radius: 12px; max-width: 1100px; width: 95%; max-height: none; overflow: visible; text-align: center; }
    .select-island-status {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
        margin: 2px 0 10px;
        padding: 8px 14px;
        border: 1px solid rgba(245, 208, 113, 0.28);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.055);
        color: #ddd;
        font-weight: 700;
    }
    .select-island-status span {
        color: #c9c1ae;
    }
    .select-island-status strong {
        color: #d7ead7;
    }
    .select-island-status.lukket {
        border-color: rgba(195, 65, 53, 0.45);
        background: rgba(80, 20, 20, 0.35);
    }
    .select-island-status.lukket strong {
        color: #f0c0b8;
    }
    .join-lukket-overlay {
        position: fixed;
        inset: 0;
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.72);
        box-sizing: border-box;
    }
    .join-lukket-modal {
        width: min(430px, 100%);
        border: 1px solid rgba(245, 208, 113, 0.35);
        border-radius: 8px;
        background: #171717;
        color: #eee;
        padding: 22px;
        text-align: center;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62);
    }
    .join-lukket-modal h2 {
        margin: 0 0 12px;
        font-family: 'Cinzel', serif;
        color: #f3ead6;
    }
    .join-lukket-modal p {
        margin: 0 0 18px;
        color: #ddd;
        line-height: 1.45;
    }
    .join-lukket-modal button {
        min-width: 96px;
        border: 1px solid rgba(245, 208, 113, 0.45);
        border-radius: 6px;
        background: #2d2d2d;
        color: #fff;
        padding: 9px 16px;
        font-weight: 700;
        cursor: pointer;
    }
    .join-lukket-modal button:hover {
        background: #3a3a3a;
    }
    .character-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-top: 20px; }
    .char-card { container-type: inline-size; background: #222; border: 2px solid #444; padding: 20px; text-align: center; cursor: pointer; border-radius: 8px; transition: 0.2s; display: flex; flex-direction: column; align-items: center; }
    .char-card:hover { border-color: #fff; transform: scale(1.02); }
    .char-card h3 { margin: 10px 0 4px; color: #fff; font-size: 1.3rem; font-family: 'Cinzel', serif; }
    .char-icon { height: 90px; width: auto; margin-bottom: 10px; }
    .stats { display: flex; align-items: center; justify-content: center; gap: 0.65ch; font-weight: bold; color: #aaa; margin: 2px 0 12px; font-family: monospace; white-space: nowrap; }
    .stats-toplinje { display: flex; align-items: center; gap: 0.65ch; }
    .stats-guld { display: flex; align-items: center; gap: 0.65ch; }

    @container (max-width: 230px) {
        .stats { flex-direction: column; gap: 2px; }
        .stats-guld .stats-skilletegn { display: none; }
    }
    .desc { font-size: 0.9rem; margin: 4px 0; line-height: 1.3; font-style: italic; }
    .desc .klasse-navn { font-style: normal; font-weight: 700; }
    .positive { color: #ccc; }
    .negative { color: #888; }

    .slutskærm { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; color: #ffffff; box-sizing: border-box; overflow-y: auto; z-index: 1000; font-family: system-ui, -apple-system, sans-serif; text-align: center; }
    .death-screen { background: #3a0505; }
    .sejrsskaerm { background-color: #053315; }
    
    .slut-scroll { overflow-y: auto; height: 100vh; width: 100%; display: flex; flex-direction: column; align-items: center; padding: 0 20px 40px 20px; }
    .medalje-sektion { margin: 0; padding: 0; width: 100%; display: flex; justify-content: center; }
    .medalje-profil-knap { margin: 0; padding: 0; border: none; background: transparent; cursor: pointer; display: flex; justify-content: center; }
    .medalje-profil-knap:hover .stor-medalje { filter: drop-shadow(0 0 28px rgba(255, 255, 255, 0.28)); transform: scale(1.015); }
    .stor-medalje { height: 260px; filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.15)); margin: 0 0 10px 0; display: block; }
    .doeds-symbol { width: min(210px, 48vw); height: auto; margin: -8px 0 10px; opacity: 0.92; filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.45)); }
    
    .doeds-titel { font-size: 2.5rem; margin: 1rem 0; font-family: 'Cinzel', serif; color: #fff; }
    .sejr-titel { font-size: 2.5rem; margin: 1rem 0; font-family: 'Cinzel', serif; color: #fff; }
    .beskrivelse { color: #ccc; max-width: 700px; text-align: center; font-style: italic; margin: 20px 0; line-height: 1.6; font-size: 1.1rem; }
    
    .score-container { position: relative; width: 100%; max-width: 400px; margin: 1.5rem 0; }
    .pergament-billede { width: 100%; height: auto; }
    .score-tekst { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); color: #222; font-size: 2.4rem; font-family: 'Cinzel', serif; font-weight: bold; text-align: center; line-height: 1; width: 100%; margin: 0; }
    .lille-score { font-size: 1.2rem; color: #555; letter-spacing: 2px; margin-right: 10px; }
    .episk-trofae-panel {
        width: min(920px, 100%);
        margin: 18px auto 6px;
        padding: 28px 24px;
        text-align: center;
        border-top: 1px solid rgba(245, 208, 113, 0.58);
        border-bottom: 1px solid rgba(245, 208, 113, 0.42);
        background:
            radial-gradient(circle at 50% 15%, rgba(245, 208, 113, 0.16), transparent 34%),
            rgba(8, 8, 8, 0.68);
        box-shadow: 0 20px 70px rgba(0, 0, 0, 0.48);
        box-sizing: border-box;
    }
    .episk-kicker {
        margin: 0 0 6px;
        color: #f5d071;
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
    }
    .episk-trofae-panel h2 {
        margin: 0;
        color: #fff7d6;
        font-family: 'Cinzel', serif;
        font-size: clamp(2rem, 4vw, 3.9rem);
        line-height: 1;
        text-shadow: 0 4px 22px rgba(245, 208, 113, 0.28);
    }
    .episk-trofae-liste {
        display: grid;
        gap: 18px;
        margin-top: 22px;
    }
    .episk-trofae {
        display: grid;
        grid-template-columns: 180px 1fr;
        align-items: center;
        gap: 22px;
        text-align: left;
        position: relative;
        isolation: isolate;
        overflow: visible;
    }
    .episk-trofae:only-child {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
        gap: 12px;
    }
    .episk-trofae img {
        width: 180px;
        height: 180px;
        object-fit: contain;
        filter: drop-shadow(0 0 18px rgba(245, 208, 113, 0.28)) drop-shadow(0 10px 18px rgba(0, 0, 0, 0.6));
        position: relative;
        z-index: 1;
    }
    .episk-trofae:only-child img {
        width: min(240px, 44vw);
        height: min(240px, 44vw);
    }
    .episk-trofae strong {
        display: block;
        color: #ffe492;
        font-size: clamp(1.4rem, 2.8vw, 2.5rem);
        line-height: 1.05;
        position: relative;
        z-index: 1;
    }
    .episk-trofae span {
        display: block;
        margin-top: 8px;
        color: #e7dfcc;
        font-size: clamp(1rem, 1.8vw, 1.35rem);
        line-height: 1.35;
        position: relative;
        z-index: 1;
    }

    .slut-trofae-status {
        width: min(900px, 100%);
        margin: 26px auto 10px;
        box-sizing: border-box;
    }
    .slut-trofae-maalinger {
        margin: 0;
        padding: 0;
    }
    .slut-naermeste-trofae {
        display: grid;
        grid-template-columns: 150px minmax(0, 1fr);
        align-items: center;
        gap: 24px;
        width: min(760px, 100%);
        margin: 26px auto 0;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        text-align: left;
    }
    .slut-naermeste-trofae img {
        width: 150px;
        height: 150px;
        object-fit: contain;
        margin-top: -44px;
        opacity: 0.42;
        filter: grayscale(1) brightness(0.78) drop-shadow(0 7px 10px rgba(0, 0, 0, 0.48));
        position: relative;
        z-index: 1;
    }
    .slut-trofae-kicker {
        margin: 0 0 5px;
        color: #d8c895;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }
    .slut-trofae-kicker span {
        display: block;
        margin-top: 5px;
    }
    .slut-naermeste-trofae h3,
    .slut-alle-trofaeer h3 {
        margin: 0;
        color: #fff;
        font-family: 'Cinzel', serif;
        font-size: clamp(1.35rem, 3vw, 2rem);
    }
    .slut-trofae-resultat {
        margin: 7px 0 0;
        color: #e1e1e1;
        font-size: 1.05rem;
    }
    .slut-trofae-krav {
        margin: 8px 0 0;
        color: #bdbdbd;
        line-height: 1.45;
    }
    .slut-trofae-krav strong {
        color: #ded4b5;
        margin-right: 4px;
    }
    .slut-alle-trofaeer {
        width: min(760px, 100%);
        margin: 26px auto 0;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
    }
    .slut-alle-trofaeer p {
        margin: 8px 0 0;
        color: #c8c8c8;
    }

    .spec-paneler {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 42px;
        width: 100%;
        max-width: 900px;
        margin: 22px 0;
        align-items: start;
    }
    .point-kvittering {
        background: transparent;
        border: none;
        padding: 0;
        width: 100%;
        font-family: monospace;
        text-align: left;
    }
    .point-kvittering h4 { margin: 0 0 15px 0; text-align: center; color: #fff; border-bottom: 1px solid rgba(255, 255, 255, 0.22); padding-bottom: 10px; font-family: 'Cinzel', serif; font-size: 1.2rem; }
    .kvittering-linje { display: flex; justify-content: space-between; color: #ccc; margin: 8px 0; font-size: 1rem; }
    .kvittering-linje.mult { color: #bbb; font-style: italic; }
    .kvittering-skiller { border-top: 1px solid rgba(255, 255, 255, 0.18); margin: 10px 0; }
    .kvittering-total { display: flex; justify-content: space-between; font-size: 1.6rem; color: #fff; border-top: 1px solid rgba(255, 255, 255, 0.28); padding-top: 10px; margin-top: 10px; font-weight: bold; }
    
    .session-tavle { background: transparent; border: none; padding: 0; width: 100%; }
    .session-tavle h3 { color: #fff; margin-top: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.22); padding-bottom: 10px; font-family: 'Cinzel', serif; font-size: 1.2rem; }
    .session-raekke { display: flex; align-items: center; gap: 12px; padding: 10px 0; background: transparent; margin-bottom: 6px; border-radius: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.12); }
    .aktiv-mig { border-color: rgba(255, 255, 255, 0.28); background: transparent; }
    .session-ikon { height: 45px; }
    .session-info { flex-grow: 1; text-align: left; }
    .session-navn { display: block; color: #fff; font-weight: bold; font-size: 1.1rem; }
    .session-score { color: #fff; font-weight: bold; font-size: 1.2rem; font-family: monospace; }
    .session-status { font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .vinder { color: #ddd; } .doed { color: #666; }
    
    .slut-knapper { display: flex; gap: 20px; margin-top: 40px; padding-bottom: 60px; justify-content: center; width: 100%; max-width: 900px; }
    .highscore-container { display: flex; gap: 2rem; justify-content: center; align-items: flex-start; flex-wrap: wrap; width: 100%; max-width: 1120px; margin-top: 20px; }
    .tutorial-resultat-container {
        width: min(760px, 100%);
        margin: 10px auto 0;
        padding-bottom: 50px;
        box-sizing: border-box;
    }
    .tutorial-resultat {
        border: 1px solid rgba(231, 199, 130, 0.45);
        background:
            linear-gradient(180deg, rgba(255, 244, 205, 0.08), rgba(0, 0, 0, 0.22)),
            rgba(11, 24, 16, 0.76);
        box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 22px;
        color: #f3ecd9;
        text-align: center;
    }
    .tutorial-resultat-top span {
        display: block;
        color: #d9bf7b;
        font-family: 'Cinzel', serif;
        font-size: 0.88rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .tutorial-resultat-top strong {
        display: block;
        margin-top: 4px;
        color: #fff7dc;
        font-family: 'Cinzel', serif;
        font-size: clamp(1.7rem, 4vw, 2.5rem);
        line-height: 1.1;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    .tutorial-resultat-top p,
    .tutorial-naeste,
    .tutorial-resultat-note {
        margin: 8px auto 0;
        max-width: 560px;
        color: rgba(243, 236, 217, 0.86);
        line-height: 1.45;
    }
    .tutorial-rangliste {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
        margin-top: 20px;
    }
    .tutorial-rangtrin {
        min-height: 74px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.18);
        padding: 10px 6px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        opacity: 0.5;
    }
    .tutorial-rangtrin.opnaaet {
        opacity: 1;
        border-color: rgba(232, 203, 117, 0.72);
        background: rgba(121, 91, 32, 0.32);
        box-shadow: inset 0 0 18px rgba(232, 203, 117, 0.1);
    }
    .tutorial-rangtrin span {
        color: #d9bf7b;
        font-family: monospace;
        font-size: 0.9rem;
    }
    .tutorial-rangtrin strong {
        color: #fff;
        font-family: 'Cinzel', serif;
        font-size: 0.86rem;
        line-height: 1.15;
    }
    .tutorial-resultat-note {
        color: rgba(216, 222, 211, 0.7);
        font-size: 0.9rem;
    }
    .score-save-status {
        width: 100%;
        border: 1px solid #555;
        background: rgba(255, 255, 255, 0.06);
        color: #ddd;
        padding: 12px 16px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        font-size: 0.95rem;
        flex-wrap: wrap;
    }
    .score-save-status.fejl {
        border-color: #a66;
        background: rgba(80, 20, 20, 0.45);
        color: #f0d0d0;
    }
    .score-save-status button {
        border: 1px solid #888;
        background: #222;
        color: #fff;
        padding: 7px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 700;
    }
    .score-save-status button:hover {
        background: #333;
        border-color: #bbb;
    }
    .score-login-redning {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .score-login-redning input {
        min-width: 210px;
        background: rgba(255, 255, 255, 0.92);
        color: #111;
        border: 1px solid #aaa;
        border-radius: 4px;
        padding: 8px 10px;
        font-size: 0.95rem;
    }
    .score-login-besked {
        width: 100%;
        color: #f4e2d8;
        font-size: 0.88rem;
    }

    .tavle { position: relative; width: min(320px, 100%); margin-inline: auto; }
    .tavle-billede { width: 100%; }
    .tavle-indhold { position: absolute; width: 76%; left: 12%; top: 12%; color: #eee; }
    .tavle-indhold h3 { color: #fff; font-size: 1rem; text-align: center; font-family: 'Cinzel', serif; margin-top: 0;}
    .tavle-indhold h3.uge-titel { font-size: clamp(0.72rem, 4vw, 0.9rem); white-space: nowrap; }
    .tavle-indhold ol { padding: 0; list-style: none; }
    .tavle-indhold li { border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 0; font-size: 0.85rem; }
    .highscore-række {
        width: 100%;
        display: grid;
        grid-template-columns: 3ch minmax(0, 1fr) auto;
        gap: 6px;
        align-items: baseline;
        background: transparent;
        border: 0;
        color: inherit;
        font: inherit;
        text-align: left;
        padding: 5px 0;
        border-radius: 4px;
        cursor: pointer;
    }
    .highscore-række:hover,
    .highscore-række:focus-visible {
        background: rgba(245, 208, 113, 0.11);
        outline: none;
    }
    .tavle-indhold .navn {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .tavle-indhold .point {
        font-variant-numeric: tabular-nums;
    }
    .placering { color: #b8aa86; text-align: right; font-variant-numeric: tabular-nums; }
    .karakter-navn {
        color: #9aa69d;
        font-size: 0.75rem;
        white-space: nowrap;
    }
    .highscore-pager {
        position: absolute; left: 50%; bottom: -22px; transform: translateX(-50%);
        display: flex; gap: 8px; align-items: center; justify-content: center;
    }
    .highscore-naeste {
        width: 38px; height: 28px; border: 1px solid rgba(245, 208, 113, 0.45);
        border-radius: 50%; background: rgba(0, 0, 0, 0.35); color: #f5d071;
        font-size: 1.35rem; line-height: 1; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
    }
    .highscore-naeste:hover { background: rgba(245, 208, 113, 0.14); }
    .topliste-skift {
        position: absolute;
        left: 50%;
        top: 0.8%;
        z-index: 3;
        width: 13%;
        min-width: 30px;
        max-width: 42px;
        height: auto;
        aspect-ratio: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: #d9b95f;
        cursor: pointer;
        box-shadow: none;
        transform: translateX(-50%);
        transition: color 0.16s ease;
    }
    .topliste-skift svg {
        width: 100%;
        height: 100%;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.65;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5));
        transform: scale(1);
        transform-box: fill-box;
        transform-origin: center;
        transition: transform 0.16s ease, filter 0.16s ease;
    }
    .topliste-skift:hover,
    .topliste-skift:focus-visible {
        transform: translateX(-50%);
        background: transparent;
        color: #ffe08a;
        outline: none;
    }
    .topliste-skift:focus-visible svg,
    .topliste-skift:hover svg {
        transform: scale(1.08);
        filter: drop-shadow(0 0 4px rgba(255, 215, 112, 0.58)) drop-shadow(0 1px 1px rgba(0, 0, 0, 0.55));
    }
    .status { color: #ccc; margin-top: 15px; }

    .highscore-detail-overlay {
        position: fixed;
        inset: 0;
        z-index: 4300;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
    }
    .highscore-detail-overlay::-webkit-scrollbar { display: none; }
    .highscore-detail-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.72);
        border: 0;
        padding: 0;
        cursor: pointer;
    }
    .highscore-detail-modal {
        position: relative;
        z-index: 1;
        width: min(430px, 100%);
        margin: auto 0;
        background: #191919;
        color: #eee;
        border: 1px solid rgba(245, 208, 113, 0.35);
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55);
        font-family: system-ui, -apple-system, sans-serif;
    }
    .offentlig-profil-overlay {
        position: fixed;
        inset: 0;
        z-index: 4400;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
    .offentlig-profil-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.78);
        border: 0;
        padding: 0;
        cursor: pointer;
    }
    .offentlig-profil-modal {
        position: relative;
        z-index: 1;
        width: min(720px, 100%);
        margin: auto 0;
        background:
            radial-gradient(circle at 76% 0%, rgba(245, 208, 113, 0.1), transparent 34%),
            #181818;
        color: #eee;
        border: 1px solid rgba(245, 208, 113, 0.38);
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62);
        box-sizing: border-box;
        font-family: system-ui, -apple-system, sans-serif;
    }
    .offentlig-profil-header {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
        padding-bottom: 12px;
    }
    .offentlig-profil-header img {
        width: 88px;
        height: 88px;
        object-fit: contain;
        filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.45));
    }
    .offentlig-profil-header h2 {
        margin: 0;
        color: #fff;
        font-family: 'Cinzel', serif;
        font-size: clamp(1.6rem, 4vw, 2.25rem);
        line-height: 1;
    }
    .offentlig-profil-header p {
        margin: 6px 0 0;
        color: #aeb8b0;
        font-size: 1rem;
    }
    .offentlig-profil-header button {
        align-self: start;
        background: #2b2b2b;
        color: #eee;
        border: 1px solid #555;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: 700;
    }
    .offentlig-profil-medaljer {
        margin-top: 18px;
    }
    .offentlig-profil-medaljehylde {
        margin-bottom: 0;
    }
    .offentlig-profil-note {
        color: #cfc8b7;
        font-size: 0.92rem;
        line-height: 1.35;
        margin: 10px 0 0;
    }
    .highscore-detail-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 16px;
    }
    .highscore-detail-header h2 {
        margin: 0;
        font-size: 1.4rem;
        color: #fff;
        font-family: 'Cinzel', serif;
    }
    .highscore-detail-header p {
        margin: 4px 0 0;
        color: #aeb8b0;
    }
    .highscore-detail-header button {
        background: #2b2b2b;
        color: #eee;
        border: 1px solid #555;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
    }
    .highscore-detail-header .highscore-filter-link {
        background: transparent;
        border: 0;
        border-radius: 4px;
        color: inherit;
        padding: 0 2px;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }
    .highscore-detail-header .highscore-filter-link:hover,
    .highscore-detail-header .highscore-filter-link:focus-visible {
        color: #f5d071;
        outline: none;
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    .highscore-detail-header .highscore-name-link {
        display: block;
    }
    .highscore-filter-panel {
        margin-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        padding-top: 12px;
    }
    .highscore-filter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
    }
    .highscore-filter-header h3 {
        margin: 0;
        color: #f5d071;
        font-family: 'Cinzel', serif;
        font-size: 1rem;
    }
    .highscore-filter-header button {
        background: transparent;
        color: #cfc8b7;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 4px;
        padding: 5px 8px;
        cursor: pointer;
    }
    .highscore-filter-list {
        list-style: none;
        margin: 0;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.18);
    }
    .highscore-filter-list li + li {
        border-top: 1px solid rgba(255, 255, 255, 0.07);
    }
    .highscore-filter-list button {
        width: 100%;
        display: grid;
        grid-template-columns: 32px minmax(72px, 1fr) minmax(96px, 1.3fr) auto;
        align-items: baseline;
        gap: 8px;
        background: transparent;
        color: #eee;
        border: 0;
        padding: 7px 8px;
        text-align: left;
        cursor: pointer;
        font: inherit;
    }
    .highscore-filter-list button:hover,
    .highscore-filter-list button:focus-visible {
        background: rgba(245, 208, 113, 0.1);
        outline: none;
    }
    .highscore-filter-list span {
        color: #b8aa86;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
    .highscore-filter-list strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .highscore-filter-list em {
        min-width: 0;
        color: #9aa69d;
        font-size: 0.78rem;
        font-style: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .highscore-filter-list b {
        color: #f5d071;
        font-variant-numeric: tabular-nums;
    }
    .highscore-detail-total {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 116px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        padding: 14px 122px 14px 150px;
        margin-bottom: 14px;
    }
    .highscore-detail-total span {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        color: #c8c0aa;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
    }
    .highscore-detail-total strong {
        color: #f5d071;
        font-family: 'Cinzel', serif;
        font-size: 2.15rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        text-align: center;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
    }
    .highscore-detail-total img {
        position: absolute;
        right: 22px;
        top: -1px;
        display: block;
        width: 92px;
        height: 118px;
        object-fit: contain;
        object-position: top center;
        filter: drop-shadow(0 10px 18px rgba(245, 208, 113, 0.22));
    }
    .highscore-detail-trofaeer {
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        margin: -2px 0 14px;
        padding: 0;
        position: relative;
    }
    .highscore-detail-trofaeer > span {
        display: block;
        color: #c8c0aa;
        font-size: 0.76rem;
        letter-spacing: 0.08em;
        left: 0;
        position: absolute;
        top: 14px;
        text-transform: uppercase;
        width: 260px;
        z-index: 1;
    }
    .highscore-detail-trofae-liste {
        margin: 0;
        padding: 0;
    }
    .highscore-detail-trofaeer figure {
        background: transparent;
        border: 0;
        display: block;
        margin: 0;
        min-width: 0;
        position: relative;
    }
    .highscore-detail-trofae-knap {
        appearance: none;
        background: transparent;
        border: 0;
        color: inherit;
        cursor: pointer;
        display: block;
        font: inherit;
        margin: 0;
        min-height: 146px;
        min-width: 0;
        padding: 0 122px 0 0;
        position: relative;
        text-align: left;
        width: 100%;
    }
    .highscore-detail-trofae-knap:hover img,
    .highscore-detail-trofae-knap:focus-visible img {
        filter: drop-shadow(0 10px 18px rgba(245, 208, 113, 0.24));
    }
    .highscore-detail-trofae-knap:focus-visible {
        outline: 1px solid rgba(245, 208, 113, 0.42);
        outline-offset: 4px;
    }
    .highscore-detail-trofaeer figure + figure {
        border-top: 0;
    }
    .highscore-detail-trofaeer figure + figure::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: -12px;
        height: 1px;
        background: rgba(255, 255, 255, 0.12);
    }
    .highscore-detail-trofaeer img {
        display: block;
        height: 118px;
        object-fit: contain;
        object-position: top center;
        position: absolute;
        right: 22px;
        top: -1px;
        width: 92px;
    }
    .highscore-detail-trofae-navn {
        color: #f5d071;
        font-family: 'Cinzel', serif;
        font-size: 1.55rem;
        font-weight: 700;
        left: 0;
        line-height: 1.05;
        max-width: 320px;
        overflow: hidden;
        position: absolute;
        text-align: left;
        text-overflow: ellipsis;
        top: 48px;
        white-space: nowrap;
    }
    .highscore-detail-trofaeer figure + figure .highscore-detail-trofae-navn {
        top: 32px;
    }
    .highscore-detail-trofaeer figure p {
        color: #c8c0aa;
        font-size: 0.86rem;
        left: 0;
        line-height: 1.25;
        margin: 0;
        max-width: 320px;
        overflow: hidden;
        position: absolute;
        text-align: left;
        text-overflow: ellipsis;
        top: 80px;
        white-space: nowrap;
    }
    .highscore-detail-trofaeer figure + figure p {
        top: 64px;
    }
    .highscore-detail-maalinger {
        margin-top: 16px;
        padding-top: 16px;
    }
    .highscore-detail-rute,
    .highscore-detail-logbog {
        margin-top: 10px;
        padding-top: 0;
    }
    .highscore-detail-rute > span,
    .highscore-detail-logbog > span {
        color: #c8c0aa;
        display: block;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        margin-bottom: 2px;
        text-transform: uppercase;
    }
    .highscore-detail-rute > span {
        margin-bottom: -10px;
    }
    .highscore-detail-logbog {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: flex-start;
        gap: 0;
        text-align: left;
    }
    .highscore-detail-logbog > span {
        grid-column: 1;
    }
    .highscore-detail-maalinger-meta {
        color: #c8c0aa;
        font-size: 0.88rem;
        line-height: 1.25;
        margin: 0 0 10px;
        text-align: center;
    }
    .highscore-detail-maalinger > div {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
    }
    .highscore-detail-maalinger p {
        background: rgba(255, 255, 255, 0.045);
        border: 1px solid rgba(255, 255, 255, 0.075);
        border-radius: 5px;
        margin: 0;
        min-width: 0;
        padding: 8px 9px;
    }
    .highscore-detail-maalinger p span {
        color: #aeb8b0;
        display: block;
        font-size: 0.72rem;
        line-height: 1.15;
        margin-bottom: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .highscore-detail-maalinger p strong {
        color: #f5d071;
        font-size: 1rem;
        font-variant-numeric: tabular-nums;
    }
    .highscore-detail-note {
        color: #cfc8b7;
        font-size: 0.9rem;
        line-height: 1.35;
        margin: 12px 0 0;
    }
    .highscore-route-preview {
        height: 118px;
        margin-top: -18px;
        margin-bottom: 0;
        background: transparent;
        overflow: hidden;
        pointer-events: none;
    }
    .highscore-route-preview svg {
        display: block;
        width: 100%;
        height: 100%;
    }
    .highscore-route-line {
        opacity: 0.78;
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.34));
    }
    .highscore-route-start {
        fill: rgba(25, 25, 25, 0.9);
        stroke: rgba(255, 255, 255, 0.72);
        stroke-width: 2.5;
    }
    .highscore-route-end {
        fill: rgba(245, 208, 113, 0.88);
        stroke: rgba(255, 244, 199, 0.88);
        stroke-width: 2.5;
        filter: drop-shadow(0 0 6px rgba(245, 208, 113, 0.45));
    }
    .highscore-log-button {
        grid-column: 2;
        width: 64px;
        height: 64px;
        flex: 0 0 auto;
        margin-top: -8px;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: #f1dfaa;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }
    .highscore-log-button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 8px rgba(245, 208, 113, 0.18));
    }
    .highscore-log-button:hover,
    .highscore-log-button:focus-visible {
        background: transparent;
        outline: none;
    }
    .highscore-log-button:hover img,
    .highscore-log-button:focus-visible img {
        filter: drop-shadow(0 0 13px rgba(245, 208, 113, 0.34));
    }
    .highscore-log-overlay {
        position: fixed;
        inset: 0;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        background: rgba(0, 0, 0, 0.55);
    }
    .highscore-log-overlay::-webkit-scrollbar { display: none; }
    .highscore-log-backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: transparent;
        cursor: pointer;
    }
    .highscore-log-modal {
        position: relative;
        z-index: 1;
        width: min(640px, 100%);
        max-height: min(720px, 86dvh);
        margin: auto 0;
        background: #111;
        color: #eee;
        border: 1px solid rgba(245, 208, 113, 0.35);
        border-radius: 8px;
        padding: 18px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62);
        display: flex;
        flex-direction: column;
    }
    .highscore-log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 12px;
    }
    .highscore-log-header h3 {
        margin: 0;
        color: #f5d071;
        font-family: 'Cinzel', serif;
    }
    .highscore-log-header button {
        background: #2b2b2b;
        color: #eee;
        border: 1px solid #555;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
    }
    .highscore-log-list {
        overflow-y: auto;
        padding-right: 8px;
    }
    .highscore-log-list p {
        margin: 0;
        padding: 9px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: #ddd6c6;
        line-height: 1.4;
    }
    .highscore-log-list p:last-child {
        border-bottom: 0;
    }

    .screen-top-actions {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 14px);
        right: calc(env(safe-area-inset-right, 0px) + 22px);
        z-index: 1200;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    @media (max-width: 700px) {
        .overlay {
            width: 100vw;
            height: 100dvh;
            align-items: stretch;
            justify-content: center;
            padding: calc(env(safe-area-inset-top, 0px) + 10px) 10px calc(env(safe-area-inset-bottom, 0px) + 10px);
            box-sizing: border-box;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        .start-overlay {
            padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 10px);
        }

        .character-select {
            width: 100%;
            max-width: none;
            max-height: 100%;
            overflow-y: auto;
            box-sizing: border-box;
        }

        .combined-box,
        .login-box {
            width: 100%;
            max-width: none;
            max-height: none;
            overflow: visible;
            box-sizing: border-box;
        }

        .login-box {
            padding: 18px;
            min-height: max-content;
        }

        .start-shell {
            padding: 0 0 26px;
        }

        .start-fog {
            width: 44vw;
            opacity: 0.28;
        }

        .start-hero {
            width: 100vw;
            min-height: 0;
            margin: 0;
        }

        .start-boat {
            width: 100%;
        }

        .launch-image {
            width: 100%;
            height: auto;
        }

        .start-copy {
            margin-top: 0;
            padding: 0 8px 22px;
        }

        .overlay h1 {
            font-size: 1.75rem;
            margin-bottom: 8px;
        }

        .start-copy h1 {
            font-size: clamp(2.7rem, 13.1vw, 4.55rem);
            line-height: 0.92;
            white-space: nowrap;
        }

        .start-eyebrow {
            margin-bottom: 8px;
            font-size: 0.82rem;
        }

        .start-tagline {
            max-width: 100%;
            margin-top: 12px;
            font-size: clamp(0.68rem, 3.3vw, 0.9rem);
        }

        .start-intel {
            margin: 0 0 12px;
            padding: 10px 12px;
        }

        .start-intel span {
            font-size: 0.72rem;
        }

        .start-intel strong {
            font-size: 0.92rem;
        }

        .start-form {
            padding: 12px;
        }

        .login-box p {
            margin-bottom: 12px;
            font-size: 0.92rem;
        }

        .large-input {
            padding: 11px;
            margin-bottom: 10px;
            font-size: 1rem;
        }

        .oe-input-wrap {
            margin-bottom: 10px;
        }

        .oe-input-wrap .large-input {
            padding-right: 48px;
        }

        .autonavn-knap {
            width: 34px;
            height: 34px;
            right: 6px;
        }

        .login-boat-btn,
        .spil-knap {
            width: 180px;
            height: 54px;
        }

        .start-tavle {
            margin-top: 14px;
            width: min(100%, 320px);
            max-width: 320px;
        }

        .konto-login {
            flex-direction: column;
            align-items: stretch;
        }

        .konto-linje {
            align-items: center;
            gap: 8px;
        }

        .konto-profil-identitet {
            padding-left: 8px;
            gap: 10px;
        }

        .konto-profil-identitet img {
            width: 66px;
            height: 66px;
        }

        .konto-profil-identitet strong {
            font-size: 1.24rem;
        }

        .konto-profil-identitet em {
            font-size: 0.9rem;
        }

        .konto-aabn-profil-knap {
            padding: 9px 10px;
            font-size: 0.86rem;
        }

        .profil-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .profil-header-identitet {
            gap: 10px;
        }

        .profil-header-identitet img {
            width: 82px;
            height: 82px;
        }

        .profil-header .profil-karakter-knap > span {
            width: 82px;
            height: 82px;
        }

        .profil-medaljehylde {
            --profil-medalje-size: clamp(54px, 17vw, 86px);
            --profil-medalje-row: clamp(92px, 26vw, 122px);
            --profil-medalje-row-gap: 20px;
            gap: var(--profil-medalje-row-gap) 8px;
            margin: 22px 0 18px;
            padding-inline: 0;
        }

        .profil-medalje {
            gap: 5px;
            font-size: clamp(0.58rem, 2.45vw, 0.72rem);
        }

        .character-select {
            padding: 14px;
        }

        .character-gallery {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
        }

        .spec-paneler {
            grid-template-columns: 1fr;
            gap: 26px;
            max-width: 100%;
        }

        .slut-scroll {
            width: 100%;
            padding: 0 18px 40px;
            box-sizing: border-box;
        }

        .beskrivelse,
        .score-container,
        .spec-paneler,
        .slut-knapper,
        .highscore-container,
        .tutorial-resultat-container {
            max-width: 100%;
            box-sizing: border-box;
        }

        .episk-trofae-panel {
            padding: 22px 14px;
            margin-top: 12px;
        }

        .episk-trofae {
            grid-template-columns: 1fr;
            gap: 10px;
            text-align: center;
            justify-items: center;
        }

        .episk-trofae img {
            width: min(42vw, 150px);
            height: min(42vw, 150px);
        }

        .slut-naermeste-trofae {
            grid-template-columns: 1fr;
            justify-items: center;
            gap: 10px;
            text-align: center;
        }

        .slut-naermeste-trofae img {
            width: 125px;
            height: 125px;
            margin-top: -42px;
            margin-bottom: -28px;
        }

        .point-kvittering,
        .session-tavle,
        .tutorial-resultat,
        .score-save-status {
            width: 100%;
            box-sizing: border-box;
        }

        .tutorial-resultat {
            padding: 18px 12px;
        }

        .tutorial-rangliste {
            grid-template-columns: 1fr;
            gap: 6px;
        }

        .tutorial-rangtrin {
            min-height: 52px;
            flex-direction: row;
            justify-content: space-between;
            padding: 10px 12px;
        }

        .slut-knapper {
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding-bottom: 32px;
        }

        .char-card {
            padding: 10px;
        }

        .char-icon {
            height: 58px;
        }

        .char-card h3 {
            font-size: 0.95rem;
            margin: 6px 0 2px;
        }

        .stats,
        .desc {
            font-size: 0.72rem;
            margin: 2px 0;
        }

        .screen-top-actions {
            top: 10px;
            right: calc(env(safe-area-inset-right, 0px) + 16px);
            gap: 8px;
        }

        .highscore-detail-overlay {
            align-items: flex-start;
            justify-content: center;
            padding: calc(env(safe-area-inset-top, 0px) + 12px) 10px calc(env(safe-area-inset-bottom, 0px) + 28px);
        }

        .highscore-detail-modal {
            width: min(430px, 100%);
            margin: 0;
            padding: 14px;
        }

        .highscore-detail-maalinger > div {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .offentlig-profil-overlay {
            align-items: flex-start;
            justify-content: center;
            padding: calc(env(safe-area-inset-top, 0px) + 12px) 10px calc(env(safe-area-inset-bottom, 0px) + 28px);
        }

        .offentlig-profil-modal {
            margin: 0;
            padding: 14px;
        }

        .offentlig-profil-header {
            grid-template-columns: 70px minmax(0, 1fr);
            gap: 10px;
        }

        .offentlig-profil-header img {
            width: 66px;
            height: 66px;
        }

        .offentlig-profil-header button {
            grid-column: 1 / -1;
            justify-self: end;
        }

        .highscore-log-overlay {
            align-items: flex-start;
            justify-content: center;
            padding: calc(env(safe-area-inset-top, 0px) + 12px) 10px calc(env(safe-area-inset-bottom, 0px) + 28px);
        }

        .highscore-log-modal {
            margin: 0;
            max-height: none;
        }

    }
</style>
