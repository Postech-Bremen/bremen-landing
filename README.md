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

Bremen Landing is the public web home for **브레멘 Bremen**, POSTECH's band club. The site is built as an editorial archive backed by a Supabase content graph, so performances, videos, photos, history entries, site chrome, and member-facing profile data can evolve toward a CMS without rewriting the UI.

The site includes:

- Home page with curated hero, stats, stage highlights, activities, and Join Us section
- Performance archive grouped by event and season
- YouTube recording archive with search, event filter, sorting, and pagination
- Pinterest-style photo gallery
- Bremen history timeline
- Member roster, login/signup, profile editing, and profile image upload

## Documentation

- [Contributing](./CONTRIBUTING.md): issue-driven contribution flow, PR checks, and decision rules
- [Issue-Driven Development](./docs/issue-driven-development.md): issue contract, branch naming, and PR rules
- [Content Graph](./docs/content-graph.md): `pages -> sections -> entities` model and content recipes
- [Supabase Setup](./docs/supabase-setup.md): CLI/MCP setup, migrations, service role rules, type generation
- [Agentic Workflow](./docs/agentic-workflow.md): Claude/Codex issue workflow, prompts, and hard guardrails
- [Operations](./docs/operations.md): Vercel, Supabase Auth, SMTP, public repo safety, and deployment checks

For coding agents, start with [AGENTS.md](./AGENTS.md). Claude users can also start with [CLAUDE.md](./CLAUDE.md). Repo-local skills live under [`.agents/skills`](./.agents/skills), and GitHub issue templates live under [`.github/ISSUE_TEMPLATE`](./.github/ISSUE_TEMPLATE).

## Quick Start

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

## Scripts

```bash
pnpm dev       # Start local development server
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # ESLint
```

## Quality Gate

Before pushing code or migrations:

```bash
pnpm exec tsc --noEmit
pnpm run lint
git diff --check
pnpm run build
```

`pnpm run build` may need network access because `next/font` fetches Google Fonts.

## Public Repo Safety

This repository can be public if these remain true:

- `.env.local` is not committed.
- `.mcp.json` is not committed.
- `.omc/` session files are not committed.
- Service role keys are never committed.
- SMTP credentials are never committed.
- Supabase RLS policies remain enabled for public tables and storage buckets.

## License

No open-source license has been selected yet.

If this is intended to be a true open-source project, add a `LICENSE` file before announcing it as open source. If it is only public for deployment and collaboration, leaving it unlicensed is acceptable.
