<script lang="ts">
    // Skaerme.svelte
    import { onMount } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { tilgaengeligeKarakterer } from '$lib/spildata';
    import { hentGlobalTopTi } from '$lib/netvaerk';
    import type { Karakter } from '$lib/types';

    let {
        opretEllerDeltag,
        bekræftValg,
        genstartBane,
        nulstilHukommelse,
        lokaleScores
    } = $props<{
        opretEllerDeltag: () => void;
        bekræftValg: (k: Karakter) => void;
        genstartBane: () => void;
        nulstilHukommelse: () => void;
        lokaleScores: Array<{ navn: string; score: number; karakter?: string }>;
    }>();

    let valgtKarakterKort = $state<Karakter | null>(null);
    let udvalgteSkæbner = $state<Karakter[]>([]);

    type GlobalScore = { spillerNavn: string; oeNavn: string; point: number };
    let globalHighscore = $state<GlobalScore[]>([]);

    onMount(async () => {
        const blandet = [...tilgaengeligeKarakterer].sort(() => Math.random() - 0.5);
        udvalgteSkæbner = blandet.slice(0, 8);

        try {
            globalHighscore = await hentGlobalTopTi();
        } catch {
            console.warn("Global highscore ikke tilgængelig");
        }
    });

    function findMedalje(score: number) {
        let niveau = Math.floor(score / 200) + 1;
        if (niveau > 10) niveau = 10;
        if (niveau < 1) niveau = 1;
        return `/screens/m${niveau}.webp`;
    }

    function findTitel(score: number) {
        const titler = ['Novice', 'Vandrer', 'Spejder', 'Udforsker', 'Pioner', 'Banebryder', 'Erobrer', 'Overlever', 'Hersker', 'Guddommelig'];
        let niveau = Math.floor(score / 200);
        if (niveau > 9) niveau = 9;
        if (niveau < 0) niveau = 0;
        return titler[niveau];
    }

    function trykEnter(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            opretEllerDeltag();
        }
    }
</script>

