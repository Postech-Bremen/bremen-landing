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

## What This Is

Bremen Landing is the public web home for **브레멘 Bremen**, POSTECH's band club.

The site is designed as an editorial archive rather than a static brochure:

- Performance playlists grouped by event and season
- YouTube recording archive with search, filtering, and pagination
- Pinterest-like photo gallery
- Bremen history timeline
- Member roster and member-owned profile editing
- Supabase-backed content graph for future CMS editing

## Architecture

The content model is intentionally CMS-friendly:

```txt
pages
  -> page_sections
    -> sections
      -> section_entities
        -> entities
```

The UI renderer is selected by `section_type`, while actual content is loaded from Supabase.
If required DB content is missing, the app fails visibly instead of silently falling back to mock content.

Important domains:

- `entities`: generic content units such as videos, photos, stats, posts, activities, navigation links, and footer links
- `sections`: page-level layout blocks with renderer metadata and props
- `section_entities`: ordered links between sections and entities
- `members`: domain-specific member table for auth/profile ownership
- Supabase Storage: public image buckets for content and member avatars

## Tech Stack

- **Framework:** Next.js App Router
- **UI:** React, Tailwind CSS, shadcn/Radix primitives
- **Data:** Supabase Postgres, RLS, Auth, Storage
- **Deployment:** Vercel
- **Icons:** Phosphor Icons
- **Package manager:** pnpm

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create local env:

```bash
cp .env.local.example .env.local
```

Set the Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the dev server:

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

Content utility scripts live in `scripts/`.
Some of them require `SUPABASE_SERVICE_ROLE_KEY`; keep that key local and never expose it in client code.

## Supabase

Database migrations are in `supabase/migrations`.

The current app expects these runtime env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For deployment, also configure Supabase Auth redirect URLs for your Vercel domain:

```txt
https://your-domain.vercel.app/auth/callback
```

The app uses public anon access with RLS policies. Private/admin operations should use server-side tooling only.

## Deployment

The production target is Vercel.

Before deploying:

1. Import this repository into Vercel.
2. Set `NEXT_PUBLIC_SUPABASE_URL`.
3. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the Vercel domain to Supabase Auth redirect URLs.
5. Run `pnpm build` locally if you changed content loaders or migrations.

## Public Repo Safety

This repository is safe to make public if the following remain true:

- `.env.local` is not committed.
- `.mcp.json` is not committed.
- `.omc/` session files are not committed.
- `SUPABASE_SERVICE_ROLE_KEY` is never committed.
- Supabase RLS policies stay enabled for public tables and storage buckets.

Tracked files currently include only env placeholders, migrations, source code, and public asset references.

## License

No open-source license has been selected yet.

If this is intended to be a true open-source project, add a `LICENSE` file before announcing it as open source. If it is only public for deployment and collaboration, leaving it unlicensed is acceptable.
