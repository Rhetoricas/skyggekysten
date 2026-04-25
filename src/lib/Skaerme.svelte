<script lang="ts">
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { tilgaengeligeKarakterer } from '$lib/spildata';
    import type { Karakter } from '$lib/types';

    let { opretEllerDeltag, bekræftValg, genstartBane, nulstilHukommelse, topTre } = $props<{
        opretEllerDeltag: () => void;
        bekræftValg: (k: Karakter) => void;
        genstartBane: () => void;
        nulstilHukommelse: () => void;
        topTre: Array<{ navn: string, score: number, karakter?: string }>;
    }>();

    let visMandlige = $state(true);
    let visKvindelige = $state(true);
</script>

{#if spilTilstand.gameState === 'login'}
    <div class="overlay">
        <div class="login-box">
            <h1>Tågeøen</h1>
            <p>Angiv dit navn og et rum for at kæmpe jer over øen sammen.</p>
            
            <input type="text" placeholder="Dit Spillernavn" bind:value={spilTilstand.spillerNavn} />

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

            <input type="text" placeholder="Tågeøens navn" bind:value={spilTilstand.rumKode} />
            <button onclick={opretEllerDeltag}>Gå til kysten</button>
            <p class="status">{spilTilstand.statusBesked}</p>
        </div>
    </div>
{:else if spilTilstand.gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            <h2>Vælg din karakter, {spilTilstand.spillerNavn}</h2>
            <div class="character-gallery">
                {#each tilgaengeligeKarakterer.filter(k => (visMandlige && k.id.endsWith('_m')) || (visKvindelige && k.id.endsWith('_f'))) as k (k.id)}
                    <div class="char-card" 
                         class:selected={spilTilstand.valgtKarakter?.id === k.id} 
                         role="button" 
                         tabindex="0" 
                         onclick={() => spilTilstand.valgtKarakter = k}
                         onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') spilTilstand.valgtKarakter = k; }}>
                        {#if k.ikon.startsWith('/')}
                            <img src={k.ikon} alt={k.navn} class="char-icon" />
                        {:else}
                            <span class="char-icon emoji">{k.ikon}</span>
                        {/if}
                        <h3>{k.navn}</h3>
                        <p class="stats">HP: {k.startHp} | Guld: {k.startGuld}</p>
                        <p class="desc positive">{k.fordel}</p>
                        <p class="desc negative">{k.ulempe}</p>
                    </div>
                {/each}
            </div>
            <button class="confirm-btn" disabled={!spilTilstand.valgtKarakter} onclick={() => spilTilstand.valgtKarakter && bekræftValg(spilTilstand.valgtKarakter)}>
                Bekræft Valg
            </button>
        </div>
    </div>
{:else if spilTilstand.gameState === 'dead'}
    <div class="overlay death-screen">
        <h1>Du forlader aldrig tågeøen</h1>
        <p>Din krop giver op. Din rejse ender her i mudderet.</p>
        <h2>Endelig Score: {spilTilstand.samletScore}</h2>
       <div class="knap-gruppe">
            <button class="epic-btn retry-btn" onclick={genstartBane}>Prøv samme ø igen</button>
            <button class="epic-btn reset-btn" onclick={nulstilHukommelse}>Prøv en anden ø</button>
        </div> 
        <div class="highscore-board">
            <h3>Top 3 på {spilTilstand.rumKode}</h3>
            {#if topTre.length === 0}
                <p>Stien er stadig uberørt...</p>
            {:else}
                <ol>
                    {#each topTre as hs, i (i)}
                        <li><strong>{hs.navn}</strong> <em>({hs.karakter || 'Ukendt'})</em>: {hs.score} point</li>
                    {/each}
                </ol>
            {/if}
        </div>
    </div>
{:else if spilTilstand.gameState === 'win'}
    <div class="overlay win-screen">
        <h1>Tågeøen er besejret!</h1>
        <p>Du har nået den fjerne kyst og overlevet mørket.</p>
        <h2>Endelig Score: {spilTilstand.samletScore}</h2>
        <div class="knap-gruppe">
            <button class="epic-btn retry-btn" onclick={genstartBane}>Prøv samme ø igen</button>
            <button class="epic-btn reset-btn" onclick={nulstilHukommelse}>Prøv en anden ø</button>
        </div> 
        <div class="highscore-board">
            <h3>Top 3 på {spilTilstand.rumKode}</h3>
            {#if topTre.length === 0}
                <p>Stien er stadig uberørt...</p>
            {:else}
                <ol>
                    {#each topTre as hs, i (i)}
                        <li><strong>{hs.navn}</strong> <em>({hs.karakter || 'Ukendt'})</em>: {hs.score} point</li>
                    {/each}
                </ol>
            {/if}
        </div>
    </div>
{/if}

<style>
    .overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .login-box { background: #1a1a1a; padding: 40px; border-radius: 12px; border: 1px solid #333; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .login-box h1 { margin-top: 0; color: #ffcc00; }
    .login-box input { display: block; width: 100%; padding: 12px; margin-bottom: 20px; background: #0d0d0d; border: 1px solid #444; color: white; border-radius: 6px; box-sizing: border-box; }
    .login-box button { width: 100%; padding: 14px; background: #2a4a2a; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: 0.2s; font-weight: bold; }
    .login-box button:hover { background: #3a6a3a; }
    .status { margin-top: 15px; color: #aaa; font-size: 14px; }

    .gender-toggles { display: flex; gap: 20px; margin-bottom: 20px; justify-content: center; }
    .checkbox-label { color: #ccc; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; }
    .checkbox-label input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: #2a4a2a; }

    .character-select { background: #1a1a1a; padding: 30px; border-radius: 12px; border: 1px solid #333; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; }
    .character-select h2 { text-align: center; color: #ffcc00; margin-top: 0; }
    .character-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .char-card { background: #222; border: 2px solid #444; border-radius: 8px; padding: 15px; text-align: center; cursor: pointer; transition: 0.2s; }
    .char-card:hover { border-color: #666; transform: translateY(-2px); }
    .char-card.selected { border-color: #ffcc00; background: #2a2a20; box-shadow: 0 0 15px rgba(255, 204, 0, 0.2); }
    .char-icon { height: 80px; width: auto; object-fit: contain; margin-bottom: 10px; }
    .char-icon.emoji { font-size: 60px; line-height: 80px; display: block; }
    .char-card h3 { margin: 0 0 10px 0; color: white; }
    .char-card .stats { font-weight: bold; color: #ccc; font-size: 14px; margin-bottom: 10px; }
    .char-card .desc { font-size: 12px; margin: 5px 0; }
    .char-card .positive { color: #88ff88; }
    .char-card .negative { color: #ff8888; }
    .confirm-btn { display: block; width: 100%; padding: 15px; background: #ffcc00; color: black; border: none; border-radius: 6px; font-size: 18px; font-weight: bold; cursor: pointer; }
    .confirm-btn:disabled { background: #444; color: #888; cursor: not-allowed; }

    .highscore-board { background: rgba(0, 0, 0, 0.85); border: 2px solid gold; padding: 20px; margin-top: 30px; border-radius: 8px; text-align: left; min-width: 250px; color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    .highscore-board h3 { margin: 0 0 15px 0; color: gold; font-size: 18px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
    .highscore-board p { color: #ccc; text-align: center; margin: 0; }
    .highscore-board ol { padding-left: 20px; margin: 0; }
    .highscore-board li { color: #ddd; margin-bottom: 8px; font-size: 16px; }
    .highscore-board strong { color: #fff; font-weight: bold; }

    .death-screen { background: rgba(50,0,0,0.9); flex-direction: column; text-align: center; }
    .death-screen h1 { color: #901a1e; font-size: 3em; margin-bottom: 10px; }
    .win-screen { background: rgba(0,50,0,0.9); flex-direction: column; text-align: center; }
    .win-screen h1 { color: #ffffff; font-size: 3em; margin-bottom: 10px; }
    .death-screen button, .win-screen button { border: none; border-radius: 4px; transition: transform 0.1s, filter 0.2s; cursor: pointer; }
    .death-screen button:hover, .win-screen button:hover { filter: brightness(1.2); transform: translateY(-2px); }

    .knap-gruppe { display: flex; flex-direction: column; gap: 15px; align-items: center; margin-top: 20px; }
    .epic-btn { padding: 16px 32px; border: none; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); font-weight: bold; font-size: 18px; cursor: pointer; transition: 0.2s; width: 100%; max-width: 300px; text-transform: uppercase; letter-spacing: 1px; }
    .epic-btn:hover { transform: translateY(-2px); filter: brightness(1.2); }
    .retry-btn { background: #2a4a2a; color: #ccffcc; }
    .reset-btn { background: #5c1616; color: #ffcccc; }
</style>