-- Autoritativ rundeisolering for kortversion 2 (produktionsmigration).
--
-- Kør dette script i Supabase SQL-editoren umiddelbart FØR klienten med
-- spilprotokol 2 deployes. Det allerede udførte kort-v2-reset skal IKKE
-- køres igen.
--
-- Scriptet:
-- - giver hver ø-session et autoritativt runde-id
-- - flytter gravsten til atomisk, permanent lagring med højst tre pr. felt
-- - bevarer det nuværende kort, spillere, gravsten og alle andre spildata
-- - mærker eksisterende spillere med sessionens runde-id
-- - afviser skriverier fra gamle klienter uden `x-game-protocol: 2`
--
-- Den nye klient bruger runde-id'et til compare-and-swap ved reset. Dermed
-- kan kun én af to samtidige resettere vinde, og forsinkede skriverier fra en
-- afsluttet runde kan ikke ændre den nye runde.

begin;

create table if not exists public.spil_protokol_migrationer (
    protokol_version integer primary key,
    udfoert_tidspunkt timestamptz not null default now()
);

alter table public.spil_protokol_migrationer enable row level security;

do $$
begin
    if exists (
        select 1
        from public.spil_protokol_migrationer
        where protokol_version = 2
    ) then
        raise exception 'Spilprotokol 2 er allerede installeret. Scriptet stopper uden at ændre noget.';
    end if;
end;
$$;

create table if not exists public.rundeisolering_backup (
    id bigint generated always as identity primary key,
    protokol_version integer not null,
    backup_tidspunkt timestamptz not null default now(),
    row_data jsonb not null
);

alter table public.rundeisolering_backup enable row level security;

-- Hold sessionerne stille, mens de får et runde-id og spillernes indlejrede
-- rundeSeed bliver gjort ens med det autoritative id.
lock table public.spil_sessioner in share row exclusive mode;

insert into public.rundeisolering_backup (
    protokol_version,
    row_data
)
select 2, to_jsonb(s)
from public.spil_sessioner s;

alter table public.spil_sessioner
    add column if not exists runde_id text;

-- Bevar en igangværende rundes eksisterende seed, hvis der findes et.
-- Ellers oprettes et nyt id uden at nulstille selve øen.
update public.spil_sessioner s
set runde_id = coalesce(
    (
        select spiller.value ->> 'rundeSeed'
        from jsonb_each(coalesce(to_jsonb(s.spillere), '{}'::jsonb)) as spiller
        where nullif(spiller.value ->> 'rundeSeed', '') is not null
        order by
            case
                when coalesce((spiller.value ->> 'isDead')::boolean, false)
                  or coalesce((spiller.value ->> 'isWinner')::boolean, false)
                then 1
                else 0
            end,
            coalesce((spiller.value ->> 'sidstAktiv')::bigint, 0) desc
        limit 1
    ),
    gen_random_uuid()::text
)
where nullif(s.runde_id, '') is null;

-- Alle eksisterende spillerobjekter knyttes til det valgte, autoritative id.
-- Tomme spillerobjekter forbliver tomme.
update public.spil_sessioner s
set spillere = coalesce(
    (
        select jsonb_object_agg(
            spiller.key,
            spiller.value || jsonb_build_object('rundeSeed', s.runde_id)
        )
        from jsonb_each(coalesce(to_jsonb(s.spillere), '{}'::jsonb)) as spiller
    ),
    '{}'::jsonb
);

alter table public.spil_sessioner
    alter column runde_id set default gen_random_uuid()::text;

alter table public.spil_sessioner
    alter column runde_id set not null;

alter table public.spil_sessioner
    drop constraint if exists spil_sessioner_runde_id_ikke_tom;

alter table public.spil_sessioner
    add constraint spil_sessioner_runde_id_ikke_tom
    check (length(trim(runde_id)) >= 8);

create index if not exists spil_sessioner_rum_runde_idx
    on public.spil_sessioner (rum_kode, runde_id);

