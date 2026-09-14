-- Issue #229. Official Instagram and YouTube sources verified 2026-09-14.
-- Adds 41 entities; preserves archive links and member/ticketing data.
-- Instagram descriptions below are editorial summaries; source URLs retain the originals.
begin;

do $preflight$
begin
  if (select count(*) from public.entity_schemas where active and schema_key in ('performance/scraped/v1','video/youtube/v1','playlist/youtube/v1','photo/instagram-grid/v1','post/instagram/v1','relation/default/v1','relation/section-entity/v1')) <> 7 then
    raise exception 'Required social content schemas are missing';
  end if;
end
$preflight$;

with incoming as (
  select * from jsonb_to_recordset($entities$[
  {
    "schema_key": "performance/scraped/v1",
    "slug": "2026-kp-festival",
    "title": "2026 포카전 폐막식 공연",
    "subtitle": null,
    "summary": "포스텍카이스트학생대제전 폐막식의 첫 무대를 BREMEN이 엽니다.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdQ1lhcgdqk.webp",
    "sort_at": "2026-09-19T19:35:00+09:00",
    "data": {
      "source": "instagram",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdQ1lhcgdqk/",
      "event_date": "2026-09-19",
      "event_time": "19:35",
      "display_date": "09/19",
      "year": "2026",
      "venue": "POSPLEX 앞 무대",
      "type": "festival",
      "date_confidence": "exact",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "performance/scraped/v1",
    "slug": "2026-kp-opening-cheer",
    "title": "2026 포카전 개막식 응원제",
    "subtitle": null,
    "summary": "BREMEN 치어로밴드가 포카전 개막식 응원제에 함께합니다.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdQ1lhcgdqk.webp",
    "sort_at": "2026-09-18T12:35:00+09:00",
    "data": {
      "source": "instagram",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdQ1lhcgdqk/",
      "event_date": "2026-09-18",
      "event_time": "12:35",
      "display_date": "09/18",
      "year": "2026",
      "venue": "POSPLEX 앞 무대",
      "type": "festival",
      "date_confidence": "exact",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "performance/scraped/v1",
    "slug": "2026-kp-eve-cheer",
    "title": "2026 포카전 전야제 치어로 공연",
    "subtitle": null,
    "summary": "BREMEN 치어로밴드가 전야제에서 포스텍 응원가를 연주합니다.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdQ1lhcgdqk.webp",
    "sort_at": "2026-09-17T20:50:00+09:00",
    "data": {
      "source": "instagram",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdQ1lhcgdqk/",
      "event_date": "2026-09-17",
      "event_time": "20:50",
      "display_date": "09/17",
      "year": "2026",
      "venue": "대강당",
      "type": "festival",
      "date_confidence": "exact",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "performance/scraped/v1",
    "slug": "2026-seoul-summer-joint",
    "title": "서울지부 여름 연합공연 잔열",
    "subtitle": null,
    "summary": "브레멘 서울지부의 여름 연합공연 전체 영상입니다.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/Y_1uGywCWaU.jpg",
    "sort_at": "2026-08-29T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=Y_1uGywCWaU",
      "event_date": "2026-08-29",
      "display_date": "08/29",
      "year": "2026",
      "venue": "001라이브홀",
      "type": "special",
      "date_confidence": "exact",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "performance/scraped/v1",
    "slug": "2026-rilakdorock-joint",
    "title": "Bremen X Rilakdorock MUSIK",
    "subtitle": null,
    "summary": "포스텍 브레멘과 애플아카데미 리락도록이 함께한 무료 연합공연.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdB4m-XAdj4.jpg",
    "sort_at": "2026-08-27T21:00:00+09:00",
    "data": {
      "source": "instagram",
      "source_url": "https://www.instagram.com/oh_gram_5th/p/DcTMBNjkxJS/",
      "event_date": "2026-08-27",
      "event_time": "21:00",
      "display_date": "08/27",
      "year": "2026",
      "venue": "지곡회관 버거킹 앞 소무대",
      "type": "special",
      "date_confidence": "exact",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "performance/scraped/v1",
    "slug": "2026-carpediem-joint",
    "title": "Bremen X CarpeDiem 연합공연",
    "subtitle": null,
    "summary": "포스텍 브레멘과 카이스트 까르페디엠이 함께한 무료 연합공연.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdBf281gVWS.jpg",
    "sort_at": "2026-08-14T18:00:00+09:00",
    "data": {
      "source": "instagram",
      "source_url": "https://www.instagram.com/postech.bremen/p/DbSNbpAAZgE/",
      "event_date": "2026-08-14",
      "event_time": "18:00",
      "display_date": "08/14",
      "year": "2026",
      "venue": "001 클럽 (서울 마포구 양화로7길 70)",
      "type": "special",
      "date_confidence": "exact",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "post/instagram/v1",
    "slug": "instagram-DdRK72AASn0",
    "title": "2026 포카전 BREMEN 셋리스트",
    "subtitle": "2026 포카전 폐막식 공연",
    "summary": "2026 포스텍카이스트학생대제전 BREMEN Setlist. 2026 POSTECH-KAIST Science War BREMEN Setlist.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdRK72AASn0.webp",
    "sort_at": "2026-09-14T12:47:46Z",
    "data": {
      "source": "instagram",
      "shortcode": "DdRK72AASn0",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdRK72AASn0/",
      "media_type": "carousel",
      "taken_at": "2026-09-14",
      "display_date": "09/14",
      "content_kind": "setlist",
      "gallery_include": false,
      "category": "performance",
      "aspect": "portrait",
      "event_slug": "2026-kp-festival",
      "event_title": "2026 포카전 폐막식 공연",
      "storage_path": "instagram/DdRK72AASn0.webp",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "post/instagram/v1",
    "slug": "instagram-DdQ1lhcgdqk",
    "title": "2026 포카전 BREMEN 공연 안내",
    "subtitle": "2026 포카전 폐막식 공연",
    "summary": "9월 19일 19:35 POSPLEX 앞 무대에서 폐막식 공연을 진행합니다. 치어로밴드는 9월 17일 20:50 대강당 전야제와 9월 18일 12:35 POSPLEX 앞 개막식 응원제에도 함께합니다.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdQ1lhcgdqk.webp",
    "sort_at": "2026-09-14T00:00:00+09:00",
    "data": {
      "source": "instagram",
      "shortcode": "DdQ1lhcgdqk",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdQ1lhcgdqk/",
      "media_type": "carousel",
      "taken_at": "2026-09-14",
      "display_date": "09/14",
      "content_kind": "event",
      "gallery_include": false,
      "category": "performance",
      "aspect": "portrait",
      "event_slug": "2026-kp-festival",
      "event_title": "2026 포카전 폐막식 공연",
      "storage_path": "instagram/DdQ1lhcgdqk.webp",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "photo/instagram-grid/v1",
    "slug": "instagram-DdB4m-XAdj4",
    "title": "Bremen X Rilakdorock 합동공연",
    "subtitle": "Bremen X Rilakdorock MUSIK",
    "summary": "애플아카데미 밴드 리락도록과 함께한 합동공연. 즐겨주셔서 감사합니다!",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdB4m-XAdj4.jpg",
    "sort_at": "2026-09-08T00:00:00+09:00",
    "data": {
      "source": "instagram",
      "shortcode": "DdB4m-XAdj4",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdB4m-XAdj4/",
      "media_type": "carousel",
      "taken_at": "2026-09-08",
      "display_date": "09/08",
      "content_kind": "notice",
      "gallery_include": true,
      "category": "performance",
      "aspect": "landscape",
      "event_slug": "2026-rilakdorock-joint",
      "event_title": "Bremen X Rilakdorock MUSIK",
      "storage_path": "instagram/DdB4m-XAdj4.jpg",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "photo/instagram-grid/v1",
    "slug": "instagram-DdBf281gVWS",
    "title": "Bremen X CarpeDiem 연합공연",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "카이스트 밴드 까르페디엠과 함께한 연합공연. 공연 영상은 001 CLUB 채널과 BREMEN 유튜브 재생목록에서 확인할 수 있습니다.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DdBf281gVWS.jpg",
    "sort_at": "2026-09-08T00:00:00+09:00",
    "data": {
      "source": "instagram",
      "shortcode": "DdBf281gVWS",
      "source_url": "https://www.instagram.com/postech.bremen/p/DdBf281gVWS/",
      "media_type": "carousel",
      "taken_at": "2026-09-08",
      "display_date": "09/08",
      "content_kind": "notice",
      "gallery_include": true,
      "category": "performance",
      "aspect": "landscape",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "storage_path": "instagram/DdBf281gVWS.jpg",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "post/instagram/v1",
    "slug": "instagram-DcTMBNjkxJS",
    "title": "APPLE X POSTECH 연합공연 MUSIK",
    "subtitle": "Bremen X Rilakdorock MUSIK",
    "summary": "2026년 8월 27일 목요일 오후 9시, 지곡회관 버거킹 앞 소무대. 브레멘과 애플아카데미 리락도록이 함께하는 무료 연합공연.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DcTMBNjkxJS.jpg",
    "sort_at": "2026-08-21T00:00:00+09:00",
    "data": {
      "source": "instagram",
      "shortcode": "DcTMBNjkxJS",
      "source_url": "https://www.instagram.com/oh_gram_5th/p/DcTMBNjkxJS/",
      "media_type": "carousel",
      "taken_at": "2026-08-21",
      "display_date": "08/21",
      "content_kind": "event",
      "gallery_include": false,
      "category": "performance",
      "aspect": "portrait",
      "event_slug": "2026-rilakdorock-joint",
      "event_title": "Bremen X Rilakdorock MUSIK",
      "storage_path": "instagram/DcTMBNjkxJS.jpg",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "post/instagram/v1",
    "slug": "instagram-DbSNbpAAZgE",
    "title": "POSTECH X KAIST 밴드 연합공연",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "2026년 8월 14일 금요일 18:00, 서울 마포구 양화로7길 70의 001 클럽. 브레멘과 까르페디엠의 무료 연합공연.",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/instagram/DbSNbpAAZgE.webp",
    "sort_at": "2026-07-26T00:00:00+09:00",
    "data": {
      "source": "instagram",
      "shortcode": "DbSNbpAAZgE",
      "source_url": "https://www.instagram.com/postech.bremen/p/DbSNbpAAZgE/",
      "media_type": "carousel",
      "taken_at": "2026-07-26",
      "display_date": "07/26",
      "content_kind": "event",
      "gallery_include": false,
      "category": "performance",
      "aspect": "portrait",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "storage_path": "instagram/DbSNbpAAZgE.webp",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "playlist/youtube/v1",
    "slug": "youtube-playlist-PLc7DeJRhSVmI",
    "title": "2026 연합공연",
    "subtitle": null,
    "summary": "Bremen X CarpeDiem 연합공연 공연 영상 12개",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/WTFMDFq2cnA.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/playlist?list=PLc7DeJRhSVmI",
      "playlist_id": "PLc7DeJRhSVmI",
      "playlist_url": "https://www.youtube.com/playlist?list=PLc7DeJRhSVmI",
      "seed_video_id": "WTFMDFq2cnA",
      "video_count": 12,
      "event_slug": "2026-carpediem-joint",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "playlist/youtube/v1",
    "slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "title": "2026-1 정기공연",
    "subtitle": null,
    "summary": "2026 1학기 정기공연 공연 영상 14개",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/crrOhGfzrqc.jpg",
    "sort_at": "2026-05-26T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/playlist?list=PLT5UAYtc-ZVU",
      "playlist_id": "PLT5UAYtc-ZVU",
      "playlist_url": "https://www.youtube.com/playlist?list=PLT5UAYtc-ZVU",
      "seed_video_id": "crrOhGfzrqc",
      "video_count": 14,
      "event_slug": "2026-spring-regular",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "playlist/youtube/v1",
    "slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "title": "2026 해맞이한마당",
    "subtitle": null,
    "summary": "2026 해맞이한마당 공연 영상 7개",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/coQtSu5y5AE.jpg",
    "sort_at": "2026-05-08T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/playlist?list=PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
      "playlist_id": "PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
      "playlist_url": "https://www.youtube.com/playlist?list=PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
      "seed_video_id": "nWLjvJ2PzJg",
      "video_count": 7,
      "event_slug": "2026-haemaji",
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-WTFMDFq2cnA",
    "title": "포스텍 Bremen - 내일에서 온 티켓 (Cover 한로로)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/WTFMDFq2cnA.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=WTFMDFq2cnA",
      "youtube_id": "WTFMDFq2cnA",
      "youtube_url": "https://www.youtube.com/watch?v=WTFMDFq2cnA",
      "channel_title": "001 CLUB",
      "duration": "3:13",
      "views": 46,
      "views_label": "46 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "한로로",
      "song": "내일에서 온 티켓",
      "source_index": 0,
      "display_order": 0,
      "storage_path": "youtube-thumbnails/WTFMDFq2cnA.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-SmIkpnb2NEs",
    "title": "포스텍 Bremen - PINKTOP (Cover The volunteers)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/SmIkpnb2NEs.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=SmIkpnb2NEs",
      "youtube_id": "SmIkpnb2NEs",
      "youtube_url": "https://www.youtube.com/watch?v=SmIkpnb2NEs",
      "channel_title": "001 CLUB",
      "duration": "5:21",
      "views": 30,
      "views_label": "30 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "The volunteers",
      "song": "PINKTOP",
      "source_index": 1,
      "display_order": 1,
      "storage_path": "youtube-thumbnails/SmIkpnb2NEs.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-bHgAGa2-4-0",
    "title": "포스텍 Bremen - 석류의맛 (Cover 쏜애플)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/bHgAGa2-4-0.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=bHgAGa2-4-0",
      "youtube_id": "bHgAGa2-4-0",
      "youtube_url": "https://www.youtube.com/watch?v=bHgAGa2-4-0",
      "channel_title": "001 CLUB",
      "duration": "7:58",
      "views": 55,
      "views_label": "55 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "쏜애플",
      "song": "석류의맛",
      "source_index": 2,
      "display_order": 2,
      "storage_path": "youtube-thumbnails/bHgAGa2-4-0.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-UkfqQrzlWY8",
    "title": "포스텍 Bremen - 기타와 고독과 푸른 별 (Cover 결속밴드)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/UkfqQrzlWY8.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=UkfqQrzlWY8",
      "youtube_id": "UkfqQrzlWY8",
      "youtube_url": "https://www.youtube.com/watch?v=UkfqQrzlWY8",
      "channel_title": "001 CLUB",
      "duration": "3:43",
      "views": 21,
      "views_label": "21 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "결속밴드",
      "song": "기타와 고독과 푸른 별",
      "source_index": 3,
      "display_order": 3,
      "storage_path": "youtube-thumbnails/UkfqQrzlWY8.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-3zhvliBiiDg",
    "title": "포스텍 Bremen - 시퍼런 봄 (Cover 쏜애플)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/3zhvliBiiDg.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=3zhvliBiiDg",
      "youtube_id": "3zhvliBiiDg",
      "youtube_url": "https://www.youtube.com/watch?v=3zhvliBiiDg",
      "channel_title": "001 CLUB",
      "duration": "4:44",
      "views": 35,
      "views_label": "35 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "쏜애플",
      "song": "시퍼런 봄",
      "source_index": 4,
      "display_order": 4,
      "storage_path": "youtube-thumbnails/3zhvliBiiDg.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-NeKoPYS_U6M",
    "title": "포스텍 Bremen - you give love a bad name (Cover Bon Jovi)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/NeKoPYS_U6M.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=NeKoPYS_U6M",
      "youtube_id": "NeKoPYS_U6M",
      "youtube_url": "https://www.youtube.com/watch?v=NeKoPYS_U6M",
      "channel_title": "001 CLUB",
      "duration": "3:53",
      "views": 26,
      "views_label": "26 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "Bon Jovi",
      "song": "you give love a bad name",
      "source_index": 5,
      "display_order": 5,
      "storage_path": "youtube-thumbnails/NeKoPYS_U6M.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-0UXZPZ9KQ1M",
    "title": "포스텍 Bremen - Destiny (Cover SURL)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/0UXZPZ9KQ1M.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=0UXZPZ9KQ1M",
      "youtube_id": "0UXZPZ9KQ1M",
      "youtube_url": "https://www.youtube.com/watch?v=0UXZPZ9KQ1M",
      "channel_title": "001 CLUB",
      "duration": "3:53",
      "views": 38,
      "views_label": "38 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "SURL",
      "song": "Destiny",
      "source_index": 6,
      "display_order": 6,
      "storage_path": "youtube-thumbnails/0UXZPZ9KQ1M.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-g0ZPRm2A4rw",
    "title": "포스텍 Bremen - 해초 (Cover 한로로)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/g0ZPRm2A4rw.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=g0ZPRm2A4rw",
      "youtube_id": "g0ZPRm2A4rw",
      "youtube_url": "https://www.youtube.com/watch?v=g0ZPRm2A4rw",
      "channel_title": "001 CLUB",
      "duration": "3:43",
      "views": 38,
      "views_label": "38 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "한로로",
      "song": "해초",
      "source_index": 7,
      "display_order": 7,
      "storage_path": "youtube-thumbnails/g0ZPRm2A4rw.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-2qQbm8-2jhg",
    "title": "포스텍 Bremen - Stand up (Cover TOUCHED)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/2qQbm8-2jhg.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=2qQbm8-2jhg",
      "youtube_id": "2qQbm8-2jhg",
      "youtube_url": "https://www.youtube.com/watch?v=2qQbm8-2jhg",
      "channel_title": "001 CLUB",
      "duration": "4:16",
      "views": 14,
      "views_label": "14 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "TOUCHED",
      "song": "Stand up",
      "source_index": 8,
      "display_order": 8,
      "storage_path": "youtube-thumbnails/2qQbm8-2jhg.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-kStBxp1he4A",
    "title": "포스텍 Bremen - Last Day (Cover TOUCHED)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/kStBxp1he4A.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=kStBxp1he4A",
      "youtube_id": "kStBxp1he4A",
      "youtube_url": "https://www.youtube.com/watch?v=kStBxp1he4A",
      "channel_title": "001 CLUB",
      "duration": "5:46",
      "views": 51,
      "views_label": "51 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "TOUCHED",
      "song": "Last Day",
      "source_index": 9,
      "display_order": 9,
      "storage_path": "youtube-thumbnails/kStBxp1he4A.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-SDiTCeL6PPI",
    "title": "포스텍 Bremen - Detox (Cover SURL)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/SDiTCeL6PPI.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=SDiTCeL6PPI",
      "youtube_id": "SDiTCeL6PPI",
      "youtube_url": "https://www.youtube.com/watch?v=SDiTCeL6PPI",
      "channel_title": "001 CLUB",
      "duration": "4:05",
      "views": 29,
      "views_label": "29 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "SURL",
      "song": "Detox",
      "source_index": 10,
      "display_order": 10,
      "storage_path": "youtube-thumbnails/SDiTCeL6PPI.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-I90xKQWkDes",
    "title": "포스텍 Bremen - 맛있는 술 (Cover 혁오)",
    "subtitle": "Bremen X CarpeDiem 연합공연",
    "summary": "Bremen X CarpeDiem 연합공연 | 001 CLUB",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/I90xKQWkDes.jpg",
    "sort_at": "2026-08-14T00:00:00+09:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=I90xKQWkDes",
      "youtube_id": "I90xKQWkDes",
      "youtube_url": "https://www.youtube.com/watch?v=I90xKQWkDes",
      "channel_title": "001 CLUB",
      "duration": "4:01",
      "views": 35,
      "views_label": "35 views",
      "event_slug": "2026-carpediem-joint",
      "event_title": "Bremen X CarpeDiem 연합공연",
      "event_date": "2026-08-14",
      "collection_kind": "performance",
      "artist": "혁오",
      "song": "맛있는 술",
      "source_index": 11,
      "display_order": 11,
      "storage_path": "youtube-thumbnails/I90xKQWkDes.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-crrOhGfzrqc",
    "title": "성시경 - 거리에서, 희재, 너는 나의 봄이다, 안녕 나의 사랑 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n성시경 - 거리에서\r\n성시경 - 희재\r\n성시경 - 너는 나의 봄이다\r\n성시경 - 안녕 나의 사랑\n\n밴드 동아리에서 성시경이 무슨 말이냐 따지고 싶지만 학번 때문에 차마 따지지 못하고 강행된 팀\r\nVo. 채수강 Key. 최해민",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/crrOhGfzrqc.jpg",
    "sort_at": "2026-09-07T07:04:32+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=crrOhGfzrqc",
      "youtube_id": "crrOhGfzrqc",
      "youtube_url": "https://www.youtube.com/watch?v=crrOhGfzrqc",
      "channel_title": "Postech Bremen",
      "duration": "14:49",
      "views": 485,
      "views_label": "485 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:32+00:00",
      "artist": "성시경",
      "song": "거리에서, 희재, 너는 나의 봄이다, 안녕 나의 사랑",
      "source_index": 0,
      "display_order": 0,
      "storage_path": "youtube-thumbnails/crrOhGfzrqc.jpg",
      "is_highlight": true,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-ioYN1OYlyPA",
    "title": "혁오 - New born, Ohio, 와리가리 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n혁오 - New born\r\n혁오 - Ohio\r\n혁오 - 와리가리\n\nㅎㅇ 팀\r\nVo. 변우열 Dr. 서준희 Ba. 홍준우 Gt. 김동규 양지윤",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/ioYN1OYlyPA.jpg",
    "sort_at": "2026-09-07T07:04:27+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=ioYN1OYlyPA",
      "youtube_id": "ioYN1OYlyPA",
      "youtube_url": "https://www.youtube.com/watch?v=ioYN1OYlyPA",
      "channel_title": "Postech Bremen",
      "duration": "11:48",
      "views": 41,
      "views_label": "41 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:27+00:00",
      "artist": "혁오",
      "song": "New born, Ohio, 와리가리",
      "source_index": 1,
      "display_order": 1,
      "storage_path": "youtube-thumbnails/ioYN1OYlyPA.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-2wd0iqqy2aI",
    "title": "유다빈밴드 - once, 항해, 축배 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n유다빈밴드 - once\r\n유다빈밴드 - 항해\r\n유다빈밴드 - 축배\n\n2126 팀\r\nVo. 유혜인 Dr. 임동현 Ba. 홍지우 Gt. 김동규 김찬우 Key. 장서희",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/2wd0iqqy2aI.jpg",
    "sort_at": "2026-09-07T07:04:40+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=2wd0iqqy2aI",
      "youtube_id": "2wd0iqqy2aI",
      "youtube_url": "https://www.youtube.com/watch?v=2wd0iqqy2aI",
      "channel_title": "Postech Bremen",
      "duration": "13:00",
      "views": 33,
      "views_label": "33 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:40+00:00",
      "artist": "유다빈밴드",
      "song": "once, 항해, 축배",
      "source_index": 2,
      "display_order": 2,
      "storage_path": "youtube-thumbnails/2wd0iqqy2aI.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-AsR70eLyLVk",
    "title": "쏜애플 - 피난, 백치, 살아있는 너의 밤 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n쏜애플 - 피난\r\n쏜애플 - 백치\r\n쏜애플 - 살아있는 너의 밤\n\n쏜파인애플애플펜 팀\r\nVo. 박윤서 Dr. 황준혁 Ba. 남궁성주 Gt. 김경철 손준서",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/AsR70eLyLVk.jpg",
    "sort_at": "2026-09-07T07:04:47+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=AsR70eLyLVk",
      "youtube_id": "AsR70eLyLVk",
      "youtube_url": "https://www.youtube.com/watch?v=AsR70eLyLVk",
      "channel_title": "Postech Bremen",
      "duration": "14:52",
      "views": 54,
      "views_label": "54 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:47+00:00",
      "artist": "쏜애플",
      "song": "피난, 백치, 살아있는 너의 밤",
      "source_index": 3,
      "display_order": 3,
      "storage_path": "youtube-thumbnails/AsR70eLyLVk.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-U5OEvjIO0-I",
    "title": "Paramore - Decode, Now, Still Into You | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\nParamore - Decode (Live ver.)\r\nParamore - Now\r\nParamore - Still Into You\n\northomore 팀\r\nVo. 정서영 Dr. 박준혁 Ba. 홍준우 Gt. 김동규 이서경",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/U5OEvjIO0-I.jpg",
    "sort_at": "2026-09-07T07:04:51+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=U5OEvjIO0-I",
      "youtube_id": "U5OEvjIO0-I",
      "youtube_url": "https://www.youtube.com/watch?v=U5OEvjIO0-I",
      "channel_title": "Postech Bremen",
      "duration": "11:33",
      "views": 49,
      "views_label": "49 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:51+00:00",
      "artist": "Paramore",
      "song": "Decode, Now, Still Into You",
      "source_index": 4,
      "display_order": 4,
      "storage_path": "youtube-thumbnails/U5OEvjIO0-I.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-3An1Fg8Suhw",
    "title": "브로큰 발렌타인 - Please don't fall, Answer me | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n브로큰 발렌타인 - Please don't fall\r\n브로큰 발렌타인 - Answer me\n\n브레멘발냄새 팀\r\nVo. 박성현 Dr. 황준혁 Ba. 남궁성주 Gt. 김동규 김예성 Key. 문준호",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/3An1Fg8Suhw.jpg",
    "sort_at": "2026-09-07T07:04:53+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=3An1Fg8Suhw",
      "youtube_id": "3An1Fg8Suhw",
      "youtube_url": "https://www.youtube.com/watch?v=3An1Fg8Suhw",
      "channel_title": "Postech Bremen",
      "duration": "8:14",
      "views": 79,
      "views_label": "79 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:53+00:00",
      "artist": "브로큰 발렌타인",
      "song": "Please don't fall, Answer me",
      "source_index": 5,
      "display_order": 5,
      "storage_path": "youtube-thumbnails/3An1Fg8Suhw.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-Z5CtnzdjHDM",
    "title": "Walking with You, 각자의 밤, 초신성 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\nNovelbright - Walking with You\r\n나상현씨밴드 - 각자의 밤\r\n행로난 - 초신성\n\n26 A팀\r\nVo. 김긍현 김태우 Dr. 임동현 Ba. 최소윤 Gt. 손준서 윤찬영 Key. 장서희",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/Z5CtnzdjHDM.jpg",
    "sort_at": "2026-09-07T07:04:56+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=Z5CtnzdjHDM",
      "youtube_id": "Z5CtnzdjHDM",
      "youtube_url": "https://www.youtube.com/watch?v=Z5CtnzdjHDM",
      "channel_title": "Postech Bremen",
      "duration": "10:35",
      "views": 73,
      "views_label": "73 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:56+00:00",
      "song": "Walking with You, 각자의 밤, 초신성",
      "source_index": 6,
      "display_order": 6,
      "storage_path": "youtube-thumbnails/Z5CtnzdjHDM.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-wFp--DWisr8",
    "title": "흰수염고래, Ling Ling, 나에게로 떠나는 여행 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\nQWER(원곡 YB) - 흰수염고래\r\n검정치마 - Ling Ling\r\n버즈 - 나에게로 떠나는 여행\n\n26 B팀\r\nVo. 김세아 Dr. 김재연 Ba. 이서경 Gt. 서이현 옥소희 Key. 이지후",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/wFp--DWisr8.jpg",
    "sort_at": "2026-09-07T07:04:58+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=wFp--DWisr8",
      "youtube_id": "wFp--DWisr8",
      "youtube_url": "https://www.youtube.com/watch?v=wFp--DWisr8",
      "channel_title": "Postech Bremen",
      "duration": "11:44",
      "views": 140,
      "views_label": "140 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:04:58+00:00",
      "song": "흰수염고래, Ling Ling, 나에게로 떠나는 여행",
      "source_index": 7,
      "display_order": 7,
      "storage_path": "youtube-thumbnails/wFp--DWisr8.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-Ow6DIZtvsqM",
    "title": "요루시카 - 패배자에게 앵콜은 필요없어, 폭탄마, 준투명소년 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n요루시카 - 負け犬にアンコールはいらない (패배자에게 앵콜은 필요없어)\r\n요루시카 - 爆弾魔(폭탄마)\r\n요루시카 - 準透明少年 (준투명소년)\n\n카치우마 팀\r\nVo. 박윤서 Dr. 박준혁 Ba. 남궁성주 Gt. 김경철 김예성 Key. 장서희",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/Ow6DIZtvsqM.jpg",
    "sort_at": "2026-09-07T07:05:01+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=Ow6DIZtvsqM",
      "youtube_id": "Ow6DIZtvsqM",
      "youtube_url": "https://www.youtube.com/watch?v=Ow6DIZtvsqM",
      "channel_title": "Postech Bremen",
      "duration": "12:16",
      "views": 192,
      "views_label": "192 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:05:01+00:00",
      "artist": "요루시카",
      "song": "패배자에게 앵콜은 필요없어, 폭탄마, 준투명소년",
      "source_index": 8,
      "display_order": 8,
      "storage_path": "youtube-thumbnails/Ow6DIZtvsqM.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-yaqTqjdKWMY",
    "title": "파란노을 - 아름다운세상 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n파란노을 - 아름다운세상\n\n파란노을 팀\r\nVo. 강승호 Dr. 황준혁 Ba. 남궁성주 Gt. 김경철 김예성 Key. 채민경",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/yaqTqjdKWMY.jpg",
    "sort_at": "2026-09-07T07:05:04+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=yaqTqjdKWMY",
      "youtube_id": "yaqTqjdKWMY",
      "youtube_url": "https://www.youtube.com/watch?v=yaqTqjdKWMY",
      "channel_title": "Postech Bremen",
      "duration": "4:59",
      "views": 78,
      "views_label": "78 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:05:04+00:00",
      "artist": "파란노을",
      "song": "아름다운세상",
      "source_index": 9,
      "display_order": 9,
      "storage_path": "youtube-thumbnails/yaqTqjdKWMY.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-6NxgYwUUxxA",
    "title": "유인원 - SAM + EOP | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\n유인원 - SAM\r\n유인원 - EOP\n\n🐒(유인원)팀\r\nVo. 김긍현 Dr. 박준혁 Ba. 김성은 Gt. 김효성 전길수 Key. 홍지우",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/6NxgYwUUxxA.jpg",
    "sort_at": "2026-09-07T07:05:07+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=6NxgYwUUxxA",
      "youtube_id": "6NxgYwUUxxA",
      "youtube_url": "https://www.youtube.com/watch?v=6NxgYwUUxxA",
      "channel_title": "Postech Bremen",
      "duration": "6:21",
      "views": 133,
      "views_label": "133 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:05:07+00:00",
      "artist": "유인원",
      "song": "SAM + EOP",
      "source_index": 10,
      "display_order": 10,
      "storage_path": "youtube-thumbnails/6NxgYwUUxxA.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-B13jyQoXEq4",
    "title": "YB - 붉은노을 | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\nYB - 붉은노을\n\n22 팀\r\nVo. 변우열 Dr. 백지은 Ba. 장서연 Gt. 김찬우 백승현 Key. 홍지우",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/B13jyQoXEq4.jpg",
    "sort_at": "2026-09-07T07:05:09+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=B13jyQoXEq4",
      "youtube_id": "B13jyQoXEq4",
      "youtube_url": "https://www.youtube.com/watch?v=B13jyQoXEq4",
      "channel_title": "Postech Bremen",
      "duration": "4:29",
      "views": 119,
      "views_label": "119 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:05:09+00:00",
      "artist": "YB",
      "song": "붉은노을",
      "source_index": 11,
      "display_order": 11,
      "storage_path": "youtube-thumbnails/B13jyQoXEq4.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-ay1Ek-nq16o",
    "title": "Halestrom - I get off, Slipknot - Eyeless | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\nHalestrom - I get off\r\nSlipknot - Eyeless\n\n돌고래자살단 팀\r\nVo. 유혜인 Dr. 박준혁 Ba. 전길수 Gt. 안동현 윤찬영",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/ay1Ek-nq16o.jpg",
    "sort_at": "2026-09-07T07:05:12+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=ay1Ek-nq16o",
      "youtube_id": "ay1Ek-nq16o",
      "youtube_url": "https://www.youtube.com/watch?v=ay1Ek-nq16o",
      "channel_title": "Postech Bremen",
      "duration": "7:00",
      "views": 88,
      "views_label": "88 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:05:12+00:00",
      "artist": "Halestrom",
      "song": "I get off, Slipknot - Eyeless",
      "source_index": 12,
      "display_order": 12,
      "storage_path": "youtube-thumbnails/ay1Ek-nq16o.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-UIEIFQvwQOc",
    "title": "Megadeth - Symphony Of Destruction, Holy Wars...The Punishment Due | 포스텍 브레멘 커버 | 26-1 정기공연",
    "subtitle": "2026 1학기 정기공연",
    "summary": "20260526 포스텍 대표 밴드 BREMEN 정기공연\r\nMegadeth - Symphony Of Destruction\r\nMegadeth - Holy Wars...The Punishment Due\r\n(앵콜) Metallica - Enter Sandman\n\n메틀팀\r\nVo. 김효성 Dr. 박준혁 Ba. 김성은 Gt. 김효성 전길수",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/UIEIFQvwQOc.jpg",
    "sort_at": "2026-09-07T07:05:15+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=UIEIFQvwQOc",
      "youtube_id": "UIEIFQvwQOc",
      "youtube_url": "https://www.youtube.com/watch?v=UIEIFQvwQOc",
      "channel_title": "Postech Bremen",
      "duration": "15:54",
      "views": 109,
      "views_label": "109 views",
      "event_slug": "2026-spring-regular",
      "event_title": "2026 1학기 정기공연",
      "event_date": "2026-05-26",
      "collection_kind": "performance",
      "published_at": "2026-09-07T07:05:15+00:00",
      "artist": "Megadeth",
      "song": "Symphony Of Destruction, Holy Wars...The Punishment Due",
      "source_index": 13,
      "display_order": 13,
      "storage_path": "youtube-thumbnails/UIEIFQvwQOc.jpg",
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-nWLjvJ2PzJg",
    "title": "터치드(Touched) - 야경 | 포스텍 브레멘 COVER | 2026 해맞이",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/nWLjvJ2PzJg.jpg",
    "sort_at": "2026-05-08T03:00:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=nWLjvJ2PzJg",
      "youtube_id": "nWLjvJ2PzJg",
      "youtube_url": "https://www.youtube.com/watch?v=nWLjvJ2PzJg",
      "channel_title": "Postech Bremen",
      "duration": "5:24",
      "views": 163,
      "views_label": "163 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "artist": "터치드(Touched)",
      "song": "야경",
      "source_index": 0,
      "display_order": 0,
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-febCCBym7LI",
    "title": "Queen - Don't stop me now | 포스텍 브레멘 COVER | 2026 해맞이",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/febCCBym7LI.jpg",
    "sort_at": "2026-05-08T03:01:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=febCCBym7LI",
      "youtube_id": "febCCBym7LI",
      "youtube_url": "https://www.youtube.com/watch?v=febCCBym7LI",
      "channel_title": "Postech Bremen",
      "duration": "3:55",
      "views": 99,
      "views_label": "99 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "artist": "Queen",
      "song": "Don't stop me now",
      "source_index": 1,
      "display_order": 1,
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-T5mz95e_b9s",
    "title": "SURL(설) - DETOX | 포스텍 브레멘 COVER | 2026 해맞이",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/T5mz95e_b9s.jpg",
    "sort_at": "2026-05-08T03:02:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=T5mz95e_b9s",
      "youtube_id": "T5mz95e_b9s",
      "youtube_url": "https://www.youtube.com/watch?v=T5mz95e_b9s",
      "channel_title": "Postech Bremen",
      "duration": "4:13",
      "views": 177,
      "views_label": "177 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "artist": "SURL(설)",
      "song": "DETOX",
      "source_index": 2,
      "display_order": 2,
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-K-fkChNWiyc",
    "title": "전영호 - Butter-Fly | 포스텍 브레멘 COVER | 2026 해맞이",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/K-fkChNWiyc.jpg",
    "sort_at": "2026-05-08T03:03:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=K-fkChNWiyc",
      "youtube_id": "K-fkChNWiyc",
      "youtube_url": "https://www.youtube.com/watch?v=K-fkChNWiyc",
      "channel_title": "Postech Bremen",
      "duration": "4:39",
      "views": 637,
      "views_label": "637 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "artist": "전영호",
      "song": "Butter-Fly",
      "source_index": 3,
      "display_order": 3,
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-Uq4B6_TaTGc",
    "title": "로맨틱펀치 - 토요일 밤이 좋아 | 포스텍 브레멘 COVER | 2026 해맞이",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/Uq4B6_TaTGc.jpg",
    "sort_at": "2026-05-08T03:04:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=Uq4B6_TaTGc",
      "youtube_id": "Uq4B6_TaTGc",
      "youtube_url": "https://www.youtube.com/watch?v=Uq4B6_TaTGc",
      "channel_title": "Postech Bremen",
      "duration": "5:57",
      "views": 177,
      "views_label": "177 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "artist": "로맨틱펀치",
      "song": "토요일 밤이 좋아",
      "source_index": 4,
      "display_order": 4,
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-GhaDMht6-sM",
    "title": "2026 BREMEN 해맞이한마당 비하인드",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/GhaDMht6-sM.jpg",
    "sort_at": "2026-05-08T03:05:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=GhaDMht6-sM",
      "youtube_id": "GhaDMht6-sM",
      "youtube_url": "https://www.youtube.com/watch?v=GhaDMht6-sM",
      "channel_title": "Postech Bremen",
      "duration": "1:27",
      "views": 105,
      "views_label": "105 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "song": "2026 BREMEN 해맞이한마당 비하인드",
      "source_index": 5,
      "display_order": 5,
      "is_highlight": false,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-coQtSu5y5AE",
    "title": "2026 POSTECH 해맞이한마당 BREMEN (Full Ver.)",
    "subtitle": "2026 해맞이한마당",
    "summary": "2026 해맞이한마당 | Postech Bremen",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/coQtSu5y5AE.jpg",
    "sort_at": "2026-05-08T03:06:00+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=coQtSu5y5AE",
      "youtube_id": "coQtSu5y5AE",
      "youtube_url": "https://www.youtube.com/watch?v=coQtSu5y5AE",
      "channel_title": "Postech Bremen",
      "duration": "26:53",
      "views": 195,
      "views_label": "195 views",
      "event_slug": "2026-haemaji",
      "event_title": "2026 해맞이한마당",
      "event_date": "2026-05-08",
      "collection_kind": "performance",
      "song": "2026 POSTECH 해맞이한마당 BREMEN (Full Ver.)",
      "source_index": 6,
      "display_order": 6,
      "is_highlight": true,
      "source_verified_at": "2026-09-14"
    }
  },
  {
    "schema_key": "video/youtube/v1",
    "slug": "youtube-Y_1uGywCWaU",
    "title": "[서울지부] 26-여름 연합공연 FULL",
    "subtitle": "서울지부 여름 연합공연 잔열",
    "summary": "브레멘 서울지부 여름 연합공연 [잔열]\r\n2026.08.29 001라이브홀\r\nV. 김형수 이수민 이정재\r\nG. 김영철 박민규 최지훈\r\nB. 최재현 최지훈\r\nD. 김주희 박준혁 홍재영\r\nK. 홍성권\r\nS. 김형수\r\n\r\n00:00:00 ASIAN KUNG-FU GENERATION - Senseless\r\n00:05:21 wave to earth - bad\r\n00:11:35 검정치마 - 섬 (Queen of Diamonds)\r\n00:15:57 서태지와 아이들 - 시대유감\r\n00:19:10 요루시카 - 봄도둑\r\n00:24:03 검정치마 - Antifreeze\r\n00:28:13 쏜애플 - 아지랑이\r\n00:33:01 X JAPAN - Endless Rain\r\n00:39:19 My Chemical Romance - The End. + Dead!\r\n00:44:23 초록불꽃소년단 - 그저 귀여운 츠보미였는걸",
    "thumbnail_url": "https://tyosnoncxaewrjlbnytg.supabase.co/storage/v1/object/public/images/youtube-thumbnails/Y_1uGywCWaU.jpg",
    "sort_at": "2026-08-31T06:38:59+00:00",
    "data": {
      "source": "youtube",
      "source_url": "https://www.youtube.com/watch?v=Y_1uGywCWaU",
      "youtube_id": "Y_1uGywCWaU",
      "youtube_url": "https://www.youtube.com/watch?v=Y_1uGywCWaU",
      "channel_title": "Postech Bremen",
      "duration": "50:03",
      "views": 408,
      "views_label": "408 views",
      "event_slug": "2026-seoul-summer-joint",
      "event_title": "서울지부 여름 연합공연 잔열",
      "event_date": "2026-08-29",
      "collection_kind": "performance",
      "published_at": "2026-08-31T06:38:59+00:00",
      "song": "[서울지부] 26-여름 연합공연 FULL",
      "source_index": 14,
      "display_order": 14,
      "storage_path": "youtube-thumbnails/Y_1uGywCWaU.jpg",
      "is_highlight": true,
      "source_verified_at": "2026-09-14"
    }
  }
]$entities$::jsonb)
    as x(schema_key text, slug text, title text, subtitle text, summary text, thumbnail_url text, sort_at timestamptz, data jsonb)
)
insert into public.entities (schema_id, slug, title, subtitle, summary, thumbnail_url, sort_at, data, published, visibility)
select schema.id, x.slug, x.title, x.subtitle, x.summary, x.thumbnail_url, x.sort_at, x.data, true, 'public'
from incoming x join public.entity_schemas schema on schema.schema_key = x.schema_key and schema.active
on conflict (slug) do update set
  title = excluded.title, subtitle = excluded.subtitle, summary = excluded.summary,
  thumbnail_url = excluded.thumbnail_url, sort_at = excluded.sort_at,
  data = public.entities.data || excluded.data;

do $relations$
declare
  item record;
  from_id uuid;
  to_id uuid;
  relation_schema_id uuid;
begin
  for item in select * from jsonb_to_recordset($links$[
  {
    "from_slug": "section:performances-current-season",
    "to_slug": "2026-kp-festival",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -60,
    "props": {}
  },
  {
    "from_slug": "section:performances-archive",
    "to_slug": "2026-kp-festival",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "season-2026",
    "sort_order": -60,
    "props": {}
  },
  {
    "from_slug": "section:performances-current-season",
    "to_slug": "2026-kp-opening-cheer",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -50,
    "props": {}
  },
  {
    "from_slug": "section:performances-archive",
    "to_slug": "2026-kp-opening-cheer",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "season-2026",
    "sort_order": -50,
    "props": {}
  },
  {
    "from_slug": "section:performances-current-season",
    "to_slug": "2026-kp-eve-cheer",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -40,
    "props": {}
  },
  {
    "from_slug": "section:performances-archive",
    "to_slug": "2026-kp-eve-cheer",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "season-2026",
    "sort_order": -40,
    "props": {}
  },
  {
    "from_slug": "section:performances-current-season",
    "to_slug": "2026-seoul-summer-joint",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -30,
    "props": {}
  },
  {
    "from_slug": "section:performances-archive",
    "to_slug": "2026-seoul-summer-joint",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "season-2026",
    "sort_order": -30,
    "props": {}
  },
  {
    "from_slug": "section:performances-current-season",
    "to_slug": "2026-rilakdorock-joint",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -20,
    "props": {}
  },
  {
    "from_slug": "section:performances-archive",
    "to_slug": "2026-rilakdorock-joint",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "season-2026",
    "sort_order": -20,
    "props": {}
  },
  {
    "from_slug": "section:performances-current-season",
    "to_slug": "2026-carpediem-joint",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -10,
    "props": {}
  },
  {
    "from_slug": "section:performances-archive",
    "to_slug": "2026-carpediem-joint",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "season-2026",
    "sort_order": -10,
    "props": {}
  },
  {
    "from_slug": "2026-kp-festival",
    "to_slug": "instagram-DdRK72AASn0",
    "schema_key": "relation/default/v1",
    "relation_type": "has_post",
    "slot": "setlist",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "section:performances-updates",
    "to_slug": "instagram-DdRK72AASn0",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "setlist",
    "sort_order": -60,
    "props": {}
  },
  {
    "from_slug": "2026-kp-festival",
    "to_slug": "instagram-DdQ1lhcgdqk",
    "schema_key": "relation/default/v1",
    "relation_type": "has_post",
    "slot": "event",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "section:performances-updates",
    "to_slug": "instagram-DdQ1lhcgdqk",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "event",
    "sort_order": -50,
    "props": {}
  },
  {
    "from_slug": "2026-rilakdorock-joint",
    "to_slug": "instagram-DdB4m-XAdj4",
    "schema_key": "relation/default/v1",
    "relation_type": "has_photo",
    "slot": "performance",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "section:photos-gallery",
    "to_slug": "instagram-DdB4m-XAdj4",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "gallery",
    "sort_order": -40,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "instagram-DdBf281gVWS",
    "schema_key": "relation/default/v1",
    "relation_type": "has_photo",
    "slot": "performance",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "section:photos-gallery",
    "to_slug": "instagram-DdBf281gVWS",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "gallery",
    "sort_order": -30,
    "props": {}
  },
  {
    "from_slug": "2026-rilakdorock-joint",
    "to_slug": "instagram-DcTMBNjkxJS",
    "schema_key": "relation/default/v1",
    "relation_type": "has_post",
    "slot": "event",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "section:performances-updates",
    "to_slug": "instagram-DcTMBNjkxJS",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "event",
    "sort_order": -20,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "instagram-DbSNbpAAZgE",
    "schema_key": "relation/default/v1",
    "relation_type": "has_post",
    "slot": "event",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "section:performances-updates",
    "to_slug": "instagram-DbSNbpAAZgE",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "event",
    "sort_order": -10,
    "props": {}
  },
  {
    "from_slug": "2026-kp-opening-cheer",
    "to_slug": "instagram-DdQ1lhcgdqk",
    "schema_key": "relation/default/v1",
    "relation_type": "has_post",
    "slot": "event",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "2026-kp-eve-cheer",
    "to_slug": "instagram-DdQ1lhcgdqk",
    "schema_key": "relation/default/v1",
    "relation_type": "has_post",
    "slot": "event",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "section:videos-by-event",
    "to_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -20,
    "props": {}
  },
  {
    "from_slug": "section:videos-by-event",
    "to_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -10,
    "props": {}
  },
  {
    "from_slug": "section:videos-by-event",
    "to_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": 5,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-WTFMDFq2cnA",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-WTFMDFq2cnA",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-WTFMDFq2cnA",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -300,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-SmIkpnb2NEs",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-SmIkpnb2NEs",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-SmIkpnb2NEs",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -299,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-bHgAGa2-4-0",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-bHgAGa2-4-0",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-bHgAGa2-4-0",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -298,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-UkfqQrzlWY8",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-UkfqQrzlWY8",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-UkfqQrzlWY8",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -297,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-3zhvliBiiDg",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-3zhvliBiiDg",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-3zhvliBiiDg",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -296,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-NeKoPYS_U6M",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-NeKoPYS_U6M",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-NeKoPYS_U6M",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -295,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-0UXZPZ9KQ1M",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 60,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-0UXZPZ9KQ1M",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 60,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-0UXZPZ9KQ1M",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -294,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-g0ZPRm2A4rw",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 70,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-g0ZPRm2A4rw",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 70,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-g0ZPRm2A4rw",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -293,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-2qQbm8-2jhg",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 80,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-2qQbm8-2jhg",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 80,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-2qQbm8-2jhg",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -292,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-kStBxp1he4A",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 90,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-kStBxp1he4A",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 90,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-kStBxp1he4A",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -291,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-SDiTCeL6PPI",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 100,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-SDiTCeL6PPI",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 100,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-SDiTCeL6PPI",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -290,
    "props": {}
  },
  {
    "from_slug": "2026-carpediem-joint",
    "to_slug": "youtube-I90xKQWkDes",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 110,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLc7DeJRhSVmI",
    "to_slug": "youtube-I90xKQWkDes",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 110,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-I90xKQWkDes",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -289,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-crrOhGfzrqc",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-crrOhGfzrqc",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-crrOhGfzrqc",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -288,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-ioYN1OYlyPA",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-ioYN1OYlyPA",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-ioYN1OYlyPA",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -287,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-2wd0iqqy2aI",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-2wd0iqqy2aI",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-2wd0iqqy2aI",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -286,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-AsR70eLyLVk",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-AsR70eLyLVk",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-AsR70eLyLVk",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -285,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-U5OEvjIO0-I",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-U5OEvjIO0-I",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-U5OEvjIO0-I",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -284,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-3An1Fg8Suhw",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-3An1Fg8Suhw",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-3An1Fg8Suhw",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -283,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-Z5CtnzdjHDM",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 60,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-Z5CtnzdjHDM",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 60,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-Z5CtnzdjHDM",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -282,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-wFp--DWisr8",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 70,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-wFp--DWisr8",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 70,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-wFp--DWisr8",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -281,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-Ow6DIZtvsqM",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 80,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-Ow6DIZtvsqM",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 80,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-Ow6DIZtvsqM",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -280,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-yaqTqjdKWMY",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 90,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-yaqTqjdKWMY",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 90,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-yaqTqjdKWMY",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -279,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-6NxgYwUUxxA",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 100,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-6NxgYwUUxxA",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 100,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-6NxgYwUUxxA",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -278,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-B13jyQoXEq4",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 110,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-B13jyQoXEq4",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 110,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-B13jyQoXEq4",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -277,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-ay1Ek-nq16o",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 120,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-ay1Ek-nq16o",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 120,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-ay1Ek-nq16o",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -276,
    "props": {}
  },
  {
    "from_slug": "2026-spring-regular",
    "to_slug": "youtube-UIEIFQvwQOc",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 130,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLT5UAYtc-ZVU",
    "to_slug": "youtube-UIEIFQvwQOc",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 130,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-UIEIFQvwQOc",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -275,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-nWLjvJ2PzJg",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-nWLjvJ2PzJg",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 0,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-febCCBym7LI",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-febCCBym7LI",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 10,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-T5mz95e_b9s",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-T5mz95e_b9s",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 20,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-K-fkChNWiyc",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-K-fkChNWiyc",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 30,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-Uq4B6_TaTGc",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-Uq4B6_TaTGc",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 40,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-GhaDMht6-sM",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-GhaDMht6-sM",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 50,
    "props": {}
  },
  {
    "from_slug": "2026-haemaji",
    "to_slug": "youtube-coQtSu5y5AE",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 60,
    "props": {}
  },
  {
    "from_slug": "youtube-playlist-PLS8sJ3uGl5j4aEC9BMm7uk4efk4mnwptJ",
    "to_slug": "youtube-coQtSu5y5AE",
    "schema_key": "relation/default/v1",
    "relation_type": "contains_video",
    "slot": "default",
    "sort_order": 60,
    "props": {}
  },
  {
    "from_slug": "2026-seoul-summer-joint",
    "to_slug": "youtube-Y_1uGywCWaU",
    "schema_key": "relation/default/v1",
    "relation_type": "has_recording",
    "slot": "default",
    "sort_order": 140,
    "props": {}
  },
  {
    "from_slug": "section:videos-library",
    "to_slug": "youtube-Y_1uGywCWaU",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -267,
    "props": {}
  },
  {
    "from_slug": "section:home-hero",
    "to_slug": "youtube-crrOhGfzrqc",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "featured",
    "slot": "default",
    "sort_order": 10,
    "props": {
      "caption": "2026 1학기 정기공연 · 성시경 팀"
    },
    "previous_to_slug": "youtube-kvIgeZFp0gQ"
  },
  {
    "from_slug": "section:home-stage-highlights",
    "to_slug": "youtube-B13jyQoXEq4",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": 10,
    "props": {},
    "previous_to_slug": "youtube-tR8bSxa4igQ"
  },
  {
    "from_slug": "section:videos-featured",
    "to_slug": "youtube-B13jyQoXEq4",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -40,
    "props": {}
  },
  {
    "from_slug": "section:home-stage-highlights",
    "to_slug": "youtube-U5OEvjIO0-I",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": 20,
    "props": {},
    "previous_to_slug": "youtube-4r1PqeuEoyM"
  },
  {
    "from_slug": "section:videos-featured",
    "to_slug": "youtube-U5OEvjIO0-I",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -30,
    "props": {}
  },
  {
    "from_slug": "section:home-stage-highlights",
    "to_slug": "youtube-WTFMDFq2cnA",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": 30,
    "props": {},
    "previous_to_slug": "youtube-8c6Q_bu76m8"
  },
  {
    "from_slug": "section:videos-featured",
    "to_slug": "youtube-WTFMDFq2cnA",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -20,
    "props": {}
  },
  {
    "from_slug": "section:home-stage-highlights",
    "to_slug": "youtube-Y_1uGywCWaU",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": 40,
    "props": {},
    "previous_to_slug": "youtube-ZA0pnBAXX1A"
  },
  {
    "from_slug": "section:videos-featured",
    "to_slug": "youtube-Y_1uGywCWaU",
    "schema_key": "relation/section-entity/v1",
    "relation_type": "item",
    "slot": "default",
    "sort_order": -10,
    "props": {}
  }
]$links$::jsonb)
    as x(from_slug text, to_slug text, schema_key text, relation_type text, slot text, sort_order integer, props jsonb, previous_to_slug text)
  loop
    select id into from_id from public.entities where slug = item.from_slug;
    select id into to_id from public.entities where slug = item.to_slug;
    select id into relation_schema_id from public.entity_schemas where schema_key = item.schema_key and active;
    if from_id is null or to_id is null or relation_schema_id is null then
      raise exception 'Missing graph reference: % -> %', item.from_slug, item.to_slug;
    end if;
    -- Retarget existing homepage picks while preserving their CMS relation ids.
    if item.previous_to_slug is not null then
      update public.entity_relations relation set to_entity_id = to_id
      where relation.from_entity_id = from_id
        and relation.to_entity_id = (select id from public.entities where slug = item.previous_to_slug)
        and relation.schema_id = relation_schema_id
        and relation.relation_type = item.relation_type and relation.slot = item.slot;
    end if;
    insert into public.entity_relations (from_entity_id, to_entity_id, schema_id, relation_type, slot, sort_order, props)
    values (from_id, to_id, relation_schema_id, item.relation_type, item.slot, item.sort_order, item.props)
    on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
      set sort_order = excluded.sort_order, props = excluded.props;
  end loop;
end
$relations$;

update public.entities performance
set data = performance.data || jsonb_build_object('recording_count', (
  select count(distinct relation.to_entity_id) from public.entity_relations relation
  where relation.from_entity_id = performance.id and relation.relation_type = 'has_recording'
))
where performance.slug in ('2026-kp-festival', '2026-kp-opening-cheer', '2026-kp-eve-cheer', '2026-seoul-summer-joint', '2026-rilakdorock-joint', '2026-carpediem-joint', '2026-spring-regular', '2026-haemaji');

commit;
