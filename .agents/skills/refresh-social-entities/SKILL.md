---
name: refresh-social-entities
description: Refresh Bremen Landing social content graph data from the official Instagram @postech.bremen feed and YouTube @postech_bremen channel. Use when asked to fetch latest Instagram/YouTube posts, update Supabase entities/entity_relations, regenerate social seed migrations, upload imported thumbnails to Supabase Storage, or publish social content updates for Bremen pages.
---

# Refresh Social Entities

## Workflow

1. Read `AGENTS.md`, `CONTRIBUTING.md`, `docs/content-graph.md`, and `docs/supabase-setup.md`.
2. Create or identify a structured content issue before changing migrations or production data.
3. Fetch Instagram through the existing scraper:

```bash
node scripts/scrape-instagram-feed.mjs postech.bremen /tmp/bremen_instagram_feed.json /tmp/bremen_instagram_seed_candidates.json 12 20
```

Use enough pages to capture the full feed snapshot. `generate-instagram-feed-migration.mjs` rewires Instagram source relations from the supplied feed, so a partial feed can drop older performance relations.

4. Upload public thumbnails to the `images` bucket:

```bash
node scripts/upload-seed-assets.mjs /tmp/bremen_instagram_seed_candidates.json /tmp/bremen_instagram_asset_manifest.json
```

5. Generate a new post-graph migration, not an old historical migration:

```bash
node scripts/generate-instagram-feed-migration.mjs /tmp/bremen_instagram_feed.json /tmp/bremen_instagram_asset_manifest.json supabase/migrations/<timestamp>_refresh_social_entities.sql /tmp/bremen_instagram_seed_rows.json
```

6. Fetch YouTube from official channel sources:

```bash
curl -fsSL 'https://www.youtube.com/feeds/videos.xml?channel_id=UCmjgtZjgfeQwTXZ_otXGOjw'
```

Use `https://www.youtube.com/@postech_bremen/playlists` to confirm new playlist ids and counts. If adding YouTube rows, upload thumbnails with `scripts/upload-seed-assets.mjs` and store `thumbnail_url` as the Supabase Storage public URL.

7. Add missing parent performance entities before inserting relations. Latest Instagram inference may emit new slugs such as `2026-haemaji` or `2026-spring-regular`; relation inserts silently skip rows when the parent entity is absent.
8. Link new content through graph-native `entity_relations` only:
   - performance to video/photo/post: `relation/default/v1`
   - section to entity: `relation/section-entity/v1`
   - page to section: `relation/page-section/v1`

Do not write removed `pages`, `sections`, `page_sections`, `section_entities`, `entity_type`, or content-row `schema_key` columns in new scripts or migrations.

## Production Apply

Prefer committing the migration first. If the user explicitly asks for live reflection and maintainer credentials are present, apply the committed migration with the approved Supabase flow, then smoke test production pages.

Never commit `.env.local`, `.mcp.json`, `.vercel/`, `.omx/`, `.omc/`, service role keys, or transient feed JSON.

## Verification

Run the focused graph/content checks first:

```bash
pnpm run qa:graph-primary-seed-writes
pnpm run qa:content-graph
pnpm exec tsc --noEmit
pnpm run lint
git diff --check
pnpm run build
```

After production apply/deploy, smoke test:

```bash
curl -I https://bremen.postech.ac.kr
curl -I https://bremen.postech.ac.kr/performances
curl -I https://bremen.postech.ac.kr/videos
curl -I https://bremen.postech.ac.kr/photos
```
