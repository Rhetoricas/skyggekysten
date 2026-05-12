import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb, broadcastFelt, broadcastFelter, syncKortTilDbSenere } from '$lib/netvaerk';
import { BREDDE, HOEJDE, biomeVægte, biomeTerraenCost, itemDB, markedVarePool } from '$lib/spildata';
import { supabase } from '$lib/supabaseClient';
import { eventBibliotek } from '$lib/eventBibliotek';
import { genererUndergrund } from '$lib/undergrund.svelte';
import { fremrykTid, fremtvingKollaps, tagSkadeOgTjekDød } from '$lib/overlevelse.svelte';
import { erAfgroedeModen, erHvedeBlok, erInsektPlageAktiv, hentAfgroedeBlok } from '$lib/afgroeder';
import type { Biome, Felt, RygsækTing } from '$lib/types';
import { delNyeKort } from '$lib/ventespil.svelte';
import { startEvent } from '$lib/eventMotor.svelte';

const RETNINGER = {
    'NE': [[0, -1], [1, -1]],
    'E':  [[1, 0],  [1, 0]],
    'SE': [[0, 1],  [1, 1]],
    'SW': [[-1, 1], [0, 1]],
    'W':  [[-1, 0], [-1, 0]],
    'NW': [[-1, -1], [0, -1]]
} as const;

let katastrofeVisuelId = 0;

function animerKatastrofeFelter(centerIndex: number, fraBiomer: Map<number, string | Biome>) {
    const id = ++katastrofeVisuelId;
    const felter = spilTilstand.gitter;
    const indices = Array.from(fraBiomer.keys()).sort((a, b) => {
        const afstandDiff = regnHexAfstand(centerIndex, a, BREDDE) - regnHexAfstand(centerIndex, b, BREDDE);
        return afstandDiff !== 0 ? afstandDiff : a - b;
    });

    for (const index of indices) {
        const felt = felter[index];
        if (!felt) continue;
        felt.katastrofeFraBiome = fraBiomer.get(index);
        felt.katastrofeVisuelAktiv = true;
        felt.katastrofeVisuelId = id;
    }

    spilTilstand.gitter = [...felter];

    indices.forEach((index, position) => {
        setTimeout(() => {
            const felt = spilTilstand.gitter[index];
            if (!felt || felt.katastrofeVisuelId !== id) return;

            delete felt.katastrofeFraBiome;
            delete felt.katastrofeVisuelAktiv;
            delete felt.katastrofeVisuelId;
            spilTilstand.gitter = [...spilTilstand.gitter];
        }, position * 300);
    });
}

export function rystSkaerm(varighed: number = 1200) {
    if (typeof document !== 'undefined') {
        document.body.classList.add('jordskaelv');
        document.body.classList.add('katastrofe-lys');
        setTimeout(() => {
            document.body.classList.remove('jordskaelv');
            document.body.classList.remove('katastrofe-lys');
        }, varighed);
    }

    if (typeof window !== 'undefined' && spilTilstand.musikTaendt) {
        try {
            const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtor) return;

            const ctx = new AudioCtor();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(72, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(34, ctx.currentTime + 0.38);
            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.52);
            setTimeout(() => void ctx.close().catch(() => {}), 700);
        } catch {
            // Lyd er kun en lokal effekt. Hvis browseren blokerer den, fortsætter spillet.
        }
    }
}

export function hentNaboIRetning(index: number, retning: keyof typeof RETNINGER, bredde: number, maxFelter: number): number | null {
    const raekke = Math.floor(index / bredde);
    const kolonne = index % bredde;
    const forskudt = raekke % 2 !== 0 ? 1 : 0;
    
    const forskel = RETNINGER[retning];
    if (!forskel) return null;

    const deltaX = forskel[forskudt][0];
    const deltaY = forskel[forskudt][1];

    const nyKolonne = kolonne + deltaX;
    const nyRaekke = raekke + deltaY;

    if (nyKolonne < 0 || nyKolonne >= bredde || nyRaekke < 0 || nyRaekke >= (maxFelter / bredde)) return null;
    
    return nyRaekke * bredde + nyKolonne;
}

export function regnHexAfstand(indexEn: number, indexTo: number, bredde: number): number {
    if (indexEn === indexTo) return 0;

    const raekkeEn = Math.floor(indexEn / bredde);
    const kolonneEn = indexEn % bredde;
    const raekkeTo = Math.floor(indexTo / bredde);
    const kolonneTo = indexTo % bredde;

    const forskydningEn = Math.floor(raekkeEn / 2);
    const forskydningTo = Math.floor(raekkeTo / 2);

    const kubeXEn = kolonneEn - forskydningEn;
    const kubeXTo = kolonneTo - forskydningTo;
    const kubeZEn = raekkeEn;
    const kubeZTo = raekkeTo;
    const kubeYEn = -kubeXEn - kubeZEn;
    const kubeYTo = -kubeXTo - kubeZTo;

    return Math.max(
        Math.abs(kubeXEn - kubeXTo),
        Math.abs(kubeYEn - kubeYTo),
        Math.abs(kubeZEn - kubeZTo)
    );
}

export async function sendAnonymAlarm() {
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.spillerNavn || !spilTilstand.rumKode) return;

    const besked = {
        type: 'anonym_alarm',
        senderNavn: spilTilstand.spillerNavn 
    };

    void supabase.channel(spilTilstand.rumKode).send({
        type: 'broadcast',
        event: 'alarm',
        payload: besked
    }).catch((error) => console.warn('Alarm kunne ikke sendes', error));
}

export function hentNaboIndices(index: number) {
    const raekke = Math.floor(index / BREDDE);
    const forskudt = raekke % 2 !== 0;
    const afstande = forskudt 
        ? [-BREDDE, -BREDDE + 1, -1, 1, BREDDE, BREDDE + 1] 
        : [-BREDDE - 1, -BREDDE, -1, 1, BREDDE - 1, BREDDE];
    return afstande.map(o => index + o).filter(i => i >= 0 && i < BREDDE * HOEJDE);
}

export function tilfoejTilRygsæk(genstandId: string, tilfoejetMaengde: number = 1) {
    const udstyrListe = spilTilstand.mitUdstyr as RygsækTing[];
    const fundetTing = udstyrListe.find(ting => ting.id === genstandId);

    if (fundetTing) {
        fundetTing.maengde += tilfoejetMaengde;
    } else {
        const nyTing: RygsækTing = {
            id: genstandId,
            maengde: tilfoejetMaengde,
            anskaffetDag: spilTilstand.dag
        };
        udstyrListe.push(nyTing);
    }
    
    spilTilstand.mitUdstyr = [...spilTilstand.mitUdstyr];
    syncTilDb(); // Ingen `true` her. Rygsæk er personlig.
}

export function brugFraRygsæk(genstandId: string, brugtMaengde: number = 1) {
    const indeks = spilTilstand.mitUdstyr.findIndex(ting => ting.id === genstandId);
    
    if (indeks === -1) return;

    spilTilstand.mitUdstyr[indeks].maengde -= brugtMaengde;

    if (spilTilstand.mitUdstyr[indeks].maengde <= 0) {
        spilTilstand.mitUdstyr.splice(indeks, 1);
    }
    
    spilTilstand.mitUdstyr = [...spilTilstand.mitUdstyr];
    syncTilDb(); // Ingen `true` her.
}

