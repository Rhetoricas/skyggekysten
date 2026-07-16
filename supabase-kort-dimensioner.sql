-- Giver hver spil-session sine egne kortmål.
-- Standard er hovedkortet på 100 x 20 felter.

alter table public.spil_sessioner
    add column if not exists kort_bredde integer not null default 100,
    add column if not exists kort_hoejde integer not null default 20,
    add column if not exists kort_version integer not null default 2;

alter table public.spil_sessioner
    alter column kort_bredde set default 100,
    alter column kort_hoejde set default 20,
    alter column kort_version set default 2;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'spil_sessioner_kort_bredde_check'
    ) then
        alter table public.spil_sessioner
            add constraint spil_sessioner_kort_bredde_check check (kort_bredde >= 8);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'spil_sessioner_kort_hoejde_check'
    ) then
        alter table public.spil_sessioner
            add constraint spil_sessioner_kort_hoejde_check check (kort_hoejde >= 6);
    end if;
end $$;

create index if not exists spil_sessioner_kort_dimensioner_idx
    on public.spil_sessioner (kort_bredde, kort_hoejde, kort_version);