{#if spilTilstand.gameState === 'start'}
    <div class="overlay">
        <div class="login-box">
            <h1>Tågeøen</h1>
            <p>Skriv dit navn og hvilken ø, du vil forsøge at besejre.</p>
            <p class="vent-tekst">Hvis I er flere, der vil spille på samme ø, så vent på kysten indtil alle er ankommet.</p>
            
            <input 
                type="text" 
                bind:value={spilTilstand.spillerNavn} 
                maxlength="15" 
                placeholder="Dit navn" 
                class="large-input" 
                onkeydown={trykEnter}
            />
            
            <input 
                type="text" 
                bind:value={spilTilstand.rumKode} 
                maxlength="15" 
                placeholder="Øens navn" 
                class="large-input" 
                onkeydown={trykEnter}
            />
            
            <button type="button" class="spil-knap login-boat-btn" onclick={(e) => { e.preventDefault(); opretEllerDeltag(); }}>
                <span class="knap-tekst">Sejl mod kysten</span>
            </button>
            <p class="status larger-status">{spilTilstand.statusBesked}</p>
            
            <button type="button" class="boat-btn-wrapper" onclick={(e) => { e.preventDefault(); opretEllerDeltag(); }}>
                <img src="/events/launch.webp" alt="Båd" class="launch-image bottom-image clickable-boat" />
            </button>
        </div>
    </div>

{:else if spilTilstand.gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            <h2>Vælg din karakter, {spilTilstand.spillerNavn}</h2>
            <p class="instruktion">Skæbnen har tildelt dig otte mulige helte. Vælg med omhu.</p>
            
            <div class="character-gallery">
                {#each udvalgteSkæbner as k (k.id)}
                    <div
                        class="char-card"
                        class:selected={valgtKarakterKort?.id === k.id}
                        role="button"
                        tabindex="0"
                        onclick={() => valgtKarakterKort = k}
                        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') valgtKarakterKort = k; }}
                    >
                        {#if k.ikon.startsWith('/')}
                            <img src={k.ikon} alt={k.navn} class="char-icon" />
                        {:else}
                            <span class="char-icon emoji">{k.ikon}</span>
                        {/if}
                        <h3>{k.navn}</h3>
                        <p class="stats">HP: {k.startHp} | Guld: {k.startGuld}</p>
                        <p class="desc positive">{k.fordel}</p>
                        <p class="desc negative">{k.ulempe}</p>

                        {#if valgtKarakterKort?.id === k.id}
                            <button 
                                type="button"
                                class="spil-knap bekraeft-kort-btn-container" 
                                onclick={(e) => { e.stopPropagation(); bekræftValg(k); }}
                            >
                                <span class="knap-tekst">Vælg {k.navn}</span>
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>

{:else if spilTilstand.gameState === 'dead'}
    <div class="overlay death-screen">
        <h1>Du kom ikke væk fra tågeøen</h1>
        <p class="beskrivelse">{spilTilstand.logBesked}</p>
        <h2>Score: {spilTilstand.samletScore}</h2>
        <div class="slut-knapper-original">
            <button class="spil-knap slut-knap-styled" onclick={genstartBane}>
                <span class="knap-tekst">Prøv samme ø igen</span>
            </button>
            <button class="spil-knap slut-knap-styled" onclick={nulstilHukommelse}>
                <span class="knap-tekst">Prøv en anden ø</span>
            </button>
        </div>
    </div>

{:else if spilTilstand.gameState === 'win'}
    <div class="sejrsskaerm">
        <div class="medalje-sektion">
            <img src={findMedalje(spilTilstand.samletScore)} alt="Medalje" class="stor-medalje" />
        </div>
        <h1 class="sejr-titel">Tågeøen er besejret!</h1>
        <p class="underrubrik">Du har nået den fjerne kyst og overlevet mørket.</p>
        <div class="score-container">
            <img src="/screens/pergament.webp" alt="Pergament" class="pergament-billede" />
            <h2 class="score-tekst">Score: {spilTilstand.samletScore}</h2>
        </div>
        
        <h3 class="spiller-titel">{findTitel(spilTilstand.samletScore)}</h3>

        <div class="slut-knapper">
            <button class="spil-knap" onclick={genstartBane}>
                <span class="knap-tekst">Prøv samme ø igen</span>
            </button>
            <button class="spil-knap" onclick={nulstilHukommelse}>
                <span class="knap-tekst">Prøv en anden ø</span>
            </button>
        </div>
        <div class="highscore-container">
            <div class="tavle">
                <img src="/screens/boardlocal.webp" alt="Lokal tavle" class="tavle-billede" />
                <div class="tavle-indhold lokal-indhold">
                    <h3>Top 10 på {spilTilstand.rumKode}</h3>
                    {#if lokaleScores.length === 0}
                        <p class="tom-liste">Øens kyster er uberørte</p>
                    {:else}
                        <ol>
                            {#each lokaleScores as hs, i (i)}
                                <li>
                                    <span class="navn">{hs.navn} <span class="karakter-navn">({hs.karakter || 'Ukendt'})</span></span>
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
                    {#if globalHighscore.length === 0}
                        <p class="tom-liste">Ingen data endnu</p>
                    {:else}
                        <ol>
                            {#each globalHighscore as score, i (i)}
                                <li>
                                    <span class="navn">{score.spillerNavn} <span class="oe-navn">({score.oeNavn})</span></span>
                                    <span class="point">{score.point}</span>
                                </li>
                            {/each}
                        </ol>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 1000;
        font-family: 'Cinzel', serif;
    }
    .login-box {
        background: #1a1a1a; padding: 40px; border-radius: 12px; border: 1px solid #333;
        text-align: center; max-width: 500px; width: 90%;
        display: flex; flex-direction: column; align-items: center;
    }
    
    .boat-btn-wrapper {
        background: none; border: none; padding: 0; margin: 0; cursor: pointer; outline: none;
    }
    
    .launch-image {
        max-width: 150px; height: auto; margin: 10px 0; border-radius: 4px;
    }
    .bottom-image { margin-top: 30px; max-width: 300px; }
    
    .clickable-boat {
        transition: transform 0.2s, filter 0.2s;
    }
    .clickable-boat:hover {
        transform: scale(1.05);
        filter: brightness(1.2);
    }

    .login-box h1 { color: #e8c678; margin-top: 0; font-size: 2.5rem; text-transform: uppercase; }
    .login-box p { color: #d1e8d5; margin-bottom: 20px; font-family: serif; }
    .vent-tekst { font-size: 0.9rem; color: #aaa; margin-bottom: 25px; font-family: serif !important; }
    
    .large-input {
        display: block; width: 100%; padding: 15px; margin-bottom: 20px; font-family: 'Cinzel', serif;
        font-size: 1.2rem; background: #0d0d0d; color: white; border: 1px solid #444; border-radius: 6px; box-sizing: border-box;
    }
    .large-input::placeholder { font-family: 'Cinzel', serif; color: #666; font-size: 1rem; }
    
    .spil-knap { 
        background: url('/screens/button.webp') no-repeat center; background-size: contain;
        border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: background-color 0.2s;
    }
    .knap-tekst {
        color: #fcebd5; font-weight: bold; font-family: 'Cinzel', serif; font-size: 1.1rem; padding-bottom: 2px;
        pointer-events: none;
    }
    .spil-knap:hover { background-color: rgba(255, 255, 255, 0.05); }

    .login-boat-btn { width: 220px; height: 65px; margin-top: 10px; }
    .bekraeft-kort-btn-container { width: 100%; height: 50px; margin-top: 20px; }
    .slut-knap-styled { width: 220px; height: 65px; }

    .character-select {
        background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333;
        max-width: 1100px; width: 95%; max-height: 90vh; overflow-y: auto; text-align: center;
    }
    .instruktion { color: #aaa; margin-bottom: 20px; font-style: italic; font-family: serif; }
    .character-gallery {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 15px; margin-top: 20px;
    }
    .char-card {
        background: #222; border: 2px solid #444; padding: 20px; text-align: center; cursor: pointer; 
        border-radius: 8px; transition: 0.2s; display: flex; flex-direction: column; align-items: center; font-family: serif;
    }
    .char-card h3 { font-family: 'Cinzel', serif; margin-top: 10px; }
    .char-card.selected { border-color: #ffcc00; background: #2a2a20; transform: scale(1.02); }
    .char-icon { height: 100px; width: auto; margin-bottom: 10px; }
    .stats { font-weight: bold; color: #aaa; margin: 10px 0; }
    .desc { font-size: 0.9rem; margin: 4px 0; line-height: 1.3; }
    .positive { color: #88ff88; }
    .negative { color: #ff8888; }
    
    .larger-status { color: #ff8888; margin-top: 20px; font-family: serif; font-size: 1.1rem; }

    .death-screen { flex-direction: column; text-align: center; background: rgba(40, 0, 0, 0.9); }
    .death-screen h1 { color: #ff4444; font-size: 2.5rem; }
    .death-screen h2 { color: gold; font-family: 'Cinzel', serif; font-size: 2rem; margin-top: 0; }
    .beskrivelse { font-family: serif; color: #ccc; margin: 10px 0 30px 0; max-width: 500px; }
    .slut-knapper-original { display: flex; gap: 20px; margin-top: 20px; }

    .sejrsskaerm {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #053315;
        display: flex; flex-direction: column; align-items: center; color: #ffffff; font-family: serif;
        padding: 0 1rem 3rem 1rem; box-sizing: border-box; overflow-y: auto; z-index: 1000;
    }
    .stor-medalje { width: 100%; max-width: 250px; height: auto; margin-top: 1rem; }
    .sejr-titel { font-size: 2.5rem; margin: 1rem 0; text-transform: uppercase; font-family: 'Cinzel', serif; }
    .score-container { position: relative; width: 100%; max-width: 400px; margin: 1rem 0; }
    .pergament-billede { width: 100%; height: auto; }
    .score-tekst { position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%); color: #3b2818; font-size: 2rem; font-family: 'Cinzel', serif; }
    .spiller-titel { color: #e8c678; text-transform: uppercase; margin-bottom: 2rem; font-family: 'Cinzel', serif; font-size: 1.8rem; }
    .slut-knapper { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
    .highscore-container { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; width: 100%; max-width: 900px; font-family: sans-serif; }
    .tavle { position: relative; width: 320px; }
    .tavle-billede { width: 100%; }
    .tavle-indhold { position: absolute; width: 76%; left: 12%; top: 12%; color: #eee; }
    .tavle-indhold h3 { color: #e8c678; text-transform: uppercase; font-size: 0.9rem; text-align: center; font-family: 'Cinzel', serif; }
    .tavle-indhold ol { padding: 0; list-style: none; }
    .tavle-indhold li { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 4px 0; font-size: 0.85rem; }
    .point { font-weight: bold; }
    .karakter-navn { color: #9aa69d; font-size: 0.75rem; }
    .status { color: #ff8888; margin-top: 15px; }
</style>