# Legacy Mirror Stage 5 Runbook

Stage 5 removes the legacy composition mirror tables:

- `public.page_sections`
- `public.section_entities`

This is destructive. Do not apply the migration until a maintainer explicitly
approves the production write after reviewing the preflight output.

## Current Production Snapshot

Captured on 2026-05-09 with Supabase MCP read-only queries:

- `page_sections`: 16 rows.
- `section_entities`: 400 rows.
- `entity_relations.source_table = 'page_sections'`: 16 rows.
- `entity_relations.source_table = 'section_entities'`: 400 rows.
- Historical `cms_audit_events.target_table = 'page_sections'`: 11 rows.
- Historical `cms_audit_events.target_table = 'section_entities'`: 35 rows.
- No public/private views reference the legacy mirrors.

The graph rows are the canonical runtime source. The legacy row counts are kept
here only to make the destructive boundary explicit.

## Local Preflight

Run these before writing or applying the destructive migration:

```bash
pnpm run qa:legacy-mirror-stage5-preflight
pnpm run qa:content-graph
pnpm run qa:cms-schema-registry
pnpm run qa:cms-db-first-loaders
pnpm run qa:graph-primary-seed-writes
pnpm run qa:cms-legacy-bridge-boundary
pnpm run qa:cms-native-controls
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

`qa:legacy-mirror-stage5-preflight` is intentionally narrower than
`qa:legacy-mirror-readiness`: it fails only if blockers remain before Stage 5.
At this point, the expected remaining static references are historical
migrations, docs, static guard self-tests, and Stage 5 compatibility migrations.

## Supabase MCP Preflight

Run these as read-only checks immediately before approval/application:

```sql
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in ('page_sections', 'section_entities')
order by table_name;

select 'page_sections' as table_name, count(*)::int as rows
from public.page_sections
union all
select 'section_entities' as table_name, count(*)::int as rows
from public.section_entities;

select event_object_table as table_name, trigger_name, action_timing,
       event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('page_sections', 'section_entities', 'entity_relations')
order by event_object_table, trigger_name, event_manipulation;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('page_sections', 'section_entities')
order by tablename, policyname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('page_sections', 'section_entities')
order by tablename, indexname;

select n.nspname as schema, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.prokind in ('f', 'p')
  and pg_get_functiondef(p.oid) ~* '(page_sections|section_entities)'
order by schema, function_name, args;

select table_schema, table_name, view_definition
from information_schema.views
where table_schema in ('public', 'private')
  and view_definition ~* '(page_sections|section_entities)'
order by table_schema, table_name;

select source_table, count(*)::int as rows
from public.entity_relations
where source_table in ('page_sections', 'section_entities')
group by source_table
order by source_table;

select target_table, count(*)::int as rows
from public.cms_audit_events
where target_table in ('page_sections', 'section_entities')
group by target_table
order by target_table;
```

Expected function references before the destructive migration:

- `private.record_cms_audit_event()`
- `private.sync_page_section_relation_bridge()`
- `private.sync_section_entity_relation_bridge()`

Expected legacy table triggers before the destructive migration:

- `page_sections_cms_audit`
- `page_sections_entity_relation_bridge`
- `page_sections_set_updated_at`
- `section_entities_cms_audit`
- `section_entities_entity_relation_bridge`
- `section_entities_set_updated_at`

Expected entity relation bridge triggers before cleanup:

- `entity_relations_source_bridge_insert`
- `entity_relations_source_bridge_update`
- `entity_relations_source_bridge_delete`

## Migration Shape

The reviewed migration should avoid `cascade` unless a fresh catalog preflight
proves an unexpected dependency must be removed deliberately.

Recommended order:

1. Drop the no-op `entity_relations_source_bridge_*` triggers.
2. Drop legacy table triggers explicitly.
3. Drop obsolete bridge functions:
   `private.sync_page_section_relation_bridge()`,
   `private.sync_section_entity_relation_bridge()`, and
   `private.sync_entity_relation_source_bridge()`.
4. Replace `private.record_cms_audit_event()` without the legacy-table early
   return branch.
5. Drop `public.section_entities`.
6. Drop `public.page_sections`.
7. Regenerate `lib/supabase/types.ts`.
8. Run Supabase security and performance advisors.

## Rollback Plan

Preferred rollback is Supabase point-in-time recovery if the destructive
migration reaches production and a critical issue appears.

If PITR is unavailable, recreate the legacy tables from
`20260429000006_content_graph.sql` and backfill from canonical
`entity_relations` rows. The graph rows must remain untouched by the Stage 5
migration so this reconstruction path stays available.

Historical `cms_audit_events` rows should not be deleted as part of rollback or
forward migration; their `target_table` values are text audit history.
