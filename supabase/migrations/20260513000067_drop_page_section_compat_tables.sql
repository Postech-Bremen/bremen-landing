-- Remove the remaining page/section compatibility tables.
--
-- Fresh Supabase MCP preflight on 2026-05-13 showed:
-- - public.pages exists with 6 rows and public.sections exists with 19 rows.
-- - No external foreign keys or views reference public.pages/public.sections.
-- - Remaining dependencies are table-local triggers, policies, indexes, and
--   the private page/section bridge functions removed below.
--
-- This migration intentionally avoids cascade. Historical cms_audit_events rows
-- whose target_table is pages or sections remain immutable text history.

do $$
begin
  if to_regclass('public.pages') is not null then
    execute 'drop trigger if exists pages_cms_audit on public.pages';
    execute 'drop trigger if exists pages_entity_bridge on public.pages';
    execute 'drop trigger if exists pages_set_updated_at on public.pages';
  end if;

  if to_regclass('public.sections') is not null then
    execute 'drop trigger if exists sections_cms_audit on public.sections';
    execute 'drop trigger if exists sections_entity_bridge on public.sections';
    execute 'drop trigger if exists sections_resolve_schema_id on public.sections';
    execute 'drop trigger if exists sections_set_updated_at on public.sections';
  end if;
end
$$;

drop function if exists private.sync_page_entity_bridge();
drop function if exists private.sync_section_entity_bridge();

create or replace function private.resolve_content_schema_id()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private'
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

drop table if exists public.pages;
drop table if exists public.sections;
