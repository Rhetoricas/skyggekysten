<script lang="ts">
    // Island.svelte
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import type { RealtimeChannel } from '@supabase/supabase-js';
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
        biomeTerraenCost,
        itemDB
    } from '$lib/spildata';
    import type { Karakter, Biome } from '$lib/types';

    import Skaerme from './Skaerme.svelte';
    import ShopModal from '$lib/ShopModal.svelte';
    import EventModal from '$lib/EventModal.svelte';
    import VenteModal from '$lib/VenteModal.svelte';
    import BottomUI from './BottomUI.svelte';

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
    let alarmKanal: RealtimeChannel | null = null;

    function preloadFiler() {
        const standardBiomer = ['mark', 'eng', 'skov', 'bjerg', 'hule', 'ritual', 'ruin', 'bandit', 'gen', 'blodskov', 'by', 'hav', 'krystal', 'marked', 'slagmark'];
        const billederTilPreload = [
            '/tiles/taage.webp', '/tiles/byshop.webp', '/tiles/markedshop.webp', '/tiles/udgravning.webp',
            '/tiles/event.png', '/tiles/campfire.webp', '/events/ev_campfire.webp', '/tiles/guldtaage.webp', '/tiles/livtaage.webp',
            '/inventory/hp.webp', '/inventory/guld.webp', '/tiles/player.webp', '/tiles/energi_slukket.webp', '/tiles/energi_taendt.webp', '/tiles/blodofring.webp'
        ];

        standardBiomer.forEach(biome => {
            billederTilPreload.push(`/tiles/${biome}.webp`);
            billederTilPreload.push(`/tiles/${biome}_taage.webp`);
        });

        Object.values(itemDB).forEach(item => billederTilPreload.push(item.billede));

        billederTilPreload.forEach(sti => {
            const billede = new Image();
            billede.src = sti;
        });
    }

    async function opretEllerDeltag() {
        let rentNavn = spilTilstand.spillerNavn.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = spilTilstand.rumKode.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Udfyld navn og kode.';
            return;
        }

        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = 'Forbinder dig til øen.';
        
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
                const spillereArr = Object.values(spilTilstand.alleSpillere);
                const maxDag = spillereArr.length > 0 ? Math.max(...spillereArr.map(s => s.dag || 1)) : 1;

                if (maxDag > 5) {
                    spilTilstand.statusBesked = `Du er for sent på den. Tågen har allerede opslugt kysten (Dag ${maxDag}).`;
                    return;
                }

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
            const tast = ev.key.toLowerCase();
            if (tast === 'g') grav();
            else if (tast === 'h') hvil();
            else if (tast === 'f') cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            else if (tast === 'q') flytHex('NW');
            else if (tast === 'e') flytHex('NE');
            else if (tast === 'a') flytHex('W');
            else if (tast === 'd') flytHex('E');
            else if (tast === 'z') flytHex('SW');
            else if (tast === 'c') flytHex('SE');
        };
        if (browser) window.addEventListener('keydown', kbdRef);
    }

    onMount(() => {
        preloadFiler();
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
        spilTilstand.dag = 1;
        spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];

        const muligeStartFelter = [];
        for (let raekke = 1; raekke < HOEJDE - 1; raekke++) {
            if (spilTilstand.gitter[raekke * BREDDE + 1] && spilTilstand.gitter[raekke * BREDDE + 1].biome !== 'hav') {
                muligeStartFelter.push(raekke * BREDDE + 1);
            }
        }
        
        if (muligeStartFelter.length > 0) {
            spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
        } else {
            spilTilstand.spillerIndex = BREDDE + 1;
        }
        
        spilTilstand.retning = 'E';
        afslørOmraade(spilTilstand.spillerIndex);
        
        for (const itemId of karakter.startUdstyr) { tilfoejTilRygsæk(itemId, 1); }

        if (spilTilstand.erHost) {
            const { data } = await supabase.from('spil_sessioner').select('rum_kode').eq('rum_kode', spilTilstand.rumKode).maybeSingle();
            if (!data) {
                await supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: spilTilstand.gitter,
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0
                }]);
            }
        }
        
        await syncTilDb();
        opretTastatur();
        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        spilTilstand.gameState = 'play';
    }

    function lukEventOgShop() {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (felt && eventState.aktivt && felt.eventID !== 'campfire') felt.eventFuldført = true;
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

    function udførBevægelse(nytIndeks: number) {
        if (flytterNu || !spilTilstand.valgtKarakter) return;
        flytterNu = true;

        if (spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN) {
            spilTilstand.logBesked = 'Du må vente på de andre spillere.';
            spilTilstand.venteSpilAktiv = true;
            flytterNu = false;
            return;
        }

        const felt = spilTilstand.gitter[nytIndeks];
        if (!felt) { flytterNu = false; return; }
        
        if (felt.biome === 'hav') {
            spilTilstand.livspoint -= 30;
        } else {
            const pris = Math.round(spilTilstand.valgtKarakter.moveCost * (biomeTerraenCost[felt.biome as Biome] || 1));
            spilTilstand.nuvaerendeEnergi -= erITågen ? pris * 2 : pris;
        }

        spilTilstand.spillerIndex = nytIndeks;
        cam.foelgSpiller(nytIndeks, BREDDE, HEX_W, ROW_H);
        afslørOmraade(nytIndeks, felt.biome === 'bjerg' ? 2 : 1);
        
        if ((nytIndeks % BREDDE) > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nytIndeks % BREDDE;
        fremrykTid();
        
        if ((nytIndeks % BREDDE) === BREDDE - 2) {
            spilTilstand.gameState = 'win';
        } else {
            if (felt.eventID && !felt.eventFuldført) startEvent(felt.eventID);
            else if (felt.shopItems && felt.shopItems.length > 0) spilTilstand.aktivShop = felt.shopItems;
        }

        syncTilDb(true);
        setTimeout(() => flytterNu = false, 200);
    }

    function flytHex(retning: string) {
        if (spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
        
        const raekke = Math.floor(spilTilstand.spillerIndex / BREDDE);
        const kolonne = spilTilstand.spillerIndex % BREDDE;
        const forskudt = raekke % 2 !== 0;
        let nytIndeks = spilTilstand.spillerIndex;

        if (retning === 'NW') nytIndeks = forskudt ? nytIndeks - BREDDE : nytIndeks - BREDDE - 1;
        else if (retning === 'NE') nytIndeks = forskudt ? nytIndeks - BREDDE + 1 : nytIndeks - BREDDE;
        else if (retning === 'W') nytIndeks -= 1;
        else if (retning === 'E') nytIndeks += 1;
        else if (retning === 'SW') nytIndeks = forskudt ? nytIndeks + BREDDE : nytIndeks + BREDDE - 1;
        else if (retning === 'SE') nytIndeks = forskudt ? nytIndeks + BREDDE + 1 : nytIndeks + BREDDE;

        const nyRaekke = Math.floor(nytIndeks / BREDDE);
        const nyKolonne = nytIndeks % BREDDE;
        if (nytIndeks >= 0 && nytIndeks < BREDDE * HOEJDE && Math.abs(kolonne - nyKolonne) <= 1 && Math.abs(raekke - nyRaekke) <= 1) udførBevægelse(nytIndeks);
    }

    function klikPåHex(nytIndeks: number) {
        if (spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
        if (hentNaboIndices(spilTilstand.spillerIndex).includes(nytIndeks)) udførBevægelse(nytIndeks);
    }
</script>

{#if spilTilstand.gameState === 'play'}
    <BottomUI />
{/if}

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
                {@const raekke = Math.floor(i / BREDDE)}
                {@const kolonne = i % BREDDE}
                {@const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0)}
                {@const posY = raekke * ROW_H}
                {@const erUdforsket = spilTilstand.mineKendteFelter.includes(i)}
                {@const erOpslugt = posX <= spilTilstand.fogX}
                {@const baggrund = !erUdforsket ? '/tiles/taage.webp' : erOpslugt ? `/tiles/${felt.biome}_taage.webp` : `/tiles/${felt.biome}.webp`}

                <div class="hex" class:active={spilTilstand.spillerIndex === i} class:unexplored={!erUdforsket}
                    onclick={() => klikPåHex(i)}
                    onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                    role="button" tabindex="0"
                    style="background-image: url('{baggrund}'); left: {posX}px; top: {posY}px;"
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
                        
                        {#if erUdforsket && felt.eventID && !felt.eventFuldført}
                            {#if felt.eventID === 'campfire'}
                                <img src="/tiles/campfire.webp" alt="" class="campfire-icon" />
                            {:else}
                                <img src="/tiles/event.png" alt="" class="event-crystal" />
                            {/if}
                        {/if}

                        {#if erUdforsket && felt.shopItems && felt.shopItems.length > 0}
                            <img src="/tiles/{felt.biome === 'by' ? 'byshop.webp' : 'markedshop.webp'}" alt="" class="shop-icon" />
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
                            <span class="player-icon" style="position: relative; display: inline-flex; justify-content: center; z-index: 20;">
                                <img src={spilTilstand.valgtKarakter?.ikon} alt="" style="height: 58px;" />
                            </span>
                        {/if}

                        {#each spilTilstand.aktiveTal || [] as tal (tal.id)}
                            {#if tal.feltIndex === i}
                                <div class="flydende-tal {tal.tekst.startsWith('-') ? 'skade' : 'gevinst'}" style="margin-left: {tal.offsetX}px; margin-bottom: {tal.offsetY}px;">
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

{#if eventState.aktivt} <EventModal lukEvent={lukEventOgShop} /> {/if}
{#if spilTilstand.aktivShop} <ShopModal lukShop={lukEventOgShop} /> {/if}
{#if spilTilstand.venteSpilAktiv} <VenteModal kanSpilleIgen={spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN} /> {/if}

<style>
    .game-container { 
        width: 100vw; height: 100vh; overflow: hidden; background: #000; 
    }
    .camera { 
        width: 100%; height: 100%;
    }
    .map { 
        position: absolute; width: 4800px; height: 1640px;
    }
    .hex { 
        position: absolute; width: 96px; height: 110px;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); 
        background-size: cover;
    }
    .hex.unexplored { filter: grayscale(100%) brightness(15%); }
    .inner { 
        position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; 
    }
    .mist-icon {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        pointer-events: none; width: 50px; z-index: 12;
    }
    .dug-image {
        position: absolute; width: 90px; height: 52px; top: 58%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 10;
    }
    .event-crystal { 
        height: 60px; animation: float 3s infinite ease-in-out; z-index: 15; position: relative;
    }
    .campfire-icon {
        position: absolute; width: 50px; height: 50px; top: 50%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 14;
    }
    .shop-icon {
        position: absolute; width: 60px; height: 60px; top: 30%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 14;
        filter: drop-shadow(0 0 15px rgba(255, 165, 0, 0.9)) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    @keyframes float { 
        0%, 100% { transform: translateY(0); } 
        50% { transform: translateY(-5px); } 
    }
    .modstander-icon { 
        position: absolute; top: 10px; z-index: 16; display: flex; justify-content: center; width: 100%; 
    }
    .skjult-lyd img { 
        opacity: 1; animation: whisper 2s infinite alternate;
    }
    .alarm-aktiv img { 
        animation: alarmPuls 0.8s infinite alternate ease-in-out;
    }
    @keyframes alarmPuls {
        0% { transform: scale(1); filter: drop-shadow(0 0 2px white); }
        100% { transform: scale(1.1); filter: drop-shadow(0 0 10px orange) brightness(1.2); }
    }
    @keyframes whisper { 
        0% { opacity: 0.2; } 
        100% { opacity: 0.5; } 
    }
    .flydende-tal {
        position: absolute; bottom: 50px; font-family: serif; font-weight: bold;
        animation: rise 2.5s forwards; pointer-events: none; z-index: 100;
    }
    @keyframes rise { 
        0% { opacity: 0; transform: translateY(0); } 
        20% { opacity: 1; } 
        100% { opacity: 0; transform: translateY(-30px); } 
    }
    .opslugt { 
        opacity: 0.8; filter: grayscale(0.8) brightness(0.6);
    }
</style>