<script lang="ts">
    import { browser } from '$app/environment';
    import { supabase } from '$lib/supabaseClient';
    import { eventBibliotek, type SpilEvent, type Valg } from '$lib/eventBibliotek';

    interface Item { id: string; navn: string; level: number; billede: string; }
    interface Karakter { 
        id: string; navn: string; ikon: string; startMsg: string;
        startHp: number; startGuld: number; sabelLevel: number; skovlLevel: number;
        moveCost: number; digCost: number; dmgMod: number; goldMod: number;
        canRest: boolean; fordel: string; ulempe: string;
    }
    interface Felt { guld: number; gravet: boolean; udforsket: boolean; eventID?: string; eventFuldført: boolean; biome: string; }
    
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

    const tilgaengeligeKarakterer: Karakter[] = [
        { id: 'knight_m', navn: "Ridder", ikon: "/game_faces/knight_m.png", startMsg: "Din rustning sløver dig i terrænet, men skærmer mod stød.", startHp: 120, startGuld: 0, sabelLevel: 1, skovlLevel: 0, moveCost: 2, digCost: 6, dmgMod: 0.5, goldMod: 1.0, canRest: true, fordel: "Tager kun halv skade i events. Starter med sabel.", ulempe: "Koster 2 HP at rykke sig på flad mark." },
        { id: 'knight_f', navn: "Skjoldmø", ikon: "/game_faces/knight_f.png", startMsg: "Din rustning sløver dig i terrænet, men skærmer mod stød.", startHp: 120, startGuld: 0, sabelLevel: 1, skovlLevel: 0, moveCost: 2, digCost: 6, dmgMod: 0.5, goldMod: 1.0, canRest: true, fordel: "Tager kun halv skade i events. Starter med sabel.", ulempe: "Koster 2 HP at rykke sig på flad mark." },
        { id: 'magician_m', navn: "Troldmand", ikon: "/game_faces/magician_m.png", startMsg: "Guld køber dig fri af de farer, din krop ikke kan tåle.", startHp: 80, startGuld: 250, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en massiv formue.", ulempe: "Tager +50% skade. Hårdt at grave (10 HP)." },
        { id: 'magician_f', navn: "Troldkvinde", ikon: "/game_faces/magician_f.png", startMsg: "Guld køber dig fri af de farer, din krop ikke kan tåle.", startHp: 80, startGuld: 250, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en massiv formue.", ulempe: "Tager +50% skade. Hårdt at grave (10 HP)." },
        { id: 'thief_m', navn: "Tyv", ikon: "/game_faces/thief_m.png", startMsg: "Hurtig, svag og grådig. Hold dig i bevægelse.", startHp: 100, startGuld: 50, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.5, canRest: true, fordel: "Får +50% udbytte af alt guld du finder.", ulempe: "Tager +20% skade i alle events." },
        { id: 'thief_f', navn: "Skygge", ikon: "/game_faces/thief_f.png", startMsg: "Hurtig, svag og grådig. Hold dig i bevægelse.", startHp: 100, startGuld: 50, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.5, canRest: true, fordel: "Får +50% udbytte af alt guld du finder.", ulempe: "Tager +20% skade i alle events." },
        { id: 'explorer_m', navn: "Udforsker", ikon: "/game_faces/explorer_m.png", startMsg: "Terrænet er din ven, men du starter uden penge og våben.", startHp: 100, startGuld: 0, sabelLevel: 0, skovlLevel: 2, moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Level 2 skovl giver bonus til udforskning. Graving koster 2 HP.", ulempe: "Mangler kamp-erfaring og guld." },
        { id: 'explorer_f', navn: "Eventyrer", ikon: "/game_faces/explorer_f.png", startMsg: "Terrænet er din ven, men du starter uden penge og våben.", startHp: 100, startGuld: 0, sabelLevel: 0, skovlLevel: 2, moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Level 2 skovl giver bonus til udforskning. Graving koster 2 HP.", ulempe: "Mangler kamp-erfaring og guld." },
        { id: 'viking_m', navn: "Viking", ikon: "/game_faces/viking_m.png", startMsg: "Blodet koger. Hvile er for de svage.", startHp: 150, startGuld: 0, sabelLevel: 2, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og Level 2 våben.", ulempe: "Nægter kategorisk at slå lejr og hvile." },
        { id: 'viking_f', navn: "Valkyrie", ikon: "/game_faces/viking_f.png", startMsg: "Blodet koger. Hvile er for de svage.", startHp: 150, startGuld: 0, sabelLevel: 2, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og Level 2 våben.", ulempe: "Nægter kategorisk at slå lejr og hvile." },
        { id: 'royal_m', navn: "Hertug", ikon: "/game_faces/royal_m.png", startMsg: "Mudder ødelægger dine støvler, men dit netværk er stort.", startHp: 100, startGuld: 400, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Startkapitalen er svimlende.", ulempe: "Fysisk arbejde er tortur. Graving koster 15 HP." },
        { id: 'royal_f', navn: "Hertuginde", ikon: "/game_faces/royal_f.png", startMsg: "Mudder ødelægger dine støvler, men dit netværk er stort.", startHp: 100, startGuld: 400, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Startkapitalen er svimlende.", ulempe: "Fysisk arbejde er tortur. Graving koster 15 HP." }
    ];

    let gameState = $state<'login' | 'select' | 'play' | 'dead' | 'win'>('login'); 
    
    let spillerNavn = $state('');
    let visMandlige = $state(true);
    let visKvindelige = $state(true);
    let rumKode = $state('');
    let erHost = $state(false);
    let statusBesked = $state('');
    
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

    let kbdRef: (ev: KeyboardEvent) => void;
    let samletScore = $derived((maxKolonne * 10) + (Math.max(0, livspoint) * 5) + guldTotal);

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

    let kameraStyle = $derived.by(() => {
        const r = Math.floor(spillerIndex / BREDDE);
        const k = spillerIndex % BREDDE;
        const x = k * HEX_W + (r % 2 !== 0 ? HEX_W / 2 : 0);
        const y = r * ROW_H;
        return `transform: translate(${400 - x}px, ${250 - y}px);`;
    });

    // --- MULTIPLAYER LOGIK ---

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
                    if (kbdRef) window.removeEventListener('keydown', kbdRef);
                    kbdRef = (ev: KeyboardEvent) => { 
                        if (ev.key === 'Enter' && !aktivtEvent && gameState === 'play') grav(); 
                    };
                    window.addEventListener('keydown', kbdRef);
                    
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

    // --- SPIL LOGIK ---

    async function bekræftValg(karakter: Karakter) {
        valgtKarakter = karakter;
        livspoint = karakter.startHp;
        guldTotal = karakter.startGuld;
        maxKolonne = 1;
        logBesked = karakter.startMsg;

        let nytInventory: Item[] = [];
        if (karakter.sabelLevel > 0) nytInventory.push({ id: 'sabel', navn: 'Sabre', level: karakter.sabelLevel, billede: '⚔️' });
        if (karakter.skovlLevel > 0) nytInventory.push({ id: 'skovl', navn: 'Shovel', level: karakter.skovlLevel, billede: '🥄' });
        inventory = nytInventory;
        
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

        if (kbdRef) window.removeEventListener('keydown', kbdRef);
        kbdRef = (ev: KeyboardEvent) => { 
            if (ev.key === 'Enter' && !aktivtEvent && gameState === 'play') grav(); 
        };
        window.addEventListener('keydown', kbdRef);
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
        
        let alleGyldigeEvents = Object.keys(eventBibliotek).filter(k => !eventBibliotek[k].erSubTrin);

        for (let i = 0; i < antal; i++) {
            let f = nytGitter[i];
            
            if (f.biome !== 'hav' && Math.random() < 0.06) { 
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
                    alleGyldigeEvents = alleGyldigeEvents.filter(k => k !== valgtEvent);
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

    function kørTerninger() { return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1; }

    function udfoerAktion(type: string | undefined, vaerdi: number, itemType?: string) {
        const k = spillerIndex % BREDDE;
        const svaerhedsgrad = 1 + (k / BREDDE);

        if (type === 'guld' || type === 'fortsaet') {
            let endeligtGuld = vaerdi;
            if (endeligtGuld > 0 && valgtKarakter) endeligtGuld = Math.floor(endeligtGuld * valgtKarakter.goldMod);
            guldTotal = Math.max(0, guldTotal + endeligtGuld);
        }
        if (type === 'hp' || type === 'fortsaet') {
            let endeligtLiv = vaerdi;
            if (endeligtLiv < 0 && valgtKarakter) endeligtLiv = Math.floor(endeligtLiv * valgtKarakter.dmgMod * svaerhedsgrad);
            livspoint = Math.max(0, livspoint + endeligtLiv);
        }
        if (type === 'upgrade' && itemType) købEllerOpgrader(itemType);
        
        syncTilDb();
    }

    function haandterValg(v: Valg) {
        if (v.aktionType === 'luk') {
            logBesked = "Du trækker dig tilbage.";
            lukEvent();
            return;
        }

        if (v.udfald && aktivtEvent) {
            const raaSlag = kørTerninger();
            let modifier = 0; let modTekst = "";

            if (aktivtEvent.type === 'kamp') {
                const sabel = inventory.find(i => i.id === 'sabel');
                if (sabel) { modifier = sabel.level; modTekst = ` (+${modifier} ⚔️)`; }
            } else if (aktivtEvent.type === 'historie') {
                const skovl = inventory.find(i => i.id === 'skovl');
                if (skovl) { modifier = skovl.level; modTekst = ` (+${modifier} 🥄)`; }
            }

            const slag = raaSlag + modifier;
            let res: typeof v.udfald.katastrofe;

            if (slag <= 3) res = v.udfald.katastrofe;
            else if (slag <= 6) res = v.udfald.fiasko;
            else if (slag <= 9) res = v.udfald.neutral;
            else if (slag <= 11) res = v.udfald.succes;
            else res = v.udfald.mirakel;

            udfoerAktion(res.aktionType, res.vaerdi, res.itemType);
            
            let farve = '#ccc';
            if (res.vaerdi < 0) farve = '#ff5555';
            if (res.aktionType === 'guld' && res.vaerdi > 0) farve = 'gold';
            if (res.aktionType === 'hp' && res.vaerdi > 0) farve = '#55ff55';

            eventUdfald = { tekst: `🎲 Slag: ${raaSlag}${modTekst} = ${slag}. ${res.log}`, farve: farve, naesteTrin: res.naesteTrin };
            return;
        }

        let succes = true;
        if (v.chance !== undefined) succes = Math.random() <= v.chance;

        if (succes) {
            if (v.aktionType === 'guld' && guldTotal + (v.vaerdi || 0) < 0) { logBesked = "Du har ikke råd."; return; }
            udfoerAktion(v.aktionType, v.vaerdi || 0, v.itemType);
            let farve = (v.aktionType === 'hp' && v.vaerdi && v.vaerdi < 0) ? '#ff5555' : 'gold';
            eventUdfald = { tekst: v.vaerdi && v.vaerdi > 0 ? `Handlingen lykkedes. Gevinst: ${v.vaerdi}.` : `Valget er truffet.`, farve: farve, naesteTrin: v.naesteTrin };
        } else {
            const straf = v.failVaerdi || -20;
            udfoerAktion('hp', straf);
            eventUdfald = { tekst: `Katastrofe! Din handling slog fejl.`, farve: '#ff5555', naesteTrin: undefined };
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
        const index = inventory.findIndex(i => i.id === id);
        const basePris = id === 'sabel' ? 40 : 60;
        if (index > -1) {
            const vare = inventory[index];
            const upgradePris = basePris + (vare.level * 20);
            if (guldTotal >= upgradePris) {
                guldTotal -= upgradePris; vare.level += 1; logBesked = `Udstyr forbedret.`; lukEvent(); syncTilDb(true);
            } else logBesked = "Smeden afviser dig.";
        } else {
            if (guldTotal >= basePris) {
                guldTotal -= basePris;
                inventory = [...inventory, { id, navn: id === 'sabel' ? 'Sabre' : 'Shovel', level: 1, billede: id === 'sabel' ? '⚔️' : '🥄' }];
                logBesked = `Handel gennemført.`; lukEvent(); syncTilDb(true);
            } else logBesked = "Ikke mønter nok.";
        }
    }

    function grav() {
        let f = gitter[spillerIndex];
        if (!f || f.gravet || f.eventID || !valgtKarakter) return;
        
        livspoint -= valgtKarakter.digCost;
        f.gravet = true;
        
        if (livspoint <= 0) { syncTilDb(true); return; }

        const k = spillerIndex % BREDDE;
        const svaerhedsgrad = 1 + (k / BREDDE);

        const skovl = inventory.find(i => i.id === 'skovl');
        const bonus = skovl ? skovl.level * 15 : 0;
        const roll = Math.random();

        const farligeBiomer = ['bjerg', 'ruin', 'blodskov', 'hule', 'slagmark', 'ritual', 'krystal'];
        const isDangerous = farligeBiomer.includes(f.biome);
        const trapChance = isDangerous ? 0.30 * svaerhedsgrad : 0.05 * svaerhedsgrad;

        if (roll > trapChance) {
            const subRoll = Math.random();
            if (subRoll < 0.60) {
                const amount = Math.floor((Math.random() * 40) + 10 + bonus) * valgtKarakter.goldMod;
                guldTotal += amount; logBesked = `Mudderet gemte på ${amount}G.`;
            } else if (subRoll < 0.85) {
                livspoint = Math.min(100, livspoint + 15); logBesked = `Rod fundet. Heler 15 HP.`;
            } else {
                const amount = Math.floor(150 + bonus) * valgtKarakter.goldMod;
                guldTotal += amount; logBesked = `Skattekiste brudt op! ${amount}G indsamlet.`;
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
        if (gitter[spillerIndex]) gitter[spillerIndex].eventFuldført = true; 
        aktivtEvent = null; eventUdfald = null;
        syncTilDb(true); 
    }
    
    function flytHex(retning: string) {
        if (aktivtEvent || gameState !== 'play' || !valgtKarakter) return; 
        const r = Math.floor(spillerIndex / BREDDE); const k = spillerIndex % BREDDE; let nI = spillerIndex; const forskudt = r % 2 !== 0;
        if (retning === 'NW') nI = forskudt ? spillerIndex - BREDDE : spillerIndex - BREDDE - 1;
        else if (retning === 'NE') nI = forskudt ? spillerIndex - BREDDE + 1 : spillerIndex - BREDDE;
        else if (retning === 'W') nI = spillerIndex - 1; else if (retning === 'E') nI = spillerIndex + 1;
        else if (retning === 'SW') nI = forskudt ? spillerIndex + BREDDE : spillerIndex + BREDDE - 1;
        else if (retning === 'SE') nI = forskudt ? spillerIndex + BREDDE + 1 : spillerIndex + BREDDE;
        
        const nR = Math.floor(nI / BREDDE); const nK = nI % BREDDE;
        if (nI >= 0 && nI < BREDDE * HOEJDE && Math.abs(k - nK) <= 1 && Math.abs(r - nR) <= 1) { 
            let f = gitter[nI]; 
            if (f) {
                if (f.biome === 'hav') { logBesked = "Havet spærrer vejen."; return; }
                
                let bagersteKolonne = maxKolonne;
                for (const [navn, p] of Object.entries(alleSpillere)) {
                    if (navn !== spillerNavn && !p.isDead) {
                        if (p.kolonne < bagersteKolonne) bagersteKolonne = p.kolonne;
                    }
                }
                
                if (nK > bagersteKolonne + 5) {
                    logBesked = "For langt væk fra holdet. Afstanden må max være 5 felter.";
                    return;
                }

                const terraenModifier = biomeTerraenCost[f.biome] || 1;
                const bevægelsesPris = Math.ceil(valgtKarakter.moveCost * terraenModifier);
                
                livspoint -= bevægelsesPris;
                spillerIndex = nI; 
                
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

                if (f.eventID && !f.eventFuldført) aktivtEvent = eventBibliotek[f.eventID] || null; 
                
                syncTilDb();
            }
        }
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
                    Mandlige
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={visKvindelige} />
                    Kvindelige
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
        <div class="camera">
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
         style="background-image: url('/tiles/{felt.biome}.png'); left: {x}px; top: {y}px;">
        
        {#if felt.gravet}
            <div class="dug-overlay"></div>
        {/if}

        <div class="inner">
            {#if felt.udforsket && felt.eventID && !felt.eventFuldført} 
                <img src="/tiles/event.png" alt="Event" class="event-crystal" />
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
                            <span class="level-badge">Lvl {inventory[i].level}</span>
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
        
            <div class="pad">
                <div class="dpad-row"><button onclick={() => flytHex('NW')}>NW</button><button onclick={() => flytHex('NE')}>NE</button></div>
                <div class="dpad-row"><button onclick={() => flytHex('W')}>W</button><button class="dig" onclick={grav}>GRAV</button><button onclick={() => flytHex('E')}>E</button></div>
                <div class="dpad-row"><button onclick={() => flytHex('SW')}>SW</button><button class="rest" onclick={hvil}>HVIL</button><button onclick={() => flytHex('SE')}>SE</button></div>
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

    .game-container { position: relative; width: 100vw; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .camera { flex: 1; position: relative; background: #050505; overflow: hidden; }
    .map { position: absolute; transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); width: 4800px; height: 1640px; }
    
    .hex { position: absolute; width: 96px; height: 110px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; }
    .hex.unexplored { filter: brightness(0) !important; opacity: 0.9; }
    .dug-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); box-shadow: inset 0 0 20px rgba(0,0,0,0.8); z-index: 1; pointer-events: none; }
    .inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 2; }
    
    .player-icon { font-size: 40px; z-index: 100; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8)); display: flex; align-items: center; justify-content: center; }
    .other-player-icon { font-size: 28px; position: absolute; opacity: 0.8; transition: transform 0.3s; display: flex; align-items: center; justify-content: center; }

    .event-modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 200; display: flex; align-items: center; justify-content: center; }
    .event-content { background: #1a1a1a; padding: 30px; border-radius: 8px; border: 1px solid #555; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
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

    .pad { display: flex; flex-direction: column; align-items: center; gap: 5px; background: rgba(0,0,0,0.6); padding: 15px; border-radius: 50%; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
    .dpad-row { display: flex; gap: 5px; }
    .pad button { width: 50px; height: 50px; border-radius: 50%; border: none; background: #333; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.5); transition: 0.1s; }
    .pad button:active { transform: scale(0.9); background: #555; }
    .pad button.dig { background: #8b4513; }
    .pad button.rest { background: #2b5e2b; }

    :global(.event-crystal) {
        position: absolute;
        height: 65px;
        width: auto;
        z-index: 5;
        pointer-events: none;
        animation: floatAndGlow 3s ease-in-out infinite;
    }

    @keyframes floatAndGlow {
        0%, 100% {
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
        }
        50% {
            transform: translateY(-6px) scale(1.05);
            filter: drop-shadow(0 0 18px rgba(255, 255, 255, 0.9));
        }
    }
</style>