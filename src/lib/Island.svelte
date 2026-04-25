<script lang="ts">
    import './Island.css';
    
    import { BREDDE, HOEJDE, HEX_W, ROW_H, itemDB, tilgaengeligeKarakterer, biomeTerraenCost, biomeVægte } from '$lib/spildata';
    import type { Felt, Karakter } from '$lib/types';
    import { onMount } from 'svelte';

onMount(() => {
    const tjekFaneFokus = () => {
        if (document.visibilityState === 'visible') {
            // Vi centrerer kun, hvis spillet faktisk er i gang
            if (spilTilstand.gameState === 'play') {
                cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
            }
        }
    };

    document.addEventListener('visibilitychange', tjekFaneFokus);

    // Rydder pænt op efter sig, hvis komponenten lukkes
    return () => {
        document.removeEventListener('visibilitychange', tjekFaneFokus);
    };
});
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import { spilTilstand } from '$lib/spilTilstand.svelte';
    import { skabKamera } from '$lib/kamera.svelte';
    import { hentHighscores, gemHighscore, syncTilDb, startRealtime } from '$lib/netvaerk';
    
    import { hvil, hentNaboIndices, afslørOmraade } from '$lib/spilmotor';
    import { eventBibliotek } from '$lib/eventBibliotek';
    
    import { grav, genererUndergrund } from '$lib/undergrund.svelte';
    import { tjekOverlevelse, fremrykTid, erSpillerITaagen, udfoerBlodofring } from '$lib/overlevelse.svelte';
    import { startVenteSpil, vendKort, stopVenteSpil, lukVenteSpil } from '$lib/ventespil.svelte';

    import { eventState, startEvent, lukEvent as motorLukEvent, kanViseValg, tagValg } from '$lib/eventMotor.svelte';

    const cam = skabKamera();
    const MAX_DAGE_FORAN = 5;

    let visMandlige = $state(true);
    let visKvindelige = $state(true);
    let topTre = $state<Array<{ navn: string, score: number, karakter?: string }>>([]);

    let fremdriftPoint = $derived(spilTilstand.maxKolonne * 1);
    let winBonus = $derived(spilTilstand.gameState === 'win' ? 1000 : 0);
    
    let harDetektor = $derived(spilTilstand.inventory?.some(i => i.id === 'metaldetektor') ?? false);
    let harKvist = $derived(spilTilstand.inventory?.some(i => i.id === 'soegekvist') ?? false);
    let erITågen = $derived(erSpillerITaagen());
    
    $effect(() => {
        spilTilstand.samletScore = Math.floor((spilTilstand.guldTotal + fremdriftPoint + winBonus) * (1 + (Math.max(0, spilTilstand.livspoint) / 1000)));
    });

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

    function opretTastatur() {
        if (kbdRef) window.removeEventListener('keydown', kbdRef);
        kbdRef = (ev: KeyboardEvent) => { 
            // Denne linje dræber "maskingeværs-effekten", når man holder en knap nede
            if (ev.repeat) return; 
            
            if (eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play') return;
            
            const key = ev.key.toLowerCase();
            
if (key === 'g') {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (felt.gravet) return; 

    // Kast bolden direkte ned i maskinrummet, og lad den ordne resten
    grav();
}
            else if (key === 'f') { 
                cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H); 
            }
            else if (key === 'h') hvil();
            else if (key === 'q') flytHex('NW');
            else if (key === 'e') flytHex('NE');
            else if (key === 'a') flytHex('W');
            else if (key === 'd') flytHex('E');
            else if (key === 'z') flytHex('SW');
            else if (key === 'c') flytHex('SE');
            else if (key === 'enter') klikPåHex(spilTilstand.spillerIndex);
            else if (key === '0') givOp(); 
            else if (key === 'y') {
                spilTilstand.livspoint = 1000;
                spilTilstand.guldTotal += 5000;
                
                spilTilstand.inventory = []; 
                Object.values(itemDB).forEach(dbItem => {
                    spilTilstand.inventory.push({ 
                        id: dbItem.id, level: dbItem.bonus > 0 ? dbItem.bonus : 1, navn: dbItem.navn, billede: dbItem.billede, type: dbItem.type 
                    });
                });
                spilTilstand.logBesked = "GUDETILSTAND: Max HP, masser af guld og alle genstande i spillet!";
                syncTilDb(true);
            }
        };
        window.addEventListener('keydown', kbdRef);
    }

    async function opdaterOgGemHighscore() {
        await gemHighscore();
        topTre = await hentHighscores();
    }

    async function initialiserGitter() {
        const antal = BREDDE * HOEJDE;
        const totalVægt = biomeVægte.reduce((sum, b) => sum + b.vaegt, 0);
        
        let råKort = Array(antal).fill('').map((_, i) => {
            const r = Math.floor(i / BREDDE); const k = i % BREDDE;
            if (r === 0 || r === HOEJDE - 1 || k === 0 || k === BREDDE - 1) return 'hav';
            let roll = Math.random() * totalVægt;
            for (let b of biomeVægte) { if (roll < b.vaegt) return b.id; roll -= b.vaegt; }
            return 'mark';
        });

        for (let pass = 0; pass < 3; pass++) {
            let nytKort = [...råKort];
            for (let i = 0; i < antal; i++) {
                const r = Math.floor(i / BREDDE); const k = i % BREDDE;
                if (r === 0 || r === HOEJDE - 1 || k === 0 || k === BREDDE - 1) continue;
                const naboer = hentNaboIndices(i);
                if (Math.random() < 0.70) { 
                    const tilfældigNabo = råKort[naboer[Math.floor(Math.random() * naboer.length)]];
                    const erSjælden = ['hule', 'ritual', 'ruin', 'bandit'].includes(tilfældigNabo);
                    if (!erSjælden || Math.random() < 0.10) nytKort[i] = tilfældigNabo;
                }
            }
            råKort = nytKort;
        }

        let nytGitter: Felt[] = Array(antal).fill(null).map((_, i) => {
            const biome = råKort[i];
            const hemmeligheder = genererUndergrund(biome);
            return { 
                guld: 0, gravet: false, udforsket: false, eventFuldført: false, biome: biome, 
                ...hemmeligheder 
            };
        });        

        let alleGyldigeEvents = Object.keys(eventBibliotek).filter(k => !eventBibliotek[k].erSubTrin && k !== 'campfire');
        const vildmark = ['eng', 'skov', 'mark', 'bjerg'];

        for (let key of alleGyldigeEvents) {
            const event = eventBibliotek[key];
            
            for (let forsøg = 0; forsøg < 100; forsøg++) {
                let randomIndex = Math.floor(Math.random() * antal);
                let f = nytGitter[randomIndex];
                
                if (f.biome === 'hav' || f.eventID) continue; 

                const reqBiome = event.biome;
                const erEtMatch = Array.isArray(reqBiome) 
                    ? reqBiome.includes(f.biome) || reqBiome.includes('alle')
                    : reqBiome === f.biome || reqBiome === 'alle' || reqBiome === 'any' || !reqBiome;

                if (erEtMatch) {
                    f.eventID = key;
                    break;
                }
            }
        }

        for (let i = 0; i < antal; i++) {
            let f = nytGitter[i];
            if (f.biome === 'hav' || f.eventID) continue; 

            if (vildmark.includes(f.biome) && Math.random() < 0.008) { 
                f.isCampfire = true;
                f.eventID = 'campfire';
           } else {
                const salgbareVarer = Object.keys(itemDB).filter(k => itemDB[k].pris > 0 && itemDB[k].type !== 'forbandelse');
                if ((f.biome === 'marked' && Math.random() < 0.33) || (f.biome === 'by' && Math.random() < 0.20)) {
                    let vare1 = salgbareVarer[Math.floor(Math.random() * salgbareVarer.length)];
                    let vare2 = salgbareVarer[Math.floor(Math.random() * salgbareVarer.length)];
                    while(vare1 === vare2) {
                        vare2 = salgbareVarer[Math.floor(Math.random() * salgbareVarer.length)];
                    }
                    f.shopItems = [vare1, vare2]; 
                }
            }
        }
        
        spilTilstand.gitter = nytGitter;
        const muligeStartFelter = [];
        for (let r = 1; r < HOEJDE - 1; r++) {
            if (spilTilstand.gitter[r * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(r * BREDDE + 1);
        }
        spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
        afslørOmraade(spilTilstand.spillerIndex, 1);
    }

    async function opretEllerDeltag() {
        if (spilTilstand.spillerNavn.trim() === '' || spilTilstand.rumKode.trim() === '') {
            spilTilstand.statusBesked = "Udfyld venligst både navn og kode.";
            return;
        }

        spilTilstand.statusBesked = "Forbinder til serveren...";
        const { data } = await supabase.from('spil_sessioner').select('*').eq('rum_kode', spilTilstand.rumKode).single();

        if (data) {
            spilTilstand.gitter = data.kort;
            spilTilstand.alleSpillere = data.spillere || {};
            spilTilstand.fogX = data.fog_x || 0; 
            spilTilstand.erHost = false;

            if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
                spilTilstand.statusBesked = "Velkommen tilbage. Henter dine data...";
                const eksisterende = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
                
                spilTilstand.spillerIndex = eksisterende.index;
                spilTilstand.livspoint = eksisterende.hp;
                spilTilstand.guldTotal = eksisterende.guld;
                spilTilstand.maxKolonne = eksisterende.kolonne;
spilTilstand.nuvaerendeEnergi = eksisterende.energi !== undefined ? eksisterende.energi : (spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.baseEnergi : 0);                spilTilstand.inventory = eksisterende.inventory || [];
                spilTilstand.mineKendteFelter = eksisterende.kendteFelter || [];
                
                spilTilstand.valgtKarakter = tilgaengeligeKarakterer.find(k => k.ikon === eksisterende.ikon) || null;
                
                afslørOmraade(spilTilstand.spillerIndex, 1);
                startRealtime();
                
                if (eksisterende.isDead) {
                    spilTilstand.gameState = 'dead';
                } else if (eksisterende.isWinner) {
                    spilTilstand.gameState = 'win';
                } else {
                    opretTastatur();
                    spilTilstand.gameState = 'play';
                    cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
                }
            } else {
                spilTilstand.statusBesked = "Rum fundet. Deltager som Guest.";
                spilTilstand.spillerIndex = data.start_index;
                afslørOmraade(spilTilstand.spillerIndex, 1);
                startRealtime();
                spilTilstand.gameState = 'select';
            }
        } else {
            spilTilstand.erHost = true;
            spilTilstand.statusBesked = "Nyt rum oprettes. Du er Host.";
            initialiserGitter();
            startRealtime();
            spilTilstand.gameState = 'select';
        }
    }

    async function bekræftValg(karakter: Karakter) {
        spilTilstand.valgtKarakter = karakter;
        spilTilstand.livspoint = karakter.startHp;
        spilTilstand.guldTotal = karakter.startGuld;
        spilTilstand.maxKolonne = 1;
        spilTilstand.nuvaerendeEnergi = karakter.baseEnergi;
        spilTilstand.logBesked = karakter.startMsg;

        spilTilstand.inventory = karakter.startUdstyr.map((itemId: string) => {
            const dbItem = itemDB[itemId];
            return { id: dbItem.id, navn: dbItem.navn, level: dbItem.bonus, billede: dbItem.billede, type: dbItem.type };
        });
        
        if (spilTilstand.erHost) {
            const { error } = await supabase.from('spil_sessioner').insert([{ 
                rum_kode: spilTilstand.rumKode, 
                kort: spilTilstand.gitter, 
                start_index: spilTilstand.spillerIndex,
                spillere: {},
                fog_x: 0
            }]);
            if (error) console.error("Kunne ikke gemme kortet:", error);
        }
        
        await syncTilDb();
        opretTastatur();
        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        spilTilstand.gameState = 'play';
    }

    function lukEventOgShop() { 
        const f = spilTilstand.gitter[spilTilstand.spillerIndex];
        if (f && eventState.aktivt && f.eventID !== 'campfire') {
            f.eventFuldført = true; 
        }
        motorLukEvent();
        spilTilstand.aktivShop = null;
        syncTilDb(true); 
    }

    function hentLangsomsteDag() {
        const nu = Date.now();
        const spillere = Object.values(spilTilstand.alleSpillere);
        
        if (spillere.length <= 1) return spilTilstand.dag;

        const aktiveSpillere = spillere.filter(s => {
            if (s.isDead || s.isWinner) return false;
            if (!s.sidstAktiv) return true; 
            return (nu - s.sidstAktiv) < 1800000; 
        });
        
        if (aktiveSpillere.length === 0) return spilTilstand.dag;
        return Math.min(...aktiveSpillere.map(s => Number(s.dag) || 1));
    }

    function udførBevægelse(nI: number) {
        if (!spilTilstand.valgtKarakter) return;

        if (spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN) {
            if (spilTilstand.sidsteVenteDag === spilTilstand.dag) {
                spilTilstand.logBesked = "Du har allerede hvilet i dag. Vent på de andre.";
                spilTilstand.venteSpilAktiv = true;
                spilTilstand.venteFase = 'venter'; 
            } else {
                spilTilstand.logBesked = "Du er for langt foran de andre. Du må slå lejr og fordrive tiden.";
                spilTilstand.sidsteVenteDag = spilTilstand.dag;
                startVenteSpil(false);
            }
            return; 
        }
        
        const f = spilTilstand.gitter[nI];
        if (!f) return; 

        const nK = nI % BREDDE;

// --- SVØMME-LOGIK ---
if (f.biome === 'hav') {
    // Tjekker om havets pris koster dig livet
    if (spilTilstand.livspoint <= 30) {
        spilTilstand.livspoint = 0;
        spilTilstand.logBesked = "Kræfterne svigter. Bølgerne slår over dit hoved, og du trækker saltvand ned i lungerne. Du drukner.";
        spilTilstand.gameState = 'dead';
        syncTilDb(true);
        return; // Afbryder bevægelsen fuldstændig
    }

    // Hvis du er stærk nok til at tage svømmeturen
    spilTilstand.livspoint -= 30;
    spilTilstand.logBesked = "Du kaster dig ud i de isnende bølger. (-30 HP)";
} else {
    // Normal bevægelse på land
    const terraenModifier = biomeTerraenCost[f.biome] || 1;
    let energiPris = Math.round(spilTilstand.valgtKarakter.moveCost * terraenModifier);
    
    if (erITågen) energiPris *= 2;

            spilTilstand.nuvaerendeEnergi -= energiPris;
            spilTilstand.logBesked = `Træder ind i ${f.biome}.`;
        }
        
        spilTilstand.spillerIndex = nI; 
cam.foelgSpiller(nI, BREDDE, HEX_W, ROW_H);        afslørOmraade(spilTilstand.spillerIndex, f.biome === 'bjerg' ? 2 : 1);
        
        if (nK > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nK;
        
        fremrykTid();

        // --- KIKKERT LOGIK ---
        const harKikkert250 = spilTilstand.inventory.find(i => i.id === 'kikkert_250');
        const harKikkert45 = spilTilstand.inventory.find(i => i.id === 'kikkert_45');

        if (harKikkert250 || harKikkert45) {
            if (spilTilstand.zoomLåsTure === 0) spilTilstand.zoomLåsTure = 5; 
            
            spilTilstand.zoomLåsTure -= 1;
            cam.saetZoom(harKikkert250 ? 2.5 : 0.45);
            
            if (spilTilstand.zoomLåsTure <= 0) {
                spilTilstand.guldTotal += 50;
                spilTilstand.logBesked = "Forbandelsen hæves. En samler køber kikkerten af dig for 50 Guld!";
                spilTilstand.inventory = spilTilstand.inventory.filter(i => i.id !== 'kikkert_250' && i.id !== 'kikkert_45');
                cam.saetZoom(1); 
            }
        }

        
        if (nK === BREDDE - 2) { 
            spilTilstand.gameState = 'win'; 
            if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
                spilTilstand.alleSpillere[spilTilstand.spillerNavn].score = spilTilstand.samletScore;
                spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = true;
            }
            opdaterOgGemHighscore();
            syncTilDb(true); 
            return; 
        }

        if (f.eventID && !f.eventFuldført) {
            startEvent(f.eventID); 
        } else if (f.shopItems && f.shopItems.length > 0) {
            spilTilstand.aktivShop = f.shopItems;
        }
        syncTilDb(true); 
    }

    function flytHex(retning: string) {
        if (spilTilstand.erBevidstløs || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play' || !spilTilstand.valgtKarakter) return; 
        
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
        
        if (nI >= 0 && nI < BREDDE * HOEJDE && Math.abs(k - nK) <= 1 && Math.abs(r - nR) <= 1) { 
            udførBevægelse(nI);
        }
    }

    function klikPåHex(nI: number) {
        if (spilTilstand.erBevidstløs || cam.harTrukket || eventState.aktivt || spilTilstand.aktivShop || spilTilstand.gameState !== 'play' || !spilTilstand.valgtKarakter) return; 
        if (nI === spilTilstand.spillerIndex) return;

        const naboer = hentNaboIndices(spilTilstand.spillerIndex);
        if (!naboer.includes(nI)) { 
            spilTilstand.logBesked = "Du kan kun rykke til et direkte nabofelt."; 
            return; 
        }
        udførBevægelse(nI);
    }

    function nulstilHukommelse() {
        if (browser) window.location.reload();
    }

    function givOp() {
        if (confirm("Er du sikker på, at du vil overgive dig til mørket? Dette dræber din karakter øjeblikkeligt.")) {
            spilTilstand.livspoint = 0;
            spilTilstand.logBesked = "Du gav op og lod tågen omslutte dig.";
            syncTilDb(true);
        }
    }

 async function genstartBane() {
        spilTilstand.gitter = spilTilstand.gitter.map(f => ({
            ...f, gravet: false, udforsket: false, eventFuldført: false
        }));

        // Fjerner karakteren, så spilleren tvinges til at vælge en ny
        spilTilstand.valgtKarakter = null; 
        
        spilTilstand.maxKolonne = 1;
        spilTilstand.dag = 1;
        spilTilstand.fogX = 0; 
        spilTilstand.mineKendteFelter = [];
        
        const muligeStartFelter = [];
        for (let r = 1; r < HOEJDE - 1; r++) {
            if (spilTilstand.gitter[r * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(r * BREDDE + 1);
        }
        spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
        
        afslørOmraade(spilTilstand.spillerIndex, 1);
        cam.centrerPåHex(spilTilstand.spillerIndex, BREDDE, HEX_W, ROW_H);
        cam.saetZoom(1);
        
        spilTilstand.logBesked = "Tiden spoler tilbage. Vælg din næste vandrer.";
        
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = false;
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = false;
        }

        await supabase.from('spil_sessioner')
            .update({ fog_x: 0, kort: spilTilstand.gitter })
            .eq('rum_kode', spilTilstand.rumKode);

        syncTilDb(true);

        // Sender spilleren til karaktervalg i stedet for 'play'
        spilTilstand.gameState = 'select';
    }

    function købVare(id: string) {
        const dbItem = itemDB[id];
        if (!dbItem) return;

        const index = spilTilstand.inventory.findIndex(i => i.id === id);
        const grundPris = dbItem.pris;

        if (index > -1) {
            spilTilstand.logBesked = `Du bærer allerede rundt på ${dbItem.navn}. Du har ikke brug for flere.`;
            return;
        }

        if (spilTilstand.guldTotal >= grundPris) {
            spilTilstand.guldTotal -= grundPris;
            spilTilstand.inventory.push({ 
                id: id, level: 1, navn: dbItem.navn, billede: dbItem.billede, type: dbItem.type 
            });
            spilTilstand.logBesked = `Du købte ${dbItem.navn}.`;
            syncTilDb(true);
        } else {
            spilTilstand.logBesked = `Købmanden ryster på hovedet. Du mangler ${grundPris - spilTilstand.guldTotal} guld.`;
        }
    }

    onMount(() => {
        opdaterOgGemHighscore();
    });
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
        <h1>Du kom ikke væk fra tågeøen</h1>
<p class="beskrivelse">{spilTilstand.logBesked}</p>        <h2>Endelig Score: {spilTilstand.samletScore}</h2>
        <div class="slut-knapper">
    <button class="slut-knap" onclick={genstartBane}>Prøv samme ø igen</button>
    <button class="slut-knap" onclick={nulstilHukommelse}>Prøv en anden ø</button>
</div>     
        
        
    </div>
{:else if spilTilstand.gameState === 'win'}
    <div class="overlay win-screen">
        <h1>Tågeøen er besejret!</h1>
        <p>Du har nået den fjerne kyst og overlevet Tågeøen.</p>
        <h2>Endelig Score: {spilTilstand.samletScore}</h2>
       <div class="slut-knapper">
    <button class="slut-knap" onclick={genstartBane}>Prøv samme ø igen</button>
    <button class="slut-knap" onclick={nulstilHukommelse}>Prøv en anden ø</button>
</div>     
        
        <div class="highscore-board">
            <h3>Top 3 på {spilTilstand.rumKode}</h3>
            {#if topTre.length === 0}
                <p>Øens fjerneste kyster er uberørte</p>
            {:else}
                <ol>
                    {#each topTre as hs, i (i)}
                        <li><strong>{hs.navn}</strong> <em>({hs.karakter || 'Ukendt'})</em>: {hs.score} point</li>
                    {/each}
                </ol>
            {/if}
        </div>
    </div>
{:else}
    <div class="game-container">
        <div class="camera" role="presentation" onwheel={(e) => cam.håndterZoom(e, !!eventState.aktivt || !!spilTilstand.aktivShop)} onpointerdown={(e) => cam.startTræk(e, !!eventState.aktivt || !!spilTilstand.aktivShop)} onpointermove={cam.træk} onpointerup={cam.stopTræk} onpointercancel={cam.stopTræk} style="cursor: {cam.isDragging ? 'grabbing' : 'grab'}; touch-action: none;">
            <div class="map" style={kameraStyle}>
         {#each spilTilstand.gitter as felt, i (i)}
                    {@const r = Math.floor(i / BREDDE)}
                    {@const k = i % BREDDE}
                    {@const x = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0)}
                    {@const y = r * ROW_H}
                    {@const erJegHer = spilTilstand.spillerIndex === i} 
                    {@const erUdforsket = spilTilstand.mineKendteFelter.includes(i)}
                    {@const erOpslugt = x <= spilTilstand.fogX}
                    {@const baggrund = !erUdforsket ? '/tiles/taage.webp' : (erOpslugt ? `/tiles/${felt.biome}_taage.webp` : `/tiles/${felt.biome}.webp`)}
                    
                    <div class="hex" 
                         class:odd={r % 2 !== 0} 
                         class:active={erJegHer} 
                         class:unexplored={!erUdforsket}
                         onclick={() => klikPåHex(i)}
                         onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                         role="button"
                         tabindex="0"
                         style="background-image: url('{baggrund}'); left: {x}px; top: {y}px; cursor: pointer;">
                        <div class="inner">
                            
                            {#if erUdforsket && !felt.gravet}
                {#if harDetektor && (felt.skjultGuld ?? 0) > 0}
                    <img src="/tiles/guldtaage.webp" alt="Guld spor" style="position: absolute; top: 50%; left: 50%; width: 80%; height: auto; transform: translate(-50%, -50%) scale({0.3 + ((felt.skjultGuld ?? 0) / 100)}); pointer-events: none; z-index: 5; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" class:taage-kvalt={erOpslugt} />
                {/if}
                {#if harKvist && (felt.skjultLiv ?? 0) > 0}
                    <img src="/tiles/livtaage.webp" alt="Liv spor" style="position: absolute; top: 50%; left: 50%; width: 80%; height: auto; transform: translate(-50%, -50%) scale({0.3 + ((felt.skjultLiv ?? 0) / 50)}); pointer-events: none; z-index: 5; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));" class:taage-kvalt={erOpslugt} />
                {/if}                           
            {/if}

            {#if felt.gravet}
                <img src="/tiles/udgravning.webp" alt="Udgravet" class="dug-image" class:taage-kvalt={erOpslugt} />
            {/if}

            {#if erUdforsket && felt.eventID && felt.eventID !== 'campfire' && !felt.eventFuldført} 
                <img src="/tiles/event.png" alt="Event" class="event-crystal" class:taage-kvalt={erOpslugt} />
            {/if}

            {#if erUdforsket && felt.isCampfire} 
                <img src="/tiles/campfire.webp" alt="Lejrbål" class="campfire-icon-img" class:taage-kvalt={erOpslugt} />
            {/if}

            {#if erUdforsket && felt.shopItems} 
                <img src={felt.biome === 'by' ? '/tiles/byshop.png' : '/tiles/markedshop.png'} alt="Butik" class="shop-icon-img" class:taage-kvalt={erOpslugt} />
            {/if}

            {#if erJegHer} 
                <span class="player-icon" style="z-index: 10;">
                    {#if spilTilstand.valgtKarakter?.ikon.startsWith('/')}
                        <img src={spilTilstand.valgtKarakter.ikon} alt="Spiller" style="height: 58px; width: auto; flex-shrink: 0; object-fit: contain; filter: drop-shadow(0 0 5px gold);" />
                    {:else}
                        {spilTilstand.valgtKarakter?.ikon}
                    {/if}
                </span> 
            {/if}
            
            {#each Object.entries(spilTilstand.alleSpillere).filter(([n, p]) => p.index === i && n !== spilTilstand.spillerNavn && !p.isDead) as [navn, p], idx (navn)}
                {@const offset = erJegHer ? idx + 1 : idx}
                <span class="other-player-icon" title={navn} style="z-index: {90 - idx}; transform: translate({offset * 10}px, {offset * 5}px);">
                    {#if p.ikon && p.ikon.startsWith('/')}
                        <img src={p.ikon} alt={navn} style="height: 40px; width: auto; flex-shrink: 0; object-fit: contain; filter: drop-shadow(-2px 2px 3px rgba(0,0,0,0.8));" />
                    {:else}
                        {p.ikon || '👤'}
                    {/if}
                </span>
            {/each}
        </div>
    </div>
{/each}
</div>
</div>

        {#if eventState.aktivt}
            {#if spilTilstand.erBevidstløs}
                <div class="stun-overlay"></div>
            {/if}
            <div class="event-overlay">
                <div class="event-boks">
                    
<img src={eventState.aktivt.billede || `/events/ev_${eventState.aktivt.biome[0]}.webp`} 
     alt="Event baggrund" 
     onerror={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = '/events/event.webp'; }} />
     
     <h2>{eventState.aktivt.titel}</h2>

                    <div class="log-container">
                        {#each eventState.log as linje, i (i)}
                            <p>{linje}</p>
                        {/each}
                    </div>

                    {#if !eventState.valgLåst}
                        <div class="knap-panel">
                            {#each eventState.aktivt.valg as valg (valg.tekst)}
                                {#if kanViseValg(valg)}
                                    <button onclick={() => tagValg(valg)}>
                                        {valg.tekst}
                                        {#if valg.kosterItem} <span class="pris">(Koster {valg.kosterItem})</span>{/if}
                                        {#if valg.puljeVaerdi} <span class="pris">(Koster {valg.puljeVaerdi} Guld)</span>{/if}
                                    </button>
                                {/if}
                            {/each}
                        </div>
                    {/if}

                    <button class="luk-knap" onclick={lukEventOgShop}>
                        Forlad stedet
                    </button>

                </div>
            </div>
        {/if}

        {#if spilTilstand.aktivShop && spilTilstand.aktivShop.length > 0}
            {@const erMarked = spilTilstand.gitter[spilTilstand.spillerIndex].biome === 'marked'}
            
            <div class="event-modal">
                <div class="event-content" style="max-width: 700px;">
                    <h2>{erMarked ? 'Markedet' : 'Byens Butik'}</h2>
                    <p class="event-desc">
                        Her kan du forsyne dig med udstyr til den videre rejse gennem tågen.
                    </p>
                    
                    <div style="display: flex; gap: 20px; margin-bottom: 25px;">
                        {#each spilTilstand.aktivShop as itemId (itemId)}                              
                            {@const tilbud = itemDB[itemId]}
                            {@const ejetVare = spilTilstand.inventory.some(i => i.id === itemId)}
                            
                            <div style="flex: 1; background: #222; padding: 15px; border: 1px solid gold; border-radius: 6px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <img src={tilbud.billede} alt={tilbud.navn} style="height: 80px; width: auto; object-fit: contain; margin-bottom: 10px;" /><br>
                                    <strong style="font-size: 18px;">{tilbud.navn}</strong><br>
                                    <span style="color: #ccc; display: block; margin: 10px 0;">Pris: <strong style="color: gold;">{tilbud.pris} Guld</strong></span>
                                </div>
                                
                                <div style="margin-top: 15px;">
                                    {#if !ejetVare}
                                        <button class="action-btn" onclick={() => købVare(itemId)}>
                                            Køb
                                        </button>
                                    {:else}
                                        <button class="action-btn" style="background: #444; color: #888; cursor: not-allowed;" disabled>Ejes allerede</button>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <button class="valg-btn" style="width: 100%; text-align: center;" onclick={lukEventOgShop}>Nej tak, forlad butikken</button>
                </div>
            </div>
        {/if}

      {#if spilTilstand.venteSpilAktiv}
            <div class="event-modal" style="background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px);">
                <div class="event-content" style="max-width: 800px; text-align: center;">
                    <h2>Tiden står stille</h2>
                    <p class="event-desc">Du må vente på, at de andre indhenter dig. Træk et kort.</p>

                    <div class="vente-board">
                        {#each spilTilstand.venteKort as kort, i (i)}
                            <div class="vente-kort" class:flipped={kort.afsloeret} onclick={() => vendKort(i)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') vendKort(i); }} role="button" tabindex="0">
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

                    <div style="margin: 25px 0; font-size: 24px; font-weight: bold; color: gold; display: flex; align-items: center; justify-content: center; gap: 20px;">
                        <span style="color: #aaa; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Pulje på bordet:</span>
                        <span style="display: flex; align-items: center; gap: 8px;">
                            <img src="/inventory/hp.webp" style="height: 32px; filter: drop-shadow(0 0 2px black);" alt="HP"> 
                            {spilTilstand.ventePuljeLiv}
                        </span>
                        <span style="color: #444;">|</span>
                        <span style="display: flex; align-items: center; gap: 8px;">
                            <img src="/inventory/guld.webp" style="height: 32px; filter: drop-shadow(0 0 2px black);" alt="Guld"> 
                            {spilTilstand.ventePuljeGuld}
                        </span>
                    </div>

                    <div style="display: flex; gap: 20px; justify-content: center; margin-top: 20px;">
                        {#if spilTilstand.venteFase === 'spiller' || spilTilstand.venteFase === 'viser_gevinst'}
                            {#if spilTilstand.ventePuljeLiv > 0 || spilTilstand.ventePuljeGuld > 0}
                                <button class="action-btn" onclick={stopVenteSpil}>Stop og behold puljen</button>
                            {/if}
                            
                        {:else if spilTilstand.venteFase === 'tabt' || spilTilstand.venteFase === 'vundet' || spilTilstand.venteFase === 'venter' || spilTilstand.venteFase === 'trukket'}
                            <button class="action-btn" onclick={lukVenteSpil}>Forlad bordet</button>
                            
                            {#if spilTilstand.dag >= hentLangsomsteDag() + MAX_DAGE_FORAN}
                                {@const totalFormue = spilTilstand.guldTotal + spilTilstand.ventePuljeGuld}
                                <button class="action-btn" 
                                        style="background: #8b6508; opacity: {totalFormue >= 5 ? '1' : '0.4'};" 
                                        disabled={totalFormue < 5} 
                                        onclick={() => startVenteSpil(true)}>
                                    Spil igen (Koster 5 Guld)
                                </button>
                            {:else}
                                <button class="action-btn" style="background: #444; color: #888; cursor: not-allowed;" disabled>
                                    De andre har indhentet dig.
                                </button>
                            {/if}
                        {/if}
                    </div>
                </div>
            </div>
        {/if}

        
        
        <div class="island-overskrift">{spilTilstand.rumKode}</div>
        
        <footer class="ui">
            <div class="ui-content">
                <div class="status-row">
                    <div class="status-item" style="position: relative;">
                        <img src="/inventory/hp.webp" alt="Liv" class="status-icon" />
                        <span class="status-value">{spilTilstand.livspoint}</span>
                        
                    </div>
                    
                    <div class="status-item" style="position: relative;">
                        <img src="/inventory/guld.webp" alt="Guld" class="status-icon" />
                        <span class="status-value">{spilTilstand.guldTotal}</span>
                        
                    </div>
                    
                    <div class="energi-sektion" style="position: relative;">
                        
                        {#if erITågen}
                            <button class="blodofring-btn" onclick={udfoerBlodofring} title="Ofring: 10 HP for 1 Energi">
                                <img src="/tiles/blodofring.webp" alt="Blodofring" />
                            </button>
                        {/if}
                        <div class="energi-container">
                            <div class="energi-grid">
                                {#each Array(9) as tomPlads, i (i)}
                                    <div data-dummy={tomPlads} class="lysprik {i < (spilTilstand.nuvaerendeEnergi || 0) ? 'taendt' : ''}"></div>
                                {/each}
                            </div>
                            <div class="dag-taeller">Dag {spilTilstand.dag || 1}</div>
                        </div>
                    </div>
                </div>
                
                <div class="inventory-row">
                    {#each spilTilstand.inventory as vare (vare.id)}
                        <div class="inventory-item">
                            <img src={vare.billede} alt={vare.navn} class="inventory-icon" />
                        </div>
                    {/each}
                </div>
            </div>

            <div class="log-line">
                {#if spilTilstand.logBesked}{spilTilstand.logBesked}{:else}&nbsp;{/if}
            </div>
        </footer>
    </div>
{/if}




<style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');

    .event-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .event-boks { background: #1a1a1a; color: #e0e0e0; border: 2px solid #4a4a4a; padding: 20px; width: 600px; max-width: 90%; max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
    .event-boks img { width: 100%; height: 200px; object-fit: cover; border-bottom: 2px solid #333; }
    .log-container p { margin: 5px 0; line-height: 1.5; }
    .knap-panel { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
    .event-boks button { padding: 10px; background: #2a2a2a; color: white; border: 1px solid #555; cursor: pointer; text-align: left; }
    .event-boks button:hover { background: #3a3a3a; }
    .pris { color: #ff5555; font-size: 0.8em; margin-left: 10px; }
    .luk-knap { margin-top: 20px; background: #4a1111 !important; text-align: center !important; }

    .taage-kvalt {
        opacity: 0.6;
        filter: brightness(0.4) grayscale(0.8) blur(0.7px); 
        transition: all 0.8s ease; 
    }

    .island-overskrift {
        position: absolute;
        bottom: 220px;
        left: calc(50% - 180px); 
        text-align: left; 
        font-family: 'Cinzel', serif;
        font-size: 2.8rem;
        color: rgba(255, 255, 255, 0.95);
        text-shadow: 0 0 15px rgba(0, 0, 0, 0.9), 2px 2px 0px rgba(0, 0, 0, 1);
        pointer-events: none;
        z-index: 100;
        letter-spacing: 4px;
        text-transform: uppercase;
        white-space: nowrap;
    }

    :global(.flydende-tal) {
        position: absolute !important;
        top: -25px; 
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Cinzel', serif;
        font-size: 26px;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.9);
        filter: blur(0.5px);
        pointer-events: none;
        z-index: 9999;
        text-shadow: 0 0 8px rgba(255,255,255,0.4), 0 3px 6px rgba(0,0,0,0.9);
        animation: solidGhost 1.5s ease-out forwards;
    }

    @keyframes solidGhost {
        0% { opacity: 0; transform: translate(-50%, 0px) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -10px) scale(1.05); }
        50% { opacity: 0.9; transform: translate(-52%, -15px) scale(1); }
        100% { opacity: 1; transform: translate(-50%, -25px) scale(1); filter: blur(0.5px); }
    }

    .slut-knapper {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 30px;
        margin-bottom: 20px;
    }

    .slut-knap {
        background: #5c1616;
        color: #ffcccc;
        border: 1px solid #8b2525;
        padding: 16px 32px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        cursor: pointer;
        font-weight: bold;
        font-family: 'Cinzel', serif;
        font-size: 1.1rem;
        text-transform: uppercase;
        transition: all 0.2s ease;
    }

    .slut-knap:hover {
        background: #7a1d1d;
        box-shadow: 0 6px 20px rgba(0,0,0,0.9);
        transform: translateY(-2px);
        border-color: #ff5555;
    }
</style>