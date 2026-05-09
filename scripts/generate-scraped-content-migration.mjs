import { readFileSync, writeFileSync } from "node:fs"

const seedPath = process.argv[2] ?? "/tmp/bremen_seed_candidates.json"
const assetManifestPath = process.argv[3] ?? "/tmp/bremen_asset_manifest.json"
const outputPath =
  process.argv[4] ?? "supabase/migrations/20260429000009_scraped_content_seed.sql"
const rowsOutputPath = process.argv[5] ?? "/tmp/bremen_seed_rows.json"

const seed = JSON.parse(readFileSync(seedPath, "utf8"))
const assets = JSON.parse(readFileSync(assetManifestPath, "utf8"))

const eventSlugAliases = {
  "2025-poka": "2025-kp-festival",
  "2024-poka": "2024-kp-festival",
}

const eventMeta = {
  "2026-spring-welcome": {
    title: "2026 신입생 환영공연",
    subtitle: "Spring Welcome Concert",
    date: "2026-02-24",
    displayDate: "02/24",
    venue: "학생회관 1층 아틀라스 홀",
    type: "special",
    confidence: "exact",
  },
  "2026-orientation": {
    title: "2026 새내기새로배움터",
    subtitle: "Orientation Showcase",
    date: "2026-02-20",
    displayDate: "02월",
    venue: "대강당",
    type: "special",
    confidence: "approximate",
  },
  "2025-fall-regular": {
    title: "25-2 정기공연",
    subtitle: "Fall Regular Concert",
    date: "2025-12-01",
    displayDate: "12/01",
    venue: "학생회관 1층 아틀라스 홀",
    type: "regular",
    confidence: "exact",
  },
  "2025-kp-festival": {
    title: "2025 포스텍-카이스트 학생대제전",
    subtitle: "POSTECH-KAIST Festival",
    date: "2025-09-19",
    displayDate: "09/19",
    venue: "카이스트 스포츠컴플렉스",
    type: "festival",
    confidence: "exact",
  },
  "2025-stadium": {
    title: "2025 STadium",
    subtitle: "STadium Live",
    date: "2025-11-01",
    displayDate: "11월",
    venue: "학생회관",
    type: "stadium",
    confidence: "approximate",
  },
  "2025-spring-regular": {
    title: "25-1 정기공연",
    subtitle: "Spring Regular Concert",
    date: "2025-06-01",
    displayDate: "06월",
    venue: "학생회관 아틀라스홀",
    type: "regular",
    confidence: "approximate",
  },
  "2025-haemaji": {
    title: "2025 해맞이한마당",
    subtitle: "Sunrise Festival",
    date: "2025-05-01",
    displayDate: "05월",
    venue: "78계단 무대",
    type: "festival",
    confidence: "approximate",
  },
  "2025-spring-welcome": {
    title: "2025 신입생 환영공연",
    subtitle: "Spring Welcome Concert",
    date: "2025-03-01",
    displayDate: "03월",
    venue: "학생회관 아틀라스홀",
    type: "special",
    confidence: "approximate",
  },
  "2025-talmud-joint": {
    title: "2025 브레멘 x 탈무드 연합공연",
    subtitle: "Joint Concert",
    date: "2025-02-01",
    displayDate: "02월",
    venue: "학생회관 아틀라스홀",
    type: "special",
    confidence: "approximate",
  },
  "2025-orientation": {
    title: "2025 새내기새로배움터",
    subtitle: "Orientation Showcase",
    date: "2025-02-01",
    displayDate: "02월",
    venue: "대강당",
    type: "special",
    confidence: "approximate",
  },
  "2025-nuri-10-joint": {
    title: "BREMEN X NURI 10 합동 공연",
    subtitle: "Apple Academy Joint Concert",
    date: "2025-08-20",
    displayDate: "08/20",
    venue: "지곡회관 버거킹 소무대",
    type: "special",
    confidence: "exact",
  },
  "2024-fall-regular": {
    title: "24-2 정기공연",
    subtitle: "Fall Regular Concert",
    date: "2024-12-01",
    displayDate: "12월",
    venue: "학생회관 아틀라스홀",
    type: "regular",
    confidence: "approximate",
  },
  "2024-kp-festival": {
    title: "2024 포스텍-카이스트 학생대제전",
    subtitle: "POSTECH-KAIST Festival",
    date: "2024-11-01",
    displayDate: "11월",
    venue: "학생회관",
    type: "festival",
    confidence: "approximate",
  },
  "2024-stadium": {
    title: "2024 STadium",
    subtitle: "STadium Live",
    date: "2024-10-01",
    displayDate: "10월",
    venue: "학생회관",
    type: "stadium",
    confidence: "approximate",
  },
  "2024-ee-night": {
    title: "2024 EE Night",
    subtitle: "Department Night",
    date: "2024-10-01",
    displayDate: "10월",
    venue: "POSTECH",
    type: "special",
    confidence: "approximate",
  },
  "2024-cheongam-bremen": {
    title: "청암로77 X 브레멘",
    subtitle: "Joint Concert",
    date: "2024-08-01",
    displayDate: "08월",
    venue: "POSTECH",
    type: "special",
    confidence: "approximate",
  },
  "2024-spring-regular": {
    title: "24-1 정기공연",
    subtitle: "Spring Regular Concert",
    date: "2024-06-01",
    displayDate: "06월",
    venue: "학생회관 아틀라스홀",
    type: "regular",
    confidence: "approximate",
  },
  "2024-haemaji": {
    title: "2024 해맞이한마당",
    subtitle: "Sunrise Festival",
    date: "2024-05-01",
    displayDate: "05월",
    venue: "78계단 무대",
    type: "festival",
    confidence: "approximate",
  },
  "2024-orientation": {
    title: "2024 새내기새로배움터",
    subtitle: "Orientation Showcase",
    date: "2024-02-01",
    displayDate: "02월",
    venue: "대강당",
    type: "special",
    confidence: "approximate",
  },
  "2024-spring-welcome": {
    title: "2024 신입생 환영공연",
    subtitle: "Spring Welcome Concert",
    date: "2024-03-01",
    displayDate: "03월",
    venue: "학생회관 아틀라스홀",
    type: "special",
    confidence: "approximate",
  },
  "2023-spring-regular": {
    title: "2023-1 정기공연",
    subtitle: "Spring Regular Concert",
    date: "2023-06-01",
    displayDate: "06월",
    venue: "학생회관 아틀라스홀",
    type: "regular",
    confidence: "approximate",
  },
  "2023-fall-regular": {
    title: "2023-2 정기공연",
    subtitle: "Fall Regular Concert",
    date: "2023-12-01",
    displayDate: "12월",
    venue: "학생회관 아틀라스홀",
    type: "regular",
    confidence: "approximate",
  },
  "2023-stadium": {
    title: "2023 STadium 문화공연",
    subtitle: "STadium Live",
    date: "2023-10-01",
    displayDate: "10월",
    venue: "POSTECH",
    type: "stadium",
    confidence: "approximate",
  },
  "2022-fall-regular": {
    title: "2022-2 정기공연",
    subtitle: "Fall Regular Concert",
    date: "2022-12-01",
    displayDate: "12월",
    venue: "학생회관 아틀라스홀",
    type: "regular",
    confidence: "approximate",
  },
  "2022-poka": {
    title: "2022 포카전",
    subtitle: "POSTECH-KAIST Festival",
    date: "2022-09-01",
    displayDate: "09월",
    venue: "POSTECH",
    type: "festival",
    confidence: "approximate",
  },
  "2022-cover-session": {
    title: "2022 커버 세션",
    subtitle: "Cover Session",
    date: "2022-03-09",
    displayDate: "03/09",
    venue: "POSTECH",
    type: "special",
    confidence: "exact",
  },
  "2019-fall-regular": {
    title: "2019 가을학기 정기공연",
    subtitle: "Fall Regular Concert",
    date: "2019-12-01",
    displayDate: "12월",
    venue: "POSTECH",
    type: "regular",
    confidence: "approximate",
  },
  "2019-orientation": {
    title: "2019 새터",
    subtitle: "Orientation Showcase",
    date: "2019-02-01",
    displayDate: "02월",
    venue: "POSTECH",
    type: "special",
    confidence: "approximate",
  },
  "2018-regular": {
    title: "2018 정기공연",
    subtitle: "Regular Concert",
    date: "2018-12-01",
    displayDate: "12월",
    venue: "POSTECH",
    type: "regular",
    confidence: "approximate",
  },
  "2019-busking": {
    title: "2019 버스킹",
    subtitle: "Busking",
    date: "2019-04-01",
    displayDate: "04월",
    venue: "POSTECH",
    type: "special",
    confidence: "approximate",
  },
  "2019-haemaji": {
    title: "2019 해맞이한마당",
    subtitle: "Sunrise Festival",
    date: "2019-05-01",
    displayDate: "05월",
    venue: "POSTECH",
    type: "festival",
    confidence: "approximate",
  },
}