export function afslørOmraade(centerIndex: number, radius: number = 1) {
    const totalFelter = spilTilstand.gitter.length;
    const maxRaekker = Math.floor(totalFelter / BREDDE);

    const centerRaekke = Math.floor(centerIndex / BREDDE);
    const centerKolonne = centerIndex % BREDDE;
    const staarPaaBjerg = spilTilstand.gitter[centerIndex]?.biome === 'bjerg';

    const synlige = new Set<number>();

    const raekkeMin = Math.max(0, centerRaekke - radius);
    const raekkeMax = Math.min(maxRaekker - 1, centerRaekke + radius);
    const kolonneMin = Math.max(0, centerKolonne - radius);
    const kolonneMax = Math.min(BREDDE - 1, centerKolonne + radius);

    for (let r = raekkeMin; r <= raekkeMax; r++) {
        for (let k = kolonneMin; k <= kolonneMax; k++) {
            const indeks = r * BREDDE + k;
            
            if (
                regnHexAfstand(centerIndex, indeks, BREDDE) <= radius &&
                (staarPaaBjerg || !erSynBlokeretAfBjerg(centerIndex, indeks))
            ) {
                synlige.add(indeks);
            }
        }
    }

    synlige.forEach(indeks => { 
        if (spilTilstand.gitter[indeks] && !spilTilstand.mineKendteFelter.includes(indeks)) {
            spilTilstand.mineKendteFelter.push(indeks);
        }
    });
}

function indeksTilKube(index: number) {
    const raekke = Math.floor(index / BREDDE);
    const kolonne = index % BREDDE;
    const x = kolonne - Math.floor(raekke / 2);
    const z = raekke;
    const y = -x - z;
    return { x, y, z };
}

function kubeTilIndeks(kube: { x: number; z: number }) {
    const raekke = kube.z;
    const kolonne = kube.x + Math.floor(raekke / 2);
    if (raekke < 0 || raekke >= HOEJDE || kolonne < 0 || kolonne >= BREDDE) return null;
    return raekke * BREDDE + kolonne;
}

function afrundKube(kube: { x: number; y: number; z: number }) {
    let rx = Math.round(kube.x);
    let ry = Math.round(kube.y);
    let rz = Math.round(kube.z);

    const xDiff = Math.abs(rx - kube.x);
    const yDiff = Math.abs(ry - kube.y);
    const zDiff = Math.abs(rz - kube.z);

    if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
    else if (yDiff > zDiff) ry = -rx - rz;
    else rz = -rx - ry;

    return { x: rx, y: ry, z: rz };
}

function erSynBlokeretAfBjerg(centerIndex: number, targetIndex: number) {
    const afstand = regnHexAfstand(centerIndex, targetIndex, BREDDE);
    if (afstand <= 1) return false;

    const start = indeksTilKube(centerIndex);
    const slut = indeksTilKube(targetIndex);

    for (let trin = 1; trin < afstand; trin++) {
        const t = trin / afstand;
        const kube = afrundKube({
            x: start.x + (slut.x - start.x) * t,
            y: start.y + (slut.y - start.y) * t,
            z: start.z + (slut.z - start.z) * t
        });
        const indeks = kubeTilIndeks(kube);
        if (indeks !== null && spilTilstand.gitter[indeks]?.biome === 'bjerg') return true;
    }

    return false;
}

export interface BevaegelseOptions {
    erITaagen: boolean;
    langsomsteDag: number;
    maxDageForan: number;
    synsRadius: number;
    onKameraFoelg?: (nytIndeks: number) => void;
    onBaadStart?: (nytIndeks: number) => void;
}

type AnkomstKilde = 'gang' | 'stav' | 'portal' | 'byg_portal' | 'event';

export interface TeleportOptions {
    kilde: AnkomstKilde;
    afstand?: number;
    kraeverStav?: boolean;
    opretPortalVedStart?: boolean;
    energiPris?: number;
    startLog?: string;
}

interface AnkomstOptions {
    startLog?: string;
    onBaadStart?: (nytIndeks: number) => void;
    triggerPortal?: boolean;
}

export function udfoerBevaegelse(nytIndeks: number, options: BevaegelseOptions) {
    if (!spilTilstand.valgtKarakter) return false;

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    if (mig && mig.sidstAktiv && (Date.now() - mig.sidstAktiv > 5 * 60 * 1000) && options.erITaagen) {
        spilTilstand.livspoint = 0;
        spilTilstand.gameState = 'dead_map';
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isDead = true;
        }
        spilTilstand.logBesked = "Du har været væk for længe. Tågen har indhentet dig.";
        syncTilDb(true);
        return false;
    }

    if (spilTilstand.dag >= options.langsomsteDag + options.maxDageForan) {
        spilTilstand.logBesked = 'Du må vente på de andre spillere.';
        spilTilstand.venteSpilAktiv = true;
        return false;
    }

    const felt = spilTilstand.gitter[nytIndeks];
    if (!felt) return false;

    const grundPris = biomeTerraenCost[felt.biome as Biome] || 1;
    const biomeRabat = spilTilstand.valgtKarakter.biomeMod?.[felt.biome as string] || 0;
    const pris = Math.max(1, spilTilstand.valgtKarakter.moveCost + spilTilstand.rygsækEffekt.move + grundPris + biomeRabat);

    spilTilstand.nuvaerendeEnergi -= options.erITaagen ? pris + 2 : pris;

    spilTilstand.spillerIndex = nytIndeks;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(nytIndeks);

    options.onKameraFoelg?.(nytIndeks);
    afslørOmraade(nytIndeks, Math.max(felt.biome === 'bjerg' ? 2 : 1, options.synsRadius));
    if ((nytIndeks % BREDDE) > spilTilstand.maxKolonne) spilTilstand.maxKolonne = nytIndeks % BREDDE;

    return haandterAnkomstPaaFelt(nytIndeks, 'gang', {
        startLog: "",
        onBaadStart: options.onBaadStart
    });
}

