-- Hård overgang til kortversion 2.
--
-- Kør dette script i Supabase SQL-editoren umiddelbart FØR version 2 af
-- klienten deployes. I det korte mellemrum vil gamle klienter ikke kunne gemme.
-- Eksisterende ø-sessioner og aktive ture slettes. Øerne bliver genereret
-- igen, når de næste gang besøges.
--
-- Bevares urørt:
-- - resultater og highscores i public.game_results (rutesporene nulstilles)
-- - public.profiles
-- - login, trofæer og øvrige tabeller

begin;

create table if not exists public.kort_migrationer (
    kort_version integer primary key,
    udfoert_tidspunkt timestamptz not null default now()
);

alter table public.kort_migrationer enable row level security;

do $$
begin
    if exists (
        select 1
        from public.kort_migrationer
        where kort_version = 2
    ) then
        raise exception 'Kortversion 2-reset er allerede udført. Scriptet stopper uden at slette noget.';
    end if;
end;
$$;

alter table public.spil_sessioner
    add column if not exists kort_version integer not null default 2;

alter table public.spil_sessioner
    alter column kort_version set default 2;

create table if not exists public.kort_v2_reset_backup (
    id bigint generated always as identity primary key,
    backup_tidspunkt timestamptz not null default now(),
    row_data jsonb not null
);

alter table public.kort_v2_reset_backup enable row level security;

insert into public.kort_v2_reset_backup (row_data)
select to_jsonb(s)
from public.spil_sessioner s;

delete from public.spil_sessioner;

-- Gamle ruteindekser tilhører de slettede kort. Scorerne bevares, men
-- rutetegningerne fjernes. DO-blokken virker også på installationer, hvor
-- de valgfrie rutekolonner endnu ikke er oprettet.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'game_results' and column_name = 'route_indices'
    ) then
        execute 'update public.game_results set route_indices = null';
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'game_results' and column_name = 'route_width'
    ) then
        execute 'update public.game_results set route_width = null';
    end if;

    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'game_results' and column_name = 'route_height'
    ) then
        execute 'update public.game_results set route_height = null';
    end if;
end;
$$;

alter table public.spil_sessioner
    drop constraint if exists spil_sessioner_kort_version_minimum;

alter table public.spil_sessioner
    add constraint spil_sessioner_kort_version_minimum
    check (kort_version >= 2);

create or replace function public.forhindr_kort_version_nedgradering()
returns trigger
language plpgsql
as $$
begin
    if new.kort_version < old.kort_version then
        raise exception 'Kortversion kan ikke nedgraderes fra % til %', old.kort_version, new.kort_version;
    end if;
    return new;
end;
$$;

drop trigger if exists spil_sessioner_forhindr_kort_version_nedgradering
    on public.spil_sessioner;

create trigger spil_sessioner_forhindr_kort_version_nedgradering
before update on public.spil_sessioner
for each row
execute function public.forhindr_kort_version_nedgradering();

insert into public.kort_migrationer (kort_version)
values (2);

commit;
