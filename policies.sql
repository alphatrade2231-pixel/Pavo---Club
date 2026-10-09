-- =====================================================================
-- PAVO CLUB — policies.sql   (run SECOND; safe to re-run)
-- Row Level Security for every table exposed through the Supabase API.
--   * visitors (anon + signed-in non-admins): read PUBLISHED data only
--   * admins (rows in user_roles): full control
--   * nobody can grant themselves a role from the browser
-- =====================================================================

alter table public.user_roles     enable row level security;
alter table public.club_settings  enable row level security;
alter table public.players        enable row level security;
alter table public.competitions   enable row level security;
alter table public.matches        enable row level security;
alter table public.lineups        enable row level security;
alter table public.lineup_players enable row level security;
alter table public.news           enable row level security;
alter table public.gallery_items  enable row level security;

-- defence in depth: anonymous visitors never get write privileges at all
revoke insert, update, delete, truncate on all tables in schema public from anon;
-- signed-in users cannot write user_roles from the API (roles are granted in the SQL editor)
revoke insert, update, delete, truncate on public.user_roles from authenticated;

-- ---------------- user_roles ----------------
drop policy if exists user_roles_read_own on public.user_roles;
create policy user_roles_read_own on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()));
-- (no insert / update / delete policies on purpose)

-- ---------------- club_settings ----------------
drop policy if exists club_settings_public_read   on public.club_settings;
drop policy if exists club_settings_admin_insert  on public.club_settings;
drop policy if exists club_settings_admin_update  on public.club_settings;
create policy club_settings_public_read on public.club_settings
  for select to anon, authenticated using (true);
create policy club_settings_admin_insert on public.club_settings
  for insert to authenticated with check ((select public.is_admin()));
create policy club_settings_admin_update on public.club_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- players ----------------
drop policy if exists players_public_read on public.players;
drop policy if exists players_admin_all   on public.players;
create policy players_public_read on public.players
  for select to anon, authenticated
  using (is_published and (is_active or public.player_in_public_lineup(id)));
create policy players_admin_all on public.players
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- competitions ----------------
drop policy if exists competitions_public_read on public.competitions;
drop policy if exists competitions_admin_all   on public.competitions;
create policy competitions_public_read on public.competitions
  for select to anon, authenticated using (true);
create policy competitions_admin_all on public.competitions
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- matches ----------------
drop policy if exists matches_public_read on public.matches;
drop policy if exists matches_admin_all   on public.matches;
create policy matches_public_read on public.matches
  for select to anon, authenticated using (is_published);
create policy matches_admin_all on public.matches
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- lineups ----------------
drop policy if exists lineups_public_read on public.lineups;
drop policy if exists lineups_admin_all   on public.lineups;
create policy lineups_public_read on public.lineups
  for select to anon, authenticated using (public.lineup_is_public(id));
create policy lineups_admin_all on public.lineups
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- lineup_players ----------------
drop policy if exists lineup_players_public_read on public.lineup_players;
drop policy if exists lineup_players_admin_all   on public.lineup_players;
create policy lineup_players_public_read on public.lineup_players
  for select to anon, authenticated using (public.lineup_is_public(lineup_id));
create policy lineup_players_admin_all on public.lineup_players
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- news ----------------
drop policy if exists news_public_read on public.news;
drop policy if exists news_admin_all   on public.news;
create policy news_public_read on public.news
  for select to anon, authenticated using (is_published and published_at <= now());
create policy news_admin_all on public.news
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------- gallery_items ----------------
drop policy if exists gallery_public_read on public.gallery_items;
drop policy if exists gallery_admin_all   on public.gallery_items;
create policy gallery_public_read on public.gallery_items
  for select to anon, authenticated using (is_published);
create policy gallery_admin_all on public.gallery_items
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
