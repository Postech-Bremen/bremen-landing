-- Seed CMS-editable home activity cards, join body copy, and global site chrome.

update public.sections
set props = coalesce(props, '{}'::jsonb) || jsonb_build_object(
  'body',
  '매년 1학기 초에 학부 1학년 새내기를 대상으로 부원을 모집합니다.' || chr(10) ||
  '음악을 사랑하고 함께 연주하고 싶은 마음만 있다면 환영합니다.',
  'body_accent',
  '음악을 사랑하고 함께 연주하고 싶은 마음만 있다면 환영합니다.'
)
where key = 'home-join';

update public.sections
set props = coalesce(props, '{}'::jsonb) || jsonb_build_object(
  'body',
  '네 가지 축으로 굴러갑니다 — 팀별 합주, 멘토링, 치어로 응원, 그리고 음악만큼 진한 친목.',
  'body_accent',
  '음악만큼 진한 친목'
)
where key = 'home-activities';

insert into public.pages (slug, title, subtitle, description, published, props)
values (
  'site',
  'Site chrome',
  'Global navigation and footer',
  '브레멘 전역 헤더와 푸터 구성',
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
    'site-navigation',
    'site_navigation',
    'section/site-navigation/v1',
    null,
    'Navigation',
    null,
    true,
    jsonb_build_object(
      'brand_href', '/',
      'brand_aria_label', 'Bremen 홈',
      'brand_title', 'Bremen',
      'brand_suffix', '@ POSTECH',
      'logo_src', '/bremen-logo.jpg',
      'logo_alt', '',
      'account_signed_in_label', '내 정보',
      'account_signed_out_label', 'Sign in',
      'account_signed_in_href', '/mypage',
      'account_signed_out_href', '/login?next=/mypage'
    )
  ),
  (
    'site-footer',
    'site_footer',
    'section/site-footer/v1',
    null,
    'Footer',
    null,
    true,
    jsonb_build_object(
      'title_kr', '브레멘',
      'title_en', 'Bremen',
      'eyebrow', '포스텍 밴드 동아리',
      'description', '음악을 사랑하는 사람들이 모여 함께 연주하고 공연하는 공동체. 2001년 창립 이래 포스텍의 음악 문화를 만들어왔습니다.',
      'contact_title', '연락 · 모임',
      'social_title', 'SNS',
      'copyright_name', '브레멘',
      'founding_year', 2001,
      'since_label', 'Since 2001'
    )
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
    ('site', 'site-navigation', 10),
    ('site', 'site-footer', 20)
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
    'activity',
    'activity/home-card/v1',
    'activity-band-rehearsal',
    'Band rehearsal',
    '밴드 합주',
    '팀별 자율적 합주와 공연 준비',
    null,
    '2001-01-01 00:00:00+09',
    '{"schedule":"팀별 자율","variant":"text","tilt":"-4.5deg"}'::jsonb,
    true
  ),
  (
    'activity',
    'activity/home-card/v1',
    'activity-instrument-mentoring',
    'Instrument mentoring',
    '악기별 멘토링',
    '선배의 기초 레슨과 1:1 코칭',
    null,
    '2001-01-01 00:00:00+09',
    '{"schedule":"주 1–2회","variant":"color","tilt":"4deg"}'::jsonb,
    true
  ),
  (
    'activity',
    'activity/home-card/v1',
    'activity-cheerleading-band',
    'Cheerleading band',
    '치어로 밴드',
    '포스텍 응원단의 응원곡 연주',
    null,
    '2001-01-01 00:00:00+09',
    '{"schedule":"응원 일정","variant":"text","tilt":"-3.5deg"}'::jsonb,
    true
  ),
  (
    'activity',
    'activity/home-card/v1',
    'activity-off-stage-life',
    'Off-stage life',
    '친목 활동',
    'MT · 스키캠프 · 경주월드 · 폭짜',
    null,
    '2001-01-01 00:00:00+09',
    '{"schedule":"수시","variant":"color","tilt":"4.5deg"}'::jsonb,
    true
  ),
  (
    'navigation_item',
    'navigation/item/v1',
    'nav-home',
    '홈',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"href":"/"}'::jsonb,
    true
  ),
  (
    'navigation_item',
    'navigation/item/v1',
    'nav-performances',
    '공연',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"href":"/performances"}'::jsonb,
    true
  ),
  (
    'navigation_item',
    'navigation/item/v1',
    'nav-videos',
    '영상',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"href":"/videos"}'::jsonb,
    true
  ),
  (
    'navigation_item',
    'navigation/item/v1',
    'nav-members',
    '멤버',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"href":"/members"}'::jsonb,
    true
  ),
  (
    'navigation_item',
    'navigation/item/v1',
    'nav-photos',
    '사진',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"href":"/photos"}'::jsonb,
    true
  ),
  (
    'navigation_item',
    'navigation/item/v1',
    'nav-history',
    '역사',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"href":"/history"}'::jsonb,
    true
  ),
  (
    'contact_item',
    'contact/site-footer/v1',
    'footer-contact-room',
    '학생회관 401호',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"kind":"location"}'::jsonb,
    true
  ),
  (
    'contact_item',
    'contact/site-footer/v1',
    'footer-contact-rehearsal',
    '매주 수요일 21:30',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"kind":"time"}'::jsonb,
    true
  ),
  (
    'social_link',
    'social/site-footer/v1',
    'footer-social-instagram',
    '@postech.bremen',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"kind":"instagram","href":"https://www.instagram.com/postech.bremen"}'::jsonb,
    true
  ),
  (
    'social_link',
    'social/site-footer/v1',
    'footer-social-youtube',
    '@postech_bremen',
    null,
    null,
    null,
    '2001-01-01 00:00:00+09',
    '{"kind":"youtube","href":"https://www.youtube.com/@postech_bremen"}'::jsonb,
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
  and section_ref.key in ('home-activities', 'site-navigation', 'site-footer');

with item_seed(section_key, entity_slug, relation_type, slot, sort_order, props) as (
  values
    ('home-activities', 'activity-band-rehearsal', 'item', 'default', 10, '{}'::jsonb),
    ('home-activities', 'activity-instrument-mentoring', 'item', 'default', 20, '{}'::jsonb),
    ('home-activities', 'activity-cheerleading-band', 'item', 'default', 30, '{}'::jsonb),
    ('home-activities', 'activity-off-stage-life', 'item', 'default', 40, '{}'::jsonb),

    ('site-navigation', 'nav-home', 'item', 'primary', 10, '{}'::jsonb),
    ('site-navigation', 'nav-performances', 'item', 'primary', 20, '{}'::jsonb),
    ('site-navigation', 'nav-videos', 'item', 'primary', 30, '{}'::jsonb),
    ('site-navigation', 'nav-members', 'item', 'primary', 40, '{}'::jsonb),
    ('site-navigation', 'nav-photos', 'item', 'primary', 50, '{}'::jsonb),
    ('site-navigation', 'nav-history', 'item', 'primary', 60, '{}'::jsonb),

    ('site-footer', 'footer-contact-room', 'item', 'contact', 10, '{}'::jsonb),
    ('site-footer', 'footer-contact-rehearsal', 'item', 'contact', 20, '{}'::jsonb),
    ('site-footer', 'footer-social-instagram', 'item', 'social', 10, '{}'::jsonb),
    ('site-footer', 'footer-social-youtube', 'item', 'social', 20, '{}'::jsonb)
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
    props = excluded.props,
    updated_at = now();
