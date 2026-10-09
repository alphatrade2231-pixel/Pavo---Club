-- =====================================================================
-- PAVO CLUB — storage.sql   (run THIRD; safe to re-run)
-- Creates the four public-read image buckets and the admin-only write policies.
-- Buckets are "public" so <img src> works with getPublicUrl(); the API
-- still blocks upload / replace / delete / list for everyone except admins.
-- Object paths are random UUIDs, so unpublished images are not guessable.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('club-assets',    'club-assets',    true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('player-photos',  'player-photos',  true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('news-images',    'news-images',    true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('gallery-images', 'gallery-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists pavo_images_admin_select on storage.objects;
drop policy if exists pavo_images_admin_insert on storage.objects;
drop policy if exists pavo_images_admin_update on storage.objects;
drop policy if exists pavo_images_admin_delete on storage.objects;

create policy pavo_images_admin_select on storage.objects
  for select to authenticated
  using (bucket_id in ('club-assets','player-photos','news-images','gallery-images')
         and (select public.is_admin()));

create policy pavo_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('club-assets','player-photos','news-images','gallery-images')
              and (select public.is_admin()));

create policy pavo_images_admin_update on storage.objects
  for update to authenticated
  using      (bucket_id in ('club-assets','player-photos','news-images','gallery-images')
              and (select public.is_admin()))
  with check (bucket_id in ('club-assets','player-photos','news-images','gallery-images')
              and (select public.is_admin()));

create policy pavo_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('club-assets','player-photos','news-images','gallery-images')
         and (select public.is_admin()));