function haandterAnkomstPaaFelt(nytIndeks: number, ankomstKilde: AnkomstKilde, options: AnkomstOptions = {}) {
    const felt = spilTilstand.gitter[nytIndeks];
    let ekstraLog = "";
    let mapAendret = false;
    const charId = spilTilstand.valgtKarakter?.id;

    const nulHp = ['mark', 'by', 'eng', 'marked', 'hoejland', 'skov'];
    const toHp = ['bjerg', 'hule'];
    const erDvaerg = charId === 'dwarf_m' || charId === 'dwarf_f';
    let hpStraf = 0;
    
    if (nulHp.includes(felt.biome as string)) hpStraf = 0;
    else if (toHp.includes(felt.biome as string)) hpStraf = 3;
    if (erDvaerg && felt.biome === 'bjerg') hpStraf = 1;

    if (hpStraf > 0) {
        hpStraf = spilTilstand.beregnSkade(hpStraf);
        spilTilstand.livspoint -= hpStraf;
        ekstraLog += ` Terrænet slider på dig. (-${hpStraf} HP)`;
    }

    if (spilTilstand.livspoint <= 0 && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map') {
        fremtvingKollaps("Terrænet tog dine sidste kræfter.");
        spilTilstand.gitter = [...spilTilstand.gitter];
        syncTilDb(true);
        return false;
    }

    const nuBlok = hentAfgroedeBlok(spilTilstand.dag);
    const insektPlageAktiv = erInsektPlageAktiv(spilTilstand.gitter, nuBlok);
    const erSmadret = felt.smadretFremTilBlok !== undefined && nuBlok <= felt.smadretFremTilBlok;
    const erHoestet = felt.hoestetFremTilBlok !== undefined && nuBlok <= felt.hoestetFremTilBlok;
    
    if (felt.biome === 'mark' && felt.afgroede && !erSmadret && !erHoestet) {
        const erModen = erAfgroedeModen(felt, nuBlok);
        if (erModen) {
            if (insektPlageAktiv) {
                felt.hoestetFremTilBlok = nuBlok;
                ekstraLog += " Græshopperne har spist den modne afgrøde.";
            } else {
                spilTilstand.livspoint += 3;
                felt.hoestetFremTilBlok = nuBlok;
            }
        } else {
            felt.smadretFremTilBlok = nuBlok + 1;
        }
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
    }

    if (felt.biome === 'hav' && !felt.hasBoat) {
        tagSkadeOgTjekDød(30, `Du ender i åbent vand. (-30 HP)`, "Du druknede i det åbne vand.");
        if (spilTilstand.gameState === 'dead_map' || spilTilstand.gameState === 'dead') {
            return false;
        }
    }

    const b = felt.biome as string;

    if ((charId === 'thief_m' || charId === 'thief_f') && (b === 'marked' || b === 'by')) {
        spilTilstand.guldTotal += 5;
        ekstraLog += " Du finder 5 guld i byens uro.";
    } else if ((charId === 'joker_m' || charId === 'joker_f') && b === 'marked') {
        spilTilstand.guldTotal += 10;
        ekstraLog += " Din optræden giver 10 guld.";
    } else if ((charId === 'royal_m' || charId === 'royal_f') && b === 'by') {
        spilTilstand.guldTotal += 5;
        ekstraLog += " Du opkræver 5 guld i lokal skat.";
    } else if ((charId === 'magician_m' || charId === 'magician_f') && b === 'ritual') {
        spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 5);
        ekstraLog += " Ritualpladsen giver dig 5 HP.";
    }

    if (felt.hasGoldmine) {
        const spiller = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
        if (!spiller.besoegteMiner) spiller.besoegteMiner = [];
        
        const varEjer = felt.mineOwner === spilTilstand.spillerNavn;
        const harBesoegt = spiller.besoegteMiner.includes(nytIndeks);
        
        if (!varEjer) {
            if (felt.mineLocked) {
                ekstraLog += " Minen er låst af ejeren.";
            } else {
                const ejedeMiner = spilTilstand.gitter.filter(f => f.hasGoldmine && f.mineOwner === spilTilstand.spillerNavn).length;
                felt.mineOwner = spilTilstand.spillerNavn;
                
                if (!harBesoegt) {
                    spiller.besoegteMiner.push(nytIndeks);
                    const basisGuld = 100 + (ejedeMiner * 50);
                    const faktiskGuld = spilTilstand.beregnGuldIndkomst ? spilTilstand.beregnGuldIndkomst(basisGuld) : basisGuld;
                    spilTilstand.guldTotal += faktiskGuld;
                    ekstraLog += ` Du overtager minen og udbetaler ${faktiskGuld} guld til dig selv.`;
                } else {
                    felt.mineLocked = true;
                    ekstraLog += ` Du låser minen. Andre spillere kan ikke overtage den.`;
                }
                spilTilstand.gitter[nytIndeks] = { ...felt };
                broadcastFelt(nytIndeks, spilTilstand.gitter[nytIndeks]);
                mapAendret = true;
            }
        }
    }

    const startLog = options.startLog ?? (
        ankomstKilde === 'gang'
            ? ""
            : ankomstKilde === 'stav' 
            ? "Staven flytter dig fire felter mod øst." 
            : "Portalen flytter dig fire felter mod øst."
    );
    const slidLog = felt.hasBoat ? "" : tjekMiljoeSlitage(felt.biome as string);
    const samletLog = `${startLog}${ekstraLog}${slidLog}`.trim();
    
    if (samletLog) {
        spilTilstand.logBesked = samletLog;
    }

    if (options.triggerPortal !== false && felt.hasPortal && !(felt.shopItems && felt.shopItems.length > 0)) {
        udfoerPortalTeleport();
        spilTilstand.gitter = [...spilTilstand.gitter];
        syncTilDb(mapAendret);
        return true;
    }

    fremrykTid();
    
    if (felt.hasBoat) {
        const baadeTilbage = Math.max(0, (felt.boatCount || 1) - 1);
        felt.boatCount = baadeTilbage > 0 ? baadeTilbage : undefined;
        felt.hasBoat = baadeTilbage > 0;
        options.onBaadStart?.(nytIndeks);
        if (spilTilstand.alleSpillere[spilTilstand.spillerNavn]) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn].isWinner = true;
        }
        spilTilstand.logBesked = "Du går ombord i båden og forlader øen.";
        broadcastFelt(nytIndeks, felt);
        mapAendret = true;
        setTimeout(() => {
            spilTilstand.gameState = 'win_map';
            syncTilDb(true); 
        }, 3000);
    } else {
        if (felt.eventID && !felt.eventFuldført) {
            felt.eventFuldført = true;
            broadcastFelt(nytIndeks, felt);
            startEvent(felt.eventID);
            mapAendret = true;
        }
        else if (felt.shopItems && felt.shopItems.length > 0) spilTilstand.aktivShop = felt.shopItems;
    }

    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(mapAendret); // Uploades kun hvis nødvendigt

    if (spilTilstand.livspoint <= 0 && spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'win_map') {
        fremtvingKollaps("Kræfterne rev din sidste livsgnist væk.");
    }
    return true;
}

function beregnTeleportMaal(startIndeks: number, afstand: number) {
    const raekke = Math.floor(startIndeks / BREDDE);
    const kolonne = startIndeks % BREDDE;
    const nyKolonne = Math.min(kolonne + afstand, BREDDE - 1);

    return {
        indeks: raekke * BREDDE + nyKolonne,
        kolonne: nyKolonne
    };
}

export function udfoerTeleportMedOptions(options: TeleportOptions) {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;

    if (options.kraeverStav) {
        const stavItem = spilTilstand.mitUdstyr.find(i => i.id === 'stav');
        if (!stavItem || stavItem.maengde <= 0) return;
    }

    const pris = options.energiPris ?? spilTilstand.valgtKarakter.baseEnergi;
    spilTilstand.nuvaerendeEnergi -= pris;

    const gammeltIndeks = spilTilstand.spillerIndex;
    const maal = beregnTeleportMaal(gammeltIndeks, options.afstand ?? 4);

    if (options.opretPortalVedStart) {
        spilTilstand.gitter[gammeltIndeks].hasPortal = true;
        broadcastFelt(gammeltIndeks, spilTilstand.gitter[gammeltIndeks]);
    }

    spilTilstand.spillerIndex = maal.indeks;
    if (!spilTilstand.historik) spilTilstand.historik = [];
    spilTilstand.historik.push(maal.indeks);
    
    afslørOmraade(maal.indeks, Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn));

    if (maal.kolonne > spilTilstand.maxKolonne) {
        spilTilstand.maxKolonne = maal.kolonne;
    }

    haandterAnkomstPaaFelt(maal.indeks, options.kilde, {
        startLog: options.startLog
    });
    return true;
}

