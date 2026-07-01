<script lang="ts">
    import { onMount } from 'svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { VENTE_MAKS_MS, erVenteTidUdlobet, startVenteSpil, vendKort, stopVenteSpil, erNaesteVenteRundeGratis, venteTidTilbageMs } from '$lib/ventespil.svelte';
    import { erFriskAktivSpiller } from '$lib/aktivSpiller';
    import { tekst } from '$lib/i18n.svelte';
    
    let { kanSpilleIgen } = $props<{ kanSpilleIgen: boolean }>();
    let nu = $state(Date.now());

    onMount(() => {
        const timer = window.setInterval(() => {
            nu = Date.now();
        }, 500);

        return () => window.clearInterval(timer);
    });

    let langsomsteDag = $derived.by(() => {
        const aktive = Object.entries(spilTilstand.alleSpillere)
            .filter(([navn, spiller]) =>
                navn !== spilTilstand.spillerNavn &&
                erFriskAktivSpiller(spiller) &&
                (!spilTilstand.rundeSeed || !spiller.rundeSeed || spiller.rundeSeed === spilTilstand.rundeSeed)
            )
            .map(([, spiller]) => spiller);

        const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (spilTilstand.spillerNavn && spilTilstand.valgtKarakter && spilTilstand.gameState === 'play') {
            aktive.push({
                ...(mig || {}),
                dag: spilTilstand.dag,
                sidstAktiv: Date.now(),
                isDead: false,
                isWinner: false
            });
        }

        if (aktive.length === 0) return spilTilstand.dag;
        return Math.min(...aktive.map((s) => s.dag || 1));
    });

    let dageForan = $derived(Math.max(0, (spilTilstand.dag || 1) - langsomsteDag));
    let sekunderTilbage = $derived(Math.ceil(venteTidTilbageMs(nu) / 1000));
    let impTidUdlobet = $derived(erVenteTidUdlobet(nu));
    let kanStarteRunde = $derived(kanSpilleIgen && !impTidUdlobet);
    let naesteRundeErGratis = $derived(erNaesteVenteRundeGratis());
    let kanBetaleNaesteRunde = $derived(naesteRundeErGratis || spilTilstand.guldTotal + spilTilstand.ventePuljeGuld >= 5);
</script>

