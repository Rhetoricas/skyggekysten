-- Sørger for at ét ø-navn kun kan have én aktiv session.
-- Kør i Supabase SQL editoren, hvis spil_sessioner.rum_kode ikke allerede er unik.

create unique index if not exists spil_sessioner_rum_kode_unique
on public.spil_sessioner (rum_kode);
