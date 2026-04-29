-- Bremen — home page composition in the content graph.
--
-- Home follows the same CMS-friendly graph as the archive pages:
--   page -> page_sections -> sections -> section_entities -> entities
--
-- UI components still choose the renderer for each section_type, but featured
-- videos, stat cards, and ordering are data links instead of page constants.

insert into public.pages (slug, title, subtitle, description, published, props)
values (
  'home',
  '브레멘',
  'Bremen',
  '포스텍 밴드 동아리 브레멘',
  true,
  '{}'::jsonb
)
on conflict (slug) do update
set title = excluded.title,
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
    'home-hero',
    'entity_feature',
    'section/home-hero/v1',
    'A POSTECH Band Club · Since 2001',
    'Bremen',
    '브레멘',
    true,
    '{"body":"Since 2001, a music community at POSTECH — 함께 연주하고 공연하는 사람들."}'::jsonb
  ),
  (
    'home-stats',
    'entity_stat_grid',
    'section/home-stats/v1',
    'Numbers',
    'Bremen, by the numbers',
    '숫자로 보는 브레멘',
    true,
    '{}'::jsonb
  ),
  (
    'home-stage-highlights',
    'entity_video_grid',
    'section/home-stage-highlights/v1',
    'Recordings',
    'On stage',
    '무대 위에서',
    true,
    '{"href":"/videos","action_label":"All recordings"}'::jsonb
  ),
  (
    'home-upcoming',
    'computed_event_list',
    'section/home-upcoming/v1',
    'Schedule',
    'Coming up',
    '다가오는 공연',
    true,
    '{"href":"/performances","action_label":"Full archive"}'::jsonb
  ),
  (
    'home-activities',
    'static_activity_grid',
    'section/home-activities/v1',
    'Activities',
    'What we do, all year',
    '활동 영역',
    true,
    '{}'::jsonb
  ),
  (
    'home-join',
    'static_cta',
    'section/home-join/v1',
    'Join us',
    'No experience required.',
    '악기를 한 번도 잡아본 적 없어도 좋다.',
    true,
    '{"href":"https://www.instagram.com/postech.bremen","action_label":"DM us on Instagram"}'::jsonb
  )
on conflict (key) do update
set section_type = excluded.section_type,
    schema_key = excluded.schema_key,
    eyebrow = excluded.eyebrow,
    title = excluded.title,
    subtitle = excluded.subtitle,
    published = excluded.published,
    props = excluded.props;

with links(page_slug, section_key, sort_order) as (
  values
    ('home', 'home-hero', 10),
    ('home', 'home-stats', 20),
    ('home', 'home-stage-highlights', 30),
    ('home', 'home-upcoming', 40),
    ('home', 'home-activities', 50),
    ('home', 'home-join', 60)
)
insert into public.page_sections (page_id, section_id, sort_order, props)
select page_ref.id, section_ref.id, links.sort_order, '{}'::jsonb
from links
join public.pages page_ref on page_ref.slug = links.page_slug
join public.sections section_ref on section_ref.key = links.section_key
on conflict (page_id, section_id) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

insert into public.entities (
  entity_type,
  schema_key,
  slug,
  title,
  subtitle,
  summary,
  thumbnail_url,
  sort_at,
  data,
  published
)
values
  (
    'stat',
    'stat/home-number/v1',
    'home-stat-active-years',
    '활동 연수',
    null,
    '2001년 창립부터 이어진 포스텍 밴드 동아리',
    null,
    '2001-01-01 00:00:00+09',
    '{"card_type":"text","metric":"activeYears","unit":"년","tilt":"-5deg"}'::jsonb,
    true
  ),
  (
    'stat',
    'stat/home-number/v1',
    'home-stat-live-tracks',
    '라이브 트랙',
    null,
    '{performanceCount}개 공연에서 이어지는 라이브 기록',
    'https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/JTWRc4mY8N0.jpg',
    '2001-01-01 00:00:00+09',
    '{"card_type":"image","metric":"videoCount","unit":"개","tilt":"4deg"}'::jsonb,
    true
  ),
  (
    'stat',
    'stat/home-number/v1',
    'home-stat-youtube-views',
    '유튜브 누적',
    null,
    '{topHighlight} · 채널 통산',
    null,
    '2001-01-01 00:00:00+09',
    '{"card_type":"color","metric":"totalViews","unit":"회","tilt":"-3.5deg","format":"compact"}'::jsonb,
    true
  ),
  (
    'stat',
    'stat/home-number/v1',
    'home-stat-beer',
    '사라진 맥주',
    null,
    '합주실 어딘가 굴러다닐 빈 캔',
    'https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/83Ic_e-gW9I.jpg',
    '2001-01-01 00:00:00+09',
    '{"card_type":"image","metric":"literal","value":"∞","unit":"잔","tilt":"3.5deg"}'::jsonb,
    true
  )
on conflict (slug) do update
set entity_type = excluded.entity_type,
    schema_key = excluded.schema_key,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = excluded.thumbnail_url,
    sort_at = excluded.sort_at,
    data = excluded.data,
    published = excluded.published,
    updated_at = now();

delete from public.section_entities section_entity
using public.sections section_ref
where section_entity.section_id = section_ref.id
  and section_ref.key in (
    'home-hero',
    'home-stats',
    'home-stage-highlights'
  );

with item_seed(section_key, entity_slug, relation_type, slot, sort_order, props) as (
  values
    ('home-hero', 'youtube-83Ic_e-gW9I', 'featured', 'default', 10, '{"caption":"Featured cut"}'::jsonb),

    ('home-stats', 'home-stat-active-years', 'item', 'default', 10, '{}'::jsonb),
    ('home-stats', 'home-stat-live-tracks', 'item', 'default', 20, '{}'::jsonb),
    ('home-stats', 'home-stat-youtube-views', 'item', 'default', 30, '{}'::jsonb),
    ('home-stats', 'home-stat-beer', 'item', 'default', 40, '{}'::jsonb),

    ('home-stage-highlights', 'youtube-JTWRc4mY8N0', 'item', 'default', 10, '{}'::jsonb),
    ('home-stage-highlights', 'youtube-e9q4ia0-h4U', 'item', 'default', 20, '{}'::jsonb),
    ('home-stage-highlights', 'youtube-tR8bSxa4igQ', 'item', 'default', 30, '{}'::jsonb),
    ('home-stage-highlights', 'youtube-do-N7qm2DY8', 'item', 'default', 40, '{}'::jsonb)
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
  section_ref.id,
  entity_ref.id,
  item_seed.relation_type,
  item_seed.slot,
  item_seed.sort_order,
  item_seed.props
from item_seed
join public.sections section_ref on section_ref.key = item_seed.section_key
join public.entities entity_ref on entity_ref.slug = item_seed.entity_slug
on conflict (section_id, entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;
