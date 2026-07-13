import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
import { taelScoreSpillere } from './score';
import type { RygsækTing } from './types';

export type TrofaeId =
    | 'mineejeren'
    | 'taagekonge'
    | 'boelgebaereren'
    | 'relikviejaegeren'
    | 'guldfyrsten'
    | 'livsvogteren'
    | 'korttegneren'
    | 'udstyrsmesteren'
    | 'diamantjaegeren';

export interface TrofaeDefinition {
    id: TrofaeId;
    sti: string;
    label: string;
    labelEn: string;
    krav: string;
    kravEn: string;
    mytiskSti?: string;
    mytiskKrav: string;
    mytiskKravEn: string;
    episkTekst: string;
    episkTekstEn: string;
}

export interface TrofaeStats {
    taageBevaegelser: number;
    oversvoemmelseStartet: boolean;
    vandSkader: number;
    healetHp: number;
    diamantRaavaerdiFundet: number;
}

export interface TrofaeAward {
    id: TrofaeId;
    tier?: 'normal' | 'mythic';
    gameResultId?: number | null;
    awardedAt?: string;
    awardData?: Record<string, unknown>;
}

export const TROFAE_DEFINITIONER: TrofaeDefinition[] = [
    {
        id: 'mineejeren',
        sti: '/screens/mineejeren.webp',
        mytiskSti: '/screens/mineejeren_myth.webp',
        label: 'Mineejer',
        labelEn: 'Mine Owner',
        krav: 'Slip væk fra øen med 12 miner.',
        kravEn: 'Escape the island with 12 mines.',
        mytiskKrav: 'Slip væk fra øen med 15 miner.',
        mytiskKravEn: 'Escape the island with 15 mines.',
        episkTekst: 'Du forlader øen som ejer af 12 miner.',
        episkTekstEn: 'You leave the island as the owner of 12 mines.'
    },
    {
        id: 'taagekonge',
        sti: '/screens/taagekonge.webp',
        mytiskSti: '/screens/taagekonge_myth.webp',
        label: 'Tågekonge',
        labelEn: 'Fog King',
        krav: 'Slip væk efter mindst 20 bevægelser i tågen.',
        kravEn: 'Escape after at least 20 moves in the fog.',
        mytiskKrav: 'Slip væk efter mindst 100 bevægelser i tågen.',
        mytiskKravEn: 'Escape after at least 100 moves in the fog.',
        episkTekst: 'Du tog 20 skridt gennem tågen og fandt alligevel ud.',
        episkTekstEn: 'You took 20 steps through the fog and still found your way out.'
    },
    {
        id: 'boelgebaereren',
        sti: '/screens/Bølgebæreren.webp',
        mytiskSti: '/screens/Bølgebæreren_myth.webp',
        label: 'Bølgebærer',
        labelEn: 'Wavebearer',
        krav: 'Start en oversvømmelse, tag skade fra vand 5 gange, og slip væk.',
        kravEn: 'Start a flood, take water damage 5 times and escape.',
        mytiskKrav: 'Start en oversvømmelse, tag skade fra vand 30 gange, og slip væk.',
        mytiskKravEn: 'Start a flood, take water damage 30 times and escape.',
        episkTekst: 'Du startede en oversvømmelse, tog vandets slag og nåede ud.',
        episkTekstEn: 'You started a flood, took the hits from the water and made it out.'
    },
    {
        id: 'relikviejaegeren',
        sti: '/screens/relikviejægeren.webp',
        mytiskSti: '/screens/relikviejægeren_myth.webp',
        label: 'Relikviejæger',
        labelEn: 'Relic Hunter',
        krav: 'Slip væk med 3 af disse 4 genstande: Rodhjertet, Gylden Destillator, Dragestav og Runekvist.',
        kravEn: 'Escape with 3 of these 4 items: Root Heart, Golden Distiller, Dragon Staff and Rune Rod.',
        mytiskKrav: 'Slip væk med alle 4 genstande: Rodhjertet, Gylden Destillator, Dragestav og Runekvist.',
        mytiskKravEn: 'Escape with all 4 items: Root Heart, Golden Distiller, Dragon Staff and Rune Rod.',
        episkTekst: 'Du fik tre af øens sjældneste genstande med ud af tågen.',
        episkTekstEn: 'You carried three of the island’s rarest items out of the fog.'
    },
    {
        id: 'guldfyrsten',
        sti: '/screens/guldfyrsten.webp',
        mytiskSti: '/screens/guldfyrsten_myth.webp',
        label: 'Guldfyrste',
        labelEn: 'Gold Prince',
        krav: 'Slip væk med 5000 guld. Kun din guldbeholdning tæller.',
        kravEn: 'Escape with 5000 gold. Only the gold you hold counts.',
        mytiskKrav: 'Slip væk med 8000 guld. Kun din guldbeholdning tæller.',
        mytiskKravEn: 'Escape with 8000 gold. Only the gold you hold counts.',
        episkTekst: 'Du forlader øen med 5000 guld.',
        episkTekstEn: 'You leave the island with 5000 gold.'
    },
    {
        id: 'livsvogteren',
        sti: '/screens/livsvogteren.webp',
        mytiskSti: '/screens/livsvogteren_myth.webp',
        label: 'Livvogter',
        labelEn: 'Life Warden',
        krav: 'Hel mindst 400 HP i løbet af spillet, og slip væk.',
        kravEn: 'Heal at least 400 HP during the game and escape.',
        mytiskKrav: 'Hel mindst 1200 HP i løbet af spillet, og slip væk.',
        mytiskKravEn: 'Heal at least 1200 HP during the game and escape.',
        episkTekst: 'Du helede 400 HP og holdt dig i live hele vejen.',
        episkTekstEn: 'You healed 400 HP and stayed alive all the way.'
    },
    {
        id: 'korttegneren',
        sti: '/screens/korttegneren.webp',
        mytiskSti: '/screens/korttegneren_myth.webp',
        label: 'Korttegner',
        labelEn: 'Cartographer',
        krav: 'Afslør mindst 1500 felter, og slip væk.',
        kravEn: 'Reveal at least 1500 tiles and escape.',
        mytiskKrav: 'Afslør mindst 2000 felter, og slip væk.',
        mytiskKravEn: 'Reveal at least 2000 tiles and escape.',
        episkTekst: 'Du kortlagde 1500 felter og fandt vejen ud.',
        episkTekstEn: 'You mapped 1500 tiles and found your way out.'
    },
    {
        id: 'udstyrsmesteren',
        sti: '/screens/udstyrsmesteren.webp',
        mytiskSti: '/screens/udstyrsmesteren_myth.webp',
        label: 'Udstyrsmester',
        labelEn: 'Equipment Master',
        krav: 'Slip væk med 10 opgraderingspoint i rygsækken på samme tid.',
        kravEn: 'Escape with 10 upgrade points in your backpack at the same time.',
        mytiskKrav: 'Slip væk med 13 opgraderingspoint i rygsækken på samme tid.',
        mytiskKravEn: 'Escape with 13 upgrade points in your backpack at the same time.',
        episkTekst: 'Du fik en hel samling opgraderet udstyr med hjem.',
        episkTekstEn: 'You brought home a full collection of upgraded equipment.'
    },
    {
        id: 'diamantjaegeren',
        sti: '/screens/diamantjægeren.webp',
        label: 'Diamantjæger',
        labelEn: 'Diamond Hunter',
        krav: 'Find diamanter til mindst 3000 guld i alt, og slip væk.',
        kravEn: 'Find diamonds worth at least 3000 gold in total and escape.',
        mytiskSti: '/screens/diamantjægeren_myth.webp',
        mytiskKrav: 'Find diamanter til mindst 6000 guld i alt, og slip væk.',
        mytiskKravEn: 'Find diamonds worth at least 6000 gold in total and escape.',
        episkTekst: 'Du fandt diamanter til mindst 3000 guld og slap væk fra øen.',
        episkTekstEn: 'You found diamonds worth at least 3000 gold and escaped the island.'
    }
];

