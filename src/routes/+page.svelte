<script lang="ts">
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import { eventBibliotek, type SpilEvent, type Valg } from '$lib/eventBibliotek';

    interface Item { id: string; navn: string; level: number; billede: string; type: string; }
    interface Karakter { 
        id: string; navn: string; ikon: string; startMsg: string;
        startHp: number; startGuld: number; startUdstyr: string[];
        moveCost: number; digCost: number; dmgMod: number; goldMod: number;
        canRest: boolean; fordel: string; ulempe: string;
    }
    interface Felt { guld: number; gravet: boolean; udforsket: boolean; eventID?: string; eventFuldført: boolean; biome: string; shopItem?: string; isCampfire?: boolean; }
    
    interface SpillerData {
        index: number;
        kolonne: number;
        hp: number;
        guld: number;
        isDead: boolean;
        isWinner: boolean;
        score: number;
        ikon?: string;
        inventory?: Item[];
    }

    const BREDDE = 50;
    const HOEJDE = 20;
    const HEX_W = 96;  
    const ROW_H = 82; 

    const biomeVægte = [
        { id: 'mark', vaegt: 15 }, { id: 'eng', vaegt: 15 }, { id: 'skov', vaegt: 15 }, { id: 'bjerg', vaegt: 15 },
        { id: 'hule', vaegt: 2 }, { id: 'ritual', vaegt: 2 }, { id: 'ruin', vaegt: 2 }, { id: 'bandit', vaegt: 2 },
        { id: 'alkymi', vaegt: 5 }, { id: 'blodskov', vaegt: 5 }, { id: 'by', vaegt: 5 }, { id: 'hav', vaegt: 10 },
        { id: 'krystal', vaegt: 5 }, { id: 'marked', vaegt: 5 }, { id: 'slagmark', vaegt: 5 }
    ];

    const biomeTerraenCost: Record<string, number> = {
        'mark': 1, 'eng': 1, 'by': 1, 'marked': 1,
        'skov': 1.5, 'ruin': 1.5, 'ritual': 1.5, 'bandit': 1.5, 'alkymi': 1.5, 'slagmark': 1.5,
        'bjerg': 2.5, 'blodskov': 2.5, 'hule': 2, 'krystal': 2,
        'hav': 99
    };

    const itemDB: Record<string, { id: string, navn: string, type: string, billede: string, bonus: number, pris: number }> = {
        'klude': { id: 'klude', navn: 'Klude', type: 'tøj', billede: '🥼', bonus: 0, pris: 10 },
        'rustning': { id: 'rustning', navn: 'Rustning', type: 'tøj', billede: '🛡️', bonus: 0, pris: 150 },
        'flot_toej': { id: 'flot_toej', navn: 'Fint tøj', type: 'tøj', billede: '🧥', bonus: 0, pris: 120 },
        
        'kniv': { id: 'kniv', navn: 'Kniv', type: 'våben', billede: '🗡️', bonus: 1, pris: 40 },
        'stav': { id: 'stav', navn: 'Stav', type: 'våben', billede: '🦯', bonus: 1, pris: 40 },
        'bue': { id: 'bue', navn: 'Bue', type: 'våben', billede: '🏹', bonus: 1, pris: 80 },
        'oekse': { id: 'oekse', navn: 'Økse', type: 'våben', billede: '🪓', bonus: 2, pris: 100 },
        'svaerd': { id: 'svaerd', navn: 'Sværd', type: 'våben', billede: '⚔️', bonus: 2, pris: 120 },
        'sabel': { id: 'sabel', navn: 'Sabel', type: 'våben', billede: '🤺', bonus: 2, pris: 100 },

        'skovl': { id: 'skovl', navn: 'Skovl', type: 'værktøj', billede: '🥄', bonus: 0, pris: 60 },
        'metaldetektor': { id: 'metaldetektor', navn: 'Detektor', type: 'værktøj', billede: '🧲', bonus: 0, pris: 200 },
        'soegekvist': { id: 'soegekvist', navn: 'Søgekvist', type: 'værktøj', billede: '🌿', bonus: 0, pris: 150 },
    };

    const tilgaengeligeKarakterer: Karakter[] = [
        { id: 'knight_m', navn: "Ridder", ikon: "/game_faces/knight_m.png", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['sabel', 'rustning'], moveCost: 2, digCost: 6, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Starter med sabel og rustning (-50% skade).", ulempe: "Koster 2 HP at rykke sig." },
        { id: 'knight_f', navn: "Skjoldmø", ikon: "/game_faces/knight_f.png", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['sabel', 'rustning'], moveCost: 2, digCost: 6, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Starter med sabel og rustning (-50% skade).", ulempe: "Koster 2 HP at rykke sig." },
        
        { id: 'magician_m', navn: "Troldmand", ikon: "/game_faces/magician_m.png", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 250, startUdstyr: ['stav', 'klude'], moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en massiv formue og en stav.", ulempe: "Tager +50% skade." },
        { id: 'magician_f', navn: "Troldkvinde", ikon: "/game_faces/magician_f.png", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 250, startUdstyr: ['stav', 'klude'], moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en massiv formue og en stav.", ulempe: "Tager +50% skade." },
        
        { id: 'thief_m', navn: "Tyv", ikon: "/game_faces/thief_m.png", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.0, canRest: true, fordel: "Hurtig og udstyret med en kniv.", ulempe: "Tager +20% skade." },
        { id: 'thief_f', navn: "Skygge", ikon: "/game_faces/thief_f.png", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.0, canRest: true, fordel: "Hurtig og udstyret med en kniv.", ulempe: "Tager +20% skade." },
        
        { id: 'explorer_m', navn: "Udforsker", ikon: "/game_faces/explorer_m.png", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude'], moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Den eneste der starter med en skovl.", ulempe: "Mangler våben fra start." },
        { id: 'explorer_f', navn: "Eventyrer", ikon: "/game_faces/explorer_f.png", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude'], moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Den eneste der starter med en skovl.", ulempe: "Mangler våben fra start." },
        
        { id: 'viking_m', navn: "Viking", ikon: "/game_faces/viking_m.png", startMsg: "Hvile er for de svage.", startHp: 150, startGuld: 0, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og tung økse.", ulempe: "Nægter at slå lejr og hvile." },
        { id: 'viking_f', navn: "Valkyrie", ikon: "/game_faces/viking_f.png", startMsg: "Hvile er for de svage.", startHp: 150, startGuld: 0, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og tung økse.", ulempe: "Nægter at slå lejr og hvile." },
        
        { id: 'royal_m', navn: "Hertug", ikon: "/game_faces/royal_m.png", startMsg: "Penge løser alt.", startHp: 100, startGuld: 400, startUdstyr: ['flot_toej'], moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Masser af guld og fint tøj (+50% indtægt).", ulempe: "Intet våben. Graving koster 15 HP." },
        { id: 'royal_f', navn: "Hertuginde", ikon: "/game_faces/royal_f.png", startMsg: "Penge løser alt.", startHp: 100, startGuld: 400, startUdstyr: ['flot_toej'], moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Masser af guld og fint tøj (+50% indtægt).", ulempe: "Intet våben. Graving koster 15 HP." }
    ];

    let gameState = $state<'login' | 'select' | 'play' | 'dead' | 'win'>('login'); 
    
    let spillerNavn = $state('');
    let visMandlige = $state(true);
    let visKvindelige = $state(true);
    let rumKode = $state('');
    let erHost = $state(false);
    let statusBesked = $state('');
    let eventPulje = 0;
    
    let alleSpillere = $state<Record<string, SpillerData>>({});
    let valgtKarakter = $state<Karakter | null>(null);
    let guldTotal = $state(0);
    let livspoint = $state(100); 
    let spillerIndex = $state(0); 
    let maxKolonne = $state(1);
    let inventory = $state<Item[]>([]);
    let gitter = $state<Felt[]>([]); 
    let logBesked = $state("");
    
    let aktivtEvent = $state<SpilEvent | null>(null); 
    let eventUdfald = $state<{tekst: string, farve: string, naesteTrin?: string} | null>(null);
    let aktivShop = $state<string | null>(null);

    // --- KAMERA & STYRING ---
    let kameraOffsetX = $state(0);
    let kameraOffsetY = $state(0);
    let isDragging = $state(false);
    let harTrukket = $state(false);
    let lastMouseX = $state(0);
    let lastMouseY = $state(0);
    let startMouseX = $state(0);
    let startMouseY = $state(0);
    let zoomLevel = $state(1); 

    let kbdRef: (ev: KeyboardEvent) => void;
    let samletScore = $derived((maxKolonne * 10) + (Math.max(0, livspoint) * 5) + guldTotal);

    let kameraStyle = $derived.by(() => {
        const r = Math.floor(spillerIndex / BREDDE);
        const k = spillerIndex % BREDDE;
        const x = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0);
        const y = r * ROW_H;
        
        const originX = x + (HEX_W / 2);
        const originY = y + (ROW_H / 2);

        return `
            transform-origin: ${originX}px ${originY}px;
            transform: translate(calc(50vw - ${originX}px + ${kameraOffsetX}px), calc(50vh - ${originY}px + ${kameraOffsetY}px)) scale(${zoomLevel});
        `;
    });

    $effect(() => {
        if (livspoint <= 0 && gameState === 'play') {
            if (alleSpillere[spillerNavn]) {
                alleSpillere[spillerNavn].score = samletScore;
                alleSpillere[spillerNavn].isDead = true;
            }
            gameState = 'dead';
            syncTilDb();
        }
    });

    function startTræk(e: PointerEvent) {
        if (e.button !== 0 || aktivtEvent || aktivShop) return; 
        isDragging = true;
        harTrukket = false;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
    }

    function træk(e: PointerEvent) {
        if (!isDragging) return;
        kameraOffsetX += (e.clientX - lastMouseX);
        kameraOffsetY += (e.clientY - lastMouseY);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        if (Math.abs(e.clientX - startMouseX) > 5 || Math.abs(e.clientY - startMouseY) > 5) {
            harTrukket = true; 
        }
    }

    function stopTræk() {
        isDragging = false;
    }

    function håndterZoom(e: WheelEvent) {
        if (aktivtEvent || aktivShop || gameState !== 'play') return;
        e.preventDefault(); 
        zoomLevel -= e.deltaY * 0.001; 
        zoomLevel = Math.max(0.5, Math.min(zoomLevel, 2.0));
    }

    function opretTastatur() {
        if (kbdRef) window.removeEventListener('keydown', kbdRef);
        kbdRef = (ev: KeyboardEvent) => { 
            if (aktivtEvent || aktivShop || gameState !== 'play') return;
            
            const key = ev.key.toLowerCase();
            if (key === 'enter') grav();
            else if (key === 'h') hvil();
            else if (key === 'q') flytHex('NW');
            else if (key === 'e') flytHex('NE');
            else if (key === 'a') flytHex('W');
            else if (key === 'd') flytHex('E');
            else if (key === 'z') flytHex('SW');
            else if (key === 'c') flytHex('SE');
        };
        window.addEventListener('keydown', kbdRef);
    }

    async function opretEllerDeltag() {
        if (spillerNavn.trim() === '' || rumKode.trim() === '') {
            statusBesked = "Udfyld venligst både navn og kode.";
            return;
        }

        statusBesked = "Forbinder til serveren...";
        
        const { data } = await supabase.from('spil_sessioner').select('*').eq('rum_kode', rumKode).single();

        if (data) {
            gitter = data.kort;
            alleSpillere = data.spillere || {};
            erHost = false;

            if (alleSpillere[spillerNavn]) {
                statusBesked = "Velkommen tilbage. Henter dine data...";
                const eksisterende = alleSpillere[spillerNavn];
                
                spillerIndex = eksisterende.index;
                livspoint = eksisterende.hp;
                guldTotal = eksisterende.guld;
                maxKolonne = eksisterende.kolonne;
                inventory = eksisterende.inventory || [];
                
                valgtKarakter = tilgaengeligeKarakterer.find(k => k.ikon === eksisterende.ikon) || null;
                
                afslørOmraade(spillerIndex, 1);
                startRealtime();
                
                if (eksisterende.isDead) {
                    gameState = 'dead';
                } else if (eksisterende.isWinner) {
                    gameState = 'win';
                } else {
                    opretTastatur();
                    gameState = 'play';
                }
            } else {
                statusBesked = "Rum fundet. Deltager som Guest.";
                spillerIndex = data.start_index;
                afslørOmraade(spillerIndex, 1);
                startRealtime();
                gameState = 'select';
            }
        } else {
            erHost = true;
            statusBesked = "Nyt rum oprettes. Du er Host.";
            initialiserGitter();
            startRealtime();
            gameState = 'select';
        }
    }

    function startRealtime() {
        supabase.channel('rum_' + rumKode)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'spil_sessioner', filter: `rum_kode=eq.${rumKode}` }, payload => {
                alleSpillere = payload.new.spillere || {};
                if (payload.new.kort) {
                    gitter = [...payload.new.kort]; 
                }
            })
            .subscribe();
    }

    async function syncTilDb(sendKort = false) {
        const { data } = await supabase.from('spil_sessioner').select('spillere').eq('rum_kode', rumKode).single();
        if (data) {
            let opdateredeSpillere = data.spillere || {};
            opdateredeSpillere[spillerNavn] = {
                index: spillerIndex,
                kolonne: maxKolonne,
                hp: livspoint,
                guld: guldTotal,
                isDead: livspoint <= 0,
                isWinner: gameState === 'win',
                score: samletScore,
                ikon: valgtKarakter?.ikon,
                inventory: inventory
            };

            const opdatering: { spillere: Record<string, SpillerData>; kort?: Felt[] } = { spillere: opdateredeSpillere };
            if (sendKort) opdatering.kort = gitter;

            await supabase.from('spil_sessioner').update(opdatering).eq('rum_kode', rumKode);
        }
    }

    async function bekræftValg(karakter: Karakter) {
        valgtKarakter = karakter;
        livspoint = karakter.startHp;
        guldTotal = karakter.startGuld;
        maxKolonne = 1;
        logBesked = karakter.startMsg;

        inventory = karakter.startUdstyr.map(itemId => {
            const dbItem = itemDB[itemId];
            return { id: dbItem.id, navn: dbItem.navn, level: dbItem.bonus, billede: dbItem.billede, type: dbItem.type };
        });
        
        if (erHost) {
            const { error } = await supabase.from('spil_sessioner').insert([{ 
                rum_kode: rumKode, 
                kort: gitter, 
                start_index: spillerIndex,
                spillere: {}
            }]);
            if (error) console.error("Kunne ikke gemme kortet:", error);
        }
        
        await syncTilDb();
        opretTastatur();
        gameState = 'play';
    }

    function nulstilHukommelse() {
        if (browser) window.location.reload();
    }

    function hentNaboIndices(index: number) {
        const r = Math.floor(index / BREDDE);
        const forskudt = r % 2 !== 0;
        const offsets = forskudt 
            ? [-BREDDE, -BREDDE + 1, -1, 1, BREDDE, BREDDE + 1] 
            : [-BREDDE - 1, -BREDDE, -1, 1, BREDDE - 1, BREDDE];
        return offsets.map(o => index + o).filter(i => i >= 0 && i < BREDDE * HOEJDE);
    }

    function afslørOmraade(index: number, radius: number) {
        let fundne = [index];
        let nuvaerendeKant = [index];
        for (let r = 0; r < radius; r++) {
            let nyKant: number[] = [];
            for (let i of nuvaerendeKant) {
                hentNaboIndices(i).forEach(n => {
                    if (!fundne.includes(n)) { fundne.push(n); nyKant.push(n); }
                });
            }
            nuvaerendeKant = nyKant;
        }
        fundne.forEach(i => { if (gitter[i]) gitter[i].udforsket = true; });
    }

    function initialiserGitter() {
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

        let nytGitter: Felt[] = Array(antal).fill(null).map((_, i) => ({ guld: 0, gravet: false, udforsket: false, eventFuldført: false, biome: råKort[i] }));
        
        let alleGyldigeEvents = Object.keys(eventBibliotek).filter(k => !eventBibliotek[k].erSubTrin && k !== 'campfire');
        const vildmark = ['eng', 'skov', 'mark', 'bjerg'];

        for (let i = 0; i < antal; i++) {
            let f = nytGitter[i];
            
            if (f.biome === 'hav') continue; 

            if (vildmark.includes(f.biome) && Math.random() < 0.02) {
                f.isCampfire = true;
                f.eventID = 'campfire';
            } 
            else if (Math.random() < 0.6) { 
                let muligeEvents = alleGyldigeEvents.filter(key => {
                    const reqBiome = eventBibliotek[key].biome;
                    if (Array.isArray(reqBiome)) {
                        return reqBiome.includes(f.biome) || reqBiome.includes('alle');
                    }
                    return reqBiome === f.biome || reqBiome === 'alle' || reqBiome === 'any' || !reqBiome;
                });

                if (muligeEvents.length > 0) {
                    const randomEventIndex = Math.floor(Math.random() * muligeEvents.length);
                    const valgtEvent = muligeEvents[randomEventIndex];
                    f.eventID = valgtEvent;
                    //alleGyldigeEvents = alleGyldigeEvents.filter(k => k !== valgtEvent);
                }
            }

            if (!f.eventID) { 
                const itemKeys = Object.keys(itemDB);
                if (f.biome === 'marked' && Math.random() < 0.33) {
                    f.shopItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                } else if (f.biome === 'by' && Math.random() < 0.20) {
                    f.shopItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                }
            }
        }
        
        gitter = nytGitter;

        const muligeStartFelter = [];
        for (let r = 1; r < HOEJDE - 1; r++) {
            if (gitter[r * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(r * BREDDE + 1);
        }
        spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
        afslørOmraade(spillerIndex, 1);
    }

    function udfoerAktion(type: string | undefined, vaerdi: number) {
        const k = spillerIndex % BREDDE;
        const svaerhedsgrad = 1 + (k / BREDDE);
        const toej = inventory.find(i => i.type === 'tøj');

        if (type === 'hp_lejr') {
    if (livspoint >= 80) {
        logBesked = "Du er allerede så rask, som du kan blive her.";
    } else {
        livspoint = Math.min(80, livspoint + vaerdi);
    }
}

        if (type === 'guld' || type === 'fortsaet') {
            let endeligtGuld = vaerdi;
            if (endeligtGuld > 0 && valgtKarakter) {
                endeligtGuld = Math.floor(endeligtGuld * valgtKarakter.goldMod);
                if (toej?.id === 'flot_toej') endeligtGuld = Math.floor(endeligtGuld * 1.5);
            }
            guldTotal = Math.max(0, guldTotal + endeligtGuld);
        }
        if (type === 'hp' || type === 'fortsaet') {
            let endeligtLiv = vaerdi;
            if (endeligtLiv < 0 && valgtKarakter) {
                endeligtLiv = Math.floor(endeligtLiv * valgtKarakter.dmgMod * svaerhedsgrad);
                if (toej?.id === 'rustning') endeligtLiv = Math.floor(endeligtLiv * 0.5);
            }
            livspoint = Math.max(0, livspoint + endeligtLiv);
        }
        
        syncTilDb();
    }

    function haandterValg(v: Valg) {
        if (v.puljeVaerdi) {
            eventPulje += v.puljeVaerdi;
        }

        if (v.aktionType === 'guld_lejr') {
    if (guldTotal >= 50) {
        eventUdfald = { tekst: "Du roder i asken, men finder intet af værdi. Lykken smiler kun til de fattige.", farve: '#aaa' };
        return;
    }
}

        if (v.naesteTrin && !v.udfald) {
            logBesked = `Du valgte: ${v.tekst}`;
            aktivtEvent = eventBibliotek[v.naesteTrin] || null;
            return;
        }

        if (v.udfald) {
            let terning1 = Math.floor(Math.random() * 6) + 1;
            let terning2 = Math.floor(Math.random() * 6) + 1;
            let raaSlag = terning1 + terning2;

            let modifier = 0;
            if (v.fordelItem && inventory.some(i => i.id === v.fordelItem)) {
                modifier += 3; 
            }

            let slag = raaSlag + modifier;
            let res;

            if (slag <= 4) res = v.udfald.katastrofe;
            else if (slag <= 6) res = v.udfald.fiasko;
            else if (slag <= 8) res = v.udfald.neutral;
            else if (slag <= 10) res = v.udfald.succes;
            else res = v.udfald.mirakel;

            if (res.aktionType === 'guld' && eventPulje > 0) {
                let endeligVaerdi = Math.floor(eventPulje * (res.multiplikator || 1));
                udfoerAktion('guld', endeligVaerdi);
            } else if (res.aktionType) {
                udfoerAktion(res.aktionType, res.vaerdi || 0); 
            }

            let farve = slag <= 6 ? '#ff5555' : slag <= 8 ? '#aaa' : slag <= 10 ? '#55ff55' : 'gold';
            
            eventUdfald = { 
                tekst: res.log, 
                farve: farve, 
                naesteTrin: res.naesteTrin || v.naesteTrin 
            };

            logBesked = res.log;
            eventPulje = 0;
        }
    }

    function accepterUdfald() {
        if (eventUdfald?.naesteTrin && eventBibliotek[eventUdfald.naesteTrin]) {
            aktivtEvent = eventBibliotek[eventUdfald.naesteTrin];
            eventUdfald = null;
        } else {
            lukEvent();
        }
    }

    function købEllerOpgrader(id: string) {
        const dbItem = itemDB[id];
        if (!dbItem) return;

        const felt = gitter[spillerIndex];
        const erMarked = felt.biome === 'marked';
        const index = inventory.findIndex(i => i.id === id);

        if (index > -1) {
            if (erMarked) {
                eventUdfald = { tekst: `Markedsmanden kigger dumt på dig: "Du har jo allerede en ${dbItem.navn}!"`, farve: '#ff5555' };
                return; 
            }

            const vare = inventory[index];
            const pris = vare.level === 1 ? dbItem.pris : dbItem.pris * Math.pow(4, vare.level - 1);

            if (guldTotal >= pris) {
                guldTotal -= pris; 
                vare.level += 1; 
                eventUdfald = { tekst: `${vare.navn} er nu opgraderet til niveau ${vare.level}.`, farve: '#55ff55' };
                syncTilDb(true);
            } else {
                eventUdfald = { tekst: `Smeden griner af din fattigdom. Det koster ${pris}G at røre ved det grej.`, farve: '#ff5555' };
            }
        } else {
            const pris = erMarked ? dbItem.pris : dbItem.pris * 4;
            
            if (guldTotal >= pris) {
                guldTotal -= pris;
                
                let nytInventory = [...inventory];
                if (dbItem.type === 'våben') nytInventory = nytInventory.filter(i => i.type !== 'våben');
                else if (dbItem.type === 'tøj') nytInventory = nytInventory.filter(i => i.type !== 'tøj');
                
                inventory = [...nytInventory, { 
                    id: dbItem.id, 
                    navn: dbItem.navn, 
                    level: dbItem.bonus > 0 ? dbItem.bonus : 1, 
                    billede: dbItem.billede, 
                    type: dbItem.type 
                }];
                
                eventUdfald = { tekst: `Du har erhvervet en ${dbItem.navn} for ${pris}G.`, farve: 'gold' };
                syncTilDb(true);
            } else {
                eventUdfald = { tekst: `Købmanden ryster på hovedet. Kom tilbage når du har ${pris}G.`, farve: '#ff5555' };
            }
        }
    }

    function grav() {
        let f = gitter[spillerIndex];
        if (!f || f.gravet || f.eventID || !valgtKarakter) return;
        
        const harSkovl = inventory.some(i => i.id === 'skovl');
        if (!harSkovl) { logBesked = "Du kan ikke bryde det hårde mudder uden en skovl."; return; }

        const harDetektor = inventory.some(i => i.id === 'metaldetektor');
        const harKvist = inventory.some(i => i.id === 'soegekvist');

        livspoint -= valgtKarakter.digCost;
        f.gravet = true;
        
        if (livspoint <= 0) { syncTilDb(true); return; }

        const k = spillerIndex % BREDDE;
        const svaerhedsgrad = 1 + (k / BREDDE);
        const roll = Math.random();

        const farligeBiomer = ['bjerg', 'ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
        const isDangerous = farligeBiomer.includes(f.biome);
        const trapChance = isDangerous ? 0.30 * svaerhedsgrad : 0.05 * svaerhedsgrad;

        if (roll > trapChance) {
            const subRoll = Math.random();
            if (subRoll < 0.60) {
                let amount = Math.floor((Math.random() * 40) + 10) * valgtKarakter.goldMod;
                if (harDetektor) amount *= 2;
                guldTotal += amount; 
                logBesked = harDetektor ? `Detektoren bipper vildt! Dobbelt op: ${amount}G.` : `Mudderet gemte på ${amount}G.`;
            } else if (subRoll < 0.85) {
                let heal = harKvist ? 35 : 15;
                livspoint = Math.min(100, livspoint + heal); 
                logBesked = harKvist ? `Din kvist fandt stærke lægeurter. Heler ${heal} HP.` : `Rod fundet. Heler ${heal} HP.`;
            } else {
                let amount = Math.floor(150) * valgtKarakter.goldMod;
                if (harDetektor) amount *= 2;
                guldTotal += amount; 
                logBesked = `Skattekiste brudt op! ${amount}G indsamlet.`;
            }
        } else {
            const subRoll = Math.random();
            if (subRoll < 0.5) { udfoerAktion('hp', -15); logBesked = `Gasudslip fra jorden.`; } 
            else { udfoerAktion('hp', -30); logBesked = `Skovlen ramte en ældgammel fælde.`; }
        }
        syncTilDb(true);
    }

    function hvil() {
        if (!valgtKarakter?.canRest) { logBesked = "Din stolthed forbyder dig at hvile i fjendeland."; return; }
        if (guldTotal < 40) { logBesked = "En sikker lejr koster nu 40 guld."; return; }
        
        guldTotal -= 40;
        if (livspoint >= 100) { logBesked = "Du hviler, men dit helbred er allerede optimalt (40G tabt)."; } 
        else { livspoint = Math.min(100, livspoint + 30); logBesked = "Lejrbålet luner. Restitueret op til max 100 HP."; }

        if (Math.random() < 0.2) { logBesked = "Overfald i natten!"; udfoerAktion('hp', -25); }
        syncTilDb();
    }

    function lukEvent() { 
        let f = gitter[spillerIndex];
        if (f && aktivtEvent && f.eventID !== 'campfire') {
            f.eventFuldført = true; 
        }
        aktivtEvent = null; 
        eventUdfald = null;
        aktivShop = null;
        syncTilDb(true); 
    }
    
    function udførBevægelse(nI: number) {
        if (!valgtKarakter) return;

        let f = gitter[nI];
        if (!f || f.biome === 'hav') { logBesked = "Havet spærrer vejen."; return; }

        const nK = nI % BREDDE;
        const terraenModifier = biomeTerraenCost[f.biome] || 1;
        const bevægelsesPris = Math.ceil(valgtKarakter.moveCost * terraenModifier);

        livspoint -= bevægelsesPris;
        spillerIndex = nI; 
        
        kameraOffsetX = 0;
        kameraOffsetY = 0;
        
        const synsRadius = f.biome === 'bjerg' ? 2 : 1;
        afslørOmraade(spillerIndex, synsRadius);
        
        logBesked = `Træder ind i ${f.biome}. Omkostning: ${bevægelsesPris} HP.`;
        if (nK > maxKolonne) maxKolonne = nK;

        if (livspoint <= 0) { syncTilDb(); return; }
        if (nK === BREDDE - 2) { 
            if (alleSpillere[spillerNavn]) {
                alleSpillere[spillerNavn].score = samletScore;
                alleSpillere[spillerNavn].isWinner = true;
            }
            gameState = 'win'; 
            syncTilDb(); 
            return; 
        }

        if (f.eventID && !f.eventFuldført) {
            aktivtEvent = eventBibliotek[f.eventID] || null; 
        } else if (f.shopItem) {
            aktivShop = f.shopItem; 
        }
        
        syncTilDb();
    }

    function flytHex(retning: string) {
        if (aktivtEvent || aktivShop || gameState !== 'play' || !valgtKarakter) return; 
        
        const r = Math.floor(spillerIndex / BREDDE); const k = spillerIndex % BREDDE; let nI = spillerIndex; const forskudt = r % 2 !== 0;
        if (retning === 'NW') nI = forskudt ? spillerIndex - BREDDE : spillerIndex - BREDDE - 1;
        else if (retning === 'NE') nI = forskudt ? spillerIndex - BREDDE + 1 : spillerIndex - BREDDE;
        else if (retning === 'W') nI = spillerIndex - 1; else if (retning === 'E') nI = spillerIndex + 1;
        else if (retning === 'SW') nI = forskudt ? spillerIndex + BREDDE : spillerIndex + BREDDE - 1;
        else if (retning === 'SE') nI = forskudt ? spillerIndex + BREDDE + 1 : spillerIndex + BREDDE;
        
        const nR = Math.floor(nI / BREDDE); const nK = nI % BREDDE;
        if (nI >= 0 && nI < BREDDE * HOEJDE && Math.abs(k - nK) <= 1 && Math.abs(r - nR) <= 1) { 
            udførBevægelse(nI);
        }
    }

    function klikPåHex(nI: number) {
        if (harTrukket || aktivtEvent || aktivShop || gameState !== 'play' || !valgtKarakter) return; 
        if (nI === spillerIndex) return;

        const naboer = hentNaboIndices(spillerIndex);
        if (!naboer.includes(nI)) { logBesked = "Du kan kun rykke til et direkte nabofelt."; return; }
        udførBevægelse(nI);
    }
</script>

{#if gameState === 'login'}
    <div class="overlay">
        <div class="login-box">
            <h1>Skyggekysten</h1>
            <p>Angiv dit navn og et rum for at kæmpe jer over øen sammen.</p>
            
            <input type="text" placeholder="Dit Spillernavn" bind:value={spillerNavn} />

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

            <input type="text" placeholder="Rum Kode (fx 1234)" bind:value={rumKode} />
            <button onclick={opretEllerDeltag}>Gå til kysten</button>
            <p class="status">{statusBesked}</p>
        </div>
    </div>
{:else if gameState === 'select'}
    <div class="overlay">
        <div class="character-select">
            <h2>Vælg din karakter, {spillerNavn}</h2>
            <div class="character-gallery">
                {#each tilgaengeligeKarakterer.filter(k => (visMandlige && k.id.endsWith('_m')) || (visKvindelige && k.id.endsWith('_f'))) as k (k.id)}
                    <div class="char-card" 
                         class:selected={valgtKarakter?.id === k.id} 
                         role="button" 
                         tabindex="0" 
                         onclick={() => valgtKarakter = k}
                         onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') valgtKarakter = k; }}>
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
            <button class="confirm-btn" disabled={!valgtKarakter} onclick={() => valgtKarakter && bekræftValg(valgtKarakter)}>
                Bekræft Valg
            </button>
        </div>
    </div>
{:else if gameState === 'dead'}
    <div class="overlay death-screen">
        <h1>Du bukkede under for Skyggekysten</h1>
        <p>Din krop giver efter. Din rejse ender her i mudderet.</p>
        <h2>Endelig Score: {samletScore}</h2>
        <button onclick={nulstilHukommelse}>Hvil i fred</button>
    </div>
{:else if gameState === 'win'}
    <div class="overlay win-screen">
        <h1>Skyggekysten er besejret!</h1>
        <p>Du har nået den fjerne kyst og overlevet mørket.</p>
        <h2>Endelig Score: {samletScore}</h2>
        <button onclick={nulstilHukommelse}>Spil igen</button>
    </div>
{:else}
    <div class="game-container">
        <div class="camera" role="presentation" onwheel={håndterZoom} onpointerdown={startTræk} onpointermove={træk} onpointerup={stopTræk} onpointercancel={stopTræk} style="cursor: {isDragging ? 'grabbing' : 'grab'}; touch-action: none;">
            <div class="map" style={kameraStyle}>
                {#each gitter as felt, i (i)}
                    {@const r = Math.floor(i / BREDDE)}
                    {@const k = i % BREDDE}
                    {@const x = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0)}
                    {@const y = r * ROW_H}
                    {@const erJegHer = spillerIndex === i} 
                    
                    <div class="hex" 
                         class:odd={r % 2 !== 0} 
                         class:active={erJegHer} 
                         class:unexplored={!felt.udforsket}
                         onclick={() => klikPåHex(i)}
                         onkeydown={(e) => { if (e.key === 'Enter') klikPåHex(i); }}
                         role="button"
                         tabindex="0"
                         style="background-image: url('/tiles/{felt.biome}.png'); left: {x}px; top: {y}px; cursor: pointer;">
                        
                        {#if felt.gravet}
                            <div class="dug-overlay"></div>
                        {/if}

                        <div class="inner">
                            {#if felt.udforsket && felt.eventID && felt.eventID !== 'campfire' && !felt.eventFuldført} 
                                <img src="/tiles/event.png" alt="Event" class="event-crystal" />
                            {/if}

                            {#if felt.udforsket && felt.isCampfire} 
                                <img src="/tiles/campfire.png" alt="Lejrbål" class="campfire-icon-img" />
                            {/if}

                            {#if felt.udforsket && felt.shopItem} 
                                <img src={felt.biome === 'by' ? '/tiles/byshop.png' : '/tiles/markedshop.png'} alt="Butik" class="shop-icon-img" />
                            {/if}

                            {#if erJegHer} 
                                <span class="player-icon">
                                    {#if valgtKarakter?.ikon.startsWith('/')}
                                        <img src={valgtKarakter.ikon} alt="Spiller" style="height: 58px; width: auto; flex-shrink: 0; object-fit: contain; filter: drop-shadow(0 0 5px gold);" />
                                    {:else}
                                        {valgtKarakter?.ikon}
                                    {/if}
                                </span> 
                            {/if}
                            
                            {#each Object.entries(alleSpillere).filter(([n, p]) => p.index === i && n !== spillerNavn && !p.isDead) as [navn, p], idx (navn)}
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

        {#if aktivtEvent}
            <div class="event-modal">
                <div class="event-content">
                    <h2>{aktivtEvent.titel}</h2>
                    
                    {#if eventUdfald && aktivtEvent.billedeEfter}
                        <img src={aktivtEvent.billedeEfter} alt={aktivtEvent.titel} class="event-image" />
                    {:else if !eventUdfald && aktivtEvent.billede}
                        <img src={aktivtEvent.billede} alt={aktivtEvent.titel} class="event-image" />
                    {/if}

                    <p class="event-desc">{aktivtEvent.tekst}</p>
                    
                    {#if eventUdfald}
                        <div class="udfald" style="border-left: 5px solid {eventUdfald.farve};">
                            {eventUdfald.tekst}
                        </div>
                        <button class="action-btn" onclick={accepterUdfald}>Fortsæt</button>
                    {:else}
                        <div class="valg-liste">
                            {#each aktivtEvent.valg as valg (valg.tekst)}
                                <button class="valg-btn" onclick={() => haandterValg(valg)}>{valg.tekst}</button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        {#if aktivShop && itemDB[aktivShop]}
            {@const tilbud = itemDB[aktivShop]}
            <div class="event-modal">
                <div class="event-content">
                    <h2>Købmandens Telt</h2>
                    <p class="event-desc">En rejsende handelsmand har slået sig ned her. Han har kun én genstand tilbage, men måske er det præcis det, du mangler?</p>
                    
                    {#if eventUdfald}
                        <div class="udfald" style="border-left: 5px solid {eventUdfald.farve};">
                            {eventUdfald.tekst}
                        </div>
                        <button class="action-btn" onclick={lukEvent}>Forlad teltet</button>
                    {:else}
                        <div class="udfald" style="border-left: 5px solid gold; text-align: center;">
                            <span style="font-size: 30px;">{tilbud.billede}</span><br>
                            <strong>{tilbud.navn}</strong><br>
                            Pris: {gitter[spillerIndex].biome === 'marked' ? tilbud.pris : tilbud.pris * 4} Guld (Grundpris)
                        </div>

                        <div class="valg-liste">
                            <button class="action-btn" onclick={() => købEllerOpgrader(aktivShop as string)}>Køb/Opgrader {tilbud.navn}</button>
                            <button class="valg-btn" onclick={lukEvent}>Nej tak, gå videre</button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <footer class="ui">
            <div class="stats-panel">
                <div class="stat-box" title="Helbred">
                    <span class="icon">❤️</span>
                    <span class="value">{livspoint}</span>
                </div>
                <div class="stat-box gold-box" title="Guld">
                    <span class="icon">💰</span>
                    <span class="value">{guldTotal}</span>
                </div>
                {#each [0, 1, 2, 3, 4] as i (i)}
                    <div class="stat-box item-box">
                        {#if inventory[i]}
                            <span class="icon">{inventory[i].billede}</span>
                            {#if inventory[i].level > 0}
                                <span class="level-badge">Lvl {inventory[i].level}</span>
                            {/if}
                        {:else}
                            <span class="icon empty"></span>
                        {/if}
                    </div>
                {/each}
            </div>
        
            <div class="log-line">
                {#if logBesked}
                    {logBesked}
                {:else}
                    Klar til at udforske kysten.
                {/if}
            </div>
        </footer>
    </div>
{/if}

<style>
    :global(body) { margin: 0; padding: 0; background: #0a0a0a; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden; }
    
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

    .death-screen { background: rgba(50,0,0,0.9); flex-direction: column; text-align: center; }
    .death-screen h1 { color: #ff5555; font-size: 3em; margin-bottom: 10px; }
    .win-screen { background: rgba(0,50,0,0.9); flex-direction: column; text-align: center; }
    .win-screen h1 { color: #55ff55; font-size: 3em; margin-bottom: 10px; }
    .death-screen button, .win-screen button { margin-top: 20px; padding: 15px 30px; font-size: 1.2em; cursor: pointer; }

    .game-container { position: relative; width: 100vw; height: 100vh; display: flex; flex-direction: column; overflow: hidden; user-select: none; -webkit-user-select: none; }
    .camera { flex: 1; position: relative; background: #050505; overflow: hidden; }
    .map { position: absolute; width: 4800px; height: 1640px; }
    .map img { -webkit-user-drag: none; }
    
    .hex { position: absolute; width: 96px; height: 110px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; }
    .hex.unexplored { filter: brightness(0) !important; opacity: 0.9; }
    .dug-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); box-shadow: inset 0 0 20px rgba(0,0,0,0.8); z-index: 1; pointer-events: none; }
    .inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 2; }
    
    .player-icon { font-size: 40px; z-index: 100; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); display: flex; align-items: center; justify-content: center; }
    .other-player-icon { font-size: 28px; position: absolute; opacity: 0.8; transition: transform 0.3s; display: flex; align-items: center; justify-content: center; }

    .event-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; }
    .event-content { background: #1a1a1a; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
    
    .event-image { width: 100%; max-height: 250px; object-fit: cover; margin-bottom: 15px; }

    .event-content h2 { margin-top: 0; color: #ffcc00; }
    .event-desc { font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
    .valg-liste { display: flex; flex-direction: column; gap: 10px; }
    .valg-btn, .action-btn { background: #2a2a2a; border: 1px solid #444; color: white; padding: 12px; font-size: 16px; cursor: pointer; border-radius: 4px; text-align: left; transition: 0.2s; }
    .valg-btn:hover, .action-btn:hover { background: #3a3a3a; border-color: #666; }
    .udfald { background: #222; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-size: 16px; }
    .action-btn { text-align: center; width: 100%; background: #2a4a2a; }

    .ui { position: absolute; bottom: 0; left: 0; width: 100%; padding: 20px; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
    .ui > * { pointer-events: auto; }
    
    .stats-panel { display: flex; gap: 12px; width: 100%; justify-content: center; margin-top: 10px; }
    .stat-box { width: 65px; height: 65px; background: linear-gradient(180deg, #2a2a2a 0%, #111 100%); border: 2px solid #444; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; color: white; box-shadow: inset 0 0 15px rgba(0,0,0,0.8), 0 4px 6px rgba(0,0,0,0.5); }
    .stat-box .icon { font-size: 26px; }
    .stat-box .value { font-size: 14px; font-weight: bold; margin-top: 4px; text-shadow: 1px 1px 2px black; }
    .stat-box.gold-box .value { color: gold; }
    .stat-box .empty { opacity: 0.05; }
    .level-badge { position: absolute; bottom: -6px; right: -6px; background: #ffcc00; color: #000; font-size: 11px; font-weight: 900; padding: 2px 5px; border-radius: 5px; border: 1px solid #664400; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }

    .log-line { width: 100%; text-align: center; color: #e0e0e0; font-size: 18px; font-weight: bold; min-height: 27px; margin-bottom: 5px; text-shadow: 0 2px 5px rgba(0,0,0,1); }

    :global(.event-crystal) { position: absolute; height: 65px; width: auto; z-index: 5; pointer-events: none; animation: floatAndGlow 3s ease-in-out infinite; }

    .shop-icon-img { position: absolute; height: 60px; width: auto; z-index: 5; pointer-events: none; animation: shopGlow 3s ease-in-out infinite; }
    
    .campfire-icon-img { position: absolute; height: 40px; width: auto; z-index: 4; pointer-events: none; animation: campfirePulse 3s ease-in-out infinite; }

    @keyframes floatAndGlow {
        0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4)); }
        50% { transform: translateY(-6px) scale(1.05); filter: drop-shadow(0 0 18px rgba(255, 255, 255, 0.9)); }
    }

    @keyframes shopGlow {
        0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.4)); }
        50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1)); }
    }

    @keyframes campfirePulse {
        0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 140, 0, 0.4)); }
        50% { filter: drop-shadow(0 0 100px rgba(255, 140, 0, 1)); }
    }
</style>