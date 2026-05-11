-- Make sections use schema_id as the canonical schema reference.
-- sections.schema_key remains as a trigger-maintained compatibility mirror.

alter table public.sections
  add column if not exists schema_id uuid
  references public.entity_schemas(id) on delete restrict;

create index if not exists sections_schema_id_idx
  on public.sections(schema_id);

update public.sections section_ref
set schema_id = schema_ref.id
from public.entity_schemas schema_ref
where section_ref.schema_id is null
  and schema_ref.schema_key = section_ref.schema_key
  and schema_ref.kind = 'section'
  and schema_ref.active = true;

do $$
begin
  if exists (
    select 1
    from public.sections section_ref
    where section_ref.schema_id is null
  ) then
    raise exception 'Cannot require sections.schema_id: unresolved section schema rows remain';
  end if;
end;
$$;

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

drop trigger if exists sections_resolve_schema_id on public.sections;
create trigger sections_resolve_schema_id
  before insert or update of schema_id, schema_key on public.sections
  for each row
  execute function private.resolve_content_schema_id();

alter table public.sections
  alter column schema_id set not null;

create or replace function private.sync_section_entity_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.entities
    where schema_id in (
        select id
        from public.entity_schemas
        where kind = 'section'
      )
      and slug = 'section:' || old.key;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    update public.entities entity_ref
    set schema_id = new.schema_id,
        slug = 'section:' || new.key,
        title = coalesce(new.title, new.key),
        subtitle = new.subtitle,
        published = new.published,
        sort_at = new.updated_at,
        data = jsonb_build_object(
          'key', new.key,
          'section_type', new.section_type,
          'eyebrow', new.eyebrow,
          'props', new.props
        ),
        updated_at = now()
    where entity_ref.schema_id in (
        select id
        from public.entity_schemas
        where kind = 'section'
      )
      and entity_ref.slug = 'section:' || old.key;

    if found then
      return new;
    end if;
  end if;

  insert into public.entities (
    schema_id,
    slug,
    title,
    subtitle,
    published,
    sort_at,
    data,
    created_at,
    updated_at
  )
  values (
    new.schema_id,
    'section:' || new.key,
    coalesce(new.title, new.key),
    new.subtitle,
    new.published,
    new.updated_at,
    jsonb_build_object(
      'key', new.key,
      'section_type', new.section_type,
      'eyebrow', new.eyebrow,
      'props', new.props
    ),
    new.created_at,
    new.updated_at
  )
  on conflict (slug) do update
  set schema_id = excluded.schema_id,
      title = excluded.title,
      subtitle = excluded.subtitle,
      published = excluded.published,
      sort_at = excluded.sort_at,
      data = excluded.data,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

revoke all on function private.sync_section_entity_bridge() from public;
