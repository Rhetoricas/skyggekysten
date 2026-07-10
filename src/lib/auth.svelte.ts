import { supabase } from './supabaseClient';
import { type LydNiveau, lydKontrol, saetLydNiveau } from './lydKontrol.svelte';
import { tilgaengeligeKarakterer } from './spildata';
import { findMedaljeNiveau } from './score';
import { hentTitel } from './historieMotor';
import { harUrlSprogOverride, normaliserSprog, saetSprog, sprogState, tekst, type AppSprog } from './i18n.svelte';
import {
    gemMytiskeTrofaeIds,
    gemTrofaeIds,
    lavTrofaeOwnerKey,
    normaliserTrofaeIds,
    retryVentendeSupabaseMytiskeTrofaeer,
    retryVentendeSupabaseTrofaeer,
    type TrofaeId
} from './trofaeer';

export interface Profil {
    id: string;
    display_name: string | null;
    sound_level?: LydNiveau | null;
    trophies?: TrofaeId[] | null;
    mythic_trophies?: TrofaeId[] | null;
    profile_character_id?: string | null;
    language?: AppSprog | null;
    created_at?: string;
    updated_at?: string;
}

export interface ProfilSpil {
    id: number;
    playerName: string;
    roomCode: string;
    score: number;
    character?: string | null;
    isWinner: boolean;
    isDead: boolean;
    deathCause?: 'vand' | 'taage' | null;
    days: number;
    gold: number;
    createdAt?: string | null;
}

export interface ProfilStats {
    spil: number;
    sejre: number;
    doedsfald: number;
    bedsteScore: number;
    bedsteMedalPath?: string | null;
    gennemsnitScore: number;
    mestGuld: number;
    bedsteDag: number;
    flestFelter: number;
    flestMiner: number;
    favoritKarakter: string;
    favoritKarakterBedsteScore: number;
    favoritKarakterBedsteTitel: string;
    karakterBedsteTitler: Array<{ karakter: string; karakterId: string; score: number; titel: string }>;
    spilHistorik: ProfilSpil[];
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
const PROFIL_KARAKTER_KEY = 'taage_profile_character:';
const PROFIL_SELECT = 'id, display_name, sound_level, trophies, mythic_trophies, profile_character_id, language, created_at, updated_at';
export const PROFIL_AUTO_BEDSTE_SCORE_ID = 'auto_best_score';
export const PROFIL_TUTORIAL_KARAKTER_ID = 'tutorial_laerling';

function rensProfilNavn(navn?: string | null) {
    return (navn || '').replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, '').trim().substring(0, 15);
}

function erGyldigProfilKarakterId(karakterId?: string | null) {
    return !karakterId ||
        karakterId === PROFIL_AUTO_BEDSTE_SCORE_ID ||
        karakterId === PROFIL_TUTORIAL_KARAKTER_ID ||
        tilgaengeligeKarakterer.some((karakter) => karakter.id === karakterId);
}

function profilKarakterKey(userId: string) {
    return `${PROFIL_KARAKTER_KEY}${userId}`;
}

function hentLokalProfilKarakter(userId: string) {
    if (typeof localStorage === 'undefined') return null;
    const gemt = localStorage.getItem(profilKarakterKey(userId));
    return erGyldigProfilKarakterId(gemt) ? gemt : null;
}

function gemLokalProfilKarakter(userId: string, karakterId: string | null) {
    if (typeof localStorage === 'undefined') return;
    if (karakterId) localStorage.setItem(profilKarakterKey(userId), karakterId);
    else localStorage.removeItem(profilKarakterKey(userId));
}

function medLokalProfilKarakterFallback(profil: Profil | null) {
    if (!profil || !authState.user?.id || profil.profile_character_id) return profil;
    return { ...profil, profile_character_id: hentLokalProfilKarakter(authState.user.id) } satisfies Profil;
}

