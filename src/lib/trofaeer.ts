import { supabase } from './supabaseClient';
import { spilTilstand } from './spilTilstand.svelte';
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
    krav: string;
    episkTekst: string;
}

export interface TrofaeStats {
    taageBevaegelser: number;
    oversvoemmelseStartet: boolean;
    vandSkader: number;
    healetHp: number;
    diamantRaavaerdiFundet: number;
}

export const TROFAE_DEFINITIONER: TrofaeDefinition[] = [
    {
        id: 'mineejeren',
        sti: '/screens/mineejeren.webp',
        label: 'Mineejeren',
        krav: 'Overlev spillet med 12 miner ved spilslut.',
        episkTekst: 'Du ejede 12 miner og slap levende væk.'
    },
    {
        id: 'taagekonge',
        sti: '/screens/taagekonge.webp',
        label: 'Tågekonge',
        krav: 'Overlev spillet efter 10 bevægelser i tåge.',
        episkTekst: 'Du gik 10 gange i tågen og kom ud igen.'
    },
    {
        id: 'boelgebaereren',
        sti: '/screens/Bølgebæreren.webp',
        label: 'Bølgebæreren',
        krav: 'Overlev spillet efter at have startet en oversvømmelse og taget skade fra vand 5 gange.',
        episkTekst: 'Du startede en oversvømmelse, bar vandets straf og overlevede.'
    },
    {
        id: 'relikviejaegeren',
        sti: '/screens/relikviejægeren.webp',
        label: 'Relikviejægeren',
        krav: 'Overlev spillet med 3 af 4 magiske genstande i rygsækken: Rodhjertet, Gylden Destillator, Dragestav og Runekvist.',
        episkTekst: 'Du bar tre magiske genstande ud af tågen.'
    },
    {
        id: 'guldfyrsten',
        sti: '/screens/guldfyrsten.webp',
        label: 'Guldfyrsten',
        krav: 'Overlev spillet med 5000 guld. Kun rent guld tæller.',
        episkTekst: 'Du slap væk med 5000 guld i hænderne.'
    },
    {
        id: 'livsvogteren',
        sti: '/screens/livsvogteren.webp',
        label: 'Livvogteren',
        krav: 'Overlev spillet efter at have healet 400 HP.',
        episkTekst: 'Du helede 400 HP og holdt dig levende hele vejen.'
    },
    {
        id: 'korttegneren',
        sti: '/screens/korttegneren.webp',
        label: 'Korttegneren',
        krav: 'Overlev spillet med 1500 kendte felter.',
        episkTekst: 'Du kortlagde 1500 felter og fandt hjem.'
    },
    {
        id: 'udstyrsmesteren',
        sti: '/screens/udstyrsmesteren.webp',
        label: 'Udstyrsmesteren',
        krav: 'Overlev spillet med 10 opgraderede items i rygsækken på samme tid.',
        episkTekst: 'Du bar 10 mesterlige stykker udstyr på samme tid.'
    },
    {
        id: 'diamantjaegeren',
        sti: '/screens/diamantjægeren.webp',
        label: 'Diamantjægeren',
        krav: 'Overlev spillet efter at have fundet diamanter med en samlet værdi på mindst 3000.',
        episkTekst: 'Du fandt diamanter med en samlet værdi på mindst 3000.'
    }
];

const TROFAE_STORAGE_PREFIX = 'taage_trofaeer:';
const TROFAE_PENDING_SYNC_KEY = 'taage_pending_trofaeer';
const TROFAE_SUPABASE_TIMEOUT_MS = 8000;
const TROFAE_KRAV = {
    miner: 12,
    taageBevaegelser: 10,
    vandSkader: 5,
    magiskeGenstande: 3,
    guld: 5000,
    healetHp: 400,
    kendteFelter: 1500,
    opgraderedeItems: 10,
    diamantRaavaerdi: 3000
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

export function huskVentendeSupabaseTrofaeer(userId: string | null | undefined, ids: TrofaeId[]) {
    if (!userId) return;
    const nyeIds = normaliserTrofaeIds(ids);
    if (nyeIds.length === 0) return;

    const syncs = hentVentendeTrofaeSyncs();
    const eksisterende = syncs.find((sync) => sync.userId === userId);
    if (eksisterende) {
        eksisterende.ids = normaliserTrofaeIds([...eksisterende.ids, ...nyeIds]);
        eksisterende.updatedAt = new Date().toISOString();
    } else {
        syncs.push({ userId, ids: nyeIds, updatedAt: new Date().toISOString() });
    }
    gemVentendeTrofaeSyncs(syncs);
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

export function normaliserTrofaeIds(ids: unknown): TrofaeId[] {
    if (!Array.isArray(ids)) return [];
    const kendteIds = new Set(TROFAE_DEFINITIONER.map((trofae) => trofae.id));
    const gyldige = ids.filter((id): id is TrofaeId => typeof id === 'string' && kendteIds.has(id as TrofaeId));
    return gyldige.filter((id, index) => gyldige.indexOf(id) === index);
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

export async function retryVentendeSupabaseTrofaeer(userId?: string | null) {
    const syncs = hentVentendeTrofaeSyncs().filter((sync) => !userId || sync.userId === userId);
    let gemt = 0;

    for (const sync of syncs) {
        const gemtOnline = await gemSupabaseTrofaeIds(sync.userId, sync.ids);
        if (gemtOnline) {
            fjernVentendeSupabaseTrofaeer(sync.userId, sync.ids);
            gemt++;
        }
    }

    return gemt;
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

export function findNyeTrofaeer(tidligereIds: TrofaeId[] = []) {
    if (!overlevedeSpillet()) return [];

    const tidligere = new Set(tidligereIds);
    const t = stats();
    const items = spilTilstand.mitUdstyr || [];
    const opnaaede = new Set<TrofaeId>();
    const krav = TROFAE_KRAV;

    if (antalMiner() >= krav.miner) opnaaede.add('mineejeren');
    if (t.taageBevaegelser >= krav.taageBevaegelser) opnaaede.add('taagekonge');
    if (t.oversvoemmelseStartet && t.vandSkader >= krav.vandSkader) opnaaede.add('boelgebaereren');
    if (antalItemsFraSet(items, MAGISKE_GENSTANDE) >= krav.magiskeGenstande) opnaaede.add('relikviejaegeren');
    if (spilTilstand.guldTotal >= krav.guld) opnaaede.add('guldfyrsten');
    if (t.healetHp >= krav.healetHp) opnaaede.add('livsvogteren');
    if ((spilTilstand.mineKendteFelter?.length || 0) >= krav.kendteFelter) opnaaede.add('korttegneren');
    if (antalOpgraderingsPoint(items) >= krav.opgraderedeItems) opnaaede.add('udstyrsmesteren');
    if (t.diamantRaavaerdiFundet >= krav.diamantRaavaerdi) opnaaede.add('diamantjaegeren');

    return TROFAE_DEFINITIONER.filter((trofae) => opnaaede.has(trofae.id) && !tidligere.has(trofae.id));
}
