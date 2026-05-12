-- Bremen - drop content-row schema mirror columns.
--
-- DESTRUCTIVE: this drops duplicated compatibility columns from content rows:
-- - public.entities.schema_key
-- - public.entities.entity_type
-- - public.entity_relations.schema_key
-- - public.sections.schema_key
--
-- Keep public.entity_schemas.schema_key. It remains the stable, human-readable
-- registry key used to resolve schema ids and CMS metadata.

create or replace function private.resolve_content_schema_id()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  expected_kinds text[];
  resolved_schema record;
begin
  if tg_table_name = 'entities' then
    expected_kinds := array['entity', 'page', 'section'];
  elsif tg_table_name = 'entity_relations' then
    expected_kinds := array['relation'];
  elsif tg_table_name = 'sections' then
    expected_kinds := array['section'];
  else
    raise exception 'resolve_content_schema_id is not configured for table %', tg_table_name;
  end if;

  if new.schema_id is null then
    raise exception 'schema_id is required for %', tg_table_name;
  end if;

  select id, schema_key, kind, active
  into resolved_schema
  from public.entity_schemas
  where id = new.schema_id;

  if not found then
    raise exception 'Unknown schema id %', new.schema_id;
  end if;

  if not (resolved_schema.kind = any(expected_kinds)) then
    raise exception 'Schema % has kind %, expected one of %',
      resolved_schema.schema_key,
      resolved_schema.kind,
      array_to_string(expected_kinds, ', ');
  end if;

  if resolved_schema.active is not true then
    raise exception 'Schema % is not active', resolved_schema.schema_key;
  end if;

  return new;
end;
$$;

revoke all on function private.resolve_content_schema_id() from public;

drop trigger if exists entities_resolve_schema_id on public.entities;
create trigger entities_resolve_schema_id
  before insert or update of schema_id on public.entities
  for each row
  execute function private.resolve_content_schema_id();

drop trigger if exists entity_relations_resolve_schema_id on public.entity_relations;
create trigger entity_relations_resolve_schema_id
  before insert or update of schema_id on public.entity_relations
  for each row
  execute function private.resolve_content_schema_id();

drop trigger if exists sections_resolve_schema_id on public.sections;
create trigger sections_resolve_schema_id
  before insert or update of schema_id on public.sections
  for each row
  execute function private.resolve_content_schema_id();

alter table public.entities
  drop constraint if exists entities_entity_type_check,
  drop constraint if exists entities_schema_key_check,
  drop column if exists entity_type,
  drop column if exists schema_key;

alter table public.entity_relations
  drop constraint if exists entity_relations_schema_key_check,
  drop column if exists schema_key;

alter table public.sections
  drop constraint if exists sections_schema_key_check,
  drop column if exists schema_key;
