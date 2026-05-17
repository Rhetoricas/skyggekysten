-- Reset af standardøer efter motor-/kortændringer.
--
-- Hvad scriptet gør:
-- 1. Gemmer en let backup af de øer og scores, der slettes.
-- 2. Sletter scores i game_results for de berørte øer.
-- 3. Sletter ø-sessionerne i spil_sessioner, så de bliver genskabt med ny motor,
--    nye kortmål og ny generator næste gang øen åbnes.
--
-- Sikkerhed:
-- Scriptet stopper, hvis der ligger mere end 64 øer i spil_sessioner.
-- Hvis du har flere end 64 rækker og kun vil resettes bestemte øer,
-- så skal delete/backup-filtrene ændres til en eksplicit liste af rum_kode.
--
-- Denne version bruger ingen temp-tabeller, fordi Supabase SQL-editorens
-- RLS-flow kan køre statements på en måde, hvor temp-tabeller forsvinder.

begin;

do $$
declare
    antal_oer integer;
begin
    select count(*) into antal_oer
    from public.spil_sessioner;

    if antal_oer = 0 then
        raise exception 'Ingen øer fundet i public.spil_sessioner.';
    end if;

    if antal_oer > 64 then
        raise exception 'Stopper: % øer matcher. Brug en eksplicit liste, hvis kun de 64 standardøer skal resettes.', antal_oer;
    end if;
end $$;

create table if not exists public.reset_backup_spil_sessioner as
select now() as backup_tidspunkt, s.*
from public.spil_sessioner s
where false;

create table if not exists public.reset_backup_game_results as
select now() as backup_tidspunkt, g.*
from public.game_results g
where false;

alter table public.reset_backup_spil_sessioner enable row level security;
alter table public.reset_backup_game_results enable row level security;

insert into public.reset_backup_spil_sessioner
select now() as backup_tidspunkt, s.*
from public.spil_sessioner s;

insert into public.reset_backup_game_results
select now() as backup_tidspunkt, g.*
from public.game_results g
where g.room_code in (
    select s.rum_kode
    from public.spil_sessioner s
);

delete from public.game_results g
where g.room_code in (
    select s.rum_kode
    from public.spil_sessioner s
);

delete from public.spil_sessioner;

commit;
