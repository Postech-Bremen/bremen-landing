-- Bremen — keep gallery for moments and move Instagram notices to performances.

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
values (
  'performances-updates',
  'entity_post_grid',
  'section/performance-updates/v1',
  'Notice board',
  'Around the stages',
  '공연 전후의 소식',
  true,
  '{}'::jsonb
)
on conflict (key) do update
set section_type = excluded.section_type,
    schema_key = excluded.schema_key,
    eyebrow = excluded.eyebrow,
    title = excluded.title,
    subtitle = excluded.subtitle,
    published = excluded.published,
    props = excluded.props;

with target as (
  select page.id as page_id, section.id as section_id
  from public.pages page
  join public.sections section on section.key = 'performances-updates'
  where page.slug = 'performances'
)
insert into public.page_sections (page_id, section_id, sort_order, props)
select page_id, section_id, 25, '{}'::jsonb
from target
on conflict (page_id, section_id) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

with classified(shortcode, content_kind, gallery_include) as (
  values
    ('DVd4nX1AVOx', 'recruiting', false),
    ('DVY8bqxAbyV', 'notice', true),
    ('DVOi5F4E6fN', 'notice', true),
    ('DVLmlRaAW5i', 'event', false),
    ('DUny-GwAUFt', 'event', false),
    ('DUsQjpdDGgb', 'promo', false),
    ('DUin3ZXDGNK', 'promo', false),
    ('DUlD0amAYqL', 'recruiting', false),
    ('DRli4cAgflB', 'setlist', false),
    ('DQ4LFs3gX0p', 'notice', true),
    ('DOd4dyCAYDH', 'event', false),
    ('DNiMZixh7fK', 'event', false)
)
update public.entities entity
set entity_type = case
      when classified.gallery_include then 'photo'
      else 'post'
    end,
    schema_key = case
      when classified.gallery_include then 'photo/instagram-grid/v1'
      else 'post/instagram/v1'
    end,
    data = entity.data || jsonb_build_object(
      'content_kind', classified.content_kind,
      'gallery_include', classified.gallery_include
    ),
    updated_at = now()
from classified
where entity.data->>'shortcode' = classified.shortcode
  and entity.data->>'source' = 'instagram';

delete from public.section_entities section_entity
using public.sections section_ref
where section_entity.section_id = section_ref.id
  and section_ref.key = 'photos-gallery';

with target_section as (
  select id from public.sections where key = 'photos-gallery'
),
ordered as (
  select
    entity.id,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'photo'
    and entity.data->>'source' = 'instagram'
    and coalesce((entity.data->>'gallery_include')::boolean, true) = true
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
  'features_photo',
  'gallery',
  ordered.rank * 10,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

delete from public.section_entities section_entity
using public.sections section_ref
where section_entity.section_id = section_ref.id
  and section_ref.key = 'performances-updates';

with target_section as (
  select id from public.sections where key = 'performances-updates'
),
ordered as (
  select
    entity.id,
    coalesce(entity.data->>'content_kind', 'notice') as content_kind,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'post'
    and entity.data->>'source' = 'instagram'
    and coalesce((entity.data->>'gallery_include')::boolean, false) = false
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
  'features_post',
  ordered.content_kind,
  ordered.rank * 10,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (section_id, entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

update public.entity_relations relation
set relation_type = 'has_post',
    slot = coalesce(post.data->>'content_kind', relation.slot),
    updated_at = now()
from public.entities post
where relation.to_entity_id = post.id
  and post.entity_type = 'post'
  and relation.relation_type = 'has_photo';
