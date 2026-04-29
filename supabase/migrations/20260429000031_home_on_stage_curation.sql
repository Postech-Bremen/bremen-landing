-- Bremen — curated home On stage videos.
--
-- Keep the home stage picks editable through section_entities rather than
-- page code. This migration only replaces the home-stage-highlights links.

delete from public.section_entities section_entity
using public.sections section_ref
where section_entity.section_id = section_ref.id
  and section_ref.key = 'home-stage-highlights';

with item_seed(entity_slug, sort_order) as (
  values
    ('youtube-tR8bSxa4igQ', 10),  -- 쏜애플 - 빨간 피터 | 2025 새터
    ('youtube-4r1PqeuEoyM', 20),  -- 쏜애플 - 시퍼런 봄, 실리카겔 - NO PAIN | 2024 새터
    ('youtube-8c6Q_bu76m8', 30),  -- Daft Punk Medley | 다프트 펑크 팀
    ('youtube-ZA0pnBAXX1A', 40)   -- MCR / 늙은준희팀
),
target_section as (
  select id from public.sections where key = 'home-stage-highlights'
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
  entity_ref.id,
  'item',
  'default',
  item_seed.sort_order,
  '{}'::jsonb
from target_section
join item_seed on true
join public.entities entity_ref on entity_ref.slug = item_seed.entity_slug
on conflict (section_id, entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;