function normaliserProfil(data: (Profil & { trophies?: unknown; mythic_trophies?: unknown }) | null) {
    if (!data) return null;
    return {
        ...data,
        trophies: normaliserTrofaeIds(data.trophies),
        mythic_trophies: normaliserTrofaeIds(data.mythic_trophies),
        profile_character_id: erGyldigProfilKarakterId(data.profile_character_id) ? data.profile_character_id || null : null,
        language: data.language ? normaliserSprog(data.language) : null
    } satisfies Profil;
}

function anvendProfilSprog(profil: Profil | null) {
    if (harUrlSprogOverride()) return;
    if (profil?.language) saetSprog(profil.language);
}

async function synkProfilTrofaeerMedLokalCache(profil: Profil | null) {
    if (!authState.user || !profil) return profil;

    const ownerKey = lavTrofaeOwnerKey(authState.user.id, profil.display_name);
    const profilIds = normaliserTrofaeIds(profil.trophies);
    const profilMytiskeIds = normaliserTrofaeIds(profil.mythic_trophies);

    gemTrofaeIds(ownerKey, profilIds);
    gemMytiskeTrofaeIds(ownerKey, profilMytiskeIds);

    return { ...profil, trophies: profilIds, mythic_trophies: profilMytiskeIds } satisfies Profil;
}

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
    void retryVentendeSupabaseTrofaeer(authState.user.id);
    void retryVentendeSupabaseMytiskeTrofaeer(authState.user.id);

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
        return tekst(
            'Der skal gå lidt tid, før vi kan sende endnu en loginmail til denne e-mailadresse. Du kan spille offline imens og prøve igen senere.',
            'Please wait a little before requesting another login email for this address. You can play offline in the meantime and try again later.'
        );
    }

    return tekst('Loginlinket blev ikke sendt. Tjek e-mailadressen, og prøv igen om lidt.', 'The login link was not sent. Check the email address and try again in a moment.');
}

function anonymLoginFejlBesked(message: string) {
    const lavere = message.toLowerCase();
    if (lavere.includes('anonymous') || lavere.includes('disabled') || lavere.includes('not enabled')) {
        return tekst(
            'En gæsteprofil kan ikke oprettes lige nu. Du kan stadig spille, men spillet bliver ikke gemt på din profil.',
            'A guest profile cannot be created right now. You can still play, but the game will not be saved to your profile.'
        );
    }
    if (lavere.includes('rate') || lavere.includes('security') || lavere.includes('limit') || lavere.includes('seconds') || lavere.includes('minute')) {
        return tekst(
            'Der skal gå lidt tid, før vi kan oprette endnu en profil. Du kan spille nu og prøve igen senere.',
            'Please wait a little before creating another profile. You can play now and try again later.'
        );
    }

    return tekst(
        'Gæsteprofilen kunne ikke oprettes. Du kan fortsætte uden en profil eller prøve igen om lidt.',
        'The guest profile could not be created. You can continue without a profile or try again in a moment.'
    );
}

function emailTilknytningFejlBesked(message: string) {
    const lavere = message.toLowerCase();
    if (lavere.includes('rate') || lavere.includes('security') || lavere.includes('limit') || lavere.includes('seconds') || lavere.includes('minute')) {
        return tekst(
            'Der skal gå lidt tid, før vi kan sende endnu et link. Din profil er stadig gemt på denne enhed, og du kan prøve igen senere.',
            'Please wait a little before requesting another link. Your profile is still saved on this device, and you can try again later.'
        );
    }

    return tekst(
        'E-mailadressen kunne ikke knyttes til profilen. Tjek adressen, og prøv igen om lidt.',
        'The email address could not be linked to the profile. Check the address and try again in a moment.'
    );
}

export function erAnonymBruger(user = authState.user) {
    return !!user?.is_anonymous;
}

