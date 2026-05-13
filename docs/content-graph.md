# Content Graph

The site is currently built around a compact entity graph:

```txt
entity_schemas
  -> entities
    -> entity_relations
      -> entities
```

`pages` and `sections` currently remain compatibility tables for historical
page/section records, but PONIX authoring now treats their graph `entities` as
the CMS-facing record ids. Ordered page/section composition is stored in
`entity_relations`; the legacy `page_sections` and `section_entities` mirror
tables have been removed.

The older media domain tables `performances`, `videos`, and `photos` have been
removed. Media/archive content now lives in `entities` and `entity_relations`.

## Entity Graph Bridge

Migration `20260506000042_entity_graph_bridge.sql` started the safe transition
by mirroring page and section records into the generic graph:

- `pages` rows get shadow `entities` rows using the `page/default/v1` schema.
- `sections` rows get shadow `entities` rows using registered section schemas.
- Page-to-section composition uses `entity_relations` rows from page entity to
  section entity.
- Section-to-content composition uses `entity_relations` rows from section
  entity to content entity.

The bridge resolves page/section shadow `entities` through deterministic slugs:
`page:<pages.slug>` and `section:<sections.key>`. Legacy source marker columns
on `entities` and `entity_relations` have been retired.
`entity_relations` no longer uses legacy mirror source markers after
`20260511000052_retire_legacy_relation_source_markers.sql`; relation identity
comes from `schema_id`, `relation_type`, `slot`, and the relation id.

The bridge is now the primary runtime composition path.

Current PONIX contract:

- Public slug-based page composition reads page and section display metadata
  from the `page:` and `section:` shadow `entities`, then follows
  `entity_relations` for page-to-section and section-to-content composition.
  Content graph QA validates the graph directly instead of comparing against
  legacy mirrors.
- CMS page and section list/detail/edit paths use graph `entities.id` for page
  and section records. Page fields are projected from the page entity; section
  renderer identity and props are projected from section entity `data`.
- CMS draft preview and composer paths accept page entity ids, then render from
  the same `entity_relations` graph used by public pages.
- CMS relation lists read page/section placement through `entity_relations`
  bridge rows, using relation `schema_id` values resolved from registered
  schema keys such as `relation/page-section/v1` and
  `relation/section-entity/v1`.
- Routine CMS composition writes target `entity_relations` without legacy
  source markers.
- Maintenance apply scripts and generated seed migrations that refresh scraped
  or Instagram content should also write section placement through
  `entity_relations`, not directly through `page_sections` or
  `section_entities`.
- Code that mutates page or section composition must pass the graph relation id.
- `pnpm run qa:content-graph` checks graph-only page composition integrity:
  page/section entity key uniqueness, section ordering, relation contracts, and
  missing or unpublished section/entity references.
- Runtime CMS code must not read `page_sections` or `section_entities`.
  Use `pnpm run qa:cms-legacy-bridge-boundary` after CMS loader changes.
- Use `pnpm run qa:legacy-mirror-readiness` when touching historical mirror
  references. The command now reports no active blockers after Stage 5 removal.
- Use `pnpm run qa:legacy-media-table-readiness` after media graph changes to
  verify runtime code does not reintroduce direct legacy media table reads and
  the post-drop entity graph still exposes performance/video/photo content.
- `pnpm run qa:graph-primary-seed-writes` checks that seed apply scripts and
  migration generators do not reintroduce direct legacy composition writes.

## Tables

| Table | Purpose |
| --- | --- |
| `entity_schemas` | DB-backed schema registry for page, section, entity, and relation records. This is the long-term source for CMS form metadata. |
| `pages` | Compatibility mirror for routable page records such as `home`, `performances`, `videos`, `photos`, `history`, and `site`. PONIX authoring should prefer the page entity. |
| `sections` | Compatibility mirror for renderer blocks. PONIX authoring should prefer the section entity with renderer identity in `entities.data`. |
| `entities` | Reusable content units such as videos, photos, stats, posts, history milestones, activities, nav items, and social links. |
| `entity_relations` | Ordered page-to-section, section-to-entity, and domain relations such as performance to recording/photo/post. |
| `members` | Domain-specific member/auth/profile table. This intentionally remains separate from generic entities. |

## Renderer Contract

The app chooses a UI renderer from graph section metadata. Entity-native
sections store it in `entities.data.section_type`; legacy mirrored sections
expose the same value through `sections.section_type`.

Examples:

- `entity_feature`
- `entity_grid`
- `entity_list`
- `entity_carousel`
- `entity_masonry`
- `entity_timeline`
- `computed_event_list`
- `computed_photo_strip`
- `computed_year_index`
- `site_navigation`
- `site_footer`