const instagramMeta = {
  DVd4nX1AVOx: { date: "2026-03-04", displayDate: "03월", eventSlug: null },
  DVY8bqxAbyV: { date: "2026-03-03", displayDate: "03/03", eventSlug: "2026-spring-welcome" },
  DVOi5F4E6fN: { date: "2026-02-28", displayDate: "02월", eventSlug: "2026-orientation" },
  DVLmlRaAW5i: { date: "2026-02-25", displayDate: "02/25", eventSlug: "2026-spring-welcome" },
  DUsQjpdDGgb: { date: "2026-02-13", displayDate: "02/13", eventSlug: null },
  "DUny-GwAUFt": { date: "2026-02-13", displayDate: "02/13", eventSlug: "2026-spring-welcome" },
  DUlD0amAYqL: { date: "2026-02-10", displayDate: "02/10", eventSlug: null },
  DUin3ZXDGNK: { date: "2026-02-10", displayDate: "02/10", eventSlug: null },
  DRli4cAgflB: { date: "2025-11-28", displayDate: "11/28", eventSlug: "2025-fall-regular" },
  DQ4LFs3gX0p: { date: "2025-10-20", displayDate: "10월", eventSlug: "2025-kp-festival" },
  DOd4dyCAYDH: { date: "2025-09-12", displayDate: "09/12", eventSlug: "2025-kp-festival" },
  DNiMZixh7fK: { date: "2025-08-14", displayDate: "08월", eventSlug: "2025-nuri-10-joint" },
}

