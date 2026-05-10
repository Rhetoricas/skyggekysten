import type { Felt, Karakter, SpillerData, RygsækTing } from './types';
import { itemDB } from './spildata';

interface FlydendeTal {
    id: number;
    tekst: string;
    type: string;
    feltIndex: number;
    offsetX: number;
    offsetY: number;
}

export const spilTilstand = $state({
    spillerNavn: '',
    rumKode: '',
    erHost: false,
    gameState: 'start' as 'start' | 'select' | 'play' | 'dead' | 'dead_map' | 'win' | 'win_map',
    gitter: [] as Felt[],
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
        return (this.mitUdstyr || []).reduce((acc: { move: number; dmg: number; syn: number; energi: number; gold: number }, slot: RygsækTing) => {
            const info = itemDB[slot.id];
            if (!info || slot.maengde <= 0) return acc;
            return {
                move: acc.move + (info.moveMod || 0),
                dmg: acc.dmg + (info.dmgMod || 0),
                syn: acc.syn + (info.synsMod || 0),
                energi: acc.energi + (info.energiMod || 0),
                gold: acc.gold + (info.goldMod || 0)
            };
        }, { move: 0, dmg: 0, syn: 0, energi: 0, gold: 0 });
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
        const prefix = `DAG ${this.dag}`;
        const fuldBesked = rensetV === '' ? prefix : `${prefix} - ${rensetV}`;
        
        const sidsteIndex = this.logHistorik.length - 1;
        
        if (sidsteIndex >= 0) {
            const sidsteLinje = this.logHistorik[sidsteIndex];
            if (sidsteLinje === prefix && rensetV !== '') {
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
    aktivShop: null as string[] | null,
    
    venteSpilAktiv: false,
    ventePuljeGuld: 0,
    ventePuljeLiv: 0,
    venteFase: 'venter' as 'venter' | 'spiller' | 'viser_gevinst' | 'tabt' | 'vundet' | 'trukket',
    sidsteVenteDag: 0,
    venteRunde: 0,
    venteKort: [] as Array<{ type: string; vaerdi: number; afsloeret: boolean }>,
    
    erBevidstløs: false,
    aktiveTal: [] as FlydendeTal[],
    musikTaendt: true,
});