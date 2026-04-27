<script lang="ts">
   import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { hentHighscores, gemHighscore, syncTilDb, startRealtime, stopRealtime } from '$lib/netvaerk';
    import { hvil, hentNaboIndices, afslørOmraade, initialiserGitter, tilfoejTilRygsæk } from '$lib/spilmotor';
    import { grav } from '$lib/undergrund.svelte';
    import { tjekOverlevelse, fremrykTid, erSpillerITaagen } from '$lib/overlevelse.svelte';
    import { eventState, startEvent, lukEvent as motorLukEvent } from '$lib/eventMotor.svelte';
    
    import {
        BREDDE,
        HOEJDE,
        HEX_W,
        ROW_H,
        tilgaengeligeKarakterer,
        biomeTerraenCost,
        itemDB
    } from '$lib/spildata';
    import type { Karakter } from '$lib/types';

    import Skaerme from './Skaerme.svelte';
    import ShopModal from '$lib/ShopModal.svelte';
    import EventModal from '$lib/EventModal.svelte';
    import VenteModal from '$lib/VenteModal.svelte';

    const cam = skabKamera();
    const MAX_DAGE_FORAN = 5;

    let lokaleScores = $state<Array<{ navn: string; score: number; karakter?: string }>>([]);
    let fremdriftPoint = $derived(spilTilstand.maxKolonne * 1);
    let winBonus = $derived(spilTilstand.gameState === 'win' ? 1000 : 0);

    let flytterNu = false;
    let harDetektor = $derived(spilTilstand.inventory?.some((i) => i.id === 'metaldetektor') ?? false);
    let harKvist = $derived(spilTilstand.inventory?.some((i) => i.id === 'soegekvist') ?? false);
    let erITågen = $derived(erSpillerITaagen());

    $effect(() => {
        spilTilstand.samletScore = Math.floor(
            (spilTilstand.guldTotal + fremdriftPoint + winBonus) *
                (1 + Math.max(0, spilTilstand.livspoint) / 1000)
        );
    });

let glHp = $state(0);
    let glGuld = $state(0);

    $effect(() => {
        const tjekFokus = () => {
            if (!document.hidden) {
                centrerKamera();
            }
        };
        
        document.addEventListener('visibilitychange', tjekFokus);
        
        // Vi rydder op efter os, hvis komponenten bliver fjernet
        return () => {
            document.removeEventListener('visibilitychange', tjekFokus);
        };
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


let uniktTalId = 0; // Placeres oppe ved dine andre variabler

    function affyrTal(tekst: string, type: string) {
        if (!spilTilstand.aktiveTal) spilTilstand.aktiveTal = [];
        
        uniktTalId++;
        const id = uniktTalId;
        const feltIndex = spilTilstand.spillerIndex;
        
        const offsetX = Math.floor(Math.random() * 60) - 30; 
        const offsetY = Math.floor(Math.random() * 40) - 20; // Springer både op og ned
        
        spilTilstand.aktiveTal = [...spilTilstand.aktiveTal, { id, tekst, type, feltIndex, offsetX, offsetY }];
        
        setTimeout(() => {
            spilTilstand.aktiveTal = spilTilstand.aktiveTal.filter(t => t.id !== id);
        }, 3000); 
    }

    let kameraStyle = $derived(`
        transform-origin: ${cam.x}px ${cam.y}px;
        transform: translate(calc(50vw - ${cam.x}px), calc(50vh - ${cam.y}px)) scale(${cam.zoomLevel});
        transition: ${cam.isDragging ? 'none' : 'transform 0.3s ease-out'};
    `);

    $effect(() => {
        tjekOverlevelse();
    });

    $effect(() => {
        const langsomste = hentLangsomsteDag();
        if (spilTilstand.dag <= langsomste && spilTilstand.sidsteVenteDag !== 0) {
            spilTilstand.sidsteVenteDag = 0;
        }
    });

    let kbdRef: (ev: KeyboardEvent) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let alarmKanal: any;

    async function opretEllerDeltag() {
        let rentNavn = spilTilstand.spillerNavn.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = spilTilstand.rumKode.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Brug venligst kun rigtige bogstaver og tal.';
            return;
        }

        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;

        spilTilstand.statusBesked = 'Forbinder til serveren...';
        const { data } = await supabase.from('spil_sessioner').select('*').eq('rum_kode', spilTilstand.rumKode).single();
        if (data) {
            spilTilstand.gitter = data.kort;
            spilTilstand.alleSpillere = data.spillere || {};
            spilTilstand.fogX = data.fog_x || 0;
            spilTilstand.erHost = false;

            if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
                spilTilstand.statusBesked = 'Velkommen tilbage.';
                const eksisterende = spilTilstand.alleSpillere[spilTilstand.spillerNavn];

                spilTilstand.spillerIndex = eksisterende.index;
                spilTilstand.livspoint = eksisterende.hp;
                spilTilstand.guldTotal = eksisterende.guld;
                spilTilstand.maxKolonne = eksisterende.kolonne;
                spilTilstand.dag = eksisterende.dag || 1;
                spilTilstand.retning = eksisterende.retning || 'S';
                
                // Her genopliver vi den rigtige karakter ud fra databasen
                spilTilstand.valgtKarakter = tilgaengeligeKarakterer.find((k) => k.ikon === eksisterende.ikon) || null;
                
                spilTilstand.nuvaerendeEnergi = eksisterende.energi !== undefined ? eksisterende.energi : (spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.baseEnergi : 0);
                spilTilstand.inventory = eksisterende.inventory || [];
                spilTilstand.mineKendteFelter = eksisterende.kendteFelter || [];

                afslørOmraade(spilTilstand.spillerIndex, 1);
                startRealtime();

                if (eksisterende.isDead) spilTilstand.gameState = 'dead';
                else if (eksisterende.isWinner) spilTilstand.gameState = 'win';
                else {
                    opretTastatur();
                    spilTilstand.gameState = 'play';
                    cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
                }
            } else {
                spilTilstand.statusBesked = 'Rum fundet. Deltager som gæst.';
                spilTilstand.spillerIndex = data.start_index;
                afslørOmraade(spilTilstand.spillerIndex, 1);
                startRealtime();
                spilTilstand.gameState = 'select';
            }
        } else {
            spilTilstand.erHost = true;
            spilTilstand.statusBesked = 'Nyt rum oprettes.';
            initialiserGitter();
            startRealtime();
            spilTilstand.gameState = 'select';
        }
    }

