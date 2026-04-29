-- Bremen — home hero and stat thumbnail curation.
--
-- Hero and stat image choices remain CMS-editable data:
--   home-hero -> section_entities
--   live track card image -> stat entity thumbnail_url

delete from public.section_entities section_entity
using public.sections section_ref
where section_entity.section_id = section_ref.id
  and section_ref.key = 'home-hero';

with target_section as (
  select id from public.sections where key = 'home-hero'
),
target_entity as (
  select id from public.entities where slug = 'youtube-kvIgeZFp0gQ'
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
  target_entity.id,
  'featured',
  'default',
  10,
  '{"caption":"Hero pick"}'::jsonb
from target_section
cross join target_entity
on conflict (section_id, entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

update public.entities stat
set thumbnail_url = gallery.thumbnail_url,
    updated_at = now()
from public.entities gallery
where stat.slug = 'home-stat-live-tracks'
  and gallery.slug = 'instagram-DVOi5F4E6fN';