Required DB content should fail visibly when missing. Do not reintroduce mock fallbacks for required production pages.

## CMS Schema Registry

CMS forms should not infer editable fields directly from arbitrary JSONB.

There are now two layers:

- `entity_schemas` is the DB-backed registry used by PONIX server-rendered
  editor/detail flows. It stores stable `schema_key`, `kind`, version, label,
  renderer hint, relation slots, and JSON field metadata.
- `lib/cms/schema-registry.ts` remains the reviewed code fallback and renderer
  compatibility contract. Keep it in sync until DB-only schema editing has its
  own review and QA path.

Use the registry contract for:

- `sections.props`
- `entities.data`
- `entity_relations.props`

Each registry entry defines the schema key, field source, field type,
required/read-only status, and select options. CMS editor screens should prefer
`entity_schemas` as the metadata source, with the code registry as the reviewed
renderer/field fallback.

Use `pnpm run qa:cms-schema-registry -- --strict` to compare the code registry
with active DB `entity_schemas`. The command is intentionally read-only and
should report `dbFieldMissing = 0` before DB-first editor behavior is considered
safe.

Use `pnpm run qa:cms-db-first-loaders` after PONIX editor or CMS loader changes.
It is a read-only static guard that fails if server-rendered PONIX surfaces
reintroduce direct code-only schema lookup helpers instead of the DB-first
server loaders. The sync registry remains allowed only in reviewed fallback
modules.

## Entity Schema Direction

The long-term content contract is:

```txt
entity_schemas
- what kind of content this is
- broad semantic identity such as video, photo, performance, post, or section
- which fields are editable
- which renderer key may display it

entities
- shared identity and display columns
- required schema_id
- flexible data jsonb

entity_relations
- ordered links between entities
- required schema_id
- slot, relation_type, sort_order
- relation props as relation-specific data
```

`entity_schemas.schema_key` is not legacy; it remains the stable, human-readable
registry key. Content rows use `schema_id` as the canonical DB reference, and
runtime/CMS code derives semantic labels from `entity_schemas.semantic_kind`
instead of content-row mirrors.

Issue #153 removed the duplicated content-row mirror columns:
`entities.schema_key`, `entities.entity_type`, `entity_relations.schema_key`,
and `sections.schema_key`. Run
`pnpm run qa:schema-mirror-removal-readiness` after touching CMS loaders,
seed/apply scripts, or graph migrations.

Renderer implementations remain in React code. Database schemas may name a
`renderer_key`, but they must not define executable UI behavior.

## Where Data Belongs

Legacy `sections` rows still expose these columns for compatibility, but new
PONIX authoring should model section identity on the section entity:

- `entities.schema_id`
- `entities.title`
- `entities.subtitle`
- `entities.published`
- `entities.data.key`
- `entities.data.section_type`
- `entities.data.eyebrow`
- `entities.data.props`

The compatibility `sections` columns are:

- `key`
- `section_type`
- `schema_id`
- `eyebrow`
- `title`
- `subtitle`
- `published`

Compatibility `sections.props` and entity-native `entities.data.props` carry
renderer-level copy and behavior:

- `body`
- `href`
- `action_label`
- `filters`
- `eyebrow_accent`
- `body_accent`
- `feature_caption_accent`

Use `entities` columns for shared display identity:

- `schema_id`
- `slug`
- `title`
- `subtitle`
- `summary`
- `thumbnail_url`
- `sort_at`
- `published`

Use `entities.data` for entity-specific structured data:

- video metadata: YouTube ID, artist, song, team, duration, views, event key
- performance metadata: event date, display date, venue, type
- photo metadata: category, aspect, source post
- stat metadata: metric, unit, card type, tilt
- activity metadata: schedule, variant, tilt
- history metadata: year, display order

Use `entity_relations.props` only for relationship-specific display choices,
such as a caption for a featured entity in one section.

## Image Policy

Use `thumbnail_url` as the canonical image URL for public cards, thumbnails, previews, and gallery display.

Expected flow:

1. Upload image to Supabase Storage.
2. Copy the full public URL.
3. Store it in `entities.thumbnail_url` or `members.avatar_url`.
4. Render from the stored URL.

Avoid adding `image_url`, `thumbnail_url`, `cover_url`, and `preview_url` for the same concept unless a renderer truly needs multiple image roles.

## Members Are Not Generic Entities

Members stay in `members` because they involve:

- Supabase Auth ownership
- `auth_user_id`
- claim matching by name and student year
- profile edit permissions
- member status
- admin/active member policies

Profile-visible role text is member-editable and separate from permissions.

## Common Recipes

### Update Section Copy

