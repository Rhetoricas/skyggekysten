import type { RygsækTing } from './types';

export const TROFAE_DEFINITIONER = [
    {
        id: 'mineejeren',
        navn: 'Mineejeren',
        billede: '/screens/mineejeren.webp',
        krav: '12 miner ved spilslut'
    },
    {
        id: 'taagekonge',
        navn: 'Tågekonge',
        billede: '/screens/taagekonge.webp',
        krav: '10 bevægelser i tåge'
    },
    {
        id: 'boelgebaereren',
        navn: 'Bølgebæreren',
        billede: '/screens/Bølgebæreren.webp',
        krav: 'start en oversvømmelse og tag skade fra vand 5 gange'
    },
    {
        id: 'relikviejaegeren',
        navn: 'Relikviejægeren',
        billede: '/screens/relikviejægeren.webp',
        krav: 'hav 3 af 4 magiske genstande i rygsækken ved spilslut'
    },
    {
        id: 'guldfyrsten',
        navn: 'Guldfyrsten',
        billede: '/screens/guldfyrsten.webp',
        krav: '5000 guld ved spilslut'
    },
    {
        id: 'livsvogteren',
        navn: 'Livsvogteren',
        billede: '/screens/livsvogteren.webp',
        krav: 'heal 400 HP'
    },
    {
        id: 'korttegneren',
        navn: 'Korttegneren',
        billede: '/screens/korttegneren.webp',
        krav: '1500 kendte felter'
    },
    {
        id: 'udstyrsmesteren',
        navn: 'Udstyrsmesteren',
        billede: '/screens/udstyrsmesteren.webp',
        krav: '10 opgraderede items i rygsækken samtidig'
    },
    {
        id: 'diamantjaegeren',
        navn: 'Diamantjægeren',
        billede: '/screens/diamantjægeren.webp',
        krav: 'find diamanter for 3000 rå værdi'
    }
] as const;

export type TrofaeId = typeof TROFAE_DEFINITIONER[number]['id'];

export interface TrofaeRunStats {
    healing: number;
    taageBevaegelser: number;
    oversvoemmelseStartet: boolean;
    vandskade: number;
    diamantVaerdiFundet: number;
}

export interface ProfilTrofae {
    id: TrofaeId;
    opnaaetTidspunkt: string;
    score?: number;
    oeNavn?: string;
    karakter?: string;
}

export interface TrofaeSlutContext {
    erDoed: boolean;
    guld: number;
    kendteFelter: number;
    miner: number;
    udstyr: RygsækTing[];
}

const TROFAE_ID_SET = new Set<TrofaeId>(TROFAE_DEFINITIONER.map((trofae) => trofae.id));
const RELIKVIE_ITEM_IDS = new Set(['rodhjertet', 'gylden_destillator', 'dragestav', 'runekvist']);
const OPGRADERET_ITEM_IDS = new Set([
    'mesterskovl',
    'dragestav',
    'runekvist',
    'mesterdirk',
    'mesterkniv',
    'kongepanser',
    'stormoekse',
    'koelle_upgr',
    'mesterbue',
    'flot_toej',
    'royalt_toej',
    'solfakkel',
    'malmviser',
    'silkesovepose'
]);

export function nyTrofaeRunStats(): TrofaeRunStats {
    return {
        healing: 0,
        taageBevaegelser: 0,
        oversvoemmelseStartet: false,
        vandskade: 0,
        diamantVaerdiFundet: 0
    };
}

export function normaliserTrofaeRunStats(stats: Partial<TrofaeRunStats> | null | undefined): TrofaeRunStats {
    return {
        healing: Math.max(0, Math.round(Number(stats?.healing) || 0)),
        taageBevaegelser: Math.max(0, Math.round(Number(stats?.taageBevaegelser) || 0)),
        oversvoemmelseStartet: !!stats?.oversvoemmelseStartet,
        vandskade: Math.max(0, Math.round(Number(stats?.vandskade ?? (stats as { vandfareRamte?: unknown } | null | undefined)?.vandfareRamte) || 0)),
        diamantVaerdiFundet: Math.max(0, Math.round(Number(stats?.diamantVaerdiFundet) || 0))
    };
}

