# Bremen Landing

<p>
  <strong>POSTECH band club Bremen's public website and archive.</strong><br />
  A CMS-ready landing site for performances, recordings, photos, history, and member profiles.
</p>

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=flat-square" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?style=flat-square" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-content%20graph-3ecf8e?style=flat-square" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=flat-square" />
</p>

## Overview

Bremen Landing is the public web home for **브레멘 Bremen**, POSTECH's band club. It is not just a static landing page. The site is built as an editorial archive backed by a Supabase content graph, so performances, videos, photos, history entries, and site chrome can move toward a CMS without rewriting the UI.

The current site includes:

- Home page with curated hero video, stats, stage highlights, upcoming schedule, activities, and Join Us section
- Performance archive grouped by event and season
- YouTube recording archive with search, event filter, sorting, and pagination
- Pinterest-style photo gallery
- Bremen history timeline
- Member roster, login/signup, member profile editing, and profile image upload
- Supabase Auth, Storage, RLS policies, and seed migrations

## Current Production Shape

- App host: Vercel
- Data/auth/storage: Supabase
- Email delivery: Supabase Custom SMTP through Resend
- Public repository: safe as long as local env files and service role keys are not committed

Runtime env required by the app:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Server-side maintenance scripts may require:

```bash
# Set SUPABASE_SERVICE_ROLE_KEY locally when running maintenance scripts.
```

## Architecture

The content model is intentionally CMS-friendly:

```txt
pages
  -> page_sections
    -> sections
      -> section_entities
        -> entities
```

The core idea is simple:

- `pages` define routable page-level content records such as `home`, `performances`, `videos`, `photos`, `history`, and `site`.
- `sections` define renderer blocks such as `entity_feature`, `entity_grid`, `entity_masonry`, `entity_timeline`, `site_navigation`, and `site_footer`.
- `page_sections` define which sections appear on which page and in what order.
- `entities` define reusable content units such as videos, photos, stats, performances, posts, history milestones, activities, navigation items, and social links.
- `section_entities` define which entities appear inside a section and in what order.
- `entity_relations` define domain relations such as performance to recording, performance to photo, or performance to post.
- `members` remains a domain-specific table because auth/profile ownership, member status, and claim matching are not generic content.

The UI renderer is selected by `section_type`. Actual content is loaded from Supabase. Required content no longer falls back to mock arrays. If a required DB section or entity is missing, the page should fail visibly instead of silently showing stale fake content.

## Directory Map

```txt
app/                    Next.js App Router pages and server actions
components/             Page sections, editorial primitives, UI components
components/ui/          shadcn/Radix component wrappers
lib/data/               Content graph loaders and domain mappers
lib/supabase/           Supabase client/server helpers and generated types
scripts/                Content scraping/upload/apply utilities
supabase/migrations/    Durable database, RLS, storage, and seed migrations
supabase/seed.sql       Supabase seed entrypoint
```

Important files:

- `lib/data/content-graph.ts`: central loader for page/section/entity data
- `components/home-section.tsx`: home renderers keyed by section keys
- `components/performances-section.tsx`: performance playlist and season renderers
- `components/videos-section.tsx`: recording archive UI
- `components/photos-section.tsx`: gallery UI
- `components/history-section.tsx`: timeline UI
- `components/navigation.tsx` and `components/footer.tsx`: site chrome loaded from the `site` page graph
- `app/auth/actions.ts`: signup/signin/profile update actions

## Contribution Guide

Before changing anything, decide which layer owns the change.

### Change Decision Table

