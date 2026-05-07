-- Bremen — bridge page / section graph into the generic entity graph.
--
-- This migration is intentionally additive. It does not remove or stop using
-- pages, sections, page_sections, or section_entities. It creates canonical
-- entity/relation mirrors so loaders and PONIX can migrate safely toward:
--
--   entities -> entity_relations -> entities

alter table public.entities
  add column if not exists source_table text,
  add column if not exists source_id uuid;

alter table public.entities
  drop constraint if exists entities_source_table_check;

alter table public.entities
  add constraint entities_source_table_check
  check (
    source_table is null
    or source_table in ('pages', 'sections')
  );

create unique index if not exists entities_source_ref_idx
  on public.entities(source_table, source_id)
  where source_table is not null and source_id is not null;

alter table public.entity_relations
  add column if not exists source_table text,
  add column if not exists source_id uuid;

alter table public.entity_relations
  drop constraint if exists entity_relations_source_table_check;

alter table public.entity_relations
  add constraint entity_relations_source_table_check
  check (
    source_table is null
    or source_table in ('page_sections', 'section_entities')
  );

create unique index if not exists entity_relations_source_ref_idx
  on public.entity_relations(source_table, source_id)
  where source_table is not null and source_id is not null;

insert into public.entity_schemas (
  schema_key,
  kind,
  version,
  label,
  description,
  table_name,
  renderer_key,
  relation_slots
)
values
  (
    'relation/page-section/v1',
    'relation',
    1,
    'Page section placement',
    'Ordered placement of a section entity on a page entity.',
    'entity_relations',
    null,
    array['sections']
  ),
  (
    'relation/section-entity/v1',
    'relation',
    1,
    'Section entity placement',
    'Ordered placement of a content entity inside a section entity.',
    'entity_relations',
    null,
    array['default']
  )
on conflict (schema_key) do update
set kind = excluded.kind,
    version = excluded.version,
    label = excluded.label,
    description = excluded.description,
    table_name = excluded.table_name,
    renderer_key = excluded.renderer_key,
    relation_slots = excluded.relation_slots,
    updated_at = now();

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

    new.schema_key := resolved_schema.schema_key;
    return new;
  end if;

  select id, schema_key, kind
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
  return new;
end;
$$;

revoke all on function private.resolve_content_schema_id() from public;

insert into public.entities (
  entity_type,
  schema_key,
  slug,
  title,
  subtitle,
  summary,
  published,
  sort_at,
  data,
  source_table,
  source_id,
  created_at,
  updated_at
)
select
  'page',
  'page/default/v1',
  'page:' || page_ref.slug,
  page_ref.title,
  page_ref.subtitle,
  page_ref.description,
  page_ref.published,
  page_ref.updated_at,
  jsonb_build_object(
    'slug', page_ref.slug,
    'props', page_ref.props
  ),
  'pages',
  page_ref.id,
  page_ref.created_at,
  page_ref.updated_at
from public.pages page_ref
where not exists (
  select 1
  from public.entities entity_ref
  where entity_ref.source_table = 'pages'
    and entity_ref.source_id = page_ref.id
);

update public.entities entity_ref
set schema_key = 'page/default/v1',
    entity_type = 'page',
    slug = 'page:' || page_ref.slug,
    title = page_ref.title,
    subtitle = page_ref.subtitle,
    summary = page_ref.description,
    published = page_ref.published,
    sort_at = page_ref.updated_at,
    data = jsonb_build_object(
      'slug', page_ref.slug,
      'props', page_ref.props
    ),
    updated_at = now()
from public.pages page_ref
where entity_ref.source_table = 'pages'
  and entity_ref.source_id = page_ref.id;

insert into public.entities (
  entity_type,
  schema_key,
  slug,
  title,
  subtitle,
  published,
  sort_at,
  data,
  source_table,
  source_id,
  created_at,
  updated_at
)
select
  'section',
  section_ref.schema_key,
  'section:' || section_ref.key,
  coalesce(section_ref.title, section_ref.key),
  section_ref.subtitle,
  section_ref.published,
  section_ref.updated_at,
  jsonb_build_object(
    'key', section_ref.key,
    'section_type', section_ref.section_type,
    'eyebrow', section_ref.eyebrow,
    'props', section_ref.props
  ),
  'sections',
  section_ref.id,
  section_ref.created_at,
  section_ref.updated_at