export function registrerDiamantFund(stats: TrofaeRunStats, vaerdier: number[]) {
    const samlet = vaerdier
        .map((vaerdi) => Math.round(Number(vaerdi)))
        .filter((vaerdi) => Number.isFinite(vaerdi) && vaerdi > 0)
        .reduce((sum, vaerdi) => sum + vaerdi, 0);
    if (samlet > 0) stats.diamantVaerdiFundet += samlet;
}

function relikvierVedSlut(udstyr: RygsækTing[]) {
    const relikvier = new Set<string>();
    for (const ting of udstyr) {
        if (ting.maengde > 0 && RELIKVIE_ITEM_IDS.has(ting.id)) relikvier.add(ting.id);
    }
    return relikvier.size;
}

function opgraderedeItemsVedSlut(udstyr: RygsækTing[]) {
    return udstyr.filter((ting) => ting.maengde > 0 && OPGRADERET_ITEM_IDS.has(ting.id)).length;
}

export function findOptjenteTrofaeer(statsInput: Partial<TrofaeRunStats> | null | undefined, context: TrofaeSlutContext) {
    const stats = normaliserTrofaeRunStats(statsInput);
    const optjente: TrofaeId[] = [];
    if (context.erDoed) return optjente;

    if (context.miner >= 12) optjente.push('mineejeren');
    if (stats.taageBevaegelser >= 10) optjente.push('taagekonge');
    if (stats.oversvoemmelseStartet && stats.vandskade >= 5) optjente.push('boelgebaereren');
    if (relikvierVedSlut(context.udstyr) >= 3) optjente.push('relikviejaegeren');
    if (context.guld >= 5000) optjente.push('guldfyrsten');
    if (stats.healing >= 400) optjente.push('livsvogteren');
    if (context.kendteFelter >= 1500) optjente.push('korttegneren');
    if (opgraderedeItemsVedSlut(context.udstyr) >= 10) optjente.push('udstyrsmesteren');
    if (stats.diamantVaerdiFundet >= 3000) optjente.push('diamantjaegeren');

    return optjente;
}

export function normaliserProfilTrofaeer(input: unknown): ProfilTrofae[] {
    if (!Array.isArray(input)) return [];

    const set = new Set<TrofaeId>();
    const trofaeer: ProfilTrofae[] = [];

    for (const entry of input) {
        if (!entry || typeof entry !== 'object') continue;
        const id = (entry as { id?: unknown }).id;
        if (typeof id !== 'string' || !TROFAE_ID_SET.has(id as TrofaeId)) continue;
        if (set.has(id as TrofaeId)) continue;
        set.add(id as TrofaeId);

        const opnaaetTidspunkt = (entry as { opnaaetTidspunkt?: unknown }).opnaaetTidspunkt;
        const score = (entry as { score?: unknown }).score;
        const oeNavn = (entry as { oeNavn?: unknown }).oeNavn;
        const karakter = (entry as { karakter?: unknown }).karakter;

        trofaeer.push({
            id: id as TrofaeId,
            opnaaetTidspunkt: typeof opnaaetTidspunkt === 'string' ? opnaaetTidspunkt : new Date(0).toISOString(),
            score: typeof score === 'number' ? score : undefined,
            oeNavn: typeof oeNavn === 'string' ? oeNavn : undefined,
            karakter: typeof karakter === 'string' ? karakter : undefined
        });
    }

    return trofaeer.sort((a, b) => a.opnaaetTidspunkt.localeCompare(b.opnaaetTidspunkt));
}

export function tilfoejProfilTrofaeer(
    eksisterende: unknown,
    nyeIds: TrofaeId[],
    context: { score: number; oeNavn: string; karakter?: string }
) {
    const trofaeer = normaliserProfilTrofaeer(eksisterende);
    const kendte = new Set(trofaeer.map((trofae) => trofae.id));
    const tidspunkt = new Date().toISOString();

    for (const id of nyeIds) {
        if (kendte.has(id)) continue;
        kendte.add(id);
        trofaeer.push({
            id,
            opnaaetTidspunkt: tidspunkt,
            score: context.score,
            oeNavn: context.oeNavn,
            karakter: context.karakter
        });
    }

    return trofaeer;
}

export function findTrofaeDefinition(id: string) {
    return TROFAE_DEFINITIONER.find((trofae) => trofae.id === id);
}
