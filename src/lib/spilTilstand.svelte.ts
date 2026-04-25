import type { Felt, Item, Karakter, SpillerData } from './types';
import type { SpilEvent } from './eventBibliotek';

export const spilTilstand = $state({
    gameState: 'login' as 'login' | 'select' | 'play' | 'dead' | 'win',
    spillerNavn: '',
    rumKode: '',
    erHost: false,
    statusBesked: '',
    
    livspoint: 100,
    guldTotal: 0,
    inventory: [] as Item[],
    valgtKarakter: null as Karakter | null,
    spillerIndex: 0,
    maxKolonne: 1,
    
    gitter: [] as Felt[],
    alleSpillere: {} as Record<string, SpillerData>,
    fogX: 0,
    mineKendteFelter: [] as number[],
    
    aktivtEvent: null as SpilEvent | null,
    eventUdfald: null as {tekst: string, farve: string, naesteTrin?: string} | null,
    aktivShop: null as string[] | null,
    
    eventPulje: 0,
    logBesked: "",
    erBevidstløs: false,
    stunNedtaelling: 0,
    samletScore: 0,
    talId: 0,
    aktiveTal: [] as Array<{ id: number, type: string, tekst: string }>,
    
    nuvaerendeEnergi: 0,
    dag: 1,
    venteSpilAktiv: false,
    ventePuljeLiv: 0,
    ventePuljeGuld: 0,
    venteKort: [] as Array<{ type: string, vaerdi: number, afsloeret: boolean }>,
    venteRunde: 0,
    venteFase: 'spiller',
    sidsteVenteDag: 0,
    zoomLåsTure: 0,
    tvungetZoom: 1,
});