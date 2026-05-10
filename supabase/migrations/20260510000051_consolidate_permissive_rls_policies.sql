-- Bremen - consolidate overlapping permissive RLS policies.
--
-- Supabase advisor reports multiple permissive policies when public, owner,
-- and admin access are modeled as separate policies for the same command.
-- This migration preserves the same OR semantics in one policy per command and
-- keeps RLS enabled.

-- =====================================================================
-- entities
-- =====================================================================

drop policy if exists "entities_public_read" on public.entities;
drop policy if exists "entities_self_read" on public.entities;
drop policy if exists "entities_self_insert" on public.entities;
drop policy if exists "entities_self_update" on public.entities;
drop policy if exists "entities_admin_write" on public.entities;
drop policy if exists "entities_read_access" on public.entities;
drop policy if exists "entities_insert_access" on public.entities;
drop policy if exists "entities_update_access" on public.entities;
drop policy if exists "entities_admin_delete" on public.entities;

create policy "entities_read_access"
  on public.entities for select
  using (
    published = true
    or owner_member_id = private.current_member_id()
    or private.is_admin()
  );

create policy "entities_insert_access"
  on public.entities for insert
  with check (
    private.is_admin()
    or owner_member_id = private.current_member_id()
  );

create policy "entities_update_access"
  on public.entities for update
  using (
    private.is_admin()
    or owner_member_id = private.current_member_id()
  )
  with check (
    private.is_admin()
    or owner_member_id = private.current_member_id()
  );

create policy "entities_admin_delete"
  on public.entities for delete
  using (private.is_admin());

-- =====================================================================
-- entity_relations
-- =====================================================================

drop policy if exists "entity_relations_public_read" on public.entity_relations;
drop policy if exists "entity_relations_self_read" on public.entity_relations;
drop policy if exists "entity_relations_self_insert" on public.entity_relations;
drop policy if exists "entity_relations_self_update" on public.entity_relations;
drop policy if exists "entity_relations_admin_write" on public.entity_relations;
drop policy if exists "entity_relations_read_access" on public.entity_relations;
drop policy if exists "entity_relations_insert_access" on public.entity_relations;
drop policy if exists "entity_relations_update_access" on public.entity_relations;
drop policy if exists "entity_relations_admin_delete" on public.entity_relations;

create policy "entity_relations_read_access"
  on public.entity_relations for select
  using (
    private.is_admin()
    or (
      exists (
        select 1
        from public.entities source_entity
        where source_entity.id = from_entity_id
          and source_entity.published = true
      )
      and exists (
        select 1
        from public.entities target_entity
        where target_entity.id = to_entity_id
          and target_entity.published = true
      )
    )
    or exists (
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

create policy "entity_relations_insert_access"
  on public.entity_relations for insert
  with check (
    private.is_admin()
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  );

create policy "entity_relations_update_access"
  on public.entity_relations for update
  using (
    private.is_admin()
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  )
  with check (
    private.is_admin()
    or exists (
      select 1
      from public.entities source_entity
      where source_entity.id = from_entity_id
        and source_entity.owner_member_id = private.current_member_id()
    )
  );

create policy "entity_relations_admin_delete"
  on public.entity_relations for delete
  using (private.is_admin());

-- =====================================================================
-- entity_schemas
-- =====================================================================

drop policy if exists "entity_schemas_public_read" on public.entity_schemas;
drop policy if exists "entity_schemas_admin_write" on public.entity_schemas;
drop policy if exists "entity_schemas_read_access" on public.entity_schemas;
drop policy if exists "entity_schemas_admin_insert" on public.entity_schemas;
drop policy if exists "entity_schemas_admin_update" on public.entity_schemas;
drop policy if exists "entity_schemas_admin_delete" on public.entity_schemas;

create policy "entity_schemas_read_access"
  on public.entity_schemas for select
  using (
    active = true
    or private.is_admin()
  );

create policy "entity_schemas_admin_insert"
  on public.entity_schemas for insert
  with check (private.is_admin());

create policy "entity_schemas_admin_update"
  on public.entity_schemas for update
  using (private.is_admin())
  with check (private.is_admin());

create policy "entity_schemas_admin_delete"
  on public.entity_schemas for delete
  using (private.is_admin());

-- =====================================================================
-- members
-- =====================================================================

drop policy if exists "members_public_read" on public.members;
drop policy if exists "members_self_read" on public.members;
drop policy if exists "members_admin_read" on public.members;
drop policy if exists "members_self_update" on public.members;
drop policy if exists "members_admin_update" on public.members;
drop policy if exists "members_read_access" on public.members;
drop policy if exists "members_update_access" on public.members;

create policy "members_read_access"
  on public.members for select
  using (
    approved_at is not null
    or auth_user_id = (select auth.uid())
    or private.is_admin()
  );

create policy "members_update_access"
  on public.members for update
  using (
    auth_user_id = (select auth.uid())
    or private.is_admin()
  )
  with check (
    auth_user_id = (select auth.uid())
    or private.is_admin()
  );

-- =====================================================================
-- pages
-- =====================================================================

drop policy if exists "pages_public_read" on public.pages;
drop policy if exists "pages_admin_write" on public.pages;
drop policy if exists "pages_read_access" on public.pages;
drop policy if exists "pages_admin_insert" on public.pages;
drop policy if exists "pages_admin_update" on public.pages;
drop policy if exists "pages_admin_delete" on public.pages;

create policy "pages_read_access"
  on public.pages for select
  using (
    published = true
    or private.is_admin()
  );

create policy "pages_admin_insert"
  on public.pages for insert
  with check (private.is_admin());

create policy "pages_admin_update"
  on public.pages for update
  using (private.is_admin())
  with check (private.is_admin());

create policy "pages_admin_delete"
  on public.pages for delete
  using (private.is_admin());

-- =====================================================================
-- sections
-- =====================================================================

drop policy if exists "sections_public_read" on public.sections;
drop policy if exists "sections_admin_write" on public.sections;
drop policy if exists "sections_read_access" on public.sections;
drop policy if exists "sections_admin_insert" on public.sections;
drop policy if exists "sections_admin_update" on public.sections;
drop policy if exists "sections_admin_delete" on public.sections;

create policy "sections_read_access"
  on public.sections for select
  using (
    published = true
    or private.is_admin()
  );

create policy "sections_admin_insert"
  on public.sections for insert
  with check (private.is_admin());

create policy "sections_admin_update"
  on public.sections for update
  using (private.is_admin())
  with check (private.is_admin());

create policy "sections_admin_delete"
  on public.sections for delete
  using (private.is_admin());