export async function initAuth() {
    if (authStartet) return;
    authStartet = true;
    startAuthHeartbeat();

    const { data } = await supabase.auth.getSession();
    authState.user = data.session?.user ?? null;
    if (authState.user) {
        await hentEllerOpretProfil();
        void retryVentendeSupabaseTrofaeer(authState.user.id);
        void retryVentendeSupabaseMytiskeTrofaeer(authState.user.id);
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
        const forrigeUserId = authState.user?.id || '';
        const naesteUser = session?.user ?? null;
        const naesteUserId = naesteUser?.id || '';

        authState.user = naesteUser;
        authState.besked = '';
        if (forrigeUserId !== naesteUserId) {
            authState.stats = null;
        }
        if (authState.user) {
            await hentEllerOpretProfil();
            void retryVentendeSupabaseTrofaeer(authState.user.id);
            void retryVentendeSupabaseMytiskeTrofaeer(authState.user.id);
        } else {
            authState.profil = null;
            authState.stats = null;
        }
    });
}

export async function sendLoginLink(email: string) {
    if (authState.loader) return;

    const rentEmail = email.trim();
    if (!rentEmail) {
        authState.besked = tekst('Skriv din e-mailadresse.', 'Enter your email address.');
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

        authState.besked = tekst(
            'Vi har sendt et loginlink til din e-mailadresse. Det kan tage et øjeblik at nå frem.',
            'We sent a login link to your email address. It may take a moment to arrive.'
        );
    } catch (error) {
        console.error('Login-link kunne ikke sendes:', error);
        const message = error instanceof Error ? error.message : tekst('Noget gik galt', 'Something went wrong');
        authState.besked = loginFejlBesked(message);
    } finally {
        authState.loader = false;
    }
}

export async function startAnonymProfil(navn?: string) {
    if (authState.user) {
        if (navn) await gemProfilNavn(navn);
        return true;
    }
    if (authState.loader) return false;

    authState.loader = true;
    authState.besked = '';

    try {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
            console.error('Anonym profil kunne ikke oprettes:', error);
            authState.besked = anonymLoginFejlBesked(error.message);
            return false;
        }

        authState.user = data.user ?? data.session?.user ?? null;
        if (!authState.user) {
            authState.besked = tekst(
                'Gæsteprofilen kunne ikke oprettes. Du kan stadig spille, men spillet bliver ikke gemt på din profil.',
                'The guest profile could not be created. You can still play, but the game will not be saved to your profile.'
            );
            return false;
        }

        await hentEllerOpretProfil(navn);
        void retryVentendeSupabaseTrofaeer(authState.user.id);
        void retryVentendeSupabaseMytiskeTrofaeer(authState.user.id);
        return true;
    } catch (error) {
        console.error('Anonym profil kunne ikke oprettes:', error);
        const message = error instanceof Error ? error.message : tekst('Noget gik galt', 'Something went wrong');
        authState.besked = anonymLoginFejlBesked(message);
        return false;
    } finally {
        authState.loader = false;
    }
}

export async function sendEmailTilAnonymProfil(email: string) {
    if (!authState.user || !erAnonymBruger()) {
        await sendLoginLink(email);
        return;
    }
    if (authState.loader) return;

    const rentEmail = email.trim();
    if (!rentEmail) {
        authState.besked = tekst('Skriv din e-mailadresse.', 'Enter your email address.');
        return;
    }

    authState.loader = true;
    authState.besked = '';

    try {
        const { error } = await supabase.auth.updateUser(
            { email: rentEmail },
            { emailRedirectTo: window.location.origin }
        );

        if (error) {
            console.error('Email kunne ikke knyttes til anonym profil:', error);
            authState.besked = emailTilknytningFejlBesked(error.message);
            return;
        }

        authState.besked = tekst(
            'Vi har sendt et bekræftelseslink til din e-mailadresse. Når du åbner det, bliver profilen knyttet til adressen.',
            'We sent a confirmation link to your email address. Open it to link the profile to that address.'
        );
    } catch (error) {
        console.error('Email kunne ikke knyttes til anonym profil:', error);
        const message = error instanceof Error ? error.message : tekst('Noget gik galt', 'Something went wrong');
        authState.besked = emailTilknytningFejlBesked(message);
    } finally {
        authState.loader = false;
    }
}

