-- =====================================================================
-- PAVO CLUB — schema.sql   (run FIRST in Supabase SQL Editor)
-- Tables, constraints, indexes, triggers and RPC functions.
-- Row Level Security is enabled in policies.sql (run SECOND).
-- Buckets and storage policies are in storage.sql (run THIRD).
-- =====================================================================

-- ---------- helpers ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- user_roles (who is an admin) -------------------------------
create table public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------- club_settings (single row, id = 1) -------------------------
create table public.club_settings (
  id              smallint primary key default 1 check (id = 1),
  name_ar         text,
  name_en         text default 'PAVO CLUB',
  slogan_ar       text,
  slogan_en       text,
  description_ar  text,
  description_en  text,
  logo_path       text,
  cover_path      text,
  founded_on      date,
  stadium_ar      text,
  stadium_en      text,
  city_ar         text,
  city_en         text,
  country_ar      text,
  country_en      text,
  email           text,
  phone           text,
  address_ar      text,
  address_en      text,
  social_links    jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  color_primary   text check (color_primary is null or color_primary ~ '^#[0-9A-Fa-f]{6}$'),
  color_accent    text check (color_accent  is null or color_accent  ~ '^#[0-9A-Fa-f]{6}$'),
  color_pitch     text check (color_pitch   is null or color_pitch   ~ '^#[0-9A-Fa-f]{6}$'),
  default_lang    text not null default 'ar' check (default_lang in ('ar','en')),
  timezone        text not null default 'UTC',
  show_players    boolean not null default true,
  show_matches    boolean not null default true,
  show_lineup     boolean not null default true,
  show_news       boolean not null default false,
  show_gallery    boolean not null default false,
  home_players_limit smallint not null default 8  check (home_players_limit  between 1 and 24),
  home_matches_limit smallint not null default 3  check (home_matches_limit  between 1 and 10),
  players_page_size  smallint not null default 12 check (players_page_size   between 4 and 48),
  matches_page_size  smallint not null default 12 check (matches_page_size   between 4 and 48),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.validate_club_timezone()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform now() at time zone new.timezone;   -- raises an error for unknown zones
  return new;
exception when others then
  raise exception 'invalid_timezone: %', new.timezone using errcode = '22023';
end $$;
create trigger club_settings_tz before insert or update on public.club_settings
  for each row execute function public.validate_club_timezone();
create trigger club_settings_updated before update on public.club_settings
  for each row execute function public.set_updated_at();

-- ---------- players ------------------------------------------------------
create table public.players (
  id             uuid primary key default gen_random_uuid(),
  full_name_ar   text,
  full_name_en   text,
  slug           text not null unique,
  jersey_number  smallint check (jersey_number between 0 and 99),
  position       text check (position in ('GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','CF','ST')),
  nationality_ar text,
  nationality_en text,
  date_of_birth  date,
  height_cm      smallint check (height_cm  is null or height_cm  between 100 and 250),
  weight_kg      smallint check (weight_kg  is null or weight_kg  between 30  and 200),
  preferred_foot text check (preferred_foot in ('right','left','both')),
  player_photo   text,
  biography_ar   text,
  biography_en   text,
  is_active      boolean not null default true,
  is_published   boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint players_has_name check (
    coalesce(btrim(full_name_ar), '') <> '' or coalesce(btrim(full_name_en), '') <> '')
);
-- one ACTIVE player per shirt number (inactive/archived players may reuse it)
create unique index players_jersey_active_uq on public.players (jersey_number)
  where is_active and jersey_number is not null;
create index players_public_idx on public.players (display_order, jersey_number)
  where is_published and is_active;

create or replace function public.players_before_write()
returns trigger language plpgsql set search_path = '' as $$
declare base text;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base := lower(regexp_replace(coalesce(new.full_name_en, ''), '[^a-zA-Z0-9]+', '-', 'g'));
    base := btrim(base, '-');
    if base = '' then base := 'player'; end if;
    new.slug := base || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  return new;
end $$;
create trigger players_slug before insert or update on public.players
  for each row execute function public.players_before_write();
create trigger players_updated before update on public.players
  for each row execute function public.set_updated_at();

-- ---------- competitions -------------------------------------------------
create table public.competitions (
  id            uuid primary key default gen_random_uuid(),
  name_ar       text,
  name_en       text,
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint competitions_has_name check (
    coalesce(btrim(name_ar), '') <> '' or coalesce(btrim(name_en), '') <> '')
);
create trigger competitions_updated before update on public.competitions
  for each row execute function public.set_updated_at();

-- ---------- matches ------------------------------------------------------
-- PAVO CLUB is always "the club" (its name/logo come from club_settings).
-- club_is_home says on which side it plays, so the club result never depends
-- on comparing team-name strings.
create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete restrict,
  season         text,
  opponent_ar    text,
  opponent_en    text,
  opponent_logo  text,
  club_is_home   boolean not null default true,
  kickoff_at     timestamptz not null,
  venue_ar       text,
  venue_en       text,
  status         text not null default 'scheduled'
                 check (status in ('scheduled','live','completed','postponed','cancelled','abandoned')),
  home_score     smallint check (home_score >= 0),
  away_score     smallint check (away_score >= 0),
  match_report_ar text,
  match_report_en text,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint matches_has_opponent check (
    coalesce(btrim(opponent_ar), '') <> '' or coalesce(btrim(opponent_en), '') <> ''),
  constraint matches_scores_match_status check (
    (status in ('scheduled','postponed','cancelled') and home_score is null and away_score is null)
    or
    (status in ('live','completed','abandoned') and home_score is not null and away_score is not null))
);
create index matches_public_idx on public.matches (is_published, kickoff_at desc);
create index matches_status_idx on public.matches (status, kickoff_at);
create index matches_comp_idx   on public.matches (competition_id);
create trigger matches_updated before update on public.matches
  for each row execute function public.set_updated_at();

