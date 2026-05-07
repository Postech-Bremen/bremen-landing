# Content Graph

The site is currently built around a CMS-friendly graph:

```txt
pages
  -> page_sections
    -> sections
      -> section_entities
        -> entities
```

The target model is a smaller entity graph:

```txt
entity_schemas
  -> entities
    -> entity_relations
      -> entities
```

`pages`, `sections`, `page_sections`, and `section_entities` remain in use during
the transition. New CMS architecture work should avoid deepening those special
tables unless the change is explicitly about preserving the bridge.

## Entity Graph Bridge

Migration `20260506000042_entity_graph_bridge.sql` starts the safe transition by
mirroring page and section records into the generic graph without deleting the
legacy tables:

- `pages` rows get shadow `entities` rows with `entity_type = 'page'`.
- `sections` rows get shadow `entities` rows with `entity_type = 'section'`.
- `page_sections` rows get shadow `entity_relations` rows from page entity to
  section entity.
- `section_entities` rows get shadow `entity_relations` rows from section entity
  to content entity.

The bridge uses `source_table` and `source_id` columns on `entities` and
`entity_relations` so each shadow record can be traced back to the legacy row.
Sync triggers keep the shadow graph updated while the app still writes through
the current CMS screens.

Until the public loaders and PONIX editors are explicitly migrated, the bridge
is a compatibility read model, not the only source of truth. Do not remove
`pages`, `sections`, `page_sections`, or `section_entities` until all renderers,
forms, audits, migrations, and generated types have moved to the entity graph.

Current PONIX contract:

- CMS relation lists read page/section placement through `entity_relations`
  bridge rows.
- Those bridge rows expose both the `entity_relations.id` and the legacy
  `source_id`.
- Routine CMS writes still target `page_sections` and `section_entities`; bridge
  triggers mirror those writes back into `entity_relations`.
- Code that mutates page or section composition must pass the legacy
  `source_id`, not the graph row id.

## Tables

| Table | Purpose |
| --- | --- |
| `entity_schemas` | DB-backed schema registry for page, section, entity, and relation records. This is the long-term source for CMS form metadata and validation. |
| `pages` | Routable page records such as `home`, `performances`, `videos`, `photos`, `history`, and `site`. |
| `sections` | Renderer blocks with `section_type`, copy, and renderer props. |
| `page_sections` | Ordered section placement on pages. |
| `entities` | Reusable content units such as videos, photos, stats, posts, history milestones, activities, nav items, and social links. |
| `section_entities` | Ordered links between a section and the entities displayed in that section. |
| `entity_relations` | Domain relations such as performance to recording, performance to photo, performance to post. |
| `members` | Domain-specific member/auth/profile table. This intentionally remains separate from generic entities. |

## Renderer Contract

The app chooses a UI renderer from `sections.section_type`.

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

- `entity_schemas` is the DB-backed registry foundation. It stores stable
  `schema_key`, `kind`, version, label, renderer hint, relation slots, and future
  JSON field/validation definitions.
- `lib/cms/schema-registry.ts` is still the active code-level field contract for
  PONIX forms until the DB-backed registry is fully populated and wired into the
  editor.

Use the registry contract for:

- `sections.props`
- `entities.data`
- `section_entities.props`
- `entity_relations.props`

Each registry entry defines the schema key, field source, field type,
required/read-only status, and select options. Future CMS editor screens should
prefer `entity_schemas` as the metadata source, with the code registry as the
reviewed renderer/field fallback.

## Entity Schema Direction

The long-term content contract is:

```txt
entity_schemas
- what kind of content this is
- which fields are editable
- how the data should be validated
- which renderer key may display it

entities
- shared identity and display columns
- schema_id / schema_key
- flexible data jsonb

entity_relations
- ordered links between entities
- schema_id / schema_key
- slot, relation_type, sort_order
- relation props as relation-specific data
```

For now, `entities.schema_key` remains the public compatibility key and
`entities.schema_id` resolves it to `entity_schemas`. `entity_relations` also has
a default relation schema. Do not remove the text `schema_key` fields until all
loaders, CMS forms, migrations, and production data have moved to schema IDs.

Renderer implementations remain in React code. Database schemas may name a
`renderer_key`, but they must not define executable UI behavior.

## Where Data Belongs

Use `sections` columns for section identity:

- `key`
- `section_type`
- `schema_key`
- `eyebrow`
- `title`
- `subtitle`
- `published`

Use `sections.props` for renderer-level copy and behavior:

- `body`
- `href`
- `action_label`
- `filters`
- `eyebrow_accent`
- `body_accent`
- `feature_caption_accent`

Use `entities` columns for shared display identity:

- `entity_type`
- `schema_key`
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

Use `section_entities.props` only for relationship-specific display choices, such as a caption for a featured entity in one section.

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
update public.sections
set title = 'New title',
    subtitle = '새 제목',
    props = coalesce(props, '{}'::jsonb) || jsonb_build_object(
      'body', 'New body copy'
    )
where key = 'home-join';
```

### Add a Content Entity

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

### Link an Entity to a Section

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

### Reorder a Section

```sql
update public.page_sections page_section
set sort_order = 30
from public.pages page_ref, public.sections section_ref
where page_section.page_id = page_ref.id
  and page_section.section_id = section_ref.id
  and page_ref.slug = 'home'
  and section_ref.key = 'home-activities';
```

## Required Content Checks

After changing content graph data, verify:

- affected page exists and is published
- expected sections exist and are published
- required entity sections have enough linked entities
- linked entities are published
- `section_type` still has a renderer
- page no longer relies on removed section keys

Useful query:

```sql
select p.slug, ps.sort_order, s.key, s.section_type, count(se.id) as entity_count
from public.pages p
join public.page_sections ps on ps.page_id = p.id
join public.sections s on s.id = ps.section_id
left join public.section_entities se on se.section_id = s.id
where p.slug in ('home', 'site', 'performances', 'videos', 'photos', 'history')
  and p.published = true
  and s.published = true
group by p.slug, ps.sort_order, s.key, s.section_type
order by p.slug, ps.sort_order;
```