export async function logUd() {
    await supabase.auth.signOut();
}

export async function hentEllerOpretProfil(foretrukketNavn?: string) {
    if (!authState.user) return null;

    const profilResultat = await supabase
        .from('profiles')
        .select(PROFIL_SELECT)
        .eq('id', authState.user.id)
        .maybeSingle();
    let data = profilResultat.data;

    if (profilResultat.error) {
        const fallback = await supabase
            .from('profiles')
            .select('id, display_name, created_at, updated_at')
            .eq('id', authState.user.id)
            .maybeSingle();

        data = fallback.data ? { ...fallback.data, sound_level: null, trophies: [], mythic_trophies: [], profile_character_id: hentLokalProfilKarakter(authState.user.id), language: sprogState.sprog } : null;
    }

    const rentForetrukketNavn = rensProfilNavn(foretrukketNavn);
    if (data && rentForetrukketNavn && data.display_name !== rentForetrukketNavn) {
        const opdateretTidspunkt = new Date().toISOString();
        const opdateret = await supabase
            .from('profiles')
            .upsert({ id: authState.user.id, display_name: rentForetrukketNavn, updated_at: opdateretTidspunkt })
            .select(PROFIL_SELECT)
            .single();
        if (!opdateret.error && opdateret.data) data = opdateret.data;
    }

    if (data) {
        authState.profil = medLokalProfilKarakterFallback(await synkProfilTrofaeerMedLokalCache(normaliserProfil(data)));
        if (data.sound_level) saetLydNiveau(data.sound_level);
        anvendProfilSprog(authState.profil);
        return authState.profil;
    }

    const fallbackNavn = rentForetrukketNavn || authState.user.email?.split('@')[0]?.slice(0, 15) || tekst('Spiller', 'Player');
    const opretResultat = await supabase
        .from('profiles')
        .insert([{ id: authState.user.id, display_name: fallbackNavn, sound_level: lydKontrol.niveau, trophies: [], mythic_trophies: [], profile_character_id: null, language: sprogState.sprog }])
        .select(PROFIL_SELECT)
        .single();
    let oprettet = opretResultat.data;

    if (opretResultat.error) {
        const fallback = await supabase
            .from('profiles')
            .insert([{ id: authState.user.id, display_name: fallbackNavn }])
            .select('id, display_name, created_at, updated_at')
            .single();

        oprettet = fallback.data ? { ...fallback.data, sound_level: null, trophies: [], mythic_trophies: [], profile_character_id: hentLokalProfilKarakter(authState.user.id), language: sprogState.sprog } : null;
    }

    authState.profil = medLokalProfilKarakterFallback(await synkProfilTrofaeerMedLokalCache(normaliserProfil(oprettet)));
    anvendProfilSprog(authState.profil);
    return authState.profil;
}

export async function gemProfilNavn(navn: string) {
    if (!authState.user) return;

    const rentNavn = rensProfilNavn(navn);
    if (!rentNavn) {
        authState.besked = tekst('Navnet må ikke være tomt.', 'The name cannot be empty.');
        return;
    }

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const opdateretTidspunkt = new Date().toISOString();

    let { data, error } = await supabase
        .from('profiles')
        .upsert({ id: authState.user.id, display_name: rentNavn, updated_at: opdateretTidspunkt })
        .select(PROFIL_SELECT)
        .single();

    if (error) {
        const fallback = await supabase
            .from('profiles')
            .upsert({ id: authState.user.id, display_name: rentNavn, updated_at: opdateretTidspunkt })
            .select('id, display_name, created_at, updated_at')
            .single();

        data = fallback.data ? { ...fallback.data, sound_level: authState.profil?.sound_level ?? null, trophies: authState.profil?.trophies ?? [], mythic_trophies: authState.profil?.mythic_trophies ?? [], profile_character_id: authState.profil?.profile_character_id ?? null, language: authState.profil?.language ?? sprogState.sprog } : null;
        error = fallback.error;
    }

    if (!error && data) {
        authState.profil = medLokalProfilKarakterFallback(normaliserProfil(data));
        authState.besked = tekst('Profilnavnet er gemt.', 'Profile name saved.');
    } else {
        authState.besked = tekst('Profilnavnet kunne ikke gemmes.', 'Profile name could not be saved.');
    }
}

