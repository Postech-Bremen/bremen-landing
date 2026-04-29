-- Bremen — seed data
-- Idempotent: safe to re-run.

-- =====================================================================
-- first admin placeholder (will auto-link when hyeongsoo signs up)
-- =====================================================================

insert into public.members (email, name, status, role, student_year)
values ('hyeongsoo@postech.ac.kr', '김형수', 'active', 'admin', 2021)
on conflict (email) do update
  set status = 'active', role = 'admin';

-- =====================================================================
-- performances (4 confirmed events with videos + historical entries)
-- =====================================================================

insert into public.performances (slug, title, subtitle, event_date, venue, type, published) values
  ('2026-spring-welcome',  '2026 신입생 환영공연',          'Spring Welcome Concert',     '2026-04-13', '학생회관 아틀라스홀',     'special',  true),
  ('2026-1-regular',       '26-1 정기공연',                  '2026 Spring Regular',         '2026-05-26', '학생회관 아틀라스홀',     'regular',  true),
  ('2026-haemaji',         '2026 해맞이한마당',              'Sunrise Festival',            '2026-05-07', '78계단 무대',             'festival', true),
  ('2025-fall-regular',    '25-2 정기공연',                  '2025 Fall Regular Concert',   '2025-12-15', '학생회관 아틀라스홀',     'regular',  true),
  ('2025-stadium',         '2025 STadium',                    'Stadium Live',                '2025-10-15', '학생회관',                'stadium',  true),
  ('2025-orientation',     '2025 새내기새로배움터',          'Orientation Showcase',        '2025-09-22', '대강당',                  'special',  true),
  ('2025-kp-festival',     '2025 포스텍-카이스트 학생대제전', 'POSTECH-KAIST Festival',     '2025-11-20', '학생회관',                'festival', true),
  ('2025-haemaji',         '2025 해맞이한마당',              'Sunrise Festival',            '2025-10-08', '78계단 무대',             'festival', true),
  ('2025-spring-regular',  '25-1 정기공연',                  '2025 Spring Regular',         '2025-05-25', '학생회관 아틀라스홀',     'regular',  true),
  ('2024-fall-regular',    '24-2 정기공연',                  '2024 Fall Regular',           '2024-12-18', '학생회관 아틀라스홀',     'regular',  true),
  ('2024-kp-festival',     '2024 포스텍-카이스트 학생대제전', 'POSTECH-KAIST Festival',     '2024-11-10', '학생회관',                'festival', true),
  ('2024-haemaji',         '2024 해맞이한마당',              'Sunrise Festival',            '2024-10-08', '78계단 무대',             'festival', true),
  ('2024-orientation',     '2024 새내기새로배움터',          'Orientation Showcase',        '2024-09-22', '대강당',                  'special',  true),
  ('2024-spring-regular',  '24-1 정기공연',                  '2024 Spring Regular',         '2024-05-18', '학생회관 아틀라스홀',     'regular',  true)
on conflict (slug) do nothing;

-- =====================================================================
-- videos (21 from @postech_bremen channel)
-- =====================================================================