-- ---------- lineups --------------------------------------------------------
-- A match has at most ONE draft and ONE published lineup.
-- Editing a published lineup happens on the draft; the published copy stays
-- visible until the admin publishes the draft (publish_lineup replaces it).
create table public.lineups (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches(id) on delete restrict,
  formation     text not null default '4-3-3'
                check (formation ~ '^(custom|[0-9]+(-[0-9]+){1,4})$'),
  status        text not null default 'draft' check (status in ('draft','published')),
  is_published  boolean generated always as (status = 'published') stored,
  coach_name_ar text,
  coach_name_en text,
  notes_ar      text,
  notes_en      text,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint lineups_one_per_status unique (match_id, status)
);
create index lineups_status_idx on public.lineups (status, match_id);

create or replace function public.lineups_before_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  elsif new.status = 'draft' then
    new.published_at := null;
  end if;
  return new;
end $$;
create trigger lineups_status before insert or update on public.lineups
  for each row execute function public.lineups_before_write();
create trigger lineups_updated before update on public.lineups
  for each row execute function public.set_updated_at();

-- ---------- lineup_players ---------------------------------------------------
create table public.lineup_players (
  id             uuid primary key default gen_random_uuid(),
  lineup_id      uuid not null references public.lineups(id) on delete cascade,
  player_id      uuid not null references public.players(id) on delete restrict,
  role           text not null check (role in ('starter','bench')),
  position_label text check (position_label in ('GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','CF','ST')),
  x_percent      numeric(5,2) check (x_percent between 0 and 100),
  y_percent      numeric(5,2) check (y_percent between 0 and 100),
  is_captain     boolean not null default false,
  bench_order    smallint check (bench_order >= 1),
  display_order  smallint not null default 0,
  constraint lineup_players_unique_player unique (lineup_id, player_id),
  constraint lineup_players_role_shape check (
    (role = 'starter' and x_percent is not null and y_percent is not null and bench_order is null)
    or
    (role = 'bench' and x_percent is null and y_percent is null and bench_order is not null)),
  constraint lineup_players_captain_is_starter check (not is_captain or role = 'starter')
);
create unique index lineup_players_one_captain on public.lineup_players (lineup_id) where is_captain;
create unique index lineup_players_bench_order_uq on public.lineup_players (lineup_id, bench_order) where role = 'bench';
create index lineup_players_player_idx on public.lineup_players (player_id);

-- at most 11 starters, and a published lineup is frozen
create or replace function public.lineup_players_guard()
returns trigger language plpgsql set search_path = '' as $$
declare n integer; parent_status text;
begin
  if tg_op in ('INSERT','UPDATE') and new.role = 'starter' then
    select count(*) into n from public.lineup_players
      where lineup_id = new.lineup_id and role = 'starter' and id <> new.id;
    if n >= 11 then
      raise exception 'too_many_starters' using errcode = '23514';
    end if;
  end if;
  select status into parent_status from public.lineups
    where id = case when tg_op = 'DELETE' then old.lineup_id else new.lineup_id end;
  if parent_status = 'published' then
    raise exception 'published_lineup_is_frozen' using errcode = '23514';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger lineup_players_guard_trg before insert or update or delete on public.lineup_players
  for each row execute function public.lineup_players_guard();

-- ---------- news ------------------------------------------------------------
create table public.news (
  id           uuid primary key default gen_random_uuid(),
  title_ar     text,
  title_en     text,
  body_ar      text,
  body_en      text,
  cover_path   text,
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint news_has_title check (
    coalesce(btrim(title_ar), '') <> '' or coalesce(btrim(title_en), '') <> '')
);
create index news_public_idx on public.news (is_published, published_at desc);
create trigger news_updated before update on public.news
  for each row execute function public.set_updated_at();