export async function gemProfilLydNiveau(niveau: LydNiveau) {
    if (!authState.user) return;

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const opdateretTidspunkt = new Date().toISOString();
    let { data, error } = await supabase
        .from('profiles')
        .upsert({ id: authState.user.id, sound_level: niveau, updated_at: opdateretTidspunkt })
        .select(PROFIL_SELECT)
        .single();

    if (error) {
        const fallback = await supabase
            .from('profiles')
            .upsert({ id: authState.user.id, sound_level: niveau, updated_at: opdateretTidspunkt })
            .select('id, display_name, sound_level, created_at, updated_at')
            .single();

        data = fallback.data ? { ...fallback.data, trophies: authState.profil?.trophies ?? [], mythic_trophies: authState.profil?.mythic_trophies ?? [], profile_character_id: authState.profil?.profile_character_id ?? null, language: authState.profil?.language ?? sprogState.sprog } : null;
        error = fallback.error;
    }

    if (!error && data) authState.profil = medLokalProfilKarakterFallback(normaliserProfil(data));
}

export async function gemProfilKarakter(karakterId: string | null) {
    if (!authState.user) return;
    const rentKarakterId = erGyldigProfilKarakterId(karakterId) ? karakterId || null : null;
    gemLokalProfilKarakter(authState.user.id, rentKarakterId);

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const opdateretTidspunkt = new Date().toISOString();
    const naesteProfil = {
        ...(authState.profil || { id: authState.user.id, display_name: null }),
        profile_character_id: rentKarakterId,
        language: authState.profil?.language ?? sprogState.sprog,
        updated_at: opdateretTidspunkt
    } satisfies Profil;

    let { data, error } = await supabase
        .from('profiles')
        .upsert({ id: authState.user.id, profile_character_id: rentKarakterId, updated_at: opdateretTidspunkt })
        .select(PROFIL_SELECT)
        .single();

    if (error) {
        authState.profil = naesteProfil;
        authState.besked = rentKarakterId
            ? tekst('Profilbilledet er gemt på denne enhed.', 'Profile picture saved on this device.')
            : tekst('Profilbilledet følger igen det automatiske valg på denne enhed.', 'The profile picture now follows the automatic choice on this device.');
        return;
    }

    if (data) {
        authState.profil = medLokalProfilKarakterFallback(normaliserProfil(data));
        authState.besked = rentKarakterId
            ? tekst('Profilbilledet er gemt.', 'Profile picture saved.')
            : tekst('Profilbilledet følger igen det automatiske valg.', 'The profile picture now follows the automatic choice.');
    }
}

export async function gemProfilSprog(sprog: AppSprog) {
    const rentSprog = normaliserSprog(sprog);
    saetSprog(rentSprog);
    if (!authState.user) return;

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const opdateretTidspunkt = new Date().toISOString();
    const naesteProfil = {
        ...(authState.profil || { id: authState.user.id, display_name: null }),
        language: rentSprog,
        updated_at: opdateretTidspunkt
    } satisfies Profil;

    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: authState.user.id, language: rentSprog, updated_at: opdateretTidspunkt })
        .select(PROFIL_SELECT)
        .single();

    if (error) {
        authState.profil = naesteProfil;
        return;
    }

    if (data) authState.profil = medLokalProfilKarakterFallback(normaliserProfil(data));
}

