-- Login/profil/statistik til Tågeøerne.
-- Kør denne i Supabase SQL editoren.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    sound_level text not null default 'fuld' check (sound_level in ('fuld', 'lav', 'slukket')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists sound_level text not null default 'fuld'
check (sound_level in ('fuld', 'lav', 'slukket'));

alter table public.profiles
add column if not exists trophies jsonb not null default '[]'::jsonb;

alter table public.profiles
add column if not exists mythic_trophies jsonb not null default '[]'::jsonb;

alter table public.profiles
add column if not exists profile_character_id text;

alter table public.profiles
add column if not exists language text not null default 'da'
check (language in ('da', 'en'));

create table if not exists public.game_results (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    player_name text not null,
    room_code text not null,
    score integer not null default 0,
    character text,
    is_winner boolean not null default false,
    is_dead boolean not null default false,
    death_cause text check (death_cause in ('vand', 'taage')),
    days integer not null default 0,
    gold integer not null default 0,
    max_column integer not null default 0,
    known_fields_count integer not null default 0,
    mines_owned integer not null default 0,
    player_count integer not null default 1,
    final_log text,
    medal_path text,
    medal_level integer,
    route_indices jsonb,
    route_width integer,
    route_height integer,
    game_mode text not null default 'open' check (game_mode in ('open', 'offline')),
    created_at timestamptz not null default now()
);

alter table public.game_results
add column if not exists game_mode text not null default 'open'
check (game_mode in ('open', 'offline'));

alter table public.game_results
add column if not exists player_count integer not null default 1;

alter table public.game_results
add column if not exists medal_path text;

alter table public.game_results
add column if not exists medal_level integer;

alter table public.game_results
add column if not exists route_indices jsonb;

alter table public.game_results
add column if not exists route_width integer;

alter table public.game_results
add column if not exists route_height integer;

alter table public.game_results
add column if not exists death_cause text
check (death_cause in ('vand', 'taage'));

do $$
declare
    constraint_name text;
begin
    for constraint_name in
        select conname
        from pg_constraint
        where conrelid = 'public.game_results'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) like '%game_mode%'
    loop
        execute format('alter table public.game_results drop constraint if exists %I', constraint_name);
    end loop;

    alter table public.game_results
    add constraint game_results_game_mode_check
    check (game_mode in ('open', 'offline'));
end $$;

create index if not exists game_results_score_idx on public.game_results (score desc);
create index if not exists game_results_user_idx on public.game_results (user_id, created_at desc);
create index if not exists game_results_mode_score_idx on public.game_results (game_mode, score desc);

create table if not exists public.profile_trophies (
    user_id uuid not null references auth.users(id) on delete cascade,
    trophy_id text not null,
    trophy_tier text not null default 'normal' check (trophy_tier in ('normal', 'mythic')),
    game_result_id bigint references public.game_results(id) on delete set null,
    award_data jsonb not null default '{}'::jsonb,
    awarded_at timestamptz not null default now(),
    primary key (user_id, trophy_id, trophy_tier)
);

alter table public.profile_trophies
add column if not exists trophy_tier text not null default 'normal';

do $$
begin
    alter table public.profile_trophies
    drop constraint if exists profile_trophies_trophy_tier_check;

    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.profile_trophies'::regclass
          and conname = 'profile_trophies_trophy_tier_check'
    ) then
        alter table public.profile_trophies
        add constraint profile_trophies_trophy_tier_check
        check (trophy_tier in ('normal', 'mythic'));
    end if;

    if exists (
        select 1
        from pg_constraint
        where conrelid = 'public.profile_trophies'::regclass
          and conname = 'profile_trophies_pkey'
          and pg_get_constraintdef(oid) = 'PRIMARY KEY (user_id, trophy_id)'
    ) then
        alter table public.profile_trophies drop constraint profile_trophies_pkey;
        alter table public.profile_trophies add constraint profile_trophies_pkey primary key (user_id, trophy_id, trophy_tier);
    end if;
end $$;

create index if not exists profile_trophies_user_idx on public.profile_trophies (user_id, awarded_at);
create index if not exists profile_trophies_game_result_idx on public.profile_trophies (game_result_id);

alter table public.profiles enable row level security;
alter table public.game_results enable row level security;
alter table public.profile_trophies enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Global results are readable by everyone" on public.game_results;
create policy "Global results are readable by everyone"
on public.game_results for select
using (true);

drop policy if exists "Users can insert their own results" on public.game_results;
create policy "Users can insert their own results"
on public.game_results for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own results" on public.game_results;
create policy "Users can update their own results"
on public.game_results for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own trophies" on public.profile_trophies;
create policy "Users can read their own trophies"
on public.profile_trophies for select
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own trophies" on public.profile_trophies;
create policy "Users can insert their own trophies"
on public.profile_trophies for insert
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own trophies" on public.profile_trophies;
create policy "Users can update their own trophies"
on public.profile_trophies for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