export function udfoerTeleport() {
    return udfoerTeleportMedOptions({
        kilde: 'stav',
        kraeverStav: true,
        startLog: "Staven flytter dig fire felter mod øst."
    });
}

export function udfoerPortalTeleport() {
    return udfoerTeleportMedOptions({
        kilde: 'portal',
        startLog: "Portalen flytter dig fire felter mod øst."
    });
}

export function hvil() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    const vildmark = ['eng', 'skov', 'mark', 'bjerg', 'hoejland' ];
    
    if (!felt || !vildmark.includes(felt.biome as string)) {
        spilTilstand.logBesked = "Miljøet er uegnet til at slå lejr i.";
        return;
    }
    
    const harSovepose = spilTilstand.mitUdstyr?.some(ting => ting.id === 'sovepose');
    if (!harSovepose) {
        spilTilstand.logBesked = "Du mangler en sovepose for at slå lejr.";
        return;
    }

    if ((spilTilstand.nuvaerendeEnergi || 0) >= spilTilstand.valgtKarakter.baseEnergi) {
        spilTilstand.logBesked = "Du er allerede udhvilet.";
        return;
    }

    spilTilstand.livspoint = Math.min(spilTilstand.maxLivspoint, spilTilstand.livspoint + 20); 
    
    spilTilstand.nuvaerendeEnergi = 0;
    
    spilTilstand.logBesked = "Du hviler i soveposen. Du får 20 HP, og tiden går.";
    
    fremrykTid();
    syncTilDb(); // Soveposen ændrer intet i landskabet. Drop (true).
}

export function aktiverHemmelighed() {
    const kort = spilTilstand.mitUdstyr.find(i => i.id === 'hemmelighed');
    if (!kort || kort.maengde <= 0) return;

    brugFraRygsæk('hemmelighed', 1);

    const klynge = spilTilstand.gitter.reduce((acc, felt, idx) => {
        if (felt.isSkatteKlynge) acc.push(idx);
        return acc;
    }, [] as number[]);

    if (klynge.length > 0) {
        const nyeFelter = new Set(spilTilstand.mineKendteFelter);
        klynge.forEach(idx => nyeFelter.add(idx));
        spilTilstand.mineKendteFelter = Array.from(nyeFelter);

        tilfoejTilRygsæk('skattekort_aabent', 1);
        
        spilTilstand.kameraFokus = klynge[Math.floor(klynge.length / 2)];
        
        spilTilstand.logBesked = "Du læser skattekortet. En klynge felter bliver synlig.";
    } else {
        spilTilstand.logBesked = "Kortet viser ikke noget brugbart.";
    }
    
    spilTilstand.gitter = [...spilTilstand.gitter];
    syncTilDb(); // Du ruller et kort ud. Kun dig og din rygsæk er involveret. Drop (true).
}

function harUdstyr(genstandId: string) {
    return spilTilstand.mitUdstyr?.some(ting => ting.id === genstandId && ting.maengde > 0) ?? false;
}

function erTyveklasse() {
    const id = spilTilstand.valgtKarakter?.id;
    return id === 'thief_m' || id === 'thief_f';
}

function erTungKrigerklasse() {
    const id = spilTilstand.valgtKarakter?.id;
    return id === 'orc_m' || id === 'orc_f' || id === 'viking_m' || id === 'viking_f' || id === 'knight_m' || id === 'knight_f';
}

export function kanBegaaIndbrudPaaFelt(felt: Felt | null | undefined) {
    if (!felt || felt.indbrudt) return false;
    if (felt.biome !== 'by') return false;
    return !felt.shopItems || felt.shopItems.length === 0;
}

function erHunter() {
    const id = spilTilstand.valgtKarakter?.id;
    return id === 'hunter_m' || id === 'hunter_f';
}

export function hentMuligeTrackerMaal() {
    if (!erHunter() || spilTilstand.gameState !== 'play') return [] as string[];

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    if (mig?.aktivTracker && mig.aktivTracker.slutterDag >= spilTilstand.dag) return [];

    const trackede = new Set(mig?.trackedeSpillere || []);

    return Object.entries(spilTilstand.alleSpillere)
        .filter(([navn, spiller]) => {
            if (navn === spilTilstand.spillerNavn) return false;
            if (trackede.has(navn)) return false;
            if (spiller.isDead || spiller.isWinner) return false;
            return spiller.index === spilTilstand.spillerIndex;
        })
        .map(([navn]) => navn);
}

export function erTrackerAktivPaa(navn: string) {
    const tracker = spilTilstand.alleSpillere[spilTilstand.spillerNavn]?.aktivTracker;
    return !!tracker && tracker.targetNavn === navn && tracker.slutterDag >= spilTilstand.dag;
}

export function saetTracker(targetNavn: string) {
    if (!erHunter()) {
        spilTilstand.logBesked = 'Kun jægere kan sætte en tracker.';
        return;
    }

    const target = spilTilstand.alleSpillere[targetNavn];
    if (!target || target.index !== spilTilstand.spillerIndex || target.isDead || target.isWinner) {
        spilTilstand.logBesked = 'Du skal stå på samme felt som spilleren for at sætte en tracker.';
        return;
    }

    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn] || {};
    const trackede = mig.trackedeSpillere || [];
    if (mig.aktivTracker && mig.aktivTracker.slutterDag >= spilTilstand.dag) {
        spilTilstand.logBesked = `Du følger allerede ${mig.aktivTracker.targetNavn}s spor.`;
        return;
    }

    if (trackede.includes(targetNavn)) {
        spilTilstand.logBesked = `Du har allerede fulgt ${targetNavn}s spor på denne ø.`;
        return;
    }

    spilTilstand.alleSpillere[spilTilstand.spillerNavn] = {
        ...mig,
        index: spilTilstand.spillerIndex,
        kolonne: spilTilstand.maxKolonne,
        hp: spilTilstand.livspoint,
        guld: spilTilstand.guldTotal,
        isDead: false,
        isWinner: false,
        score: spilTilstand.samletScore,
        retning: spilTilstand.retning,
        turNummer: mig.turNummer || 0,
        aktivTracker: {
            targetNavn,
            slutterDag: spilTilstand.dag + 10
        },
        trackedeSpillere: [...trackede, targetNavn]
    };

    opdaterTrackerSyn();
    spilTilstand.logBesked = `Du sætter en tracker på ${targetNavn}. I ti dage kan du følge sporene.`;
    syncTilDb();
}

export function opdaterTrackerSyn() {
    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    const tracker = mig?.aktivTracker;
    if (!tracker || tracker.slutterDag < spilTilstand.dag) {
        if (tracker && mig) {
            spilTilstand.alleSpillere[spilTilstand.spillerNavn] = { ...mig, aktivTracker: null };
            syncTilDb();
        }
        return false;
    }

    const target = spilTilstand.alleSpillere[tracker.targetNavn];
    const felter = new Set(target?.kendteFelter || []);
    if (typeof target?.index === 'number') {
        felter.add(target.index);
    }
    if (felter.size === 0) return false;

    const kendte = new Set(spilTilstand.mineKendteFelter);
    let aendret = false;
    for (const felt of felter) {
        if (!kendte.has(felt)) {
            kendte.add(felt);
            aendret = true;
        }
    }

    if (aendret) {
        spilTilstand.mineKendteFelter = Array.from(kendte);
        syncTilDb();
    }

    return aendret;
}

