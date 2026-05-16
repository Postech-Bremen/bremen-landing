# Supabase Setup and Safe Change Workflow

This document explains how to modify Supabase safely. If you only change React UI, you may not need most of this.

## Access Levels

| Contributor type | Needs | Can do |
| --- | --- | --- |
| App/UI contributor | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Run the app against the shared project. |
| Content/DB contributor | Dashboard or CLI access | Add migrations, edit graph data, upload assets, regenerate types. |
| Maintainer | service role key and admin access | Run maintenance scripts, apply sensitive migrations, manage Auth/SMTP/RLS settings. |

## Initial Setup

Ask a maintainer for:

- project ref
- project URL
- anon key
- whether to use shared remote Supabase or local Supabase

If you need Dashboard, CLI, or MCP access to the shared project, open an `Access request` issue first.

Access request guidance:

- Create or sign in to Supabase before asking for an invite.
- Use the same email as GitHub/Vercel if practical, but it is not required.
- Do not paste your email in a public issue unless you are comfortable with it being public.
- Write `sent privately` and send the email privately when needed.
- Ask for access only for a linked issue, PR, or maintenance task.

Create local env:

```bash
cp .env.local.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not add service role keys unless you are explicitly running a maintainer script.

## Supabase CLI

Use a one-off CLI runner:

```bash
pnpm dlx supabase --version
pnpm dlx supabase login
```

Link this repo to the remote project:

```bash
pnpm dlx supabase link --project-ref <project-ref>
```

The project ref is visible in:

```txt
https://supabase.com/dashboard/project/<project-ref>
```

Do not commit local CLI metadata, generated temp files, or secrets.

## Local Supabase

Local Supabase is useful for schema, RLS, and migration work.

Requirements:

- Docker running
- Supabase CLI available

Start:

```bash
pnpm dlx supabase start
```

Apply migrations and seed:

```bash
pnpm dlx supabase db reset
```

Use local keys:

```bash
pnpm dlx supabase status
```

`db reset` is for local development only. Never run destructive reset operations against production.

## Creating a Migration

Create:

```bash
pnpm dlx supabase migration new describe_change_in_snake_case
```

Edit the generated SQL in `supabase/migrations`.

Good names:

- `add_2026_history_milestone`
- `update_home_join_copy`
- `link_new_performance_recordings`
- `tighten_member_profile_policy`
- `add_cms_audit_events`

Bad names:

- `fix`
- `changes`
- `update_db`

## Testing a Migration

Local reset:

```bash
pnpm dlx supabase db reset
```

Apply pending migrations to an already-running local stack:

```bash
pnpm dlx supabase migration up
```

Then run:

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Applying to the Shared Project

Preferred flow:

1. Commit the migration.
2. Open a PR or issue-linked branch.
3. A maintainer reviews.
4. A maintainer applies it.
5. Regenerate types if schema changed.
6. Deploy if app behavior or required data changed.

Maintainers can apply migrations with:

```bash
pnpm dlx supabase db push
```

Maintainers using Supabase MCP can apply the same migration SQL with `apply_migration`, but the migration file must still be committed.

## Entity Schema Registry

`entity_schemas` is the durable DB registry for CMS content shapes. Change it
through migrations, not one-off dashboard edits, because schema changes affect
editor forms, renderer compatibility, and future content migrations.

Safe pattern:

1. Add or update a versioned `schema_key`, such as `video/youtube/v1`.
2. Keep existing schema keys active until all rows and renderers have migrated.
3. PONIX create forms should submit `schema_id`. Server code may still display
   `entity_schemas.schema_key` for human-readable routing and diagnostics, but
   content rows no longer carry duplicated `schema_key` or `entity_type`
   mirrors.
4. Keep renderer code reviewed in the app. DB rows may store a `renderer_key`,
   but must not define executable React behavior.
5. Apply production schema registry migrations only after review.

Avoid:

- Renaming or deactivating schema keys while rows still reference them.
- Making `fields` incompatible with the deployed PONIX editor.
- Using the schema registry to bypass RLS, ownership, or member-specific tables.
- Moving `members` into generic entities; member auth/profile data remains
  domain-specific.

## Storage and Member UGC

Public buckets are only appropriate for assets that may be downloaded by anyone
with the URL. For member-uploaded photos or videos, use the private
`member-media` bucket and enforce access through `storage.objects` RLS.

Current convention:

- Path: `member-media/{auth.uid()}/photos/...` or
  `member-media/{auth.uid()}/videos/...`
- Entity link: `entities.data.storage_bucket = "member-media"` and
  `entities.data.storage_path = <object path>`
- Approval: `entities.published`
- Visibility: `entities.visibility` (`public`, `members`, `private`)

Do not make a private/member-only asset public by storing its full public object
URL. Use Storage RLS and signed URL/download flows for protected media.
Member-facing uploads should use the browser Supabase client for the Storage
upload, then call a server action to create the entity row. Do not proxy direct
photo/video file bodies through a Server Action unless the file size is known to
stay below the configured body limit. Photos submitted from `/photos` are
published immediately for active approved members; moderation happens afterward
through the entity's `published` and `visibility` fields. The
`capture_owned_content()` trigger allows that immediate publish path only for
`photo/member-upload/v1` inserts with `visibility = 'public'` and
`gallery_include = true`; other member-owned entities still cannot be
self-published.

Public Storage buckets still exist for assets that are meant to be public:

- `images`: CMS thumbnails and imported public display assets.
- `photos` / `posters`: legacy public gallery and poster assets.
- `avatars`: member profile images; members can write only under their own
  `{auth.uid()}/...` folder.

These public buckets must stay image-only. Bucket configuration and
`storage.objects` policies enforce image MIME types, image extensions, and size
limits. Do not use them for member-only uploads, arbitrary attachments, or video
files.

## CMS Audit Trail

PONIX CMS write auditing is documented in `docs/cms-audit.md`.
The audit table is append-only and migration-backed. Do not add restore or
rollback controls without a separate issue that defines the exact recovery
behavior and safety checks.

## Type Generation

Regenerate types when tables, columns, enums, views, or function signatures change:

```bash
pnpm dlx supabase gen types typescript --project-id <project-ref> --schema public > lib/supabase/types.ts
```

Then run:

```bash
pnpm exec tsc --noEmit
```

Commit `lib/supabase/types.ts` with the migration.

## Service Role Rules

The service role key bypasses RLS. Treat it like production root access.

Allowed uses:

- `scripts/upload-seed-assets.mjs`
- `scripts/apply-scraped-content.mjs`
- `scripts/apply-instagram-feed.mjs`
- approved maintainer operations

Never:

- put it in `NEXT_PUBLIC_*`
- use it in browser/client code
- commit it
- paste it into issues, PRs, README examples, prompts, or chat logs
- hand it to an agent without a narrow maintainer task

## MCP Setup

The repo does not commit `.mcp.json`. Configure MCP locally:

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
codex mcp login supabase
```

