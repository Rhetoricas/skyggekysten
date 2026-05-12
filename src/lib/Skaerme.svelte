<script lang="ts">
    import { onMount } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { authState, gemProfilNavn, hentProfilStats, logUd, sendLoginLink } from '$lib/auth.svelte';
    import { tilgaengeligeKarakterer } from '$lib/spildata';
    import { beregnFremdriftPoint, beregnMinePoint, beregnMineScoreModifier, findMedaljeNiveau, findMedaljeSti, taelScoreSpillere } from '$lib/score';
    import { genererSlutHistorie, hentTitel } from '$lib/historieMotor';
    import { goerOfflineAppKlar, offlineAppState, tjekOfflineAppKlar } from '$lib/offlineApp.svelte';
    import Regelbog from '$lib/Regelbog.svelte';
    import type { Karakter } from '$lib/types';

    let {
        opretEllerDeltag,
        startOfflineSolo,
        fortsaetOfflineSolo,
        bekræftValg,
        genstartBane,
        nulstilHukommelse,
        lokaleScores,
        globaleScores,
        nyGlobalRekord,
        harGemtOfflineSpil,
        offlineSpilInfo,
        gemScoreIgen,
        scoreGemmer,
        scoreGemningFejlet
    } = $props<{
        opretEllerDeltag: () => void;
        startOfflineSolo: () => void;
        fortsaetOfflineSolo: () => void;
        bekræftValg: (k: Karakter) => void;
        genstartBane: () => void;
        nulstilHukommelse: () => void;
        lokaleScores: Array<{ navn: string; score: number; karakter?: string }>;
        globaleScores: Array<{ spillerNavn: string; oeNavn: string; point: number; karakter?: string }>;
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
    type LydNiveau = 'fuld' | 'lav' | 'slukket';
    
    let udvalgteSkæbner = $state<Karakter[]>([]);
    let forrigeState = spilTilstand.gameState;
    let spilletSlutLyd = false;
    let visProfil = $state(false);
    let profilNavnInput = $state('');
    let lydNiveau = $state<LydNiveau>('fuld');

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

        blandKarakterer();
    });

    function findNiveau(score: number) {
        return findMedaljeNiveau(score);
    }

    function findMedalje(score: number) {
        return findMedaljeSti(score, nyGlobalRekord);
    }

    function formaterNavn(tekst: string) {
        if (!tekst) return '';
        return tekst.charAt(0).toUpperCase() + tekst.slice(1).toLowerCase();
    }

    function maskeretEmail(email?: string) {
        if (!email || !email.includes('@')) return '';
        const [navn, domaene] = email.split('@');
        const synligStart = navn.slice(0, Math.min(2, navn.length));
        return `${synligStart}${navn.length > 2 ? '...' : ''}@${domaene}`;
    }

    function startSpilMedLyd() {
        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }
        opretEllerDeltag();
    }

    function startOfflineMedLyd() {
        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }
        startOfflineSolo();
    }

    function fortsaetOfflineMedLyd() {
        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.volume = hentLydVolumen();
            lydStart.play().catch(() => {});
        }
        fortsaetOfflineSolo();
    }

    function hentLydVolumen() {
        if (lydNiveau === 'slukket') return 0;
        if (lydNiveau === 'lav') return 0.25;
        return 0.8;
    }

    function anvendLydNiveau() {
        const volumen = hentLydVolumen();
        spilTilstand.musikTaendt = lydNiveau !== 'slukket';

        for (const lyd of [lydStart, lydDoed, lydSejr]) {
            if (!lyd) continue;
            lyd.volume = volumen;
            if (lydNiveau === 'slukket') lyd.pause();
        }

        if (lydNiveau === 'slukket') spilletSlutLyd = false;
    }

    function skiftLydNiveau() {
        lydNiveau = lydNiveau === 'fuld' ? 'lav' : lydNiveau === 'lav' ? 'slukket' : 'fuld';
        anvendLydNiveau();
    }

    function lydTitel() {
        if (lydNiveau === 'fuld') return 'Fuld lyd';
        if (lydNiveau === 'lav') return 'Dæmpet lyd';
        return 'Lyd slukket';
    }

    function lydIkon() {
        return lydNiveau === 'slukket' ? '/screens/musicoff.webp' : '/screens/musicon.webp';
    }

    $effect(() => {
        if (authState.profil?.display_name) {
            profilNavnInput = authState.profil.display_name;
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
        const minePoint = beregnMinePoint(spilTilstand.gitter, spilTilstand.spillerNavn, antalSpillere);
        const erVinder = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map';
        const fremdriftPoint = beregnFremdriftPoint(spilTilstand.maxKolonne, erVinder);
        const hpMult = (1 + Math.max(0, spilTilstand.livspoint) / 1000);
        return { udforskning, minePoint, mineModifier, fremdriftPoint, erVinder, hpMult };
    }

    function hentSessionSpillere() {
        const antalSpillere = taelScoreSpillere(spilTilstand.alleSpillere);
        return Object.entries(spilTilstand.alleSpillere).map(([navn, data]) => {
            const udforskning = (data.kendteFelter?.length || 0) * 2;
            const minePoint = beregnMinePoint(spilTilstand.gitter, navn, antalSpillere);
            const fremdriftPoint = beregnFremdriftPoint(data.kolonne || 0, !!data.isWinner);
            const score = Math.floor((data.guld + fremdriftPoint + udforskning + minePoint) * (1 + Math.max(0, data.hp) / 1000));
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
            <span>Territorium (miner{hentPointSpec().mineModifier > 1 ? ` x${hentPointSpec().mineModifier}` : ''}):</span>
            <span>{hentPointSpec().minePoint}</span>
        </div>
        <div class="kvittering-skiller"></div>
        <div class="kvittering-linje mult"><span>Helbreds-bonus (HP):</span> <span>x {hentPointSpec().hpMult.toFixed(3)}</span></div>
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
                            {data.isWinner ? 'Sluppet væk' : (data.isDead ? 'Død' : 'I tågen')}
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
            <p class="konto-hint">Login er valgfrit. Uden login spiller du kun med på den ø, du åbner nu.</p>
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

{#snippet lydKnap()}
    <button
        class="musik-toggle-btn screen-sound-btn"
        class:lyd-lav={lydNiveau === 'lav'}
        class:lyd-slukket={lydNiveau === 'slukket'}
        onclick={skiftLydNiveau}
        title={`${lydTitel()} - klik for næste niveau`}
        aria-label={`${lydTitel()} - klik for næste niveau`}
    >
        <img src={lydIkon()} alt="" />
    </button>
{/snippet}

{#snippet scoreGemStatus()}
    {#if scoreGemmer || scoreGemningFejlet}
        <div class="score-save-status" class:fejl={scoreGemningFejlet}>
            {#if scoreGemmer}
                <span>Gemmer score...</span>
            {:else}
                <span>{spilTilstand.statusBesked || 'Scoren blev ikke gemt.'}</span>
                <button type="button" onclick={gemScoreIgen}>Prøv igen</button>
            {/if}
        </div>
    {/if}
{/snippet}

{#snippet topKnapper()}
    <div class="screen-top-actions">
        <Regelbog />
        {@render lydKnap()}
    </div>
{/snippet}

{#if spilTilstand.gameState === 'start'}
    <div class="overlay">
        <div class="login-box combined-box">
            {@render topKnapper()}

            <button type="button" class="boat-btn-wrapper" onclick={(e) => { e.preventDefault(); startSpilMedLyd(); }}>
                <img src="/events/launch.webp" alt="Båd" class="launch-image top-image clickable-boat" />
            </button>

            <h1>Tågeøerne</h1>
            <p>Alle der skriver samme ø-navn, spiller på samme ø, hvis de går i land inden for de fem første dage.</p>

            {@render kontoPanel()}
            
            <input 
                type="text" 
                bind:value={spilTilstand.spillerNavn} 
                maxlength="15" 
                placeholder="Spillernavn" 
                class="large-input" 
                onkeydown={trykEnter}
            />
            
            <input 
                type="text" 
                bind:value={spilTilstand.rumKode} 
                maxlength="10" 
                placeholder="Øens navn" 
                class="large-input" 
                onkeydown={trykEnter}
            />
            
            <button type="button" class="spil-knap login-boat-btn" onclick={(e) => { e.preventDefault(); startSpilMedLyd(); }}>
                <span class="knap-tekst">Online</span>
            </button>
            <button type="button" class="spil-knap login-boat-btn offline-btn" onclick={(e) => { e.preventDefault(); startOfflineMedLyd(); }}>
                <span class="knap-tekst">Solo offline</span>
            </button>
            {#if harGemtOfflineSpil}
                <button type="button" class="offline-continue" onclick={(e) => { e.preventDefault(); fortsaetOfflineMedLyd(); }}>
                    Fortsæt offline{offlineSpilInfo ? `: ${formaterNavn(offlineSpilInfo.rumKode)} dag ${offlineSpilInfo.dag}` : ''}
                </button>
            {/if}
            <div class="offline-cache-panel" class:klar={offlineAppState.klar}>
                <span>{offlineAppState.klar ? 'Fly-klar på denne enhed' : 'Gør spillet klar til flytilstand'}</span>
                <button type="button" onclick={goerOfflineAppKlar} disabled={offlineAppState.arbejder || offlineAppState.klar}>
                    {offlineAppState.arbejder ? 'Downloader...' : offlineAppState.klar ? 'Klar' : 'Download'}
                </button>
                {#if offlineAppState.besked}
                    <p>{offlineAppState.besked}</p>
                {/if}
            </div>
            <p class="status larger-status">{spilTilstand.statusBesked}</p>
            
            <div class="tavle start-tavle">
                <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
                <div class="tavle-indhold global-indhold">
                    <h3>Top 10 global</h3>
                    {#if !authState.user}
                        <p class="global-note">Kræver login.</p>
                    {/if}
                    {#if globaleScores.length === 0}
                        <p class="tom-liste">Ingen data endnu</p>
                    {:else}
                        <ol>
                            {#each globaleScores as score, i (i)}
                                <li>
                                    <span class="navn">{formaterNavn(score.spillerNavn)} <span class="karakter-navn">({score.karakter || 'Ukendt'}, {score.oeNavn.toUpperCase()})</span></span>
                                    <span class="point">{score.point}</span>
                                </li>
                            {/each}
                        </ol>
                    {/if}
                </div>
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            {@render topKnapper()}
            <h2>Vælg karakter</h2>
            <p class="instruktion">
                {spilTilstand.offlineMode ? 'Solo offline. Spillet gemmes lokalt i denne browser.' : 'Du har fået otte muligheder. Vælg hvem du vil være.'}
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
    <div class="overlay death-screen">
        <div class="slut-scroll">
            <div class="medalje-sektion">
                <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" />
            </div>
            
            <h1 class="doeds-titel">Du døde på Tågeøen {formaterNavn(spilTilstand.rumKode)}</h1>
            <p class="beskrivelse">
                {spilTilstand.logBesked} {hentMinHistorie(false)}
            </p>
            
            <div class="score-container">
                <img src="/screens/death.webp" alt="Døden" class="pergament-billede" />
                <h2 class="score-tekst-doed">
                    <span class="lille-score-doed">Score:</span> {spilTilstand.samletScore}
                </h2>
            </div>

            <div class="spec-paneler">
                {@render pointSpecifikation()}
                {@render sessionTavle()}
            </div>
            
            <div class="slut-knapper">
                <button class="spil-knap slut-knap-styled" onclick={genstartBane}>
                    <span class="knap-tekst">Prøv samme ø igen</span>
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
                        <h3>Top 10 på {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if spilTilstand.offlineMode}
                            <p class="global-note">Gemt lokalt i browseren.</p>
                        {:else if !authState.user}
                            <p class="global-note">Login kræves for at gemme score.</p>
                        {/if}
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">Ingen resultater endnu</p>
                        {:else}
                            <ol>
                                {#each lokaleScores as hs, i (i)}
                                    <li>
                                        <span class="navn">{formaterNavn(hs.navn)} <span class="karakter-navn">({hs.karakter || 'Ukendt'})</span></span>
                                        <span class="point">{hs.score}</span>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                    </div>
                </div>
                {#if !spilTilstand.offlineMode}
                    <div class="tavle">
                        <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
                        <div class="tavle-indhold global-indhold">
                            <h3>Top 10 global</h3>
                            {#if !authState.user}
                                <p class="global-note">Kræver login.</p>
                            {/if}
                            {#if globaleScores.length === 0}
                                <p class="tom-liste">Ingen data endnu</p>
                            {:else}
                                <ol>
                                    {#each globaleScores as score, i (i)}
                                        <li>
                                            <span class="navn">{formaterNavn(score.spillerNavn)} <span class="karakter-navn">({score.karakter || 'Ukendt'}, {score.oeNavn.toUpperCase()})</span></span>
                                            <span class="point">{score.point}</span>
                                        </li>
                                    {/each}
                                </ol>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'win'}
    <div class="sejrsskaerm">
        <div class="slut-scroll">
            <div class="medalje-sektion">
                <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" />
            </div>
            <h1 class="sejr-titel">Du slap væk fra Tågeøen {formaterNavn(spilTilstand.rumKode)}</h1>
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
                    <span class="knap-tekst">Prøv samme ø igen</span>
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
                        <h3>Top 10 på {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if spilTilstand.offlineMode}
                            <p class="global-note">Gemt lokalt i browseren.</p>
                        {:else if !authState.user}
                            <p class="global-note">Login kræves for at gemme score.</p>
                        {/if}
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">Ingen resultater endnu</p>
                        {:else}
                            <ol>
                                {#each lokaleScores as hs, i (i)}
                                    <li>
                                        <span class="navn">{formaterNavn(hs.navn)} <span class="karakter-navn">({hs.karakter || 'Ukendt'})</span></span>
                                        <span class="point">{hs.score}</span>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                    </div>
                </div>
                {#if !spilTilstand.offlineMode}
                    <div class="tavle">
                        <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
                        <div class="tavle-indhold global-indhold">
                            <h3>Top 10 global</h3>
                            {#if !authState.user}
                                <p class="global-note">Kræver login.</p>
                            {/if}
                            {#if globaleScores.length === 0}
                                <p class="tom-liste">Ingen data endnu</p>
                            {:else}
                                <ol>
                                    {#each globaleScores as score, i (i)}
                                        <li>
                                            <span class="navn">{formaterNavn(score.spillerNavn)} <span class="karakter-navn">({score.karakter || 'Ukendt'}, {score.oeNavn.toUpperCase()})</span></span>
                                            <span class="point">{score.point}</span>
                                        </li>
                                    {/each}
                                </ol>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

{@render profilModal()}

<style>
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; font-family: system-ui, -apple-system, sans-serif; }
    .combined-box { max-height: 90vh; overflow-y: auto; }
    .login-box { position: relative; background: #1a1a1a; padding: 38px 40px 40px; border-radius: 12px; border: 1px solid #333; text-align: center; max-width: 560px; width: 90%; display: flex; flex-direction: column; align-items: center; }
    
    .boat-btn-wrapper { background: none; border: none; padding: 0; margin: 0; cursor: pointer; outline: none; }
    .launch-image { width: clamp(260px, 72%, 380px); max-width: 100%; height: auto; border-radius: 4px; transition: 0.2s; }
    .launch-image:hover { transform: scale(1.05); filter: brightness(1.2); }
    .top-image { margin-bottom: 15px; }

    .overlay h1 { color: #fff; margin-top: 0; font-size: 2.5rem; text-align: center; font-family: 'Cinzel', serif; }
    .login-box p { color: #ccc; margin-bottom: 20px; line-height: 1.4; }
    
    .large-input { display: block; width: 100%; padding: 15px; margin-bottom: 20px; font-size: 1.2rem; background: #0d0d0d; color: white; border: 1px solid #444; border-radius: 6px; box-sizing: border-box; font-family: inherit; }
    
    .spil-knap { background: url('/screens/button.webp') no-repeat center; background-size: contain; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 220px; height: 65px; }
    .knap-tekst { color: #fcebd5; font-weight: bold; font-size: 1.1rem; padding-bottom: 2px; pointer-events: none; font-family: 'Cinzel', serif; }
    .login-boat-btn { width: 220px; height: 65px; margin-top: 10px; }
    .offline-btn { filter: saturate(0.75) hue-rotate(18deg); }
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
    .offline-cache-panel {
        width: 100%;
        margin-top: 12px;
        padding: 10px;
        box-sizing: border-box;
        border: 1px solid #333;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        color: #ccc;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        align-items: center;
        text-align: left;
    }
    .offline-cache-panel.klar {
        border-color: #4d6a4d;
        background: rgba(70, 120, 70, 0.12);
    }
    .offline-cache-panel button {
        background: #2d2d2d;
        color: white;
        border: 1px solid #555;
        border-radius: 5px;
        padding: 8px 10px;
        cursor: pointer;
    }
    .offline-cache-panel button:disabled {
        opacity: 0.65;
        cursor: default;
    }
    .offline-cache-panel p {
        grid-column: 1 / -1;
        margin: 0;
        font-size: 0.82rem;
        color: #aaa;
    }
    .slut-knap-styled { width: 220px; height: 65px; }

    .start-tavle { margin-top: 30px; width: 100%; max-width: 320px; }
    .global-note { color: #aaa; font-size: 0.78rem; margin: -4px 0 6px; }

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

    .character-select { position: relative; background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; max-width: 1100px; width: 95%; max-height: 90vh; overflow-y: auto; text-align: center; }
    .character-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-top: 20px; }
    .char-card { background: #222; border: 2px solid #444; padding: 20px; text-align: center; cursor: pointer; border-radius: 8px; transition: 0.2s; display: flex; flex-direction: column; align-items: center; }
    .char-card:hover { border-color: #fff; transform: scale(1.02); }
    .char-card h3 { margin-top: 10px; color: #fff; font-size: 1.3rem; font-family: 'Cinzel', serif; }
    .char-icon { height: 90px; width: auto; margin-bottom: 10px; }
    .stats { font-weight: bold; color: #aaa; margin: 10px 0; font-family: monospace; }
    .desc { font-size: 0.9rem; margin: 4px 0; line-height: 1.3; font-style: italic; }
    .positive { color: #ccc; }
    .negative { color: #888; }

    .death-screen { flex-direction: column; text-align: center; background: rgba(40, 0, 0, 0.95); overflow-y: auto; justify-content: flex-start; }
    .sejrsskaerm { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #053315; display: flex; flex-direction: column; align-items: center; color: #ffffff; box-sizing: border-box; overflow-y: auto; z-index: 1000; font-family: system-ui, -apple-system, sans-serif; }
    
    .slut-scroll { overflow-y: auto; height: 100vh; width: 100%; display: flex; flex-direction: column; align-items: center; padding: 0 20px 40px 20px; }
    .medalje-sektion { margin: 0; padding: 0; width: 100%; display: flex; justify-content: center; }
    .stor-medalje { height: 260px; filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.15)); margin: 0 0 10px 0; display: block; }
    
    .doeds-titel { font-size: 2.5rem; margin: 1rem 0; font-family: 'Cinzel', serif; color: #fff; }
    .sejr-titel { font-size: 2.5rem; margin: 1rem 0; font-family: 'Cinzel', serif; color: #fff; }
    .beskrivelse { color: #ccc; max-width: 700px; text-align: center; font-style: italic; margin: 20px 0; line-height: 1.6; font-size: 1.1rem; }
    
    .score-container { position: relative; width: 100%; max-width: 400px; margin: 1.5rem 0; }
    .pergament-billede { width: 100%; height: auto; }
    .score-tekst-doed { position: absolute; top: 18%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 2.4rem; font-family: 'Cinzel', serif; font-weight: bold; text-shadow: 2px 2px 5px black; text-align: center; width: 100%; line-height: 1; margin: 0; }
    .lille-score-doed { font-size: 1.2rem; color: #ccc; letter-spacing: 1px; margin-right: 10px; }
    .score-tekst { position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); color: #222; font-size: 2.4rem; font-family: 'Cinzel', serif; font-weight: bold; text-align: center; line-height: 1; width: 100%; margin: 0; }
    .lille-score { font-size: 1.2rem; color: #555; letter-spacing: 2px; margin-right: 10px; }

    .spec-paneler { display: flex; gap: 25px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 1100px; margin: 20px 0; }
    .point-kvittering { background: rgba(0, 0, 0, 0.5); border: 1px dashed #555; padding: 20px; width: 380px; font-family: monospace; text-align: left; }
    .point-kvittering h4 { margin: 0 0 15px 0; text-align: center; color: #fff; border-bottom: 1px solid #444; padding-bottom: 10px; font-family: 'Cinzel', serif; font-size: 1.2rem; }
    .kvittering-linje { display: flex; justify-content: space-between; color: #ccc; margin: 8px 0; font-size: 1rem; }
    .kvittering-linje.mult { color: #bbb; font-style: italic; }
    .kvittering-skiller { border-top: 1px solid #444; margin: 10px 0; }
    .kvittering-total { display: flex; justify-content: space-between; font-size: 1.6rem; color: #fff; border-top: 1px solid #666; padding-top: 10px; margin-top: 10px; font-weight: bold; }
    
    .session-tavle { background: rgba(0, 0, 0, 0.5); border: 1px solid #444; padding: 20px; width: 480px; }
    .session-tavle h3 { color: #fff; margin-top: 0; border-bottom: 1px solid #555; padding-bottom: 10px; font-family: 'Cinzel', serif; font-size: 1.2rem; }
    .session-raekke { display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(255, 255, 255, 0.05); margin-bottom: 10px; border-radius: 4px; border: 1px solid transparent; }
    .aktiv-mig { border: 1px solid #aaa; background: rgba(255, 255, 255, 0.1); }
    .session-ikon { height: 45px; }
    .session-info { flex-grow: 1; text-align: left; }
    .session-navn { display: block; color: #fff; font-weight: bold; font-size: 1.1rem; }
    .session-score { color: #fff; font-weight: bold; font-size: 1.2rem; font-family: monospace; }
    .session-status { font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .vinder { color: #ddd; } .doed { color: #666; }
    
    .slut-knapper { display: flex; gap: 20px; margin-top: 40px; padding-bottom: 60px; }
    .highscore-container { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; width: 100%; max-width: 900px; margin-top: 20px; }
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

    .tavle { position: relative; width: 320px; }
    .tavle-billede { width: 100%; }
    .tavle-indhold { position: absolute; width: 76%; left: 12%; top: 12%; color: #eee; }
    .tavle-indhold h3 { color: #fff; font-size: 1rem; text-align: center; font-family: 'Cinzel', serif; margin-top: 0;}
    .tavle-indhold ol { padding: 0; list-style: none; }
    .tavle-indhold li { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 5px 0; font-size: 0.85rem; }
    .karakter-navn { color: #9aa69d; font-size: 0.75rem; }
    .status { color: #ccc; margin-top: 15px; }

    .musik-toggle-btn { background: rgba(255, 255, 255, 0.06); border: 1px solid #3a3a3a; border-radius: 8px; cursor: pointer; padding: 9px; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, background 0.2s, border-color 0.2s; }
    .musik-toggle-btn img { height: 54px; width: auto; opacity: 0.86; }
    .musik-toggle-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: #666; transform: scale(1.04); }
    .musik-toggle-btn:hover img { opacity: 1; }
    .screen-top-actions {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 14px);
        right: 14px;
        z-index: 1200;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .musik-toggle-btn.lyd-lav img { opacity: 0.55; }
    .musik-toggle-btn.lyd-slukket { background: rgba(0, 0, 0, 0.22); }

    @media (max-width: 700px) {
        .overlay {
            width: 100vw;
            height: 100dvh;
            align-items: stretch;
            justify-content: center;
            padding: calc(env(safe-area-inset-top, 0px) + 10px) 10px calc(env(safe-area-inset-bottom, 0px) + 10px);
            box-sizing: border-box;
            overflow: hidden;
        }

        .combined-box,
        .login-box,
        .character-select {
            width: 100%;
            max-width: none;
            max-height: 100%;
            overflow-y: auto;
            box-sizing: border-box;
        }

        .login-box {
            padding: 18px;
        }

        .launch-image {
            width: clamp(170px, 58%, 230px);
        }

        .top-image {
            margin-bottom: 8px;
        }

        .overlay h1 {
            font-size: 1.75rem;
            margin-bottom: 8px;
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

        .login-boat-btn,
        .spil-knap {
            width: 180px;
            height: 54px;
        }

        .start-tavle {
            margin-top: 14px;
            max-width: 280px;
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

        .musik-toggle-btn img {
            height: 42px;
        }

        .screen-top-actions {
            top: 10px;
            right: 10px;
            gap: 8px;
        }

        .screen-sound-btn {
            padding: 6px;
        }
    }
</style>
