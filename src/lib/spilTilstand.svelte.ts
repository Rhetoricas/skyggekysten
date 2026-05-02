import type { Felt, Karakter, SpillerData, RygsækTing } from './types';

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
    gameState: 'start' as 'start' | 'select' | 'play' | 'dead' | 'win',
    gitter: [] as Felt[],
    spillerIndex: 0,
    
    maxLivspoint: 100,
    _livspoint: 100,
    get livspoint(): number { return this._livspoint; },
    set livspoint(v: number) { this._livspoint = Math.max(0, Math.min(this.maxLivspoint, v)); },
    
    _guldTotal: 0,
    get guldTotal(): number { return this._guldTotal; },
    set guldTotal(v: number) { this._guldTotal = Math.max(0, Math.round(v)); },
    
    valgtKarakter: null as Karakter | null,

    get maxEnergi(): number { return this.valgtKarakter?.baseEnergi || 10; },
    _nuvaerendeEnergi: 10,
    get nuvaerendeEnergi(): number { return this._nuvaerendeEnergi; },
    set nuvaerendeEnergi(v: number) { this._nuvaerendeEnergi = Math.max(0, Math.min(this.maxEnergi, v)); },

    dag: 1,
    retning: 'S',
    maxKolonne: 0,
    samletScore: 0,
    statusBesked: '',
    logBesked: 'Velkommen til øen.',
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