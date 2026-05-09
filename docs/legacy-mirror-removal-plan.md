# Legacy Mirror Removal Plan

This document stages the removal of the legacy composition mirror tables:

- `page_sections`
- `section_entities`

The current production-safe state is graph-primary runtime composition with
legacy mirrors kept only for compatibility and their own transition triggers.
Do not drop the legacy tables until every pre-Stage-5 blocker reported by
`pnpm run qa:legacy-mirror-stage5-preflight` is clear and a maintainer has
explicitly approved the destructive migration.

## Current State

Completed:

- Public page composition reads from `entity_relations`.
- PONIX relation loaders read from `entity_relations`.
- Runtime CMS code no longer reads `page_sections` or `section_entities`.
- Runtime composition now identifies graph relations by relation `schema_key`
  instead of legacy table-name markers.
- Routine CMS composition writes target `entity_relations`.
- Graph-to-legacy mirror writes are retired by replacing the source bridge
  function with a no-op.
- Legacy mirror audit writes, admin write policies, and legacy-only query
  indexes are superseded by the Stage 3 operational cleanup migration.
- Content graph QA validates graph-internal page composition integrity without
  reading the legacy mirrors.
- Legacy mirror compatibility triggers remain for the legacy tables themselves.

Remaining blocker classes:

- Legacy mirror compatibility migrations still mention the legacy tables.

## Stage 1: Canonical Graph Identity

Goal: make graph composition independent from legacy table identity.

Current blocker category:

- `graph_source_marker`
- `schema_registry_compatibility`

Work:

- Stop treating `page_sections` and `section_entities` as runtime relation
  kinds. They are table names, not long-term graph semantics.
- Decide the canonical replacement before migrating data. Likely candidates are
  relation schema keys, relation kinds, or a new compatibility column that can
  be removed later.
- Ensure UI/actions use `entity_relations.id` as the primary mutation id and do
  not depend on legacy `source_id` for composition editing.
- Keep the migration additive first. Do not overwrite or delete the legacy
  markers until code and QA can read the canonical representation.

Exit checks:

- Runtime loaders and actions no longer filter composition by legacy table-name
  markers except through an explicitly named compatibility layer.
- `qa:legacy-mirror-readiness` no longer reports runtime graph source marker
  blockers outside that compatibility layer.
- `qa:cms-legacy-bridge-boundary`, `qa:cms-db-first-loaders`, typecheck, lint,
  and build pass.

## Stage 2: Bridge Trigger Retirement

Goal: stop writing legacy mirror rows from graph writes.

Current blocker category:

- `active_bridge_migration`

Work:

- Add a migration that supersedes the graph-to-legacy source bridge behavior.
- Preserve reversibility: keep data intact and drop/disable only the sync path
  after Stage 1 proves runtime no longer needs legacy identity.
- Run parity QA before and after the migration so data drift is visible.
- Regenerate Supabase types if schema-level constraints or columns change.

Exit checks:

- Graph writes no longer attempt to maintain `page_sections` or
  `section_entities`.
- Runtime and maintenance writes no longer populate legacy relation
  `source_table` markers.
- The graph-to-legacy source bridge function is superseded by a no-op migration.
- Supabase advisors do not report new RLS or performance regressions.

## Stage 3: Audit, Policy, And Index Cleanup

Goal: remove active operational dependencies on the legacy mirrors.

Current blocker categories:

- `active_audit_migration`
- `active_index_policy_migration`

Work:

- Update audit trigger target allowlists so they no longer require the legacy
  tables.
- Remove active indexes and helper policies that exist only for mirror reads or
  writes.
- Preserve RLS. Never disable row level security to make cleanup easier.

Exit checks:

- `qa:legacy-mirror-readiness` no longer reports active audit, policy, or index
  blockers.
- Supabase security and performance advisors are checked after the migration.

## Stage 4: Parity QA Retirement

Goal: stop using legacy mirrors as the truth source.

Cleared blocker category:

- `parity_qa`

Work:

- Replace graph-vs-legacy parity QA with graph-internal integrity QA.
- Validate page composition, section ordering, relation cardinality, and missing
  entity references directly from `entity_relations`.
- Keep historical migrations untouched.

Exit checks:

- `qa:content-graph` no longer requires legacy mirror table reads.
- A graph-only QA command covers the integrity checks previously provided by
  parity comparisons.

Status: complete. `qa:content-graph` now reads published page composition from
`entity_relations` and checks page/section shadow cardinality, relation
contracts, ordering, and missing or unpublished targets directly from the graph.

## Stage 5: Legacy Table Removal

Goal: remove `page_sections` and `section_entities`.

Preconditions:

- Stages 1-4 are complete.
- `qa:legacy-mirror-stage5-preflight` reports no blockers before Stage 5.
- Production catalog preflight has been run with Supabase MCP.
- Supabase types, app build, and all CMS QA pass.
- A maintainer explicitly approves the destructive migration.

Work:

- Apply a reviewed migration that drops only the legacy tables and obsolete
  constraints/functions proven unused by the previous stages.
- Remove remaining legacy mirror compatibility trigger/function definitions.
- Preserve historical audit rows as text records; do not delete
  `cms_audit_events` rows for legacy table names.
- Regenerate Supabase types.
- Run security and performance advisors.

Exit checks:

- No runtime, QA, migration, docs, or generated-code path expects live legacy
  mirror tables.
- Production pages and PONIX CMS composition editing still pass smoke tests.

## Guardrails

- Do not run destructive SQL without explicit maintainer approval.
- Do not disable RLS.
- Do not rewrite historical migrations.
- Do not remove parity QA before graph-only QA exists.
- Do not collapse all stages into one migration. Each stage should leave a
  reversible, testable state.