from public.sections section_ref
where not exists (
  select 1
  from public.entities entity_ref
  where entity_ref.source_table = 'sections'
    and entity_ref.source_id = section_ref.id
);

update public.entities entity_ref
set schema_key = section_ref.schema_key,
    entity_type = 'section',
    slug = 'section:' || section_ref.key,
    title = coalesce(section_ref.title, section_ref.key),
    subtitle = section_ref.subtitle,
    published = section_ref.published,
    sort_at = section_ref.updated_at,
    data = jsonb_build_object(
      'key', section_ref.key,
      'section_type', section_ref.section_type,
      'eyebrow', section_ref.eyebrow,
      'props', section_ref.props
    ),
    updated_at = now()
from public.sections section_ref
where entity_ref.source_table = 'sections'
  and entity_ref.source_id = section_ref.id;

insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table,
  source_id,
  created_at,
  updated_at
)
select
  page_entity.id,
  section_entity.id,
  'relation/page-section/v1',
  'contains_section',
  'sections',
  page_section.sort_order,
  page_section.props,
  'page_sections',
  page_section.id,
  page_section.created_at,
  page_section.updated_at
from public.page_sections page_section
join public.entities page_entity
  on page_entity.source_table = 'pages'
 and page_entity.source_id = page_section.page_id
join public.entities section_entity
  on section_entity.source_table = 'sections'
 and section_entity.source_id = page_section.section_id
where not exists (
  select 1
  from public.entity_relations relation_ref
  where relation_ref.source_table = 'page_sections'
    and relation_ref.source_id = page_section.id
);

update public.entity_relations relation_ref
set from_entity_id = page_entity.id,
    to_entity_id = section_entity.id,
    schema_key = 'relation/page-section/v1',
    relation_type = 'contains_section',
    slot = 'sections',
    sort_order = page_section.sort_order,
    props = page_section.props,
    updated_at = now()
from public.page_sections page_section
join public.entities page_entity
  on page_entity.source_table = 'pages'
 and page_entity.source_id = page_section.page_id
join public.entities section_entity
  on section_entity.source_table = 'sections'
 and section_entity.source_id = page_section.section_id
where relation_ref.source_table = 'page_sections'
  and relation_ref.source_id = page_section.id;

insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table,
  source_id,
  created_at,
  updated_at
)
select
  section_entity.id,
  content_entity.id,
  'relation/section-entity/v1',
  section_link.relation_type,
  section_link.slot,
  section_link.sort_order,
  section_link.props,
  'section_entities',
  section_link.id,
  section_link.created_at,
  section_link.updated_at
from public.section_entities section_link
join public.entities section_entity
  on section_entity.source_table = 'sections'
 and section_entity.source_id = section_link.section_id
join public.entities content_entity
  on content_entity.id = section_link.entity_id
where not exists (
  select 1
  from public.entity_relations relation_ref
  where relation_ref.source_table = 'section_entities'
    and relation_ref.source_id = section_link.id
);

update public.entity_relations relation_ref
set from_entity_id = section_entity.id,
    to_entity_id = content_entity.id,
    schema_key = 'relation/section-entity/v1',
    relation_type = section_link.relation_type,
    slot = section_link.slot,
    sort_order = section_link.sort_order,
    props = section_link.props,
    updated_at = now()
from public.section_entities section_link
join public.entities section_entity
  on section_entity.source_table = 'sections'
 and section_entity.source_id = section_link.section_id
join public.entities content_entity
  on content_entity.id = section_link.entity_id
where relation_ref.source_table = 'section_entities'
  and relation_ref.source_id = section_link.id;