const TROFAE_STORAGE_PREFIX = 'taage_trofaeer:';
const MYTISK_TROFAE_STORAGE_PREFIX = 'taage_mytiske_trofaeer:';
const TROFAE_AWARD_STORAGE_PREFIX = 'taage_trofae_awards:';
const TROFAE_PENDING_SYNC_KEY = 'taage_pending_trofaeer';
const MYTISK_TROFAE_PENDING_SYNC_KEY = 'taage_pending_mytiske_trofaeer';
const TROFAE_SUPABASE_TIMEOUT_MS = 8000;
const TROFAE_KRAV = {
    miner: 12,
    taageBevaegelser: 20,
    vandSkader: 5,
    magiskeGenstande: 3,
    guld: 5000,
    healetHp: 400,
    kendteFelter: 1500,
    opgraderedeItems: 10,
    diamantRaavaerdi: 3000
};
const MYTISK_TROFAE_KRAV = {
    miner: 15,
    taageBevaegelser: 100,
    vandSkader: 30,
    magiskeGenstande: 4,
    guld: 8000,
    healetHp: 1200,
    kendteFelter: 2000,
    opgraderedeItems: 13,
    diamantRaavaerdi: 6000
};
const OPGRADEREDE_ITEMS = new Set([
    'mesterskovl',
    'dragestav',
    'runekvist',
    'mesterdirk',
    'mesterkniv',
    'kongepanser',
    'stormoekse',
    'koelle_upgr',
    'flot_toej',
    'royalt_toej',
    'solfakkel',
    'silkesovepose',
    'malmviser',
    'mesterbue'
]);
const OPGRADERINGS_POINT = new Map<string, number>([
    ['royalt_toej', 2]
]);
const MAGISKE_GENSTANDE = new Set(['rodhjertet', 'gylden_destillator', 'dragestav', 'runekvist']);