export function begaaIndbrud() {
    if (!spilTilstand.valgtKarakter || spilTilstand.erBevidstløs) return;

    const indeks = spilTilstand.spillerIndex;
    const felt = spilTilstand.gitter[indeks];

    if (!harUdstyr('dirk')) {
        spilTilstand.logBesked = "Du mangler en dirk.";
        return;
    }

    if (!kanBegaaIndbrudPaaFelt(felt)) {
        spilTilstand.logBesked = "Dirken kan kun bruges på tomme byfelter.";
        return;
    }

    const energiPris = Math.ceil(spilTilstand.valgtKarakter.baseEnergi / 2);
    const udbytte = 35 + Math.floor(Math.random() * 16);
    const opdagelsesChance = erTyveklasse() ? 0.1 : erTungKrigerklasse() ? 0.45 : 0.25;
    const opdaget = Math.random() < opdagelsesChance;

    spilTilstand.nuvaerendeEnergi -= energiPris;
    felt.indbrudt = true;
    spilTilstand.guldTotal += udbytte;
    spilTilstand.gitter[indeks] = { ...felt };

    if (opdaget) {
        const grundSkade = erTungKrigerklasse() ? 16 : 22;
        tagSkadeOgTjekDød(
            grundSkade,
            `Du begår indbrud og finder ${udbytte} guld. Det koster ${energiPris} energi. Du bliver opdaget og får tæv.`,
            "Vagterne slog dig ihjel."
        );
    } else {
        spilTilstand.logBesked = `Du begår indbrud og finder ${udbytte} guld. Det koster ${energiPris} energi. Ingen når at stoppe dig.`;
    }

    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(indeks, spilTilstand.gitter[indeks]);
    syncKortTilDbSenere();

    if (spilTilstand.gameState !== 'dead_map' && spilTilstand.gameState !== 'dead' && spilTilstand.gameState !== 'win_map') {
        fremrykTid();
    }

    syncTilDb();
}

function findMuligeBaadFelter() {
    const kystFelter = new Set<number>();
    for (let r = 1; r < HOEJDE - 1; r++) {
        const landIndeks = r * BREDDE + (BREDDE - 2);
        const vandIndeks = r * BREDDE + (BREDDE - 1);
        if (
            spilTilstand.gitter[landIndeks]?.biome !== 'hav' &&
            spilTilstand.gitter[vandIndeks]?.biome === 'hav'
        ) {
            kystFelter.add(vandIndeks);
        }
    }

    if (kystFelter.size === 0) {
        for (let indeks = 0; indeks < spilTilstand.gitter.length; indeks++) {
            const felt = spilTilstand.gitter[indeks];
            const kolonne = indeks % BREDDE;
            if (kolonne < BREDDE * 0.75 || felt?.biome !== 'hav') continue;

            const naboLand = hentNaboIndices(indeks).some((naboIndeks) => spilTilstand.gitter[naboIndeks]?.biome !== 'hav');
            if (naboLand) kystFelter.add(indeks);
        }
    }

    return Array.from(kystFelter);
}

function placerFlugtBaade(antalBaade = 3) {
    const kystFelter = findMuligeBaadFelter();
    if (kystFelter.length === 0) return [];

    for (let i = kystFelter.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kystFelter[i], kystFelter[j]] = [kystFelter[j], kystFelter[i]];
    }

    const valgte = kystFelter.slice(0, Math.min(antalBaade, kystFelter.length));
    for (const indeks of valgte) {
        spilTilstand.gitter[indeks].hasBoat = true;
    }

    return valgte;
}

function findEllerSkabBaad() {
    const eksisterendeBaade = spilTilstand.gitter
        .map((felt, index) => ({ felt, index }))
        .filter(({ felt }) => felt.hasBoat);

    if (eksisterendeBaade.length > 0) {
        return eksisterendeBaade[Math.floor(Math.random() * eksisterendeBaade.length)].index;
    }

    const nyeBaade = placerFlugtBaade(1);
    return nyeBaade[0] ?? null;
}

export function lysBaadForAlle() {
    const baadIndex = findEllerSkabBaad();
    if (baadIndex === null) {
        return 'Lyset rammer havet, men finder ingen båd.';
    }

    const kendteFelter = new Set(spilTilstand.mineKendteFelter);
    kendteFelter.add(baadIndex);
    spilTilstand.mineKendteFelter = Array.from(kendteFelter);

    for (const spiller of Object.values(spilTilstand.alleSpillere)) {
        const spillerKendte = new Set(spiller.kendteFelter || []);
        spillerKendte.add(baadIndex);
        spiller.kendteFelter = Array.from(spillerKendte);
    }

    spilTilstand.kameraFokus = baadIndex;
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(baadIndex, spilTilstand.gitter[baadIndex]);
    syncTilDb();
    syncKortTilDbSenere();

    return 'Lyset finder en båd mod øst. Alle på øen kan se den nu.';
}

export function holdTaagenTilbage(antalDage: number) {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!felt) return;

    felt.taagenHoldtTilDag = Math.max(felt.taagenHoldtTilDag || 0, (spilTilstand.dag || 1) + antalDage);
    spilTilstand.gitter[spilTilstand.spillerIndex] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(spilTilstand.spillerIndex, spilTilstand.gitter[spilTilstand.spillerIndex]);
    syncTilDb();
    syncKortTilDbSenere();
}

export function opretTaageblokker() {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (!felt) return;

    felt.taageBlokker = true;
    spilTilstand.gitter[spilTilstand.spillerIndex] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(spilTilstand.spillerIndex, spilTilstand.gitter[spilTilstand.spillerIndex]);
    syncTilDb();
    syncKortTilDbSenere();
}

export function plantSkat(gitter: Felt[]) {
    gitter.forEach(f => {
        f.isSkatteKlynge = false;
        f.tomSkattekiste = false;
    });

    const muligeCentre: number[] = [];
    const minKol = Math.floor(BREDDE * 0.50);
    const maxKol = Math.floor(BREDDE * 0.75);

    for (let i = 0; i < gitter.length; i++) {
        const kol = i % BREDDE;
        if (kol >= minKol && kol <= maxKol) {
            const naboer = hentNaboIndices(i);
            if (naboer.length === 6) {
                const alleGyldige = [i, ...naboer].every(idx => {
                    const felt = gitter[idx];
                    return felt.kanGraves && felt.biome !== 'hav' && felt.biome !== 'by' && felt.biome !== 'marked' && felt.biome !== 'meteor' && !felt.hasPortal && !felt.eventID;
                });
                if (alleGyldige) {
                    muligeCentre.push(i);
                }
            }
        }
    }

    if (muligeCentre.length > 0) {
        const center = muligeCentre[Math.floor(Math.random() * muligeCentre.length)];
        const klynge = [center, ...hentNaboIndices(center)];
        const skatteFelt = klynge[Math.floor(Math.random() * klynge.length)];
        
        klynge.forEach(idx => {
            gitter[idx].isSkatteKlynge = true;
            if (idx === skatteFelt) {
                gitter[idx].skjultLoot = 'skattekiste';
                gitter[idx].skjultFaelde = false;
                gitter[idx].skjultGuld = 0;
                gitter[idx].skjultLiv = 0;
            } else {
                gitter[idx].skjultFaelde = true;
                gitter[idx].skjultLoot = null;
                gitter[idx].skjultGuld = 0;
                gitter[idx].skjultLiv = 0;
            }
        });
    }
}