| Task | Change Supabase? | Change code? | Notes |
| --- | --- | --- | --- |
| Edit page copy, section title, CTA text, filter labels | Yes | Usually no | Update `sections` columns or `sections.props` through a migration or admin tooling. |
| Reorder sections on a page | Yes | No | Update `page_sections.sort_order`. |
| Curate videos/photos/stats shown in a section | Yes | No | Update `section_entities` links and sort order. |
| Add a new video/photo/performance/history entry | Yes | Usually no | Insert an `entity`, then link it to sections and relations. |
| Add a new member or fix member profile claim data | Yes | Maybe | Usually `members` table only. Code changes only if claim rules change. |
| Add a new visual section type | Yes | Yes | Add/seed a `section_type`, then implement a renderer. |
| Change card layout, carousel behavior, filters, pagination, animation | No | Yes | This is renderer/application code. |
| Change auth rules, RLS, storage policies, triggers | Yes | Maybe | Use migrations. Re-run Supabase advisors after changes. |
| Add profile/content image assets | Yes | Maybe | Upload to Supabase Storage and store public URL in DB. Code only if flow changes. |
| Change SMTP, auth redirect URLs, Vercel env, custom domains | Dashboard/config | No | Document operational changes. Do not encode secrets in repo. |

### Supabase Initial Setup

There are three different levels of Supabase access. Most contributors only need the first one.

| Contributor type | Needs | Can do |
| --- | --- | --- |
| App/UI contributor | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Run the app against the shared Supabase project. |
| Content/DB contributor | Supabase Dashboard access or CLI access | Add migrations, edit content graph data, upload assets, regenerate types. |
| Maintainer | Service role key and project owner/admin access | Run maintenance scripts, apply sensitive migrations, manage Auth/SMTP/RLS settings. |

#### 1. Get Project Values

Ask a maintainer for:

- Supabase project ref
- Supabase project URL
- Supabase anon key
- Whether you should use the shared remote project or a local Supabase stack

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not add service role keys unless you are explicitly running maintenance scripts.

#### 2. Install and Log In to Supabase CLI

Use either a global CLI or one-off runner. The repo does not require the CLI as a runtime dependency.

```bash
pnpm dlx supabase --version
pnpm dlx supabase login
```

If you prefer a global install, follow the official Supabase CLI install method for your machine.

#### 3. Link the Remote Project

Link this working copy to the Supabase project:

```bash
pnpm dlx supabase link --project-ref <project-ref>
```

The project ref is the ID in the Supabase dashboard URL:

```txt
https://supabase.com/dashboard/project/<project-ref>
```

This creates local Supabase CLI metadata. Do not commit local CLI state or secrets.

#### 4. Optional: Use Supabase Locally

Local Supabase is useful for schema/RLS work, but normal UI work can use the remote project.

Requirements:

- Docker running
- Supabase CLI available

Start local Supabase:

```bash
pnpm dlx supabase start
```

Apply all migrations and seed data to the local database:

```bash
pnpm dlx supabase db reset
```

Use `pnpm dlx supabase status` to get local API URL and anon key if you want the app to point at local Supabase.

Do not run destructive reset commands against production. `db reset` is for local development.

#### 5. Create a Migration

For durable DB/content changes, create a migration:

```bash
pnpm dlx supabase migration new describe_change_in_snake_case
```

Then edit the generated SQL file in `supabase/migrations`.

Good migration names:

- `add_2026_history_milestone`
- `update_home_join_copy`
- `link_new_performance_recordings`
- `tighten_member_profile_policy`

Bad migration names:

- `fix`
- `changes`
- `update_db`

#### 6. Test a Migration

For local testing:

```bash
pnpm dlx supabase db reset
```

For an already-running local stack where you only want to apply pending migrations:

```bash
pnpm dlx supabase migration up
```

Also run app checks:

```bash
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

#### 7. Apply a Migration to the Shared Project

Preferred flow:

1. Commit the migration.
2. Open a PR or ask a maintainer to review.
3. A maintainer applies it to Supabase.
4. Regenerate TypeScript types if schema changed.
5. Deploy the app if code or required data changed.

Maintainers can apply migrations with the Supabase CLI:

```bash
pnpm dlx supabase db push
```

Maintainers using Codex/Supabase MCP can apply the same migration SQL with the Supabase MCP `apply_migration` tool. The migration file still needs to be committed so the repo remains reproducible.

#### 8. Regenerate Types After Schema Changes

If tables, columns, enums, views, or function signatures changed, regenerate Supabase types:

```bash
pnpm dlx supabase gen types typescript --project-id <project-ref> --schema public > lib/supabase/types.ts
```

Then run:

```bash
pnpm exec tsc --noEmit
```

Commit `lib/supabase/types.ts` with the migration.

#### 9. Optional: Codex/Supabase MCP Setup

The repo does not commit `.mcp.json`. Each contributor configures MCP locally.

```bash
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
codex mcp login supabase
```

Useful MCP operations:

- Inspect tables and migrations
- Apply reviewed migrations
- Generate TypeScript types
- Run security/performance advisors
- Inspect Edge Functions if they are added later

Never paste service role keys or SMTP credentials into prompts, issues, or committed files.

#### 10. Service Role Key Rules

The service role key bypasses RLS. Treat it like production root access.

Use it only for:

- `scripts/upload-seed-assets.mjs`
- `scripts/apply-scraped-content.mjs`
- `scripts/apply-instagram-feed.mjs`
- trusted maintainer operations

Never:

- Put it in `NEXT_PUBLIC_*`
- Use it in browser/client code
- Commit it to `.env.local.example`
- Paste it into README examples, issues, PRs, or chat logs

#### 11. Common Supabase Change Recipes

Update section copy:

```sql
update public.sections
set title = 'New title',
    subtitle = '새 제목',
    props = coalesce(props, '{}'::jsonb) || jsonb_build_object(
      'body', 'New body copy'
    )
where key = 'home-join';
```

Add a content entity:

```sql
insert into public.entities (
  entity_type,
  schema_key,
  slug,
  title,
  summary,
  thumbnail_url,
  data,
  published
)
values (
  'history_milestone',
  'history/milestone/v1',
  'history-2026-new-season',
  '2026 New Season',
  'Short summary',
  null,
  '{"year":"2026","display_order":120}'::jsonb,
  true
);
```

Link an entity to a section:

```sql
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  section_ref.id,
  entity_ref.id,
  'item',
  'default',
  120,
  '{}'::jsonb
