-- Bremen - harden public Storage buckets without changing their public asset role.
--
-- `images`, `photos`, `posters`, and `avatars` intentionally serve public
-- assets. Keep them public, but constrain uploads by MIME type, file size, and
-- object extension so public buckets cannot become arbitrary file stores.

update storage.buckets
set file_size_limit = case id
    when 'avatars' then 5242880
    else 20971520
  end,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
where id in ('avatars', 'images', 'photos', 'posters');

alter policy "storage_avatars_self_insert"
  on storage.objects
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

alter policy "storage_avatars_self_update"
  on storage.objects
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

alter policy "storage_avatars_self_delete"
  on storage.objects
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

alter policy "storage_admin_avatars"
  on storage.objects
  to authenticated
  using (
    bucket_id = 'avatars'
    and private.is_admin()
  )
  with check (
    bucket_id = 'avatars'
    and private.is_admin()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

alter policy "storage_admin_images"
  on storage.objects
  to authenticated
  using (
    bucket_id = 'images'
    and private.is_admin()
  )
  with check (
    bucket_id = 'images'
    and private.is_admin()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );

alter policy "storage_admin_photos_posters"
  on storage.objects
  to authenticated
  using (
    bucket_id in ('photos', 'posters')
    and private.is_admin()
  )
  with check (
    bucket_id in ('photos', 'posters')
    and private.is_admin()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  );
