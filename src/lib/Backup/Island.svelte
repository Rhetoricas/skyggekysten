<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { hentHighscores, gemHighscore, syncTilDb, startRealtime, stopRealtime } from '$lib/netvaerk';
    import { hvil, hentNaboIndices, afslørOmraade, initialiserGitter, tilfoejTilRygsæk, regnHexAfstand } from '$lib/spilmotor';
    import { grav } from '$lib/undergrund.svelte';
    import { tjekOverlevelse, fremrykTid, erSpillerITaagen } from '$lib/overlevelse.svelte';
    import { eventState, startEvent, lukEvent as motorLukEvent } from '$lib/eventMotor.svelte';
    
    import {
        BREDDE,
        HOEJDE,
        HEX_W,
        ROW_H,
        tilgaengeligeKarakterer,
        biomeTerraenCost
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
    let harDetektor = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'metaldetektor') ?? false);
    let harKvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'soegekvist') ?? false); 
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
            if (!document.hidden && spilTilstand.gameState === 'play') {
                cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            }
        };
        document.addEventListener('visibilitychange', tjekFokus);
        return () => document.removeEventListener('visibilitychange', tjekFokus);
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

    let kbdRef: (ev: KeyboardEvent) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let alarmKanal: any;

    async function opretEllerDeltag() {
        let rentNavn = spilTilstand.spillerNavn.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = spilTilstand.rumKode.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Udfyld venligst navn og kode.';
            return;
        }

        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = 'Forbinder...';

        const { data } = await supabase.from('spil_sessioner').select('*').eq('rum_kode', spilTilstand.rumKode).single();
        if (data) {
            spilTilstand.gitter = data.kort;
            spilTilstand.alleSpillere = data.spillere || {};
            spilTilstand.fogX = data.fog_x || 0;
            spilTilstand.erHost = false;

            if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
                const eksisterende = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
                spilTilstand.spillerIndex = eksisterende.index;
                spilTilstand.livspoint = eksisterende.hp;
                spilTilstand.guldTotal = eksisterende.guld;
                spilTilstand.maxKolonne = eksisterende.kolonne;
                spilTilstand.dag = eksisterende.dag || 1;
                spilTilstand.retning = eksisterende.retning || 'S';
                spilTilstand.valgtKarakter = tilgaengeligeKarakterer.find((k) => k.ikon === eksisterende.ikon) || null;
                spilTilstand.nuvaerendeEnergi = eksisterende.energi ?? (spilTilstand.valgtKarakter?.baseEnergi || 0);
                spilTilstand.mitUdstyr = eksisterende.mitUdstyr || [];
                spilTilstand.mineKendteFelter = eksisterende.kendteFelter || [];

                afslørOmraade(spilTilstand.spillerIndex);
                startRealtime();

                if (eksisterende.isDead) spilTilstand.gameState = 'dead';
                else if (eksisterende.isWinner) spilTilstand.gameState = 'win';
                else {
                    opretTastatur();
                    spilTilstand.gameState = 'play';
                    cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
                }
            } else {
                spilTilstand.gameState = 'select';
                startRealtime();
            }
        } else {
            spilTilstand.erHost = true;
            initialiserGitter();
            startRealtime();
            spilTilstand.gameState = 'select';
        }
    }

    function opretTastatur() {
        if (kbdRef && browser) window.removeEventListener('keydown', kbdRef);
        kbdRef = (ev: KeyboardEvent) => {
            if (ev.repeat || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
            const key = ev.key.toLowerCase();
            if (key === 'g') grav();
            else if (key === 'h') hvil();
            else if (key === 'f') cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            else if (key === 'q') flytHex('NW');
            else if (key === 'e') flytHex('NE');
            else if (key === 'a') flytHex('W');
            else if (key === 'd') flytHex('E');
            else if (key === 'z') flytHex('SW');
            else if (key === 'c') flytHex('SE');
        };
        if (browser) window.addEventListener('keydown', kbdRef);
    }

    onMount(() => {
        opdaterOgGemHighscore();
        alarmKanal = supabase
            .channel(spilTilstand.rumKode)
            .on('broadcast', { event: 'alarm' }, ({ payload }) => {
                if (payload.senderNavn === spilTilstand.spillerNavn) return;
                if (spilTilstand.alleSpillere[payload.senderNavn]) {
                    spilTilstand.alleSpillere[payload.senderNavn].activeAlarm = true;
                }
            })
            .subscribe();
    });

    onDestroy(() => {
        if (kbdRef && browser) window.removeEventListener('keydown', kbdRef);
        stopRealtime();
        if (alarmKanal) supabase.removeChannel(alarmKanal);
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
        spilTilstand.mitUdstyr = [];
        for (const itemId of karakter.startUdstyr) { tilfoejTilRygsæk(itemId, 1); }

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
        const spillere = Object.values(spilTilstand.alleSpillere);
        if (spillere.length <= 1) return spilTilstand.dag;
        const aktive = spillere.filter(s => !s.isDead && !s.isWinner);
        if (aktive.length === 0) return spilTilstand.dag;
        return Math.min(...aktive.map(s => s.dag || 1));
    }

    function udførBevægelse(nI: number) {
        if (flytterNu || !spilTilstand.valgtKarakter) return;
        flytterNu = true;

        if (spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN) {
            spilTilstand.logBesked = 'Vent på de andre.';
            spilTilstand.venteSpilAktiv = true;
            flytterNu = false;
            return;
        }

        const f = spilTilstand.gitter[nI];
        if (!f) { flytterNu = false; return; }
        
        if (f.biome === 'hav') {
            spilTilstand.livspoint -= 30;
        } else {
            const cost = Math.round(spilTilstand.valgtKarakter.moveCost * (biomeTerraenCost[f.biome] || 1));
            spilTilstand.nuvaerendeEnergi -= erITågen ? cost * 2 : cost;
        }

        spilTilstand.spillerIndex = nI;
        cam.foelgSpiller(nI, BREDDE, HEX_W, ROW_H);
        afslørOmraade(nI, f.biome === 'bjerg' ? 2 : 1);
        
        if ((nI % BREDDE) > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nI % BREDDE;
        fremrykTid();

        if ((nI % BREDDE) === BREDDE - 2) {
            spilTilstand.gameState = 'win';
        } else {
            if (f.eventID && !f.eventFuldført) startEvent(f.eventID);
            else if (f.shopItems && f.shopItems.length > 0) spilTilstand.aktivShop = f.shopItems;
        }

        syncTilDb(true);
        setTimeout(() => flytterNu = false, 200);
    }

    function flytHex(retning: string) {
        if (spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
        const r = Math.floor(spilTilstand.spillerIndex / BREDDE);
        const k = spilTilstand.spillerIndex % BREDDE;
        const forskudt = r % 2 !== 0;
        let nI = spilTilstand.spillerIndex;

        if (retning === 'NW') nI = forskudt ? nI - BREDDE : nI - BREDDE - 1;
        else if (retning === 'NE') nI = forskudt ? nI - BREDDE + 1 : nI - BREDDE;
        else if (retning === 'W') nI -= 1;
        else if (retning === 'E') nI += 1;
        else if (retning === 'SW') nI = forskudt ? nI + BREDDE : nI + BREDDE - 1;
        else if (retning === 'SE') nI = forskudt ? nI + BREDDE + 1 : nI + BREDDE;

        const nR = Math.floor(nI / BREDDE);
        const nK = nI % BREDDE;
        if (nI >= 0 && nI < BREDDE * HOEJDE && Math.abs(k - nK) <= 1 && Math.abs(r - nR) <= 1) udførBevægelse(nI);
    }

    function klikPåHex(nI: number) {
        if (spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
        if (hentNaboIndices(spilTilstand.spillerIndex).includes(nI)) udførBevægelse(nI);
    }
</script>

<Skaerme 
    {opretEllerDeltag} 
    {bekræftValg} 
    genstartBane={async () => { spilTilstand.gameState = 'select'; await syncTilDb(true); }} 
    nulstilHukommelse={() => browser && window.location.reload()} 
    {lokaleScores} 
/>

<div class="game-container">
    <div class="camera" role="presentation"
        onwheel={(e) => cam.håndterZoom(e, !!eventState.aktivt || !!spilTilstand.aktivShop)}
        onpointerdown={(e) => cam.startTræk(e, !!eventState.aktivt || !!spilTilstand.aktivShop)}
        onpointermove={cam.træk}
        onpointerup={cam.stopTræk}
        style="cursor: {cam.isDragging ? 'grabbing' : 'grab'}; touch-action: none;"
    >
        <div class="map" style={kameraStyle}>
            {#each spilTilstand.gitter as felt, i (i)}
                {@const r = Math.floor(i / BREDDE)}
                {@const k = i % BREDDE}
                {@const x = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0)}
                {@const y = r * ROW_H}
                {@const erUdforsket = spilTilstand.mineKendteFelter.includes(i)}
                {@const erOpslugt = x <= spilTilstand.fogX}
                {@const baggrund = !erUdforsket ? '/tiles/taage.webp' : erOpslugt ? `/tiles/${felt.biome}_taage.webp` : `/tiles/${felt.biome}.webp`}

                <div class="hex" class:active={spilTilstand.spillerIndex === i} class:unexplored={!erUdforsket}
                    onclick={() => klikPåHex(i)}
                    onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                    role="button" tabindex="0"
                    style="background-image: url('{baggrund}'); left: {x}px; top: {y}px;"
                >
                    <div class="inner" class:opslugt={erOpslugt}>
                        {#if erUdforsket && !felt.gravet}
                            {#if harDetektor && (felt.skjultGuld ?? 0) > 0}
                                <img src="/tiles/guldtaage.webp" alt="" class="mist-icon" style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultGuld ?? 0) / 100});" />
                            {/if}
                            {#if harKvist && (felt.skjultLiv ?? 0) > 0}
                                <img src="/tiles/livtaage.webp" alt="" class="mist-icon" style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultLiv ?? 0) / 50});" />
                            {/if}
                        {/if}
                        
{#if erUdforsket && felt.gravet}
    <img src="/tiles/udgravning.webp" alt="" class="dug-image" />
{/if}
                        
                        {#if erUdforsket && felt.eventID && felt.eventID !== 'campfire' && !felt.eventFuldført}
                            <img src="/tiles/event.png" alt="" class="event-crystal" />
                        {/if}
                        
                        {#each Object.entries(spilTilstand.alleSpillere) as [navn, mod] (navn)}
                            {#if navn !== spilTilstand.spillerNavn && mod.index === i && !mod.isDead}
                                {@const afstand = regnHexAfstand(spilTilstand.spillerIndex, mod.index, BREDDE)}
                                {@const synlig = afstand <= (spilTilstand.valgtKarakter?.synsRadius || 1)}
                                <span class="modstander-icon" class:alarm-aktiv={mod.activeAlarm && !synlig} class:skjult-lyd={!synlig && !mod.activeAlarm}>
                                    <img src={synlig ? (mod.ikon || '/tiles/player.webp') : '/tiles/player.webp'} alt="" style="width: {synlig ? '45px' : '70px'};" />
                                </span>
                            {/if}
                        {/each}
                        
                        {#if spilTilstand.spillerIndex === i}
                            <span class="player-icon" style="position: relative; display: inline-flex; justify-content: center; z-index: 11;">
                                <img src={spilTilstand.valgtKarakter?.ikon} alt="" style="height: 58px;" />
                            </span>
                        {/if}

                        {#each spilTilstand.aktiveTal || [] as tal (tal.id)}
                            {#if tal.feltIndex === i}
                                <div class="flydende-tal {tal.tekst.startsWith('-') ? 'skade' : 'gevinst'}" 
                                     style="margin-left: {tal.offsetX}px; margin-bottom: {tal.offsetY}px;">
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

<div class="interface-overlay">
    {#if ['by', 'marked'].includes(spilTilstand.gitter[spilTilstand.spillerIndex]?.biome)}
        <button class="shop-trigger-btn" onclick={() => spilTilstand.aktivShop = spilTilstand.gitter[spilTilstand.spillerIndex].shopItems || ['skovl', 'eliksir', 'kikkert']}>
            Handel
        </button>
    {/if}
</div>

{#if eventState.aktivt} <EventModal lukEvent={lukEventOgShop} /> {/if}
{#if spilTilstand.aktivShop} <ShopModal lukShop={lukEventOgShop} /> {/if}
{#if spilTilstand.venteSpilAktiv} <VenteModal kanSpilleIgen={spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN} /> {/if}

<style>
    .game-container { width: 100vw; height: 100vh; overflow: hidden; background: #000; }
    .camera { width: 100%; height: 100%; }
    .map { position: absolute; width: 4800px; height: 1640px; }
    .hex { 
        position: absolute; width: 96px; height: 110px; 
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); 
        background-size: cover; 
    }
    .hex.unexplored { filter: grayscale(100%) brightness(15%); }
    .inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    
    .mist-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        width: 50px;
        z-index: 5;
    }

    .dug-image {
        position: absolute;
        width: 90px;
        height: 52px;
        top: 58%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 2;
    }

    .event-crystal { height: 60px; animation: float 3s infinite ease-in-out; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

    .modstander-icon { position: absolute; top: 10px; z-index: 10; display: flex; justify-content: center; width: 100%; }
    .skjult-lyd img { opacity: 1; animation: whisper 2s infinite alternate; }
    .alarm-aktiv img { animation: alarmPuls 0.8s infinite alternate ease-in-out; }

    @keyframes alarmPuls {
        0% { transform: scale(1); filter: drop-shadow(0 0 2px white); }
        100% { transform: scale(1.1); filter: drop-shadow(0 0 10px orange) brightness(1.2); }
    }
    @keyframes whisper { 0% { opacity: 0.2; } 100% { opacity: 0.5; } }

    .flydende-tal {
        position: absolute; bottom: 50px; font-family: serif; font-weight: bold;
        animation: rise 2.5s forwards; pointer-events: none; z-index: 100;
    }
    @keyframes rise { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-30px); } }

    .opslugt { opacity: 0.3; filter: grayscale(1) brightness(0.5); }

    .interface-overlay { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 150; }
    .shop-trigger-btn { 
        background: #2a4a2a; color: white; border: 1px solid gold; 
        padding: 10px 20px; cursor: pointer; border-radius: 4px;
    }

    
</style>