const instagramTitleOverrides = {
  DVLmlRaAW5i: "2026 신입생 환영공연 홍보이벤트",
}

const playlistTitleToEvent = {
  "2026 신환공": "2026-spring-welcome",
  "2026 새터": "2026-orientation",
  "2025-2 정기공연": "2025-fall-regular",
  "2025-1 정기공연": "2025-spring-regular",
  "2025 STadium": "2025-stadium",
  "2025 신입생환영공연": "2025-spring-welcome",
  "2025 연합공연": "2025-talmud-joint",
  "2025 새터": "2025-orientation",
  "2024-2 브레멘 정기공연": "2024-fall-regular",
  "2024 STADIUM": "2024-stadium",
  "2024 EE Night": "2024-ee-night",
  "2024 포카전": "2024-kp-festival",
  "브레멘 X 청암로77": "2024-cheongam-bremen",
  "2024-1 브레멘 정기공연": "2024-spring-regular",
  "2024 해맞이한마당": "2024-haemaji",
  "2024 신입생환영공연": "2024-spring-welcome",
  "2024 새내기새로배움터": "2024-orientation",
  "2023 브레멘": null,
  "화석들 합주 영상": "2022-cover-session",
}

function normalizeEventSlug(slug) {
  return eventSlugAliases[slug] ?? slug
}