from public.sections section_ref
join public.entities entity_ref on entity_ref.slug = 'history-2026-new-season'
where section_ref.key = 'history-timeline'
on conflict (section_id, entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props,
    updated_at = now();
```

Upload a public content image:

1. Upload the image to Supabase Storage.
2. Copy the public URL.
3. Store it in `entities.thumbnail_url` or `members.avatar_url`.
4. Prefer full public URLs for public content cards and gallery images.

#### 12. After Any Supabase Change

Check:

- Does the affected page still have required sections and entities?
- Did RLS remain enabled?
- Did policies still allow public reads where needed?
- Did member/profile write policies still restrict ownership?
- Do auth redirects still match deployed domains?
- Do TypeScript types need regeneration?
- Did `pnpm run build` pass?

### Supabase Changes

Use migrations for durable changes. Direct dashboard edits are acceptable for emergency operations, but anything that defines schema, policies, seeds, or important content structure should become a migration in `supabase/migrations`.

Good Supabase changes:

- Add or update `entities` rows for videos, photos, performances, posts, stats, activities, history milestones, navigation, or footer links
- Update `sections` copy, props, renderer metadata, or publish status
- Link content with `section_entities`
- Link domain records with `entity_relations`
- Add RLS policies, storage policies, functions, triggers, or enum changes
- Seed member roster changes when they are part of durable project history

Avoid:

- Hardcoding content in React just because it is faster
- Editing production-only content without also documenting or migrating it
- Using service role keys in client code
- Disabling RLS to make a query work

### Code Changes

Change code when the behavior or presentation changes:

- New section renderer
- New route or page flow
- New auth/profile interaction
- New filtering/sorting/search behavior
- Layout, typography, motion, responsive behavior
- Supabase loader logic
- Validation, security, or policy-dependent application behavior

When adding a new renderer:

1. Add or choose a `section_type`.
2. Seed a section with that `section_type`.
3. Add loader support if the section needs special mapping.
4. Implement the renderer in the relevant component.
5. Fail visibly if required DB content is missing.
6. Add or update migrations so the renderer has real content.

### Content Graph Conventions

Use `thumbnail_url` as the canonical image field for cards, thumbnails, previews, and gallery display. If a content entity needs one image, prefer `thumbnail_url` before adding custom image fields.

Use `sections.props` for renderer-level copy and behavior:

- `body`
- `href`
- `action_label`
- `filters`
- emphasis flags such as `eyebrow_accent`, `body_accent`, or `feature_caption_accent`

Use `entities.data` for entity-specific structured data:

- video metadata: YouTube ID, artist, song, team, duration, views, event key
- performance metadata: date, venue, type
- photo metadata: category, aspect, source post
- stat metadata: metric, unit, card type, tilt
- member-independent display metadata

Use `section_entities.props` only for relationship-specific display options, such as a caption for a featured entity in a specific section.

### Members and Auth

Members are intentionally not generic `entities`.

The member system depends on:

- Supabase Auth user
- `members.auth_user_id`
- exact signup claim matching by `name` and normalized `student_year`
- POSTECH email restriction
- member statuses: `active`, `inactive`, `alumni`, or `null` when unreviewed/unset

Profile-visible role text is member-editable and separate from admin permissions. Official permissions should remain policy-driven, not text-driven.

### Images and Storage

The expected flow is:

1. Upload image to Supabase Storage.
2. Store the resulting public URL in `thumbnail_url` or the relevant member/avatar field.
3. Render from the stored URL.

Public content images can use public Storage URLs. Private assets can still be supported later, but they need signed URL handling and should not be mixed into public gallery/rendering assumptions without a clear reason.

### Email/Auth Operations

Supabase Auth is configured with Custom SMTP through Resend.

Operational settings that live outside this repo:

- Supabase Site URL
- Supabase Redirect URLs
- Supabase email templates
- Resend domain verification records
- SMTP username/password
- Vercel production/preview environment variables

If you change any of these, document it in the PR or issue. Do not commit SMTP credentials or service role keys.

## Local Development

Install dependencies:

```bash
pnpm install
```

Create local env:

```bash
cp .env.local.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Quality Checks

Before pushing:

```bash
pnpm exec tsc --noEmit
pnpm run lint
git diff --check
pnpm run build
```

`pnpm run build` may need network access because `next/font` fetches Google Fonts.

For Supabase changes:

- Apply migrations to the target project.
- Run Supabase security advisors after policy/function changes.
- Confirm required sections/entities exist for pages that depend on them.
- Check Auth redirect URLs when changing domains.

## Deployment

The production target is Vercel.

Required Vercel env:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Before production deployment:

1. Confirm migrations have been applied to Supabase.
2. Confirm Vercel env vars are set.
3. Confirm Supabase Auth redirect URLs include production, preview, and local callback URLs.
4. Run a production build.
5. Smoke-test `GET /`, `/videos`, `/performances`, `/photos`, `/history`, `/members`, `/login`, and `/mypage`.

## Public Repo Safety

This repository can be public if these remain true:

- `.env.local` is not committed.
- `.mcp.json` is not committed.
- `.omc/` session files are not committed.
- `SUPABASE_SERVICE_ROLE_KEY` is never committed.
- SMTP credentials are never committed.
- Supabase RLS policies remain enabled for public tables and storage buckets.

Tracked files should include only env placeholders, migrations, source code, scripts, and public asset references.

## Open Work

The site is CMS-ready, not a full CMS yet.

Remaining CMS work:

- Schema registry for `section_type`, `schema_key`, and JSON props validation
- Admin UI for pages, sections, entities, ordering, publishing, and asset upload
- Draft/preview/versioning workflow
- Audit log for content changes
- Better authoring flow for image uploads and thumbnails

Optional operations:

- Korean templates for Magic Link, Invite User, and Change Email
- Custom Supabase Auth domain for better email link consistency
- Custom production domain for the site

## License

No open-source license has been selected yet.

If this is intended to be a true open-source project, add a `LICENSE` file before announcing it as open source. If it is only public for deployment and collaboration, leaving it unlicensed is acceptable.
