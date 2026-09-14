-- Issue #229. Clarify labels for the expanded recording archive.
begin;

update public.entities
set data = data || jsonb_build_object(
  'artist', 'BREMEN 서울지부',
  'song', '여름 연합공연 잔열 (Full Ver.)'
)
where slug = 'youtube-Y_1uGywCWaU';

update public.entities
set title = '수록 영상 조회수',
    summary = '공식 채널·연합공연 영상의 수집 시점 합계'
where slug = 'home-stat-youtube-views';

commit;