-- Gravsten tilhører øen og ikke en enkelt runde. De får derfor deres egen
-- autoritative række pr. felt i stedet for kun at ligge i et helt kort-snapshot.
-- Det gør samtidige dødsfald atomiske og forhindrer, at en kortgemning kan
-- overskrive et andet dødsfald.
create table if not exists public.oe_gravsten (
    rum_kode text not null,
    kort_version integer not null,
    felt_index integer not null,
    minder jsonb not null default '[]'::jsonb,
    registrerede_ider text[] not null default '{}'::text[],
    registrerede_runde_id text not null default '',
    opdateret_tidspunkt timestamptz not null default now(),
    primary key (rum_kode, kort_version, felt_index),
    constraint oe_gravsten_rum_kode_ikke_tom
        check (length(trim(rum_kode)) between 1 and 20),
    constraint oe_gravsten_felt_index_gyldigt
        check (felt_index >= 0),
    constraint oe_gravsten_kort_version_gyldig
        check (kort_version >= 2),
    constraint oe_gravsten_hoejst_tre
        check (
            case
                when jsonb_typeof(minder) = 'array'
                then jsonb_array_length(minder) <= 3
                else false
            end
        )
);

alter table public.oe_gravsten
    add column if not exists registrerede_ider text[] not null default '{}'::text[];

alter table public.oe_gravsten
    add column if not exists registrerede_runde_id text not null default '';

alter table public.oe_gravsten enable row level security;

do $$
begin
    if exists (
        select 1 from pg_publication where pubname = 'supabase_realtime'
    ) and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'oe_gravsten'
    ) then
        alter publication supabase_realtime add table public.oe_gravsten;
    end if;
end;
$$;

drop policy if exists oe_gravsten_offentlig_laesning
    on public.oe_gravsten;

create policy oe_gravsten_offentlig_laesning
on public.oe_gravsten
for select
to anon, authenticated
using (true);

revoke all on table public.oe_gravsten from public, anon, authenticated;
grant select on public.oe_gravsten to anon, authenticated;

