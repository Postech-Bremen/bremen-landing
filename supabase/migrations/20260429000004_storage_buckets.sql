-- Bremen — storage buckets + policies
--
-- Buckets:
--   photos    public read · admin write           — gallery
--   posters   public read · admin write           — performance posters
--   avatars   public read · members write own folder — member profile pics

insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('posters', 'posters', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- =====================================================================
-- public read for all three buckets
-- =====================================================================

create policy "storage_public_read"
  on storage.objects for select
  using (bucket_id in ('photos', 'posters', 'avatars'));

-- =====================================================================
-- admin write/update/delete for photos + posters
-- =====================================================================

create policy "storage_admin_photos_posters"
  on storage.objects for all
  using (
    bucket_id in ('photos', 'posters')
    and public.is_admin()
  )
  with check (
    bucket_id in ('photos', 'posters')
    and public.is_admin()
  );

-- =====================================================================
-- avatars: members can write to a folder named by their auth.uid()
-- path convention: avatars/{auth.uid()}/filename.jpg
-- =====================================================================

create policy "storage_avatars_self_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "storage_avatars_self_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "storage_avatars_self_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- admins can also manage any avatar
create policy "storage_admin_avatars"
  on storage.objects for all
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());
