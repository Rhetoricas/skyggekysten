<script lang="ts">
    import { onMount, onDestroy, untrack } from 'svelte';
    import { SvelteSet } from 'svelte/reactivity';
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import type { RealtimeChannel } from '@supabase/supabase-js';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { authState, initAuth } from '$lib/auth.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { M10_SCORE, beregnSpillerScore } from '$lib/score';
    import { hentHighscores, gemHighscore, syncTilDb, startRealtime, stopRealtime, hentGlobalTopHundrede, flushVentendeSync, annullerVentendeNetvaerkSync, realtimeRumNoegle, retryVentendeHighscores, gemAfsluttetSpillerISession, opdaterHighscoreMedalje } from '$lib/netvaerk';
    import { harOfflineSpil, hentOfflineSpilInfo, indlaesOfflineSpil, sletOfflineSpil } from '$lib/offlineStorage';
    import { hvil, hentNaboIndices, hentNaboIRetning, afslørOmraade, initialiserGitter, tilfoejTilRygsæk, regnHexAfstand, udfoerPortalTeleport, nulstilKort, udloesOversvoemmelse, udloesJordskaelv, udfoerBevaegelse, erTrackerAktivPaa, opdaterTrackerSyn, tjekAutoTracker, anvendFaellesEventEffekt, saetKortDimensioner } from '$lib/spilmotor';
    import { grav } from '$lib/undergrund.svelte';
    import { erSpillerITaagen } from '$lib/overlevelse.svelte';    
    import { eventState, startEvent, lukEvent as motorLukEvent } from '$lib/eventMotor.svelte';
    import { erFriskAktivSpiller } from '$lib/aktivSpiller';
    import {
        BREDDE,
        HOEJDE,
        HEX_W,
        ROW_H,
        tilgaengeligeKarakterer,
        itemDB,
        hentKarakterKlasseNoegle
    } from '$lib/spildata';
    import { vaelgStandardKortDimensioner } from '$lib/kortDimensioner';
    import { KORT_VERSION, kortPixelBredde, kortPixelHoejde } from '$lib/kortDimensioner';
    import { erStandardOeNavn } from '$lib/oeNavne';
    import type { Felt, GravstenMinde, Karakter, SpillerData } from '$lib/types';
    import { eventBibliotek } from '$lib/eventBibliotek';
    import { erAfgroedeModen, hentAfgroedeBlok, hentInsektPlageBlok } from '$lib/afgroeder';
    import { erFeltITaagen } from '$lib/taage';

    import Skaerme from './Skaerme.svelte';
    import ShopModal from '$lib/ShopModal.svelte';
    import WorkshopModal from '$lib/WorkshopModal.svelte';
    import EventModal from '$lib/EventModal.svelte';
    import VenteModal from '$lib/VenteModal.svelte';
    import BottomUI from './BottomUI.svelte';
    import Regelbog from '$lib/Regelbog.svelte';
    import LydKnap from '$lib/LydKnap.svelte';
    import { hentLydVolumen, lydKontrol } from '$lib/lydKontrol.svelte';
    import { erVenteTidUdlobet, lukVenteSpil } from '$lib/ventespil.svelte';

    const cam = skabKamera();
    const MAX_DAGE_FORAN = 5;
    const SESSION_SELECT = 'rum_kode,kort,start_index,spillere,fog_x,kort_bredde,kort_hoejde,kort_version';
    const START_AUTO_REFRESH_MS = 10000;
    const START_AUTO_REFRESH_KEY = 'taage_pending_start';

    let lokaleScores = $state<Array<{ navn: string; score: number; karakter?: string }>>([]);
    let klasseScores = $state<Array<{ id?: number; spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);
    let globaleScores = $state<Array<{ id?: number; spillerNavn: string; oeNavn: string; point: number; karakter?: string }>>([]);    
    
    let flytterNu = false;
    let sejlendeBaadIndex = $state<number | null>(null);
    let visDoedsLog = $state(false);
    let langsomtKamera = $state(false);
    let sidsteKikkertMode = '';
    let ruteOverblikState = '';
    let venteUrTick = $state(Date.now());
    let sidstAutoUdfyldtProfilNavn = '';

    function aktuelHighscoreKlasse() {
        return hentKarakterKlasseNoegle(spilTilstand.valgtKarakter);
    }

    type PendingStart = {
        navn: string;
        rumKode: string;
        refreshes: number;
        startet: number;
    };

    function laesPendingStart() {
        if (!browser) return null;
        try {
            const gemt = sessionStorage.getItem(START_AUTO_REFRESH_KEY);
            return gemt ? JSON.parse(gemt) as PendingStart : null;
        } catch {
            return null;
        }
    }

    function gemPendingStart(navn: string, rumKode: string, refreshes = 0) {
        if (!browser) return;
        sessionStorage.setItem(START_AUTO_REFRESH_KEY, JSON.stringify({
            navn,
            rumKode,
            refreshes,
            startet: Date.now()
        } satisfies PendingStart));
    }

    function rydPendingStart() {
        if (!browser) return;
        sessionStorage.removeItem(START_AUTO_REFRESH_KEY);
    }

    function erForbindelsesStatus() {
        return spilTilstand.statusBesked === 'Forbinder dig til øen...' ||
            spilTilstand.statusBesked === 'Øen svarer langsomt. Prøver igen...';
    }

    function planlaegAutoRefreshVedStart(navn: string, rumKode: string) {
        if (!browser) return null;

        return window.setTimeout(() => {
            const pending = laesPendingStart();
            if (!pending || pending.navn !== navn || pending.rumKode !== rumKode) return;
            if (spilTilstand.gameState !== 'start' || !erForbindelsesStatus()) return;

            if (pending.refreshes >= 1) {
                spilTilstand.statusBesked = 'Forbindelsen hænger stadig. Prøv igen eller refresh siden manuelt.';
                return;
            }

            gemPendingStart(navn, rumKode, pending.refreshes + 1);
            window.location.reload();
        }, START_AUTO_REFRESH_MS);
    }

    let ruteArkivForNaesteTur = $state<Record<string, number[][]>>({});
    let introAktiv = $state(false);
    let sidstePinchAfstand = 0;
    let inspectAktiv = $state(false);
    let inspectBoble = $state<{ titel: string; tekst: string; x: number; y: number } | null>(null);
    
    let harDetektor = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'metaldetektor' || ting.id === 'malmviser') ?? false);
    let harMalmviser = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'malmviser') ?? false);
    let harRunekvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'runekvist') ?? false);
    let harKvist = $derived(spilTilstand.mitUdstyr?.some((ting) => ting.id === 'soegekvist' || ting.id === 'runekvist') ?? false);
    let aktuelSynsRadius = $derived(Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));
    let pejleRadius = $derived(3);
    let erITågen = $derived(erSpillerITaagen());
    let rensedeLogLinjer = $derived(spilTilstand.logHistorik.filter(linje => linje.includes(' - ')));
    let aktivInsektPlageBlok = $derived(hentInsektPlageBlok(spilTilstand.gitter));
    let kortBredde = $derived(spilTilstand.kortBredde || BREDDE);
    let kortHoejde = $derived(spilTilstand.kortHoejde || HOEJDE);
    const erLocalhost = () => browser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

    const SKATTEKORT_STOP_AFSTAND = 200;
    const SKATTEKORT_MIN_LINJE_LAENGDE = 40;

    let harSkattekortAktivt = $derived((spilTilstand.mineSkattekortFelter?.length || 0) > 0);
    function hexMidtpunkt(index: number) {
        const raekke = Math.floor(index / kortBredde);
        const kolonne = index % kortBredde;
        return {
            x: kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2),
            y: raekke * ROW_H + 55
        };
    }

    function findSkatteKlyngeCenter(klynge: number[]) {
        const klyngeSet = new Set(klynge);
        return klynge.find((index) => hentNaboIndices(index).filter((nabo) => klyngeSet.has(nabo)).length === 6)
            ?? klynge[Math.floor(klynge.length / 2)];
    }

    function erSkatteKlyngeAfsluttet(klynge: number[]) {
        return klynge.some((index) =>
            (spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(index)) &&
            !!spilTilstand.gitter[index]?.tomSkattekiste
        );
    }

    function hentAktiveSkattekortKlynger() {
        const felter = (spilTilstand.mineSkattekortFelter || [])
            .filter((index) => spilTilstand.gitter[index]?.isSkatteKlynge);

        const klynger = new Map<number, number[]>();
        for (const index of felter) {
            const id = spilTilstand.gitter[index]?.skatId ?? index;
            klynger.set(id, [...(klynger.get(id) || []), index]);
        }

        return Array.from(klynger.entries())
            .map(([id, klynge]) => ({
                id,
                klynge,
                center: findSkatteKlyngeCenter(klynge)
            }))
            .filter(({ klynge }) => !erSkatteKlyngeAfsluttet(klynge));
    }

    let aktiveSkattekortFelter = $derived.by(() =>
        hentAktiveSkattekortKlynger().flatMap(({ klynge }) => klynge)
    );

    function forskydPunktMod(
        fra: { x: number; y: number },
        til: { x: number; y: number },
        afstand: number
    ) {
        const dx = til.x - fra.x;
        const dy = til.y - fra.y;
        const laengde = Math.hypot(dx, dy);
        if (laengde <= afstand || laengde === 0) return fra;
        return {
            x: fra.x + (dx / laengde) * afstand,
            y: fra.y + (dy / laengde) * afstand
        };
    }

    function lavSkattekortLinje(fra: { x: number; y: number }, centerIndex: number, startForskydning = 0) {
        const center = hexMidtpunkt(centerIndex);
        const start = startForskydning > 0 ? forskydPunktMod(fra, center, startForskydning) : fra;
        const dx = center.x - start.x;
        const dy = center.y - start.y;
        const laengde = Math.hypot(dx, dy);
        const linjeLaengde = Math.min(
            laengde,
            Math.max(SKATTEKORT_MIN_LINJE_LAENGDE, laengde - SKATTEKORT_STOP_AFSTAND)
        );
        const fremdrift = laengde === 0 ? 0 : linjeLaengde / laengde;

        return {
            fra: start,
            til: {
                x: start.x + dx * fremdrift,
                y: start.y + dy * fremdrift
            }
        };
    }

    let skattekortLinjer = $derived.by(() => {
        if (!harSkattekortAktivt || spilTilstand.spillerIndex < 0) return [];

        const klynger = [...hentAktiveSkattekortKlynger()];
        const sorteret = [];
        let kildeIndex = spilTilstand.spillerIndex;

        while (klynger.length > 0) {
            klynger.sort((a, b) =>
                regnHexAfstand(kildeIndex, a.center, kortBredde) -
                regnHexAfstand(kildeIndex, b.center, kortBredde)
            );
            const naeste = klynger.shift();
            if (!naeste) break;
            sorteret.push(naeste);
            kildeIndex = naeste.center;
        }

        let fra = hexMidtpunkt(spilTilstand.spillerIndex);
        return sorteret.map((klynge, index) => {
            const linje = {
                id: klynge.id,
                ...lavSkattekortLinje(fra, klynge.center, index === 0 ? 34 : 0)
            };
            fra = linje.til;
            return linje;
        });
    });

    let baadLinjer = $derived.by(() => {
        if (spilTilstand.spillerIndex < 0) return [];

        const fra = hexMidtpunkt(spilTilstand.spillerIndex);
        return spilTilstand.gitter
            .map((felt, index) => ({ felt, index }))
            .filter(({ felt, index }) =>
                !!felt.hasBoat &&
                (felt.boatCount || 1) > 0 &&
                (spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(index))
            )
            .map(({ index }) => ({
                id: index,
                fra,
                til: hexMidtpunkt(index)
            }));
    });

    const biomeForklaringer: Record<string, string> = {
        mark: 'Mark kan graves og kan senere have afgrøder. Gravefund er ofte små: lidt guld, rod, sjælden fælde eller fakkel.',
        eng: 'Eng er et let naturfelt. Det kan graves og har små chancer for guld, rod, fælde eller fakkel.',
        skov: 'Skov kan give gode helende rødder ved gravning og har en lille chance for livseliksir.',
        bjerg: 'Bjerg er tungt terræn for mange karakterer. Ved gravning finder du ofte guld, men også fælder og fakler.',
        hule: 'Hule er farligt terræn. Gravefund kan være værdifulde, men fælder og livseliksir er også i puljen.',
        ritual: 'Ritualfelt er farligt og event-tungt. Gravning kan give guld, rod, fælde eller livseliksir.',
        ruin: 'Ruin er farligt, men rigt. Gravning kan give mere guld og har også risiko for fælder.',
        bandit: 'Banditlejr er risikabel. Gravning giver ofte guld, men der er også stor fælderisiko.',
        hoejland: 'Højland er åbent terræn. Gravning kan give guld, rod, en lille fælderisiko eller fakkel.',
        blodskov: 'Blodskov er farligt og uroligt. Gravefund ligner andre farlige biomer: guld, rod, fælder og livseliksir.',
        by: 'Byer kan have butikker, værksteder og indbrudsmuligheder. Spillere med kølle kan smadre dem til ruiner. Du kan normalt ikke grave her.',
        hav: 'Hav er farligt uden båd. Du tager skade i åbent vand, og almindelig rustning, kongepanser og fakler går tabt i vandet. Hvis du kollapser i vandet, drukner du, medmindre en livseliksir redder dig først.',
        soe: 'Sø er indlandsvand. Den er farlig uden båd ligesom hav. Den er ikke kyst, men pirater har lidt lettere ved den.',
        krystal: 'Krystalfelter er farlige og sjældne. Gravning kan give små guldfund, fælder eller diamanter. Stave viser krystalfelter i nærheden, når du står på krystal.',
        marked: 'Markeder kan have butikker. Spillere med kølle kan smadre dem til ruiner. Du kan normalt ikke grave her.',
        slagmark: 'Slagmark er et farligt gravefelt med guld, rødder, fælder og livseliksir.',
        meteor: 'Meteor-felter styres af meteor-eventet. Kig efter meteorstenen og eventet på feltet.'
    };
    
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
            bgMusik.volume = Math.min(0.3, hentLydVolumen());
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
        const niveau = lydKontrol.niveau;
        if (bgMusik) bgMusik.volume = Math.min(0.3, hentLydVolumen());
        void niveau;
    });

    $effect(() => {
        const state = spilTilstand.gameState;
        
        untrack(() => {
            if (state === 'play') {
                scoreErGemt = false;
                scoreGemmer = false;
                scoreGemningFejlet = false;
                nyGlobalRekord = false;
            } else if (
                state === 'win' || state === 'dead' || state === 'win_map' || state === 'dead_map'
            ) {
                opdaterSamletScore();

                if (
                    !scoreErGemt &&
                    !scoreGemmer &&
                    !scoreGemningFejlet
                ) {
                    gemScoreIgen();
                }
            }
        });
    });

    $effect(() => {
        const tjekFokus = () => {
            if (!document.hidden && spilTilstand.gameState === 'play' && spilTilstand.kameraFokus === null) {
                cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
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
                cam.centrerPåHex(fokus, kortBredde, HEX_W, ROW_H);
                spilTilstand.kameraFokus = null;
                
                setTimeout(() => {
                    if (spilTilstand.gameState === 'play') {
                        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
                        setTimeout(() => langsomtKamera = false, 1500);
                    } else {
                        langsomtKamera = false;
                    }
                }, 2000);
            });
        }
    });

    $effect(() => {
        const aktueltIndex = spilTilstand.spillerIndex;
        if (spilTilstand.gameState === 'play' && spilTilstand.kameraFokus === null && !langsomtKamera) {
            untrack(() => {
                cam.foelgSpiller(aktueltIndex, kortBredde, HEX_W, ROW_H);
            });
        }
    });

    $effect(() => {
        const kikkertMode = spilTilstand.mitUdstyr?.some(i => i.id === 'kikkert_250')
            ? 'kikkert_250'
            : spilTilstand.mitUdstyr?.some(i => i.id === 'kikkert_45')
                ? 'kikkert_45'
                : '';

        if (kikkertMode === sidsteKikkertMode) return;
        sidsteKikkertMode = kikkertMode;

        if (spilTilstand.gameState !== 'play' || !kikkertMode) return;

        untrack(() => {
            setTimeout(() => {
                if (spilTilstand.gameState === 'play') {
                    cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
                }
            }, 0);
        });
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
        const venteAktiv = spilTilstand.venteSpilAktiv;
        const state = spilTilstand.gameState;
        const dag = spilTilstand.dag;
        const ur = venteUrTick;
        const iTaagen = erITågen;
        const spillereStatus = Object.values(spilTilstand.alleSpillere)
            .map((spiller) => `${spiller.dag || 1}:${spiller.sidstAktiv || 0}:${spiller.isDead ? 1 : 0}:${spiller.isWinner ? 1 : 0}:${spiller.rundeSeed || ''}`)
            .join('|');
        void dag;
        void ur;
        void iTaagen;
        void spillereStatus;

        if (!venteAktiv || state !== 'play') return;

        untrack(() => {
            if (!spilTilstand.venteStartTid) spilTilstand.venteStartTid = ur;
            const erMidtIRunde = spilTilstand.venteFase === 'spiller' || spilTilstand.venteFase === 'viser_gevinst';
            const langsomsteHarIndhentet = spilTilstand.dag <= hentLangsomsteDag();
            const impensTidErGaaet = erVenteTidUdlobet(ur);
            if (iTaagen) {
                const puljeGuld = spilTilstand.ventePuljeGuld;
                const puljeLiv = spilTilstand.ventePuljeLiv;
                lukVenteSpil();
                spilTilstand.logBesked = puljeGuld > 0 || puljeLiv > 0
                    ? `Tågen vælter ind over lejren. Impen river kortene til sig og forsvinder. Du tager ${puljeGuld} guld og ${puljeLiv} HP med fra bordet.`
                    : 'Tågen vælter ind over lejren. Impen river kortene til sig og forsvinder.';
                return;
            }
            if (!erMidtIRunde && (langsomsteHarIndhentet || impensTidErGaaet)) {
                const puljeGuld = spilTilstand.ventePuljeGuld;
                const puljeLiv = spilTilstand.ventePuljeLiv;
                const aarsag = langsomsteHarIndhentet ? 'De andre har indhentet dig.' : 'Impen pakker bordet sammen.';
                lukVenteSpil();
                spilTilstand.logBesked = puljeGuld > 0 || puljeLiv > 0
                    ? `${aarsag} Du tager ${puljeGuld} guld og ${puljeLiv} HP med fra bordet.`
                    : `${aarsag} Du kan spille videre.`;
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
        const raekke = Math.floor(index / kortBredde);
        const kolonne = index % kortBredde;
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
            cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
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

    function ruteArkivNoegle(navn = spilTilstand.spillerNavn) {
        return navn.trim().toLowerCase();
    }

    function ruteSignatur(rute: number[]) {
        return rute.join(',');
    }

    function samlTidligereRuter(spiller?: SpillerData | null) {
        const ruter = [...(spiller?.tidligereHistorik || [])];
        if ((spiller?.historik?.length || 0) > 1) {
            ruter.push(spiller!.historik!);
        }
        return ruter.filter((rute) => rute.length > 1);
    }

    function samlUnikkeRuter(...ruteLister: Array<number[][] | undefined>) {
        const set = new Set<string>();
        const ruter: number[][] = [];

        for (const liste of ruteLister) {
            for (const rute of liste || []) {
                if (rute.length <= 1) continue;
                const signatur = ruteSignatur(rute);
                if (set.has(signatur)) continue;
                set.add(signatur);
                ruter.push(rute);
            }
        }

        return ruter;
    }

    function arkiverRuterForNaesteTur(navn: string, spiller?: SpillerData | null) {
        const noegle = ruteArkivNoegle(navn);
        const ruter = samlUnikkeRuter(ruteArkivForNaesteTur[noegle], samlTidligereRuter(spiller));
        if (ruter.length > 0) {
            ruteArkivForNaesteTur = { ...ruteArkivForNaesteTur, [noegle]: ruter };
        }
        return ruter;
    }

    function hentArkiveredeRuter(navn = spilTilstand.spillerNavn) {
        return ruteArkivForNaesteTur[ruteArkivNoegle(navn)] || [];
    }

    function genererRundeSeed() {
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
        return `${spilTilstand.rumKode || 'oe'}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`;
    }

    function hentAktivRundeSeedFraSpillere() {
        return Object.values(spilTilstand.alleSpillere)
            .find((spiller) => !spiller.isDead && !spiller.isWinner && !!spiller.rundeSeed)
            ?.rundeSeed || '';
    }

    function overtagAktivRundeSeed() {
        const seed = hentAktivRundeSeedFraSpillere();
        if (seed) spilTilstand.rundeSeed = seed;
        return seed;
    }

    function overtagRundeSeedVedIndgang(rentNavn: string, browserId: string) {
        const egenEntry = Object.entries(spilTilstand.alleSpillere).find(([navn, spiller]) =>
            navn.toLowerCase() === rentNavn.toLowerCase() &&
            !!spiller.rundeSeed &&
            (erSammeSpiller(spiller, browserId) || !spiller.isDead && !spiller.isWinner)
        );
        if (egenEntry?.[1].rundeSeed) {
            spilTilstand.rundeSeed = egenEntry[1].rundeSeed;
            return egenEntry[1].rundeSeed;
        }

        return overtagAktivRundeSeed();
    }

    function startNyRundeSeed() {
        spilTilstand.rundeSeed = genererRundeSeed();
        return spilTilstand.rundeSeed;
    }

    function sikrRundeSeed() {
        if (overtagAktivRundeSeed()) return spilTilstand.rundeSeed;
        if (!spilTilstand.rundeSeed) return startNyRundeSeed();
        return spilTilstand.rundeSeed;
    }

    let kameraStyle = $derived(`
        transform-origin: ${cam.x}px ${cam.y}px;
        transform: translate(calc(50vw - ${cam.x}px), calc(var(--camera-center-y, 50dvh) - ${cam.y}px)) scale(${cam.zoomLevel});
        transition: ${cam.isDragging ? 'none' : (langsomtKamera ? 'transform 1.5s ease-in-out' : 'transform 0.3s ease-out')};
        width: ${kortPixelBredde(kortBredde)}px;
        height: ${kortPixelHoejde(kortHoejde)}px;
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
        const standardBiomer = ['mark', 'eng', 'skov', 'bjerg', 'hule', 'ritual', 'ruin', 'bandit', 'blodskov', 'by', 'hav', 'soe', 'krystal', 'marked', 'slagmark', 'meteor'];
        const billederTilPreload = [
            '/tiles/byshop.webp', '/tiles/markedshop.webp', '/tiles/udgravning.webp', '/tiles/empty_treasure.webp', '/tiles/treasuremark.webp',
            '/tiles/event.png', '/tiles/campfire.webp', '/events/ev_campfire.webp', '/tiles/guldtaage.webp', '/tiles/livtaage.webp',
            '/inventory/hp.webp', '/inventory/guld.webp', '/tiles/player.webp', '/tiles/energi_slukket.webp', '/tiles/energi_taendt.webp', '/tiles/blodofring.webp', '/tiles/baad.webp', '/tiles/gravsted.webp', '/tiles/vaerksted.webp',
            '/tiles/wheat.webp', '/tiles/growingwheat.webp', '/tiles/brokenwheat.webp',
            '/tiles/beans.webp', '/tiles/growingbean.webp', '/tiles/brokenbean.webp', '/tiles/portal.webp', '/tiles/goldmine.webp',
            '/tiles/meteorsten.webp', '/tiles/openlock.webp'
        ];

        standardBiomer.forEach(biome => {
            const tileNavn = biome === 'soe' ? 'hav' : biome;
            billederTilPreload.push(`/tiles/${tileNavn}.webp`);
            billederTilPreload.push(`/tiles/${tileNavn}_taage.webp`);
        });
        Object.values(itemDB).forEach(item => billederTilPreload.push(item.billede));
        tilgaengeligeKarakterer.forEach(karakter => billederTilPreload.push(karakter.ikon));

        billederTilPreload.forEach(sti => {
            const billede = new Image();
            billede.src = sti;
        });
    }

    function håndterTastatur(ev: KeyboardEvent) {
        if (introAktiv || ev.repeat || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || spilTilstand.gameState !== 'play' || spilTilstand.venteSpilAktiv) return;
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

        const tast = ev.key.toLowerCase();
        if (tast === 'g') {
            grav();
        }
        else if (tast === 'h') hvil();
        else if (tast === 'f') {
            fokuserPaaSpiller();
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

    function fokuserPaaSpiller() {
        if (introAktiv || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || spilTilstand.gameState !== 'play' || spilTilstand.venteSpilAktiv) return;
        langsomtKamera = false;
        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
    }

    async function genstartBane() {
        const aktiveSpillere = Object.values(spilTilstand.alleSpillere).filter(erAktivSessionSpiller);

        if (!spilTilstand.offlineMode && aktiveSpillere.length > 0 && spilTilstand.rumKode) {
            alert('Du kan ikke genstarte øen for alle, mens der stadig er andre aktive spillere ude i tågen.');
            return;
        }

        stopRealtime();
        annullerVentendeNetvaerkSync();

        spilTilstand.logHistorik = [];
        spilTilstand.logBesked = '';
        visDoedsLog = false;
        
        cam.nulstil();

        spilTilstand.alleSpillere = {};
        startNyRundeSeed();

        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        spilTilstand.historik = [];
        spilTilstand.valgtKarakter = null;
        spilTilstand.maxLivspoint = 100;
        spilTilstand.livspoint = 100;
        spilTilstand.guldTotal = 0;
        spilTilstand.maxKolonne = 0;
        spilTilstand.doedsAarsag = null;
        spilTilstand.nuvaerendeEnergi = 0;
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];
        spilTilstand.mineSkattekortFelter = [];
        spilTilstand.samletScore = 0;
        spilTilstand.venteGratisFeltBrugt = null;
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        spilTilstand.sidsteBersaerkDag = 0;
        spilTilstand.venteFriIndtilDag = 0;
        
        nulstilKort();

        spilTilstand.gameState = 'select';
        if (spilTilstand.offlineMode) {
            await syncTilDb(true);
            return;
        }

        const { error: resetError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
            kort: spilTilstand.gitter,
            start_index: spilTilstand.spillerIndex,
            spillere: {},
            fog_x: 0,
            ...kortSessionMeta()
        }).eq('rum_kode', spilTilstand.rumKode)));

        if (resetError) {
            spilTilstand.statusBesked = `Øen kunne ikke nulstilles: ${resetError.message}`;
            spilTilstand.gameState = 'start';
            return;
        }

        startRealtime();
    }

    async function opretEllerDeltag() {
        spilTilstand.gameMode = 'open';
        spilTilstand.offlineMode = false;

        if (browser && !navigator.onLine) {
            spilTilstand.statusBesked = 'Du er offline. Tryk START for at spille lokalt på denne enhed.';
            return;
        }

        let rentNavn = (spilTilstand.spillerNavn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
        let renKode = (spilTilstand.rumKode || '').replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '').toLowerCase().substring(0, 20);

        if (rentNavn === '' || renKode === '') {
            spilTilstand.statusBesked = 'Udfyld både dit kaldenavn og dit ø-navn.';
            return;
        }

        stopRealtime();
        annullerVentendeNetvaerkSync();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        let mitBrowserId = localStorage.getItem('taage_browser_id');
        if (!mitBrowserId) {
            mitBrowserId = Math.random().toString(36).substring(2);
            localStorage.setItem('taage_browser_id', mitBrowserId);
        }

        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = 'Forbinder dig til øen...';
        const pendingStart = laesPendingStart();
        const refreshes = pendingStart?.navn === rentNavn && pendingStart.rumKode === renKode ? pendingStart.refreshes : 0;
        gemPendingStart(rentNavn, renKode, refreshes);
        let autoRefreshTimer = planlaegAutoRefreshVedStart(rentNavn, renKode);
        
        const aktivRumKode = renKode;
        const aktivKanalNoegle = realtimeRumNoegle(aktivRumKode);

        alarmKanal = supabase
            .channel(`room:${aktivKanalNoegle}:events`)
            .on('broadcast', { event: 'alarm' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
                if (payload.senderNavn === spilTilstand.spillerNavn) return;
                if (spilTilstand.alleSpillere[payload.senderNavn]) {
                    spilTilstand.alleSpillere[payload.senderNavn].activeAlarm = true;
                }
            })
            .on('broadcast', { event: 'baal' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
                afslørOmraade(payload.centerIndex, payload.radius);
                syncTilDb();
            })
            .on('broadcast', { event: 'syn_signal' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
                afslørOmraade(payload.centerIndex, payload.radius);
                if (typeof payload.fokusIndex === 'number') {
                    spilTilstand.kameraFokus = payload.fokusIndex;
                }
                syncTilDb();
            })
            .on('broadcast', { event: 'faelles_event' }, ({ payload }) => {
                if (payload.kanalNoegle !== aktivKanalNoegle || spilTilstand.rumKode !== aktivRumKode) return;
                anvendFaellesEventEffekt(payload);
            })
            .subscribe();

        try {
            const { data, error } = await hentSpilSession(spilTilstand.rumKode);
            if (error) {
                console.error("Netværksfejl:", error);
                spilTilstand.statusBesked = `Kunne ikke forbinde til øen: ${error.message}`;
                return;
            }

            if (data) {
                laesSessionDimensioner(data);
                spilTilstand.gitter = data.kort;
                spilTilstand.alleSpillere = filtrerSpillereTilKanal(data.spillere || {}, aktivKanalNoegle);
                overtagRundeSeedVedIndgang(rentNavn, mitBrowserId);
                spilTilstand.fogX = data.fog_x || 0;
                spilTilstand.erHost = false;

                const sessionKlar = await haandterUdloebneSpillereVedIndgang(rentNavn, mitBrowserId);
                if (!sessionKlar) return;
                
                const fundetNavn = Object.keys(spilTilstand.alleSpillere).find(n => n.toLowerCase() === rentNavn.toLowerCase());

                if (fundetNavn) {
                    const eksisterende = spilTilstand.alleSpillere[fundetNavn];
                    if (eksisterende.rundeSeed) spilTilstand.rundeSeed = eksisterende.rundeSeed;
                    const sammeLogin = !!eksisterende.userId && !!authState.user?.id && eksisterende.userId === authState.user.id;
                    const sammeBrowser = !!eksisterende.browserId && eksisterende.browserId === mitBrowserId;
                    
                    if (!eksisterende.isDead && !eksisterende.isWinner && !sammeLogin && !sammeBrowser) {
                        if (!erAktivSessionSpiller(eksisterende)) {
                            delete spilTilstand.alleSpillere[fundetNavn];
                            spilTilstand.gameState = 'select';
                            spilTilstand.statusBesked = `Den gamle '${fundetNavn}' er udløbet af øen. Vælg karakter for at starte.`;
                            startRealtime();
                            return;
                        }

                        spilTilstand.statusBesked = `Navnet '${fundetNavn}' er allerede i brug af en anden aktiv rejsende.`;
                        return;
                    }

                    if (eksisterende.isDead || eksisterende.isWinner) {
                        const spillereArr = Object.values(spilTilstand.alleSpillere);
                        const aktiveSpillere = spillereArr.filter(erAktivSessionSpiller);
                        const maxAktivDag = aktiveSpillere.length > 0 ? Math.max(...aktiveSpillere.map((s: SpillerData) => s.dag || 1)) : 1;

                        if (aktiveSpillere.length > 0 && maxAktivDag > 5) {
                            spilTilstand.statusBesked = `Du er for sent på den. Tågen har nået kysten (Dag ${maxAktivDag}).`;
                            return;
                        }

                        let tidligereRuter = samlTidligereRuter(eksisterende);
                        if (aktiveSpillere.length === 0) {
                            tidligereRuter = arkiverRuterForNaesteTur(fundetNavn, eksisterende);
                            spilTilstand.erHost = true;
                            spilTilstand.alleSpillere = {};
                            startNyRundeSeed();
                            spilTilstand.fogX = 0;
                            spilTilstand.dag = 1;
                            spilTilstand.historik = [];
                            spilTilstand.logHistorik = [];
                            spilTilstand.venteGratisFeltBrugt = null;
                            spilTilstand.gratisNaesteBevaegelse = false;
                            spilTilstand.gratisBevaegelseKilde = '';
                            spilTilstand.sidsteBersaerkDag = 0;
                            spilTilstand.venteSpilAktiv = false;
                            spilTilstand.ventePuljeGuld = 0;
                            spilTilstand.ventePuljeLiv = 0;
                            spilTilstand.venteRunde = 0;
                            spilTilstand.venteStartTid = 0;
                            spilTilstand.venteFriIndtilDag = 0;
                            nulstilKort();

                            const { error: resetError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
                                kort: spilTilstand.gitter,
                                start_index: spilTilstand.spillerIndex,
                                spillere: {},
                                fog_x: 0,
                                ...kortSessionMeta()
                            }).eq('rum_kode', spilTilstand.rumKode)));

                            if (resetError) {
                                spilTilstand.statusBesked = `Øen kunne ikke nulstilles: ${resetError.message}`;
                                return;
                            }
                        }

                        spilTilstand.spillerNavn = fundetNavn;
                        spilTilstand.valgtKarakter = null;
                        spilTilstand.maxLivspoint = 100;
                        spilTilstand.livspoint = 100;
                        spilTilstand.guldTotal = 0;
                        spilTilstand.maxKolonne = 0;
                        spilTilstand.dag = 1;
                        spilTilstand.nuvaerendeEnergi = 0;
                        spilTilstand.mitUdstyr = [];
                        spilTilstand.mineKendteFelter = [];
                        spilTilstand.mineSkattekortFelter = [];
                        spilTilstand.historik = [];
                        if (tidligereRuter.length > 0) {
                            spilTilstand.alleSpillere[fundetNavn] = {
                                ...eksisterende,
                                historik: [],
                                tidligereHistorik: tidligereRuter,
                                isDead: true,
                                isWinner: true,
                                sidstAktiv: 0
                            };
                        }
                        spilTilstand.logHistorik = [];
                        spilTilstand.venteGratisFeltBrugt = null;
                        spilTilstand.gratisNaesteBevaegelse = false;
                        spilTilstand.gratisBevaegelseKilde = '';
                        spilTilstand.sidsteBersaerkDag = 0;
                        spilTilstand.venteFriIndtilDag = 0;
                        spilTilstand.gameState = 'select';
                        spilTilstand.statusBesked = eksisterende.isWinner
                            ? 'Den gamle tur var afsluttet. Vælg karakter for at starte rent.'
                            : 'Den gamle tur var død. Vælg karakter for at starte rent.';
                        startRealtime();
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
                    spilTilstand.mineSkattekortFelter = eksisterende.skattekortFelter || [];
                    spilTilstand.historik = eksisterende.historik || [];
                    spilTilstand.venteGratisFeltBrugt = null;
                    spilTilstand.gratisNaesteBevaegelse = eksisterende.gratisNaesteBevaegelse ?? false;
                    spilTilstand.gratisBevaegelseKilde = eksisterende.gratisBevaegelseKilde ?? '';
                    spilTilstand.sidsteBersaerkDag = eksisterende.sidsteBersaerkDag ?? 0;
                    spilTilstand.venteFriIndtilDag = eksisterende.venteFriIndtilDag ?? 0;

                    afslørOmraade(spilTilstand.spillerIndex, aktuelSynsRadius);
                    startRealtime();
                    
                    if (eksisterende.isDead || eksisterende.isWinner) {
                        spilTilstand.gameState = eksisterende.isWinner ? 'win_map' : 'dead_map';
                        spilTilstand.statusBesked = eksisterende.isWinner ? 'Du slap væk fra øen.' : 'Du døde i tågen.';
                    } else {
                        spilTilstand.gameState = 'play';
                        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
                    }
                } else {
                    const aktivSammeBruger = findAktivSpillerForBruger();
                    if (aktivSammeBruger) {
                        spilTilstand.statusBesked = `Du spiller allerede på denne ø som ${aktivSammeBruger.navn}. Log ud eller afslut den karakter først.`;
                        return;
                    }

                    const spillereArr = Object.values(spilTilstand.alleSpillere);
                    const aktiveSpillere = spillereArr.filter(erAktivSessionSpiller);
                    const maxAktivDag = aktiveSpillere.length > 0 ? Math.max(...aktiveSpillere.map((s: SpillerData) => s.dag || 1)) : 1;
                    const maxDag = maxAktivDag;

                    if (maxAktivDag > 5) {
                        spilTilstand.statusBesked = `Du er for sent på den. Tågen har nået kysten (Dag ${maxDag}).`;
                        return;
                    }

                    if ((spillereArr.length > 0 && aktiveSpillere.length === 0) || (spillereArr.length === 0 && erTomSessionForurenet(data))) {
                        spilTilstand.erHost = true;
                        spilTilstand.alleSpillere = {};
                        startNyRundeSeed();
                        spilTilstand.fogX = 0;
                        spilTilstand.dag = 1;
                        spilTilstand.historik = [];
                        spilTilstand.logHistorik = [];
                        spilTilstand.venteGratisFeltBrugt = null;
                        spilTilstand.gratisNaesteBevaegelse = false;
                        spilTilstand.gratisBevaegelseKilde = '';
                        spilTilstand.sidsteBersaerkDag = 0;
                        spilTilstand.venteSpilAktiv = false;
                        spilTilstand.ventePuljeGuld = 0;
                        spilTilstand.ventePuljeLiv = 0;
                        spilTilstand.venteRunde = 0;
                        spilTilstand.venteStartTid = 0;
                        spilTilstand.venteFriIndtilDag = 0;
                        nulstilKort();

                        const { error: resetError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
                            kort: spilTilstand.gitter,
                            start_index: spilTilstand.spillerIndex,
                            spillere: {},
                            fog_x: 0,
                            ...kortSessionMeta()
                        }).eq('rum_kode', spilTilstand.rumKode)));

                        if (resetError) {
                            spilTilstand.statusBesked = `Oen kunne ikke nulstilles: ${resetError.message}`;
                            return;
                        }
                    }

                    spilTilstand.gameState = 'select';
                    startRealtime();
                }
            } else {
                spilTilstand.erHost = true;
                spilTilstand.alleSpillere = {};
                startNyRundeSeed();
                spilTilstand.fogX = 0;
                spilTilstand.dag = 1;
                spilTilstand.historik = [];
                spilTilstand.logHistorik = [];
                spilTilstand.venteGratisFeltBrugt = null;
                spilTilstand.venteSpilAktiv = false;
                spilTilstand.ventePuljeGuld = 0;
                spilTilstand.ventePuljeLiv = 0;
                spilTilstand.venteRunde = 0;
                spilTilstand.venteStartTid = 0;
                spilTilstand.venteFriIndtilDag = 0;
                if (!erLocalhost()) {
                    const dimensioner = vaelgStandardKortDimensioner();
                    saetKortDimensioner(dimensioner.bredde, dimensioner.hoejde);
                }
                initialiserGitter(spilTilstand.kortBredde, spilTilstand.kortHoejde);
                const { error: insertError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: spilTilstand.gitter,
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0,
                    ...kortSessionMeta()
                }])));

                if (insertError) {
                    const { data: eksisterendeSession, error: hentEfterInsertError } = await hentSpilSession(spilTilstand.rumKode);

                    if (hentEfterInsertError || !eksisterendeSession) {
                        spilTilstand.statusBesked = `Øen kunne ikke oprettes: ${insertError.message}`;
                        spilTilstand.gameState = 'start';
                        return;
                    }

                    laesSessionDimensioner(eksisterendeSession);
                    spilTilstand.gitter = eksisterendeSession.kort;
                    spilTilstand.alleSpillere = filtrerSpillereTilKanal(eksisterendeSession.spillere || {}, aktivKanalNoegle);
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
        } finally {
            if (autoRefreshTimer !== null) {
                window.clearTimeout(autoRefreshTimer);
                autoRefreshTimer = null;
            }
            if (spilTilstand.gameState !== 'start' || !erForbindelsesStatus()) {
                rydPendingStart();
            }
        }
    }

    async function startOfflineSpil() {
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

        spilTilstand.offlineMode = true;
        spilTilstand.gameMode = 'offline';
        spilTilstand.spillerNavn = rentNavn;
        spilTilstand.rumKode = renKode;
        spilTilstand.statusBesked = 'Offline. Spillet gemmes lokalt på denne enhed.';
        spilTilstand.erHost = true;
        spilTilstand.alleSpillere = {};
        startNyRundeSeed();
        spilTilstand.fogX = 0;
        spilTilstand.dag = 1;
        spilTilstand.historik = [];
        spilTilstand.logHistorik = [];
        spilTilstand.samletScore = 0;
        spilTilstand.doedsAarsag = null;
        scoreErGemt = false;
        nyGlobalRekord = false;
        initialiserGitter(spilTilstand.kortBredde, spilTilstand.kortHoejde);
        spilTilstand.gameState = 'select';
        await syncTilDb(true);
    }

    function fortsaetOfflineSpil() {
        if (!indlaesOfflineSpil()) {
            spilTilstand.statusBesked = 'Der blev ikke fundet et offline-spil.';
            harGemtOfflineSpil = false;
            offlineSpilInfo = null;
            return;
        }
        spilTilstand.gameMode = 'offline';

        stopRealtime();
        if (alarmKanal) {
            supabase.removeChannel(alarmKanal);
            alarmKanal = null;
        }

        harGemtOfflineSpil = true;
        offlineSpilInfo = hentOfflineSpilInfo();
        if (spilTilstand.gameState === 'play') {
            cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
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
        let sidstGenopfrisketVedFokus = 0;
        const pendingStart = laesPendingStart();
        if (pendingStart && pendingStart.refreshes > 0 && Date.now() - pendingStart.startet < 2 * 60 * 1000) {
            spilTilstand.spillerNavn = pendingStart.navn;
            spilTilstand.rumKode = pendingStart.rumKode;
            spilTilstand.statusBesked = 'Forbindelsen hang. Starter igen efter refresh...';
            window.setTimeout(() => {
                if (spilTilstand.gameState === 'start') void opretEllerDeltag();
            }, 350);
        } else if (pendingStart) {
            rydPendingStart();
        }

        const venteUrTimer = window.setInterval(() => {
            if (spilTilstand.venteSpilAktiv) venteUrTick = Date.now();
        }, 1000);

        const erAktivtOnlinespil = () => spilTilstand.gameState === 'play' && !spilTilstand.offlineMode;
        const harOnlineSession = () => {
            if (spilTilstand.offlineMode || !spilTilstand.rumKode || !spilTilstand.spillerNavn) return false;
            return ['play', 'win', 'win_map', 'dead', 'dead_map'].includes(spilTilstand.gameState);
        };

        const heartbeat = async () => {
            if (spilTilstand.offlineMode && spilTilstand.gameState === 'play') {
                await flushVentendeSync();
                return;
            }

            if (!harOnlineSession()) return;

            if (browser && !navigator.onLine) {
                spilTilstand.statusBesked = 'Forbindelsen er afbrudt. Spillet fortsætter lokalt indtil videre.';
                return;
            }

            if (erAktivtOnlinespil()) {
                startRealtime();
                await syncTilDb(false);
                const gemt = await flushVentendeSync();
                if (!gemt) {
                    spilTilstand.statusBesked = spilTilstand.statusBesked || 'Forbindelsen til øen driller. Spillet prøver igen.';
                }
            } else {
                startRealtime(true);
            }
        };

        const genopretForbindelse = async () => {
            if (genopretterForbindelse) return;

            if (spilTilstand.offlineMode) {
                await flushVentendeSync();
                return;
            }

            if (!harOnlineSession()) return;

            genopretterForbindelse = true;
            try {
                stopRealtime();
                startRealtime();
                await heartbeat();
            } finally {
                genopretterForbindelse = false;
            }
        };

        const genopfriskListerEfterReconnect = async () => {
            if (spilTilstand.offlineMode) {
                lokaleScores = await hentHighscores();
                return;
            }

            const gemteVentende = authState.user?.id ? await retryVentendeHighscores() : 0;
            if (gemteVentende > 0) {
                scoreErGemt = true;
                scoreGemningFejlet = false;
                spilTilstand.statusBesked = gemteVentende === 1
                    ? 'En ventende score blev gemt efter genoprettet forbindelse.'
                    : `${gemteVentende} ventende scores blev gemt efter genoprettet forbindelse.`;
            }

            const klasse = aktuelHighscoreKlasse();
            const [nyeLokaleScores, nyeGlobaleScores, nyeKlasseScores] = await Promise.all([
                hentHighscores(),
                hentGlobalTopHundrede(),
                klasse ? hentGlobalTopHundrede(klasse) : Promise.resolve([])
            ]);
            lokaleScores = nyeLokaleScores;
            globaleScores = nyeGlobaleScores;
            klasseScores = nyeKlasseScores;
        };

        const genopfriskEfterFokus = async () => {
            const nu = Date.now();
            if (nu - sidstGenopfrisketVedFokus < 2500) return;
            sidstGenopfrisketVedFokus = nu;

            await genopretForbindelse();
            if (browser && !navigator.onLine) return;
            await genopfriskListerEfterReconnect();
        };

        const gemHvisSidenForsvinder = () => {
            void flushVentendeSync();
        };
        const gemHvisSkjult = () => {
            if (document.hidden) {
                gemHvisSidenForsvinder();
            } else {
                void genopfriskEfterFokus();
            }
        };
        const haandterOnline = () => {
            void genopfriskEfterFokus();
        };
        const haandterOffline = () => {
            if (harOnlineSession()) {
                spilTilstand.statusBesked = 'Forbindelsen er afbrudt. Spillet fortsætter lokalt indtil videre.';
            }
        };

        const heartbeatTimer = window.setInterval(() => {
            void heartbeat();
        }, 30 * 1000);

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
            globaleScores = await hentGlobalTopHundrede();
        })();

        return () => {
            window.clearInterval(venteUrTimer);
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
        if (spilTilstand.gameState === 'start' && profilNavn && profilNavn !== sidstAutoUdfyldtProfilNavn) {
            spilTilstand.spillerNavn = profilNavn;
            sidstAutoUdfyldtProfilNavn = profilNavn;
        }
    });

    $effect(() => {
        if (spilTilstand.offlineMode) return;
        const brugerId = authState.user?.id;
        if (brugerId) {
            (async () => {
                const gemteVentende = await retryVentendeHighscores();
                if (gemteVentende > 0) {
                    scoreErGemt = true;
                    scoreGemningFejlet = false;
                    spilTilstand.statusBesked = gemteVentende === 1
                        ? 'En ventende score blev gemt efter genoprettet forbindelse.'
                        : `${gemteVentende} ventende scores blev gemt efter genoprettet forbindelse.`;
                }
                const klasse = aktuelHighscoreKlasse();
                globaleScores = await hentGlobalTopHundrede();
                klasseScores = klasse ? await hentGlobalTopHundrede(klasse) : [];
                lokaleScores = await hentHighscores();
            })();
        }
    });

    onDestroy(() => {
        void flushVentendeSync();
        stopRealtime();
        if (alarmKanal) supabase.removeChannel(alarmKanal);
    });

    function opdaterSamletScore() {
        const erVinder =
            spilTilstand.gameState === 'win' ||
            spilTilstand.gameState === 'win_map' ||
            !!spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.isWinner;

        spilTilstand.samletScore = beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, spilTilstand.spillerNavn, {
            guld: spilTilstand.guldTotal,
            hp: spilTilstand.livspoint,
            kolonne: spilTilstand.maxKolonne,
            kendteFelter: spilTilstand.mineKendteFelter,
            mitUdstyr: spilTilstand.mitUdstyr,
            isWinner: erVinder
        }, erVinder, spilTilstand.kortBredde, spilTilstand.kortHoejde);
    }

    async function opdaterOgGemHighscore() {
        opdaterSamletScore();

        try {
            await syncTilDb(true);
            let sessionGemt = await flushVentendeSync();
            if (!sessionGemt) {
                await syncTilDb(true);
                sessionGemt = await flushVentendeSync();
            }
            const afslutningGemt = await gemAfsluttetSpillerISession();
            sessionGemt = sessionGemt && afslutningGemt;
            if (!sessionGemt) {
                console.warn('Ø-sessionen blev ikke gemt før highscore. Forsøger stadig at gemme scoren.');
            }
            
            const highscoreGemt = await gemHighscore();
            if (highscoreGemt && !afslutningGemt) {
                sessionGemt = await gemAfsluttetSpillerISession();
            }
            const kanTjekkeTopTi = highscoreGemt && spilTilstand.gameMode !== 'offline' && authState.user;
            const klasse = aktuelHighscoreKlasse();
            nyGlobalRekord = false;

            lokaleScores = await hentHighscores();
            if (spilTilstand.gameMode !== 'offline') {
                klasseScores = await hentGlobalTopHundrede(klasse);
                globaleScores = await hentGlobalTopHundrede();
                const highscoreNavn = authState.profil?.display_name || spilTilstand.spillerNavn;
                nyGlobalRekord = !!kanTjekkeTopTi &&
                    spilTilstand.samletScore > M10_SCORE &&
                    globaleScores.slice(0, 10).some((score) =>
                        score.point === spilTilstand.samletScore &&
                        score.spillerNavn === highscoreNavn &&
                        score.oeNavn === spilTilstand.rumKode &&
                        score.karakter === spilTilstand.valgtKarakter?.navn
                    );
                const gemtScore = globaleScores.find((score) =>
                    score.point === spilTilstand.samletScore &&
                    score.spillerNavn === highscoreNavn &&
                    score.oeNavn === spilTilstand.rumKode &&
                    score.karakter === spilTilstand.valgtKarakter?.navn
                );
                await opdaterHighscoreMedalje(gemtScore?.id, spilTilstand.samletScore, nyGlobalRekord);
            }
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
        const aktivSammeBruger = spilTilstand.offlineMode ? null : findAktivSpillerForBruger();
        if (aktivSammeBruger && aktivSammeBruger.navn !== spilTilstand.spillerNavn) {
            spilTilstand.statusBesked = `Du spiller allerede på denne ø som ${aktivSammeBruger.navn}.`;
            spilTilstand.gameState = 'start';
            return;
        }

        sikrRundeSeed();
        spilTilstand.valgtKarakter = karakter;
        spilTilstand.maxLivspoint = karakter.startHp || 100;
        spilTilstand.livspoint = karakter.startHp;
        
        spilTilstand.guldTotal = karakter.startGuld;
        spilTilstand.maxKolonne = 1;
        spilTilstand.doedsAarsag = null;
        spilTilstand.dag = 1;
        spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;
        spilTilstand.mitUdstyr = [];
        spilTilstand.mineKendteFelter = [];
        spilTilstand.mineSkattekortFelter = [];
        spilTilstand.gratisNaesteBevaegelse = false;
        spilTilstand.gratisBevaegelseKilde = '';
        spilTilstand.sidsteBersaerkDag = 0;
        
        spilTilstand.logHistorik = []; 

        const arkiveredeRuter = hentArkiveredeRuter();

        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
            spiller.tidligereHistorik = samlUnikkeRuter(
                arkiveredeRuter,
                spiller.tidligereHistorik,
                spiller.historik && spiller.historik.length > 1 ? [spiller.historik] : []
            );
            spiller.historik = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].deathCause = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].dag = 1; 
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].besoegteMiner = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].harSkattekort = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].skattekortFelter = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].aktivTracker = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].trackedeSpillere = [];
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].escapeIndex = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].escapeIcon = null;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].gratisNaesteBevaegelse = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].gratisBevaegelseKilde = '';
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].sidsteBersaerkDag = 0;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].venteFriIndtilDag = 0;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].rundeSeed = spilTilstand.rundeSeed;
        } else if (arkiveredeRuter.length > 0) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn] = {
                index: spilTilstand.spillerIndex,
                kolonne: 0,
                hp: spilTilstand.livspoint,
                guld: spilTilstand.guldTotal,
                score: 0,
                turNummer: 0,
                retning: spilTilstand.retning,
                rundeSeed: spilTilstand.rundeSeed,
                historik: [],
                tidligereHistorik: arkiveredeRuter,
                isDead: false,
                isWinner: false,
                deathCause: null,
                venteFriIndtilDag: 0,
                sidstAktiv: 0
            };
        }

        const muligeStartFelter = [];
        for (let raekke = 1; raekke < kortHoejde - 1; raekke++) {
            if (spilTilstand.gitter[raekke * kortBredde + 1] && spilTilstand.gitter[raekke * kortBredde + 1].biome !== 'hav' && spilTilstand.gitter[raekke * kortBredde + 1].biome !== 'soe') {
                muligeStartFelter.push(raekke * kortBredde + 1);
            }
        }
        
        if (muligeStartFelter.length > 0) {
            spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
        } else {
            spilTilstand.spillerIndex = kortBredde + 1;
        }
        
        spilTilstand.retning = 'E';
        for (const itemId of karakter.startUdstyr) { tilfoejTilRygsæk(itemId, 1); }
        
        spilTilstand.historik = [];
        spilTilstand.historik.push(spilTilstand.spillerIndex);
        spilTilstand.venteGratisFeltBrugt = null;

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
                const { error: insertError } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').insert([{
                    rum_kode: spilTilstand.rumKode,
                    kort: spilTilstand.gitter,
                    start_index: spilTilstand.spillerIndex,
                    spillere: {},
                    fog_x: 0,
                    ...kortSessionMeta()
                }])));

                if (insertError) {
                    spilTilstand.statusBesked = `Øen kunne ikke oprettes: ${insertError.message}`;
                    spilTilstand.gameState = 'start';
                    return;
                }
            }
        }
        
        await syncTilDb(true);
        cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
        spilTilstand.logBesked = `Du er drevet i land på kysten af ${formaterOeNavn()}. Tågen ligger bag dig og venter på at omslutte dig. Du må prøve at finde en båd på den anden side af ${formaterOeNavn()}.`;
        spilTilstand.gameState = 'play';
        introAktiv = true;
    }

    function afslutIntro() {
        introAktiv = false;
        requestAnimationFrame(() => {
            cam.centrerPåHex(spilTilstand.spillerIndex, kortBredde, HEX_W, ROW_H);
        });
    }

    function formaterOeNavn() {
        const navn = spilTilstand.rumKode || 'øen';
        return navn.charAt(0).toUpperCase() + navn.slice(1);
    }

    function lukEventOgShop() {
        const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
        const lukkedeInteraktion = !!spilTilstand.aktivShop || spilTilstand.aktivVaerksted;
        const lukkedeEvent = eventState.aktivt;
        
        if (felt && eventState.aktivt && felt.eventID !== 'campfire' && felt.eventID !== 'meteor_skat' && felt.eventID !== 'stjernekald') {
            felt.eventFuldført = true;
        }
        
        motorLukEvent();
        spilTilstand.aktivShop = null;
        spilTilstand.aktivVaerksted = false;
        
        if (felt && felt.hasPortal && !lukkedeInteraktion && !lukkedeEvent) {
            udfoerPortalTeleport();
        } else {
            syncTilDb(!lukkedeInteraktion);
        }
    }

    function hentLangsomsteDag() {
        const aktive = Object.entries(spilTilstand.alleSpillere)
            .filter(([navn, spiller]) => navn !== spilTilstand.spillerNavn && erAktivSessionSpiller(spiller))
            .map(([, spiller]) => spiller);

        const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (spilTilstand.spillerNavn && spilTilstand.valgtKarakter && spilTilstand.gameState === 'play') {
            aktive.push({
                ...(mig || {}),
                dag: spilTilstand.dag,
                sidstAktiv: Date.now(),
                isDead: false,
                isWinner: false,
                deathCause: null
            } as SpillerData);
        }
        
        if (aktive.length === 0) return spilTilstand.dag;
        return Math.min(...aktive.map((s: SpillerData) => s.dag || 1));
    }

    function hentKortRangliste() {
        return Object.entries(spilTilstand.alleSpillere)
            .map(([navn, data]) => ({
                navn,
                data,
                score: data.score || beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, navn, data, !!data.isWinner, spilTilstand.kortBredde, spilTilstand.kortHoejde)
            }))
            .sort((a, b) => b.score - a.score);
    }

    function erAktivSessionSpiller(spiller: SpillerData) {
        if (!erFriskAktivSpiller(spiller)) return false;
        return !spilTilstand.rundeSeed || !spiller.rundeSeed || spiller.rundeSeed === spilTilstand.rundeSeed;
    }

    function erSammeSpiller(spiller: SpillerData, browserId: string) {
        const sammeLogin = !!spiller.userId && !!authState.user?.id && spiller.userId === authState.user.id;
        const sammeBrowser = !!spiller.browserId && spiller.browserId === browserId;
        return sammeLogin || sammeBrowser;
    }

    function kanGenoptagePrivatUdloebetSpil(spiller: SpillerData, navn: string, browserId: string, alleEntries: Array<[string, SpillerData]>) {
        if (erStandardOeNavn(spilTilstand.rumKode)) return false;
        if (spiller.isDead || spiller.isWinner) return false;
        if (erAktivSessionSpiller(spiller)) return false;
        if (navn.toLowerCase() !== spilTilstand.spillerNavn.toLowerCase()) return false;
        if (!erSammeSpiller(spiller, browserId)) return false;

        return alleEntries.every(([andetNavn]) => andetNavn === navn);
    }

    async function haandterUdloebneSpillereVedIndgang(rentNavn: string, browserId: string) {
        const alleEntries = Object.entries(spilTilstand.alleSpillere);
        const uafsluttede = alleEntries.filter(([, spiller]) => !spiller.isDead && !spiller.isWinner);
        if (uafsluttede.length === 0) return true;

        const erEgenUafsluttetSpiller = (navn: string, spiller: SpillerData) =>
            !spiller.isDead &&
            !spiller.isWinner &&
            navn.toLowerCase() === rentNavn.toLowerCase() &&
            erSammeSpiller(spiller, browserId);

        const egetNavn = alleEntries.find(([navn]) => navn.toLowerCase() === rentNavn.toLowerCase())?.[0] ?? rentNavn;
        const egenSpiller = spilTilstand.alleSpillere[egetNavn];
        if (egenSpiller && kanGenoptagePrivatUdloebetSpil(egenSpiller, egetNavn, browserId, alleEntries)) {
            return true;
        }

        const aktiveUafsluttede = uafsluttede.filter(([navn, spiller]) =>
            erEgenUafsluttetSpiller(navn, spiller) || erAktivSessionSpiller(spiller)
        );

        if (aktiveUafsluttede.length === 0) {
            spilTilstand.erHost = true;
            spilTilstand.alleSpillere = {};
            startNyRundeSeed();
            spilTilstand.fogX = 0;
            spilTilstand.dag = 1;
            spilTilstand.historik = [];
            spilTilstand.logHistorik = [];
            spilTilstand.venteGratisFeltBrugt = null;
            spilTilstand.gratisNaesteBevaegelse = false;
            spilTilstand.gratisBevaegelseKilde = '';
            spilTilstand.sidsteBersaerkDag = 0;
            spilTilstand.venteSpilAktiv = false;
            spilTilstand.ventePuljeGuld = 0;
            spilTilstand.ventePuljeLiv = 0;
            spilTilstand.venteRunde = 0;
            spilTilstand.venteStartTid = 0;
            spilTilstand.venteFriIndtilDag = 0;
            nulstilKort();

            const { error } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
                kort: spilTilstand.gitter,
                start_index: spilTilstand.spillerIndex,
                spillere: {},
                fog_x: 0,
                ...kortSessionMeta()
            }).eq('rum_kode', spilTilstand.rumKode), 8000));

            if (error) {
                spilTilstand.statusBesked = `Øen kunne ikke frigøres: ${error.message}`;
                return false;
            }

            return true;
        }

        const rensede = Object.fromEntries(
            alleEntries.filter(([navn, spiller]) =>
                spiller.isDead ||
                spiller.isWinner ||
                erEgenUafsluttetSpiller(navn, spiller) ||
                erAktivSessionSpiller(spiller)
            )
        );
        if (Object.keys(rensede).length === alleEntries.length) return true;

        spilTilstand.alleSpillere = rensede;
        const { error } = await medRetry(() => medTimeout(supabase.from('spil_sessioner').update({
            spillere: rensede
        }).eq('rum_kode', spilTilstand.rumKode), 8000));

        if (error) {
            spilTilstand.statusBesked = `Gamle spillere kunne ikke ryddes fra øen: ${error.message}`;
            return false;
        }

        return true;
    }

    function filtrerSpillereTilKanal(spillere: Record<string, SpillerData>, kanalNoegle: string) {
        return Object.fromEntries(
            Object.entries(spillere).filter(([, spiller]) => {
                if (spiller.kanalNoegle) return spiller.kanalNoegle === kanalNoegle;
                if (spiller.rumKode) return spiller.rumKode === spilTilstand.rumKode;
                return true;
            })
        );
    }

    function findAktivSpillerForBruger() {
        if (spilTilstand.offlineMode) return null;
        const brugerId = authState.user?.id;
        if (!brugerId) return null;

        const fundet = Object.entries(spilTilstand.alleSpillere).find(([, spiller]) => {
            return spiller.userId === brugerId && erAktivSessionSpiller(spiller);
        });

        return fundet ? { navn: fundet[0], spiller: fundet[1] } : null;
    }

    function farvelBaadeForFelt(index: number) {
        return Object.entries(spilTilstand.alleSpillere)
            .filter(([, spiller]) => spiller?.isWinner && spiller.escapeIndex === index)
            .map(([navn, spiller]) => ({
                navn,
                ikon: spiller.escapeIcon || spiller.ikon || '/tiles/player.webp'
            }));
    }

    function gravstenListeForFelt(felt: Felt): GravstenMinde[] {
        if (felt.gravstenListe?.length) return felt.gravstenListe;
        if (felt.gravstenIkon) return [{ ikon: felt.gravstenIkon, navn: 'Ukendt', dag: 0 }];
        return [];
    }

    function nyesteGravsten(felt: Felt) {
        const liste = gravstenListeForFelt(felt);
        return liste[liste.length - 1] || null;
    }

    function gravstenHjaelpetekst(felt: Felt) {
        const liste = gravstenListeForFelt(felt);
        if (liste.length === 0) return 'Gravstenen bliver liggende som et permanent spor på øen.';

        return [...liste]
            .reverse()
            .map((minde) => {
                const dag = minde.dag > 0 ? `Dag ${minde.dag}` : 'Ukendt dag';
                const tekst = minde.tekst ? ` - ${minde.tekst}` : '';
                return `${dag}: ${minde.navn}${tekst}`;
            })
            .join('\n');
    }

    function visGravsten(e: MouseEvent, felt: Felt) {
        e.preventDefault();
        e.stopPropagation();

        const liste = gravstenListeForFelt(felt);
        const placering = placerInspectBoble(e.clientX, e.clientY);
        inspectBoble = {
            titel: liste.length > 1 ? `${liste.length} døde her` : 'Gravsten',
            tekst: gravstenHjaelpetekst(felt),
            ...placering
        };
        inspectAktiv = false;
    }

    function formaterBiomeNavn(biome: string | undefined) {
        if (!biome) return 'felt';
        return biome.replace('hoejland', 'højland').replace('soe', 'sø');
    }

    function tileBaggrundForBiome(biome: string, erOpslugt: boolean) {
        if (biome === 'soe') {
            const billede = erOpslugt ? '/tiles/hav_taage.webp' : '/tiles/hav.webp';
            return `url('${billede}')`;
        }

        return `url('/tiles/${biome}${erOpslugt ? '_taage' : ''}.webp')`;
    }

    function harKoebbarShop(felt: Felt) {
        return (felt.shopBasisItems || []).length > 0 || (felt.shopItems || []).some((itemId) => itemDB[itemId]?.kanKoebes !== false);
    }

    function forklaringForFelt(felt: Felt, index: number, erUdforsket: boolean, erOpslugt: boolean, erSkattekortRygte = false) {
        if (erSkattekortRygte && !erUdforsket) {
            return {
                titel: 'Skattekortspor',
                tekst: 'Et gammelt skattekort peger på dette område. Farven og krydset er kun et kortspor: feltet tæller ikke som udforsket, og kortet viser ikke, om kisten stadig er der.'
            };
        }

        if (!erUdforsket) {
            return {
                titel: 'Ukendt felt',
                tekst: 'Du har ikke udforsket feltet endnu. Bevæg dig tættere på eller brug lys/udsyn for at afsløre det.'
            };
        }

        const biome = String(felt.biome || 'felt');
        const dele: string[] = [biomeForklaringer[biome] || 'Et udforsket felt på øen.'];

        if (erOpslugt) dele.push('Tågen har taget feltet. Det er farligt at stå her.');
        if (biome === 'hav') dele.push('Hav kan sluge almindelig rustning og kongepanser samt slukke fakler. Elverrustning går ikke tabt i vand.');
        if (biome === 'soe') dele.push('Søer er indlandsvand. De er farlige uden båd, men de tæller ikke som havkyst.');
        if (biome === 'hule') dele.push('Huler kan ødelægge soveposer og fint tøj.');
        if (biome === 'ruin') dele.push('Ruiner kan koste madrationer.');
        if (biome === 'krystal') dele.push('Krystaller ødelægger metaldetektor og gylden kikkert. Malmviser bliver til almindelig detektor.');
        if (biome === 'ritual') dele.push('Ritualfelter kan ødelægge søgekvist. Runekvist bliver til almindelig søgekvist.');
        if (felt.hasBoat) dele.push(`Der ${felt.boatCount && felt.boatCount > 1 ? `ligger ${felt.boatCount} både` : 'ligger en flugtbåd'} her. Går du ombord, har du vundet.`);
        if (felt.eventID && !felt.eventFuldført) dele.push('Feltet har et event, som starter når du går ind på det.');
        if (harKoebbarShop(felt)) dele.push('Feltet har en butik. Dagens varer deles af spillerne og genfyldes næste dag.');
        if (felt.hasWorkshop) dele.push('Feltet har et værksted, hvor udstyr kan opgraderes. Har du kølle eller murknuser, tør mesteren kun arbejde for dig én gang.');
        if (felt.hasGoldmine) dele.push(felt.mineOwner ? `Guldminen ejes af ${felt.mineOwner}.` : 'Der er en guldmine her.');
        if (felt.hasPortal && !(felt.eventID && !felt.eventFuldført)) dele.push('Portalen kan flytte dig mod øst.');
        if (felt.taageBlokker) dele.push('Tågeblokkeren kan holde tågen tilbage fra venstre, indtil tågen vender.');
        const gravstenListe = gravstenListeForFelt(felt);
        if (gravstenListe.length > 1) dele.push(`Gravstenen rummer ${gravstenListe.length} dødsfald på dette felt.`);
        else if (gravstenListe.length === 1) dele.push('Gravstenen viser, at en spiller døde her.');
        if (farvelBaadeForFelt(index).length > 0) dele.push('Den grå farvelbåd viser, at en spiller slap væk fra dette felt.');
        if (felt.gravet) dele.push('Feltet er allerede gravet op.');
        else if (felt.kanGraves) dele.push('Feltet kan graves.');
        else dele.push('Feltet kan ikke graves.');

        return {
            titel: formaterBiomeNavn(biome),
            tekst: dele.join(' ')
        };
    }

    function placerInspectBoble(clientX: number, clientY: number) {
        const bredde = Math.min(280, Math.max(220, window.innerWidth - 24));
        const hoejde = 170;
        const margin = 12;
        let x = clientX + 12;
        let y = clientY + 12;

        if (x + bredde > window.innerWidth - margin) x = clientX - bredde - 12;
        if (y + hoejde > window.innerHeight - margin) y = clientY - hoejde - 12;

        return {
            x: Math.max(margin, Math.min(x, window.innerWidth - bredde - margin)),
            y: Math.max(margin, Math.min(y, window.innerHeight - hoejde - margin))
        };
    }

    function startInspect() {
        inspectAktiv = true;
        inspectBoble = null;
    }

    function lukInspect() {
        inspectAktiv = false;
        inspectBoble = null;
    }

    function haandterInspectKlik(e: MouseEvent) {
        if (!inspectAktiv) return;

        const target = e.target as HTMLElement | null;
        const element = target?.closest('[data-help-title]') as HTMLElement | null;

        e.preventDefault();
        e.stopPropagation();

        const placering = placerInspectBoble(e.clientX, e.clientY);
        inspectBoble = {
            titel: element?.dataset.helpTitle || 'Hjælp',
            tekst: element?.dataset.helpBody || 'Tryk på et felt, ikon eller en knap for at få en forklaring.',
            ...placering
        };
        inspectAktiv = false;
    }

    function touchAfstand(touches: TouchList) {
        if (touches.length < 2) return 0;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    function startTouchZoom(e: TouchEvent) {
        if (eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted) return;
        if (e.touches.length === 2) {
            sidstePinchAfstand = touchAfstand(e.touches);
            cam.stopTræk();
            e.preventDefault();
        }
    }

    function haandterTouchZoom(e: TouchEvent) {
        if (eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted) return;
        if (e.touches.length !== 2 || sidstePinchAfstand <= 0) return;

        const nyAfstand = touchAfstand(e.touches);
        cam.justerZoom((nyAfstand - sidstePinchAfstand) / 260, false);
        sidstePinchAfstand = nyAfstand;
        e.preventDefault();
    }

    function stopTouchZoom() {
        sidstePinchAfstand = 0;
    }

    async function medTimeout<T>(kald: PromiseLike<T>, ms = 25000): Promise<T> {
        let timer: ReturnType<typeof setTimeout>;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('timeout')), ms);
        });

        return Promise.race([kald, timeout]).finally(() => clearTimeout(timer));
    }

    function vent(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function kortSessionMeta() {
        return {
            kort_bredde: spilTilstand.kortBredde,
            kort_hoejde: spilTilstand.kortHoejde,
            kort_version: KORT_VERSION
        };
    }

    function laesSessionDimensioner(data: { kort_bredde?: number | null; kort_hoejde?: number | null } | null | undefined) {
        saetKortDimensioner(data?.kort_bredde ?? BREDDE, data?.kort_hoejde ?? HOEJDE);
    }

    function erTomSessionForurenet(data: { kort?: Felt[] | null; fog_x?: number | null } | null | undefined) {
        if (!data) return false;
        if ((data.fog_x || 0) !== 0) return true;
        return (data.kort || []).some((felt) =>
            !!felt.mineOwner ||
            !!felt.gravet ||
            !!felt.udforsket ||
            !!felt.eventFuldført ||
            !!felt.indbrudt ||
            !!felt.plyndret ||
            (felt.naegterHandelFor?.length || 0) > 0 ||
            !!felt.shopGenopfyldtDag
        );
    }

    async function medRetry<T>(kald: () => PromiseLike<T>, antalForsoeg = 2): Promise<T> {
        let sidsteFejl: unknown;

        for (let forsoeg = 1; forsoeg <= antalForsoeg; forsoeg++) {
            try {
                return await kald();
            } catch (error) {
                sidsteFejl = error;
                if (!(error instanceof Error) || error.message !== 'timeout' || forsoeg === antalForsoeg) break;
                spilTilstand.statusBesked = 'Øen svarer langsomt. Prøver igen...';
                await vent(800);
            }
        }

        throw sidsteFejl;
    }

    function hentSpilSession(rumKode: string) {
        return medRetry(() => medTimeout(
            supabase
                .from('spil_sessioner')
                .select(SESSION_SELECT)
                .eq('rum_kode', rumKode)
                .maybeSingle()
        ), 2);
    }

function udførBevægelse(nytIndeks: number) {
    if (flytterNu || !spilTilstand.valgtKarakter) return;

    flytterNu = true;
    udfoerBevaegelse(nytIndeks, {
        erITaagen: erITågen,
        langsomsteDag: hentLangsomsteDag(),
        maxDageForan: MAX_DAGE_FORAN,
        synsRadius: aktuelSynsRadius,
        onKameraFoelg: (indeks) => cam.foelgSpiller(indeks, kortBredde, HEX_W, ROW_H),
        onBaadStart: (indeks) => {
            sejlendeBaadIndex = indeks;
        }
    });

    setTimeout(() => flytterNu = false, 200);
}

    function flytHex(retning: string) {
        if (introAktiv || spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
        const gyldigeRetninger = ['NW', 'NE', 'W', 'E', 'SW', 'SE'] as const;
        if (!gyldigeRetninger.includes(retning as typeof gyldigeRetninger[number])) return;

        const nytIndeks = hentNaboIRetning(
            spilTilstand.spillerIndex,
            retning as typeof gyldigeRetninger[number],
            kortBredde,
            kortBredde * kortHoejde
        );

        if (nytIndeks !== null) udførBevægelse(nytIndeks);
    }

    function klikPåHex(nytIndeks: number) {
        if (introAktiv || spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.aktivVaerksted || (spilTilstand.gameState !== 'play' && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map')) return;
        if (spilTilstand.gameState === 'play' && hentNaboIndices(spilTilstand.spillerIndex).includes(nytIndeks)) udførBevægelse(nytIndeks);
    }
</script>

<svelte:window onkeydown={håndterTastatur} onclickcapture={haandterInspectKlik} />

{#if spilTilstand.gameState === 'play'}
    <BottomUI />
{/if}

<Skaerme 
    {opretEllerDeltag}
    {startOfflineSpil}
    {fortsaetOfflineSpil}
    {bekræftValg} 
    {genstartBane} 
    {nulstilHukommelse}
    {lokaleScores} 
    {klasseScores}
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
        <button
            type="button"
            class="top-ikon-knap fokus-knap"
            onclick={fokuserPaaSpiller}
            title="Fokuser på dig"
            aria-label="Fokuser på dig"
        >
            ⌖
        </button>
        <button
            type="button"
            class="top-ikon-knap inspect-knap"
            class:aktiv={inspectAktiv}
            onclick={startInspect}
            title="Forklar næste tryk"
            aria-label="Forklar næste tryk"
        >
            ?
        </button>
        <Regelbog />
        <LydKnap />
    </div>
    <div class="zoom-actions" aria-label="Zoom">
        <button type="button" onclick={() => cam.justerZoom(0.18, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)} aria-label="Zoom ind">+</button>
        <button type="button" onclick={() => cam.justerZoom(-0.18, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)} aria-label="Zoom ud">-</button>
    </div>
{/if}

<div class="game-container">
    <div class="camera" role="presentation"
        onwheel={(e) => cam.håndterZoom(e, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)}
        onpointerdown={(e) => cam.startTræk(e, !!eventState.aktivt || !!spilTilstand.aktivShop || !!spilTilstand.aktivVaerksted)}
        onpointermove={cam.træk}
        onpointerup={cam.stopTræk}
        ontouchstart={startTouchZoom}
        ontouchmove={haandterTouchZoom}
        ontouchend={stopTouchZoom}
        ontouchcancel={stopTouchZoom}
        style="cursor: {cam.isDragging ? 'grabbing' : 'grab'}; touch-action: none;"
    >
        <div class="map" style={kameraStyle}>
            {#each spilTilstand.gitter as felt, i (i)}
                {@const raekke = Math.floor(i / kortBredde)}
                {@const kolonne = i % kortBredde}
                {@const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0)}
                {@const posY = raekke * ROW_H}
                {@const erUdforsket = spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(i)}
                {@const erSkattekortRygte = !erUdforsket && aktiveSkattekortFelter.includes(i)}
                {@const erOpslugt = !spilTilstand.devVisHeleKort && erFeltITaagen(spilTilstand.gitter, i, spilTilstand.fogX, kortBredde)}
                {@const vistBiome = felt.katastrofeVisuelAktiv && felt.katastrofeFraBiome ? felt.katastrofeFraBiome : felt.biome}
                {@const baggrund = !erUdforsket && !erSkattekortRygte ? 'none' : tileBaggrundForBiome(String(vistBiome), erOpslugt)}
                {@const feltHjaelp = forklaringForFelt(felt, i, erUdforsket, erOpslugt, erSkattekortRygte)}

                <div class="hex" class:active={spilTilstand.spillerIndex === i} class:unexplored={!erUdforsket && !erSkattekortRygte}
                    class:skattekort-rygte={erSkattekortRygte}
                    class:katastrofe-venter={!!felt.katastrofeVisuelAktiv}
                    onclick={() => klikPåHex(i)}
                    onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                    data-help-title={feltHjaelp.titel}
                    data-help-body={feltHjaelp.tekst}
                    role="button" tabindex="0"
                    style="{erSkattekortRygte ? `--rygte-bg: ${baggrund};` : `background-image: ${baggrund};`} left: {posX}px; top: {posY}px;"
                >
                    <div class="inner" class:opslugt={erOpslugt}>
                        {#if erUdforsket && felt.hasBoat}
                            {#if !erOpslugt}
                                <div class="sejr-lys"></div>
                            {/if}
                            {#each Array.from({ length: Math.min(felt.boatCount || 1, 4) }, (_ignore, index) => index) as baadNr (baadNr)}
                                <img src="/tiles/baad.webp" alt="Flugtbåd" class="escape-boat boat-{baadNr}" data-help-title="Flugtbåd" data-help-body="Gå ind på bådfeltet for at vinde og forlade øen. Hver båd kan bruges én gang." />
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
                                <img src="/tiles/{felt.afgroede === 'hvede' ? 'brokenwheat.webp' : 'brokenbean.webp'}" class="crop-icon" alt="" data-help-title="Ødelagt afgrøde" data-help-body="Afgrøden er ødelagt og giver ikke længere mad eller heling." />
                            {:else if !erHoestet && !erPlageramt}
                                {#if erModen}
                                    <img src="/tiles/{felt.afgroede === 'hvede' ? 'wheat.webp' : 'beans.webp'}" class="crop-icon moden" alt="" data-help-title="Moden afgrøde" data-help-body="En moden afgrøde. Når du går ind på feltet, kan den give lidt HP, medmindre en insektplage rammer." />
                                {:else}
                                    <img src="/tiles/{felt.afgroede === 'hvede' ? 'growingwheat.webp' : 'growingbean.webp'}" class="crop-icon" alt="" data-help-title="Voksende afgrøde" data-help-body="Afgrøden er ikke moden endnu. Hvis du tramper gennem den for tidligt, bliver den skadet." />
                                {/if}
                            {/if}
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.biome === 'meteor' && felt.hasMeteorStone}
                            <img src="/tiles/meteorsten.webp" class="meteor-stone-icon" alt="" data-help-title="Meteorsten" data-help-body="Meteorstenen markerer et meteor-event. Feltet styres af meteorens egen belønning og fare." />
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.taageBlokker}
                            <img src="/tiles/blokker.webp" class="taageblokker-icon" class:taageblokker-inaktiv={spilTilstand.fogX < 0} alt="Tågeblokker" data-help-title="Tågeblokker" data-help-body="Holder tågen tilbage fra venstre side. Når tågen vender fra højre, beskytter blokkeren ikke længere." />
                        {/if}

                        {#if (erUdforsket || erSkattekortRygte) && !felt.gravet}
                            {@const erIndenForPejling = regnHexAfstand(spilTilstand.spillerIndex, i, kortBredde) <= pejleRadius}
                            {#if felt.isSkatteKlynge && (erSkattekortRygte || aktiveSkattekortFelter.includes(i))}
                                <img src="/tiles/treasuremark.webp" alt="Mulig skat" class="treasure-mark-icon" data-help-title="Mulig skat" data-help-body="Skattekortet peger på dette felt som mulig skatteklynge. Kortet viser ikke, om kisten stadig er her." />
                            {/if}
                            {#if erUdforsket && harDetektor && erIndenForPejling && (felt.skjultGuld ?? 0) > 0}
                                <img src="/tiles/guldtaage.webp" alt="" class="mist-icon" data-help-title="Guldspor" data-help-body={harMalmviser ? 'Din malmviser mærker skjult guld på kendte felter inden for radius 3. Grav feltet for at få det frem med malmviserbonus.' : 'Din metaldetektor mærker skjult guld på kendte felter inden for radius 3. Grav feltet for at få det frem.'} style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultGuld ?? 0) / 80});" />
                            {/if}
                            {#if erUdforsket && harKvist && erIndenForPejling && (felt.skjultLiv ?? 0) > 0}
                                <img src="/tiles/livtaage.webp" alt="" class="mist-icon" data-help-title="Rodspor" data-help-body={harRunekvist ? 'Runekvisten mærker helende rødder på kendte felter inden for radius 3. Hvis du mangler HP, trækkes de automatisk op, når du går ind på feltet.' : 'Søgekvisten mærker helende rødder på kendte felter inden for radius 3. Grav feltet for at finde dem.'} style="transform: translate(-50%, -50%) scale({0.3 + (felt.skjultLiv ?? 0) / 40});" />
                            {/if}
                        {/if}
                        
                        {#if erUdforsket && felt.gravet}
                            <img src="/tiles/udgravning.webp" alt="" class="dug-image" data-help-title="Udgravning" data-help-body="Feltet er allerede gravet op. Skjulte fund og fælder her er brugt." />
                        {/if}

                        {#if erUdforsket && felt.tomSkattekiste}
                            <img src="/tiles/empty_treasure.webp" alt="Tom skattekiste" class="empty-treasure-icon" data-help-title="Tom skattekiste" data-help-body="Skatten er taget. Kisten bliver liggende som spor, men giver ikke mere." />
                        {/if}
                        
                        {#if erUdforsket && felt.hasGoldmine}
                            <div class="goldmine-container" data-help-title="Guldmine" data-help-body={felt.mineOwner ? `Guldminen ejes af ${felt.mineOwner}. Ejeren får score, og andre kan forsøge at overtage den, hvis den ikke er låst.` : 'Guldmine giver guld og score, når du overtager den. Besøg den igen for at låse den.'}>
                                <img src="/tiles/goldmine.webp" alt="Guldmine" class="goldmine-icon" />
                                {#if felt.mineOwner}
                                    <div class="owner-badge" class:locked={felt.mineLocked}>
                                        <img src={felt.mineOwner === spilTilstand.spillerNavn ? spilTilstand.valgtKarakter?.ikon : (spilTilstand.alleSpillere[felt.mineOwner]?.ikon || '/tiles/player.webp')} alt="Ejer" class="mine-owner-portrait" data-help-title="Mine-ejer" data-help-body={`Denne spiller ejer minen: ${felt.mineOwner}.`} />
                                        {#if felt.mineLocked}
                                            <span class="lock-icon" data-help-title="Låst mine" data-help-body="Minen er låst af ejeren og kan ikke overtages lige nu.">🔒</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        {#if erUdforsket && felt.eventID && !felt.eventFuldført}
                            {#if felt.eventID === 'campfire'}
                                <img src="/tiles/campfire.webp" alt="" class="campfire-icon" data-help-title="Lejrbål" data-help-body="Lejrbålet er et event eller hvilepunkt. Gå ind på feltet for at aktivere det." />
                            {:else if felt.eventID !== 'meteor_skat'}
                                <img src="/tiles/event.png" alt="" class="event-crystal" data-help-title="Event" data-help-body="Feltet har et event. Når du går ind på feltet, åbner et valg eller en situation." />
                            {/if}
                        {/if}

                        {#if erUdforsket && felt.hasPortal && !(felt.eventID && !felt.eventFuldført)}
                            <img src="/tiles/portal.webp" alt="Portal" class="portal-icon" data-help-title="Portal" data-help-body="Portalen slynger dig 4, 5 eller 6 felter mod øst. Landingsfeltet aktiveres som et normalt felt." />
                        {/if}

                        {#if erUdforsket && harKoebbarShop(felt)}
                            <img 
                                src="/tiles/{felt.biome === 'by' ? 'byshop.webp' : 'markedshop.webp'}" 
                                alt="" 
                                class="shop-icon" 
                                data-help-title={felt.biome === 'by' ? 'Bybutik' : 'Marked'}
                                data-help-body="Butikken sælger dagens varer for guld. Hylden deles af spillerne og genfyldes med butikkens faste varer næste dag. Har du kølle eller murknuser, stopper købmanden med at handle med dig efter et køb."
                                onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} 
                            />
                        {/if}

                        {#if erUdforsket && felt.hasWorkshop}
                            <img
                                src="/tiles/vaerksted.webp"
                                alt=""
                                class="workshop-icon"
                                data-help-title="Værksted"
                                data-help-body="Værkstedet opgraderer udstyr og erstatter den gamle genstand med den nye. Har du kølle eller murknuser, tør mesteren kun arbejde for dig én gang."
                            />
                        {/if}

                        {#if erUdforsket && !erOpslugt && felt.indbrudt && felt.biome === 'by'}
                            <span class="indbrud-marker" aria-label="Indbrudt" data-help-title="Indbrudt" data-help-body="Byfeltet er allerede brudt op med dirk. Det markerer et brugt indbrudssted.">
                                <img src="/tiles/openlock.webp" alt="" class="indbrud-icon" />
                            </span>
                        {/if}

                        {#if erUdforsket && gravstenListeForFelt(felt).length > 0}
                            {@const gravstenListe = gravstenListeForFelt(felt)}
                            {@const gravsten = nyesteGravsten(felt)}
                            <button
                                type="button"
                                class="gravsten-container"
                                data-help-title="Gravsten"
                                data-help-body={gravstenHjaelpetekst(felt)}
                                onclick={(e) => visGravsten(e, felt)}
                            >
                                <img src="/tiles/gravsted.webp" alt="Død" class="gravsten-ikon" />
                                {#if gravsten}
                                    <img src={gravsten.ikon} alt="Faldet" class="gravsten-portraet" />
                                {/if}
                                {#if gravstenListe.length > 1}
                                    <span class="gravsten-count">{gravstenListe.length}</span>
                                {/if}
                            </button>
                        {/if}
                        
                        {#if erUdforsket}
                            {@const farvelBaade = farvelBaadeForFelt(i)}
                            {#if farvelBaade.length > 0}
                                <div class="farvel-baade-container">
                                    {#each farvelBaade as farvel, farvelNr (farvel.navn)}
                                    <span class="farvel-baad" data-help-title="Farvelbåd" data-help-body={`${farvel.navn} slap væk fra øen her. Ikonet er kun minde/pynt og forsvinder ved game reset.`} style="--farvel-offset: {(farvelNr - (farvelBaade.length - 1) / 2) * 18}px;">
                                            <img src="/tiles/baad.webp" alt="" class="farvel-baad-ikon" />
                                            <img src={farvel.ikon} alt="Sluppet vÃ¦k" class="farvel-baad-portraet" />
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        {/if}

                        {#each Object.entries(spilTilstand.alleSpillere) as [navn, mod] (navn)}
                            {#if navn !== spilTilstand.spillerNavn && mod.index === i && !mod.isDead && !mod.isWinner}
                                {@const afstand = regnHexAfstand(spilTilstand.spillerIndex, mod.index, kortBredde)}
                                {@const tracket = erTrackerAktivPaa(navn)}
                                {@const synlig = afstand <= aktuelSynsRadius || tracket}
                                <span class="modstander-icon" data-help-title={synlig ? navn : 'Ukendt spiller'} data-help-body={synlig ? `${navn} står på dette felt.` : (mod.activeAlarm ? 'Du kan høre alarm/lyd fra en spiller her, men kan ikke se hvem det er.' : 'En spiller er tæt på, men uden for dit syn.')} class:alarm-aktiv={mod.activeAlarm && !synlig} class:skjult-lyd={!synlig && !mod.activeAlarm} class:tracker-aktiv={tracket}>
                                    <img src={synlig ? (mod.ikon || '/tiles/player.webp') : '/tiles/player.webp'} alt="" style="height: {synlig ? '58px' : '70px'};" />
                                </span>
                            {/if}
                        {/each}

                        {#if spilTilstand.spillerIndex === i && sejlendeBaadIndex !== i && spilTilstand.gameState !== 'dead' && spilTilstand.gameState !== 'win'}
                            <span class="player-icon" data-help-title="Dig" data-help-body="Din karakter står her. Tryk på nabofelter for at bevæge dig." style="position: relative; display: inline-flex; justify-content: center; z-index: 20;">
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
                    <div class="sailing-container" data-help-title="Afrejse" data-help-body="Du er på vej væk i båden. Om lidt vises slutkortet." style="left: {posX}px; top: {posY}px;">
                        <img src="/tiles/baad.webp" alt="Flugtbåd" class="escape-boat" />
                        <img src={spilTilstand.valgtKarakter?.ikon} alt="" class="sejler-ikon" />
                    </div>
                {/if}
            {/each}

            {#if skattekortLinjer.length > 0}
                <svg class="skattekort-linje-canvas" aria-hidden="true">
                    {#each skattekortLinjer as linje (linje.id)}
                        <line
                            x1={linje.fra.x}
                            y1={linje.fra.y}
                            x2={linje.til.x}
                            y2={linje.til.y}
                            class="skattekort-linje"
                        />
                    {/each}
                </svg>

                {#each spilTilstand.gitter as felt, i (i)}
                    {@const raekke = Math.floor(i / kortBredde)}
                    {@const kolonne = i % kortBredde}
                    {@const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0)}
                    {@const posY = raekke * ROW_H}
                    {@const erUdforsket = spilTilstand.devVisHeleKort || spilTilstand.mineKendteFelter.includes(i)}
                    {@const erOpslugt = !spilTilstand.devVisHeleKort && erFeltITaagen(spilTilstand.gitter, i, spilTilstand.fogX, kortBredde)}
                    {#if erUdforsket && !erOpslugt && felt.eventID && !felt.eventFuldført}
                        {#if felt.eventID === 'campfire'}
                            <img src="/tiles/campfire.webp" alt="" class="campfire-icon skattekort-ikon-overlag" aria-hidden="true" style="left: {posX + HEX_W / 2}px; top: {posY + 55}px;" />
                        {:else if felt.eventID !== 'meteor_skat'}
                            <img src="/tiles/event.png" alt="" class="event-crystal skattekort-ikon-overlag" aria-hidden="true" style="left: {posX + HEX_W / 2}px; top: {posY + 55}px;" />
                        {/if}
                    {/if}
                {/each}
            {/if}

            {#if baadLinjer.length > 0}
                <svg class="baad-linje-canvas" aria-hidden="true">
                    {#each baadLinjer as linje (linje.id)}
                        <line
                            x1={linje.fra.x}
                            y1={linje.fra.y}
                            x2={linje.til.x}
                            y2={linje.til.y}
                            class="baad-linje"
                        />
                    {/each}
                </svg>
            {/if}

            {#if spilTilstand.gameState === 'win_map' || spilTilstand.gameState === 'dead_map'}
                <svg class="rute-canvas">
                    {#each Object.entries(spilTilstand.alleSpillere) as [navn, data] (navn)}
                        {#if navn === spilTilstand.spillerNavn}
                            {#each data.tidligereHistorik || [] as gammelRute, ruteIndex (`${navn}-${ruteIndex}`)}
                                {#if gammelRute.length > 1}
                                    {@const oldPointsArray = gammelRute.map((idx: number) => {
                                        const raekke = Math.floor(idx / kortBredde);
                                        const kolonne = idx % kortBredde;
                                        const posX = kolonne * HEX_W + (raekke % 2 !== 0 ? HEX_W / 2 : 0) + (HEX_W / 2);
                                        const posY = raekke * ROW_H + 55;
                                        return {x: posX, y: posY};
                                    })}
                                    {@const oldPoints = oldPointsArray.map(p => `${p.x},${p.y}`).join(' ')}

                                    <polyline
                                        points={oldPoints}
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.5)"
                                        stroke-width="1.35"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="flugtrute-gammel"
                                    />
                                {/if}
                            {/each}
                        {/if}

                        {#if data.historik && data.historik.length > 1}
                            {@const pointsArray = data.historik.map((idx: number) => {
                                const raekke = Math.floor(idx / kortBredde);
                                const kolonne = idx % kortBredde;
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
                                stroke={erMig ? '#ffffff' : 'rgba(192, 238, 78, 0.82)'} 
                                stroke-width={erMig ? "6" : "4"}
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                class={erMig ? 'flugtrute' : 'flugtrute flugtrute-modspiller'}
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

{#if inspectAktiv}
    <div class="inspect-hint" role="status">
        Tryk på et felt, ikon eller en knap
    </div>
{/if}

{#if inspectBoble}
    <div
        class="inspect-boble"
        style="left: {inspectBoble.x}px; top: {inspectBoble.y}px;"
        role="dialog"
        aria-live="polite"
    >
        <button type="button" class="inspect-luk" onclick={lukInspect} aria-label="Luk forklaring">×</button>
        <h3>{inspectBoble.titel}</h3>
        <p>{inspectBoble.tekst}</p>
    </div>
{/if}

{#if introAktiv}
    <div class="intro-overlay">
        <div class="intro-box">
            <div class="intro-media">
                <video autoplay muted playsinline aria-label="Startvideo">
                    <source src="/video/start_video.mp4" type="video/mp4" />
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
{#if spilTilstand.aktivVaerksted} <WorkshopModal lukVaerksted={lukEventOgShop} /> {/if}
{#if spilTilstand.venteSpilAktiv} <VenteModal kanSpilleIgen={spilTilstand.dag > hentLangsomsteDag() && !erVenteTidUdlobet(venteUrTick)} /> {/if}

{#if spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'win_map'}
    <div class="slut-panel" class:vundet={spilTilstand.gameState === 'win_map'}>
        <div class="slut-header">
            <h2>{spilTilstand.gameState === 'win_map' ? 'Du slap væk' : 'Du døde'}</h2>
            <p>{spilTilstand.logBesked}</p>
        </div>
        
        <div class="rangliste">
            {#each hentKortRangliste() as { navn, data, score } (navn)}
                <div class="raekke" class:mig={navn === spilTilstand.spillerNavn}>
                    <img src={data.ikon || '/tiles/player.webp'} alt="" />
                    <div class="info">
                        <strong>{navn}</strong>
                        <span>{data.isWinner ? 'Sluppet væk' : (data.isDead ? (data.deathCause ? `Død i ${data.deathCause === 'vand' ? 'vand' : 'tåge'}` : 'Død') : 'I tågen')}</span>
                    </div>
                    <div class="stats">
                        <span title="Score">{score}</span>
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

        .zoom-actions {
            display: flex;
            top: calc(env(safe-area-inset-top, 0px) + 64px);
            right: 10px;
        }

        .top-ikon-knap {
            width: 42px;
            height: 42px;
            font-size: 1.55rem;
        }
    }

    .game-container { position: fixed; inset: 0; width: 100vw; height: 100dvh; overflow: hidden; background: #000; user-select: none; -webkit-user-select: none; }
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
    .top-ikon-knap {
        width: 48px;
        height: 48px;
        border: none;
        background: transparent;
        color: #f4f4f4;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.8rem;
        line-height: 1;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
        transition: transform 0.2s, color 0.2s, text-shadow 0.2s;
    }
    .top-ikon-knap:hover,
    .top-ikon-knap.aktiv {
        color: #fff;
        transform: scale(1.04);
        text-shadow: 0 0 14px rgba(255, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.95);
    }
    .fokus-knap {
        font-size: 1.95rem;
    }
    .inspect-hint {
        position: fixed;
        left: 50%;
        top: calc(env(safe-area-inset-top, 0px) + 18px);
        transform: translateX(-50%);
        z-index: 4200;
        max-width: calc(100vw - 24px);
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 8px;
        background: rgba(18, 18, 18, 0.88);
        color: #f6f6f6;
        font-size: 0.9rem;
        font-weight: 700;
        pointer-events: none;
        box-shadow: 0 10px 30px rgba(0,0,0,0.45);
    }
    .inspect-boble {
        position: fixed;
        z-index: 4300;
        width: min(280px, calc(100vw - 24px));
        max-height: min(52dvh, 260px);
        overflow-y: auto;
        box-sizing: border-box;
        padding: 14px 38px 14px 14px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 8px;
        background: rgba(20, 20, 20, 0.94);
        color: #f2f2f2;
        box-shadow: 0 18px 55px rgba(0,0,0,0.62);
    }
    .inspect-boble h3 {
        margin: 0 0 7px;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.05rem;
        letter-spacing: 0;
    }
    .inspect-boble p {
        margin: 0;
        color: #d9d9d9;
        font-size: 0.92rem;
        line-height: 1.4;
        white-space: pre-line;
    }
    .inspect-luk {
        position: absolute;
        top: 7px;
        right: 7px;
        width: 26px;
        height: 26px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
    }
    .zoom-actions {
        position: fixed;
        right: 14px;
        top: calc(env(safe-area-inset-top, 0px) + 72px);
        z-index: 2100;
        display: none;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
    }
    .zoom-actions button {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: rgba(12, 14, 14, 0.78);
        color: #fff;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        touch-action: manipulation;
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
    .intro-media video {
        width: 100%;
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
    .hex.skattekort-rygte {
        background-image: none;
        opacity: 1;
    }
    .hex.skattekort-rygte .inner::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
            linear-gradient(rgba(226, 163, 66, 0.46), rgba(139, 75, 24, 0.36)),
            var(--rygte-bg);
        background-size: cover;
        filter: sepia(0.62) saturate(1.35) hue-rotate(-8deg) brightness(0.92) contrast(1.03);
        opacity: 0.92;
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

    .skattekort-linje-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 8;
        overflow: visible;
    }

    .skattekort-linje {
        stroke: rgba(210, 58, 42, 0.56);
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-dasharray: 5 7;
    }

    .baad-linje-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 28;
        overflow: visible;
    }

    .baad-linje {
        stroke: rgba(255, 255, 255, 0.42);
        stroke-width: 1.2;
        stroke-linecap: round;
        stroke-dasharray: 8 10;
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.45));
    }

    .rute-canvas {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 18; overflow: visible;
    }
    .flugtrute { animation: tegnRute 3s linear forwards; filter: drop-shadow(0 0 5px rgba(255,255,255,0.4)); }
    .flugtrute-modspiller { filter: drop-shadow(0 0 6px rgba(190, 238, 78, 0.55)); }
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
    .skattekort-ikon-overlag {
        position: absolute;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 20;
        animation: none;
    }
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
    .workshop-icon {
        position: absolute; width: auto; height: 83px; top: calc(54% - 2px); left: 50%;
        transform: translate(-50%, -50%); pointer-events: none; z-index: 15;
        object-fit: contain;
        filter: drop-shadow(0 0 12px rgba(255, 210, 90, 0.85)) drop-shadow(0 5px 7px rgba(0,0,0,0.9));
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
        display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto;
        height: 60px; border: 0; padding: 0; margin: 0; background: transparent; cursor: pointer;
    }
    .gravsten-ikon { position: absolute; width: 100%; height: auto; z-index: 1; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); }
    .gravsten-portraet {
        position: relative; z-index: 2; width: 38px; margin-top: -8px;
        filter: grayscale(100%) sepia(10%) brightness(0.6) contrast(1.2); opacity: 0.85;
    }
    .gravsten-count {
        position: absolute; right: 1px; bottom: 0; z-index: 3;
        min-width: 18px; height: 18px; padding: 0 4px; box-sizing: border-box;
        display: inline-flex; align-items: center; justify-content: center;
        border-radius: 999px; background: rgba(20, 20, 20, 0.88); color: #f1f1f1;
        font-size: 0.72rem; font-weight: 800; line-height: 1;
        border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .farvel-baade-container {
        position: absolute;
        left: 50%;
        bottom: 8px;
        width: 0;
        height: 42px;
        z-index: 12;
        pointer-events: none;
    }
    .farvel-baad {
        position: absolute;
        left: var(--farvel-offset, 0px);
        bottom: 0;
        width: 46px;
        height: 38px;
        transform: translateX(-50%);
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }
    .farvel-baad-ikon {
        position: absolute;
        bottom: 0;
        width: 48px;
        height: auto;
        filter: grayscale(100%) brightness(0.55) contrast(1.15) drop-shadow(0 3px 5px rgba(0,0,0,0.8));
        opacity: 0.62;
    }
    .farvel-baad-portraet {
        position: relative;
        z-index: 2;
        width: 25px;
        margin-bottom: 7px;
        filter: grayscale(100%) sepia(10%) brightness(0.62) contrast(1.18);
        opacity: 0.78;
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