Safe MCP operations:

- list tables and migrations
- inspect schema
- run read-only SQL
- run advisors
- generate types
- apply a reviewed migration file

Risky MCP operations that need explicit maintainer approval:

- `apply_migration`
- policy changes
- function changes
- auth-related changes
- storage policy changes
- writes to production content data

Forbidden MCP operations:

- dropping production tables
- truncating production tables
- disabling RLS
- deleting storage buckets
- resetting production DB
- applying unreviewed SQL generated by an agent
- using service role keys outside approved scripts

## Guardrail Checklist

Before any Supabase write:

- Is there an issue describing the change?
- Is the SQL represented in a migration file?
- Is the migration reversible or at least safe to re-run?
- Does it avoid hardcoded generated UUID dependencies?
- Does it preserve RLS?
- Does it avoid destructive `drop`, `truncate`, `delete all`, or broad `update` without `where`?
- Does it preserve auth/member ownership?
- Does it avoid service role exposure?
- Has a maintainer approved production application?

After any Supabase write:

- confirm affected pages still load
- run required section/entity count query
- run security advisors for policy/function changes
- regenerate types if schema changed
- run app quality gate

## Advisor Checks

Run Supabase advisors after DDL, RLS, function, or storage policy changes.

Expected unresolved warning:

- leaked password protection may need dashboard-side Auth configuration depending on plan/settings

Any new warning should be documented and fixed or explicitly accepted by a maintainer.
