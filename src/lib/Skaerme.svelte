<script lang="ts">
    import { onMount } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { authState, gemProfilNavn, hentProfilStats, logUd, sendLoginLink } from '$lib/auth.svelte';
    import { hentKarakterKlasseNavn, hentKarakterKlasseNoegle, tilgaengeligeKarakterer } from '$lib/spildata';
    import { beregnFremdriftPoint, beregnMinePoint, beregnMineScoreModifier, beregnMultiplayerScoreModifier, beregnSpillerScore, beregnUdstyrPoint, findMedaljeNiveau, findMedaljeSti, taelScoreSpillere } from '$lib/score';
    import { genererSlutHistorie, hentTitel } from '$lib/historieMotor';
    import { goerOfflineAppKlar, offlineAppState, tjekOfflineAppKlar } from '$lib/offlineApp.svelte';
    import Regelbog from '$lib/Regelbog.svelte';
    import LydKnap from '$lib/LydKnap.svelte';
    import { hentGlobalHighscoresForFilter, hentHighscoreDetaljer } from '$lib/netvaerk';
    import { hentLydVolumen, lydKontrol } from '$lib/lydKontrol.svelte';
    import { OE_NAVN_EFTERLED, OE_NAVN_FORLED } from '$lib/oeNavne';
    import type { Karakter } from '$lib/types';

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
    };

    type LokalScore = HighscoreDetaljer & { navn: string; score: number; karakter?: string };
    type GlobalScore = HighscoreDetaljer & { spillerNavn: string; oeNavn: string; point: number; karakter?: string };
    type ValgtHighscore = HighscoreDetaljer & { navn: string; point: number; karakter?: string; oeNavn?: string; henterDetaljer?: boolean };
    type HighscoreDrilldown = { titel: string; scores: GlobalScore[]; henter: boolean };
    const HIGHSCORE_DRILLDOWN_ANTAL = 10;

    let {
        opretEllerDeltag,
        startOfflineSpil,
        fortsaetOfflineSpil,
        bekræftValg,
        genstartBane,
        nulstilHukommelse,
        lokaleScores,
        klasseScores,
        globaleScores,
        nyGlobalRekord,
        harGemtOfflineSpil,
        offlineSpilInfo,
        gemScoreIgen,
        scoreGemmer,
        scoreGemningFejlet
    } = $props<{
        opretEllerDeltag: () => void;
        startOfflineSpil: () => void;
        fortsaetOfflineSpil: () => void;
        bekræftValg: (k: Karakter) => void;
        genstartBane: () => void;
        nulstilHukommelse: () => void;
        lokaleScores: LokalScore[];
        klasseScores: GlobalScore[];
        globaleScores: GlobalScore[];
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
    let profilNavnInput = $state('');
    let visLokaleTestKnapper = $state(false);
    let globalHighscoreSide = $state(0);
    let klasseHighscoreSide = $state(0);
    let lokalHighscoreSide = $state(0);
    let valgtHighscore = $state<ValgtHighscore | null>(null);
    let visHighscoreLog = $state(false);
    let profilNavnGemTimer: ReturnType<typeof setTimeout> | null = null;
    let highscoreDrilldown = $state<HighscoreDrilldown | null>(null);
    const HIGHSCORE_SIDE_STOERRELSE = 10;
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
        spilTilstand.statusBesked = `Testkort valgt: ${bredde} x ${hoejde}.`;
    }

    function findNiveau(score: number) {
        return findMedaljeNiveau(score);
    }

    function findMedalje(score: number) {
        return findMedaljeSti(score, nyGlobalRekord);
    }

    function findHighscoreMedalje(score: ValgtHighscore) {
        return score.medalPath || findMedaljeSti(score.point, false);
    }

    function formaterNavn(tekst: string) {
        if (!tekst) return '';
        return tekst.charAt(0).toUpperCase() + tekst.slice(1).toLowerCase();
    }

    function formaterHighscoreNavn(tekst: string) {
        return formaterNavn(tekst).slice(0, 10);
    }

    function highscoreKlasseNavn() {
        return hentKarakterKlasseNavn(spilTilstand.valgtKarakter);
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

    function lokalHighscoreSideScores(scores: LokalScore[], side: number): LokalScore[] {
        const start = highscoreSideStart(side, scores);
        return scores.slice(start, start + HIGHSCORE_SIDE_STOERRELSE);
    }

    async function aabnGlobalHighscore(score: GlobalScore) {
        visHighscoreLog = false;
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
        return v === undefined || v === null ? 'Ukendt' : `${v}`;
    }

    function highscoreStatus(score: HighscoreDetaljer) {
        if (score.erVinder) return 'Sluppet væk';
        if (score.erDoed) return score.doedsAarsag ? `Død i ${score.doedsAarsag === 'vand' ? 'vand' : 'tåge'}` : 'Død';
        return 'Ukendt';
    }

    function spillerStatus(data: { isWinner?: boolean; isDead?: boolean; deathCause?: 'vand' | 'taage' | null }) {
        if (data.isWinner) return 'Sluppet væk';
        if (!data.isDead) return 'I tågen';
        return data.deathCause ? `Død i ${data.deathCause === 'vand' ? 'vand' : 'tåge'}` : 'Død';
    }

    function highscoreMineBasis(score: HighscoreDetaljer) {
        if (score.miner === undefined || score.miner === null) return null;
        return score.miner * 100;
    }

    function highscoreSpillerAntal(score: HighscoreDetaljer) {
        if (score.antalSpillere === undefined || score.antalSpillere === null) return 'Ukendt';
        return score.antalSpillere <= 1 ? 'Solo' : `Multiplayer (${score.antalSpillere})`;
    }

    function lukHighscoreDetaljer() {
        visHighscoreLog = false;
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
        const detaljer = await hentHighscoreDetaljer(id);
        if (!detaljer || valgtHighscore?.id !== id) return;
        valgtHighscore = {
            ...valgtHighscore,
            ...detaljer,
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

    function aabnSpillerHighscoreFilter() {
        if (!valgtHighscore) return;
        void aabnHighscoreFilter(`Top ${HIGHSCORE_DRILLDOWN_ANTAL}: ${formaterNavn(valgtHighscore.navn)}`, { spillerNavn: valgtHighscore.navn });
    }

    function aabnKarakterHighscoreFilter() {
        if (!valgtHighscore?.karakter) return;
        const klasseNoegle = hentKarakterKlasseNoegle(valgtHighscore.karakter);
        const klasseNavn = hentKarakterKlasseNavn(valgtHighscore.karakter);
        void aabnHighscoreFilter(`Top ${HIGHSCORE_DRILLDOWN_ANTAL}: ${klasseNavn}`, { karakterKlasse: klasseNoegle });
    }

    function aabnOeHighscoreFilter() {
        if (!valgtHighscore?.oeNavn) return;
        void aabnHighscoreFilter(`Top ${HIGHSCORE_DRILLDOWN_ANTAL} på ${formaterNavn(valgtHighscore.oeNavn)}`, { oeNavn: valgtHighscore.oeNavn });
    }

    function naesteGlobalHighscoreSide() {
        globalHighscoreSide = (normaliserHighscoreSide(globalHighscoreSide, globaleScores) + 1) % highscoreSideAntal(globaleScores);
    }

    function forrigeGlobalHighscoreSide() {
        globalHighscoreSide = normaliserHighscoreSide(globalHighscoreSide, globaleScores) - 1;
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

    function planlaegProfilNavnGem() {
        if (!authState.user) return;
        if (profilNavnGemTimer) clearTimeout(profilNavnGemTimer);

        profilNavnGemTimer = setTimeout(() => {
            profilNavnGemTimer = null;
            void gemProfilNavnFraStartfelt();
        }, 800);
    }

    async function startSpilMedLyd() {
        await gemProfilNavnFraStartfelt();

        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }
        if (erBrowserOffline()) {
            startOfflineSpil();
            return;
        }
        opretEllerDeltag();
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

    async function aabnProfil() {
        visProfil = true;
        await hentProfilStats();
    }

    async function gemProfil() {
        await gemProfilNavn(profilNavnInput);
        if (authState.profil?.display_name) {
            spilTilstand.spillerNavn = authState.profil.display_name;
        }
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

    function hentMinHistorie(erVundet: boolean) {
        const niveau = findNiveau(spilTilstand.samletScore) + 1;
        const karakterId = spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.id : 'explorer';
        const titel = hentTitel(karakterId, niveau);
        return genererSlutHistorie(titel, niveau, spilTilstand.rumKode, erVundet);
    }

</script>

{#snippet pointSpecifikation()}
    <div class="point-kvittering">
        <h4>Opgørelse</h4>
        <div class="kvittering-linje"><span>Indsamlet guld:</span> <span>{spilTilstand.guldTotal}</span></div>
        <div class="kvittering-linje">
            <span>{hentPointSpec().erVinder ? 'Overlevelses-bonus' : 'Fremdrift'}:</span>
            <span>{hentPointSpec().fremdriftPoint}</span>
        </div>
        <div class="kvittering-linje"><span>Udforskning:</span> <span>{hentPointSpec().udforskning}</span></div>
        <div class="kvittering-linje">
            <span>Territorium (miner):</span>
            <span>{hentPointSpec().minePoint}</span>
        </div>
        <div class="kvittering-linje"><span>Udstyr:</span> <span>{hentPointSpec().udstyrPoint}</span></div>
        {#if hentPointSpec().hpMult > 1 || hentPointSpec().multiplayerModifier > 1}
            <div class="kvittering-skiller"></div>
        {/if}
        {#if hentPointSpec().hpMult > 1}
            <div class="kvittering-linje mult"><span>Helbreds-bonus (HP):</span> <span>x {hentPointSpec().hpMult.toFixed(3)}</span></div>
        {/if}
        {#if hentPointSpec().multiplayerModifier > 1}
            <div class="kvittering-linje mult"><span>Multiplayer:</span> <span>x {hentPointSpec().multiplayerModifier.toFixed(1)}</span></div>
        {/if}
        <div class="kvittering-total"><span>Total Score:</span> <span>{spilTilstand.samletScore}</span></div>
    </div>
{/snippet}

{#snippet sessionTavle()}
    <div class="session-tavle">
        <h3>Alle karakterer</h3>
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

{#snippet kontoPanel()}
    <div class="konto-panel">
        {#if authState.user}
            <div class="konto-linje">
                <div>
                    <strong>{authState.profil?.display_name || 'Logget ind'}</strong>
                    <span>Logget ind</span>
                </div>
                <div class="konto-actions">
                    <button type="button" onclick={aabnProfil}>Profil</button>
                    <button type="button" onclick={logUd}>Log ud</button>
                </div>
            </div>
            <p class="konto-hint">Din score og statistik bliver gemt.</p>
        {:else}
            <p class="konto-hint">Login er valgfrit. Uden login spiller du kun med på den ø, du åbner nu, og din score og profil bliver ikke gemt.</p>
            <div class="konto-login">
                <input
                    type="email"
                    bind:value={authState.email}
                    placeholder="Email"
                    onkeydown={(e) => { if (e.key === 'Enter') sendLoginLink(authState.email); }}
                />
                <button type="button" onclick={() => sendLoginLink(authState.email)} disabled={authState.loader}>
                    {authState.loader ? 'Sender...' : 'Log ind'}
                </button>
            </div>
        {/if}
        {#if authState.besked}
            <p class="konto-besked">{authState.besked}</p>
        {/if}
    </div>
{/snippet}

{#snippet profilModal()}
    {#if visProfil && authState.user}
        <div class="profil-overlay" role="presentation" onclick={() => visProfil = false}>
            <div class="profil-modal" role="presentation" onclick={(e) => e.stopPropagation()}>
                <div class="profil-header">
                    <div>
                        <h2>Din profil</h2>
                        {#if maskeretEmail(authState.user.email)}
                            <p>{maskeretEmail(authState.user.email)}</p>
                        {/if}
                    </div>
                    <button type="button" onclick={() => visProfil = false}>Luk</button>
                </div>

                <label class="profil-felt">
                    <span>Spillernavn</span>
                    <div>
                        <input bind:value={profilNavnInput} maxlength="15" />
                        <button type="button" onclick={gemProfil}>Gem</button>
                    </div>
                </label>

                {#if authState.stats}
                    <div class="profil-grid">
                        <div><strong>{authState.stats.spil}</strong><span>Spil</span></div>
                        <div><strong>{authState.stats.sejre}</strong><span>Sejre</span></div>
                        <div><strong>{authState.stats.doedsfald}</strong><span>Dødsfald</span></div>
                        <div><strong>{authState.stats.bedsteScore}</strong><span>Bedste score</span></div>
                        <div><strong>{authState.stats.gennemsnitScore}</strong><span>Gns. score</span></div>
                        <div><strong>{authState.stats.samletGuld}</strong><span>Samlet guld</span></div>
                        <div><strong>{authState.stats.bedsteDag}</strong><span>Længste spil</span></div>
                        <div><strong>{authState.stats.flestFelter}</strong><span>Flest felter</span></div>
                        <div><strong>{authState.stats.flestMiner}</strong><span>Flest miner</span></div>
                        <div><strong>{authState.stats.favoritKarakter}</strong><span>Mest spillet</span></div>
                    </div>

                    <div class="profil-liste">
                        <h3>Sejre pr. karakter</h3>
                        {#if authState.stats.karakterSejre.length === 0}
                            <p>Ingen sejre endnu.</p>
                        {:else}
                            {#each authState.stats.karakterSejre as række (række.karakter)}
                                <div><span>{række.karakter}</span><strong>{række.sejre}</strong></div>
                            {/each}
                        {/if}
                    </div>
                {:else}
                    <p class="konto-hint">Ingen statistik endnu. Loggede spil bliver gemt her.</p>
                {/if}
            </div>
        </div>
    {/if}
{/snippet}

{#snippet highscoreDetaljeModal()}
    {#if valgtHighscore}
        <div class="highscore-detail-overlay" role="presentation">
            <button type="button" class="highscore-detail-backdrop" onclick={lukHighscoreDetaljer} aria-label="Luk scoreopgørelse"></button>
            <div class="highscore-detail-modal" role="dialog" aria-modal="true" aria-labelledby="highscore-detail-title" tabindex="-1">
                <div class="highscore-detail-header">
                    <div>
                        <button
                            type="button"
                            class="highscore-filter-link highscore-name-link"
                            onclick={aabnSpillerHighscoreFilter}
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
                                    {valgtHighscore.karakter}
                                </button>
                            {:else}
                                Ukendt
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
                    <button type="button" onclick={lukHighscoreDetaljer}>Luk</button>
                </div>

                <div class="highscore-detail-total">
                    <span>TOTAL SCORE</span>
                    <strong>{valgtHighscore.point}</strong>
                    <img src={findHighscoreMedalje(valgtHighscore)} alt="Medalje" />
                </div>

                {#if valgtHighscore.henterDetaljer}
                    <p class="highscore-detail-note">Henter opgørelse...</p>
                {:else if harHighscoreDetaljer(valgtHighscore)}
                    <div class="highscore-detail-grid">
                        <div><span>Status</span><strong>{highscoreStatus(valgtHighscore)}</strong></div>
                        <div class="highscore-days-card">
                            <span>Dage</span>
                            <strong>{talEllerUkendt(valgtHighscore.dage)}</strong>
                            <button type="button" class="highscore-log-button" onclick={() => visHighscoreLog = true} aria-label="Åbn logbog" title="Åbn logbog">
                                <img src="/ui/logbog.webp" alt="" />
                            </button>
                        </div>
                        <div><span>Guld</span><strong>{talEllerUkendt(valgtHighscore.guld)}</strong></div>
                        <div><span>Udforskning</span><strong>{talEllerUkendt(valgtHighscore.kendteFelter)}</strong></div>
                        <div><span>Miner</span><strong>{valgtHighscore.miner ?? 'Ukendt'}</strong></div>
                        <div><span>Spilform</span><strong>{highscoreSpillerAntal(valgtHighscore)}</strong></div>
                    </div>
                    {@const miniRute = highscoreMiniRute(valgtHighscore)}
                    {#if miniRute}
                        <div class="highscore-route-preview" aria-label="Rute">
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
                    {/if}
                {:else}
                    <p class="highscore-detail-note">Denne score er gemt før detaljeopgørelsen, så kun totalscoren er tilgængelig.</p>
                {/if}

                {#if highscoreDrilldown}
                    <div class="highscore-filter-panel">
                        <div class="highscore-filter-header">
                            <h3>{highscoreDrilldown.titel}</h3>
                            <button type="button" onclick={() => highscoreDrilldown = null}>Skjul</button>
                        </div>
                        {#if highscoreDrilldown.henter}
                            <p class="highscore-detail-note">Henter liste...</p>
                        {:else if highscoreDrilldown.scores.length === 0}
                            <p class="highscore-detail-note">Ingen scores fundet.</p>
                        {:else}
                            <ol class="highscore-filter-list">
                                {#each highscoreDrilldown.scores as score, i (score.id || `${score.spillerNavn}-${score.point}-${score.oeNavn}-${i}`)}
                                    <li>
                                        <button type="button" onclick={() => aabnHighscoreFraFilter(score)}>
                                            <span>{i + 1}.</span>
                                            <strong>{formaterHighscoreNavn(score.spillerNavn)}</strong>
                                            <em>{score.karakter || 'Ukendt'}, {formaterNavn(score.oeNavn)}</em>
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
                    <button type="button" class="highscore-log-backdrop" onclick={() => visHighscoreLog = false} aria-label="Luk logbog"></button>
                    <div class="highscore-log-modal" role="dialog" aria-modal="true" aria-labelledby="highscore-log-title" tabindex="-1">
                        <div class="highscore-log-header">
                            <h3 id="highscore-log-title">Logbog</h3>
                            <button type="button" onclick={() => visHighscoreLog = false} aria-label="Luk logbog">Luk</button>
                        </div>
                        <div class="highscore-log-list">
                            {#if highscoreLogLinjer(valgtHighscore).length > 0}
                                {#each highscoreLogLinjer(valgtHighscore) as linje, index (index)}
                                    <p>{linje}</p>
                                {/each}
                            {:else}
                                <p>Logbogen er ikke gemt for denne score endnu.</p>
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
                <span>Gemmer score...</span>
            {:else}
                <span>{spilTilstand.statusBesked || 'Scoren blev ikke gemt.'}</span>
                <button type="button" onclick={gemScoreIgen}>Prøv igen</button>
                {#if !authState.user}
                    <div class="score-login-redning">
                        <input
                            type="email"
                            bind:value={authState.email}
                            placeholder="Email til login-link"
                            onkeydown={(e) => { if (e.key === 'Enter') sendLoginLink(authState.email); }}
                        />
                        <button type="button" onclick={() => sendLoginLink(authState.email)} disabled={authState.loader}>
                            {authState.loader ? 'Sender...' : 'Log ind igen'}
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

{#snippet globalHighscoreTavle()}
    {@const sideStart = highscoreSideStart(globalHighscoreSide, globaleScores)}
    <div class="tavle">
        <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
        <div class="tavle-indhold global-indhold">
            <h3>Top 100 global</h3>
            {#if globaleScores.length === 0}
                <p class="tom-liste">Ingen data endnu</p>
            {:else}
                <ol start={sideStart + 1}>
                    {#each highscoreSide(globaleScores, globalHighscoreSide) as score, i (sideStart + i)}
                        <li>
                            <button type="button" class="highscore-række" onclick={() => aabnGlobalHighscore(score)} aria-label={`Vis scoreopgørelse for ${score.spillerNavn}`}>
                                <span class="placering">{sideStart + i + 1}.</span>
                                <span class="navn">{formaterHighscoreNavn(score.spillerNavn)} <span class="karakter-navn">({score.karakter || 'Ukendt'}, {formaterNavn(score.oeNavn)})</span></span>
                                <span class="point">{score.point}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
            {/if}
        </div>
        {#if globaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
            <div class="highscore-pager">
                <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeGlobalHighscoreSide} aria-label="Vis forrige 10 globale highscores">
                    &lt;
                </button>
                <button type="button" class="highscore-naeste" onclick={naesteGlobalHighscoreSide} aria-label="Vis næste 10 globale highscores">
                    &gt;
                </button>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet klasseHighscoreTavle()}
    {@const sideStart = highscoreSideStart(klasseHighscoreSide, klasseScores)}
    <div class="tavle klasse-tavle">
        <img src="/screens/boardglobal.webp" alt="Karakterklasse tavle" class="tavle-billede" />
        <div class="tavle-indhold global-indhold">
            <h3>Top 100 {highscoreKlasseNavn()}</h3>
            {#if klasseScores.length === 0}
                <p class="tom-liste">Ingen data endnu</p>
            {:else}
                <ol start={sideStart + 1}>
                    {#each highscoreSide(klasseScores, klasseHighscoreSide) as score, i (sideStart + i)}
                        <li>
                            <button type="button" class="highscore-række" onclick={() => aabnGlobalHighscore(score)} aria-label={`Vis scoreopgørelse for ${score.spillerNavn}`}>
                                <span class="placering">{sideStart + i + 1}.</span>
                                <span class="navn">{formaterHighscoreNavn(score.spillerNavn)} <span class="karakter-navn">({score.karakter || 'Ukendt'}, {formaterNavn(score.oeNavn)})</span></span>
                                <span class="point">{score.point}</span>
                            </button>
                        </li>
                    {/each}
                </ol>
            {/if}
        </div>
        {#if klasseScores.length > HIGHSCORE_SIDE_STOERRELSE}
            <div class="highscore-pager">
                <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeKlasseHighscoreSide} aria-label="Vis forrige 10 highscores for karakterklassen">
                    &lt;
                </button>
                <button type="button" class="highscore-naeste" onclick={naesteKlasseHighscoreSide} aria-label="Vis næste 10 highscores for karakterklassen">
                    &gt;
                </button>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet topKnapper()}
    <div class="screen-top-actions">
        <Regelbog />
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
                <button type="button" class="boat-btn-wrapper start-boat" onclick={(e) => { e.preventDefault(); startSpilMedLyd(); }}>
                    <img src="/events/launch.webp" alt="Båd ved tågeøen" class="launch-image clickable-boat" />
                </button>
                <div class="start-copy">
                    <p class="start-eyebrow">En ny ø venter</p>
                    <h1 id="start-title">Tågeøerne</h1>
                    <p class="start-tagline">Udforsk, overlev, og find en båd før tågen tager dig.</p>
                </div>
            </section>

            <div class="start-intel">
                <span>Samme ø-navn giver samme ø</span>
                <strong>De første fem dage afgør, hvem der når med.</strong>
            </div>

            <div class="login-main start-form">
                {@render kontoPanel()}
                
                <input 
                    type="text" 
                    bind:value={spilTilstand.spillerNavn} 
                    maxlength="15" 
                    placeholder="Spillernavn" 
                    class="large-input" 
                    oninput={planlaegProfilNavnGem}
                    onkeydown={trykEnter}
                />
                
                <div class="oe-input-wrap">
                    <input 
                        type="text" 
                        bind:value={spilTilstand.rumKode} 
                        maxlength="10" 
                        placeholder="Øens navn" 
                        class="large-input oe-input" 
                        onkeydown={trykEnter}
                    />
                    <button type="button" class="autonavn-knap" onclick={foreslaaOeNavn} aria-label="Foreslå ønavn" title="Foreslå ønavn">↻</button>
                </div>
                
                <div class="start-knap-raekke">
                    <button type="button" class="spil-knap login-boat-btn" onclick={(e) => { e.preventDefault(); startSpilMedLyd(); }}>
                        <span class="knap-tekst">START</span>
                    </button>
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
                {@render globalHighscoreTavle()}
            </div>

            <div class="offline-bottom">
                <button
                    type="button"
                    class="ballon-download"
                    class:klar={offlineAppState.klar}
                    onclick={goerOfflineAppKlar}
                    disabled={offlineAppState.arbejder || offlineAppState.klar}
                    title="Offline / Flightmode"
                    aria-label="Offline / Flightmode"
                >
                    <img src="/ui/flight.webp" alt="" class="flight-ikon" />
                    <span>{offlineAppState.arbejder ? 'Downloader...' : 'Offline / Flightmode'}</span>
                </button>
                {#if !offlineAppState.klar}
                    <p class="fly-hint">tryk inden du går offline</p>
                {/if}
                {#if offlineAppState.besked}
                    <p class="offline-besked">{offlineAppState.besked}</p>
                {/if}

                {#if harGemtOfflineSpil}
                    <button type="button" class="offline-continue" onclick={(e) => { e.preventDefault(); fortsaetOfflineMedLyd(); }}>
                        Fortsæt offline{offlineSpilInfo ? `: ${formaterNavn(offlineSpilInfo.rumKode)} dag ${offlineSpilInfo.dag}` : ''}
                    </button>
                {/if}
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            {@render topKnapper()}
            <h2>Vælg karakter</h2>
            <p class="instruktion">
                {spilTilstand.gameMode === 'offline' ? 'Offline. Spillet gemmes lokalt i denne browser.' : 'Du har fået otte muligheder. Vælg hvem du vil være.'}
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
                        <img src={k.ikon} alt={k.navn} class="char-icon" />
                        <h3>{k.navn}</h3>
                        <p class="stats">HP: {k.startHp} | Guld: {k.startGuld}</p>
                        <p class="desc positive">{k.fordel}</p>
                        <p class="desc negative">{k.ulempe}</p>
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
                    <button type="button" class="medalje-profil-knap" onclick={aabnProfil} aria-label="Åbn din profil">
                        <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" draggable="false" />
                    </button>
                {:else}
                    <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" draggable="false" />
                {/if}
            </div>
            
            <h1 class="doeds-titel">{formaterNavn(spilTilstand.spillerNavn)} døde på {formaterNavn(spilTilstand.rumKode)}</h1>
            <p class="beskrivelse">
                {spilTilstand.logBesked} {hentMinHistorie(false)}
            </p>
            
            <div class="score-container">
                <img src="/screens/pergament.webp" alt="Pergament" class="pergament-billede" />
                <h2 class="score-tekst">
                    <span class="lille-score">Score:</span> {spilTilstand.samletScore}
                </h2>
            </div>

            <img src="/screens/death.webp" alt="Døden" class="doeds-symbol" />

            <div class="spec-paneler">
                {@render pointSpecifikation()}
                {@render sessionTavle()}
            </div>
            
            <div class="slut-knapper">
                <button class="spil-knap slut-knap-styled" onclick={genstartBane}>
                    <span class="knap-tekst">Samme ø igen</span>
                </button>
                <button class="spil-knap slut-knap-styled" onclick={nulstilHukommelse}>
                    <span class="knap-tekst">Prøv en anden ø</span>
                </button>
            </div>
            
            <div class="highscore-container">
                {@render scoreGemStatus()}
                <div class="tavle">
                    <img src="/screens/boardlocal.webp" alt="Lokal tavle" class="tavle-billede" />
                    <div class="tavle-indhold lokal-indhold">
                        <h3>Top 100 på {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">Ingen resultater endnu</p>
                        {:else}
                            <ol start={highscoreSideStart(lokalHighscoreSide, lokaleScores) + 1}>
                                {#each lokalHighscoreSideScores(lokaleScores, lokalHighscoreSide) as hs, i (highscoreSideStart(lokalHighscoreSide, lokaleScores) + i)}
                                    <li>
                                        <button type="button" class="highscore-række" onclick={() => aabnLokalHighscore(hs)} aria-label={`Vis scoreopgørelse for ${hs.navn}`}>
                                            <span class="placering">{highscoreSideStart(lokalHighscoreSide, lokaleScores) + i + 1}.</span>
                                            <span class="navn">{formaterHighscoreNavn(hs.navn)} <span class="karakter-navn">({hs.karakter || 'Ukendt'})</span></span>
                                            <span class="point">{hs.score}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                        {#if spilTilstand.offlineMode}
                            <p class="global-note tavle-note-bund">Gemt lokalt i browseren.</p>
                        {:else if !authState.user}
                            <p class="global-note tavle-note-bund">Login kræves for at gemme score.</p>
                        {/if}
                    </div>
                    {#if lokaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
                        <div class="highscore-pager">
                            <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeLokalHighscoreSide} aria-label="Vis forrige 10 highscores på øen">
                                &lt;
                            </button>
                            <button type="button" class="highscore-naeste" onclick={naesteLokalHighscoreSide} aria-label="Vis næste 10 highscores på øen">
                                &gt;
                            </button>
                        </div>
                    {/if}
                </div>
                {#if !spilTilstand.offlineMode}
                    {@render klasseHighscoreTavle()}
                {/if}
                {#if !spilTilstand.offlineMode}
                    {@render globalHighscoreTavle()}
                {/if}
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'win'}
    <div class="slutskærm sejrsskaerm">
        <div class="slut-scroll">
            <div class="medalje-sektion">
                {#if authState.user}
                    <button type="button" class="medalje-profil-knap" onclick={aabnProfil} aria-label="Åbn din profil">
                        <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" draggable="false" />
                    </button>
                {:else}
                    <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" draggable="false" />
                {/if}
            </div>
            <h1 class="sejr-titel">{formaterNavn(spilTilstand.spillerNavn)}, du slap væk fra {formaterNavn(spilTilstand.rumKode)}</h1>
            <p class="beskrivelse">
                {hentMinHistorie(true)}
            </p>
            
            <div class="score-container">
                <img src="/screens/pergament.webp" alt="Pergament" class="pergament-billede" />
                <h2 class="score-tekst">
                    <span class="lille-score">Score:</span> {spilTilstand.samletScore}
                </h2>
            </div>

            <div class="spec-paneler">
                {@render pointSpecifikation()}
                {@render sessionTavle()}
            </div>
            
            <div class="slut-knapper">
                <button class="spil-knap slut-knap-styled" onclick={genstartBane}>
                    <span class="knap-tekst">Samme ø igen</span>
                </button>
                <button class="spil-knap slut-knap-styled" onclick={nulstilHukommelse}>
                    <span class="knap-tekst">Prøv en anden ø</span>
                </button>
            </div>
            
            <div class="highscore-container">
                {@render scoreGemStatus()}
                <div class="tavle">
                    <img src="/screens/boardlocal.webp" alt="Lokal tavle" class="tavle-billede" />
                    <div class="tavle-indhold lokal-indhold">
                        <h3>Top 100 på {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">Ingen resultater endnu</p>
                        {:else}
                            <ol start={highscoreSideStart(lokalHighscoreSide, lokaleScores) + 1}>
                                {#each lokalHighscoreSideScores(lokaleScores, lokalHighscoreSide) as hs, i (highscoreSideStart(lokalHighscoreSide, lokaleScores) + i)}
                                    <li>
                                        <button type="button" class="highscore-række" onclick={() => aabnLokalHighscore(hs)} aria-label={`Vis scoreopgørelse for ${hs.navn}`}>
                                            <span class="placering">{highscoreSideStart(lokalHighscoreSide, lokaleScores) + i + 1}.</span>
                                            <span class="navn">{formaterHighscoreNavn(hs.navn)} <span class="karakter-navn">({hs.karakter || 'Ukendt'})</span></span>
                                            <span class="point">{hs.score}</span>
                                        </button>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                        {#if spilTilstand.offlineMode}
                            <p class="global-note tavle-note-bund">Gemt lokalt i browseren.</p>
                        {:else if !authState.user}
                            <p class="global-note tavle-note-bund">Login kræves for at gemme score.</p>
                        {/if}
                    </div>
                    {#if lokaleScores.length > HIGHSCORE_SIDE_STOERRELSE}
                        <div class="highscore-pager">
                            <button type="button" class="highscore-naeste highscore-forrige" onclick={forrigeLokalHighscoreSide} aria-label="Vis forrige 10 highscores på øen">
                                &lt;
                            </button>
                            <button type="button" class="highscore-naeste" onclick={naesteLokalHighscoreSide} aria-label="Vis næste 10 highscores på øen">
                                &gt;
                            </button>
                        </div>
                    {/if}
                </div>
                {#if !spilTilstand.offlineMode}
                    {@render klasseHighscoreTavle()}
                {/if}
                {#if !spilTilstand.offlineMode}
                    {@render globalHighscoreTavle()}
                {/if}
            </div>
        </div>
    </div>
{/if}

{@render profilModal()}
{@render highscoreDetaljeModal()}

<style>
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100dvh; background: #1a1a1a; display: flex; align-items: flex-start; justify-content: center; z-index: 1000; font-family: system-ui, -apple-system, sans-serif; overflow-y: auto; padding: calc(env(safe-area-inset-top, 0px) + 18px) 18px calc(env(safe-area-inset-bottom, 0px) + 18px); box-sizing: border-box; -webkit-overflow-scrolling: touch; }
    .start-overlay {
        background:
            linear-gradient(180deg, rgba(8, 10, 9, 0.4) 0%, #111 58%, #160606 100%),
            radial-gradient(ellipse at 50% -8%, rgba(166, 190, 166, 0.28) 0%, rgba(30, 58, 49, 0.12) 34%, transparent 70%),
            linear-gradient(90deg, #080909 0%, #181a17 52%, #080706 100%);
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
        width: min(1120px, 94vw);
        max-width: none;
        padding-top: 20px;
    }
    .login-main { width: min(100%, 560px); display: flex; flex-direction: column; align-items: center; }
    .start-hero {
        position: relative;
        width: 100%;
        min-height: clamp(340px, 46vw, 520px);
        display: grid;
        place-items: center;
        margin: 2px 0 18px;
        isolation: isolate;
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
        content: "";
        position: absolute;
        left: 9%;
        right: 9%;
        bottom: 9%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(216, 190, 118, 0.42), transparent);
    }
    
    .boat-btn-wrapper { background: none; border: none; padding: 0; margin: 0; cursor: pointer; outline: none; }
    .start-boat {
        position: absolute;
        top: 0;
        width: min(760px, 88vw);
        opacity: 0.88;
        filter: drop-shadow(0 28px 36px rgba(0, 0, 0, 0.6));
    }
    .launch-image { width: 100%; max-width: 100%; height: auto; border-radius: 4px; transition: 0.2s; }
    .launch-image:hover { transform: scale(1.025); filter: brightness(1.12); }
    .overlay h1 { color: #fff; margin-top: 0; font-size: 2.5rem; text-align: center; font-family: 'Cinzel', serif; }
    .login-box p { color: #ccc; margin-bottom: 20px; line-height: 1.4; }
    .start-copy {
        position: relative;
        z-index: 1;
        width: 100%;
        box-sizing: border-box;
        margin-top: clamp(150px, 19vw, 230px);
        padding: 0 14px;
        text-shadow: 0 4px 18px rgba(0, 0, 0, 0.92);
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
        white-space: nowrap;
    }
    .start-intel {
        width: min(100%, 720px);
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 4px;
        margin: -8px 0 18px;
        padding: 12px 18px;
        color: #d6d0c2;
        text-align: center;
        border-top: 1px solid rgba(245, 208, 113, 0.24);
        border-bottom: 1px solid rgba(195, 65, 53, 0.28);
        background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.28), transparent);
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
    .konto-hint {
        margin: 0 0 10px;
        color: #bbb;
        font-size: 0.9rem;
    }
    .konto-login {
        display: flex;
        gap: 8px;
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
    .konto-actions button,
    .profil-header button,
    .profil-felt button {
        background: #2d2d2d;
        color: white;
        border: 1px solid #555;
        border-radius: 5px;
        padding: 8px 10px;
        cursor: pointer;
    }
    .konto-login button:disabled { opacity: 0.5; cursor: default; }
    .konto-besked { margin: 8px 0 0; color: #ddd; font-size: 0.85rem; }
    .konto-linje {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 8px;
    }
    .konto-linje strong,
    .konto-linje span {
        display: block;
    }
    .konto-linje span {
        color: #aaa;
        font-size: 0.8rem;
        overflow-wrap: anywhere;
    }
    .konto-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
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
        background: #151515;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 20px;
        color: white;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .profil-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
    }
    .profil-header h2 {
        margin: 0;
        font-family: 'Cinzel', serif;
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
        margin: 0 0 10px;
        font-size: 1rem;
    }
    .profil-liste div {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #333;
        padding: 8px 0;
    }

    .character-select { position: relative; background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; max-width: 1100px; width: 95%; max-height: none; overflow: visible; text-align: center; }
    .character-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-top: 20px; }
    .char-card { background: #222; border: 2px solid #444; padding: 20px; text-align: center; cursor: pointer; border-radius: 8px; transition: 0.2s; display: flex; flex-direction: column; align-items: center; }
    .char-card:hover { border-color: #fff; transform: scale(1.02); }
    .char-card h3 { margin-top: 10px; color: #fff; font-size: 1.3rem; font-family: 'Cinzel', serif; }
    .char-icon { height: 90px; width: auto; margin-bottom: 10px; }
    .stats { font-weight: bold; color: #aaa; margin: 10px 0; font-family: monospace; }
    .desc { font-size: 0.9rem; margin: 4px 0; line-height: 1.3; font-style: italic; }
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
    .status { color: #ccc; margin-top: 15px; }

    .highscore-detail-overlay {
        position: fixed;
        inset: 0;
        z-index: 1400;
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
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
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
    .highscore-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
    }
    .highscore-detail-grid div {
        position: relative;
        background: rgba(255, 255, 255, 0.055);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 6px;
        padding: 10px;
        min-width: 0;
    }
    .highscore-detail-grid span {
        display: block;
        color: #aeb8b0;
        font-size: 0.78rem;
        margin-bottom: 4px;
    }
    .highscore-detail-grid strong {
        color: #fff;
        font-variant-numeric: tabular-nums;
    }
    .highscore-days-card {
        min-height: 86px;
    }
    .highscore-detail-note {
        color: #cfc8b7;
        font-size: 0.9rem;
        line-height: 1.35;
        margin: 12px 0 0;
    }
    .highscore-route-preview {
        height: 118px;
        margin-top: 8px;
        margin-bottom: -8px;
        background: radial-gradient(circle at 50% 40%, rgba(245, 208, 113, 0.055), transparent 62%);
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
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -42%);
        width: min(82px, calc(100% - 34px));
        height: min(82px, calc(100% - 12px));
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
        right: 14px;
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
            padding: 12px 6px 26px;
        }

        .start-fog {
            width: 44vw;
            opacity: 0.28;
        }

        .start-hero {
            min-height: 315px;
            margin: 0 0 12px;
        }

        .start-boat {
            width: min(520px, 112vw);
            top: 4px;
        }

        .launch-image {
            width: 100%;
        }

        .start-copy {
            margin-top: 142px;
            padding: 0 6px;
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
            margin: -4px 0 12px;
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

        .konto-login,
        .konto-linje,
        .konto-actions {
            flex-direction: column;
            align-items: stretch;
        }

        .profil-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
        .highscore-container {
            max-width: 100%;
            box-sizing: border-box;
        }

        .point-kvittering,
        .session-tavle,
        .score-save-status {
            width: 100%;
            box-sizing: border-box;
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
            right: 10px;
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
