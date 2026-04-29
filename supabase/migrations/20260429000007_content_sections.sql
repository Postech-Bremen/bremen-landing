-- Bremen — default page/section composition for the content graph
--
-- The graph is intentionally generic:
--   page -> page_sections -> sections -> section_entities -> entities
--
-- This seed keeps the initial public pages usable while preserving the
-- option to reorder sections or swap entities from the database later.

insert into public.pages (slug, title, subtitle, description, published, props)
values
  ('performances', '공연 아카이브', 'Performances', '브레멘의 공연과 활동 기록', true, '{}'::jsonb),
  ('videos', '영상 아카이브', 'Recordings', '브레멘의 공연 영상 기록', true, '{}'::jsonb),
  ('photos', '사진 아카이브', 'Gallery', '브레멘의 공연과 일상 장면', true, '{}'::jsonb)
on conflict (slug) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  published = excluded.published,
  props = excluded.props;

insert into public.sections (
  key,
  section_type,
  schema_key,
  eyebrow,
  title,
  subtitle,
  published,
  props
)
values
  (
    'performances-current-season',
    'entity_feature_grid',
    'section/performance-current-season/v1',
    'Current season',
    'Closest stages',
    '가까운 시즌에서 먼저 보게 될 무대',
    true,
    '{}'::jsonb
  ),
  (
    'performances-archive',
    'entity_grouped_grid',
    'section/performance-archive/v1',
    'Archive',
    'Season records',
    '연도별 공연 기록',
    true,
    '{}'::jsonb
  ),
  (
    'videos-featured',
    'entity_feature',
    'section/video-featured/v1',
    'Featured',
    'Start here',
    '먼저 보면 좋은 영상',
    true,
    '{}'::jsonb
  ),
  (
    'videos-popular',
    'entity_list',
    'section/video-popular/v1',
    'Popular',
    'Popular cuts',
    '많이 보는 컷',
    true,
    '{}'::jsonb
  ),
  (
    'videos-library',
    'entity_grid',
    'section/video-library/v1',
    'Library',
    'All recordings',
    '전체 라이브 기록',
    true,
    '{}'::jsonb
  ),
  (
    'photos-gallery',
    'entity_masonry',
    'section/photo-gallery/v1',
    'Gallery',
    'Captured moments',
    '브레멘의 장면들',
    true,
    '{"filters":["공연","일상"]}'::jsonb
  )
on conflict (key) do update
set
  section_type = excluded.section_type,
  schema_key = excluded.schema_key,
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  subtitle = excluded.subtitle,
  published = excluded.published,
  props = excluded.props;

with links(page_slug, section_key, sort_order) as (
  values
    ('performances', 'performances-current-season', 10),
    ('performances', 'performances-archive', 20),
    ('videos', 'videos-featured', 10),
    ('videos', 'videos-popular', 20),
    ('videos', 'videos-library', 30),
    ('photos', 'photos-gallery', 10)
)
insert into public.page_sections (page_id, section_id, sort_order, props)
select
  page_ref.id,
  section_ref.id,
  links.sort_order,
  '{}'::jsonb
from links
join public.pages page_ref on page_ref.slug = links.page_slug
join public.sections section_ref on section_ref.key = links.section_key
on conflict (page_id, section_id) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;

delete from public.section_entities section_entity
using public.sections section_ref
where section_entity.section_id = section_ref.id
  and section_ref.key in (
    'performances-current-season',
    'performances-archive',
    'videos-featured',
    'videos-popular',
    'videos-library',
    'photos-gallery'
  );

with
  target_section as (
    select id from public.sections where key = 'performances-current-season'
  ),
  latest_year as (
    select extract(year from max(sort_at))::int as value
    from public.entities
    where entity_type = 'performance'
      and published = true
  ),
  ordered as (
    select
      entity.id,
      row_number() over (order by entity.sort_at desc, entity.title) as rank
    from public.entities entity
    where entity.entity_type = 'performance'
      and entity.published = true
      and extract(year from entity.sort_at)::int = (select value from latest_year)
  )
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.id,
  ordered.id,
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;

with
  target_section as (
    select id from public.sections where key = 'performances-archive'
  ),
  ordered as (
    select
      entity.id,
      concat('season-', extract(year from entity.sort_at)::int) as slot,
      row_number() over (
        partition by extract(year from entity.sort_at)::int
        order by entity.sort_at desc, entity.title
      ) as rank
    from public.entities entity
    where entity.entity_type = 'performance'
      and entity.published = true
  )
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.id,
  ordered.id,
  'item',
  ordered.slot,
  (ordered.rank * 10)::int,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;

with
  target_section as (
    select id from public.sections where key = 'videos-featured'
  ),
  ordered as (
    select
      entity.id,
      row_number() over (
        order by entity.sort_at desc, coalesce((entity.data->>'display_order')::int, 0), entity.title
      ) as rank
    from public.entities entity
    where entity.entity_type = 'video'
      and entity.published = true
      and coalesce((entity.data->>'is_highlight')::boolean, false) = true
  )
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.id,
  ordered.id,
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;

with
  target_section as (
    select id from public.sections where key = 'videos-popular'
  ),
  ordered as (
    select
      entity.id,
      row_number() over (
        order by coalesce((entity.data->>'views')::int, 0) desc, entity.sort_at desc, entity.title
      ) as rank
    from public.entities entity
    where entity.entity_type = 'video'
      and entity.published = true
      and coalesce((entity.data->>'is_highlight')::boolean, false) = false
    limit 3
  )
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.id,
  ordered.id,
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;

with
  target_section as (
    select id from public.sections where key = 'videos-library'
  ),
  ordered as (
    select
      entity.id,
      row_number() over (
        order by entity.sort_at desc, coalesce((entity.data->>'display_order')::int, 0), entity.title
      ) as rank
    from public.entities entity
    where entity.entity_type = 'video'
      and entity.published = true
  )
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.id,
  ordered.id,
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;

with
  target_section as (
    select id from public.sections where key = 'photos-gallery'
  ),
  ordered as (
    select
      entity.id,
      case
        when entity.data->>'category' in ('live', 'events') then 'performance'
        else 'daily'
      end as slot,
      row_number() over (
        order by entity.sort_at desc, coalesce((entity.data->>'display_order')::int, 0), entity.title
      ) as rank
    from public.entities entity
    where entity.entity_type = 'photo'
      and entity.published = true
  )
insert into public.section_entities (
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.id,
  ordered.id,
  'item',
  ordered.slot,
  (ordered.rank * 10)::int,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set
  sort_order = excluded.sort_order,
  props = excluded.props;