<div class="vente-overlay">
    <div class="vente-content">
        <h2>{tekst('Tiden står stille', 'Time stands still')}</h2>
        <div class="imp-timer" class:udloebet={impTidUdlobet}>
            {#if impTidUdlobet}
                {tekst('Impen pakker sammen efter denne runde', 'The imp packs up after this round')}
            {:else}
                {tekst(`Impen bliver i ${sekunderTilbage} sekunder`, `The imp stays for ${sekunderTilbage} seconds`)}
            {/if}
        </div>
        <p class="vente-desc">
            {tekst('Du har slået lejr', 'You have made camp')}
            <strong style="color: gold;">{dageForan} {dageForan === 1 ? tekst('dag', 'day') : tekst('dage', 'days')}</strong>
            {tekst('foran den langsomste på øen. En imp dukker pludselig op med et magisk kortspil.', 'ahead of the slowest player on the island. An imp suddenly appears with a magic card game.')}
            <br><br>
            <strong>{tekst('Regler:', 'Rules:')}</strong>
            {tekst(
                `Impen bliver højst ${Math.round(VENTE_MAKS_MS / 1000)} sekunder. Du får én gratis runde pr. felt. Du kan først få en ny gratis runde, når du har flyttet dig. På samme felt kan du selv købe flere runder for 5 guld. Træk kort for at vinde guld eller helbred. Trækker du kraniet, mister du alt det, du har vundet i denne runde.`,
                `The imp stays for at most ${Math.round(VENTE_MAKS_MS / 1000)} seconds. You get one free round per field. You can only get a new free round after moving. On the same field, you can buy more rounds for 5 gold. Draw cards to win gold or health. If you draw the skull, you lose everything won in this round.`
            )}
        </p>

        <div class="vente-board">
            {#each spilTilstand.venteKort as kort, i (i)}
                <div
                    class="vente-kort {kort.afsloeret ? 'flipped' : ''}"
                    onclick={() => vendKort(i)}
                    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') vendKort(i); }}
                    role="button"
                    tabindex="0"
                >
                    <div class="vente-kort-inner">
                        <div class="vente-kort-front" style="background-image: url('/events/kort_bag.webp')"></div>
                        <div class="vente-kort-back" style="background-image: url('/events/kort_{kort.type}.webp')">
                            {#if kort.type !== 'slut'}
                                <span class="kort-vaerdi">{kort.vaerdi}</span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <div class="pulje-sektion">
            <span class="pulje-label">{tekst('Pulje på bordet:', 'Pot on the table:')}</span>
            <span class="pulje-item">
                <img src="/inventory/hp.webp" alt="HP" />
                {spilTilstand.ventePuljeLiv}
            </span>
            <span class="pulje-divider">|</span>
            <span class="pulje-item">
                <img src="/inventory/guld.webp" alt={tekst('Guld', 'Gold')} />
                {spilTilstand.ventePuljeGuld}
            </span>
        </div>

        <div class="handling-sektion">
            {#if spilTilstand.venteFase === 'spiller' || spilTilstand.venteFase === 'viser_gevinst'}
                {#if spilTilstand.ventePuljeLiv > 0 || spilTilstand.ventePuljeGuld > 0}
                    <button class="vente-btn stop-btn" onclick={stopVenteSpil}>{tekst('Stop og behold puljen', 'Stop and keep the pot')}</button>
                {/if}
            {:else if spilTilstand.venteFase === 'tabt' || spilTilstand.venteFase === 'vundet' || spilTilstand.venteFase === 'venter' || spilTilstand.venteFase === 'trukket'}
                {#if kanStarteRunde}
                    <button
                        class="vente-btn spil-igen-btn"
                        disabled={!kanBetaleNaesteRunde}
                        onclick={() => startVenteSpil(true)}
                    >
                        {naesteRundeErGratis ? tekst('Start første runde (Gratis)', 'Start first round (Free)') : tekst('Start ny runde (Koster 5 Guld)', 'Start new round (Costs 5 Gold)')}
                    </button>
                {:else}
                    <button class="vente-btn udsolgt-btn" disabled>
                        {impTidUdlobet ? tekst('Impen pakker sammen.', 'The imp is packing up.') : tekst('De andre er ved at pakke bordet sammen.', 'The others are packing up the table.')}
                    </button>
                {/if}
            {/if}
        </div>
    </div>
</div>

<style>
    .vente-overlay { 
        position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; 
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); 
        display: flex; align-items: center; justify-content: center; z-index: 1000; 
    }
    .vente-content { 
        background: #1a1a1a; padding: 30px; border-radius: 8px; max-width: 800px; width: 95%;
        text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.8); 
    }
    .vente-content h2 { margin-top: 0; color: #ffcc00; }
    .imp-timer {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 6px 14px;
        margin-bottom: 14px;
        border: 1px solid rgba(255, 204, 0, 0.42);
        border-radius: 4px;
        color: #ffe28a;
        background: rgba(255, 204, 0, 0.08);
        font-weight: 800;
    }
    .imp-timer.udloebet {
        border-color: rgba(180, 180, 180, 0.35);
        color: #ccc;
        background: rgba(255, 255, 255, 0.07);
    }
    .vente-desc { font-size: 16px; margin-bottom: 20px; color: #ccc; }
    .vente-board { display: flex; gap: 20px; justify-content: center; margin: 40px 0; flex-wrap: wrap; }
    .vente-kort { width: 160px; height: 224px; cursor: pointer; perspective: 1000px; }
    .vente-kort-inner { 
        position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; 
    }
    .vente-kort.flipped .vente-kort-inner { transform: rotateY(180deg); }
    .vente-kort-front, .vente-kort-back { 
        position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 12px; 
        background-size: cover; background-position: center; box-shadow: 0 5px 15px rgba(0,0,0,0.8); border: 2px solid #444; 
    }
    .vente-kort-back { transform: rotateY(180deg); display: flex; align-items: center; justify-content: center; }
    .kort-vaerdi { 
        font-size: 56px; font-weight: 900; color: white;
        text-shadow: 3px 3px 6px black, -1px -1px 0 black; background: rgba(0,0,0,0.4); padding: 10px 25px; border-radius: 50%;
    }
    .pulje-sektion { 
        margin: 25px 0; font-size: 24px; font-weight: bold; color: gold; display: flex; 
        align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; 
    }
    .pulje-label { color: #aaa; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
    .pulje-item { display: flex; align-items: center; gap: 8px; }
    .pulje-item img { height: 32px; filter: drop-shadow(0 0 2px black); }
    .pulje-divider { color: #444; }
    .handling-sektion { display: flex; gap: 20px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
    .vente-btn { 
        padding: 12px 24px; font-size: 16px; font-weight: bold; border-radius: 4px;
        cursor: pointer; border: 1px solid #444; transition: 0.2s; color: white; 
    }
    .stop-btn { background: #2a4a2a; }
    .stop-btn:hover { background: #3a5a3a; }
    .spil-igen-btn { background: #8b6508; }
    .spil-igen-btn:hover:not(:disabled) { background: #a67c00; }
    .spil-igen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .udsolgt-btn { background: #444; color: #888; cursor: not-allowed; }

    @media (max-width: 700px) {
        .vente-overlay {
            align-items: stretch;
            padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px);
            box-sizing: border-box;
        }

        .vente-content {
            width: 100%;
            max-width: none;
            max-height: 100%;
            overflow-y: auto;
            padding: 16px;
            box-sizing: border-box;
        }

        .vente-desc {
            font-size: 0.9rem;
            margin-bottom: 12px;
        }

        .imp-timer {
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 10px;
        }

        .vente-board {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: clamp(4px, 1.6vw, 10px);
            margin: 18px 0;
            width: 100%;
        }

        .vente-kort {
            width: 100%;
            height: auto;
            aspect-ratio: 160 / 224;
            min-width: 0;
        }

        .kort-vaerdi {
            font-size: 32px;
            padding: 6px 14px;
        }

        .pulje-sektion {
            margin: 14px 0;
            gap: 10px;
            font-size: 18px;
        }

        .handling-sektion {
            gap: 10px;
        }

        .vente-btn {
            width: 100%;
            padding: 11px 14px;
            font-size: 0.92rem;
        }
    }
</style>