```sql
update public.entities section_entity
set title = 'New title',
    subtitle = '새 제목',
    data = coalesce(section_entity.data, '{}'::jsonb) || jsonb_build_object(
      'props',
      coalesce(section_entity.data -> 'props', '{}'::jsonb) || jsonb_build_object(
        'body', 'New body copy'
      )
    )
from public.entity_schemas schema_ref
where section_entity.schema_id = schema_ref.id
  and schema_ref.kind = 'section'
  and schema_ref.active = true
  and coalesce(
    case
      when section_entity.slug like 'section:%'
      then substring(section_entity.slug from 9)
      else null
    end,
    section_entity.data ->> 'key'
  ) = 'home-join';
```

### Add a Content Entity

```sql
insert into public.entities (
  schema_id,
  slug,
  title,
  summary,
  thumbnail_url,
  data,
  published
)
select
  schema_ref.id,
  'history-2026-new-season',
  '2026 New Season',
  'Short summary',
  null,
  '{"year":"2026","display_order":120}'::jsonb,
  true
from public.entity_schemas schema_ref
where schema_ref.schema_key = 'history/milestone/v1'
  and schema_ref.active = true;
```

### Link an Entity to a Section

```sql
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  section_entity.id,
  entity_ref.id,
  relation_schema.id,
  'item',
  'default',
  120,
  '{}'::jsonb
from public.entities section_entity
join public.entities entity_ref on entity_ref.slug = 'history-2026-new-season'
join public.entity_schemas section_schema
  on section_entity.schema_id = section_schema.id
 and section_schema.kind = 'section'
 and section_schema.active = true
join public.entity_schemas relation_schema
  on relation_schema.schema_key = 'relation/section-entity/v1'
 and relation_schema.active = true
where coalesce(
    case
      when section_entity.slug like 'section:%'
      then substring(section_entity.slug from 9)
      else null
    end,
    section_entity.data ->> 'key'
  ) = 'history-timeline'
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props,
    updated_at = now();
```

### Reorder a Section

```sql
update public.entity_relations page_section_relation
set sort_order = 30
from public.entities page_entity
join public.entities section_entity
  on section_entity.schema_id in (
    select id from public.entity_schemas
    where kind = 'section' and active = true
  )
join public.entity_schemas relation_schema
  on relation_schema.schema_key = 'relation/page-section/v1'
 and relation_schema.active = true
where page_entity.schema_id = (
  select id from public.entity_schemas
  where schema_key = 'page/default/v1' and active = true
)
  and page_entity.slug = 'page:home'
  and coalesce(
    case
      when section_entity.slug like 'section:%'
      then substring(section_entity.slug from 9)
      else null
    end,
    section_entity.data ->> 'key'
  ) = 'home-activities'
  and page_section_relation.from_entity_id = page_entity.id
  and page_section_relation.to_entity_id = section_entity.id
  and page_section_relation.schema_id = relation_schema.id
  and page_section_relation.slot = 'sections';
```

## Required Content Checks

After changing content graph data, verify:

- affected page entity exists and is published
- expected section entities exist and are published
- required entity sections have enough linked entities
- linked entities are published
- `entities.data.section_type` still has a renderer
- page no longer relies on removed section keys

Useful query:

```sql
select
  coalesce(
    case
      when page_entity.slug like 'page:%'
      then substring(page_entity.slug from 6)
      else null
    end,
    page_entity.data ->> 'slug'
  ) as page_slug,
  page_section_relation.sort_order,
  coalesce(
    case
      when section_entity.slug like 'section:%'
      then substring(section_entity.slug from 9)
      else null
    end,
    section_entity.data ->> 'key'
  ) as section_key,
  section_entity.data ->> 'section_type' as section_type,
  count(content_entity.id) as entity_count
from public.entities page_entity
join public.entity_relations page_section_relation
  on page_section_relation.from_entity_id = page_entity.id
 and page_section_relation.schema_id = (
    select id from public.entity_schemas
    where schema_key = 'relation/page-section/v1' and active = true
  )
join public.entities section_entity
  on section_entity.id = page_section_relation.to_entity_id
 and section_entity.schema_id in (
    select id from public.entity_schemas
    where kind = 'section' and active = true
  )
left join public.entity_relations section_item_relation
  on section_item_relation.from_entity_id = section_entity.id
 and section_item_relation.schema_id = (
    select id from public.entity_schemas
    where schema_key = 'relation/section-entity/v1' and active = true
 )
left join public.entities content_entity
  on content_entity.id = section_item_relation.to_entity_id
 and content_entity.published = true
where page_entity.schema_id = (
    select id from public.entity_schemas
    where schema_key = 'page/default/v1' and active = true
  )
  and page_entity.published = true
  and section_entity.published = true
group by page_slug, page_section_relation.sort_order, section_key, section_type
order by page_slug, page_section_relation.sort_order;
```
