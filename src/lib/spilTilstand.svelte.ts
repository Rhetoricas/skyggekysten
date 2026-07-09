import type { Felt, Karakter, SpillerData, RygsækTing } from './types';
import { itemDB } from './spildata';
import { STANDARD_KORT_BREDDE, STANDARD_KORT_HOEJDE } from './kortDimensioner';
import type { TrofaeId, TrofaeStats } from './trofaeer';
import { tekst } from './i18n.svelte';

interface FlydendeTal {
    id: number;
    tekst: string;
    type: string;
    feltIndex: number;
    offsetX: number;
    offsetY: number;
}

interface EnergiKugle {
    id: number;
    feltIndex: number;
    tilFeltIndex?: number;
    offsetX: number;
    offsetY: number;
    delay: number;
    ruteAndel: number;
}

interface EnergiForbrugTal {
    id: number;
    feltIndex: number;
    tilFeltIndex?: number;
    antal: number;
}

export const spilTilstand = $state({
    spillerNavn: '',
    rumKode: '',
    rundeSeed: '',
    gameMode: 'open' as 'open' | 'offline' | 'tutorial',
    offlineMode: false,
    erHost: false,
    gameState: 'start' as 'start' | 'select' | 'play' | 'dead' | 'dead_map' | 'win' | 'win_map',
    doedsAarsag: null as 'vand' | 'taage' | null,
    gitter: [] as Felt[],
    kortBredde: STANDARD_KORT_BREDDE,
    kortHoejde: STANDARD_KORT_HOEJDE,
    devVisHeleKort: false,
    spillerIndex: 0,
    
    kameraFokus: null as number | null,

    maxLivspoint: 100,
    _livspoint: 100,
    get livspoint(): number { return this._livspoint; },
    set livspoint(v: number) { this._livspoint = Math.max(0, Math.min(this.maxLivspoint, v)); },
    
    _guldTotal: 0,
    get guldTotal(): number { return this._guldTotal; },
    set guldTotal(v: number) { this._guldTotal = Math.max(0, Math.round(v)); },
    
    valgtKarakter: null as Karakter | null,

    get rygsækEffekt() {
        const effekt = (this.mitUdstyr || []).reduce((acc: { move: number; dmg: number; syn: number; energi: number; gold: number }, slot: RygsækTing) => {
            const info = itemDB[slot.id];
            if (!info || slot.maengde <= 0) return acc;
            if (slot.id === 'fakkel' || slot.id === 'solfakkel') return acc;
            const erRidderIRustning = (this.valgtKarakter?.id === 'knight_m' || this.valgtKarakter?.id === 'knight_f') && (slot.id === 'rustning' || slot.id === 'kongepanser');
            return {
                move: acc.move + (erRidderIRustning ? 0 : (info.moveMod || 0)),
                dmg: acc.dmg + (info.dmgMod || 0),
                syn: acc.syn + (info.synsMod || 0),
                energi: acc.energi + (info.energiMod || 0),
                gold: acc.gold + (info.goldMod || 0)
            };
        }, { move: 0, dmg: 0, syn: 0, energi: 0, gold: 0 });

        const fakkelSyn = (this.mitUdstyr || []).reduce((bedste: number, slot: RygsækTing) => {
            if (slot.maengde <= 0 || (slot.id !== 'fakkel' && slot.id !== 'solfakkel')) return bedste;
            return Math.max(bedste, itemDB[slot.id]?.synsMod || 0);
        }, 0);

        return { ...effekt, syn: effekt.syn + fakkelSyn };
    },

    get maxEnergi(): number { return (this.valgtKarakter?.baseEnergi || 10) + this.rygsækEffekt.energi; },
    _nuvaerendeEnergi: 10,
    get nuvaerendeEnergi(): number { return this._nuvaerendeEnergi; },
    set nuvaerendeEnergi(v: number) { this._nuvaerendeEnergi = Math.min(this.maxEnergi, v); },

    beregnSkade(skade: number) {
        if (skade <= 0) return 0;
        const base = this.valgtKarakter?.dmgMod ?? 1.0;
        const multiplikator = Math.max(0, base + this.rygsækEffekt.dmg);
        return Math.ceil(skade * multiplikator);
    },

    beregnGuldIndkomst(indkomst: number) {
        if (indkomst <= 0) return 0;
        const base = this.valgtKarakter?.goldMod ?? 1.0;
        return Math.round(indkomst * (base + this.rygsækEffekt.gold));
    },

    dag: 1,
    retning: 'S',
    maxKolonne: 0,
    samletScore: 0,
    statusBesked: '',
    
    _logBesked: '',
    logHistorik: [] as string[],
    get logBesked(): string { 
        return this.logHistorik.length > 0 ? this.logHistorik[this.logHistorik.length - 1] : ''; 
    },
    set logBesked(v: string) { 
        const rensetV = v.trim();
        const prefix = `${tekst('DAG', 'DAY')} ${this.dag}`;
        const fuldBesked = rensetV === '' ? prefix : `${prefix} - ${rensetV}`;
        
        const sidsteIndex = this.logHistorik.length - 1;
        
        if (sidsteIndex >= 0) {
            const sidsteLinje = this.logHistorik[sidsteIndex];
            if (sidsteLinje === prefix && rensetV !== '') {
                this.logHistorik[sidsteIndex] = fuldBesked;
            } else if (fuldBesked.startsWith(`${sidsteLinje} `)) {
                this.logHistorik[sidsteIndex] = fuldBesked;
            } else if (sidsteLinje !== fuldBesked) {
                this.logHistorik.push(fuldBesked);
            }
        } else {
            this.logHistorik.push(fuldBesked);
        }
    },

    fogX: 0,
    alleSpillere: {} as Record<string, SpillerData>,
    mitUdstyr: [] as RygsækTing[],
    mineKendteFelter: [] as number[],
    mineSkattekortFelter: [] as number[],
    trofaeStats: null as TrofaeStats | null,
    nyeTrofaeIds: [] as TrofaeId[],
    nyeMytiskeTrofaeIds: [] as TrofaeId[],
    historik: [] as number[],
    aktivShop: null as string[] | null,
    aktivVaerksted: false,
    
    venteSpilAktiv: false,
    ventePuljeGuld: 0,
    ventePuljeLiv: 0,
    venteFase: 'venter' as 'venter' | 'spiller' | 'viser_gevinst' | 'tabt' | 'vundet' | 'trukket',
    sidsteVenteDag: 0,
    venteRunde: 0,
    venteStartTid: 0,
    venteFriIndtilDag: 0,
    venteGratisFeltBrugt: null as number | null,
    venteKort: [] as Array<{ type: string; vaerdi: number; afsloeret: boolean }>,
    gratisNaesteBevaegelse: false,
    gratisBevaegelseKilde: '' as '' | 'mad' | 'bersaerk',
    sidsteBersaerkDag: 0,
    harEnergisyn: false,
    
    erBevidstløs: false,
    aktiveTal: [] as FlydendeTal[],
    aktiveEnergiKugler: [] as EnergiKugle[],
    aktiveEnergiTal: [] as EnergiForbrugTal[],
    musikTaendt: true,
});
