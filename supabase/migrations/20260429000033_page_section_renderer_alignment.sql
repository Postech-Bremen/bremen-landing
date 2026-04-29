-- Bremen — align page composition with the section renderers.
--
-- Public pages should be editable as page -> sections -> entities. Keep
-- section rows available for future reuse, but only link sections that the
-- current renderer intentionally displays.

update public.pages
set description = case slug
    when 'performances' then '공연마다 남은 영상과 사진을 한 자리에서 이어 봅니다. 먼저 무대를 고르고, 그 안의 곡과 장면으로 들어갑니다.'
    when 'videos' then '공연이 끝나도 기록은 남깁니다. 대표 영상부터 많이 보는 컷, 그리고 전체 라이브 기록까지 한 번에 훑을 수 있게 모았습니다.'
    when 'photos' then '무대 위, 그리고 무대 밖에서 생기는 장면들을 모읍니다. 공연의 열기, 연습실의 공기, 끝난 뒤의 표정까지 함께 남깁니다.'
    when 'history' then '궤짝 유랑 악단으로 시작한 브레멘이 정식 동아리와 치어로밴드를 거쳐 지금의 공연 문화로 이어진 흐름을 남깁니다.'
    else description
  end,
  updated_at = now()
where slug in ('performances', 'videos', 'photos', 'history');

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
    'performances-archive',
    'entity_carousel',
    'section/performance-archive/v1',
    'Performance playlists',
    'Pick a stage',
    '공연별로 묶어 보는 영상',
    true,
    '{}'::jsonb
  ),
  (
    'performances-stage-moments',
    'computed_photo_strip',
    'section/performance-stage-moments/v1',
    'Stage moments',
    'Scenes from the archive',
    '공연 사진으로 이어 보기',
    true,
    '{"href":"/photos","action_label":"사진 더보기"}'::jsonb
  ),
  (
    'performances-season-index',
    'computed_year_index',
    'section/performance-season-index/v1',
    'Season index',
    'Browse by year',
    '연도별 공연 목록',
    true,
    '{}'::jsonb
  ),
  (
    'history-timeline',
    'entity_timeline',
    'section/history-timeline/v1',
    'Timeline',
    'From a crate band',
    '브레멘이 쌓아 온 장면들',
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
    props = excluded.props,
    updated_at = now();

delete from public.page_sections page_section
using public.pages page_ref, public.sections section_ref
where page_section.page_id = page_ref.id
  and page_section.section_id = section_ref.id
  and (
    (
      page_ref.slug = 'performances'
      and section_ref.key in (
        'performances-current-season',
        'performances-updates'
      )
    )
    or (
      page_ref.slug = 'videos'
      and section_ref.key = 'videos-by-event'
    )
  );

with links(page_slug, section_key, sort_order) as (
  values
    ('performances', 'performances-archive', 10),
    ('performances', 'performances-stage-moments', 20),
    ('performances', 'performances-season-index', 30),
    ('videos', 'videos-featured', 10),
    ('videos', 'videos-popular', 20),
    ('videos', 'videos-library', 30),
    ('photos', 'photos-gallery', 10),
    ('history', 'history-timeline', 10)
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
set sort_order = excluded.sort_order,
    props = excluded.props;
