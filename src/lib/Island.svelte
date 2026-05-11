<script lang="ts">
    import { onMount, onDestroy, untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { hentHighscores, gemHighscore, syncTilDb, startRealtime, stopRealtime, hentGlobalTopTi, broadcastFelt } from '$lib/netvaerk';
    import { hvil, hentNaboIndices, afslørOmraade, initialiserGitter, tilfoejTilRygsæk, regnHexAfstand, tjekMiljoeSlitage, udfoerPortalTeleport, nulstilKort, rystSkaerm, udloesOversvoemmelse, udloesJordskaelv } from '$lib/spilmotor';
    import { grav } from '$lib/undergrund.svelte';
    import { fremrykTid, erSpillerITaagen, tagSkadeOgTjekDød } from '$lib/overlevelse.svelte';    
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
    import type { Karakter, Biome, SpillerData } from '$lib/types';
    import { eventBibliotek } from '$lib/eventBibliotek';

    import Skaerme from './Skaerme.svelte';
    import ShopModal from '$lib/ShopModal.svelte';
    import EventModal from '$lib/EventModal.svelte';
    import VenteModal from '$lib/VenteModal.svelte';
    import BottomUI from './BottomUI.svelte';

    const cam = skabKamera();
    const MAX_DAGE_FORAN = 5;

    let lokaleScores = $state<Array<{ navn: string; score: number; karakter?: string }>>([]);
    let globaleScores = $state<Array<{ spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);    
    
    let flytterNu = false;
    let sejlendeBaadIndex = $state<number | null>(null);
    let visDoedsLog = $state(false);
    let langsomtKamera = $state(false);
    
    let harDetektor = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'metaldetektor') ?? false);
    let harKvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'soegekvist') ?? false);
    let aktuelSynsRadius = $derived(Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));
    let erITågen = $derived(erSpillerITaagen());
    let rensedeLogLinjer = $derived(spilTilstand.logHistorik.filter(linje => linje.includes(' - ')));

    let harSkattekortAktivt = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'skattekort_aabent') ?? false);
    
    let glHp = $state(0);
    let glGuld = $state(0);
    let scoreErGemt = false;

    let bgMusik: HTMLAudioElement | null = null;
    
    onMount(() => {
        bgMusik = new Audio('/audio/ambient.mp3');
        bgMusik.loop = true;
        bgMusik.volume = 0.3;
    });

    $effect(() => {
        if (bgMusik) {
            if (spilTilstand.musikTaendt && spilTilstand.gameState === 'play') {
                bgMusik.play().catch(() => {});
            } else {
                bgMusik.pause();
                if (spilTilstand.gameState === 'win' || spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'win_map' || spilTilstand.gameState === 'dead_map') {
                    bgMusik.currentTime = 0;
                }
            }
        }
    });

    $effect(() => {
        const state = spilTilstand.gameState;
        
        untrack(() => {
            if (state === 'play') {
                scoreErGemt = false;
            } else if ((state === 'win' || state === 'dead' || state === 'win_map' || state === 'dead_map') && !scoreErGemt) {
                scoreErGemt = true;
                opdaterOgGemHighscore();
            }
        });
    });

    $effect(() => {
        const tjekFokus = () => {
            if (!document.hidden && spilTilstand.gameState === 'play' && spilTilstand.kameraFokus === null) {
                cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            }
        };
        document.addEventListener('visibilitychange', tjekFokus);
        return () => document.removeEventListener('visibilitychange', tjekFokus);
    });

    $effect(() => {
        const fokus = spilTilstand.kameraFokus;
        if (fokus !== null) {
            untrack(() => {
                langsomtKamera = true;
                cam.centrerPåHex(fokus, BREDDE, HEX_W, ROW_H);
                spilTilstand.kameraFokus = null;
                
                setTimeout(() => {
                    if (spilTilstand.gameState === 'play') {
                        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
                        setTimeout(() => langsomtKamera = false, 1500);
                    } else {
                        langsomtKamera = false;
                    }
                }, 3000); // Sat ned til 3 sekunder
            });
        }
    });

    $effect(() => {
        const aktueltIndex = spilTilstand.spillerIndex;
        if (spilTilstand.gameState === 'play' && spilTilstand.kameraFokus === null && !langsomtKamera) {
            untrack(() => {
                cam.foelgSpiller(aktueltIndex, BREDDE, HEX_W, ROW_H);
            });
        }
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
        transform: translate(calc(50vw - ${cam.x}px), calc(50dvh - ${cam.y}px)) scale(${cam.zoomLevel});
        transition: ${cam.isDragging ? 'none' : (langsomtKamera ? 'transform 1.5s ease-in-out' : 'transform 0.3s ease-out')};
        width: ${BREDDE * HEX_W + HEX_W}px;
        height: ${HOEJDE * ROW_H + ROW_H}px;
    `);

    let alarmKanal: RealtimeChannel | null = null;
    let preloadedEvents = new SvelteSet<string>();

    $effect(() => {
        if (spilTilstand.gameState !== 'play' || !spilTilstand.mineKendteFelter || !spilTilstand.gitter) return;
        
        for (const indeks of spilTilstand.mineKendteFelter) {
            const felt = spilTilstand.gitter[indeks];
            if (felt && felt.eventID && felt.eventID !== 'campfire' && !preloadedEvents.has(felt.eventID)) {
                preloadedEvents.add(felt.eventID);
                const evt = eventBibliotek[felt.eventID];
                if (evt) {
                    const sti = evt.billede || `/events/ev_${Array.isArray(evt.biome) ? evt.biome[0] : evt.biome}.webp`;
                    const img = new Image();
                    img.src = sti;
                }
            }
        }
    });

    function preloadFiler() {
        const standardBiomer = ['mark', 'eng', 'skov', 'bjerg', 'hule', 'ritual', 'ruin', 'bandit', 'blodskov', 'by', 'hav', 'krystal', 'marked', 'slagmark', 'meteor'];
        const billederTilPreload = [
            '/tiles/byshop.webp', '/tiles/markedshop.webp', '/tiles/udgravning.webp', '/tiles/empty_treasure.webp', '/tiles/treasuremark.webp',
            '/tiles/event.png', '/tiles/campfire.webp', '/events/ev_campfire.webp', '/tiles/guldtaage.webp', '/tiles/livtaage.webp',
            '/inventory/hp.webp', '/inventory/guld.webp', '/tiles/player.webp', '/tiles/energi_slukket.webp', '/tiles/energi_taendt.webp', '/tiles/blodofring.webp', '/tiles/baad.webp', '/tiles/gravsted.webp',
            '/tiles/wheat.webp', '/tiles/growingwheat.webp', '/tiles/brokenwheat.webp',
            '/tiles/beans.webp', '/tiles/growingbean.webp', '/tiles/brokenbean.webp', '/tiles/portal.webp', '/tiles/goldmine.webp',
            '/tiles/meteorsten.webp'
        ];

        standardBiomer.forEach(biome => {
            billederTilPreload.push(`/tiles/${biome}.webp`);
            billederTilPreload.push(`/tiles/${biome}_taage.webp`);
        });
        Object.values(itemDB).forEach(item => billederTilPreload.push(item.billede));
        tilgaengeligeKarakterer.forEach(karakter => billederTilPreload.push(karakter.ikon));

        billederTilPreload.forEach(sti => {
            const billede = new Image();
            billede.src = sti;
        });
    }

    function håndterTastatur(ev: KeyboardEvent) {
        if (ev.repeat || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play' || spilTilstand.venteSpilAktiv) return;
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

        const tast = ev.key.toLowerCase();
        if (tast === 'g') {
            grav();
        }
        else if (tast === 'h') hvil();
        else if (tast === 'f') {
            langsomtKamera = false;
            cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        }
        else if (tast === 'q') flytHex('NW');
        else if (tast === 'e') flytHex('NE');
        else if (tast === 'a') flytHex('W');
        else if (tast === 'd') flytHex('E');
        else if (tast === 'z') flytHex('SW');
        else if (tast === 'c') flytHex('SE');
        else if (tast === 'o') udloesOversvoemmelse(spilTilstand.spillerIndex);
        else if (tast === 'j') udloesJordskaelv(spilTilstand.spillerIndex);
        else if (tast === 'm') {
            const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
            if (felt.eventID === 'meteor_skat' && !felt.eventFuldført) {
                startEvent('meteor_skat');
            } else {
                felt.eventID = 'stjernekald';
                felt.eventFuldført = false;
                startEvent('stjernekald');
            }
        }
    }

    async function genstartBane() {
        const timeoutGraense = Date.now() - (5 * 60 * 1000);
        const aktiveSpillere = Object.values(spilTilstand.alleSpillere).filter((s: SpillerData) => {
            if (s.isDead || s.isWinner) return false;
            if (s.sidstAktiv && s.sidstAktiv > timeoutGraense) return true;
            return false;
        });

        if (aktiveSpillere.length > 0 && spilTilstand.rumKode) {
            alert('Du kan ikke genstarte øen for alle, mens der stadig er andre aktive spillere ude i tågen.');
            return;
        }

        spilTilstand.logHistorik = [];
        spilTilstand.logBesked = '';
        visDoedsLog = false;
        
        cam.nulstil();

        Object.keys(spilTilstand.alleSpillere).forEach(navn => {
            spilTilstand.alleSpillere[navn].isDead = false;
            spilTilstand.alleSpillere[navn].isWinner = false;
            spilTilstand.alleSpillere[navn].dag = 1;
            spilTilstand.alleSpillere[navn].harSkattekort = false;
        });

        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        
        nulstilKort();

        spilTilstand.gameState = 'select';
        await syncTilDb(true);
    }

    async function opretEllerDeltag() {
        let rentNavn = (spilTilstand.spillerNavn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = (spilTilstand.rumKode || '').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Udfyld navn og kode.';
            return;
        }

        let mitBrowserId = localStorage.getItem('taage_browser_id');
        if (!mitBrowserId) {
            mitBrowserId = Math.random().toString(36).substring(2);
            localStorage.setItem('taage_browser_id', mitBrowserId);
        }

        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = 'Forbinder dig til øen...';
        
        if (alarmKanal) supabase.removeChannel(alarmKanal);
        alarmKanal = supabase
            .channel(spilTilstand.rumKode)
            .on('broadcast', { event: 'alarm' }, ({ payload }) => {
                if (payload.senderNavn === spilTilstand.spillerNavn) return;
                if (spilTilstand.alleSpillere[payload.senderNavn]) {
                    spilTilstand.alleSpillere[payload.senderNavn].activeAlarm = true;
                }
            })
            .on('broadcast', { event: 'baal' }, ({ payload }) => {
                afslørOmraade(payload.centerIndex, payload.radius);
                syncTilDb(true);
            })
            .on('broadcast', { event: 'meteor' }, ({ payload }) => {
                rystSkaerm(1200);
                payload.ramteFelter.forEach((idx: number) => {
                    spilTilstand.gitter[idx] = {
                        ...spilTilstand.gitter[idx],
                        biome: 'meteor',
                        hasMeteorStone: true,
                        eventID: 'meteor_skat'
                    };
                });
                spilTilstand.gitter = [...spilTilstand.gitter];
            })
            .on('broadcast', { event: 'rystelse' }, ({ payload }) => {
                rystSkaerm(payload.varighed || 1500);
            })
            .subscribe();

        try {
            const { data, error } = await supabase.from('spil_sessioner').select('*').eq('rum_kode', spilTilstand.rumKode).maybeSingle();
            if (error) {
                console.error("Netværksfejl:", error);
                spilTilstand.statusBesked = 'Kunne ikke forbinde til øen.';
                return;
            }

            if (data) {
                spilTilstand.gitter = data.kort;
                spilTilstand.alleSpillere = data.spillere || {};
                spilTilstand.fogX = data.fog_x || 0;
                spilTilstand.erHost = false;
                
                const fundetNavn = Object.keys(spilTilstand.alleSpillere).find(n => n.toLowerCase() === rentNavn.toLowerCase());

                if (fundetNavn) {
                    const eksisterende = spilTilstand.alleSpillere[fundetNavn];
                    
                    if (!eksisterende.isDead && !eksisterende.isWinner && eksisterende.browserId && eksisterende.browserId !== mitBrowserId) {
                        spilTilstand.statusBesked = `Navnet '${fundetNavn}' er allerede i brug af en anden rejsende.`;
                        return;
                    }

                    spilTilstand.spillerNavn = fundetNavn;
                    spilTilstand.spillerIndex = eksisterende.index;
                    
                    spilTilstand.maxLivspoint = eksisterende.maxHp || 100;
                    spilTilstand.livspoint = eksisterende.hp;
                    
                    spilTilstand.guldTotal = eksisterende.guld;
                    spilTilstand.maxKolonne = eksisterende.kolonne;
                    spilTilstand.dag = eksisterende.dag || 1;
                    spilTilstand.retning = eksisterende.retning || 'S';
                    spilTilstand.valgtKarakter = tilgaengeligeKarakterer.find((k) => k.ikon === eksisterende.ikon) || null;
                    spilTilstand.nuvaerendeEnergi = eksisterende.energi ?? (spilTilstand.valgtKarakter?.baseEnergi || 0);
                    spilTilstand.mitUdstyr = eksisterende.mitUdstyr || [];
                    spilTilstand.mineKendteFelter = eksisterende.kendteFelter || [];

                    afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
                    startRealtime();
                    
                    if (eksisterende.isDead || eksisterende.isWinner) {
                        spilTilstand.gameState = eksisterende.isWinner ? 'win_map' : 'dead_map';
                        spilTilstand.statusBesked = eksisterende.isWinner ? 'Du overlevede rædslen.' : 'Du bukkede under for tågen.';
                    } else {
                        spilTilstand.gameState = 'play';
                        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
                    }
                } else {
                    const spillereArr = Object.values(spilTilstand.alleSpillere);
                    const maxDag = spillereArr.length > 0 ? Math.max(...spillereArr.map((s: SpillerData) => s.dag || 1)) : 1;

                    if (maxDag > 5) {
                        spilTilstand.statusBesked = `Du er for sent på den. Tågen har opslugt kysten (Dag ${maxDag}).`;
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
        } catch (err) {
            console.error("Motorfejl:", err);
            spilTilstand.statusBesked = "En intern fejl spærrede vejen.";
        }
    }

    onMount(() => {
        preloadFiler();
        (async () => {
            lokaleScores = await hentHighscores();
            globaleScores = await hentGlobalTopTi();
        })();
    });

    onDestroy(() => {
        stopRealtime();
        if (alarmKanal) supabase.removeChannel(alarmKanal);
    });

    async function opdaterOgGemHighscore() {
        const winBonus = (spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map') ? 1000 : 0;
        const fremdriftPoint = spilTilstand.maxKolonne * 1;
        
        const udforskningPoint = spilTilstand.mineKendteFelter.length * 2;
        const minePoint = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length * 100;

        spilTilstand.samletScore = Math.floor(
            (spilTilstand.guldTotal + fremdriftPoint + udforskningPoint + minePoint + winBonus) *
                (1 + Math.max(0, spilTilstand.livspoint) / 1000)
        );
        
        await gemHighscore();
        lokaleScores = await hentHighscores();
        globaleScores = await hentGlobalTopTi();
    }

    async function bekræftValg(karakter: Karakter) {
        spilTilstand.valgtKarakter = karakter;
        spilTilstand.maxLivspoint = karakter.startHp || 100;
        spilTilstand.livspoint = karakter.startHp;
        
        spilTilstand.guldTotal = karakter.startGuld;
        spilTilstand.maxKolonne = 1;
        spilTilstand.dag = 1;
        spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];
        
        spilTilstand.logHistorik = []; 

        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].dag = 1; 
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].besoegteMiner = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].harSkattekort = false;
        }

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
        for (const itemId of karakter.startUdstyr) { tilfoejTilRygsæk(itemId, 1); }
        
        if (!spilTilstand.historik) spilTilstand.historik = [];
        spilTilstand.historik.push(spilTilstand.spillerIndex);

        afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
        
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
        
        await syncTilDb(true);
        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        spilTilstand.gameState = 'play';
        spilTilstand.logBesked = "Du er lige gået i land på kysten og er for omtåget til at overskue horisonten.";
    }

    function lukEventOgShop() {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        
        if (felt && eventState.aktivt && felt.eventID !== 'campfire' && felt.eventID !== 'meteor_skat' && felt.eventID !== 'stjernekald') {
            felt.eventFuldført = true;
        }
        
        motorLukEvent();
        spilTilstand.aktivShop = null;
        
        if (felt && felt.hasPortal) {
            udfoerPortalTeleport();
        } else {
            syncTilDb(true);
        }
    }

    function hentLangsomsteDag() {
        const spillere = Object.values(spilTilstand.alleSpillere);
        if (spillere.length <= 1) return spilTilstand.dag;
        
        const timeoutGraense = Date.now() - (5 * 60 * 1000);
        const aktive = spillere.filter((s: SpillerData) => {
            if (s.isDead || s.isWinner) return false;
            if (s.sidstAktiv && s.sidstAktiv < timeoutGraense) return false;
            return true;
        });
        
        if (aktive.length === 0) return spilTilstand.dag;
        return Math.min(...aktive.map((s: SpillerData) => s.dag || 1));
    }

   function udførBevægelse(nytIndeks: number) {
    if (flytterNu || !spilTilstand.valgtKarakter) return;

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    if (mig && mig.sidstAktiv && (Date.now() - mig.sidstAktiv > 5 * 60 * 1000) && erITågen) {
        flytterNu = true;
        spilTilstand.livspoint = 0;
        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }
        spilTilstand.logBesked = "Du vågner fra din dvale, men det er for sent. Tågen har allerede fortrukket alt liv fra dine knogler.";
        syncTilDb(true);
        setTimeout(() => flytterNu = false, 200);
        return;
    }

    flytterNu = true;
    
    if (spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN) {
        spilTilstand.logBesked = 'Du må vente på de andre spillere.';
        spilTilstand.venteSpilAktiv = true;
        flytterNu = false;
        return;
    }

    const felt = spilTilstand.gitter[nytIndeks];
    if (!felt) { flytterNu = false; return; }
    
    const grundPris = biomeTerraenCost[felt.biome as Biome] || 1;
    const biomeRabat = spilTilstand.valgtKarakter.biomeMod?.[felt.biome as string] || 0;
    const pris = Math.max(1, spilTilstand.valgtKarakter.moveCost + spilTilstand.rygsækEffekt.move + grundPris + biomeRabat);
    
    spilTilstand.nuvaerendeEnergi -= erITågen ? pris + 2 : pris;
    
    const nulHp = ['mark', 'by', 'eng', 'marked', 'hoejland', 'skov'];
    const toHp = ['bjerg', 'hule'];
    let hpStraf = 0;
    
    if (nulHp.includes(felt.biome as string)) {
        hpStraf = 0;
    } else if (toHp.includes(felt.biome as string)) {
        hpStraf = 3;
    }

    if (hpStraf > 0) {
        hpStraf = spilTilstand.beregnSkade(hpStraf);
        spilTilstand.livspoint -= hpStraf;
    }

    const nuBlok = Math.ceil((spilTilstand.dag || 1) / 5);
    const erHvedeTid = nuBlok % 2 !== 0; 
    const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok;
    const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok;
    
    if (felt.biome === 'mark' && felt.afgroede && !erSmadret && !erHoestet) {
        const erModen = (felt.afgroede === 'hvede' && erHvedeTid) || (felt.afgroede === 'boenner' && !erHvedeTid);
        if (erModen) {
            spilTilstand.livspoint += 3;
            felt.hoestetFremTilBlok = nuBlok;
        } else {
            felt.smadretFremTilBlok = nuBlok + 1;
        }
        broadcastFelt(nytIndeks, felt);
    }

    if (spilTilstand.livspoint <= 0) {
        tagSkadeOgTjekDød(0, "", "Marchen sled din sidste gnist væk. Du kollapser i støvet.");
        if (spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'dead') {
            flytterNu = false;
            spilTilstand.gitter = [...spilTilstand.gitter];
            syncTilDb(true);
            return;
        }
    }

    if (felt.biome === 'hav') {
        tagSkadeOgTjekDød(
            30, 
            "Du trådte ud i havet og slugte koldt saltvand.", 
            "De kolde bølger trak dig under. Du er død."
        );
        if (spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'dead') {
            flytterNu = false;
            return;
        }
    }

    spilTilstand.spillerIndex = nytIndeks;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(nytIndeks);

    afslørOmraade(nytIndeks, Math.max(felt.biome === 'bjerg' ? 2 : 1, aktuelSynsRadius));
    if ((nytIndeks % BREDDE) > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nytIndeks % BREDDE;
    
    const charId = spilTilstand.valgtKarakter.id;
    const b = felt.biome as string;
    let specialLog = "";
    
    if ((charId === 'thief_m' || charId === 'thief_f') && (b === 'marked' || b === 'by')) {
        spilTilstand.guldTotal += 5;
        specialLog = " Du snupper diskret et par mønter i mængden.";
    } else if ((charId === 'joker_m' || charId === 'joker_f') && b === 'marked') {
        spilTilstand.guldTotal += 10;
        specialLog = " Markedet belønner din gøgl og optræden med guld.";
    } else if ((charId === 'royal_m' || charId === 'royal_f') && b === 'by') {
        spilTilstand.guldTotal += 5;
        specialLog = " Du opkræver en smule skat fra lokalbefolkningen.";
    } else if ((charId === 'magician_m' || charId === 'magician_f') && b === 'ritual') {
        spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 5);
        specialLog = " Mørk magi strømmer helende ind i dine årer.";
    }

    if (felt.hasGoldmine) {
        const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (!spiller.besoegteMiner) spiller.besoegteMiner = [];
        
        const varEjer = felt.mineOwner === spilTilstand.spillerNavn;
        const harBesoegt = spiller.besoegteMiner.includes(nytIndeks);
        
        if (!varEjer) {
            if (felt.mineLocked) {
                specialLog = specialLog ? 
                    `${specialLog} Minen er spærret med en massiv hængelås. Ejeren har sikret den for evigt.` : "Minen er spærret med en massiv hængelås. Ejeren har sikret den for evigt.";
            } else {
                const ejedeMiner = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
                felt.mineOwner = spilTilstand.spillerNavn;
                
                if (!harBesoegt) {
                    spiller.besoegteMiner.push(nytIndeks);
                    const basisGuld = 100 + (ejedeMiner * 50);
                    const faktiskGuld = spilTilstand.beregnGuldIndkomst ? spilTilstand.beregnGuldIndkomst(basisGuld) : basisGuld;
                    spilTilstand.guldTotal += faktiskGuld;
                    specialLog += specialLog ?
                        ` Du overtager minen og udbetaler ${faktiskGuld} guld.` : `Du overtager minen og udbetaler ${faktiskGuld} guld.`;
                } else {
                    felt.mineLocked = true;
                    specialLog += specialLog ?
                        ` Du flår skødet tilbage og låser minen for evigt!` : `Du flår skødet tilbage og låser minen for evigt!`;
                }
                // Tvinger Svelte til at opdatere lokalt ved at erstatte objektet i gitteret
                spilTilstand.gitter[nytIndeks] = { ...felt };
                broadcastFelt(nytIndeks, spilTilstand.gitter[nytIndeks]);
            }
        }
    }

    const slidLog = tjekMiljoeSlitage(felt.biome as string);
    let samletLog = slidLog ? slidLog.trim() : "";
    
    if (specialLog) {
        samletLog = samletLog ?
            `${samletLog} ${specialLog.trim()}` : specialLog.trim();
    }

    if (samletLog) {
        spilTilstand.logBesked = samletLog;
    }

    if (felt.hasPortal) {
        udfoerPortalTeleport();
        spilTilstand.gitter = [...spilTilstand.gitter];
        syncTilDb(true);
        setTimeout(() => flytterNu = false, 200);
        return;
    }

    fremrykTid();
    
    if (felt.hasBoat) {
        felt.hasBoat = false;
        sejlendeBaadIndex = nytIndeks;
        
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = true;
        }
        
        spilTilstand.logBesked = "Du mærker bådens ru træ under dine støvler. Havet åbner sig. Du har overlevet øen og kan trække vejret frit.";
        
        broadcastFelt(nytIndeks, felt);

        setTimeout(() => {
            spilTilstand.gameState = 'win_map';
            syncTilDb(true); 
        }, 3000);
    } else {
        if (felt.eventID && !felt.eventFuldført) {
            felt.eventFuldført = true;
            broadcastFelt(nytIndeks, felt);
            startEvent(felt.eventID);
        }
        else if (felt.shopItems && felt.shopItems.length > 0) spilTilstand.aktivShop = felt.shopItems;
    }

    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(true);
    setTimeout(() => flytterNu = false, 200);
}

    function flytHex(retning: string) {
        if (spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
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
        if (spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
        if (spilTilstand.gameState === 'play' && hentNaboIndices(spilTilstand.spillerIndex).includes(nytIndeks)) udførBevægelse(nytIndeks);
    }
</script>

<svelte:window onkeydown={håndterTastatur} />

{#if spilTilstand.gameState === 'play'}
    <BottomUI />
{/if}

<Skaerme 
    {opretEllerDeltag} 
    {bekræftValg} 
    {genstartBane} 
    nulstilHukommelse={() => browser && window.location.reload()} 
    {lokaleScores} 
    {globaleScores}
/>

<div class="game-container">
    <div class="camera" role="presentation"
        onwheel={(e) => cam.håndterZoom(e, !!eventState.aktivt || !!spilTilstand.aktivShop || spilTilstand.dag < 2)}
        onpointerdown={(e) => cam.startTræk(e, !!eventState.aktivt || !!spilTilstand.aktivShop || spilTilstand.dag < 2)}
        onpointermove={cam.træk}
        onpointerup={cam.stopTræk}
        style="cursor: {cam.isDragging ? 'grabbing' : (spilTilstand.dag < 2 ? 'default' : 'grab')}; touch-action: none;"
    >
        <div class="map" style={kameraStyle}>
            {#each spilTilstand.gitter as felt, i (i)}
                {@const raekke = Math.floor(i / BREDDE)}
                {@const kolonne = i % BREDDE}
                {@const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0)}
                {@const posY = raekke * ROW_H}
                {@const erUdforsket = spilTilstand.mineKendteFelter.includes(i)}
                {@const erOpslugt = posX <= spilTilstand.fogX}
                {@const baggrund = !erUdforsket ? 'none' : erOpslugt ? `url('/tiles/${felt.biome}_taage.webp')` : `url('/tiles/${felt.biome}.webp')`}

                <div class="hex" class:active={spilTilstand.spillerIndex === i} class:unexplored={!erUdforsket}
                    onclick={() => klikPåHex(i)}
                    onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                    role="button" tabindex="0"
                    style="background-image: {baggrund}; left: {posX}px; top: {posY}px;"
                >
                    <div class="inner" class:opslugt={erOpslugt}>
                        {#if erUdforsket && felt.hasBoat}
                            {#if !erOpslugt}
                                <div class="sejr-lys"></div>
                            {/if}
                            <img src="/tiles/baad.webp" alt="Flugtbåd" class="escape-boat" />
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.afgroede && felt.biome === 'mark'}                            
                            {@const nuBlok = Math.ceil((spilTilstand.dag || 1) / 5)}
                            {@const erHvedeTid = nuBlok % 2 !== 0}
                            {@const erModen = (felt.afgroede === 'hvede' && erHvedeTid) || (felt.afgroede === 'boenner' && !erHvedeTid)}
                            {@const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok}
                            {@const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok}

                            {#if erSmadret}
                                <img src="/tiles/{felt.afgroede === 'hvede' ? 'brokenwheat.webp' : 'brokenbean.webp'}" class="crop-icon" alt="" />
                            {:else if !erHoestet}
                                {#if erModen}
                                    <img src="/tiles/{felt.afgroede === 'hvede' ? 'wheat.webp' : 'beans.webp'}" class="crop-icon moden" alt="" />
                                {:else}
                                    <img src="/tiles/{felt.afgroede === 'hvede' ? 'growingwheat.webp' : 'growingbean.webp'}" class="crop-icon" alt="" />
                                {/if}
                            {/if}
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.biome === 'meteor' && felt.hasMeteorStone}
                            <img src="/tiles/meteorsten.webp" class="meteor-stone-icon" alt="" />
                        {/if}

                        {#if erUdforsket && !felt.gravet}
                            {#if felt.isSkatteKlynge && harSkattekortAktivt}
                                <img src="/tiles/treasuremark.webp" alt="Mulig skat" class="treasure-mark-icon" />
                            {/if}
                            {#if harDetektor && (felt.skjultGuld ?? 0) > 0}
                                <img src="/tiles/guldtaage.webp" alt="" class="mist-icon" style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultGuld ?? 0) / 80});" />
                            {/if}
                            {#if harKvist && (felt.skjultLiv ?? 0) > 0}
                                <img src="/tiles/livtaage.webp" alt="" class="mist-icon" style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultLiv ?? 0) / 40});" />
                            {/if}
                        {/if}
                        
                        {#if erUdforsket && felt.gravet}
                            <img src="/tiles/udgravning.webp" alt="" class="dug-image" />
                        {/if}

                        {#if erUdforsket && felt.tomSkattekiste}
                            <img src="/tiles/empty_treasure.webp" alt="Tom skattekiste" class="empty-treasure-icon" />
                        {/if}
                        
                        {#if erUdforsket && felt.hasGoldmine}
                            <div class="goldmine-container">
                                <img src="/tiles/goldmine.webp" alt="Guldmine" class="goldmine-icon" />
                                {#if felt.mineOwner}
                                    <div class="owner-badge" class:locked={felt.mineLocked}>
                                        <img src={felt.mineOwner === spilTilstand.spillerNavn ? spilTilstand.valgtKarakter?.ikon : (spilTilstand.alleSpillere[felt.mineOwner]?.ikon || '/tiles/player.webp')} alt="Ejer" class="mine-owner-portrait" />
                                        {#if felt.mineLocked}
                                            <span class="lock-icon">🔒</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        {#if erUdforsket && felt.eventID && !felt.eventFuldført}
                            {#if felt.eventID === 'campfire'}
                                <img src="/tiles/campfire.webp" alt="" class="campfire-icon" />
                            {:else if felt.eventID !== 'meteor_skat'}
                                <img src="/tiles/event.png" alt="" class="event-crystal" />
                            {/if}
                        {/if}

                        {#if erUdforsket && felt.hasPortal}
                            <img src="/tiles/portal.webp" alt="Portal" class="portal-icon" />
                        {/if}

                        {#if erUdforsket && felt.shopItems && felt.shopItems.length > 0}
                            <img 
                                src="/tiles/{felt.biome === 'by' ? 'byshop.webp' : 'markedshop.webp'}" 
                                alt="" 
                                class="shop-icon" 
                                onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} 
                            />
                        {/if}

                        {#if erUdforsket && felt.gravstenIkon}
                            <div class="gravsten-container">
                                <img src="/tiles/gravsted.webp" alt="Død" class="gravsten-ikon" />
                                <img src={felt.gravstenIkon} alt="Faldet" class="gravsten-portraet" />
                            </div>
                        {/if}
                        
                        {#each Object.entries(spilTilstand.alleSpillere) as [navn, mod] (navn)}
                            {#if navn !== spilTilstand.spillerNavn && mod.index === i && !mod.isDead}
                                {@const afstand = regnHexAfstand(spilTilstand.spillerIndex, mod.index, BREDDE)}
                                {@const synlig = afstand <= aktuelSynsRadius}
                                <span class="modstander-icon" class:alarm-aktiv={mod.activeAlarm && !synlig} class:skjult-lyd={!synlig && !mod.activeAlarm}>
                                    <img src={synlig ? (mod.ikon || '/tiles/player.webp') : '/tiles/player.webp'} alt="" style="width: {synlig ? '45px' : '70px'};" />
                                </span>
                            {/if}
                        {/each}

                        {#if spilTilstand.spillerIndex === i && sejlendeBaadIndex !== i && spilTilstand.gameState !== 'dead' && spilTilstand.gameState !== 'win'}
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

                {#if sejlendeBaadIndex === i}
                    <div class="sailing-container" style="left: {posX}px; top: {posY}px;">
                        <img src="/tiles/baad.webp" alt="Flugtbåd" class="escape-boat" />
                        <img src={spilTilstand.valgtKarakter?.ikon} alt="" class="sejler-ikon" />
                    </div>
                {/if}
            {/each}

            {#if spilTilstand.gameState === 'win_map' || spilTilstand.gameState === 'dead_map'}
                <svg class="rute-canvas">
                    {#each Object.entries(spilTilstand.alleSpillere) as [navn, data] (navn)}
                        {#if data.historik && data.historik.length > 1}
                            {@const pointsArray = data.historik.map((idx: number) => {
                                const raekke = Math.floor(idx / BREDDE);
                                const kolonne = idx % BREDDE;
                                const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2);
                                const posY = raekke * ROW_H + 55;
                                return {x: posX, y: posY};
                            })}
                            {@const points = pointsArray.map(p => `${p.x},${p.y}`).join(' ')}
                            {@const startPoint = pointsArray[0]}
                            {@const endPoint = pointsArray[pointsArray.length - 1]}
                            {@const erMig = navn === spilTilstand.spillerNavn}
                            
                            <polyline 
                                points={points} 
                                fill="none" 
                                stroke={erMig ? '#ffffff' : 'rgba(200, 200, 200, 0.4)'} 
                                stroke-width={erMig ? "6" : "4"} 
                                stroke-dasharray="12, 12"
                                class="flugtrute"
                            />
                            
                            <image 
                                href={data.ikon || '/tiles/player.webp'} 
                                x={startPoint.x - 20} 
                                y={startPoint.y - 20} 
                                width="40" 
                                height="40" 
                                class="rute-start-icon" 
                                opacity={erMig ? "1" : "0.5"}
                            />

                            <image 
                                href={data.ikon || '/tiles/player.webp'} 
                                x={endPoint.x - 25} 
                                y={endPoint.y - 25} 
                                width="50" 
                                height="50" 
                                class="rute-end-icon" 
                                opacity={erMig ? "1" : "0.8"}
                            />
                        {/if}
                    {/each}
                </svg>
            {/if}
        </div>
    </div>
</div>

{#if eventState.aktivt} <EventModal lukEvent={lukEventOgShop} /> {/if}
{#if spilTilstand.aktivShop} <ShopModal lukShop={lukEventOgShop} /> {/if}
{#if spilTilstand.venteSpilAktiv} <VenteModal kanSpilleIgen={spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN} /> {/if}

{#if spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win_map'}
    <div class="slut-panel" class:vundet={spilTilstand.gameState === 'win_map'}>
        <div class="slut-header">
            <h2>{spilTilstand.gameState === 'win_map' ? 'Du undslap' : 'Øen tog dig'}</h2>
            <p>{spilTilstand.logBesked}</p>
        </div>
        
        <div class="rangliste">
            {#each Object.entries(spilTilstand.alleSpillere).sort((a, b) => (b[1].score || 0) - (a[1].score || 0)) as [navn, data] (navn)}
                <div class="raekke" class:mig={navn === spilTilstand.spillerNavn}>
                    <img src={data.ikon || '/tiles/player.webp'} alt="" />
                    <div class="info">
                        <strong>{navn}</strong>
                        <span>{data.isWinner ? 'Sluppet væk' : (data.isDead ? 'Bukkede under' : 'I tågen')}</span>
                    </div>
                    <div class="stats">
                        <span title="Guld">🪙 {data.guld}</span>
                    </div>
                </div>
            {/each}
        </div>

        <button class="log-ikon-btn" onclick={() => visDoedsLog = true} title="Læs din fulde log">
            <img src="/ui/log_ikon.webp" alt="Log" />
            <span>Min Logbog</span>
        </button>

        <button class="se-resultat-btn" onclick={() => spilTilstand.gameState = spilTilstand.gameState === 'win_map' ? 'win' : 'dead'}>
            Se point-fordeling
        </button>

    </div>
{/if}

{#if visDoedsLog}
    <div class="log-modal-overlay" onclick={() => visDoedsLog = false} role="presentation">
        <div class="log-modal" onclick={(e) => e.stopPropagation()} role="presentation">
            <h3>Din Rejse</h3>
            <div class="log-liste">
                {#each rensedeLogLinjer as linje, index (index)}
                    <p>{linje}</p>
                {/each}
            </div>
            <button class="luk-log-btn" onclick={() => visDoedsLog = false}>Luk</button>
        </div>
    </div>
{/if}

<style>
    .game-container { width: 100vw; height: 100dvh; overflow: hidden; background: #000; }
    .camera { width: 100%; height: 100%; }
    .map { position: absolute; }
    .hex { 
        position: absolute; width: 96px; height: 110px;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); 
        background-size: cover;
    }
    .hex.unexplored { background-color: #000; }
    .inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    
    .crop-icon {
        position: absolute; bottom: 22px; right: 18px; width: 40px; height: auto;
        z-index: 11; pointer-events: none; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.8));
    }
    .crop-icon.moden { width: 40px; bottom: 20px; right: 15px; z-index: 12; }
    
    .meteor-stone-icon {
        position: absolute; bottom: 38%; left: 50%; transform: translateX(-50%);
        height: 50px; z-index: 13; pointer-events: none; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    
    .sailing-container {
        position: absolute; width: 96px; height: 110px; z-index: 100; display: flex;
        justify-content: center; align-items: center;
        animation: sailAway 3s forwards cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sejler-ikon { height: 40px; position: relative; z-index: 2; margin-bottom: 15px; }
    @keyframes sailAway {
        0% { transform: translateX(0) scale(1); opacity: 1; }
        100% { transform: translateX(300px) scale(0.5); opacity: 0; }
    }
    
    .escape-boat {
        position: absolute; width: 75px; height: auto; top: 50%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 15; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    .sejr-lys {
        position: absolute; width: 100%; height: 100%;
        background: radial-gradient(ellipse at center, transparent 30%, rgba(255, 180, 0, 0.5) 70%, rgba(255, 215, 0, 0.9) 100%);
        mix-blend-mode: color-dodge; pointer-events: none; z-index: 5;
        animation: guldPuls 2.5s infinite alternate ease-in-out;
    }
    @keyframes guldPuls {
        0% { opacity: 0.4; filter: brightness(1); }
        100% { opacity: 1; filter: brightness(1.6); }
    }
    
    .mist-icon {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        pointer-events: none; width: 50px; z-index: 12;
    }
    .treasure-mark-icon {
        position: absolute; width: 35px; height: auto; top: 65%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 13; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .dug-image {
        position: absolute; width: 90px; height: 52px; top: 58%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 10;
    }
    .empty-treasure-icon {
        position: absolute; width: 70px; height: auto; top: 38%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 11; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    
    .goldmine-container {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -45%);
        width: 80px; z-index: 12; pointer-events: none; display: flex; justify-content: center; align-items: center;
    }
    .goldmine-icon { width: 100%; height: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); }
    .owner-badge { position: absolute; bottom: -5px; right: -5px; z-index: 13; }
    .owner-badge .mine-owner-portrait {
        width: 34px; height: 34px; border-radius: 50%; border: 2px solid #ffcc00; 
        background: #111; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.9);
    }
    .owner-badge.locked .mine-owner-portrait { border-color: #ff4444; }
    .lock-icon { position: absolute; bottom: -5px; left: -10px; font-size: 18px; filter: drop-shadow(0 2px 2px black); }

    .rute-canvas {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 18; overflow: visible;
    }
    .flugtrute { animation: tegnRute 3s linear forwards; }
    @keyframes tegnRute { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
    
    .rute-end-icon {
        animation: fadeInIcon 0.5s 2.5s both;
        filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.9));
    }
    @keyframes fadeInIcon {
        from { opacity: 0; transform: scale(0); }
        to { opacity: 1; transform: scale(1); }
    }

    .event-crystal { height: 60px; animation: float 3s infinite ease-in-out; z-index: 15; position: relative; }
    .campfire-icon { position: absolute; width: 80px; height: 80px; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 14; }
    .portal-icon {
        position: absolute; width: 65px; height: 65px; z-index: 9; pointer-events: none;
        animation: portalPuls 2.5s infinite alternate ease-in-out;
    }
    @keyframes portalPuls {
        0% { transform: scale(0.95); filter: drop-shadow(0 0 5px rgba(0, 150, 255, 0.6)); }
        100% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(0, 220, 255, 1)) brightness(1.2); }
    }
    .shop-icon {
        position: absolute; width: 80px; height: 80px; top: 55%; left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 14;
        filter: drop-shadow(0 0 15px rgba(255, 165, 0, 0.9)) drop-shadow(0 4px 6px rgba(0,0,0,0.8));
    }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    
    .modstander-icon { position: absolute; top: 10px; z-index: 16; display: flex; justify-content: center; width: 100%; }
    .gravsten-container {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; z-index: 13;
        display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;
    }
    .gravsten-ikon { position: absolute; width: 100%; height: auto; z-index: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); }
    .gravsten-portraet {
        position: relative; z-index: 2; width: 38px; margin-top: -8px;
        filter: grayscale(100%) sepia(10%) brightness(0.6) contrast(1.2); opacity: 0.85;
    }
    
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
    .opslugt { opacity: 0.8; filter: grayscale(0.8) brightness(0.6); }

    .slut-panel {
        position: fixed; bottom: 20px; right: 20px; width: 350px; max-width: 90vw;
        background: rgba(20, 0, 0, 0.95); border: 2px solid #ff4444; border-radius: 8px;
        padding: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.8); pointer-events: auto;
    }
    .slut-panel.vundet { background: rgba(30, 25, 0, 0.95); border-color: #ffcc00; }
    .slut-header { text-align: center; border-bottom: 1px solid #ff4444; padding-bottom: 15px; }
    .slut-panel.vundet .slut-header { border-color: #ffcc00; }
    .slut-header h2 { margin: 0 0 5px 0; color: #ff4444; font-family: 'Cinzel', serif; }
    .slut-panel.vundet .slut-header h2 { color: #ffcc00; }
    .slut-header p { margin: 0; color: #ddd; font-size: 0.9rem; line-height: 1.4; }

    .rute-start-icon {
        animation: fadeInIcon 0.5s 0.5s both;
        filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.9));
    }

    .se-resultat-btn {
        background: #ffcc00; color: #000; border: none; border-radius: 4px;
        padding: 12px; font-family: 'Cinzel', serif; font-weight: bold;
        text-transform: uppercase; cursor: pointer; margin-top: 5px; transition: 0.2s;
    }
    .se-resultat-btn:hover { transform: scale(1.02); filter: brightness(1.1); }
    
    .rangliste { display: flex; flex-direction: column; gap: 10px; max-height: 40vh; overflow-y: auto; }
    .raekke { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; }
    .raekke.mig { border: 1px solid #777; background: rgba(255,255,255,0.1); }
    .raekke img { width: 40px; height: 40px; object-fit: contain; }
    .raekke .info { flex-grow: 1; display: flex; flex-direction: column; }
    .raekke .info strong { color: white; font-size: 1.1rem; }
    .raekke .info span { color: #aaa; font-size: 0.8rem; text-transform: uppercase; }
    .raekke .stats { color: #ffcc00; font-weight: bold; font-family: monospace; font-size: 1.1rem; }

    .log-ikon-btn {
        background: transparent; border: 1px solid #555; border-radius: 6px; cursor: pointer;
        transition: 0.2s; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;
        color: white; font-family: 'Cinzel', serif; font-size: 1rem; text-transform: uppercase; margin-top: 10px;
    }
    .log-ikon-btn:hover { background: rgba(255,255,255,0.1); border-color: white; }
    .log-ikon-btn img { width: 30px; height: 30px; }

    .log-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 3000; }
    .log-modal { background: #111; border: 2px solid #555; border-radius: 8px; width: 600px; max-width: 90%; max-height: 80vh; display: flex; flex-direction: column; padding: 20px; }
    .log-modal h3 { color: #ffcc00; margin-top: 0; font-family: 'Cinzel', serif; text-align: center; }
    .log-liste { flex-grow: 1; overflow-y: auto; margin: 15px 0; padding-right: 10px; display: flex; flex-direction: column; gap: 10px; }
    .log-liste p { color: #ddd; margin: 0; line-height: 1.4; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .log-liste p:last-child { border-bottom: none; }
    .luk-log-btn { background: #333; color: white; border: 1px solid #777; padding: 10px; cursor: pointer; border-radius: 4px; font-weight: bold; transition: 0.2s; }
    .luk-log-btn:hover { background: #555; }

    :global(body.jordskaelv) { animation: rystelse 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; overflow: hidden; }
    @keyframes rystelse { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 10%, 30%, 50%, 70%, 90% { transform: translate(-12px, 8px) rotate(-1.5deg); } 20%, 40%, 60%, 80% { transform: translate(12px, -8px) rotate(1.5deg); } }
</style>