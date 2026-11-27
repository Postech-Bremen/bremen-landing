begin;

do $$
declare
  clip record;
  video uuid;
  parent uuid;
  library uuid;
  section_schema uuid;
begin
  select id into strict parent from public.entities where slug = '2026-kp-festival';
  select id into strict library from public.entities where slug = 'section:videos-library';
  select id into strict section_schema from public.entity_schemas where schema_key = 'relation/section-entity/v1';
  for clip in select * from (values
    ('rh4BM-vIPyA', '2026 BREMEN 포카전 비하인드', 'BREMEN'),
    ('FWNN1PVQyE0', 'PunKanon', '이승윤'),
    ('UCynPMMKxbM', 'Get Back', '터치드(TOUCHED)'),
    ('cKc5WGgdoFU', 'Get Your Gun', '브로큰 발렌타인'),
    ('P0jHs8x0y-4', '기생충', '넬(NELL)')
  ) as clips(id, song, artist) loop
    insert into public.entities(schema_id, slug, title, thumbnail_url, sort_at, data, published, visibility)
    select id, 'youtube-' || clip.id, clip.song,
      'https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/' || clip.id || '.jpg',
      '2026-09-19T19:35:00+09',
      jsonb_build_object('youtube_id',clip.id,'youtube_url','https://www.youtube.com/watch?v=' || clip.id,
        'song',clip.song,'artist',clip.artist,'event_slug','2026-kp-festival','event_title','2026 포카전','event_date','2026-09-19'),
      true, 'public' from public.entity_schemas where schema_key='video/youtube/v1'
    on conflict(slug) do nothing;
    select id into strict video from public.entities where slug='youtube-' || clip.id;
    insert into public.entity_relations(from_entity_id,to_entity_id,schema_id,relation_type,slot,sort_order,props)
    values (library,video,section_schema,'item','default',0,'{}'),
      (parent,video,(select id from public.entity_schemas where schema_key='relation/default/v1'),'has_recording','default',0,'{}')
    on conflict(from_entity_id,to_entity_id,relation_type,slot) do nothing;
    if clip.id='rh4BM-vIPyA' then
      update public.entity_relations set to_entity_id=video, props=props || '{"caption":"2026 포카전 비하인드"}'
      where from_entity_id=(select id from public.entities where slug='section:home-hero')
        and to_entity_id=(select id from public.entities where slug='youtube-crrOhGfzrqc');
    elsif clip.id='FWNN1PVQyE0' then
      update public.entity_relations set to_entity_id=video
      where from_entity_id=(select id from public.entities where slug='section:home-stage-highlights')
        and to_entity_id=(select id from public.entities where slug='youtube-B13jyQoXEq4');
    end if;
  end loop;
  update public.entities set data=data || jsonb_build_object('recording_count',
    (select count(distinct to_entity_id) from public.entity_relations where from_entity_id=parent and relation_type='has_recording'))
  where id=parent;
end $$;

commit;