export function initialiserGitter() {
    const antal = BREDDE * HOEJDE;
    const totalVaegt = biomeVægte.reduce((sum, biome) => sum + biome.vaegt, 0);

    let raaKort = Array(antal).fill('').map((_, indeks) => {
        const raekke = Math.floor(indeks / BREDDE);
        const kolonne = indeks % BREDDE;
        if (raekke === 0 || raekke === HOEJDE - 1 || kolonne === 0 || kolonne === BREDDE - 1) return 'hav';
        
        let terningKast = Math.random() * totalVaegt;
        for (const biome of biomeVægte) {
            if (terningKast < biome.vaegt) return biome.id;
            terningKast -= biome.vaegt;
        }
        return 'mark';
    });

    for (let omgang = 0; omgang < 3; omgang++) {
        const nytKort = [...raaKort];
        for (let indeks = 0; indeks < antal; indeks++) {
            const raekke = Math.floor(indeks / BREDDE);
            const kolonne = indeks % BREDDE;
            if (raekke === 0 || raekke === HOEJDE - 1 || kolonne === 0 || kolonne === BREDDE - 1) continue;
            
            const naboer = hentNaboIndices(indeks);
            if (Math.random() < 0.7) {
                const tilfaeldigNabo = raaKort[naboer[Math.floor(Math.random() * naboer.length)]];
                const erSjaelden = ['hule', 'ritual', 'ruin', 'bandit'].includes(tilfaeldigNabo);
                if (!erSjaelden || Math.random() < 0.1) nytKort[indeks] = tilfaeldigNabo;
            }
        }
        raaKort = nytKort;
    }

    const bySementer = Math.floor(antal / 400);
    const markedSementer = Math.floor(antal / 200);

    function spredBiome(startIndeks: number, type: 'by' | 'marked', maxStr: number) {
        const aabne = [startIndeks];
        const lukkede = new Set<number>();
        let bygget = 0;

        while (aabne.length > 0 && bygget < maxStr) {
            const nu = aabne.shift()!;
            if (lukkede.has(nu)) continue;
            lukkede.add(nu);

            const raekke = Math.floor(nu / BREDDE);
            const kolonne = nu % BREDDE;
            
            if (raekke === 0 || raekke === HOEJDE - 1 || kolonne === 0 || kolonne === BREDDE - 1) continue;
            if (raaKort[nu] === 'hav') continue;

            raaKort[nu] = type;
            bygget++;

            const naboer = hentNaboIndices(nu).sort(() => Math.random() - 0.5);
            aabne.push(...naboer);
        }
    }

    for (let i = 0; i < bySementer; i++) {
        const seed = Math.floor(Math.random() * antal);
        const tilfaeldigByStoerrelse = Math.floor(Math.random() * 6) + 5; 
        spredBiome(seed, 'by', tilfaeldigByStoerrelse);
    }
    
    for (let i = 0; i < markedSementer; i++) {
        const seed = Math.floor(Math.random() * antal);
        const tilfaeldigMarkedStoerrelse = Math.floor(Math.random() * 5) + 1; 
        spredBiome(seed, 'marked', tilfaeldigMarkedStoerrelse);
    }

    const nytGitter: Felt[] = Array(antal).fill(null).map((_, indeks) => {
        const biome = raaKort[indeks];
        const hemmeligheder = genererUndergrund(biome);
        return {
            guld: 0,
            gravet: false,
            udforsket: false,
            eventFuldført: false,
            biome: biome,
            ...hemmeligheder
        };
    });

    let ledigeEvents = Object.keys(eventBibliotek).filter((noegle) => !eventBibliotek[noegle].erSubTrin && noegle !== 'campfire');
    
    const eventForbrug = new Map<string, number>();
    ledigeEvents.forEach(e => eventForbrug.set(e, 0));

    const eventChancer: Record<string, number> = {
        'hule': 0.50, 'ritual': 0.90, 'ruin': 0.50, 'bandit': 0.10, 'krystal': 0.02,
        'blodskov': 0.02, 'slagmark': 0.02, 'by': 0.02, 'marked': 0.02, 'hoejland': 0.01,
        'hav': 0.005, 'bjerg': 0.01, 'skov': 0.01, 'eng': 0.01, 'mark': 0.01
    };

    const tilfaeldigeFelter = Array.from({length: antal}, (_, i) => i).sort((a, b) => {
        const kolA = a % BREDDE;
        const kolB = b % BREDDE;
        if (kolA !== kolB) return kolB - kolA;
        return Math.random() - 0.5;
    });

    for (const indeks of tilfaeldigeFelter) {
        const felt = nytGitter[indeks];
        if (felt.eventID) continue;

        const pauseEvents = false; 
        const chance = pauseEvents ? 0 : (eventChancer[felt.biome as string] || 0.05);

        if (Math.random() < chance) {
            const matchendeEvents = ledigeEvents.filter(noegle => {
                const event = eventBibliotek[noegle];
                const kolonne = indeks % BREDDE;
                const kolonnePct = kolonne / Math.max(1, BREDDE - 1);

                if (event.minKolonnePct !== undefined && kolonnePct < event.minKolonnePct) return false;
                if (event.maxKolonnePct !== undefined && kolonnePct > event.maxKolonnePct) return false;

                const kraevetBiome = event.biome;
                if (felt.biome === 'hav') return Array.isArray(kraevetBiome) && kraevetBiome.includes('hav');
                return Array.isArray(kraevetBiome)
                    ? (kraevetBiome as string[]).includes(felt.biome as string) || (kraevetBiome as string[]).includes('alle')
                    : kraevetBiome === felt.biome || kraevetBiome === 'alle' || kraevetBiome === 'any' || !kraevetBiome;
            });

            if (matchendeEvents.length > 0) {
                const minBrugt = Math.min(...matchendeEvents.map(e => eventForbrug.get(e) || 0));
                const mulige = matchendeEvents.filter(e => (eventForbrug.get(e) || 0) === minBrugt);
                const valgtEvent = mulige[Math.floor(Math.random() * mulige.length)];
                felt.eventID = valgtEvent;

                if (eventBibliotek[valgtEvent].unik) {
                    ledigeEvents = ledigeEvents.filter(e => e !== valgtEvent);
                    eventForbrug.delete(valgtEvent);
                } else {
                    eventForbrug.set(valgtEvent, (eventForbrug.get(valgtEvent) || 0) + 1);
                }
            }
        }
    }

    const vildmark = ['eng', 'skov', 'mark', 'bjerg'];

    for (let indeks = 0; indeks < antal; indeks++) {
        const felt = nytGitter[indeks];
        
        if (felt.biome !== 'hav' && felt.biome !== 'by' && felt.biome !== 'marked' && !felt.eventID && Math.random() < 0.005) {
            felt.hasPortal = true;
        }

        if (felt.biome === 'hav' || felt.eventID) continue;

        if (felt.biome === 'bjerg' && Math.random() < 0.04) {
            felt.hasGoldmine = true;
        } else if (vildmark.includes(felt.biome as string) && Math.random() < 0.008) {
            felt.isCampfire = true;
            felt.eventID = 'campfire';
        } else if ((felt.biome === 'by' || felt.biome === 'marked') && !felt.hasPortal) {
            if (Math.random() < 0.6) {
                const antalVarer = felt.biome === 'by' ? 2 : 1;
                const pulje = felt.biome === 'marked' 
                    ? markedVarePool 
                    : Object.keys(itemDB).filter(k => itemDB[k].pris > 0 && itemDB[k].type !== 'forbandelse' && itemDB[k].type !== 'skat');                
                const valgte: string[] = [];
                for(let j=0; j < antalVarer; j++) {
                    const vare = pulje[Math.floor(Math.random() * pulje.length)];
                    if (!valgte.includes(vare)) valgte.push(vare);
                }
                felt.shopItems = valgte;
            }
        }
    }

    for (let indeks = 0; indeks < antal; indeks++) {
        const felt = nytGitter[indeks];
        if (felt.biome !== 'mark') continue;

        const naboer = hentNaboIndices(indeks);
        let hvedeCount = 0;
        let boenneCount = 0;

        for (const naboIdx of naboer) {
            const naboFelt = nytGitter[naboIdx];
            if (naboFelt && naboFelt.afgroede === 'hvede') hvedeCount++;
            if (naboFelt && naboFelt.afgroede === 'boenner') boenneCount++;
        }

        if (hvedeCount > boenneCount) felt.afgroede = 'hvede';
        else if (boenneCount > hvedeCount) felt.afgroede = 'boenner';
        else felt.afgroede = Math.random() < 0.5 ? 'hvede' : 'boenner';
    }

    plantSkat(nytGitter);

    for (let i = 0; i < antal; i++) {
        nytGitter[i].grundBiome = nytGitter[i].biome;
        nytGitter[i].grundEvent = nytGitter[i].eventID;
    }

    spilTilstand.gitter = nytGitter;
    const muligeStartFelter = [];
    for (let raekke = 1; raekke < HOEJDE - 1; raekke++) {
        if (spilTilstand.gitter[raekke * BREDDE + 1].biome !== 'hav') muligeStartFelter.push(raekke * BREDDE + 1);
    }
    
    spilTilstand.retning = 'E';
    spilTilstand.spillerIndex = muligeStartFelter[Math.floor(Math.random() * muligeStartFelter.length)];
    
    afslørOmraade(spilTilstand.spillerIndex);
    delNyeKort();
}

