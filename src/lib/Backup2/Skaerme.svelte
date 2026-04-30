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
    let visMandlige = $state(true);
    let visKvindelige = $state(true);

    type GlobalScore = { spillerNavn: string; oeNavn: string; point: number };
    let globalHighscore = $state<GlobalScore[]>([]);

    onMount(async () => {
        try {
            globalHighscore = await hentGlobalTopTi();
        } catch (e) {
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
</script>

{#if spilTilstand.gameState === 'login' || spilTilstand.gameState === 'start'}
    <div class="overlay">
        <div class="login-box">
            <h1>Tågeøen</h1>
            <p>Angiv dit navn og et rum for at kæmpe jer over øen sammen.</p>
            <input type="text" bind:value={spilTilstand.spillerNavn} maxlength="15" placeholder="Dit navn" />
            <div class="gender-toggles">
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={visMandlige} />
                    Mand
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={visKvindelige} />
                    Kvinde
                </label>
            </div>
            <input type="text" bind:value={spilTilstand.rumKode} maxlength="15" placeholder="Øens navn" />
            <button onclick={opretEllerDeltag} class="login-btn">Gå til kysten</button>
            <p class="status">{spilTilstand.statusBesked}</p>
        </div>
    </div>

{:else if spilTilstand.gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            <h2>Vælg din karakter, {spilTilstand.spillerNavn}</h2>
            <div class="character-gallery">
                {#each tilgaengeligeKarakterer.filter((k) => (visMandlige && k.id.endsWith('_m')) || (visKvindelige && k.id.endsWith('_f'))) as k (k.id)}
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
                                class="bekraeft-kort-btn" 
                                onclick={(e) => { e.stopPropagation(); bekræftValg(k); }}
                            >
                                Vælg {k.navn}
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
            <button class="slut-knap-original" onclick={genstartBane}>Prøv samme ø igen</button>
            <button class="slut-knap-original" onclick={nulstilHukommelse}>Prøv en anden ø</button>
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
    }
    .login-box {
        background: #1a1a1a; padding: 40px; border-radius: 12px; border: 1px solid #333;
        text-align: center; max-width: 400px; width: 90%;
    }
    .login-box h1 { color: #ffcc00; margin-top: 0; }
    .login-box input {
        display: block; width: 100%; padding: 12px; margin-bottom: 20px;
        background: #0d0d0d; color: white; border: 1px solid #444; border-radius: 6px; box-sizing: border-box;
    }
    .login-btn {
        width: 100%; padding: 14px; background: #2a4a2a; color: white; border: none; cursor: pointer; font-weight: bold;
    }
    .gender-toggles { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
    .checkbox-label { color: #ccc; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    
    .character-select {
        background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333;
        max-width: 1000px; width: 95%; max-height: 90vh; overflow-y: auto; text-align: center;
    }
    .character-gallery {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-top: 20px;
    }
    .char-card {
        background: #222; border: 2px solid #444; padding: 20px; text-align: center; cursor: pointer; 
        border-radius: 8px; transition: 0.2s; display: flex; flex-direction: column; align-items: center;
    }
    .char-card.selected { border-color: #ffcc00; background: #2a2a20; transform: scale(1.02); }
    .char-icon { height: 100px; width: auto; margin-bottom: 10px; }
    .stats { font-weight: bold; color: #aaa; margin: 10px 0; }
    .desc { font-size: 0.9rem; margin: 4px 0; line-height: 1.3; }
    .positive { color: #88ff88; }
    .negative { color: #ff8888; }
    
    .bekraeft-kort-btn {
        margin-top: 20px; padding: 10px 20px; background: #ffcc00; color: #1a1a1a;
        border: none; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%;
        animation: focusPulse 1.5s infinite;
    }
    @keyframes focusPulse { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

    .death-screen { flex-direction: column; text-align: center; background: rgba(40, 0, 0, 0.9); }
    .death-screen h1 { color: #ff4444; font-size: 2.5rem; }
    .slut-knapper-original { display: flex; gap: 20px; margin-top: 20px; }
    .slut-knap-original { padding: 12px 24px; background: #444; color: white; border: none; cursor: pointer; border-radius: 4px; }

    .sejrsskaerm {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #053315;
        display: flex; flex-direction: column; align-items: center; color: #ffffff; font-family: serif;
        padding: 0 1rem 3rem 1rem; box-sizing: border-box; overflow-y: auto; z-index: 1000;
    }
    .stor-medalje { width: 100%; max-width: 250px; height: auto; margin-top: 1rem; }
    .sejr-titel { font-size: 2.5rem; margin: 1rem 0; text-transform: uppercase; }
    .score-container { position: relative; width: 100%; max-width: 400px; margin: 1rem 0; }
    .pergament-billede { width: 100%; height: auto; }
    .score-tekst { position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%); color: #3b2818; font-size: 2rem; }
    .spiller-titel { color: #e8c678; text-transform: uppercase; margin-bottom: 2rem; }
    .slut-knapper { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
    .spil-knap { 
        background: url('/screens/button.webp') no-repeat center; background-size: contain;
        width: 220px; height: 65px; border: none; cursor: pointer; color: #fcebd5; font-weight: bold;
    }
    .highscore-container { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; width: 100%; max-width: 900px; }
    .tavle { position: relative; width: 320px; }
    .tavle-billede { width: 100%; }
    .tavle-indhold { position: absolute; width: 76%; left: 12%; top: 12%; color: #eee; font-family: sans-serif; }
    .tavle-indhold h3 { color: #e8c678; text-transform: uppercase; font-size: 0.9rem; text-align: center; }
    .tavle-indhold ol { padding: 0; list-style: none; }
    .tavle-indhold li { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 4px 0; font-size: 0.85rem; }
    .karakter-navn { color: #9aa69d; font-size: 0.75rem; }
</style>