create or replace function public.seneste_tre_gravsten(p_minder jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
    select coalesce(
        jsonb_agg(seneste.minde order by seneste.position),
        '[]'::jsonb
    )
    from (
        select element.minde, element.position
        from jsonb_array_elements(
            case
                when jsonb_typeof(p_minder) = 'array' then p_minder
                else '[]'::jsonb
            end
        ) with ordinality as element(minde, position)
        order by element.position desc
        limit 3
    ) as seneste;
$$;

revoke all on function public.seneste_tre_gravsten(jsonb)
    from public, anon, authenticated;

create or replace function public.rens_kort_for_gravsten(p_kort jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
    select coalesce(
        jsonb_agg(
            felt.data - 'gravstenListe' - 'gravstenIkon'
            order by felt.position
        ),
        '[]'::jsonb
    )
    from jsonb_array_elements(
        case
            when jsonb_typeof(p_kort) = 'array' then p_kort
            else '[]'::jsonb
        end
    ) with ordinality as felt(data, position);
$$;

revoke all on function public.rens_kort_for_gravsten(jsonb)
    from public, anon, authenticated;

-- Flyt eksisterende gravsten ud af kort-JSON'en. Den nye klient læser fremover
-- denne tabel som autoritativ kilde.
with kort_felter as (
    select
        lower(trim(s.rum_kode)) as rum_kode,
        s.kort_version,
        (felt.position - 1)::integer as felt_index,
        felt.data as felt_data
    from public.spil_sessioner s
    cross join lateral jsonb_array_elements(
        case
            when jsonb_typeof(to_jsonb(s.kort)) = 'array' then to_jsonb(s.kort)
            else '[]'::jsonb
        end
    ) with ordinality as felt(data, position)
), fundne_gravsten as (
    select
        rum_kode,
        kort_version,
        felt_index,
        case
            when jsonb_typeof(felt_data -> 'gravstenListe') = 'array'
                 and jsonb_array_length(felt_data -> 'gravstenListe') > 0
            then public.seneste_tre_gravsten(felt_data -> 'gravstenListe')
            when nullif(felt_data ->> 'gravstenIkon', '') is not null
            then jsonb_build_array(jsonb_build_object(
                'ikon', felt_data ->> 'gravstenIkon',
                'navn', 'Ukendt',
                'dag', 0
            ))
            else '[]'::jsonb
        end as minder
    from kort_felter
)
insert into public.oe_gravsten as eksisterende (
    rum_kode,
    kort_version,
    felt_index,
    minder
)
select rum_kode, kort_version, felt_index, minder
from fundne_gravsten
where jsonb_array_length(minder) > 0
on conflict (rum_kode, kort_version, felt_index)
do update set
    minder = public.seneste_tre_gravsten(eksisterende.minder || excluded.minder),
    opdateret_tidspunkt = now();

-- Når kopien er flyttet sikkert, fjernes de indlejrede felter fra sessionens
-- kort. Fremtidige helkort-gemninger kan dermed aldrig være autoritative for
-- gravsten eller overskrive den separate tabel.
update public.spil_sessioner s
set kort = public.rens_kort_for_gravsten(to_jsonb(s.kort));

-- PostgREST/Supabase eksponerer request-headere som JSON. SQL-editoren og
-- service-jobber har ikke rollen anon/authenticated og kan derfor fortsat
-- administrere tabellen uden en klientheader.
create or replace function public.er_aktuel_spilklient()
returns boolean
language sql
stable
set search_path = ''
as $$
    select coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb
            ->> 'x-game-protocol',
        ''
    ) = '2';
$$;

-- En gravsten tilføjes gennem denne ene atomiske funktion. Direkte writes er
-- ikke tilladt for klientrollerne. Et stabilt klient-id gør retries idempotente.
create or replace function public.registrer_oe_gravsten(
    p_rum_kode text,
    p_kort_version integer,
    p_runde_id text,
    p_felt_index integer,
    p_minde jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_rum_kode text := lower(trim(coalesce(p_rum_kode, '')));
    v_runde_id text := trim(coalesce(p_runde_id, ''));
    v_ikon text;
    v_navn text;
    v_tekst text;
    v_id text;
    v_dag integer;
    v_minde jsonb;
    v_resultat jsonb;
    v_felt_antal integer;
    v_aktuel_runde_id text;
begin
    if coalesce(auth.role(), '') in ('anon', 'authenticated')
       and not public.er_aktuel_spilklient()
    then
        raise exception 'Genindlæs spillet, før en gravsten kan gemmes.';
    end if;

    if length(v_rum_kode) not between 1 and 20
       or length(v_runde_id) < 8
       or p_kort_version is null or p_kort_version < 2
       or p_felt_index is null or p_felt_index < 0
       or p_minde is null or jsonb_typeof(p_minde) <> 'object'
    then
        raise exception 'Ugyldige gravstensdata.';
    end if;

    v_ikon := left(trim(coalesce(p_minde ->> 'ikon', '')), 500);
    v_navn := left(trim(coalesce(p_minde ->> 'navn', '')), 80);
    v_tekst := left(trim(coalesce(p_minde ->> 'tekst', '')), 1000);
    v_id := left(trim(coalesce(p_minde ->> 'id', '')), 100);
    v_dag := case
        when coalesce(p_minde ->> 'dag', '') ~ '^[0-9]{1,7}$'
        then least((p_minde ->> 'dag')::integer, 9999999)
        else 0
    end;

    if v_id !~ '^[A-Za-z0-9_-]{8,100}$' or v_ikon = '' or v_navn = '' then
        raise exception 'Gravstenen mangler et gyldigt id, ikon eller navn.';
    end if;

    -- Et svar kan være gået tabt, selv om første forsøg blev gemt. Et kendt id
    -- returneres derfor også efter et senere rundeskift uden at blive tilføjet igen.
    select g.minder into v_resultat
    from public.oe_gravsten g
    where g.rum_kode = v_rum_kode
      and g.kort_version = p_kort_version
      and g.felt_index = p_felt_index
      and g.registrerede_runde_id = v_runde_id
      and v_id = any(g.registrerede_ider);

    if found then
        return v_resultat;
    end if;

    -- Reset og dødsfald låser samme sessionrække. Dermed kan de ikke passere
    -- hinanden: enten gemmes mindet først, eller den gamle runde afvises.
    select
        s.runde_id,
        case
            when jsonb_typeof(to_jsonb(s.kort)) = 'array'
            then jsonb_array_length(to_jsonb(s.kort))
            else 0
        end
    into v_aktuel_runde_id, v_felt_antal
    from public.spil_sessioner s
    where lower(trim(s.rum_kode)) = v_rum_kode
      and s.kort_version = p_kort_version
    for update;

    if not found then
        raise exception 'Øen findes ikke i denne kortversion.';
    end if;

    -- En parallel retry kan have ventet på sessionslåsen, mens det første
    -- kald blev gemt. Tjek derfor idempotens igen under samme lås.
    select g.minder into v_resultat
    from public.oe_gravsten g
    where g.rum_kode = v_rum_kode
      and g.kort_version = p_kort_version
      and g.felt_index = p_felt_index
      and g.registrerede_runde_id = v_runde_id
      and v_id = any(g.registrerede_ider);

    if found then
        return v_resultat;
    end if;

    if v_aktuel_runde_id <> v_runde_id then
        raise exception 'Runden er afsluttet. Gravstenen blev ikke gemt.';
    end if;

    if p_felt_index >= v_felt_antal then
        raise exception 'Ugyldigt feltindeks.';
    end if;

    v_minde := jsonb_build_object(
        'id', v_id,
        'ikon', v_ikon,
        'navn', v_navn,
        'dag', v_dag,
        'rundeId', v_runde_id,
        'tidspunkt', clock_timestamp()
    );

    if v_tekst <> '' then
        v_minde := v_minde || jsonb_build_object('tekst', v_tekst);
    end if;

    insert into public.oe_gravsten as eksisterende (
        rum_kode,
        kort_version,
        felt_index,
        minder,
        registrerede_ider,
        registrerede_runde_id
    )
    values (
        v_rum_kode,
        p_kort_version,
        p_felt_index,
        jsonb_build_array(v_minde),
        array[v_id],
        v_runde_id
    )
    on conflict (rum_kode, kort_version, felt_index)
    do update set
        minder = case
            when eksisterende.registrerede_runde_id = v_runde_id
                 and v_id = any(eksisterende.registrerede_ider) then eksisterende.minder
            else public.seneste_tre_gravsten(
                eksisterende.minder || jsonb_build_array(v_minde)
            )
        end,
        registrerede_ider = case
            when eksisterende.registrerede_runde_id <> v_runde_id then array[v_id]
            when v_id = any(eksisterende.registrerede_ider) then eksisterende.registrerede_ider
            else array_append(eksisterende.registrerede_ider, v_id)
        end,
        registrerede_runde_id = v_runde_id,
        opdateret_tidspunkt = case
            when eksisterende.registrerede_runde_id = v_runde_id
                 and v_id = any(eksisterende.registrerede_ider) then eksisterende.opdateret_tidspunkt
            else clock_timestamp()
        end
    returning minder into v_resultat;

    return v_resultat;
end;
$$;

revoke all on function public.registrer_oe_gravsten(text, integer, text, integer, jsonb)
    from public;
grant execute on function public.registrer_oe_gravsten(text, integer, text, integer, jsonb)
    to anon, authenticated;

-- Idempotenslisten er kun teknisk retry-data for den aktuelle runde. Ved et
-- autoritativt rundeskift slettes den straks; selve de tre synlige minder
-- bevares permanent som aftalt.
create or replace function public.nulstil_gravsten_ider_ved_rundeskift()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.runde_id is distinct from old.runde_id then
        update public.oe_gravsten
        set registrerede_ider = '{}'::text[],
            registrerede_runde_id = new.runde_id
        where rum_kode = lower(trim(new.rum_kode))
          and kort_version = new.kort_version;
    end if;
    return new;
end;
$$;

revoke all on function public.nulstil_gravsten_ider_ved_rundeskift()
    from public;

drop trigger if exists spil_sessioner_nulstil_gravsten_ider
    on public.spil_sessioner;

create trigger spil_sessioner_nulstil_gravsten_ider
before update of runde_id on public.spil_sessioner
for each row
execute function public.nulstil_gravsten_ider_ved_rundeskift();

create or replace function public.fjern_indlejrede_gravsten_fra_kort()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    new.kort := public.rens_kort_for_gravsten(to_jsonb(new.kort));
    return new;
end;
$$;

revoke all on function public.fjern_indlejrede_gravsten_fra_kort()
    from public;

drop trigger if exists spil_sessioner_fjern_indlejrede_gravsten
    on public.spil_sessioner;

create trigger spil_sessioner_fjern_indlejrede_gravsten
before insert or update of kort on public.spil_sessioner
for each row
execute function public.fjern_indlejrede_gravsten_fra_kort();

create or replace function public.beskyt_spilprotokol()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if coalesce(auth.role(), '') in ('anon', 'authenticated')
       and not public.er_aktuel_spilklient()
    then
        raise exception 'Genindlæs spillet, før øen kan gemmes.';
    end if;

    return new;
end;
$$;

drop trigger if exists spil_sessioner_beskyt_protokol
    on public.spil_sessioner;

create trigger spil_sessioner_beskyt_protokol
before insert or update on public.spil_sessioner
for each row
execute function public.beskyt_spilprotokol();

insert into public.spil_protokol_migrationer (protokol_version)
values (2);

commit;
