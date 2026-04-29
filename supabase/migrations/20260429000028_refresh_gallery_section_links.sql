-- Bremen — remove duplicate gallery section links after Instagram post split.

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
