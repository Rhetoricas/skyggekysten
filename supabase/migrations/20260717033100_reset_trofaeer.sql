-- Hård nulstilling af alle trofæmedaljer, generation 2.
--
-- Kør dette script i Supabase SQL-editoren umiddelbart FØR klienten med
-- trofægeneration 2 deployes. Scriptet kan kun gennemføres én gang.
--
-- Den nye produktionsklient SKAL:
-- - sende HTTP-headeren `x-trophy-generation: 2` på Supabase-kald
-- - rydde eller versionsskifte de lokale trofæ-, award- og sync-cacher
--
-- I det korte mellemrum før den nye klient er deployet kan gamle klienter
-- stadig læse data, men de kan ikke gemme trofæer. Dermed kan en gammel fane
-- ikke skrive nulstillede trofæmedaljer tilbage efter denne transaktion.
--
-- Nulstilles:
-- - public.profiles.trophies
-- - public.profiles.mythic_trophies
-- - alle award-rækker i public.profile_trophies
--
-- Bevares urørt:
-- - alle profiler og alle andre profilfelter
-- - login og auth.users
-- - alle resultater og highscores i public.game_results
-- - almindelige scoremedaljer i medal_path og medal_level
-- - historiske trofæmålinger i trophy_stats
-- - ø-sessioner og alle øvrige tabeller

begin;

create table if not exists public.trofae_migrationer (
    trofae_generation integer primary key,
    udfoert_tidspunkt timestamptz not null default now()
);

alter table public.trofae_migrationer enable row level security;

do $$
begin
    if exists (
        select 1
        from public.trofae_migrationer
        where trofae_generation = 2
    ) then
        raise exception 'Trofæreset generation 2 er allerede udført. Scriptet stopper uden at nulstille noget.';
    end if;
end;
$$;

create table if not exists public.trofae_reset_backup (
    id bigint generated always as identity primary key,
    trofae_generation integer not null,
    backup_tidspunkt timestamptz not null default now(),
    table_name text not null check (table_name in ('profiles', 'profile_trophies')),
    row_data jsonb not null
);

alter table public.trofae_reset_backup enable row level security;

-- Bloker samtidige profil- og award-skrivninger, mens backup og reset kører.
-- SELECT er fortsat tilladt. Låsene holdes indtil commit.
lock table public.profiles, public.profile_trophies
    in share row exclusive mode;

-- PostgREST/Supabase stiller request-headere til rådighed som JSON i
-- request.headers. SQL-editoren har ingen auth.uid() og rammes derfor ikke af
-- generationskontrollen nedenfor.
create or replace function public.er_aktuel_trofae_klient()
returns boolean
language sql
stable
set search_path = ''
as $$
    select coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb
            ->> 'x-trophy-generation',
        ''
    ) = '2';
$$;

create or replace function public.beskyt_trofae_profilfelter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if auth.uid() is not null
       and (
           new.trophies is distinct from old.trophies
           or new.mythic_trophies is distinct from old.mythic_trophies
       )
       and not public.er_aktuel_trofae_klient()
    then
        raise exception 'Genindlæs spillet, før trofæer kan gemmes.';
    end if;

    return new;
end;
$$;

drop trigger if exists profiles_beskyt_trofae_generation
    on public.profiles;

create trigger profiles_beskyt_trofae_generation
before update of trophies, mythic_trophies on public.profiles
for each row
execute function public.beskyt_trofae_profilfelter();

create or replace function public.beskyt_trofae_awards()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if auth.uid() is not null
       and not public.er_aktuel_trofae_klient()
    then
        raise exception 'Genindlæs spillet, før trofæer kan gemmes.';
    end if;

    return new;
end;
$$;

drop trigger if exists profile_trophies_beskyt_generation
    on public.profile_trophies;

create trigger profile_trophies_beskyt_generation
before insert or update on public.profile_trophies
for each row
execute function public.beskyt_trofae_awards();

-- Gem kun de profilkolonner, der bliver ændret. Alle award-rækker gemmes
-- komplet, så reset kan rekonstrueres manuelt fra backup ved behov.
insert into public.trofae_reset_backup (
    trofae_generation,
    table_name,
    row_data
)
select
    2,
    'profiles',
    jsonb_build_object(
        'id', p.id,
        'trophies', p.trophies,
        'mythic_trophies', p.mythic_trophies
    )
from public.profiles p
where p.trophies is distinct from '[]'::jsonb
   or p.mythic_trophies is distinct from '[]'::jsonb;

insert into public.trofae_reset_backup (
    trofae_generation,
    table_name,
    row_data
)
select
    2,
    'profile_trophies',
    to_jsonb(t)
from public.profile_trophies t;

do $$
declare
    antal_profiler integer;
    antal_awards integer;
begin
    select count(*) into antal_profiler
    from public.profiles
    where trophies is distinct from '[]'::jsonb
       or mythic_trophies is distinct from '[]'::jsonb;

    select count(*) into antal_awards
    from public.profile_trophies;

    raise notice 'Trofæreset nulstiller % profiler og sletter % award-rækker. Backup er gemt i public.trofae_reset_backup.',
        antal_profiler,
        antal_awards;
end;
$$;

-- updated_at bevares med vilje, så ingen andre profiloplysninger ændres.
update public.profiles
set trophies = '[]'::jsonb,
    mythic_trophies = '[]'::jsonb
where trophies is distinct from '[]'::jsonb
   or mythic_trophies is distinct from '[]'::jsonb;

delete from public.profile_trophies;

insert into public.trofae_migrationer (trofae_generation)
values (2);

commit;