create or replace function private.sync_page_entity_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.entities
    where source_table = 'pages'
      and source_id = old.id;
    return old;
  end if;

  update public.entities entity_ref
  set schema_key = 'page/default/v1',
      entity_type = 'page',
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
  where entity_ref.source_table = 'pages'
    and entity_ref.source_id = new.id;

  if found then
    return new;
  end if;

  insert into public.entities (
    entity_type,
    schema_key,
    slug,
    title,
    subtitle,
    summary,
    published,
    sort_at,
    data,
    source_table,
    source_id,
    created_at,
    updated_at
  )
  values (
    'page',
    'page/default/v1',
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
    'pages',
    new.id,
    new.created_at,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function private.sync_page_entity_bridge() from public;

create or replace function private.sync_section_entity_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.entities
    where source_table = 'sections'
      and source_id = old.id;
    return old;
  end if;

  update public.entities entity_ref
  set schema_key = new.schema_key,
      entity_type = 'section',
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
  where entity_ref.source_table = 'sections'
    and entity_ref.source_id = new.id;

  if found then
    return new;
  end if;

  insert into public.entities (
    entity_type,
    schema_key,
    slug,
    title,
    subtitle,
    published,
    sort_at,
    data,
    source_table,
    source_id,
    created_at,
    updated_at
  )
  values (
    'section',
    new.schema_key,
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
    'sections',
    new.id,
    new.created_at,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function private.sync_section_entity_bridge() from public;

create or replace function private.sync_page_section_relation_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  page_entity_id uuid;
  section_entity_id uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.entity_relations
    where source_table = 'page_sections'
      and source_id = old.id;
    return old;
  end if;

  select id into page_entity_id
  from public.entities
  where source_table = 'pages'
    and source_id = new.page_id;

  select id into section_entity_id
  from public.entities
  where source_table = 'sections'
    and source_id = new.section_id;

  if page_entity_id is null or section_entity_id is null then
    raise exception 'Cannot mirror page_sections %, missing page or section shadow entity', new.id;
  end if;

  update public.entity_relations relation_ref
  set from_entity_id = page_entity_id,
      to_entity_id = section_entity_id,
      schema_key = 'relation/page-section/v1',
      relation_type = 'contains_section',
      slot = 'sections',
      sort_order = new.sort_order,
      props = new.props,
      updated_at = now()
  where relation_ref.source_table = 'page_sections'
    and relation_ref.source_id = new.id;

  if found then
    return new;
  end if;

  insert into public.entity_relations (
    from_entity_id,
    to_entity_id,
    schema_key,
    relation_type,
    slot,
    sort_order,
    props,
    source_table,
    source_id,
    created_at,
    updated_at
  )
  values (
    page_entity_id,
    section_entity_id,
    'relation/page-section/v1',
    'contains_section',
    'sections',
    new.sort_order,
    new.props,
    'page_sections',
    new.id,
    new.created_at,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function private.sync_page_section_relation_bridge() from public;

create or replace function private.sync_section_entity_relation_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  section_entity_id uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.entity_relations
    where source_table = 'section_entities'
      and source_id = old.id;
    return old;
  end if;

  select id into section_entity_id
  from public.entities
  where source_table = 'sections'
    and source_id = new.section_id;

  if section_entity_id is null then
    raise exception 'Cannot mirror section_entities %, missing section shadow entity', new.id;
  end if;

  update public.entity_relations relation_ref
  set from_entity_id = section_entity_id,
      to_entity_id = new.entity_id,
      schema_key = 'relation/section-entity/v1',
      relation_type = new.relation_type,
      slot = new.slot,
      sort_order = new.sort_order,
      props = new.props,
      updated_at = now()
  where relation_ref.source_table = 'section_entities'
    and relation_ref.source_id = new.id;

  if found then
    return new;
  end if;

  insert into public.entity_relations (
    from_entity_id,
    to_entity_id,
    schema_key,
    relation_type,
    slot,
    sort_order,
    props,
    source_table,
    source_id,
    created_at,
    updated_at
  )
  values (
    section_entity_id,
    new.entity_id,
    'relation/section-entity/v1',
    new.relation_type,
    new.slot,
    new.sort_order,
    new.props,
    'section_entities',
    new.id,
    new.created_at,
    new.updated_at
  );

  return new;
end;
$$;

revoke all on function private.sync_section_entity_relation_bridge() from public;

drop trigger if exists pages_entity_bridge on public.pages;
create trigger pages_entity_bridge
  after insert or update or delete on public.pages
  for each row
  execute function private.sync_page_entity_bridge();

drop trigger if exists sections_entity_bridge on public.sections;
create trigger sections_entity_bridge
  after insert or update or delete on public.sections
  for each row
  execute function private.sync_section_entity_bridge();

drop trigger if exists page_sections_entity_relation_bridge on public.page_sections;
create trigger page_sections_entity_relation_bridge
  after insert or update or delete on public.page_sections
  for each row
  execute function private.sync_page_section_relation_bridge();

drop trigger if exists section_entities_entity_relation_bridge on public.section_entities;
create trigger section_entities_entity_relation_bridge
  after insert or update or delete on public.section_entities
  for each row
  execute function private.sync_section_entity_relation_bridge();
