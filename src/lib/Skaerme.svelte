<script lang="ts">
    import { onMount } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { tilgaengeligeKarakterer } from '$lib/spildata';
    import { genererSlutHistorie, hentTitel } from '$lib/historieMotor';
    import type { Karakter } from '$lib/types';

    let {
        opretEllerDeltag,
        bekræftValg,
        genstartBane,
        nulstilHukommelse,
        lokaleScores,
        globaleScores
    } = $props<{
        opretEllerDeltag: () => void;
        bekræftValg: (k: Karakter) => void;
        genstartBane: () => void;
        nulstilHukommelse: () => void;
        lokaleScores: Array<{ navn: string; score: number; karakter?: string }>;
        globaleScores: Array<{ spillerNavn: string; oeNavn: string; point: number; karakter?: string }>;
    }>();

    let lydStart: HTMLAudioElement | null = null;
    let lydDoed: HTMLAudioElement | null = null;
    let lydSejr: HTMLAudioElement | null = null;
    
    let udvalgteSkæbner = $state<Karakter[]>([]);
    let forrigeState = spilTilstand.gameState;
    let spilletSlutLyd = false;

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
            l.volume = 0.8;
        });

        blandKarakterer();
    });

    function findNiveau(score: number) {
        const graenser = [0, 500, 1200, 2000, 3000, 4500, 6500, 9000, 12500, 18000];
        let niveau = 0;
        for (let i = 0; i < graenser.length; i++) {
            if (score >= graenser[i]) niveau = i;
        }
        return niveau;
    }

    function findMedalje(score: number) {
        return `/screens/m${findNiveau(score) + 1}.webp`;
    }

    function formaterNavn(tekst: string) {
        if (!tekst) return '';
        return tekst.charAt(0).toUpperCase() + tekst.slice(1).toLowerCase();
    }

    function startSpilMedLyd() {
        if (spilTilstand.musikTaendt && lydStart) {
            lydStart.currentTime = 0;
            lydStart.play().catch(() => {});
        }
        opretEllerDeltag();
    }

    function trykEnter(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            startSpilMedLyd();
        }
    }

    function hentPointSpec() {
        const udforskning = (spilTilstand.mineKendteFelter?.length || 0) * 2;
        const minePoint = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length * 100;
        const winBonus = (spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map') ? 1000 : 0;
        const hpMult = (1 + Math.max(0, spilTilstand.livspoint) / 1000);
        return { udforskning, minePoint, winBonus, hpMult };
    }

    function hentSessionSpillere() {
        return Object.entries(spilTilstand.alleSpillere).map(([navn, data]) => {
            const udforskning = (data.kendteFelter?.length || 0) * 2;
            const minePoint = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === navn).length * 100;
            const score = Math.floor((data.guld + (data.kolonne || 0) + udforskning + minePoint + (data.isWinner ? 1000 : 0)) * (1 + Math.max(0, data.hp) / 1000));
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
        <div class="kvittering-linje"><span>Ekspedition:</span> <span>{spilTilstand.maxKolonne}</span></div>
        <div class="kvittering-linje"><span>Udforskning:</span> <span>{hentPointSpec().udforskning}</span></div>
        <div class="kvittering-linje"><span>Territorium (miner):</span> <span>{hentPointSpec().minePoint}</span></div>
        {#if hentPointSpec().winBonus > 0}
            <div class="kvittering-linje bonus"><span>Overlevelses-bonus:</span> <span>+{hentPointSpec().winBonus}</span></div>
        {/if}
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
                            {data.isWinner ? 'Undsluppet' : (data.isDead ? 'Bukkede under' : 'Sidder fast i tågen')}
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

{#if spilTilstand.gameState === 'start'}
    <div class="overlay">
        <button 
            class="musik-toggle-btn top-right" 
            onclick={() => spilTilstand.musikTaendt = !spilTilstand.musikTaendt} 
            title={spilTilstand.musikTaendt ? 'Sluk al lyd' : 'Tænd al lyd'}
        >
            <img 
                src={spilTilstand.musikTaendt ? '/screens/musicon.webp' : '/screens/musicoff.webp'} 
                alt="Lyd afspiller" 
            />
        </button>

        <div class="login-box combined-box">
            <button type="button" class="boat-btn-wrapper" onclick={(e) => { e.preventDefault(); startSpilMedLyd(); }}>
                <img src="/events/launch.webp" alt="Båd" class="launch-image top-image clickable-boat" />
            </button>

            <h1>Tågeøerne</h1>
            <p>Indtast dit navn og ø-koden for at begynde din ekspedition.</p>
            
            <input 
                type="text" 
                bind:value={spilTilstand.spillerNavn} 
                maxlength="10" 
                placeholder="Dit navn" 
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
                <span class="knap-tekst">Mod Kysten</span>
            </button>
            <p class="status larger-status">{spilTilstand.statusBesked}</p>
            
            <div class="tavle start-tavle">
                <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
                <div class="tavle-indhold global-indhold">
                    <h3>Top 10 global</h3>
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
            <h2>Vælg Skæbne</h2>
            <p class="instruktion">Vælg den rejsende, du vil føre gennem tågen.</p>
            
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
            
            <h1 class="doeds-titel">Du kom ikke væk fra Tågeøen {formaterNavn(spilTilstand.rumKode)}</h1>
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
                <div class="tavle">
                    <img src="/screens/boardlocal.webp" alt="Lokal tavle" class="tavle-billede" />
                    <div class="tavle-indhold lokal-indhold">
                        <h3>Top 10 på {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">Øens kyster er uberørte</p>
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
                <div class="tavle">
                    <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
                    <div class="tavle-indhold global-indhold">
                        <h3>Top 10 global</h3>
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
    </div>

{:else if spilTilstand.gameState === 'win'}
    <div class="sejrsskaerm">
        <div class="slut-scroll">
            <div class="medalje-sektion">
                <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" />
            </div>
            <h1 class="sejr-titel">Tågeøen {formaterNavn(spilTilstand.rumKode)} er besejret!</h1>
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
                <div class="tavle">
                    <img src="/screens/boardlocal.webp" alt="Lokal tavle" class="tavle-billede" />
                    <div class="tavle-indhold lokal-indhold">
                        <h3>Top 10 på {formaterNavn(spilTilstand.rumKode)}</h3>
                        {#if lokaleScores.length === 0}
                            <p class="tom-liste">Øens kyster er uberørte</p>
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
                <div class="tavle">
                    <img src="/screens/boardglobal.webp" alt="Global tavle" class="tavle-billede" />
                    <div class="tavle-indhold global-indhold">
                        <h3>Top 10 global</h3>
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
    </div>
{/if}

<style>
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; font-family: system-ui, -apple-system, sans-serif; }
    .combined-box { max-height: 90vh; overflow-y: auto; }
    .login-box { background: #1a1a1a; padding: 40px; border-radius: 12px; border: 1px solid #333; text-align: center; max-width: 500px; width: 90%; display: flex; flex-direction: column; align-items: center; }
    
    .boat-btn-wrapper { background: none; border: none; padding: 0; margin: 0; cursor: pointer; outline: none; }
    .launch-image { max-width: 150px; height: auto; border-radius: 4px; transition: 0.2s; }
    .launch-image:hover { transform: scale(1.05); filter: brightness(1.2); }
    .top-image { margin-bottom: 15px; }

    .overlay h1 { color: #fff; margin-top: 0; font-size: 2.5rem; text-align: center; font-family: 'Cinzel', serif; }
    .login-box p { color: #ccc; margin-bottom: 20px; line-height: 1.4; }
    
    .large-input { display: block; width: 100%; padding: 15px; margin-bottom: 20px; font-size: 1.2rem; background: #0d0d0d; color: white; border: 1px solid #444; border-radius: 6px; box-sizing: border-box; font-family: inherit; }
    
    .spil-knap { background: url('/screens/button.webp') no-repeat center; background-size: contain; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 220px; height: 65px; }
    .knap-tekst { color: #fcebd5; font-weight: bold; font-size: 1.1rem; padding-bottom: 2px; pointer-events: none; font-family: 'Cinzel', serif; }
    .login-boat-btn { width: 220px; height: 65px; margin-top: 10px; }
    .slut-knap-styled { width: 220px; height: 65px; }

    .start-tavle { margin-top: 30px; width: 100%; max-width: 320px; }

    .character-select { background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; max-width: 1100px; width: 95%; max-height: 90vh; overflow-y: auto; text-align: center; }
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
    .kvittering-linje.bonus { color: #eee; }
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

    .tavle { position: relative; width: 320px; }
    .tavle-billede { width: 100%; }
    .tavle-indhold { position: absolute; width: 76%; left: 12%; top: 12%; color: #eee; }
    .tavle-indhold h3 { color: #fff; font-size: 1rem; text-align: center; font-family: 'Cinzel', serif; margin-top: 0;}
    .tavle-indhold ol { padding: 0; list-style: none; }
    .tavle-indhold li { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 5px 0; font-size: 0.85rem; }
    .karakter-navn { color: #9aa69d; font-size: 0.75rem; }
    .status { color: #ccc; margin-top: 15px; }

    .musik-toggle-btn { background: transparent; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; transition: transform 0.2s; }
    .musik-toggle-btn img { height: 35px; width: auto; opacity: 0.6; }
    .musik-toggle-btn:hover img { opacity: 1; transform: scale(1.1); }
    .musik-toggle-btn.top-right { position: absolute; top: 20px; right: 20px; z-index: 1001; }
</style>