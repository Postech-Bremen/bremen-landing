-- Bremen - make entity_type a schema-derived compatibility mirror.
--
-- schema_id is now required on graph records. Keep schema_key synchronized for
-- compatibility, and also derive entities.entity_type from
-- entity_schemas.semantic_kind so application writers no longer define broad
-- semantic identity independently from the schema registry.

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
  else
    raise exception 'resolve_content_schema_id is not configured for table %', tg_table_name;
  end if;

  if new.schema_id is not null then
    select id, schema_key, kind, semantic_kind, active
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

    new.schema_key := resolved_schema.schema_key;
    if tg_table_name = 'entities' then
      new.entity_type := resolved_schema.semantic_kind;
    end if;
    return new;
  end if;

  select id, schema_key, kind, semantic_kind
  into resolved_schema
  from public.entity_schemas
  where schema_key = new.schema_key
    and kind = any(expected_kinds)
    and active = true;

  if not found then
    raise exception 'Unknown active schema key % for expected kinds %',
      new.schema_key,
      array_to_string(expected_kinds, ', ');
  end if;

  new.schema_id := resolved_schema.id;
  if tg_table_name = 'entities' then
    new.entity_type := resolved_schema.semantic_kind;
  end if;
  return new;
end;
$$;

revoke all on function private.resolve_content_schema_id() from public;

update public.entities entity_ref
set entity_type = schema_ref.semantic_kind
from public.entity_schemas schema_ref
where entity_ref.schema_id = schema_ref.id
  and entity_ref.entity_type is distinct from schema_ref.semantic_kind;