with perf as (
  select slug, id from public.performances
)
insert into public.videos (youtube_id, performance_id, title, artist, song, team, duration, views, is_highlight, display_order)
values
  -- 2026 신환공
  ('sgDwk_UGHZE', (select id from perf where slug='2026-spring-welcome'), 'Bon Jovi - You Give Love a Bad Name', 'Bon Jovi', 'You Give Love a Bad Name', null, '4:01',    98, false, 10),
  ('TR3dgK5sqx8', (select id from perf where slug='2026-spring-welcome'), 'SURL(설) - Cilla',                    'SURL(설)', 'Cilla',                    null, '5:25',    46, false, 20),
  ('hjXIfCHx0-I', (select id from perf where slug='2026-spring-welcome'), '한로로 - 사랑하게 될 거야',           '한로로',    '사랑하게 될 거야',         null, '2:38',   126, false, 30),
  ('0PZIb2ORP8U', (select id from perf where slug='2026-spring-welcome'), '쏜애플 - 시퍼런 봄',                   '쏜애플',    '시퍼런 봄',                null, '5:40',   104, false, 40),
  ('OfzCQB3e644', (select id from perf where slug='2026-spring-welcome'), '브로큰 발렌타인 - Quasimodo',         '브로큰 발렌타인', 'Quasimodo',          null, '4:40',    47, false, 50),
  ('lPnkF2QurxE', (select id from perf where slug='2026-spring-welcome'), '한로로 - 해초',                        '한로로',    '해초',                     null, '3:38',   154, false, 60),
  -- 25-2 정기공연
  ('kvIgeZFp0gQ', (select id from perf where slug='2025-fall-regular'),   'Dream Theater - Octavarium',           'Dream Theater', 'Octavarium',         'Team Eternity',     '22:56', 540, false, 10),
  ('kJVwTZeaFFI', (select id from perf where slug='2025-fall-regular'),   '한로로 - 내일에서 온 티켓, 0+0, 용의자', '한로로',    '내일에서 온 티켓 / 0+0 / 용의자', '자살클럽',  '10:01', 191, false, 20),
  ('rG2H8B360Bo', (select id from perf where slug='2025-fall-regular'),   '터치드 - 여정, Bad Sniper, Get Back',   '터치드',    '여정 / Bad Sniper / Get Back',   '돌아온 터치드', '12:25',  85, false, 30),
  ('cC6ybD8EMOk', (select id from perf where slug='2025-fall-regular'),   '양문학 - OOPARTS, 1999',                '양문학',    'OOPARTS / 1999',                 '음문학',      '11:30',  40, false, 40),
  ('QqUk16SxgyU', (select id from perf where slug='2025-fall-regular'),   '결속 밴드 - 기타, 고독, 푸른 행성',     '결속 밴드', '기타 / 고독 / 푸른 행성',         '봇치',         '3:57',  77, false, 50),
  ('dOTgY7w1KsM', (select id from perf where slug='2025-fall-regular'),   '유다빈밴드 - 안중',                      '유다빈밴드', '안중',                          '일서연일서영', '4:19',  48, false, 60),
  -- 2025 STadium
  ('DpiI7mAcxjA', (select id from perf where slug='2025-stadium'),         '한로로 - 해초',                          '한로로',    '해초',                          null, '3:42', 746, false, 10),
  ('5zhd0eCO0tQ', (select id from perf where slug='2025-stadium'),         '터치드 - Last Day',                       '터치드',    'Last Day',                       null, '5:53',  93, false, 20),
  ('e4cjxqcQWgk', (select id from perf where slug='2025-stadium'),         '넬 - Star Shell',                          '넬',        'Star Shell',                     null, '4:20', 127, false, 30),
  ('P4c5aS7p5lI', (select id from perf where slug='2025-stadium'),         '크라잉넛 - 좋지 아니한가',                '크라잉넛',  '좋지 아니한가',                  null, '4:40',  86, false, 40),
  -- 2025 새터
  ('Lx4_I9V0yss', (select id from perf where slug='2025-orientation'),     '2025 POSTECH 새내기새로배움터 BREMEN',    null,         null,                              null, '16:39', 399, true,  10),
  ('83Ic_e-gW9I', (select id from perf where slug='2025-orientation'),     '이승윤 - 비싼 숙취',                       '이승윤',    '비싼 숙취',                      null, '3:33', 7400, false, 20),
  ('tR8bSxa4igQ', (select id from perf where slug='2025-orientation'),     '쏜애플 - 빨간 피터',                       '쏜애플',    '빨간 피터',                      null, '4:44',  983, false, 30),
  ('sf26ZMJzBk4', (select id from perf where slug='2025-orientation'),     '하현우 - Lazenca, Save Us',                '하현우',    'Lazenca, Save Us',               null, '3:21',  584, false, 40),
  ('zj9I4hi6ths', (select id from perf where slug='2025-orientation'),     '버즈 - 나에게로 떠나는 여행',              '버즈',      '나에게로 떠나는 여행',           null, '3:14',  519, false, 50)
on conflict (youtube_id) do nothing;
