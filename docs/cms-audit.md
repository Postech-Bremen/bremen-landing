# CMS Audit and Revision Strategy

PONIX CMS writes are admin-gated, but they still mutate shared content rows.
The audit layer is intentionally append-only and recovery-focused: it records
what changed, but it does not add broad rollback controls in the first slice.

## Current Content Graph Audit Scope

Migration `20260505000039_cms_audit_events.sql` introduced
`public.cms_audit_events`. After the legacy mirror removals in
`20260509000048_drop_legacy_mirror_tables.sql` and
`20260513000067_drop_page_section_compat_tables.sql`, active CMS content graph
audit coverage is centered on:

- `entities`
- `entity_relations`

Historical audit rows can still contain `target_table` values for removed
legacy mirror or compatibility tables such as `pages`, `sections`,
`page_sections`, and `section_entities`. Treat those as immutable history, not
active write targets.

Each audit event stores:

- `actor_member_id`: current member resolved from Supabase Auth when available
- `action`: `insert`, `update`, or `delete`
- `target_table` and `target_id`
- `before_data` and `after_data` row snapshots
- `changed_keys`: top-level row keys that changed
- `metadata`: reserved JSONB object for future narrow annotations

## Why Trigger-Based

The CMS already has several write paths. Trigger-based audit logging keeps the
recording behavior close to the data boundary, so future PONIX actions do not
silently bypass audit logging.

The app may still surface audit events, but app UI is not the authority for
creating them.

## RLS and Access

`cms_audit_events` has RLS enabled.

- Admin members can read audit events.
- Admin members can insert audit events if a future server action needs a
  narrow manual annotation.
- Trigger writes run through a private `security definer` function.

No public CMS route exposes this data.

## Migration Safety

The app treats the audit table as best-effort until the migration is applied.
If production deploys before the migration, PONIX still loads and simply hides
the recent-audit surface.

Production migration application still requires maintainer review and an
explicit migration apply step.

## Non-Goals

- No broad restore or rollback UI.
- No destructive delete controls.
- No logging of auth tokens, secrets, or request payloads.
- No auditing of `members` or auth tables in this slice.

## Future Work

Useful next slices:

- Detail-page audit history for one record.
- Admin-only diff viewer for `before_data` and `after_data`.
- Narrow restore flow with explicit field-level preview and confirmation.
- Scheduled retention/export policy if the audit table grows too large.
