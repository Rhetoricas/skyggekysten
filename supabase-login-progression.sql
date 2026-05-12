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

create table if not exists public.game_results (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    player_name text not null,
    room_code text not null,
    score integer not null default 0,
    character text,
    is_winner boolean not null default false,
    is_dead boolean not null default false,
    days integer not null default 0,
    gold integer not null default 0,
    max_column integer not null default 0,
    known_fields_count integer not null default 0,
    mines_owned integer not null default 0,
    final_log text,
    created_at timestamptz not null default now()
);

create index if not exists game_results_score_idx on public.game_results (score desc);
create index if not exists game_results_user_idx on public.game_results (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.game_results enable row level security;

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
