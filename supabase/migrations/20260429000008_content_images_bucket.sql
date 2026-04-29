-- Bremen — shared public image bucket for content thumbnails
--
-- `photos`, `posters`, and `avatars` remain available, but scraped and
-- normalized display assets use one public `images` bucket so entities can
-- store a single full public URL in `thumbnail_url`.

insert into storage.buckets (id, name, public)
  values ('images', 'images', true)
  on conflict (id) do update
  set public = excluded.public;

drop policy if exists "storage_public_read_images" on storage.objects;
create policy "storage_public_read_images"
  on storage.objects for select
  using (bucket_id = 'images');

drop policy if exists "storage_admin_images" on storage.objects;
create policy "storage_admin_images"
  on storage.objects for all
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());