-- ---------- gallery_items -----------------------------------------------------
create table public.gallery_items (
  id            uuid primary key default gen_random_uuid(),
  image_path    text not null,
  caption_ar    text,
  caption_en    text,
  display_order integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index gallery_public_idx on public.gallery_items (is_published, display_order, created_at desc);
create trigger gallery_updated before update on public.gallery_items
  for each row execute function public.set_updated_at();

-- ---------- visibility helpers (SECURITY DEFINER, used by RLS) -------------------
create or replace function public.lineup_is_public(p_lineup_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lineups l join public.matches m on m.id = l.match_id
    where l.id = p_lineup_id and l.status = 'published' and m.is_published);
$$;

create or replace function public.player_in_public_lineup(p_player_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lineup_players lp
    join public.lineups l on l.id = lp.lineup_id
    join public.matches m on m.id = l.match_id
    where lp.player_id = p_player_id and l.status = 'published' and m.is_published);
$$;

-- ---------- lineup RPCs (atomic, run with the caller's RLS) -----------------------
-- p_data = { formation, coach_name_ar, coach_name_en, notes_ar, notes_en,
--            players: [ {player_id, role, position_label, x_percent, y_percent,
--                        is_captain, bench_order} ... ] }
create or replace function public.save_lineup_draft(p_match_id uuid, p_data jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select id into v_id from public.lineups where match_id = p_match_id and status = 'draft';
  if v_id is null then
    insert into public.lineups (match_id, formation, status, coach_name_ar, coach_name_en, notes_ar, notes_en)
    values (p_match_id, coalesce(nullif(p_data->>'formation',''), 'custom'), 'draft',
            nullif(p_data->>'coach_name_ar',''), nullif(p_data->>'coach_name_en',''),
            nullif(p_data->>'notes_ar',''), nullif(p_data->>'notes_en',''))
    returning id into v_id;
  else
    update public.lineups set
      formation     = coalesce(nullif(p_data->>'formation',''), 'custom'),
      coach_name_ar = nullif(p_data->>'coach_name_ar',''),
      coach_name_en = nullif(p_data->>'coach_name_en',''),
      notes_ar      = nullif(p_data->>'notes_ar',''),
      notes_en      = nullif(p_data->>'notes_en','')
    where id = v_id;
    delete from public.lineup_players where lineup_id = v_id;
  end if;

  insert into public.lineup_players
    (lineup_id, player_id, role, position_label, x_percent, y_percent, is_captain, bench_order, display_order)
  select v_id, (e->>'player_id')::uuid, e->>'role', nullif(e->>'position_label',''),
         (e->>'x_percent')::numeric, (e->>'y_percent')::numeric,
         coalesce((e->>'is_captain')::boolean, false), (e->>'bench_order')::smallint, (ord)::smallint
  from jsonb_array_elements(coalesce(p_data->'players', '[]'::jsonb)) with ordinality as t(e, ord);

  return v_id;
end $$;

create or replace function public.publish_lineup(p_lineup_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare l public.lineups; n_start integer; n_gk integer;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  select * into l from public.lineups where id = p_lineup_id;
  if not found then raise exception 'lineup_not_found'; end if;
  if l.status <> 'draft' then raise exception 'lineup_not_draft'; end if;

  select count(*), count(*) filter (where position_label = 'GK')
    into n_start, n_gk
  from public.lineup_players where lineup_id = p_lineup_id and role = 'starter';
  if n_start <> 11 then raise exception 'lineup_needs_11_starters' using errcode = '23514'; end if;
  if n_gk <> 1     then raise exception 'lineup_needs_one_goalkeeper' using errcode = '23514'; end if;

  -- replace the currently published version of this match (children cascade)
  delete from public.lineups where match_id = l.match_id and status = 'published';
  update public.lineups set status = 'published' where id = p_lineup_id;
end $$;

create or replace function public.unpublish_lineup(p_lineup_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare l public.lineups;
begin
  if not (select public.is_admin()) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  select * into l from public.lineups where id = p_lineup_id;
  if not found then raise exception 'lineup_not_found'; end if;
  if l.status <> 'published' then raise exception 'lineup_not_published'; end if;
  if exists (select 1 from public.lineups where match_id = l.match_id and status = 'draft') then
    raise exception 'draft_exists' using errcode = '23505';
  end if;
  update public.lineups set status = 'draft' where id = p_lineup_id;
end $$;

-- function execute rights
revoke all on function public.save_lineup_draft(uuid, jsonb) from public, anon;
revoke all on function public.publish_lineup(uuid)           from public, anon;
revoke all on function public.unpublish_lineup(uuid)         from public, anon;
grant execute on function public.save_lineup_draft(uuid, jsonb) to authenticated;
grant execute on function public.publish_lineup(uuid)           to authenticated;
grant execute on function public.unpublish_lineup(uuid)         to authenticated;
grant execute on function public.is_admin()                     to anon, authenticated;