function sqlString(value) {
  if (value === null || value === undefined) return "null"
  return `'${String(value).replaceAll("'", "''")}'`
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function parseViews(label) {
  if (!label) return 0
  const normalized = String(label).replace(/views?/i, "").trim().toUpperCase()
  const match = normalized.match(/^([\d.]+)\s*([KM])?/)
  if (!match) return 0
  const value = Number(match[1])
  if (!Number.isFinite(value)) return 0
  if (match[2] === "M") return Math.round(value * 1_000_000)
  if (match[2] === "K") return Math.round(value * 1_000)
  return Math.round(value)
}

function assetUrl(key, fallback) {
  return assets.uploaded?.[key]?.publicUrl ?? fallback ?? null
}

function assetPath(key) {
  return assets.uploaded?.[key]?.path ?? null
}

function yearFromDate(date) {
  return date.slice(0, 4)
}

function sortAt(date, offset = 0) {
  const minutes = String(offset % 60).padStart(2, "0")
  const hours = String(12 + Math.floor(offset / 60) % 8).padStart(2, "0")
  return `${date} ${hours}:${minutes}:00+09`
}

function eventThumbnail(slug) {
  const firstVideo = seed.videos.find(
    (video) => normalizeEventSlug(video.data?.event_slug) === slug,
  )
  if (!firstVideo?.data?.youtube_id) return null
  return assetUrl(`youtube:${firstVideo.data.youtube_id}`, firstVideo.thumbnail_url)
}

const candidateEvents = seed.events.map((event) => ({
  ...event,
  slug: normalizeEventSlug(event.slug),
}))

const eventRowsBySlug = new Map()
for (const event of candidateEvents) {
  const meta = eventMeta[event.slug]
  if (!meta) continue
  const existing = eventRowsBySlug.get(event.slug)
  const recordingCount = (existing?.recordingCount ?? 0) + event.data.recording_count
  eventRowsBySlug.set(event.slug, {
    slug: event.slug,
    title: meta.title ?? event.title,
    subtitle: meta.subtitle ?? null,
    summary: `${recordingCount}개의 영상 기록`,
    thumbnailUrl: eventThumbnail(event.slug),
    sortAt: sortAt(meta.date),
    data: {
      ...event.data,
      event_date: meta.date,
      display_date: meta.displayDate,
      date_confidence: meta.confidence,
      venue: meta.venue,
      type: meta.type,
      year: yearFromDate(meta.date),
      recording_count: recordingCount,
      source_event_slug: event.slug,
    },
  })
}

for (const [slug, meta] of Object.entries(eventMeta)) {
  if (eventRowsBySlug.has(slug)) continue
  eventRowsBySlug.set(slug, {
    slug,
    title: meta.title,
    subtitle: meta.subtitle,
    summary: null,
    thumbnailUrl: null,
    sortAt: sortAt(meta.date),
    data: {
      source: "manual",
      event_date: meta.date,
      display_date: meta.displayDate,
      date_confidence: meta.confidence,
      venue: meta.venue,
      type: meta.type,
      year: yearFromDate(meta.date),
      recording_count: 0,
    },
  })
}

const videos = seed.videos.map((video) => {
  const youtubeId = video.data.youtube_id
  const eventSlug = normalizeEventSlug(video.data.event_slug)
  const views = parseViews(video.data.views_label ?? video.summary)
  const sourceIndex = video.data.source_index ?? 9999
  const event = eventRowsBySlug.get(eventSlug)
  const eventDate = event?.data.event_date ?? "2000-01-01"
  const isHighlight = /full|full ver|홍보영상|review|re:view/i.test(video.title)

  return {
    slug: `youtube-${youtubeId}`,
    title: video.title,
    subtitle: video.subtitle,
    summary: video.summary,
    thumbnailUrl: assetUrl(`youtube:${youtubeId}`, video.thumbnail_url),
    sortAt: sortAt(eventDate, sourceIndex),
    data: {
      ...video.data,
      event_slug: eventSlug,
      event_title: event?.title ?? video.data.event_title,
      source_thumbnail_url: video.thumbnail_url,
      storage_path: assetPath(`youtube:${youtubeId}`),
      views,
      views_label: video.data.views_label ?? video.summary,
      is_highlight: isHighlight,
      display_order: sourceIndex,
    },
  }
})

const instagramRows = seed.instagram.map((item, index) => {
  const shortcode = item.data.shortcode
  const meta = instagramMeta[shortcode] ?? {}
  const date = meta.date ?? "2026-01-01"
  const eventSlug = meta.eventSlug ? normalizeEventSlug(meta.eventSlug) : null

  return {
    slug: item.slug,
    title: instagramTitleOverrides[shortcode] ?? item.title,
    summary: item.data.caption,
    thumbnailUrl: assetUrl(`instagram:${shortcode}`, item.thumbnail_url),
    sortAt: sortAt(date, index),
    data: {
      ...item.data,
      event_slug: eventSlug,
      event_title: eventSlug ? eventRowsBySlug.get(eventSlug)?.title : null,
      source_url: item.source_url,
      source_thumbnail_url: item.data.transient_thumbnail_url,
      storage_path: assetPath(`instagram:${shortcode}`),
      display_date: meta.displayDate ?? null,
      taken_at: date,
      aspect: "portrait",
    },
  }
})

const historyRows = seed.history.map((item, index) => {
  const year = item.title.match(/\d{4}/)?.[0] ?? "2001"
  return {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    sortAt: sortAt(`${year}-01-01`, index),
    data: {
      ...item.data,
      year,
      display_order: (index + 1) * 10,
    },
  }
})

const playlistRows = (seed.playlists ?? []).map((playlist, index) => {
  const eventSlug = playlistTitleToEvent[playlist.title]
  const event = eventSlug ? eventRowsBySlug.get(normalizeEventSlug(eventSlug)) : null
  return {
    slug: `youtube-playlist-${playlist.playlist_id}`,
    title: playlist.title,
    summary: `${playlist.video_count ?? 0}개의 영상`,
    thumbnailUrl: playlist.seed_video_id
      ? assetUrl(`youtube:${playlist.seed_video_id}`, null)
      : null,
    sortAt: event?.sortAt ?? sortAt("2000-01-01", index),
    data: {
      source: "youtube",
      playlist_id: playlist.playlist_id,
      playlist_url: playlist.playlist_url,
      seed_video_id: playlist.seed_video_id,
      video_count: playlist.video_count,
      event_slug: eventSlug ? normalizeEventSlug(eventSlug) : null,
    },
  }
})

function entityValues(rows, entityType, schemaKey) {
  return rows
    .map((row) =>
      [
        sqlString(entityType),
        sqlString(schemaKey),
        sqlString(row.slug),
        sqlString(row.title),
        sqlString(row.subtitle ?? null),
        sqlString(row.summary ?? null),
        sqlString(row.thumbnailUrl ?? null),
        sqlString(row.sortAt),
        sqlJson(row.data),
      ].join(", "),
    )
    .map((value) => `    (${value})`)
    .join(",\n")
}

const sectionKeys = [
  "performances-current-season",
  "performances-archive",
  "videos-featured",
  "videos-popular",
  "videos-library",
  "videos-by-event",
  "photos-gallery",
  "history-timeline",
]

const sql = `-- Bremen — scraped content seed from YouTube, Instagram, and history PDF
--
-- Generated by scripts/generate-scraped-content-migration.mjs.
-- Images are expected to exist in the public Supabase Storage "images" bucket.

update public.entities
set slug = concat('youtube-', data->>'youtube_id')
where entity_type = 'video'
  and slug is null
  and data ? 'youtube_id';

insert into public.pages (slug, title, subtitle, description, published, props)
values
  ('history', '브레멘 히스토리', 'History', '브레멘의 시작과 치어로밴드, 공연 문화의 변화', true, '{}'::jsonb)
on conflict (slug) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    description = excluded.description,
    published = excluded.published,
    props = excluded.props;

insert into public.sections (key, section_type, schema_key, eyebrow, title, subtitle, published, props)
values
  ('videos-by-event', 'entity_grouped_grid', 'section/video-event-playlists/v1', 'Events', 'Recordings by stage', '공연 단위로 묶어 보는 영상 기록', true, '{}'::jsonb),
  ('history-timeline', 'entity_timeline', 'section/history-timeline/v1', 'Since 2001', 'Bremen History', '궤짝 유랑 악단에서 현재의 브레멘까지', true, '{}'::jsonb)
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
    ('videos', 'videos-by-event', 25),
    ('history', 'history-timeline', 10)
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  page_entity.id,
  section_entity.id,
  'relation/page-section/v1',
  'contains_section',
  'sections',
  links.sort_order,
  '{}'::jsonb,
  'page_sections'
from links
join public.pages page_ref on page_ref.slug = links.page_slug
join public.sections section_ref on section_ref.key = links.section_key
join public.entities page_entity
  on page_entity.source_table = 'pages'
 and page_entity.source_id = page_ref.id
join public.entities section_entity
  on section_entity.source_table = 'sections'
 and section_entity.source_id = section_ref.id
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

insert into public.entities (entity_type, schema_key, slug, title, subtitle, summary, thumbnail_url, sort_at, data, published)
values
${entityValues([...eventRowsBySlug.values()], "performance", "performance/scraped/v1")}
on conflict (slug) do update
set entity_type = excluded.entity_type,
    schema_key = excluded.schema_key,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = coalesce(excluded.thumbnail_url, public.entities.thumbnail_url),
    sort_at = excluded.sort_at,
    data = public.entities.data || excluded.data,
    published = true,
    updated_at = now();

insert into public.entities (entity_type, schema_key, slug, title, subtitle, summary, thumbnail_url, sort_at, data, published)
values
${entityValues(videos, "video", "video/youtube/v1")}
on conflict (slug) do update
set entity_type = excluded.entity_type,
    schema_key = excluded.schema_key,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = excluded.thumbnail_url,
    sort_at = excluded.sort_at,
    data = public.entities.data || excluded.data,
    published = true,
    updated_at = now();

insert into public.entities (entity_type, schema_key, slug, title, subtitle, summary, thumbnail_url, sort_at, data, published)
values
${entityValues(instagramRows, "photo", "photo/instagram-grid/v1")}
on conflict (slug) do update
set entity_type = excluded.entity_type,
    schema_key = excluded.schema_key,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = excluded.thumbnail_url,
    sort_at = excluded.sort_at,
    data = public.entities.data || excluded.data,
    published = true,
    updated_at = now();

insert into public.entities (entity_type, schema_key, slug, title, subtitle, summary, thumbnail_url, sort_at, data, published)
values
${entityValues(historyRows, "history_milestone", "history/milestone/v1")}
on conflict (slug) do update
set entity_type = excluded.entity_type,
    schema_key = excluded.schema_key,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = excluded.thumbnail_url,
    sort_at = excluded.sort_at,
    data = public.entities.data || excluded.data,
    published = true,
    updated_at = now();

insert into public.entities (entity_type, schema_key, slug, title, subtitle, summary, thumbnail_url, sort_at, data, published)
values
${entityValues(playlistRows, "playlist", "playlist/youtube/v1")}
on conflict (slug) do update
set entity_type = excluded.entity_type,
    schema_key = excluded.schema_key,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = excluded.thumbnail_url,
    sort_at = excluded.sort_at,
    data = public.entities.data || excluded.data,
    published = true,
    updated_at = now();

insert into public.entity_relations (from_entity_id, to_entity_id, relation_type, slot, sort_order, props)
select
  performance.id,
  video.id,
  'has_recording',
  'default',
  coalesce((video.data->>'display_order')::int, 0),
  '{}'::jsonb
from public.entities performance
join public.entities video
  on video.entity_type = 'video'
 and video.data->>'event_slug' = performance.slug
where performance.entity_type = 'performance'
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

insert into public.entity_relations (from_entity_id, to_entity_id, relation_type, slot, sort_order, props)
select
  performance.id,
  photo.id,
  'has_photo',
  coalesce(photo.data->>'category', 'performance'),
  row_number() over (partition by performance.id order by photo.sort_at desc)::int * 10,
  '{}'::jsonb
from public.entities performance
join public.entities photo
  on photo.entity_type = 'photo'
 and photo.data->>'event_slug' = performance.slug
where performance.entity_type = 'performance'
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

insert into public.entity_relations (from_entity_id, to_entity_id, relation_type, slot, sort_order, props)
select
  playlist.id,
  video.id,
  'contains_video',
  'default',
  coalesce((video.data->>'display_order')::int, 0),
  '{}'::jsonb
from public.entities playlist
join public.entities video
  on video.entity_type = 'video'
 and video.data->>'event_slug' = playlist.data->>'event_slug'
where playlist.entity_type = 'playlist'
  and playlist.data->>'event_slug' is not null
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set sort_order = excluded.sort_order,
    props = excluded.props;

delete from public.entity_relations relation
using public.entities section_entity, public.sections section_ref
where relation.schema_key = 'relation/section-entity/v1'
  and relation.from_entity_id = section_entity.id
  and section_entity.source_table = 'sections'
  and section_entity.source_id = section_ref.id
  and section_ref.key in (${sectionKeys.map(sqlString).join(", ")});

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'performances-current-season'
),
ordered as (
  select
    entity.id,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'performance'
    and entity.published = true
    and coalesce(entity.data->>'year', extract(year from entity.sort_at)::text) = '2026'
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'performances-archive'
),
ordered as (
  select
    entity.id,
    concat('season-', coalesce(entity.data->>'year', extract(year from entity.sort_at)::text)) as slot,
    row_number() over (
      partition by coalesce(entity.data->>'year', extract(year from entity.sort_at)::text)
      order by entity.sort_at desc, entity.title
    ) as rank
  from public.entities entity
  where entity.entity_type = 'performance'
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  ordered.slot,
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'videos-featured'
),
ordered as (
  select
    entity.id,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'video'
    and entity.published = true
    and coalesce((entity.data->>'is_highlight')::boolean, false) = true
  limit 6
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'videos-popular'
),
ordered as (
  select
    entity.id,
    row_number() over (
      order by coalesce((entity.data->>'views')::int, 0) desc, entity.sort_at desc, entity.title
    ) as rank
  from public.entities entity
  where entity.entity_type = 'video'
    and entity.published = true
  limit 6
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'videos-library'
),
ordered as (
  select
    entity.id,
    row_number() over (order by entity.sort_at desc, coalesce((entity.data->>'display_order')::int, 0), entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'video'
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'videos-by-event'
),
ordered as (
  select
    entity.id,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'playlist'
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'photos-gallery'
),
ordered as (
  select
    entity.id,
    case when entity.data->>'category' = 'daily' then 'daily' else 'performance' end as slot,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'photo'
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  ordered.slot,
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on section_entity.source_table = 'sections'
   and section_entity.source_id = section_ref.id
  where section_ref.key = 'history-timeline'
),
ordered as (
  select
    entity.id,
    row_number() over (order by coalesce((entity.data->>'display_order')::int, 0), entity.sort_at, entity.title) as rank
  from public.entities entity
  where entity.entity_type = 'history_milestone'
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_key,
  relation_type,
  slot,
  sort_order,
  props,
  source_table
)
select
  target_section.section_entity_id,
  ordered.id,
  'relation/section-entity/v1',
  'item',
  'default',
  (ordered.rank * 10)::int,
  '{}'::jsonb,
  'section_entities'
from target_section cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_key = excluded.schema_key,
    sort_order = excluded.sort_order,
    props = excluded.props,
    source_table = excluded.source_table,
    source_id = excluded.source_id;
`

writeFileSync(outputPath, sql)
writeFileSync(
  rowsOutputPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      performances: [...eventRowsBySlug.values()],
      videos,
      instagram: instagramRows,
      history: historyRows,
      playlists: playlistRows,
    },
    null,
    2,
  ),
)
console.log(
  JSON.stringify(
    {
      outputPath,
      rowsOutputPath,
      performances: eventRowsBySlug.size,
      videos: videos.length,
      instagram: instagramRows.length,
      history: historyRows.length,
      playlists: playlistRows.length,
    },
    null,
    2,
  ),
)
