-- Bremen - prepare content-row schema mirror removal.
--
-- This migration is intentionally non-destructive:
-- - add schema_id composite indexes that match current runtime query shapes
-- - retire remaining page shadow bridge DML reads/writes of entities.schema_key
--   and entities.entity_type
-- - drop superseded schema_key/entity_type indexes only after schema_id
--   replacements exist
--
-- It does not drop compatibility columns. That final step needs a separate
-- reviewed destructive migration after readiness QA and maintainer approval.

create index if not exists entities_schema_id_sort_at_idx
  on public.entities(schema_id, sort_at desc);

create index if not exists entity_relations_schema_id_from_sort_idx
  on public.entity_relations(schema_id, from_entity_id, sort_order);

create index if not exists entity_relations_schema_id_from_slot_sort_idx
  on public.entity_relations(schema_id, from_entity_id, slot, sort_order);

create index if not exists entity_relations_schema_id_to_slot_sort_idx
  on public.entity_relations(schema_id, to_entity_id, slot, sort_order);

create or replace function private.sync_page_entity_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  page_schema_id uuid;
begin
  select id into page_schema_id
  from public.entity_schemas
  where schema_key = 'page/default/v1'
    and kind = 'page'
    and active = true;

  if page_schema_id is null then
    raise exception 'Missing active page schema page/default/v1';
  end if;

  if tg_op = 'DELETE' then
    delete from public.entities
    where schema_id = page_schema_id
      and slug = 'page:' || old.slug;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    update public.entities entity_ref
    set schema_id = page_schema_id,
        slug = 'page:' || new.slug,
        title = new.title,
        subtitle = new.subtitle,
        summary = new.description,
        published = new.published,
        sort_at = new.updated_at,
        data = jsonb_build_object(
          'slug', new.slug,
          'props', new.props
        ),
        updated_at = now()
    where entity_ref.schema_id = page_schema_id
      and entity_ref.slug = 'page:' || old.slug;

    if found then
      return new;
    end if;
  end if;

  insert into public.entities (
    schema_id,
    slug,
    title,
    subtitle,
    summary,
    published,
    sort_at,
    data,
    created_at,
    updated_at
  )
  values (
    page_schema_id,
    'page:' || new.slug,
    new.title,
    new.subtitle,
    new.description,
    new.published,
    new.updated_at,
    jsonb_build_object(
      'slug', new.slug,
      'props', new.props
    ),
    new.created_at,
    new.updated_at
  )
  on conflict (slug) do update
  set schema_id = excluded.schema_id,
      title = excluded.title,
      subtitle = excluded.subtitle,
      summary = excluded.summary,
      published = excluded.published,
      sort_at = excluded.sort_at,
      data = excluded.data,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_page_entity_bridge() from public;

drop index if exists public.entities_schema_sort_at_idx;
drop index if exists public.entities_type_idx;
drop index if exists public.entity_relations_schema_from_sort_idx;
drop index if exists public.entity_relations_schema_from_slot_sort_idx;
drop index if exists public.entity_relations_schema_to_slot_sort_idx;
