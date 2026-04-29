-- Bremen — move SECURITY DEFINER RLS helpers out of the exposed public schema.
--
-- Supabase exposes functions in the `public` schema through PostgREST RPC.
-- These helpers are only meant to be called from policies/triggers, so keep
-- them in a private schema and update all policy references.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.members
    where auth_user_id = (select auth.uid())
      and role = 'admin'
      and approved_at is not null
  );
$$;

create or replace function private.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.members
    where auth_user_id = (select auth.uid())
      and approved_at is not null
      and status = 'active'
  );
$$;

create or replace function private.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id
  from public.members
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.is_active_member() from public;
revoke all on function private.current_member_id() from public;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_active_member() to anon, authenticated;
grant execute on function private.current_member_id() to anon, authenticated;

create or replace function public.prevent_member_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
begin
  if (select auth.uid()) is not null and not private.is_admin() then
    new.role          = old.role;
    new.email         = old.email;
    new.student_year  = old.student_year;
    new.position      = old.position;
    new.approved_at   = old.approved_at;
    new.approved_by   = old.approved_by;
  end if;
  return new;
end;
$$;

create or replace function public.capture_owned_content()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
begin
  if (select auth.uid()) is not null and not private.is_admin() then
    if tg_op = 'INSERT' then
      new.owner_member_id = coalesce(new.owner_member_id, private.current_member_id());
      new.published = false;
    else
      new.owner_member_id = old.owner_member_id;
      new.published = old.published;
    end if;
  end if;

  return new;
end;
$$;

alter policy "members_admin_read"
  on public.members
  using (private.is_admin());

alter policy "members_admin_update"
  on public.members
  using (private.is_admin())
  with check (private.is_admin());

alter policy "members_admin_insert"
  on public.members
  with check (private.is_admin());

alter policy "members_admin_delete"
  on public.members
  using (private.is_admin());

alter policy "performances_admin_read_all"
  on public.performances
  using (private.is_admin());

alter policy "performances_admin_write"
  on public.performances
  using (private.is_admin())
  with check (private.is_admin());

alter policy "videos_admin_read_all"
  on public.videos
  using (private.is_admin());

alter policy "videos_admin_write"
  on public.videos
  using (private.is_admin())
  with check (private.is_admin());

alter policy "photos_admin_read_all"
  on public.photos
  using (private.is_admin());

alter policy "photos_admin_write"
  on public.photos
  using (private.is_admin())
  with check (private.is_admin());

alter policy "entities_self_read"
  on public.entities
  using (owner_member_id = private.current_member_id());

alter policy "entities_self_insert"
  on public.entities
  with check (owner_member_id = private.current_member_id());

alter policy "entities_self_update"
  on public.entities
  using (owner_member_id = private.current_member_id())
  with check (owner_member_id = private.current_member_id());

alter policy "entities_admin_write"
  on public.entities
  using (private.is_admin())
  with check (private.is_admin());

alter policy "entity_relations_self_read"
  on public.entity_relations
  using (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
    or exists (
      select 1
      from public.entities target_entity
      where target_entity.id = to_entity_id
        and target_entity.owner_member_id = private.current_member_id()
    )
  );

alter policy "entity_relations_self_insert"
  on public.entity_relations
  with check (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  );

alter policy "entity_relations_self_update"
  on public.entity_relations
  using (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  )
  with check (
    exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  );

alter policy "entity_relations_admin_write"
  on public.entity_relations
  using (private.is_admin())
  with check (private.is_admin());

alter policy "pages_admin_write"
  on public.pages
  using (private.is_admin())
  with check (private.is_admin());

alter policy "sections_admin_write"
  on public.sections
  using (private.is_admin())
  with check (private.is_admin());

alter policy "page_sections_admin_write"
  on public.page_sections
  using (private.is_admin())
  with check (private.is_admin());

alter policy "section_entities_admin_write"
  on public.section_entities
  using (private.is_admin())
  with check (private.is_admin());

alter policy "storage_admin_photos_posters"
  on storage.objects
  using (
    bucket_id in ('photos', 'posters')
    and private.is_admin()
  )
  with check (
    bucket_id in ('photos', 'posters')
    and private.is_admin()
  );

alter policy "storage_admin_avatars"
  on storage.objects
  using (bucket_id = 'avatars' and private.is_admin())
  with check (bucket_id = 'avatars' and private.is_admin());

alter policy "storage_admin_images"
  on storage.objects
  using (bucket_id = 'images' and private.is_admin())
  with check (bucket_id = 'images' and private.is_admin());

drop function if exists public.current_member_id();
drop function if exists public.is_active_member();
drop function if exists public.is_admin();
