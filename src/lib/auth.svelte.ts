import { supabase } from './supabaseClient';
import { type LydNiveau, lydKontrol, saetLydNiveau } from './lydKontrol.svelte';

export interface Profil {
    id: string;
    display_name: string | null;
    sound_level?: LydNiveau | null;
    created_at?: string;
    updated_at?: string;
}

export interface ProfilStats {
    spil: number;
    sejre: number;
    doedsfald: number;
    bedsteScore: number;
    gennemsnitScore: number;
    samletGuld: number;
    bedsteDag: number;
    flestFelter: number;
    flestMiner: number;
    favoritKarakter: string;
    karakterSejre: Array<{ karakter: string; sejre: number }>;
}

export const authState = $state({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: null as any,
    profil: null as Profil | null,
    email: '',
    besked: '',
    loader: false,
    stats: null as ProfilStats | null
});

let authStartet = false;
let authHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

async function vedligeholdLogin() {
    if (!authState.user) return;

    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) {
        authState.user = null;
        authState.profil = null;
        return;
    }

    authState.user = session.user;

    const sekunderTilUdlob = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000);
    if (sekunderTilUdlob > 5 * 60) return;

    const { data: refreshData, error } = await supabase.auth.refreshSession();
    if (error || !refreshData.session) return;

    authState.user = refreshData.session.user;
    if (!authState.profil) await hentEllerOpretProfil();
}

function startAuthHeartbeat() {
    if (authHeartbeatTimer || typeof window === 'undefined') return;

    authHeartbeatTimer = setInterval(() => {
        void vedligeholdLogin();
    }, 60 * 1000);

    window.addEventListener('focus', () => void vedligeholdLogin());
    window.addEventListener('online', () => void vedligeholdLogin());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) void vedligeholdLogin();
    });
}

function loginFejlBesked(message: string) {
    const lavere = message.toLowerCase();
    if (lavere.includes('rate') || lavere.includes('security') || lavere.includes('limit') || lavere.includes('seconds') || lavere.includes('minute')) {
        return 'Supabase holder en kort pause på nye login-mails til den email. Du kan stadig spille offline imens og prøve login igen lidt senere.';
    }

    return `Login-linket kunne ikke sendes: ${message}`;
}

export async function initAuth() {
    if (authStartet) return;
    authStartet = true;
    startAuthHeartbeat();

    const { data } = await supabase.auth.getSession();
    authState.user = data.session?.user ?? null;
    if (authState.user) await hentEllerOpretProfil();

    supabase.auth.onAuthStateChange(async (_event, session) => {
        authState.user = session?.user ?? null;
        authState.besked = '';
        authState.stats = null;
        if (authState.user) {
            await hentEllerOpretProfil();
        } else {
            authState.profil = null;
        }
    });
}

export async function sendLoginLink(email: string) {
    if (authState.loader) return;

    const rentEmail = email.trim();
    if (!rentEmail) {
        authState.besked = 'Skriv din email.';
        return;
    }

    authState.loader = true;
    authState.besked = '';

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: rentEmail,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('Login-link kunne ikke sendes:', error);
            authState.besked = loginFejlBesked(error.message);
            return;
        }

        authState.besked = 'Vi har sendt et login-link til din email. Hvis du allerede har bedt om et link, kan Supabase kræve en kort pause før næste mail.';
    } catch (error) {
        console.error('Login-link kunne ikke sendes:', error);
        const message = error instanceof Error ? error.message : 'Ukendt fejl';
        authState.besked = loginFejlBesked(message);
    } finally {
        authState.loader = false;
    }
}

export async function logUd() {
    await supabase.auth.signOut();
}