export function tjekMiljoeSlitage(biome: string): string {
    const logBeskeder: string[] = [];
    let mistetFintToej = 0;

    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter(vare => {
        if (biome === 'hav') {
            if (vare.id === 'rustning') {
                logBeskeder.push("Rustningen er for tung i vandet. Du mister den.");
                return false;
            }
            if (vare.id === 'fakkel') {
                logBeskeder.push("Vandet slukker din fakkel.");
                return false;
            }
        } else if (biome === 'hule') {
            if (vare.id === 'flot_toej') {
                mistetFintToej += vare.maengde;
                logBeskeder.push("Hulen ødelægger dit fine tøj. Du får klude tilbage.");
                return false;
            }
            if (vare.id === 'sovepose') {
                logBeskeder.push("Fugten ødelægger din sovepose.");
                return false;
            }
        } else if (biome === 'blodskov') {
            if (vare.id === 'flot_toej') {
                mistetFintToej += vare.maengde;
                logBeskeder.push("Tornene ødelægger dit fine tøj.");
                return false;
            }
        } else if (biome === 'krystal') {
            if (vare.id === 'metaldetektor') {
                logBeskeder.push("Krystallerne ødelægger din metaldetektor.");
                return false;
            }
            if (vare.id === 'kikkert_250' || vare.id === 'kikkert_45') {
                logBeskeder.push("Krystallerne ødelægger kikkertens linser.");
                return false;
            }
        } else if (biome === 'ruin') {
            if (vare.id === 'mad') {
                logBeskeder.push("Skadedyrene i ruinen stjæler din mad.");
                return false;
            }
        } else if (biome === 'ritual') {
            if (vare.id === 'soegekvist') {
                logBeskeder.push("Ritualpladsen ødelægger din søgekvist.");
                return false;
            }
        }
        return true;
    });

    if (mistetFintToej > 0) {
        const klude = spilTilstand.mitUdstyr.find(i => i.id === 'klude');
        if (klude) {
            klude.maengde += mistetFintToej;
        } else {
            spilTilstand.mitUdstyr.push({ id: 'klude', maengde: mistetFintToej });
        }
    }

    return logBeskeder.length > 0 ? " " + logBeskeder.join(" ") : "";
}

export async function sendBaalSignal(centerIndex: number, radius: number) {
    if (spilTilstand.offlineMode) return;
    if (!spilTilstand.rumKode) return;
    void supabase.channel(spilTilstand.rumKode).send({
        type: 'broadcast',
        event: 'baal',
        payload: { centerIndex, radius }
    }).catch((error) => console.warn('Bålsignal kunne ikke sendes', error));
}

export function taendBaal() {
    if (spilTilstand.erBevidstløs || !spilTilstand.valgtKarakter) return;
    
    const fakkel = spilTilstand.mitUdstyr.find(i => i.id === 'fakkel');
    if (!fakkel || fakkel.maengde <= 0) return;

    brugFraRygsæk('fakkel', 1);

    const radius = Math.max(1, spilTilstand.valgtKarakter.synsRadius + spilTilstand.rygsækEffekt.syn) + 2;
    afslørOmraade(spilTilstand.spillerIndex, radius);
    
    spilTilstand.logBesked = "Du tænder et stort bål. Området omkring dig bliver synligt for alle.";
    
    sendBaalSignal(spilTilstand.spillerIndex, radius);
    fremrykTid();
    syncTilDb(); // Tænder bål og rykker tid. Gør intet ved grundkortet. Drop (true).
}

export function bygOgHopGennemPortal() {
    return udfoerTeleportMedOptions({
        kilde: 'byg_portal',
        opretPortalVedStart: true,
        startLog: "Der opstår en portal bag dig. Du flyttes fire felter mod øst."
    });
}

export async function udloesNaturkatastrofe(centerIndex: number) {
    rystSkaerm(1200);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.60) paavirkede.add(r1);
    }

    const lukkedeFelter = new Set([centerIndex, ...ring1]);
    const inficeredeRing1 = Array.from(paavirkede).filter(i => i !== centerIndex);

    for (const inficeret of inficeredeRing1) {
        const ring2 = hentNaboIndices(inficeret);
        for (const r2 of ring2) {
            if (!lukkedeFelter.has(r2) && Math.random() < 0.30) {
                paavirkede.add(r2);
            }
        }
    }

    const paavirkedeArray = Array.from(paavirkede);
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = 'meteor';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = 'meteor_skat';
        felter[idx].eventFuldført = false;
        felter[idx].hasMeteorStone = true;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        tagSkadeOgTjekDød(30, "Meteoren rammer dit felt. (-30 HP)", "Nedslaget dræbte dig.");
    }

    syncTilDb(true); // Massiv meteor der smadrer tyve felter permanent. Her skal databasen æde det hele.
}