export async function hentProfilStats() {
    if (!authState.user) return null;

    const { data, error } = await supabase
        .from('game_results')
        .select('id, player_name, room_code, score, character, is_winner, is_dead, death_cause, days, gold, max_column, known_fields_count, mines_owned, medal_path, created_at')
        .eq('user_id', authState.user.id)
        .order('created_at', { ascending: false });

    if (error || !data) {
        authState.stats = null;
        return null;
    }

    const spil = data.length;
    const sejre = data.filter((r) => r.is_winner).length;
    const doedsfald = spil - sejre;
    const samletScore = data.reduce((sum, r) => sum + (r.score || 0), 0);
    const mestGuld = Math.max(0, ...data.map((r) => r.gold || 0));
    const karakterTaeller: Record<string, number> = {};
    const karakterBedsteScore: Record<string, number> = {};

    for (const resultat of data) {
        const karakter = tilgaengeligeKarakterer.find((k) => k.navn === resultat.character || k.id === resultat.character)?.navn || resultat.character || 'Ukendt';
        karakterTaeller[karakter] = (karakterTaeller[karakter] || 0) + 1;
        karakterBedsteScore[karakter] = Math.max(karakterBedsteScore[karakter] || 0, resultat.score || 0);
    }

    const favoritKarakter =
        Object.entries(karakterTaeller).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Ingen endnu';
    const favoritKarakterBedsteScore = favoritKarakter === 'Ingen endnu' ? 0 : karakterBedsteScore[favoritKarakter] || 0;
    const favoritKarakterData = tilgaengeligeKarakterer.find((karakter) => karakter.navn === favoritKarakter);
    const favoritKarakterBedsteTitel = favoritKarakterBedsteScore > 0
        ? hentTitel(favoritKarakterData?.id || 'explorer', findMedaljeNiveau(favoritKarakterBedsteScore) + 1)
        : 'Ingen titel endnu';
    const karakterBedsteTitler = Object.entries(karakterBedsteScore)
        .map(([karakter, score]) => {
            const karakterData = tilgaengeligeKarakterer.find((k) => k.navn === karakter || k.id === karakter);
            return {
                karakter,
                karakterId: karakterData?.id || karakter,
                score,
                titel: score > 0 ? hentTitel(karakterData?.id || 'explorer', findMedaljeNiveau(score) + 1) : 'Ingen titel endnu'
            };
        })
        .sort((a, b) => b.score - a.score);

    const bedsteScore = Math.max(0, ...data.map((r) => r.score || 0));
    const bedsteResultater = data.filter((r) => (r.score || 0) === bedsteScore);
    const bedsteMedalPath =
        bedsteResultater.find((r) => r.medal_path === '/screens/m11.webp')?.medal_path ||
        bedsteResultater[0]?.medal_path ||
        null;

    authState.stats = {
        spil,
        sejre,
        doedsfald,
        bedsteScore,
        bedsteMedalPath,
        gennemsnitScore: spil > 0 ? Math.round(samletScore / spil) : 0,
        mestGuld,
        bedsteDag: Math.max(0, ...data.map((r) => r.days || 0)),
        flestFelter: Math.max(0, ...data.map((r) => r.known_fields_count || 0)),
        flestMiner: Math.max(0, ...data.map((r) => r.mines_owned || 0)),
        favoritKarakter,
        favoritKarakterBedsteScore,
        favoritKarakterBedsteTitel,
        karakterBedsteTitler,
        spilHistorik: data
            .filter((resultat) => typeof resultat.id === 'number')
            .map((resultat) => ({
                id: resultat.id as number,
                playerName: resultat.player_name || '',
                roomCode: resultat.room_code || '',
                score: resultat.score || 0,
                character: resultat.character,
                isWinner: !!resultat.is_winner,
                isDead: !!resultat.is_dead,
                deathCause: resultat.death_cause,
                days: resultat.days || 0,
                gold: resultat.gold || 0,
                createdAt: resultat.created_at
            }))
    };

    return authState.stats;
}