function centrerKamera() {
        if (spilTilstand.gameState === 'play') {
            cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        }
    }


 function opretTastatur() {
        if (kbdRef && browser) window.removeEventListener('keydown', kbdRef);
        kbdRef = (ev: KeyboardEvent) => {
            if (ev.repeat) return;
            if (eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;

            const key = ev.key.toLowerCase();
            
            if (key === 'g') {
                const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
                if (felt && !felt.gravet && !felt.eventID && felt.kanGraves) {
                    grav();
                } else {
                    spilTilstand.logBesked = 'Jorden her kan ikke graves op.';
                }
            } else if (key === 'y') {
                spilTilstand.livspoint += 500;
                spilTilstand.nuvaerendeEnergi = 9;
                spilTilstand.guldTotal += 1000;
                
                const alleTing = Object.keys(itemDB);
                for (const itemId of alleTing) {
                    tilfoejTilRygsæk(itemId, 1);
                }

                spilTilstand.logBesked = 'Guddommelig magt og alverdens gods strømmer ned over dig.';
            } else if (key === 'f') {
                centrerKamera();      
            } else if (key === 'h') hvil();
            else if (key === 'q') flytHex('NW');
            else if (key === 'e') flytHex('NE');
            else if (key === 'a') flytHex('W');
            else if (key === 'd') flytHex('E');
            else if (key === 'z') flytHex('SW');
            else if (key === 'c') flytHex('SE');
            else if (key === 'enter') klikPåHex(spilTilstand.spillerIndex);
        };
        if (browser) window.addEventListener('keydown', kbdRef);
    }

    onMount(() => {
        opdaterOgGemHighscore();
        const tjekFaneFokus = () => {
            if (document.visibilityState === 'visible' && spilTilstand.gameState === 'play') {
                cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            }
        };
        document.addEventListener('visibilitychange', tjekFaneFokus);

        alarmKanal = supabase
            .channel(spilTilstand.rumKode)
            .on('broadcast', { event: 'alarm' }, ({ payload }) => {
                if (payload.senderNavn === spilTilstand.spillerNavn) return;
                for (const modstanderNavn in spilTilstand.alleSpillere) {
                    if (modstanderNavn !== spilTilstand.spillerNavn) {
                        spilTilstand.alleSpillere[modstanderNavn].activeAlarm = true;
                    }
                }
            })
            .subscribe();

        return () => {
            document.removeEventListener('visibilitychange', tjekFaneFokus);
            if (alarmKanal) supabase.removeChannel(alarmKanal);
        };
    });

    onDestroy(() => {
        if (kbdRef && browser) window.removeEventListener('keydown', kbdRef);
        stopRealtime();
    });

    async function opdaterOgGemHighscore() {
        await gemHighscore();
        lokaleScores = await hentHighscores();
    }

async function bekræftValg(karakter: Karakter) {
    spilTilstand.valgtKarakter = karakter;
    spilTilstand.livspoint = karakter.startHp;
    spilTilstand.guldTotal = karakter.startGuld;
    spilTilstand.maxKolonne = 1;
    spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;
    spilTilstand.logBesked = karakter.startMsg;

    spilTilstand.mitUdstyr = [];

    for (const itemId of karakter.startUdstyr) {
        tilfoejTilRygsæk(itemId, 1);
    }

        if (spilTilstand.erHost) {
            await supabase.from('spil_sessioner').insert([{
                rum_kode: spilTilstand.rumKode,
                kort: spilTilstand.gitter,
                start_index: spilTilstand.spillerIndex,
                spillere: {},
                fog_x: 0
            }]);
        }

        await syncTilDb();
        opretTastatur();
        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        spilTilstand.gameState = 'play';
    }

    function lukEventOgShop() {
        const f = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (f && eventState.aktivt && f.eventID !== 'campfire') f.eventFuldført = true;
        motorLukEvent();
        spilTilstand.aktivShop = null;
        syncTilDb(true);
    }

    function hentLangsomsteDag() {
        const nu = Date.now();
        const spillere = Object.values(spilTilstand.alleSpillere);
        if (spillere.length <= 1) return spilTilstand.dag;

        const aktiveSpillere = spillere.filter((s) => {
            if (s.isDead || s.isWinner) return false;
            if (!s.sidstAktiv) return true;
            return nu - s.sidstAktiv < 1800000;
        });

        if (aktiveSpillere.length === 0) return spilTilstand.dag;
        return Math.min(...aktiveSpillere.map((s) => Number(s.dag) || 1));
    }

    function udførBevægelse(nI: number) {
        if (flytterNu || !spilTilstand.valgtKarakter) return;
        flytterNu = true;

        if (spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN) {
            spilTilstand.logBesked = 'Du må vente på de andre. Slå lejr.';
            spilTilstand.sidsteVenteDag = spilTilstand.dag;
            spilTilstand.venteSpilAktiv = true;
            spilTilstand.venteFase = 'start';
            flytterNu = false;
            return;
        }

        const f = spilTilstand.gitter[nI];
        if (!f) {
            flytterNu = false;
            return;
        }
        
        const nK = nI % BREDDE;

        if (f.biome === 'hav') {
            spilTilstand.livspoint -= 30;
            spilTilstand.logBesked = 'Du svømmer gennem det kolde vand.';
        } else {
            const terraenModifier = biomeTerraenCost[f.biome] || 1;
            let energiPris = Math.round(spilTilstand.valgtKarakter.moveCost * terraenModifier);
            if (erITågen) energiPris *= 2;
            spilTilstand.nuvaerendeEnergi -= energiPris;
        }

        spilTilstand.spillerIndex = nI;
        cam.foelgSpiller(nI, BREDDE, HEX_W, ROW_H);
        afslørOmraade(spilTilstand.spillerIndex, f.biome === 'bjerg' ? 2 : 1);
        if (nK > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nK;
        
        fremrykTid();

        if (nK === BREDDE - 2) {
            spilTilstand.gameState = 'win';
            syncTilDb(true);
            flytterNu = false;
            return;
        }

        if (f.eventID && !f.eventFuldført) startEvent(f.eventID);
        else if (f.shopItems && f.shopItems.length > 0) spilTilstand.aktivShop = f.shopItems;
        
        syncTilDb(true);

        setTimeout(() => {
            flytterNu = false;
        }, 200); 
    }

    function flytHex(retning: string) {
        if (spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
        spilTilstand.retning = retning;
        const r = Math.floor(spilTilstand.spillerIndex / BREDDE);
        const k = spilTilstand.spillerIndex % BREDDE;
        let nI = spilTilstand.spillerIndex;
        const forskudt = r % 2 !== 0;

        if (retning === 'NW') nI = forskudt ? spilTilstand.spillerIndex - BREDDE : spilTilstand.spillerIndex - BREDDE - 1;
        else if (retning === 'NE') nI = forskudt ? spilTilstand.spillerIndex - BREDDE + 1 : spilTilstand.spillerIndex - BREDDE;
        else if (retning === 'W') nI = spilTilstand.spillerIndex - 1;
        else if (retning === 'E') nI = spilTilstand.spillerIndex + 1;
        else if (retning === 'SW') nI = forskudt ? spilTilstand.spillerIndex + BREDDE : spilTilstand.spillerIndex + BREDDE - 1;
        else if (retning === 'SE') nI = forskudt ? spilTilstand.spillerIndex + BREDDE + 1 : spilTilstand.spillerIndex + BREDDE;

        const nR = Math.floor(nI / BREDDE);
        const nK = nI % BREDDE;
        if (nI >= 0 && nI < BREDDE * HOEJDE && Math.abs(k - nK) <= 1 && Math.abs(r - nR) <= 1) udførBevægelse(nI);
    }

    function klikPåHex(nI: number) {
        if (spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
        if (nI === spilTilstand.spillerIndex) return;
        const naboer = hentNaboIndices(spilTilstand.spillerIndex);
        if (naboer.includes(nI)) udførBevægelse(nI);
    }

    function nulstilHukommelse() { if (browser) window.location.reload(); }

    async function genstartBane() {
        spilTilstand.gameState = 'select';
        spilTilstand.gitter = spilTilstand.gitter.map((f) => ({ ...f, gravet: false, udforsket: false, eventFuldført: false }));
        spilTilstand.valgtKarakter = null;
        spilTilstand.dag = 1;
        spilTilstand.fogX = 0;
        spilTilstand.mineKendteFelter = [];
        await supabase.from('spil_sessioner').update({ fog_x: 0, kort: spilTilstand.gitter }).eq('rum_kode', spilTilstand.rumKode);
        syncTilDb(true);
    }
    </script>

<Skaerme 
    {opretEllerDeltag} 
    {bekræftValg} 
    {genstartBane} 
    {nulstilHukommelse} 
    {lokaleScores} 
/>

<div class="game-container">
    <div class="camera" role="presentation"
        onwheel={(e) => cam.håndterZoom(e, !!eventState.aktivt || !!spilTilstand.aktivShop)}
        onpointerdown={(e) => cam.startTræk(e, !!eventState.aktivt || !!spilTilstand.aktivShop)}
        onpointermove={cam.træk}
        onpointerup={cam.stopTræk}
        onpointercancel={cam.stopTræk}
        style="cursor: {cam.isDragging ? 'grabbing' : 'grab'}; touch-action: none;"
    >
        <div class="map" style={kameraStyle}>
            {#each spilTilstand.gitter as felt, i (i)}
                {@const r = Math.floor(i / BREDDE)}
                {@const k = i % BREDDE}
                {@const x = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0)}
                {@const y = r * ROW_H}
                {@const erJegHer = spilTilstand.spillerIndex === i}
                {@const erUdforsket = spilTilstand.mineKendteFelter.includes(i)}
                {@const erOpslugt = x <= spilTilstand.fogX}
                {@const baggrund = !erUdforsket ? '/tiles/taage.webp' : erOpslugt ? `/tiles/${felt.biome}_taage.webp` : `/tiles/${felt.biome}.webp`}

                <div class="hex" class:active={erJegHer} class:unexplored={!erUdforsket}
                    onclick={() => klikPåHex(i)}
                    onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                    role="button" tabindex="0"
                    style="background-image: url('{baggrund}'); left: {x}px; top: {y}px;"
                >
                    <div class="inner" class:opslugt={erOpslugt}>
                        {#if erUdforsket && !felt.gravet}
                            {#if harDetektor && (felt.skjultGuld ?? 0) > 0}
                                <img src="/tiles/guldtaage.webp" alt="Guld spor" style="position: absolute; scale: {0.3 + (felt.skjultGuld ?? 0) / 100};" />
                            {/if}
                            {#if harKvist && (felt.skjultLiv ?? 0) > 0}
                                <img src="/tiles/livtaage.webp" alt="Liv spor" style="position: absolute; scale: {0.3 + (felt.skjultLiv ?? 0) / 50};" />
                            {/if}
                        {/if}
                        
                        {#if felt.gravet}
                            <img src="/tiles/udgravning.webp" alt="Udgravet" class="dug-image" />
                        {/if}
                        
                        {#if erUdforsket && felt.eventID && felt.eventID !== 'campfire' && !felt.eventFuldført}
                            <img src="/tiles/event.png" alt="Event" class="event-crystal" />
                        {/if}
                        
{#each Object.entries(spilTilstand.alleSpillere) as [navn, modstander] (navn)}                            {#if navn !== spilTilstand.spillerNavn && modstander.index === i && !modstander.isDead}
                                <span class="modstander-icon" style="position: absolute; display: inline-flex; justify-content: center; z-index: 10;">
                                    <img src={modstander.ikon || 'player.webp'} alt={navn} style="height: 45px; opacity: 0.8;" />
                                </span>
                            {/if}
                        {/each}
                        
                        {#if erJegHer}
                            <span class="player-icon" style="position: relative; display: inline-flex; justify-content: center; z-index: 11;">
                                <img src={spilTilstand.valgtKarakter?.ikon} alt="Spiller" style="height: 58px;" />
                            </span>
                        {/if}

                        {#each spilTilstand.aktiveTal || [] as tal (tal.id)}
                            {#if tal.feltIndex === i}
                                <div class="flydende-tal {tal.tekst.startsWith('-') ? 'skade' : 'gevinst'} {tal.type}" 
                                     style="margin-left: {tal.offsetX || 0}px; margin-bottom: {tal.offsetY || 0}px;">
                                    {tal.tekst}
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

{#if eventState.aktivt}
    <EventModal lukEvent={lukEventOgShop} />
{/if}

{#if spilTilstand.aktivShop && spilTilstand.aktivShop.length > 0}
    <ShopModal lukShop={lukEventOgShop} />
{/if}

{#if spilTilstand.venteSpilAktiv}
    <VenteModal kanSpilleIgen={spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN} />
{/if}

<style>
    .island-overskrift { position: absolute; bottom: 190px; left: calc(50% - 230px); font-family: 'Cinzel', serif; font-size: 1.6rem; color: white; letter-spacing: 4px; }
    .game-container { width: 100vw; height: 100vh; overflow: hidden; }
    .camera { width: 100%; height: 100%; background: #050505; }
    .map { position: absolute; width: 4800px; height: 1640px; }
    .hex { position: absolute; width: 96px; height: 110px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background-size: cover; }
    .hex.unexplored { filter: grayscale(100%) brightness(20%); }
    .inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .event-crystal { height: 65px; animation: floatAndGlow 3s infinite; }
    @keyframes floatAndGlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

.flydende-tal {
    position: absolute;
    bottom: 45px;
    font-family: 'Cinzel', serif;
    font-size: 1rem; /* Reduceret fra 1.4rem */
    font-weight: bold;
    color: #ffffff;
    pointer-events: none;
    white-space: nowrap;
    text-shadow: 2px 2px 4px #000, -1px -1px 2px #000;
    animation: svaevOp 3s ease-out forwards;
    z-index: 50;
}
@keyframes svaevOp {
    0% { opacity: 0; transform: translateY(0) scale(0.8); }
    10% { opacity: 1; transform: translateY(-5px) scale(1.1); }
    80% { opacity: 1; transform: translateY(-15px) scale(1); }
    100% { opacity: 0; transform: translateY(-20px) scale(0.9); }
}

.dug-image {
    position: absolute;
    width: 90px;
    height: 52px;
    top: 10;
    left: 2;
    pointer-events: none;
    z-index: 0;
}

.opslugt {
    opacity: 0.35;
    filter: brightness(40%) grayscale(75%);
    pointer-events: none;
    transition: all 0.8s ease-in-out;
}

</style>