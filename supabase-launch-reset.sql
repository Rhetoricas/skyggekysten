-- Launch-reset af Tågeøerne.
--
-- Sletter:
-- - alle øer/sessioner i public.spil_sessioner
-- - alle highscores/resultater i public.game_results
-- - alle profiler i public.profiles
--
-- Sletter IKKE auth.users. Login-konti bliver altså stående, men profiler
-- bliver genskabt tomt/normalt næste gang brugerne logger ind.
--
-- Backup:
-- Før sletning gemmes alle rækker som jsonb i public.launch_reset_backup.
-- Tabellen får RLS slået til, så den ikke bliver læsbar fra klienten.

begin;

create table if not exists public.launch_reset_backup (
    id bigint generated always as identity primary key,
    backup_tidspunkt timestamptz not null default now(),
    table_name text not null,
    row_data jsonb not null
);

alter table public.launch_reset_backup enable row level security;

insert into public.launch_reset_backup (table_name, row_data)
select 'spil_sessioner', to_jsonb(s)
from public.spil_sessioner s;

insert into public.launch_reset_backup (table_name, row_data)
select 'game_results', to_jsonb(g)
from public.game_results g;

insert into public.launch_reset_backup (table_name, row_data)
select 'profiles', to_jsonb(p)
from public.profiles p;

do $$
declare
    antal_oer integer;
    antal_scores integer;
    antal_profiler integer;
begin
    select count(*) into antal_oer from public.spil_sessioner;
    select count(*) into antal_scores from public.game_results;
    select count(*) into antal_profiler from public.profiles;

    raise notice 'Launch-reset sletter % ø-sessioner, % scores og % profiler. Backup er gemt i public.launch_reset_backup.',
        antal_oer, antal_scores, antal_profiler;
end $$;

truncate table public.game_results restart identity;
truncate table public.spil_sessioner;
truncate table public.profiles;

commit;