type VentendeTrofaeSync = {
    userId: string;
    ids: TrofaeId[];
    nyeIds: TrofaeId[];
    updatedAt: string;
};

export function nulstilTrofaeStats(): TrofaeStats {
    return {
        taageBevaegelser: 0,
        oversvoemmelseStartet: false,
        vandSkader: 0,
        healetHp: 0,
        diamantRaavaerdiFundet: 0
    };
}

function stats() {
    if (!spilTilstand.trofaeStats) {
        spilTilstand.trofaeStats = nulstilTrofaeStats();
    }
    return spilTilstand.trofaeStats;
}

export function lavTrofaeOwnerKey(userId?: string | null, spillerNavn?: string | null) {
    if (userId) return `user:${userId}`;
    const navn = String(spillerNavn || 'lokal').trim().toLowerCase() || 'lokal';
    return `local:${navn}`;
}

function storageKey(ownerKey: string) {
    return `${TROFAE_STORAGE_PREFIX}${ownerKey}`;
}

function mytiskStorageKey(ownerKey: string) {
    return `${MYTISK_TROFAE_STORAGE_PREFIX}${ownerKey}`;
}

function awardStorageKey(ownerKey: string) {
    return `${TROFAE_AWARD_STORAGE_PREFIX}${ownerKey}`;
}

function medTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} tog for lang tid.`)), ms);
        Promise.resolve(promise)
            .then(resolve, reject)
            .finally(() => clearTimeout(timer));
    });
}

function hentVentendeTrofaeSyncs(): VentendeTrofaeSync[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        const data = JSON.parse(localStorage.getItem(TROFAE_PENDING_SYNC_KEY) || '[]');
        if (!Array.isArray(data)) return [];
        return data
            .map((sync) => ({
                userId: typeof sync?.userId === 'string' ? sync.userId : '',
                ids: normaliserTrofaeIds(sync?.ids),
                nyeIds: normaliserTrofaeIds(sync?.nyeIds),
                updatedAt: typeof sync?.updatedAt === 'string' ? sync.updatedAt : new Date().toISOString()
            }))
            .filter((sync) => sync.userId && sync.ids.length > 0);
    } catch {
        return [];
    }
}

function gemVentendeTrofaeSyncs(syncs: VentendeTrofaeSync[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TROFAE_PENDING_SYNC_KEY, JSON.stringify(syncs));
}

function hentVentendeMytiskeTrofaeSyncs(): VentendeTrofaeSync[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        const data = JSON.parse(localStorage.getItem(MYTISK_TROFAE_PENDING_SYNC_KEY) || '[]');
        if (!Array.isArray(data)) return [];
        return data
            .map((sync) => ({
                userId: typeof sync?.userId === 'string' ? sync.userId : '',
                ids: normaliserTrofaeIds(sync?.ids),
                nyeIds: normaliserTrofaeIds(sync?.nyeIds),
                updatedAt: typeof sync?.updatedAt === 'string' ? sync.updatedAt : new Date().toISOString()
            }))
            .filter((sync) => sync.userId && sync.ids.length > 0);
    } catch {
        return [];
    }
}

function gemVentendeMytiskeTrofaeSyncs(syncs: VentendeTrofaeSync[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MYTISK_TROFAE_PENDING_SYNC_KEY, JSON.stringify(syncs));
}

export function huskVentendeSupabaseTrofaeer(userId: string | null | undefined, ids: TrofaeId[], nyeIds: TrofaeId[] = []) {
    if (!userId) return;
    const alleIds = normaliserTrofaeIds(ids);
    const nyeTrofaeIds = normaliserTrofaeIds(nyeIds);
    if (alleIds.length === 0 || nyeTrofaeIds.length === 0) return;

    const syncs = hentVentendeTrofaeSyncs();
    const eksisterende = syncs.find((sync) => sync.userId === userId);
    if (eksisterende) {
        eksisterende.ids = normaliserTrofaeIds([...eksisterende.ids, ...alleIds]);
        eksisterende.nyeIds = normaliserTrofaeIds([...eksisterende.nyeIds, ...nyeTrofaeIds]);
        eksisterende.updatedAt = new Date().toISOString();
    } else {
        syncs.push({ userId, ids: alleIds, nyeIds: nyeTrofaeIds, updatedAt: new Date().toISOString() });
    }
    gemVentendeTrofaeSyncs(syncs);
}

export function huskVentendeSupabaseMytiskeTrofaeer(userId: string | null | undefined, ids: TrofaeId[], nyeIds: TrofaeId[] = []) {
    if (!userId) return;
    const alleIds = normaliserTrofaeIds(ids);
    const nyeTrofaeIds = normaliserTrofaeIds(nyeIds);
    if (alleIds.length === 0 || nyeTrofaeIds.length === 0) return;

    const syncs = hentVentendeMytiskeTrofaeSyncs();
    const eksisterende = syncs.find((sync) => sync.userId === userId);
    if (eksisterende) {
        eksisterende.ids = normaliserTrofaeIds([...eksisterende.ids, ...alleIds]);
        eksisterende.nyeIds = normaliserTrofaeIds([...eksisterende.nyeIds, ...nyeTrofaeIds]);
        eksisterende.updatedAt = new Date().toISOString();
    } else {
        syncs.push({ userId, ids: alleIds, nyeIds: nyeTrofaeIds, updatedAt: new Date().toISOString() });
    }
    gemVentendeMytiskeTrofaeSyncs(syncs);
}

function sammeTrofaeIds(a: TrofaeId[], b: TrofaeId[]) {
    return a.length === b.length && a.every((id, index) => id === b[index]);
}

function fjernVentendeSupabaseTrofaeer(userId: string, ids: TrofaeId[]) {
    const sendteIds = normaliserTrofaeIds(ids);
    gemVentendeTrofaeSyncs(
        hentVentendeTrofaeSyncs().filter((sync) =>
            sync.userId !== userId || !sammeTrofaeIds(sync.ids, sendteIds)
        )
    );
}

function fjernVentendeSupabaseMytiskeTrofaeer(userId: string, ids: TrofaeId[]) {
    const sendteIds = normaliserTrofaeIds(ids);
    gemVentendeMytiskeTrofaeSyncs(
        hentVentendeMytiskeTrofaeSyncs().filter((sync) =>
            sync.userId !== userId || !sammeTrofaeIds(sync.ids, sendteIds)
        )
    );
}

export function hentGemteTrofaeIds(ownerKey: string): TrofaeId[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        return normaliserTrofaeIds(JSON.parse(localStorage.getItem(storageKey(ownerKey)) || '[]'));
    } catch {
        return [];
    }
}

export function gemTrofaeIds(ownerKey: string, ids: TrofaeId[]) {
    if (typeof localStorage === 'undefined') return;
    const unikke = normaliserTrofaeIds(ids);
    localStorage.setItem(storageKey(ownerKey), JSON.stringify(unikke));
}

export function hentGemteMytiskeTrofaeIds(ownerKey: string): TrofaeId[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        return normaliserTrofaeIds(JSON.parse(localStorage.getItem(mytiskStorageKey(ownerKey)) || '[]'));
    } catch {
        return [];
    }
}

export function gemMytiskeTrofaeIds(ownerKey: string, ids: TrofaeId[]) {
    if (typeof localStorage === 'undefined') return;
    const unikke = normaliserTrofaeIds(ids);
    localStorage.setItem(mytiskStorageKey(ownerKey), JSON.stringify(unikke));
}

export function hentGemteTrofaeAwards(ownerKey: string): TrofaeAward[] {
    if (typeof localStorage === 'undefined') return [];
    try {
        return normaliserTrofaeAwards(JSON.parse(localStorage.getItem(awardStorageKey(ownerKey)) || '[]'));
    } catch {
        return [];
    }
}

export function gemTrofaeAwards(ownerKey: string, awards: TrofaeAward[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(awardStorageKey(ownerKey), JSON.stringify(normaliserTrofaeAwards(awards)));
}

export function normaliserTrofaeIds(ids: unknown): TrofaeId[] {
    if (!Array.isArray(ids)) return [];
    const kendteIds = new Set(TROFAE_DEFINITIONER.map((trofae) => trofae.id));
    const gyldige = ids.filter((id): id is TrofaeId => typeof id === 'string' && kendteIds.has(id as TrofaeId));
    return gyldige.filter((id, index) => gyldige.indexOf(id) === index);
}

export function normaliserTrofaeAwards(awards: unknown): TrofaeAward[] {
    if (!Array.isArray(awards)) return [];
    const kendteIds = new Set(TROFAE_DEFINITIONER.map((trofae) => trofae.id));
    const seneste = new Map<string, TrofaeAward>();

    for (const award of awards) {
        const id = typeof award?.id === 'string' && kendteIds.has(award.id as TrofaeId)
            ? award.id as TrofaeId
            : null;
        if (!id) continue;

        const tier = award?.tier === 'mythic' || award?.trophy_tier === 'mythic' || award?.mytisk === true
            ? 'mythic'
            : 'normal';
        const gameResultId = Number(award?.gameResultId ?? award?.game_result_id);
        const awardData = award?.awardData && typeof award.awardData === 'object'
            ? award.awardData as Record<string, unknown>
            : award?.award_data && typeof award.award_data === 'object'
                ? award.award_data as Record<string, unknown>
                : {};
        seneste.set(`${id}:${tier}`, {
            id,
            tier,
            gameResultId: Number.isFinite(gameResultId) && gameResultId > 0 ? gameResultId : null,
            awardedAt: typeof award?.awardedAt === 'string'
                ? award.awardedAt
                : typeof award?.awarded_at === 'string'
                    ? award.awarded_at
                    : new Date().toISOString(),
            awardData
        });
    }

    return Array.from(seneste.values());
}

export async function gemSupabaseTrofaeIds(userId: string | null | undefined, ids: TrofaeId[]) {
    if (!userId) return false;

    let error: { message?: string } | null = null;

    try {
        const resultat = await medTimeout(
            supabase
                .from('profiles')
                .update({
                    trophies: normaliserTrofaeIds(ids),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId),
            TROFAE_SUPABASE_TIMEOUT_MS,
            'Gemning af trofaeer'
        );
        error = resultat.error;
    } catch (fangetFejl) {
        console.warn('Trofaeer kunne ikke gemmes i Supabase:', fangetFejl);
        return false;
    }

    if (error) {
        console.warn('Trofæer kunne ikke gemmes i Supabase:', error);
        return false;
    }

    return true;
}

export async function gemSupabaseMytiskeTrofaeIds(userId: string | null | undefined, ids: TrofaeId[]) {
    if (!userId) return false;

    let error: { message?: string } | null = null;

    try {
        const resultat = await medTimeout(
            supabase
                .from('profiles')
                .update({
                    mythic_trophies: normaliserTrofaeIds(ids),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId),
            TROFAE_SUPABASE_TIMEOUT_MS,
            'Gemning af mytiske trofaeer'
        );
        error = resultat.error;
    } catch (fangetFejl) {
        console.warn('Mytiske trofaeer kunne ikke gemmes i Supabase:', fangetFejl);
        return false;
    }

    if (error) {
        console.warn('Mytiske trofaeer kunne ikke gemmes i Supabase:', error);
        return false;
    }

    return true;
}

export async function retryVentendeSupabaseTrofaeer(userId?: string | null) {
    const syncs = hentVentendeTrofaeSyncs().filter((sync) => !userId || sync.userId === userId);
    let gemt = 0;

    for (const sync of syncs) {
        if (sync.nyeIds.length === 0) {
            fjernVentendeSupabaseTrofaeer(sync.userId, sync.ids);
            continue;
        }
        const gemtOnline = await gemSupabaseTrofaeIds(sync.userId, sync.ids);
        if (gemtOnline) {
            fjernVentendeSupabaseTrofaeer(sync.userId, sync.ids);
            gemt++;
        }
    }

    return gemt;
}

export async function retryVentendeSupabaseMytiskeTrofaeer(userId?: string | null) {
    const syncs = hentVentendeMytiskeTrofaeSyncs().filter((sync) => !userId || sync.userId === userId);
    let gemt = 0;

    for (const sync of syncs) {
        if (sync.nyeIds.length === 0) {
            fjernVentendeSupabaseMytiskeTrofaeer(sync.userId, sync.ids);
            continue;
        }
        const gemtOnline = await gemSupabaseMytiskeTrofaeIds(sync.userId, sync.ids);
        if (gemtOnline) {
            fjernVentendeSupabaseMytiskeTrofaeer(sync.userId, sync.ids);
            gemt++;
        }
    }

    return gemt;
}

export async function gemSupabaseTrofaeAwards(userId: string | null | undefined, awards: TrofaeAward[]) {
    if (!userId) return false;
    const reneAwards = normaliserTrofaeAwards(awards).filter((award) => award.gameResultId);
    if (reneAwards.length === 0) return true;

    try {
        const { error } = await medTimeout(
            supabase
                .from('profile_trophies')
                .upsert(
                    reneAwards.map((award) => ({
                        user_id: userId,
                        trophy_id: award.id,
                        trophy_tier: award.tier || 'normal',
                        game_result_id: award.gameResultId,
                        award_data: award.awardData || {},
                        awarded_at: award.awardedAt || new Date().toISOString()
                    })),
                    { onConflict: 'user_id,trophy_id,trophy_tier' }
                ),
            TROFAE_SUPABASE_TIMEOUT_MS,
            'Gemning af trofae-awards'
        );
        if (error) {
            console.warn('Trofae-awards kunne ikke gemmes i Supabase:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.warn('Trofae-awards kunne ikke gemmes i Supabase:', error);
        return false;
    }
}

export async function hentSupabaseTrofaeAwards(userId: string | null | undefined) {
    if (!userId) return [];

    try {
        const { data, error } = await medTimeout(
            supabase
                .from('profile_trophies')
                .select('trophy_id, trophy_tier, game_result_id, award_data, awarded_at')
                .eq('user_id', userId)
                .order('awarded_at', { ascending: true }),
            TROFAE_SUPABASE_TIMEOUT_MS,
            'Hentning af trofae-awards'
        );
        if (error) {
            console.warn('Trofae-awards kunne ikke hentes fra Supabase:', error);
            return [];
        }
        return normaliserTrofaeAwards((data || []).map((award) => ({
            id: award.trophy_id,
            tier: award.trophy_tier,
            gameResultId: award.game_result_id,
            awardData: award.award_data,
            awardedAt: award.awarded_at
        })));
    } catch (error) {
        console.warn('Trofae-awards kunne ikke hentes fra Supabase:', error);
        return [];
    }
}

export async function hentSupabaseTrofaeAwardsForHighscore(gameResultId: number | null | undefined) {
    if (!gameResultId) return [];

    try {
        const { data, error } = await medTimeout(
            supabase
                .from('profile_trophies')
                .select('trophy_id, trophy_tier, game_result_id, award_data, awarded_at')
                .eq('game_result_id', gameResultId)
                .order('awarded_at', { ascending: true }),
            TROFAE_SUPABASE_TIMEOUT_MS,
            'Hentning af trofae-awards for highscore'
        );
        if (error) {
            console.warn('Trofae-awards kunne ikke hentes for highscore:', error);
            return [];
        }
        return normaliserTrofaeAwards((data || []).map((award) => ({
            id: award.trophy_id,
            tier: award.trophy_tier,
            gameResultId: award.game_result_id,
            awardData: award.award_data,
            awardedAt: award.awarded_at
        })));
    } catch (error) {
        console.warn('Trofae-awards kunne ikke hentes for highscore:', error);
        return [];
    }
}

export function findTrofae(id: string | null | undefined) {
    return TROFAE_DEFINITIONER.find((trofae) => trofae.id === id) ?? null;
}

export function registrerTaageBevaegelse() {
    stats().taageBevaegelser += 1;
}

export function registrerOversvoemmelse() {
    stats().oversvoemmelseStartet = true;
}

export function registrerVandSkade(faktiskSkade: number) {
    if (faktiskSkade > 0) stats().vandSkader += 1;
}

export function registrerHeling(foerHp: number, efterHp: number) {
    const heling = Math.max(0, Math.round(efterHp - foerHp));
    if (heling > 0) stats().healetHp += heling;
}

export function registrerDiamantFund(vaerdier: number[]) {
    const sum = vaerdier
        .map((vaerdi) => Math.round(Number(vaerdi)))
        .filter((vaerdi) => Number.isFinite(vaerdi) && vaerdi > 0)
        .reduce((total, vaerdi) => total + vaerdi, 0);
    if (sum > 0) stats().diamantRaavaerdiFundet += sum;
}

export function lavTrofaeAwardData(id: TrofaeId): Record<string, unknown> {
    const t = stats();
    const items = spilTilstand.mitUdstyr || [];
    const data: Record<TrofaeId, Record<string, unknown>> = {
        mineejeren: { miner: antalMiner() },
        taagekonge: { taageBevaegelser: t.taageBevaegelser },
        boelgebaereren: { oversvoemmelseStartet: t.oversvoemmelseStartet, vandSkader: t.vandSkader },
        relikviejaegeren: { magiskeGenstande: antalItemsFraSet(items, MAGISKE_GENSTANDE) },
        guldfyrsten: { guld: spilTilstand.guldTotal },
        livsvogteren: { healetHp: t.healetHp },
        korttegneren: { kendteFelter: spilTilstand.mineKendteFelter?.length || 0 },
        udstyrsmesteren: { opgraderingsPoint: antalOpgraderingsPoint(items) },
        diamantjaegeren: { diamantRaavaerdiFundet: t.diamantRaavaerdiFundet }
    };
    return data[id] || {};
}

export function lavTrofaeMaalinger(): Record<string, unknown> {
    const t = stats();
    const items = spilTilstand.mitUdstyr || [];
    return {
        miner: antalMiner(),
        taageBevaegelser: t.taageBevaegelser,
        oversvoemmelseStartet: t.oversvoemmelseStartet,
        vandSkader: t.vandSkader,
        magiskeGenstande: antalItemsFraSet(items, MAGISKE_GENSTANDE),
        guld: spilTilstand.guldTotal,
        healetHp: t.healetHp,
        kendteFelter: spilTilstand.mineKendteFelter?.length || 0,
        opgraderingsPoint: antalOpgraderingsPoint(items),
        diamantRaavaerdiFundet: t.diamantRaavaerdiFundet
    };
}

function antalMiner() {
    return spilTilstand.gitter.filter((felt) => felt.hasGoldmine && felt.mineOwner === spilTilstand.spillerNavn).length;
}

function antalItemsFraSet(items: RygsækTing[], ids: Set<string>) {
    return items.filter((ting) => ids.has(ting.id) && ting.maengde > 0).length;
}

function antalOpgraderingsPoint(items: RygsækTing[]) {
    return items
        .filter((ting) => OPGRADEREDE_ITEMS.has(ting.id) && ting.maengde > 0)
        .reduce((total, ting) => total + (OPGRADERINGS_POINT.get(ting.id) || 1), 0);
}

function overlevedeSpillet() {
    return (spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map') &&
        !spilTilstand.doedsAarsag &&
        spilTilstand.livspoint > 0;
}

function opnaaedeTrofaeIds(krav: typeof TROFAE_KRAV) {
    const t = stats();
    const items = spilTilstand.mitUdstyr || [];
    const opnaaede = new Set<TrofaeId>();

    if (antalMiner() >= krav.miner) opnaaede.add('mineejeren');
    if (t.taageBevaegelser >= krav.taageBevaegelser) opnaaede.add('taagekonge');
    if (t.oversvoemmelseStartet && t.vandSkader >= krav.vandSkader) opnaaede.add('boelgebaereren');
    if (antalItemsFraSet(items, MAGISKE_GENSTANDE) >= krav.magiskeGenstande) opnaaede.add('relikviejaegeren');
    if (spilTilstand.guldTotal >= krav.guld) opnaaede.add('guldfyrsten');
    if (t.healetHp >= krav.healetHp) opnaaede.add('livsvogteren');
    if ((spilTilstand.mineKendteFelter?.length || 0) >= krav.kendteFelter) opnaaede.add('korttegneren');
    if (antalOpgraderingsPoint(items) >= krav.opgraderedeItems) opnaaede.add('udstyrsmesteren');
    if (t.diamantRaavaerdiFundet >= krav.diamantRaavaerdi) opnaaede.add('diamantjaegeren');

    return opnaaede;
}

export function findNyeTrofaeer(tidligereIds: TrofaeId[] = []) {
    if (!overlevedeSpillet()) return [];

    const tidligere = new Set(tidligereIds);
    const opnaaede = opnaaedeTrofaeIds(TROFAE_KRAV);

    return TROFAE_DEFINITIONER.filter((trofae) => opnaaede.has(trofae.id) && !tidligere.has(trofae.id));
}

export function findNyeMytiskeTrofaeer(tidligereMytiskeIds: TrofaeId[] = [], normaleIdsEfterRun: TrofaeId[] = []) {
    if (!overlevedeSpillet()) return [];
    if (taelScoreSpillere(spilTilstand.alleSpillere) !== 1) return [];

    const tidligere = new Set(tidligereMytiskeIds);
    const normale = new Set(normaliserTrofaeIds(normaleIdsEfterRun));
    const opnaaede = opnaaedeTrofaeIds(MYTISK_TROFAE_KRAV);

    return TROFAE_DEFINITIONER.filter((trofae) =>
        normale.has(trofae.id) &&
        opnaaede.has(trofae.id) &&
        !tidligere.has(trofae.id)
    );
}
