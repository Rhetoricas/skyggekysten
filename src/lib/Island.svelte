<script lang="ts">
    import { onMount, onDestroy, untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { authState, initAuth } from '$lib/auth.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { M10_SCORE, beregnFremdriftPoint, beregnMinePoint, taelScoreSpillere } from '$lib/score';
    import { hentHighscores, gemHighscore, syncTilDb, startRealtime, stopRealtime, hentGlobalTopTi, hentGlobalTopScore, flushVentendeSync } from '$lib/netvaerk';
    import { harOfflineSpil, hentOfflineSpilInfo, indlaesOfflineSpil, sletOfflineSpil } from '$lib/offlineStorage';
    import { hvil, hentNaboIndices, afslørOmraade, initialiserGitter, tilfoejTilRygsæk, regnHexAfstand, udfoerPortalTeleport, nulstilKort, udloesOversvoemmelse, udloesJordskaelv, udfoerBevaegelse, erTrackerAktivPaa, opdaterTrackerSyn, tjekAutoTracker, anvendFaellesEventEffekt } from '$lib/spilmotor';
    import { grav } from '$lib/undergrund.svelte';
    import { erSpillerITaagen } from '$lib/overlevelse.svelte';    
    import { eventState, startEvent, lukEvent as motorLukEvent } from '$lib/eventMotor.svelte';
    import {
        BREDDE,
        HOEJDE,
        HEX_W,
        ROW_H,
        tilgaengeligeKarakterer,
        itemDB
    } from '$lib/spildata';
    import type { Karakter, SpillerData } from '$lib/types';
    import { eventBibliotek } from '$lib/eventBibliotek';
    import { erAfgroedeModen, hentAfgroedeBlok, hentInsektPlageBlok } from '$lib/afgroeder';
    import { erFeltITaagen } from '$lib/taage';

    import Skaerme from './Skaerme.svelte';
    import ShopModal from '$lib/ShopModal.svelte';
    import EventModal from '$lib/EventModal.svelte';
    import VenteModal from '$lib/VenteModal.svelte';
    import BottomUI from './BottomUI.svelte';
    import Regelbog from '$lib/Regelbog.svelte';
    import LydKnap from '$lib/LydKnap.svelte';

    const cam = skabKamera();
    const MAX_DAGE_FORAN = 5;

    let lokaleScores = $state<Array<{ navn: string; score: number; karakter?: string }>>([]);
    let globaleScores = $state<Array<{ spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);    
    
    let flytterNu = false;
    let sejlendeBaadIndex = $state<number | null>(null);
    let visDoedsLog = $state(false);
    let langsomtKamera = $state(false);
    let ruteOverblikState = '';
    let introAktiv = $state(false);
    
    let harDetektor = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'metaldetektor') ?? false);
    let harKvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'soegekvist') ?? false);
    let aktuelSynsRadius = $derived(Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));
    let erITågen = $derived(erSpillerITaagen());
    let rensedeLogLinjer = $derived(spilTilstand.logHistorik.filter(linje => linje.includes(' - ')));
    let aktivInsektPlageBlok = $derived(hentInsektPlageBlok(spilTilstand.gitter));

    let harSkattekortAktivt = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'skattekort_aabent') ?? false);
    
    let glHp = $state(0);
    let glGuld = $state(0);
    let scoreErGemt = $state(false);
    let scoreGemmer = $state(false);
    let scoreGemningFejlet = $state(false);
    let nyGlobalRekord = $state(false);
    let harGemtOfflineSpil = $state(false);
    let offlineSpilInfo = $state<ReturnType<typeof hentOfflineSpilInfo>>(null);

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
        const brugerId = authState.user?.id;
        
        untrack(() => {
            if (state === 'play') {
                scoreErGemt = false;
                scoreGemmer = false;
                scoreGemningFejlet = false;
                nyGlobalRekord = false;
            } else if (
                (state === 'win' || state === 'dead' || state === 'win_map' || state === 'dead_map') &&
                !scoreErGemt &&
                !scoreGemmer &&
                !scoreGemningFejlet &&
                (spilTilstand.offlineMode || !!brugerId)
            ) {
                gemScoreIgen();
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
        const state = spilTilstand.gameState;
        const dag = spilTilstand.dag;
        const tracker = spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker;
        const target = tracker ? spilTilstand.alleSpillere[tracker.targetNavn] : null;
        const targetIndex = target?.index;
        const targetSyn = target?.kendteFelter?.length || 0;
        void dag;
        void targetIndex;
        void targetSyn;

        untrack(() => {
            if (state === 'play') {
                opdaterTrackerSyn();
                tjekAutoTracker();
            }
        });
    });

    $effect(() => {
        const state = spilTilstand.gameState;
        const erSlutkort = state === 'win_map' || state === 'dead_map';

        if (!erSlutkort) {
            ruteOverblikState = '';
            return;
        }

        if (ruteOverblikState === state) return;

        untrack(() => {
            visRuteOverblik();
            ruteOverblikState = state;
        });
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

    function hexCenter(index: number) {
        const raekke = Math.floor(index / BREDDE);
        const kolonne = index % BREDDE;
        return {
            x: kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2),
            y: raekke * ROW_H + (ROW_H / 2)
        };
    }

    function visRuteOverblik() {
        const rute = spilTilstand.historik?.length > 1
            ? spilTilstand.historik
            : (spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.historik || []);

        if (!rute.length) {
            cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            cam.saetZoom(window.innerWidth <= 700 ? 0.45 : 0.6);
            return;
        }

        const punkter = rute.map(hexCenter);
        const minX = Math.min(...punkter.map(p => p.x));
        const maxX = Math.max(...punkter.map(p => p.x));
        const minY = Math.min(...punkter.map(p => p.y));
        const maxY = Math.max(...punkter.map(p => p.y));

        cam.x = (minX + maxX) / 2;
        cam.y = (minY + maxY) / 2;
        cam.saetZoom(window.innerWidth <= 700 ? 0.42 : 0.58);
    }

    let kameraStyle = $derived(`
        transform-origin: ${cam.x}px ${cam.y}px;
        transform: translate(calc(50vw - ${cam.x}px), calc(var(--camera-center-y, 50dvh) - ${cam.y}px)) scale(${cam.zoomLevel});
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
            '/tiles/meteorsten.webp', '/tiles/openlock.webp'
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
        if (introAktiv || ev.repeat || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play' || spilTilstand.venteSpilAktiv) return;
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

        if (!spilTilstand.offlineMode && aktiveSpillere.length > 0 && spilTilstand.rumKode) {
            alert('Du kan ikke genstarte øen for alle, mens der stadig er andre aktive spillere ude i tågen.');
            return;
        }

        spilTilstand.logHistorik = [];
        spilTilstand.logBesked = '';
        visDoedsLog = false;
        
        cam.nulstil();

        Object.keys(spilTilstand.alleSpillere).forEach(navn => {
            const spiller = spilTilstand.alleSpillere[navn];
            if (spiller.historik && spiller.historik.length > 1) {
                spiller.tidligereHistorik = [...(spiller.tidligereHistorik || []), spiller.historik];
                spiller.historik = [];
            }
            spilTilstand.alleSpillere[navn].isDead = false;
            spilTilstand.alleSpillere[navn].isWinner = false;
            spilTilstand.alleSpillere[navn].dag = 1;
            spilTilstand.alleSpillere[navn].harSkattekort = false;
            spilTilstand.alleSpillere[navn].aktivTracker = null;
            spilTilstand.alleSpillere[navn].trackedeSpillere = [];
        });

        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        spilTilstand.historik = [];
        
        nulstilKort();

        spilTilstand.gameState = 'select';
        await syncTilDb(true);
    }

    async function opretEllerDeltag() {
        spilTilstand.offlineMode = false;
        spilTilstand.soloMode = false;
        let rentNavn = (spilTilstand.spillerNavn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = (spilTilstand.rumKode || '').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Udfyld både dit kaldenavn og dit ø-navn.';
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
                syncTilDb();
            })
            .on('broadcast', { event: 'faelles_event' }, ({ payload }) => {
                anvendFaellesEventEffekt(payload);
            })
            .subscribe();

        try {
            const { data, error } = await medTimeout(
                supabase.from('spil_sessioner').select('*').eq('rum_kode', spilTilstand.rumKode).maybeSingle()
            );
            if (error) {
                console.error("Netværksfejl:", error);
                spilTilstand.statusBesked = `Kunne ikke forbinde til øen: ${error.message}`;
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
                    spilTilstand.historik = eksisterende.historik || [];

                    afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
                    startRealtime();
                    
                    if (eksisterende.isDead || eksisterende.isWinner) {
                        spilTilstand.gameState = eksisterende.isWinner ? 'win_map' : 'dead_map';
                        spilTilstand.statusBesked = eksisterende.isWinner ? 'Du slap væk fra øen.' : 'Du døde i tågen.';
                    } else {
                        spilTilstand.gameState = 'play';
                        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
                    }
                } else {
                    const aktivSammeBruger = findAktivSpillerForBruger();
                    if (aktivSammeBruger) {
                        spilTilstand.statusBesked = `Du spiller allerede på denne ø som ${aktivSammeBruger.navn}. Log ud eller afslut den karakter først.`;
                        return;
                    }

                    const spillereArr = Object.values(spilTilstand.alleSpillere);
                    const maxDag = spillereArr.length > 0 ? Math.max(...spillereArr.map((s: SpillerData) => s.dag || 1)) : 1;

                    if (maxDag > 5) {
                        spilTilstand.statusBesked = `Du er for sent på den. Tågen har nået kysten (Dag ${maxDag}).`;
                        return;
                    }

                    spilTilstand.gameState = 'select';
                    startRealtime();
                }
            } else {
                spilTilstand.erHost = true;
                initialiserGitter();
                const { error: insertError } = await medTimeout(supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: spilTilstand.gitter,
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0
                }]));

                if (insertError) {
                    const { data: eksisterendeSession, error: hentEfterInsertError } = await medTimeout(
                        supabase.from('spil_sessioner').select('*').eq('rum_kode', spilTilstand.rumKode).maybeSingle()
                    );

                    if (hentEfterInsertError || !eksisterendeSession) {
                        spilTilstand.statusBesked = `Øen kunne ikke oprettes: ${insertError.message}`;
                        spilTilstand.gameState = 'start';
                        return;
                    }

                    spilTilstand.gitter = eksisterendeSession.kort;
                    spilTilstand.alleSpillere = eksisterendeSession.spillere || {};
                    spilTilstand.fogX = eksisterendeSession.fog_x || 0;
                    spilTilstand.erHost = false;
                }

                startRealtime();
                spilTilstand.gameState = 'select';
            }
        } catch (err) {
            console.error("Motorfejl:", err);
            spilTilstand.statusBesked = err instanceof Error && err.message === 'timeout'
                ? 'Forbindelsen til øen tog for lang tid. Prøv igen.'
                : "Der opstod en fejl under forbindelsen.";
        }
    }

    async function startSolo() {
        const rentNavn = (spilTilstand.spillerNavn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        const renKode = (spilTilstand.rumKode || '').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Udfyld både dit kaldenavn og dit ø-navn.';
            return;
        }

        stopRealtime();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        spilTilstand.offlineMode = false;
        spilTilstand.soloMode = true;
        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = authState.user ? 'Solo.' : 'Solo. Log ind for at gemme officiel score.';
        spilTilstand.erHost = true;
        spilTilstand.alleSpillere = {};
        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        spilTilstand.historik = [];
        spilTilstand.logHistorik = [];
        spilTilstand.samletScore = 0;
        scoreErGemt = false;
        nyGlobalRekord = false;
        initialiserGitter();
        spilTilstand.gameState = 'select';
        await syncTilDb(true);
    }

    function fortsaetOfflineSolo() {
        if (!indlaesOfflineSpil()) {
            spilTilstand.statusBesked = 'Der blev ikke fundet et offline-spil.';
            harGemtOfflineSpil = false;
            offlineSpilInfo = null;
            return;
        }
        spilTilstand.soloMode = false;

        stopRealtime();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        harGemtOfflineSpil = true;
        offlineSpilInfo = hentOfflineSpilInfo();
        if (spilTilstand.gameState === 'play') {
            cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        }
        if (spilTilstand.gameState === 'dead' || spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map') {
            scoreErGemt = true;
        }
    }

    function nulstilHukommelse() {
        if (spilTilstand.offlineMode) {
            sletOfflineSpil();
            harGemtOfflineSpil = false;
            offlineSpilInfo = null;
        }
        if (browser) window.location.reload();
    }

    onMount(() => {
        initAuth();
        preloadFiler();
        let genopretterForbindelse = false;

        const erAktivtOnlinespil = () => spilTilstand.gameState === 'play' && !spilTilstand.offlineMode && !spilTilstand.soloMode;

        const heartbeat = async () => {
            if (spilTilstand.offlineMode && spilTilstand.gameState === 'play') {
                await flushVentendeSync();
                return;
            }

            if (!erAktivtOnlinespil()) return;

            if (browser && !navigator.onLine) {
                spilTilstand.statusBesked = 'Forbindelsen er afbrudt. Spillet fortsætter lokalt indtil videre.';
                return;
            }

            await syncTilDb(false);
            const gemt = await flushVentendeSync();
            if (!gemt) {
                spilTilstand.statusBesked = spilTilstand.statusBesked || 'Forbindelsen til øen driller. Spillet prøver igen.';
            }
        };

        const genopretForbindelse = async () => {
            if (genopretterForbindelse) return;

            if (spilTilstand.offlineMode) {
                await flushVentendeSync();
                return;
            }

            if (!erAktivtOnlinespil()) return;

            genopretterForbindelse = true;
            try {
                stopRealtime();
                startRealtime();
                await heartbeat();
            } finally {
                genopretterForbindelse = false;
            }
        };

        const gemHvisSidenForsvinder = () => {
            void flushVentendeSync();
        };
        const gemHvisSkjult = () => {
            if (document.hidden) {
                gemHvisSidenForsvinder();
            } else {
                void genopretForbindelse();
            }
        };
        const haandterOnline = () => {
            void genopretForbindelse();
        };
        const haandterOffline = () => {
            if (erAktivtOnlinespil()) {
                spilTilstand.statusBesked = 'Forbindelsen er afbrudt. Spillet fortsætter lokalt indtil videre.';
            }
        };

        const heartbeatTimer = window.setInterval(() => {
            void heartbeat();
        }, 60 * 1000);

        document.addEventListener('visibilitychange', gemHvisSkjult);
        window.addEventListener('focus', haandterOnline);
        window.addEventListener('online', haandterOnline);
        window.addEventListener('offline', haandterOffline);
        window.addEventListener('pagehide', gemHvisSidenForsvinder);
        window.addEventListener('beforeunload', gemHvisSidenForsvinder);

        (async () => {
            harGemtOfflineSpil = harOfflineSpil();
            offlineSpilInfo = hentOfflineSpilInfo();
            lokaleScores = await hentHighscores();
            globaleScores = await hentGlobalTopTi();
        })();

        return () => {
            window.clearInterval(heartbeatTimer);
            document.removeEventListener('visibilitychange', gemHvisSkjult);
            window.removeEventListener('focus', haandterOnline);
            window.removeEventListener('online', haandterOnline);
            window.removeEventListener('offline', haandterOffline);
            window.removeEventListener('pagehide', gemHvisSidenForsvinder);
            window.removeEventListener('beforeunload', gemHvisSidenForsvinder);
        };
    });

    $effect(() => {
        const profilNavn = authState.profil?.display_name;
        if (spilTilstand.gameState === 'start' && profilNavn && !spilTilstand.spillerNavn) {
            spilTilstand.spillerNavn = profilNavn;
        }
    });

    $effect(() => {
        if (spilTilstand.offlineMode) return;
        const brugerId = authState.user?.id;
        if (brugerId) {
            (async () => {
                globaleScores = await hentGlobalTopTi();
            })();
        }
    });

    onDestroy(() => {
        void flushVentendeSync();
        stopRealtime();
        if (alarmKanal) supabase.removeChannel(alarmKanal);
    });

    async function opdaterOgGemHighscore() {
        const erVinder = spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map';
        const fremdriftPoint = beregnFremdriftPoint(spilTilstand.maxKolonne, erVinder);
        
        const udforskningPoint = spilTilstand.mineKendteFelter.length * 2;
        const minePoint = beregnMinePoint(spilTilstand.gitter, spilTilstand.spillerNavn, taelScoreSpillere(spilTilstand.alleSpillere));

        spilTilstand.samletScore = Math.floor(
            (spilTilstand.guldTotal + fremdriftPoint + udforskningPoint + minePoint) *
                (1 + Math.max(0, spilTilstand.livspoint) / 1000)
        );

        try {
            await syncTilDb(true);
            const sessionGemt = await flushVentendeSync();
            if (!sessionGemt) {
                scoreGemningFejlet = true;
                return;
            }
            
            const globalTopScore = !spilTilstand.offlineMode && authState.user ? await hentGlobalTopScore() : 0;
            nyGlobalRekord = !spilTilstand.offlineMode && !!authState.user && spilTilstand.samletScore >= M10_SCORE && spilTilstand.samletScore > globalTopScore;

            const highscoreGemt = await gemHighscore();
            lokaleScores = await hentHighscores();
            globaleScores = spilTilstand.offlineMode ? [] : await hentGlobalTopTi();
            harGemtOfflineSpil = harOfflineSpil();
            offlineSpilInfo = hentOfflineSpilInfo();
            scoreErGemt = highscoreGemt;
            scoreGemningFejlet = !highscoreGemt;
        } catch (error) {
            console.error('Score-flowet fejlede', error);
            spilTilstand.statusBesked = error instanceof Error ? error.message : 'Scoren kunne ikke gemmes.';
            scoreGemningFejlet = true;
        } finally {
            scoreGemmer = false;
        }
    }

    function gemScoreIgen() {
        if (scoreGemmer) return;
        scoreGemningFejlet = false;
        scoreGemmer = true;
        opdaterOgGemHighscore();
    }

    async function bekræftValg(karakter: Karakter) {
        const aktivSammeBruger = (spilTilstand.offlineMode || spilTilstand.soloMode) ? null : findAktivSpillerForBruger();
        if (aktivSammeBruger && aktivSammeBruger.navn !== spilTilstand.spillerNavn) {
            spilTilstand.statusBesked = `Du spiller allerede på denne ø som ${aktivSammeBruger.navn}.`;
            spilTilstand.gameState = 'start';
            return;
        }

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
            const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
            if (spiller.historik && spiller.historik.length > 1) {
                spiller.tidligereHistorik = [...(spiller.tidligereHistorik || []), spiller.historik];
            }
            spiller.historik = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].dag = 1; 
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].besoegteMiner = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].harSkattekort = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].aktivTracker = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].trackedeSpillere = [];
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
        
        spilTilstand.historik = [];
        spilTilstand.historik.push(spilTilstand.spillerIndex);

        afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
        
        if (spilTilstand.erHost && !spilTilstand.offlineMode) {
            const { data, error } = await medTimeout(
                supabase.from('spil_sessioner').select('rum_kode').eq('rum_kode', spilTilstand.rumKode).maybeSingle()
            );
            if (error) {
                spilTilstand.statusBesked = `Øen kunne ikke oprettes: ${error.message}`;
                spilTilstand.gameState = 'start';
                return;
            }

            if (!data) {
                const { error: insertError } = await medTimeout(supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: spilTilstand.gitter,
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0
                }]));

                if (insertError) {
                    spilTilstand.statusBesked = `Øen kunne ikke oprettes: ${insertError.message}`;
                    spilTilstand.gameState = 'start';
                    return;
                }
            }
        }
        
        await syncTilDb(true);
        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        spilTilstand.logBesked = `Du er drevet i land på kysten af ${formaterOeNavn()}. Tågen ligger bag dig og venter på at omslutte dig. Du må prøve at finde en båd på den anden side af ${formaterOeNavn()}.`;
        spilTilstand.gameState = 'play';
        introAktiv = true;
    }

    function afslutIntro() {
        introAktiv = false;
        requestAnimationFrame(() => {
            cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        });
    }

    function formaterOeNavn() {
        const navn = spilTilstand.rumKode || 'øen';
        return navn.charAt(0).toUpperCase() + navn.slice(1);
    }

    function lukEventOgShop() {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        const lukkedeShop = !!spilTilstand.aktivShop;
        
        if (felt && eventState.aktivt && felt.eventID !== 'campfire' && felt.eventID !== 'meteor_skat' && felt.eventID !== 'stjernekald') {
            felt.eventFuldført = true;
        }
        
        motorLukEvent();
        spilTilstand.aktivShop = null;
        
        if (felt && felt.hasPortal && !lukkedeShop) {
            udfoerPortalTeleport();
        } else {
            syncTilDb(!lukkedeShop);
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

    function findAktivSpillerForBruger() {
        if (spilTilstand.offlineMode) return null;
        const brugerId = authState.user?.id;
        if (!brugerId) return null;

        const fundet = Object.entries(spilTilstand.alleSpillere).find(([, spiller]) => {
            return spiller.userId === brugerId && !spiller.isDead && !spiller.isWinner;
        });

        return fundet ? { navn: fundet[0], spiller: fundet[1] } : null;
    }

    async function medTimeout<T>(kald: PromiseLike<T>, ms = 12000): Promise<T> {
        let timer: ReturnType<typeof setTimeout>;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('timeout')), ms);
        });

        return Promise.race([kald, timeout]).finally(() => clearTimeout(timer));
    }

function udførBevægelse(nytIndeks: number) {
    if (flytterNu || !spilTilstand.valgtKarakter) return;

    flytterNu = true;
    udfoerBevaegelse(nytIndeks, {
        erITaagen: erITågen,
        langsomsteDag: hentLangsomsteDag(),
        maxDageForan: MAX_DAGE_FORAN,
        synsRadius: aktuelSynsRadius,
        onKameraFoelg: (indeks) => cam.foelgSpiller(indeks, BREDDE, HEX_W, ROW_H),
        onBaadStart: (indeks) => {
            sejlendeBaadIndex = indeks;
        }
    });

    setTimeout(() => flytterNu = false, 200);
}

    function flytHex(retning: string) {
        if (introAktiv || spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
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
        if (introAktiv || spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
        if (spilTilstand.gameState === 'play' && hentNaboIndices(spilTilstand.spillerIndex).includes(nytIndeks)) udførBevægelse(nytIndeks);
    }
</script>

<svelte:window onkeydown={håndterTastatur} />

{#if spilTilstand.gameState === 'play'}
    <BottomUI />
{/if}

<Skaerme 
    {opretEllerDeltag}
    {startSolo}
    {fortsaetOfflineSolo}
    {bekræftValg} 
    {genstartBane} 
    {nulstilHukommelse}
    {lokaleScores} 
    {globaleScores}
    {nyGlobalRekord}
    {harGemtOfflineSpil}
    {offlineSpilInfo}
    {gemScoreIgen}
    {scoreGemmer}
    {scoreGemningFejlet}
/>

{#if spilTilstand.gameState === 'play'}
    <div class="game-help-actions">
        <Regelbog />
        <LydKnap />
    </div>
{/if}

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
                {@const erOpslugt = erFeltITaagen(spilTilstand.gitter, i, spilTilstand.fogX)}
                {@const vistBiome = felt.katastrofeVisuelAktiv && felt.katastrofeFraBiome ? felt.katastrofeFraBiome : felt.biome}
                {@const baggrund = !erUdforsket ? 'none' : erOpslugt ? `url('/tiles/${vistBiome}_taage.webp')` : `url('/tiles/${vistBiome}.webp')`}

                <div class="hex" class:active={spilTilstand.spillerIndex === i} class:unexplored={!erUdforsket}
                    class:katastrofe-venter={!!felt.katastrofeVisuelAktiv}
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
                            {#each Array.from({ length: Math.min(felt.boatCount || 1, 4) }, (_ignore, index) => index) as baadNr (baadNr)}
                                <img src="/tiles/baad.webp" alt="Flugtbåd" class="escape-boat boat-{baadNr}" />
                            {/each}
                            {#if (felt.boatCount || 1) > 4}
                                <span class="boat-count">×{felt.boatCount}</span>
                            {/if}
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.afgroede && felt.biome === 'mark'}                            
                            {@const nuBlok = hentAfgroedeBlok(spilTilstand.dag)}
                            {@const erModen = erAfgroedeModen(felt, nuBlok)}
                            {@const erPlageramt = aktivInsektPlageBlok === nuBlok && erModen}
                            {@const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok}
                            {@const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok}

                            {#if erSmadret}
                                <img src="/tiles/{felt.afgroede === 'hvede' ? 'brokenwheat.webp' : 'brokenbean.webp'}" class="crop-icon" alt="" />
                            {:else if !erHoestet && !erPlageramt}
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

                        {#if erUdforsket && !erOpslugt && felt.taageBlokker}
                            <img src="/tiles/blokker.webp" class="taageblokker-icon" class:taageblokker-inaktiv={spilTilstand.fogX < 0} alt="Tågeblokker" />
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

                        {#if erUdforsket && !erOpslugt && felt.indbrudt}
                            <span class="indbrud-marker" aria-label="Indbrudt">
                                <img src="/tiles/openlock.webp" alt="" class="indbrud-icon" />
                            </span>
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
                                {@const tracket = erTrackerAktivPaa(navn)}
                                {@const synlig = afstand <= aktuelSynsRadius || tracket}
                                <span class="modstander-icon" class:alarm-aktiv={mod.activeAlarm && !synlig} class:skjult-lyd={!synlig && !mod.activeAlarm} class:tracker-aktiv={tracket}>
                                    <img src={synlig ? (mod.ikon || '/tiles/player.webp') : '/tiles/player.webp'} alt="" style="height: {synlig ? '58px' : '70px'};" />
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
                        {#if navn === spilTilstand.spillerNavn}
                            {#each data.tidligereHistorik || [] as gammelRute, ruteIndex (`${navn}-${ruteIndex}`)}
                                {#if gammelRute.length > 1}
                                    {@const oldPointsArray = gammelRute.map((idx: number) => {
                                        const raekke = Math.floor(idx / BREDDE);
                                        const kolonne = idx % BREDDE;
                                        const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2);
                                        const posY = raekke * ROW_H + 55;
                                        return {x: posX, y: posY};
                                    })}
                                    {@const oldPoints = oldPointsArray.map(p => `${p.x},${p.y}`).join(' ')}

                                    <polyline
                                        points={oldPoints}
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.22)"
                                        stroke-width="2.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="flugtrute-gammel"
                                    />
                                {/if}
                            {/each}
                        {/if}

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
                                stroke={erMig ? '#ffffff' : 'rgba(230, 230, 230, 0.55)'} 
                                stroke-width={erMig ? "6" : "4"}
                                stroke-linecap="round"
                                stroke-linejoin="round"
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

{#if introAktiv}
    <div class="intro-overlay">
        <div class="intro-box">
            <div class="intro-media">
                <video autoplay muted loop playsinline poster="/video/intro-boat.webp" aria-label="Båden synker i tågen">
                    <source src="/video/intro-boat.mp4" type="video/mp4" />
                    <img src="/video/intro-boat.webp" alt="Båden synker i tågen" />
                </video>
                <div class="intro-taage"></div>
            </div>
            <h2>Dag 1</h2>
        <p>
            Du er drevet i land på kysten af {formaterOeNavn()}. Tågen ligger bag dig og venter
            på at omslutte dig. Du må prøve at finde en båd på den anden side af {formaterOeNavn()}.
        </p>
            <button type="button" class="intro-knap" onclick={afslutIntro}>Gå i land</button>
        </div>
    </div>
{/if}

{#if eventState.aktivt} <EventModal lukEvent={lukEventOgShop} /> {/if}
{#if spilTilstand.aktivShop} <ShopModal lukShop={lukEventOgShop} /> {/if}
{#if spilTilstand.venteSpilAktiv} <VenteModal kanSpilleIgen={spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN} /> {/if}

{#if spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win_map'}
    <div class="slut-panel" class:vundet={spilTilstand.gameState === 'win_map'}>
        <div class="slut-header">
            <h2>{spilTilstand.gameState === 'win_map' ? 'Du slap væk' : 'Du døde'}</h2>
            <p>{spilTilstand.logBesked}</p>
        </div>
        
        <div class="rangliste">
            {#each Object.entries(spilTilstand.alleSpillere).sort((a, b) => (b[1].score || 0) - (a[1].score || 0)) as [navn, data] (navn)}
                <div class="raekke" class:mig={navn === spilTilstand.spillerNavn}>
                    <img src={data.ikon || '/tiles/player.webp'} alt="" />
                    <div class="info">
                        <strong>{navn}</strong>
                        <span>{data.isWinner ? 'Sluppet væk' : (data.isDead ? 'Død' : 'I tågen')}</span>
                    </div>
                    <div class="stats">
                        <span title="Guld">🪙 {data.guld}</span>
                    </div>
                </div>
            {/each}
        </div>

        <button class="log-ikon-btn" onclick={() => visDoedsLog = true} title="Læs din fulde log">
            <img src="/ui/log_ikon.webp" alt="Log" />
            <span>Logbog</span>
        </button>

        <button class="se-resultat-btn" onclick={() => spilTilstand.gameState = spilTilstand.gameState === 'win_map' ? 'win' : 'dead'}>
            Se point-fordeling
        </button>

    </div>
{/if}

{#if visDoedsLog}
    <div class="log-modal-overlay" onclick={() => visDoedsLog = false} role="presentation">
        <div class="log-modal" onclick={(e) => e.stopPropagation()} role="presentation">
            <h3>Logbog</h3>
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
    :global(:root) { --camera-center-y: 50dvh; }
    @media (max-width: 700px) {
        :global(:root) { --camera-center-y: calc((100dvh - 128px) / 2); }

        .intro-box {
            padding: 16px;
        }

        .intro-box h2 {
            font-size: 1.5rem;
        }

        .intro-box p {
            font-size: 0.95rem;
        }

        .game-help-actions {
            top: 10px;
            right: 10px;
        }
    }

    .game-container { position: fixed; inset: 0; width: 100vw; height: 100dvh; overflow: hidden; background: #000; }
    .game-help-actions {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 14px);
        right: 14px;
        z-index: 2100;
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .camera { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
    .map { position: absolute; top: 0; left: 0; }

    .intro-overlay {
        position: fixed;
        inset: 0;
        z-index: 2600;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.92);
        font-family: system-ui, -apple-system, sans-serif;
    }
    .intro-box {
        width: min(760px, 92vw);
        max-height: 92dvh;
        overflow-y: auto;
        background: #151515;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        padding: 24px;
        box-sizing: border-box;
        text-align: center;
        color: white;
    }
    .intro-media {
        position: relative;
        overflow: hidden;
        border-radius: 6px;
        background: #050706;
        margin-bottom: 20px;
    }
    .intro-media video,
    .intro-media img {
        width: min(560px, 100%);
        aspect-ratio: 16 / 9;
        display: block;
        margin: 0 auto;
        object-fit: cover;
        filter: saturate(0.9) contrast(0.98);
    }
    .intro-taage {
        position: absolute;
        inset: 0;
        background:
            linear-gradient(90deg, rgba(176, 205, 186, 0.25), transparent 35%, rgba(19, 24, 22, 0.75)),
            radial-gradient(circle at 15% 45%, rgba(195, 230, 208, 0.38), transparent 32%);
        animation: introTaage 5s ease-in-out infinite alternate;
        pointer-events: none;
    }
    .intro-box h2 {
        margin: 0 0 12px;
        font-family: 'Cinzel', serif;
        font-size: 2rem;
    }
    .intro-box p {
        max-width: 620px;
        margin: 0 auto 22px;
        color: #ddd;
        line-height: 1.55;
        font-size: 1.05rem;
    }
    .intro-knap {
        min-width: 180px;
        padding: 12px 20px;
        border: 1px solid #777;
        border-radius: 6px;
        background: #2a2a2a;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
    }
    .intro-knap:hover {
        background: #383838;
    }

    @keyframes introTaage {
        from { opacity: 0.45; transform: translateX(-7%); }
        to { opacity: 0.85; transform: translateX(7%); }
    }
    .hex { 
        position: absolute; width: 96px; height: 110px;
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); 
        background-size: cover;
    }
    .hex.katastrofe-venter {
        filter: brightness(0.9) saturate(0.85);
    }
    .hex.katastrofe-venter::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 30;
        pointer-events: none;
        background: radial-gradient(circle at 50% 50%, rgba(255, 240, 180, 0.18), rgba(0, 0, 0, 0) 62%);
        animation: feltVenterKatastrofe 0.9s ease-in-out infinite alternate;
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
    .taageblokker-icon {
        position: absolute;
        width: 54px;
        height: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 14;
        pointer-events: none;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.8)) saturate(0.8);
        opacity: 0.92;
    }
    .taageblokker-icon.taageblokker-inaktiv {
        filter: grayscale(1) brightness(0.65) drop-shadow(0 3px 6px rgba(0,0,0,0.8));
        opacity: 0.55;
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
    .escape-boat.boat-1 { transform: translate(-68%, -54%) scale(0.88) rotate(-7deg); z-index: 14; }
    .escape-boat.boat-2 { transform: translate(-32%, -47%) scale(0.88) rotate(7deg); z-index: 16; }
    .escape-boat.boat-3 { transform: translate(-50%, -28%) scale(0.78) rotate(2deg); z-index: 13; }
    .boat-count {
        position: absolute;
        left: 57%;
        top: 62%;
        z-index: 17;
        color: #fff6d8;
        font-family: 'Cinzel', serif;
        font-weight: 800;
        font-size: 1rem;
        text-shadow: 0 2px 5px #000, 0 0 8px #000;
        pointer-events: none;
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
    .flugtrute { animation: tegnRute 3s linear forwards; filter: drop-shadow(0 0 5px rgba(255,255,255,0.4)); }
    .flugtrute-gammel { pointer-events: none; }
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
    .indbrud-marker {
        position: absolute;
        width: 74px;
        height: 74px;
        left: 50%;
        top: 64%;
        z-index: 17;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 239, 176, 0.72) 0%, rgba(255, 191, 74, 0.34) 48%, rgba(0, 0, 0, 0) 72%);
        filter: drop-shadow(0 5px 6px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 10px rgba(255, 220, 130, 0.7));
        transform: translate(-50%, -50%) rotate(-10deg);
    }
    .indbrud-icon {
        width: 58px;
        height: 58px;
        opacity: 0.98;
        filter: brightness(1.18) contrast(1.18);
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
    .tracker-aktiv img {
        filter: drop-shadow(0 0 8px rgba(126, 214, 255, 0.95)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.9));
    }
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
    :global(body.katastrofe-lys)::after {
        content: '';
        position: fixed;
        inset: 0;
        z-index: 6000;
        pointer-events: none;
        background:
            radial-gradient(circle at 50% 45%, rgba(255, 245, 205, 0.22), rgba(255, 245, 205, 0) 34%),
            rgba(255, 255, 255, 0.08);
        animation: katastrofeGlimt 0.55s ease-out both;
    }
    @keyframes rystelse { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 10%, 30%, 50%, 70%, 90% { transform: translate(-12px, 8px) rotate(-1.5deg); } 20%, 40%, 60%, 80% { transform: translate(12px, -8px) rotate(1.5deg); } }
    @keyframes katastrofeGlimt { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }
    @keyframes feltVenterKatastrofe { from { opacity: 0.18; } to { opacity: 0.65; } }
</style>
