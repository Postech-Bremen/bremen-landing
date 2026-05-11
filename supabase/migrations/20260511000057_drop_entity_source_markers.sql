-- Bremen - remove page/section shadow source markers from entities.
--
-- Page and section shadow entities already have deterministic slugs:
--   page:<pages.slug>
--   section:<sections.key>
-- The CMS now resolves shadows from those slugs, so the legacy
-- `entities.source_table/source_id` bridge markers can be removed.

create or replace function private.sync_page_entity_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.entities
    where schema_key = 'page/default/v1'
      and slug = 'page:' || old.slug;
    return old;
  end if;

  if tg_op = 'UPDATE' then
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
    where entity_ref.schema_key = 'page/default/v1'
      and entity_ref.slug = 'page:' || old.slug;

    if found then
      return new;
    end if;
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
    new.created_at,
    new.updated_at
  )
  on conflict (slug) do update
  set schema_key = excluded.schema_key,
      entity_type = excluded.entity_type,
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

create or replace function private.sync_section_entity_bridge()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.entities
    where schema_key like 'section/%'
      and slug = 'section:' || old.key;
    return old;
  end if;

  if tg_op = 'UPDATE' then
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
    where entity_ref.schema_key like 'section/%'
      and entity_ref.slug = 'section:' || old.key;

    if found then
      return new;
    end if;
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
    new.created_at,
    new.updated_at
  )
  on conflict (slug) do update
  set schema_key = excluded.schema_key,
      entity_type = excluded.entity_type,
      title = excluded.title,
      subtitle = excluded.subtitle,
      published = excluded.published,
      sort_at = excluded.sort_at,
      data = excluded.data,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

drop index if exists public.entities_source_ref_idx;

alter table public.entities
  drop constraint if exists entities_source_table_check,
  drop column if exists source_table,
  drop column if exists source_id;