export async function hentEllerOpretProfil() {
    if (!authState.user) return null;

    const profilResultat = await supabase
        .from('profiles')
        .select('id, display_name, sound_level, created_at, updated_at')
        .eq('id', authState.user.id)
        .maybeSingle();
    let data = profilResultat.data;

    if (profilResultat.error) {
        const fallback = await supabase
            .from('profiles')
            .select('id, display_name, created_at, updated_at')
            .eq('id', authState.user.id)
            .maybeSingle();

        data = fallback.data ? { ...fallback.data, sound_level: null } : null;
    }

    if (data) {
        authState.profil = data;
        if (data.sound_level) saetLydNiveau(data.sound_level);
        return data;
    }

    const fallbackNavn = authState.user.email?.split('@')[0]?.slice(0, 15) || 'Spiller';
    const opretResultat = await supabase
        .from('profiles')
        .insert([{ id: authState.user.id, display_name: fallbackNavn, sound_level: lydKontrol.niveau }])
        .select('id, display_name, sound_level, created_at, updated_at')
        .single();
    let oprettet = opretResultat.data;

    if (opretResultat.error) {
        const fallback = await supabase
            .from('profiles')
            .insert([{ id: authState.user.id, display_name: fallbackNavn }])
            .select('id, display_name, created_at, updated_at')
            .single();

        oprettet = fallback.data ? { ...fallback.data, sound_level: null } : null;
    }

    authState.profil = oprettet ?? null;
    return authState.profil;
}

export async function gemProfilNavn(navn: string) {
    if (!authState.user) return;

    const rentNavn = navn.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
    if (!rentNavn) {
        authState.besked = 'Navnet må ikke være tomt.';
        return;
    }

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const opdateretTidspunkt = new Date().toISOString();

    let { data, error } = await supabase
        .from('profiles')
        .upsert({ id: authState.user.id, display_name: rentNavn, updated_at: opdateretTidspunkt })
        .select('id, display_name, sound_level, created_at, updated_at')
        .single();

    if (error) {
        const fallback = await supabase
            .from('profiles')
            .upsert({ id: authState.user.id, display_name: rentNavn, updated_at: opdateretTidspunkt })
            .select('id, display_name, created_at, updated_at')
            .single();

        data = fallback.data ? { ...fallback.data, sound_level: authState.profil?.sound_level ?? null } : null;
        error = fallback.error;
    }

    if (!error && data) {
        authState.profil = data;
        authState.besked = 'Profilnavnet er gemt.';
    } else {
        authState.besked = 'Profilnavnet kunne ikke gemmes.';
    }
}

export async function gemProfilLydNiveau(niveau: LydNiveau) {
    if (!authState.user) return;

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const opdateretTidspunkt = new Date().toISOString();
    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: authState.user.id, sound_level: niveau, updated_at: opdateretTidspunkt })
        .select('id, display_name, sound_level, created_at, updated_at')
        .single();

    if (!error && data) authState.profil = data;
}

export async function hentProfilStats() {
    if (!authState.user) return null;

    const { data, error } = await supabase
        .from('game_results')
        .select('score, is_winner, days, gold, max_column, known_fields_count, mines_owned, character')
        .eq('user_id', authState.user.id);

    if (error || !data) {
        authState.stats = null;
        return null;
    }

    const spil = data.length;
    const sejre = data.filter((r) => r.is_winner).length;
    const doedsfald = spil - sejre;
    const samletScore = data.reduce((sum, r) => sum + (r.score || 0), 0);
    const samletGuld = data.reduce((sum, r) => sum + (r.gold || 0), 0);
    const karakterTaeller: Record<string, number> = {};
    const karakterSejrTaeller: Record<string, number> = {};

    for (const resultat of data) {
        const karakter = resultat.character || 'Ukendt';
        karakterTaeller[karakter] = (karakterTaeller[karakter] || 0) + 1;
        if (resultat.is_winner) {
            karakterSejrTaeller[karakter] = (karakterSejrTaeller[karakter] || 0) + 1;
        }
    }

    const favoritKarakter =
        Object.entries(karakterTaeller).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ingen endnu';

    authState.stats = {
        spil,
        sejre,
        doedsfald,
        bedsteScore: Math.max(0, ...data.map((r) => r.score || 0)),
        gennemsnitScore: spil > 0 ? Math.round(samletScore / spil) : 0,
        samletGuld,
        bedsteDag: Math.max(0, ...data.map((r) => r.days || 0)),
        flestFelter: Math.max(0, ...data.map((r) => r.known_fields_count || 0)),
        flestMiner: Math.max(0, ...data.map((r) => r.mines_owned || 0)),
        favoritKarakter,
        karakterSejre: Object.entries(karakterSejrTaeller)
            .map(([karakter, vundne]) => ({ karakter, sejre: vundne }))
            .sort((a, b) => b.sejre - a.sejre)
    };

    return authState.stats;
}