export async function udloesJordskaelv(centerIndex: number) {
    rystSkaerm(2000);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.70) paavirkede.add(r1);
    }

    const lukkedeFelter = new Set([centerIndex, ...ring1]);
    const inficeredeRing1 = Array.from(paavirkede).filter(i => i !== centerIndex);

    for (const inficeret of inficeredeRing1) {
        const ring2 = hentNaboIndices(inficeret);
        for (const r2 of ring2) {
            if (!lukkedeFelter.has(r2) && Math.random() < 0.40) {
                paavirkede.add(r2);
            }
        }
    }

    const paavirkedeArray = Array.from(paavirkede);
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        if (felter[idx].biome === 'hav') continue; 
        
        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = Math.random() < 0.2 ? 'ruin' : 'bjerg';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = undefined;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        tagSkadeOgTjekDød(40, "Jorden brød op under dig. (-40 HP)", "Jordskælvet dræbte dig.");
    }

    syncTilDb(true); // Landskab skifter fuldstændig. Æd data.
}

function fjernUdstyrVedOversvoemmelse() {
    let mistedeRustning = false;
    let mistedeFakkel = false;

    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter((ting) => {
        if (ting.id === 'rustning') {
            mistedeRustning = true;
            return false;
        }
        if (ting.id === 'fakkel') {
            mistedeFakkel = true;
            return false;
        }
        return true;
    });

    return { mistedeRustning, mistedeFakkel };
}

export async function udloesOversvoemmelse(centerIndex: number) {
    rystSkaerm(1500);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.85) paavirkede.add(r1);
    }

    const lukkedeFelter = new Set([centerIndex, ...ring1]);
    const inficeredeRing1 = Array.from(paavirkede).filter(i => i !== centerIndex);

    for (const inficeret of inficeredeRing1) {
        const ring2 = hentNaboIndices(inficeret);
        for (const r2 of ring2) {
            if (!lukkedeFelter.has(r2) && Math.random() < 0.50) {
                paavirkede.add(r2);
            }
        }
    }

    const paavirkedeArray = Array.from(paavirkede);
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = 'hav';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = undefined;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    if (paavirkedeArray.includes(spilTilstand.spillerIndex)) {
        const { mistedeRustning, mistedeFakkel } = fjernUdstyrVedOversvoemmelse();
        const udstyrsLog = [
            mistedeFakkel ? "Vandet slukker din fakkel." : "",
            mistedeRustning ? "Du mister din rustning i vandet." : ""
        ].filter(Boolean).join(" ");

        if (mistedeRustning) {
            tagSkadeOgTjekDød(80, `Oversvømmelsen rammer dig hårdt. ${udstyrsLog}`.trim(), "Du druknede i oversvømmelsen.");
        } else {
            tagSkadeOgTjekDød(30, `Oversvømmelsen rammer dit felt. ${udstyrsLog}`.trim(), "Du druknede i oversvømmelsen.");
        }
    }

    syncTilDb(true); // Bjerge ændres til hav. Enorm opdatering.
}

export async function udloesDoedeSlagmark(centerIndex: number) {
    rystSkaerm(1500);

    const felter = spilTilstand.gitter;
    const paavirkede = new Set<number>();

    paavirkede.add(centerIndex);

    const ring1 = hentNaboIndices(centerIndex);
    for (const r1 of ring1) {
        if (Math.random() < 0.80) paavirkede.add(r1);
    }

    const paavirkedeArray = Array.from(paavirkede);
    const fraBiomer = new Map<number, string | Biome>();

    for (const idx of paavirkedeArray) {
        if (felter[idx].biome === 'hav') continue;

        fraBiomer.set(idx, felter[idx].biome);
        felter[idx].biome = 'slagmark';
        felter[idx].hasGoldmine = false;
        felter[idx].hasBoat = false;
        felter[idx].boatCount = undefined;
        felter[idx].afgroede = undefined;
        felter[idx].shopItems = undefined;
        felter[idx].eventID = undefined;
        felter[idx].eventFuldført = false;

        if (!spilTilstand.mineKendteFelter.includes(idx)) {
            spilTilstand.mineKendteFelter.push(idx);
        }
    }

    spilTilstand.gitter = [...felter];
    animerKatastrofeFelter(centerIndex, fraBiomer);
    broadcastFelter(paavirkedeArray.map((index) => ({ index, feltData: felter[index] })));

    syncTilDb(true);
}

export function udloesInsektPlage(centerIndex: number) {
    const blok = hentAfgroedeBlok(spilTilstand.dag);
    const felt = spilTilstand.gitter[centerIndex];
    if (!felt) return 0;

    felt.insektPlageBlok = blok;
    spilTilstand.gitter[centerIndex] = { ...felt };
    spilTilstand.gitter = [...spilTilstand.gitter];
    broadcastFelt(centerIndex, spilTilstand.gitter[centerIndex]);
    syncTilDb();
    syncKortTilDbSenere();

    const hvedeBlok = erHvedeBlok(blok);
    return spilTilstand.gitter.filter((markFelt) => {
        const erModen = (markFelt.afgroede === 'hvede' && hvedeBlok) || (markFelt.afgroede === 'boenner' && !hvedeBlok);
        const erSmadret = markFelt.smadretFremTilBlok !== undefined && blok <= markFelt.smadretFremTilBlok;
        const erHoestet = markFelt.hoestetFremTilBlok !== undefined && blok <= markFelt.hoestetFremTilBlok;
        return markFelt.biome === 'mark' && erModen && !erSmadret && !erHoestet;
    }).length;
}

export function udvindMeteorSkat(metode: string): { logBesked: string; hpNed?: number; guldOp?: number; itemUd?: string } {
    const pris = spilTilstand.valgtKarakter ? spilTilstand.valgtKarakter.baseEnergi * 2 : 10;
    spilTilstand.nuvaerendeEnergi -= pris;
    
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    felt.hasMeteorStone = false;
    broadcastFelt(spilTilstand.spillerIndex, felt);
    
    if (metode === 'haender') {
        return {
            logBesked: `Du får noget af guldet fri af stenen.`,
            hpNed: 20,
            guldOp: 150
        };
    } else {
        return {
            logBesked: `Værktøjet går tabt, men du får stenen åbnet.`,
            guldOp: 300,
            itemUd: 'diamant' 
        };
    }
}

export function nulstilKort() {
    spilTilstand.gitter.forEach(felt => {
        felt.gravet = false;
        felt.eventFuldført = false;
        felt.hasBoat = false;
        felt.boatCount = undefined;
        felt.smadretFremTilBlok = undefined;
        felt.hoestetFremTilBlok = undefined;
        felt.insektPlageBlok = undefined;
        felt.indbrudt = undefined;
        felt.mineOwner = undefined;
        felt.mineLocked = undefined;
        felt.hasMeteorStone = false;
        felt.taagenHoldtTilDag = undefined;
        felt.taageBlokker = undefined;

        if (felt.grundBiome) {
            felt.biome = felt.grundBiome;
            felt.eventID = felt.grundEvent;
            
            const hemmeligheder = genererUndergrund(felt.grundBiome as string);
            felt.skjultGuld = hemmeligheder.skjultGuld;
            felt.skjultLiv = hemmeligheder.skjultLiv;
            felt.skjultFaelde = hemmeligheder.skjultFaelde;
            felt.skjultLoot = hemmeligheder.skjultLoot;
        }
    });

    plantSkat(spilTilstand.gitter);
}
