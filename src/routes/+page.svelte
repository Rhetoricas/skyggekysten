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
    { id: 'knight_m', navn: "Ridderen", ikon: "/game_faces/knight_m.png", startMsg: "Din rustning sløver dig i terrænet, men skærmer mod stød.", startHp: 120, startGuld: 0, sabelLevel: 1, skovlLevel: 0, moveCost: 2, digCost: 6, dmgMod: 0.5, goldMod: 1.0, canRest: true, fordel: "Tager kun halv skade i events. Starter med sabel.", ulempe: "Koster 2 HP at rykke sig på flad mark." },
    { id: 'knight_f', navn: "Skjoldmøen", ikon: "/game_faces/knight_f.png", startMsg: "Din rustning sløver dig i terrænet, men skærmer mod stød.", startHp: 120, startGuld: 0, sabelLevel: 1, skovlLevel: 0, moveCost: 2, digCost: 6, dmgMod: 0.5, goldMod: 1.0, canRest: true, fordel: "Tager kun halv skade i events. Starter med sabel.", ulempe: "Koster 2 HP at rykke sig på flad mark." },
    
    { id: 'magician_m', navn: "Troldmanden", ikon: "/game_faces/magician_m.png", startMsg: "Guld køber dig fri af de farer, din krop ikke kan tåle.", startHp: 80, startGuld: 250, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en massiv formue.", ulempe: "Tager +50% skade. Hårdt at grave (10 HP)." },
    { id: 'magician_f', navn: "Troldkvinden", ikon: "/game_faces/magician_f.png", startMsg: "Guld køber dig fri af de farer, din krop ikke kan tåle.", startHp: 80, startGuld: 250, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en massiv formue.", ulempe: "Tager +50% skade. Hårdt at grave (10 HP)." },
    
    { id: 'thief_m', navn: "Tyven", ikon: "/game_faces/thief_m.png", startMsg: "Hurtig, svag og grådig. Hold dig i bevægelse.", startHp: 100, startGuld: 50, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.5, canRest: true, fordel: "Får +50% udbytte af alt guld du finder.", ulempe: "Tager +20% skade i alle events." },
    { id: 'thief_f', navn: "Skyggen", ikon: "/game_faces/thief_f.png", startMsg: "Hurtig, svag og grådig. Hold dig i bevægelse.", startHp: 100, startGuld: 50, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.5, canRest: true, fordel: "Får +50% udbytte af alt guld du finder.", ulempe: "Tager +20% skade i alle events." },
    
    { id: 'explorer_m', navn: "Udforskeren", ikon: "/game_faces/explorer_m.png", startMsg: "Terrænet er din ven, men du starter uden penge og våben.", startHp: 100, startGuld: 0, sabelLevel: 0, skovlLevel: 2, moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Level 2 skovl giver bonus til udforskning. Graving koster 2 HP.", ulempe: "Mangler kamp-erfaring og guld." },
    { id: 'explorer_f', navn: "Eventyreren", ikon: "/game_faces/explorer_f.png", startMsg: "Terrænet er din ven, men du starter uden penge og våben.", startHp: 100, startGuld: 0, sabelLevel: 0, skovlLevel: 2, moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Level 2 skovl giver bonus til udforskning. Graving koster 2 HP.", ulempe: "Mangler kamp-erfaring og guld." },
    
    { id: 'viking_m', navn: "Vikingen", ikon: "/game_faces/viking_m.png", startMsg: "Blodet koger. Hvile er for de svage.", startHp: 150, startGuld: 0, sabelLevel: 2, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og Level 2 våben.", ulempe: "Nægter kategorisk at slå lejr og hvile." },
    { id: 'viking_f', navn: "Valkyrien", ikon: "/game_faces/viking_f.png", startMsg: "Blodet koger. Hvile er for de svage.", startHp: 150, startGuld: 0, sabelLevel: 2, skovlLevel: 0, moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og Level 2 våben.", ulempe: "Nægter kategorisk at slå lejr og hvile." },
    
    { id: 'royal_m', navn: "Hertugen", ikon: "/game_faces/royal_m.png", startMsg: "Mudder ødelægger dine støvler, men dit netværk er stort.", startHp: 100, startGuld: 400, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Startkapitalen er svimlende.", ulempe: "Fysisk arbejde er tortur. Graving koster 15 HP." },
    { id: 'royal_f', navn: "Hertuginden", ikon: "/game_faces/royal_f.png", startMsg: "Mudder ødelægger dine støvler, men dit netværk er stort.", startHp: 100, startGuld: 400, sabelLevel: 0, skovlLevel: 0, moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Startkapitalen er svimlende.", ulempe: "Fysisk arbejde er tortur. Graving koster 15 HP." }
];

    let gameState = $state<'login' | 'select' | 'play' | 'dead' | 'win'>('login'); 
    
    let spillerNavn = $state('');
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
            spillerIndex = data.start_index;
            alleSpillere = data.spillere || {};
            erHost = false;
            statusBesked = "Rum fundet. Deltager som Guest.";
            afslørOmraade(spillerIndex, 1);
            startRealtime();
            gameState = 'select';
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
                if (payload.new.kort) gitter = payload.new.kort; 
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
            ikon: valgtKarakter?.ikon
        };

        // Her er den afgørende linje, der fjerner "any" fejlen:
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
<main class="login-screen">
    <div class="login-box">
        <h1>Skyggekysten</h1>
        <p>Angiv dit navn og et rum for at kæmpe jer over øen sammen.</p>
        
        <input type="text" placeholder="Dit Spillernavn" bind:value={spillerNavn} />
        <input type="text" placeholder="Rum Kode (fx 1234)" bind:value={rumKode} />
        
        <button class="join-btn" onclick={opretEllerDeltag}>Gå til kysten</button>
        
        {#if statusBesked}
            <p class="status">{statusBesked}</p>
        {/if}
    </div>
</main>
{:else if gameState === 'select'}
<main class="selection-screen">
    <div class="selection-header">
        <h1>Vælg din skæbne, {spillerNavn}</h1>
        <button class="nuke-btn" onclick={nulstilHukommelse}>Forlad rum</button>
    </div>
    <div class="character-gallery">
        {#each tilgaengeligeKarakterer as k (k.id)}
            <button class="character-card" onclick={() => bekræftValg(k)}>
                <div class="big-icon">
                    {#if k.ikon.startsWith('/')}
                        <img src={k.ikon} alt={k.navn} class="char-image" />
                    {:else}
                        {k.ikon}
                    {/if}
                </div>
                <h2>{k.navn}</h2>
                <div class="char-stats">
                    <span class="stat-badge hp">❤️ {k.startHp}</span>
                    {#if k.startGuld > 0}<span class="stat-badge gold">💰 {k.startGuld}</span>{/if}
                    {#if k.sabelLevel > 0}<span class="stat-badge wpn">⚔️ Lvl {k.sabelLevel}</span>{/if}
                    {#if k.skovlLevel > 0}<span class="stat-badge dig">🥄 Lvl {k.skovlLevel}</span>{/if}
                </div>
                <div class="char-desc">
                    <div class="pro">▲ {k.fordel}</div>
                    <div class="con">▼ {k.ulempe}</div>
                </div>
            </button>
        {/each}
    </div>
</main>
{:else if gameState === 'dead' || gameState === 'win'}
<main class="death-screen" class:win-screen={gameState === 'win'}>
    <div class="death-content">
        <div class="ghost-icon">{gameState === 'win' ? '👑' : '💀'}</div>
        <h1>{gameState === 'win' ? 'Skyggekysten er besejret' : 'Øen krævede sin pris'}</h1>
        <p>{spillerNavn} {gameState === 'win' ? 'overlevede rejsen' : `faldt ${BREDDE - 2 - maxKolonne} felter fra kysten`}.</p>
        
        <div class="score-board">
            <h3>Holdets Resultater</h3>
            {#each Object.entries(alleSpillere).sort((a, b) => (b[1].score || 0) - (a[1].score || 0)) as [navn, p] (navn)}
                <div class="score-row lb-row" class:highlight={navn === spillerNavn}>
                    <span>{navn} {p.isDead ? '💀' : p.isWinner ? '👑' : '🚶'}</span>
                    <span>{p.score || 0} pt</span>
                </div>
            {/each}
        </div>

        <button class="retry-btn" onclick={nulstilHukommelse}>Afslut</button>
    </div>
</main>
{:else}
<main class="game-container">
    <header class="hud">
<button onclick={nulstilHukommelse} class="stat-box char-btn">
    {#if valgtKarakter?.ikon.startsWith('/')}
        <img src={valgtKarakter.ikon} alt="Ikon" style="height: 58px; width: auto; border: none; outline: none; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));" />
    {:else}
        <span style="font-size: 40px; line-height: 1;">{valgtKarakter?.ikon}</span>
    {/if} 
    <small>ABORT</small>
</button>
        <div class="stat-box hp" class:low={livspoint <= 30}>❤️ {livspoint}</div>
        <div class="stat-box gold">💰 {guldTotal}</div>
        <div class="inventory">
            {#each inventory as item (item.id)} <div class="item-slot">{item.billede} <small>+{item.level}</small></div> {/each}
        </div>
        <div class="coop-status">
    {#each Object.entries(alleSpillere) as [navn, p] (navn)}
        {#if navn !== spillerNavn}
            <span class="ally-hp" class:dead={p.isDead} title="{navn}">
                {#if p.ikon && p.ikon.startsWith('/')}
                    <img src={p.ikon} alt={navn} style="height: 20px; width: auto; vertical-align: bottom; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8)); margin-right: 4px;" />
                {:else}
                    {p.ikon || '👤'}
                {/if}
                {p.isDead ? '💀' : p.hp}
            </span>
        {/if}
    {/each}
</div>
    </header>

    <div class="camera-lens">
        <div class="world" style={kameraStyle}>
            {#each gitter as felt, i (i)}
                {@const r = Math.floor(i / BREDDE)}
                <div class="hex" 
                     class:odd={r % 2 !== 0} 
                     class:active={spillerIndex === i} 
                     class:dug={felt.gravet} 
                     class:unexplored={!felt.udforsket}
                     style="background-image: url('/tiles/{felt.biome}.png');">
                    <div class="inner">
                        {#if spillerIndex === i} 
                            <span class="player-icon">
                                {#if valgtKarakter?.ikon.startsWith('/')}
                                    <img src={valgtKarakter.ikon} alt="Spiller" style="width: 50px; height: 50px;" />
                                {:else}
                                    {valgtKarakter?.ikon}
                                {/if}
                            </span> 
                        {/if}
                        
                        <div class="other-players-group">
                            {#each Object.entries(alleSpillere) as [navn, p] (navn)}
                                {#if p.index === i && navn !== spillerNavn && !p.isDead}
                                    <span class="other-player-icon" title={navn}>{p.ikon || '👤'}</span>
                                {/if}
                            {/each}
                        </div>

                        {#if felt.udforsket && felt.eventID && !felt.eventFuldført && spillerIndex !== i} 
                            <span class="marker">❗</span> 
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        {#if aktivtEvent}
            <div class="modal">
                {#key aktivtEvent.titel}
                <div class="card">
                    <h3>{aktivtEvent.titel}</h3>
                    {#if aktivtEvent.billedeUrl}
                        <img src={aktivtEvent.billedeUrl} alt="Event" class="img" onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                    {/if}
                    
                    {#if eventUdfald}
                        <div class="udfald-boks" style="border-left-color: {eventUdfald.farve};">
                            <p style="color: {eventUdfald.farve}; font-size: 1.1rem; line-height: 1.5;">{eventUdfald.tekst}</p>
                        </div>
                        <div class="btns">
                            <button onclick={accepterUdfald}>Forstået</button>
                        </div>
                    {:else}
                        <p>{aktivtEvent.tekst}</p>
                        <div class="btns"> 
                            {#each aktivtEvent.valg as v, i (i)} 
                                <button onclick={() => haandterValg(v)} class:risky={v.chance !== undefined || v.udfald !== undefined}>
                                    {v.tekst}
                                </button> 
                            {/each} 
                        </div>
                    {/if}
                </div>
                {/key}
            </div>
        {/if}
    </div>

    <footer class="ui">
        <div class="pad">
            <div class="dpad-row"><button onclick={() => flytHex('NW')}>NW</button><button onclick={() => flytHex('NE')}>NE</button></div>
            <div class="dpad-row"><button onclick={() => flytHex('W')}>W</button><button class="dig" onclick={grav}>GRAV</button><button onclick={() => flytHex('E')}>E</button></div>
            <div class="dpad-row"><button onclick={() => flytHex('SW')}>SW</button><button class="rest" onclick={hvil}>HVIL</button><button onclick={() => flytHex('SE')}>SE</button></div>
        </div>
        <div class="msg">{logBesked}</div>
    </footer>
</main>
{/if}

<style>
    :global(body) { background: #000; color: #fff; margin: 0; font-family: sans-serif; overflow: hidden; }
    .login-screen, .selection-screen, .death-screen { position: fixed; inset: 0; background: #050505; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; }
    
    .login-box { background: #1a1a1a; padding: 40px; border: 2px solid #444; border-radius: 15px; text-align: center; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    .login-box h1 { color: gold; margin-bottom: 10px; }
    .login-box p { color: #888; margin-bottom: 25px; }
    .login-box input { width: 100%; padding: 12px; margin-bottom: 15px; background: #0a0a0a; border: 1px solid #333; color: white; border-radius: 8px; font-size: 1.1rem; box-sizing: border-box; }
    .join-btn { width: 100%; padding: 15px; background: #2a4a2a; color: white; border: 1px solid #4a8a4a; border-radius: 8px; cursor: pointer; font-size: 1.2rem; font-weight: bold; transition: background 0.2s; }
    .join-btn:hover { background: #3a6a3a; }
    .status { margin-top: 15px; color: #aaa; font-style: italic; }

    .death-screen { background: rgba(30, 0, 0, 0.95); animation: fade-in 2s; }
    .win-screen { background: rgba(10, 30, 10, 0.95); }
    .death-content { text-align: center; }
    .ghost-icon { font-size: 8rem; margin-bottom: 20px; filter: grayscale(1); opacity: 0.8; }
    .win-screen .ghost-icon { filter: none; opacity: 1; }
    
    .score-board { background: rgba(0,0,0,0.6); border: 1px solid #444; border-radius: 10px; padding: 20px; margin: 20px 0; width: 350px; }
    .score-board h3 { color: gold; border-bottom: 1px solid #444; padding-bottom: 10px; margin-top: 0; }
    .score-row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #aaa; font-family: monospace; font-size: 1.1rem; }
    .lb-row { padding: 5px 0; border-bottom: 1px dotted #333; }
    .lb-row.highlight { color: #fff; font-weight: bold; }
    
    .retry-btn { padding: 15px 40px; background: #500; color: white; border: 1px solid #f00; border-radius: 10px; cursor: pointer; font-size: 1.2rem; font-weight: bold; }
    .win-screen .retry-btn { background: #1a4a1a; border-color: #2a8a2a; }
    .hp.low { color: #ff3333; animation: pulse 1s infinite alternate; }
    
    @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.1); } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .selection-header { text-align: center; margin-bottom: 30px; }
    .selection-header h1 { color: gold; font-size: 3rem; margin: 0; }
    .nuke-btn { margin-top: 15px; background: #222; color: #888; border: 1px solid #444; padding: 5px 15px; cursor: pointer; border-radius: 5px; }
    .character-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .character-card { background: #1a1a1a; padding: 20px; border: 2px solid #333; border-radius: 15px; text-align: center; color: white; cursor: pointer; width: 250px; display: flex; flex-direction: column; align-items: center; }
    .big-icon { font-size: 4rem; min-height: 80px; display: flex; align-items: center; justify-content: center; }
.char-image { height: 110px; width: auto; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.8)); }    .char-stats { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; margin-top: 10px; }
    .stat-badge { font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; background: rgba(0,0,0,0.5); border: 1px solid #555; }
    .stat-badge.hp { color: #ff5555; border-color: #500; }
    .stat-badge.gold { color: gold; border-color: #554400; }
    .stat-badge.wpn { color: #aaa; border-color: #444; }
    .stat-badge.dig { color: #cd853f; border-color: #630; }
    
    .char-desc { margin-top: 15px; font-size: 0.85rem; text-align: left; width: 100%; border-top: 1px solid #333; padding-top: 10px; line-height: 1.4; }
    .char-desc .pro { color: #5a9d5a; margin-bottom: 5px; }
    .char-desc .con { color: #c45; }

    .game-container { display: flex; flex-direction: column; align-items: center; padding: 10px; }
    .hud { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; width: 800px; }
    .stat-box { background: #222; padding: 8px 12px; border-radius: 5px; font-weight: bold; border: 1px solid #444; display: flex; align-items: center; gap: 8px; }
    .char-btn { border-color: #550000; color: #ff5555; cursor: pointer; }
    .inventory { display: flex; gap: 5px; }
    .item-slot { background: #111; padding: 5px 10px; border: 1px solid gold; border-radius: 5px; font-size: 20px; }
    
    .coop-status { margin-left: auto; display: flex; gap: 10px; }
    .ally-hp { background: #1a1a1a; padding: 5px 10px; border-radius: 5px; border: 1px dashed #555; font-size: 0.9rem; }
    .ally-hp.dead { opacity: 0.5; color: #888; text-decoration: line-through; }

    .camera-lens { width: 800px; height: 500px; overflow: hidden; position: relative; border: 3px solid #333; border-radius: 10px; background: #0a0a0a; }
    .world { display: grid; grid-template-columns: repeat(50, 96px); grid-auto-rows: 82px; position: absolute; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
    
    .hex { width: 96px; height: 110px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); background-color: #2d1e14; background-size: cover; background-position: center; position: relative; transition: filter 0.3s, opacity 0.3s; }
    .hex.odd { transform: translateX(48px); }
    .hex.unexplored { filter: brightness(0.2) grayscale(1); opacity: 0.4; }
    .hex.active { z-index: 10; filter: brightness(1.2); border: 2px solid #5a7d2a; box-shadow: inset 0 0 20px rgba(90,125,42,0.8); } 
    .hex.dug { filter: brightness(0.5) sepia(1); }
    .inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; font-size: 40px; overflow: visible; }
    
    .player-icon { display: flex; align-items: center; justify-content: center; z-index: 11; pointer-events: none; }
    .other-players-group { position: absolute; top: 5px; right: 5px; display: flex; flex-wrap: wrap; justify-content: flex-end; width: 50px; gap: 2px; z-index: 2; }
    .other-player-icon { font-size: 16px; filter: drop-shadow(0 0 2px black); animation: bounce 2s infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

    .modal { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 100; }
    .card { background: #1a1a1a; padding: 25px; border: 2px solid gold; border-radius: 15px; width: 450px; text-align: center; animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .udfald-boks { background: #111; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid; text-align: left; }
    
    .img { max-width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 15px; border: 1px solid #444; }
    .btns { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 15px; }
    .btns button { padding: 10px 15px; background: #333; color: #fff; cursor: pointer; border-radius: 8px; border: 1px solid #555; font-weight: bold; }
    .btns button.risky { border-color: #a00; color: #faa; }
    
    .ui { display: flex; gap: 20px; margin-top: 15px; align-items: center; }
    .pad { display: flex; flex-direction: column; align-items: center; gap: 5px; background: #111; padding: 10px; border-radius: 10px; border: 1px solid #333; }
    .dpad-row { display: flex; gap: 5px; justify-content: center; width: 100%; }
    .pad button { width: 50px; height: 45px; background: #333; color: #fff; border: 1px solid #444; cursor: pointer; border-radius: 5px; font-weight: bold; }
    .dig { background: #8b4513 !important; width: 80px !important; border-color: #d2691e !important; }
    .rest { background: #1e3c5a !important; color: #87ceeb !important; border-color: #4682b4 !important;}
    .msg { width: 300px; height: 60px; background: #0a0a0a; border: 1px solid #333; padding: 10px; color: #0f0; font-size: 14px; border-radius: 5px; line-height: 1.4; }
</style>