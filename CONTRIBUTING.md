# Contributing

This project uses an **issue-first** contribution flow. Do not start by asking an agent to directly mutate code or Supabase. Start by writing a structured issue, get the scope clear, then let a human or agent work inside that approved scope.

## Contribution Flow

1. Open a structured issue using one of the GitHub issue templates.
2. Classify the change as content, database, UI, auth, ops, or agent task.
3. Identify whether the change belongs in Supabase, code, or both.
4. For Supabase changes, write a migration or ask a maintainer to prepare one.
5. For code changes, keep the write scope narrow and list affected files.
6. Run the quality gate.
7. Open a PR that links the issue and describes validation.

## Issue Templates

Use the closest template:

- `Content graph change`: page sections, entities, curation, copy, videos, photos, history, member seed rows
- `Database migration`: schema, RLS, functions, triggers, storage policies, durable seed migrations
- `UI or interaction change`: layout, shadcn/ui, Tailwind, carousel, filters, search, pagination, responsive behavior
- `Agent task`: bounded work intended for Claude, Codex, or another agent
- `Ops or deployment change`: Vercel, Supabase Auth, SMTP, domains, env vars, public repo settings
- `Access request`: GitHub, Vercel, Supabase, or MCP onboarding access
- `Bug report`: regressions, broken pages, incorrect data, auth issues, deployment failures

Agents that support repo-local skills should use:

- `.agents/skills/create-bremen-issue/SKILL.md` for drafting structured issues
- `.agents/skills/guarded-supabase-mcp/SKILL.md` before any Supabase MCP operation

## First-Time Access Requests

Most contributors can start with public issues and PRs. Ask for platform access only when the task actually needs it.

Use the `Access request` issue template when you need:

- GitHub repository collaboration beyond normal fork/PR flow
- Vercel project access for deployment logs, env configuration, or production deployment checks
- Supabase project access for migrations, content graph inspection, Auth/Storage/RLS work, or MCP setup

Recommended identity setup:

- Use the same email for GitHub, Vercel, and Supabase if possible. It makes invitations, audit trails, and deployment permission issues easier to reason about.
- It is not required. GitHub username plus the correct Vercel/Supabase account email is enough.
- The site member login email is separate. POSTECH email is used for member authentication and profile claiming, not necessarily for GitHub/Vercel/Supabase access.

Public issue safety:

- This repository is public, so do not paste an email if you do not want it public.
- In that case, write `sent privately` in the access request and send the invitation email to a maintainer through a private channel.
- Never paste tokens, service role keys, SMTP credentials, recovery links, or one-time auth links in issues or PRs.

## Change Decision Table

| Task | Supabase? | Code? | Notes |
| --- | --- | --- | --- |
| Edit page copy, section title, CTA text, filter labels | Yes | Usually no | Update `sections` columns or `sections.props`. |
| Reorder sections on a page | Yes | No | Update `page_sections.sort_order`. |
| Curate videos/photos/stats shown in a section | Yes | No | Update `section_entities` links and sort order. |
| Add a new video/photo/performance/history entry | Yes | Usually no | Insert `entities`, then link to sections/relations. |
| Add or fix a member row | Yes | Maybe | Usually `members` only. Code changes only if claim rules change. |
| Add a new visual section type | Yes | Yes | Seed `section_type`, implement renderer, add required data. |
| Change layout, carousel, filters, search, pagination, animation | No | Yes | Renderer/application code. |
| Change auth rules, RLS, storage policies, triggers | Yes | Maybe | Migration required. Run advisors after. |
| Add profile/content image assets | Yes | Maybe | Upload to Storage and store public URL. |
| Change SMTP, redirect URLs, Vercel env, custom domains | Dashboard/config | No | Document in issue/PR. Do not commit secrets. |

## Issue-First Pattern

Good issues include:

- User-facing goal
- Page or route affected
- Exact content/entity/section keys if known
- Whether Supabase changes are expected
- Screenshots or URLs when visual
- Acceptance checks
- Explicit non-goals
- Risk notes, especially for auth, RLS, or production data

Bad issues:

- "Fix UI"
- "Make it better"
- "Update DB"
- "Let agent figure it out"

## PR Checklist

Every PR should answer:

- Which issue does this close?
- Did this change Supabase schema/data/policies?
- If yes, which migration file was added?
- Did `lib/supabase/types.ts` need regeneration?
- Did RLS remain enabled?
- Did required page sections/entities still exist?
- Did you run `pnpm exec tsc --noEmit`?
- Did you run `pnpm run lint`?
- Did you run `git diff --check`?
- Did you run `pnpm run build` when loaders, routing, or env assumptions changed?

## Supabase Changes

Use migrations for durable changes. Direct dashboard edits are acceptable for emergency operations, but schema, policies, seeds, important content structure, and roster fixes should become migrations in `supabase/migrations`.

Good Supabase changes:

- Add/update `entities`
- Update `sections` copy, props, renderer metadata, or publish status
- Link content with `section_entities`
- Link domain records with `entity_relations`
- Add RLS policies, storage policies, functions, triggers, or enum changes
- Seed durable member roster changes

Avoid:

- Hardcoding content in React because it is faster
- Editing production-only content without documenting or migrating it
- Using service role keys in client code
- Disabling RLS to make a query work
- Running destructive SQL without explicit maintainer approval

## Code Changes

Change code when behavior or presentation changes:

- New route or page flow
- New section renderer
- New auth/profile interaction
- New filtering/sorting/search behavior
- Layout, typography, motion, responsive behavior
- Supabase loader logic
- Validation, security, or policy-dependent app behavior

When adding a new renderer:

1. Add or choose a `section_type`.
2. Seed a section with that `section_type`.
3. Add loader support if the section needs special mapping.
4. Implement the renderer in the relevant component.
5. Fail visibly if required DB content is missing.
6. Add/update migrations so the renderer has real content.

## Agent Contributions

Agents may implement scoped issues, but they must follow [Agentic Workflow](./docs/agentic-workflow.md).

Agents must not:

- Invent broad DB refactors.
- Run destructive SQL.
- Disable RLS.
- Use service role keys unless a maintainer explicitly provides a maintenance task.
- Apply production migrations not represented by committed files.
- Change auth, SMTP, or Vercel settings without an issue and explicit approval.

## Quality Gate

Before pushing:

```bash
pnpm exec tsc --noEmit
pnpm run lint
git diff --check
pnpm run build
```

For Supabase changes:

- Apply and test migrations locally or in an approved branch/project.
- Run Supabase security advisors after policy/function changes.
- Confirm required sections/entities exist for affected pages.
- Confirm Auth redirect URLs when domains changed.
