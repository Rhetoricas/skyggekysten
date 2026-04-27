import type { Felt, Item, Karakter, SpillerData, RygsækTing } from './types';
import type { SpilEvent } from './eventBibliotek';

export const spilTilstand = $state({
	gameState: 'login' as 'login' | 'select' | 'play' | 'dead' | 'win',
	spillerNavn: '',
	rumKode: '',
	erHost: false,
	statusBesked: '',
	retning: 'S',
    alleSpillere: {} as Record<string, SpillerData & { activeAlarm?: boolean }>,

	mitUdstyr: [] as RygsækTing[],
	livspoint: 100,
	guldTotal: 0,
	inventory: [] as Item[],
	valgtKarakter: null as Karakter | null,
	spillerIndex: 0,
	maxKolonne: 1,

	gitter: [] as Felt[],
	fogX: 0,
	mineKendteFelter: [] as number[],

	aktivtEvent: null as SpilEvent | null,
	eventUdfald: null as { tekst: string; farve: string; naesteTrin?: string } | null,
	aktivShop: null as string[] | null,

	eventPulje: 0,
	logBesked: '',
	erBevidstløs: false,
	stunNedtaelling: 0,
	samletScore: 0,
	talId: 0,
aktiveTal: [] as Array<{ id: number; type: string; tekst: string; feltIndex?: number; offsetX?: number; offsetY?: number }>,
nuvaerendeEnergi: 0,
	dag: 1,
	venteSpilAktiv: false,
	ventePuljeLiv: 0,
	ventePuljeGuld: 0,
	venteKort: [] as Array<{ type: string; vaerdi: number; afsloeret: boolean }>,
	venteRunde: 0,
	venteFase: 'spiller',
	sidsteVenteDag: 0,
	zoomLåsTure: 0,
	tvungetZoom: 1,

	get udstyrsEnergiPris() {
		const energiTing = this.inventory.filter(
			(item) => item.id === 'oenskekvist' || item.id === 'metaldetektor'
		);
		return energiTing.length;
	},

	get maxEnergi() {
		const base = this.valgtKarakter?.baseEnergi || 10; // Brug din egen variabel for standard-energi
		// Maskinen sikrer, at loftet aldrig kan falde under 1
		return Math.max(1, base - this.udstyrsEnergiPris);
	}
});
