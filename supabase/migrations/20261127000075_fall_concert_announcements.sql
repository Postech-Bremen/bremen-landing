begin;
do $$
declare
  concert record;
  event_id uuid;
  section_id uuid;
  section_slug text;
begin
  for concert in select * from (values
    ('2026-fall-regular','2026 2학기 정기공연','2026-12-01','20:20','학생회관 1층 아틀라스 홀','regular','DgO69Vzo_Hk','jpg',-100),
    ('2026-stadium','2026 BREMEN STadium 공연','2026-11-14','15:55','포스텍 대강당','festival','DfrPm_9IBIm','webp',-90)
  ) as announcements(slug,title,day,time_label,venue,kind,post,extension,position) loop
    insert into public.entities(schema_id,slug,title,sort_at,thumbnail_url,data,published,visibility)
    select id,concert.slug,concert.title,(concert.day || ' ' || concert.time_label || '+09')::timestamptz,
      'https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/' || concert.post || '.' || concert.extension,
      jsonb_build_object('source','instagram','source_url','https://www.instagram.com/p/' || concert.post || '/',
        'event_date',concert.day,'event_time',concert.time_label,'display_date',to_char(concert.day::date,'MM/DD'),
        'venue',concert.venue,'year','2026','type',concert.kind,'source_verified_at','2026-11-27','date_confidence','exact'),
      true,'public' from public.entity_schemas where schema_key='performance/scraped/v1' and active
    on conflict(slug) do nothing;
    select id into strict event_id from public.entities where slug=concert.slug;
    foreach section_slug in array array['section:performances-current-season','section:performances-archive'] loop
      select id into strict section_id from public.entities where slug=section_slug;
      insert into public.entity_relations(from_entity_id,to_entity_id,schema_id,relation_type,slot,sort_order,props)
      select section_id,event_id,id,'item',case when section_slug='section:performances-archive' then 'season-2026' else 'default' end,
        concert.position,'{}' from public.entity_schemas where schema_key='relation/section-entity/v1' and active
      on conflict(from_entity_id,to_entity_id,relation_type,slot) do nothing;
    end loop;
  end loop;
end $$;
commit;
