-- Bremen — DB-backed entity schema registry foundation.
--
-- This migration is intentionally additive. It starts moving the CMS model
-- toward:
--   entity_schemas
--   entities
--   entity_relations
--
-- Existing pages / sections / page_sections / section_entities remain active
-- while the public renderers and PONIX editors are migrated incrementally.

create table if not exists public.entity_schemas (
  id             uuid primary key default gen_random_uuid(),
  schema_key     text not null unique,
  kind           text not null,
  version        int not null default 1,
  label          text not null,
  description    text not null default '',
  table_name     text not null,
  renderer_key   text,
  fields         jsonb not null default '[]'::jsonb,
  validation     jsonb not null default '{}'::jsonb,
  relation_slots text[] not null default '{}',
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (length(btrim(schema_key)) > 0),
  check (kind in ('page', 'section', 'entity', 'relation')),
  check (version > 0),
  check (length(btrim(label)) > 0),
  check (
    table_name in (
      'pages',
      'sections',
      'entities',
      'page_sections',
      'section_entities',
      'entity_relations'
    )
  ),
  check (jsonb_typeof(fields) = 'array'),
  check (jsonb_typeof(validation) = 'object')
);

create index if not exists entity_schemas_kind_active_idx
  on public.entity_schemas(kind, active, schema_key);

create trigger entity_schemas_set_updated_at
  before update on public.entity_schemas
  for each row
  execute function public.set_updated_at();

alter table public.entity_schemas enable row level security;

drop policy if exists "entity_schemas_public_read"
  on public.entity_schemas;
create policy "entity_schemas_public_read"
  on public.entity_schemas
  for select
  using (active = true);

drop policy if exists "entity_schemas_admin_write"
  on public.entity_schemas;
create policy "entity_schemas_admin_write"
  on public.entity_schemas
  for all
  using (private.is_admin())
  with check (private.is_admin());

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
    'page/default/v1',
    'page',
    1,
    'Page',
    'Routable page record and page-level metadata.',
    'pages',
    'page',
    array['sections']
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
select
  section_schema.schema_key,
  'section',
  coalesce(nullif((regexp_match(section_schema.schema_key, '/v([0-9]+)$'))[1], '')::int, 1),
  initcap(replace(replace(split_part(section_schema.schema_key, '/', 2), '-', ' '), '_', ' ')),
  'Migrated from existing sections.schema_key. Field definitions still live in the code registry until the DB registry is fully populated.',
  'sections',
  section_schema.section_type,
  array['default']
from (
  select distinct on (schema_key) schema_key, section_type
  from public.sections
  where schema_key is not null
    and length(btrim(schema_key)) > 0
  order by schema_key, section_type
) as section_schema
on conflict (schema_key) do update
set kind = excluded.kind,
    version = excluded.version,
    label = excluded.label,
    description = excluded.description,
    table_name = excluded.table_name,
    renderer_key = excluded.renderer_key,
    updated_at = now();

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
select
  entity_schema.schema_key,
  'entity',
  coalesce(nullif((regexp_match(entity_schema.schema_key, '/v([0-9]+)$'))[1], '')::int, 1),
  initcap(replace(split_part(entity_schema.schema_key, '/', 1), '_', ' ')),
  'Migrated from existing entities.schema_key. Field definitions still live in the code registry until the DB registry is fully populated.',
  'entities',
  split_part(entity_schema.schema_key, '/', 1),
  '{}'::text[]
