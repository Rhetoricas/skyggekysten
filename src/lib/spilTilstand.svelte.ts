import type { Felt, Karakter, SpillerData } from './types'; // <--- RETTET HER

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
    livspoint: 100,
    maxLivspoint: 100,
    guldTotal: 0,
    nuvaerendeEnergi: 10,
    maxEnergi: 10,
    dag: 1,
    retning: 'S',
    maxKolonne: 0,
    samletScore: 0,
    valgtKarakter: null as Karakter | null,
    statusBesked: '',
    logBesked: 'Velkommen til øen.',
    fogX: 0,
    alleSpillere: {} as Record<string, SpillerData>, // <--- OG RETTET HER
    mitUdstyr: [] as Array<{ id: string; maengde: number }>,
    mineKendteFelter: [] as number[],
    aktivShop: null as string[] | null,
    venteSpilAktiv: false,
    erBevidstløs: false,
    aktiveTal: [] as FlydendeTal[]
});