from (
  select distinct schema_key
  from public.entities
  where schema_key is not null
    and length(btrim(schema_key)) > 0
) as entity_schema
on conflict (schema_key) do update
set kind = excluded.kind,
    version = excluded.version,
    label = excluded.label,
    description = excluded.description,
    table_name = excluded.table_name,
    renderer_key = excluded.renderer_key,
    updated_at = now();

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
    'performance/v1',
    'entity',
    1,
    'Performance',
    'Canonical performance or event record.',
    'entities',
    'performance',
    '{}'::text[]
  ),
  (
    'performance/scraped/v1',
    'entity',
    1,
    'Scraped performance',
    'Performance record generated from YouTube or Instagram source data.',
    'entities',
    'performance',
    '{}'::text[]
  ),
  (
    'video/v1',
    'entity',
    1,
    'Video',
    'YouTube recording entity.',
    'entities',
    'video',
    '{}'::text[]
  ),
  (
    'video/youtube/v1',
    'entity',
    1,
    'YouTube video',
    'YouTube recording imported from the Bremen channel.',
    'entities',
    'video',
    '{}'::text[]
  ),
  (
    'playlist/youtube/v1',
    'entity',
    1,
    'YouTube playlist',
    'YouTube playlist or performance collection imported from the Bremen channel.',
    'entities',
    'playlist',
    '{}'::text[]
  ),
  (
    'photo/v1',
    'entity',
    1,
    'Photo',
    'Generic photo entity.',
    'entities',
    'photo',
    '{}'::text[]
  ),
  (
    'photo/instagram-grid/v1',
    'entity',
    1,
    'Instagram photo',
    'Instagram-sourced gallery or performance update entity.',
    'entities',
    'photo',
    '{}'::text[]
  ),
  (
    'post/instagram/v1',
    'entity',
    1,
    'Instagram post',
    'Instagram-sourced post used for performance updates, notices, and gallery curation.',
    'entities',
    'post',
    '{}'::text[]
  ),
  (
    'stat/home-number/v1',
    'entity',
    1,
    'Home stat',
    'Statistic card used by the home stats section.',
    'entities',
    'stat',
    '{}'::text[]
  ),
  (
    'activity/home-card/v1',
    'entity',
    1,
    'Home activity',
    'Activity card used by the home activities section.',
    'entities',
    'activity',
    '{}'::text[]
  ),
  (
    'history/milestone/v1',
    'entity',
    1,
    'History milestone',
    'History timeline item.',
    'entities',
    'history',
    '{}'::text[]
  ),
  (
    'navigation/item/v1',
    'entity',
    1,
    'Navigation item',
    'Header navigation item.',
    'entities',
    'navigation',
    '{}'::text[]
  ),
  (
    'contact/site-footer/v1',
    'entity',
    1,
    'Footer contact',
    'Footer contact item.',
    'entities',
    'contact',
    '{}'::text[]
  ),
  (
    'social/site-footer/v1',
    'entity',
    1,
    'Footer social link',
    'Footer social link item.',
    'entities',
    'social',
    '{}'::text[]
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
    'relation/default/v1',
    'relation',
    1,
    'Default relation',
    'Fallback schema for existing entity_relations rows. Relation-specific schemas can be added once relation editing moves to DB-backed schema definitions.',
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

alter table public.entities
  add column if not exists schema_id uuid
    references public.entity_schemas(id) on delete restrict;

create index if not exists entities_schema_id_idx
  on public.entities(schema_id);

update public.entities entity_ref
set schema_id = schema_ref.id
from public.entity_schemas schema_ref
where entity_ref.schema_id is null
  and schema_ref.kind = 'entity'
  and schema_ref.schema_key = entity_ref.schema_key;

alter table public.entity_relations
  add column if not exists schema_key text not null default 'relation/default/v1',
  add column if not exists schema_id uuid
    references public.entity_schemas(id) on delete restrict;

alter table public.entity_relations
  drop constraint if exists entity_relations_schema_key_check;

alter table public.entity_relations
  add constraint entity_relations_schema_key_check
  check (length(btrim(schema_key)) > 0);

create index if not exists entity_relations_schema_id_idx
  on public.entity_relations(schema_id);

update public.entity_relations relation_ref
set schema_id = schema_ref.id
from public.entity_schemas schema_ref
where relation_ref.schema_id is null
  and schema_ref.kind = 'relation'
  and schema_ref.schema_key = relation_ref.schema_key;

create or replace function private.resolve_content_schema_id()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  expected_kind text;
  resolved_schema record;
begin
  if tg_table_name = 'entities' then
    expected_kind := 'entity';
  elsif tg_table_name = 'entity_relations' then
    expected_kind := 'relation';
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

    if resolved_schema.kind <> expected_kind then
      raise exception 'Schema % has kind %, expected %',
        resolved_schema.schema_key,
        resolved_schema.kind,
        expected_kind;
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
    and kind = expected_kind
    and active = true;

  if not found then
    raise exception 'Unknown active % schema key %', expected_kind, new.schema_key;
  end if;

  new.schema_id := resolved_schema.id;
  return new;
end;
$$;

revoke all on function private.resolve_content_schema_id() from public;

drop trigger if exists entities_resolve_schema_id on public.entities;
create trigger entities_resolve_schema_id
  before insert or update of schema_id, schema_key on public.entities
  for each row
  execute function private.resolve_content_schema_id();

drop trigger if exists entity_relations_resolve_schema_id on public.entity_relations;
create trigger entity_relations_resolve_schema_id
  before insert or update of schema_id, schema_key on public.entity_relations
  for each row
  execute function private.resolve_content_schema_id();

alter table public.cms_audit_events
  drop constraint if exists cms_audit_events_target_table_check;

alter table public.cms_audit_events
  add constraint cms_audit_events_target_table_check
  check (
    target_table in (
      'pages',
      'sections',
      'entities',
      'entity_schemas',
      'page_sections',
      'section_entities',
      'entity_relations'
    )
  );

drop trigger if exists entity_schemas_cms_audit on public.entity_schemas;
create trigger entity_schemas_cms_audit
  after insert or update or delete on public.entity_schemas
  for each row
  execute function private.record_cms_audit_event();
