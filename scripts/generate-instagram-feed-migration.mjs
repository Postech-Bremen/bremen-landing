import { readFileSync, writeFileSync } from "node:fs"

const feedPath = process.argv[2] ?? "/tmp/bremen_instagram_feed.json"
const assetManifestPath =
  process.argv[3] ?? "/tmp/bremen_instagram_asset_manifest.json"
const outputPath =
  process.argv[4] ?? "supabase/migrations/20260429000029_expanded_instagram_seed.sql"
const rowsOutputPath =
  process.argv[5] ?? "/tmp/bremen_instagram_seed_rows.json"

const feed = JSON.parse(readFileSync(feedPath, "utf8"))
const assets = JSON.parse(readFileSync(assetManifestPath, "utf8"))

const knownEventTitles = {
  "2026-1-regular": "26-1 정기공연",
  "2026-haemaji": "2026 해맞이한마당",
  "2026-spring-welcome": "2026 신입생 환영공연",
  "2026-orientation": "2026 새내기새로배움터",
  "2025-fall-regular": "25-2 정기공연",
  "2025-stadium": "2025 STadium",
  "2025-kp-festival": "2025 포스텍-카이스트 학생대제전",
  "2025-nuri-10-joint": "BREMEN X NURI 10 합동 공연",
  "2025-spring-regular": "25-1 정기공연",
  "2025-haemaji": "2025 해맞이한마당",
  "2025-spring-welcome": "2025 신입생 환영공연",
  "2025-talmud-joint": "2025 브레멘 x 탈무드 연합공연",
  "2025-orientation": "2025 새내기새로배움터",
  "2024-fall-regular": "24-2 정기공연",
  "2024-kp-festival": "2024 포스텍-카이스트 학생대제전",
  "2024-ee-night": "2024 EE Night",
  "2024-stadium": "2024 STadium",
  "2024-cheongam-bremen": "청암로77 X 브레멘",
  "2024-spring-regular": "24-1 정기공연",
  "2024-haemaji": "2024 해맞이한마당",
  "2024-spring-welcome": "2024 신입생 환영공연",
  "2024-orientation": "2024 새내기새로배움터",
  "2023-fall-regular": "2023-2 정기공연",
  "2023-stadium": "2023 STadium 문화공연",
  "2023-spring-regular": "2023-1 정기공연",
  "2022-fall-regular": "2022-2 정기공연",
  "2022-poka": "2022 포카전",
  "2022-cover-session": "2022 커버 세션",
}

const titleOverrides = {
  C1g5jsihsY_: "2023 해맞이한마당",
  C1g5hQfBjkP: "2023 1학기 정기공연",
  C1g5eZ_BnuQ: "2023 교복제",
  C1g5cp7Bdpz: "2023 오션월드 / 경주월드",
  C1g5aBDhwOQ: "2023 포카전",
  C1g5YCWB8P_: "2023 포카전",
  C1g5UvfBkq: "2023 STadium",
  "C1g5UvfBk-q": "2023 STadium",
  C1g5SkRhVac: "2023 STadium",
  C1g5PYFBQSC: "2023 2학기 정기공연",
}

function sqlString(value) {
  if (value === null || value === undefined) return "null"
  return `'${String(value).replaceAll("'", "''")}'`
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function schemaIdExpr(schemaKey) {
  return `(select id from public.entity_schemas where schema_key = ${sqlString(schemaKey)} and active = true)`
}

function semanticKindPredicate(alias, semanticKind) {
  return `${alias}.schema_id in (select id from public.entity_schemas where semantic_kind = ${sqlString(semanticKind)} and active = true)`
}

function sectionSchemaPredicate(alias) {
  return `${alias}.schema_id in (select id from public.entity_schemas where kind = 'section' and active = true)`
}

function compactText(value, limit = 420) {
  const text = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()

  if (text.length <= limit) return text
  return `${text.slice(0, limit - 1).trimEnd()}…`
}

function displayDate(date) {
  if (!date) return null
  const [, , month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []
  return month && day ? `${month}/${day}` : date
}

function timestampAtKst(item) {
  if (item.taken_at_timestamp) {
    const iso = new Date(Number(item.taken_at_timestamp) * 1000).toISOString()
    return iso.replace("T", " ").replace(".000Z", "+00")
  }

  const minute = String(Math.max(0, 59 - (item.index % 60))).padStart(2, "0")
  return `${item.taken_at} 12:${minute}:00+09`
}

function yearFrom(item, text) {
  return text.match(/20\d{2}/)?.[0] ?? item.taken_at?.slice(0, 4) ?? null
}

function regularSlug(year, text, item) {
  if (!year) return null

  if (/1학기|1\s*학기|1\s*정기|spring|2025-1|2024\s*1학기|2023-1/i.test(text)) {
    return `${year}-spring-regular`
  }

  if (/2학기|2\s*학기|2\s*정기|fall|겨울|winter|2025-2|2024\s*2학기|2023-2/i.test(text)) {
    return `${year}-fall-regular`
  }

  const month = Number(item.taken_at?.slice(5, 7) ?? 0)
  if (month >= 8) return `${year}-fall-regular`

  return `${year}-spring-regular`
}

function inferEventSlug(item) {
  const text = `${item.title} ${item.caption.slice(0, 600)}`
  const year = yearFrom(item, text)

  if (/NURI|누리/i.test(text)) return "2025-nuri-10-joint"
  if (/탈무드/.test(text)) return "2025-talmud-joint"
  if (/동아리\s*박람회|동아리박람회/.test(text)) return year ? `${year}-club-fair` : null
  if (/포카|카이스트|대제전/.test(text)) {
    if (year === "2022") return "2022-poka"
    return year ? `${year}-kp-festival` : null
  }
  if (/새내기새로배움터|새터|응원가 교육/.test(text)) return year ? `${year}-orientation` : null
  if (/신입생 환영/.test(text)) return year ? `${year}-spring-welcome` : null
  if (/정기\s*공연|정기공연|SPRING 정기|BREMEN 정기/i.test(text)) {
    return regularSlug(year, text, item)
  }
  if (/해맞이/.test(text)) return year ? `${year}-haemaji` : null
  if (/STadium|Stadium|스타디움/i.test(text)) return year ? `${year}-stadium` : null

  return null
}

function fallbackEventTitle(slug) {
  if (!slug) return null
  if (knownEventTitles[slug]) return knownEventTitles[slug]

  const match = slug.match(/^(20\d{2})-(.+)$/)
  if (!match) return null

  const [, year, kind] = match
  if (kind === "spring-welcome") return `${year} 신입생 환영공연`
  if (kind === "orientation") return `${year} 새내기새로배움터`
  if (kind === "haemaji") return `${year} 해맞이한마당`
  if (kind === "kp-festival") return `${year} 포스텍-카이스트 학생대제전`
  if (kind === "stadium") return `${year} STadium`
  if (kind === "spring-regular") return `${year} 1학기 정기공연`
  if (kind === "fall-regular") return `${year} 2학기 정기공연`
  if (kind === "club-fair") return `${year} 동아리박람회`

  return null
}

function isRecruitingTitle(title) {
  return /모집|지원 마감|신규 동아리원|신입부원|부원 모집|보컬 모집/.test(title)
}

function classify(item) {
  const text = `${item.title} ${item.caption}`
  const lead = `${item.title} ${item.caption.slice(0, 260)}`
  const hasThanks =
    /즐겨주셔서 감사|즐겨주신.*감사|찾아주셔서 감사|호응.*감사|공연 완료|고생 많았|감사했습니다/.test(
      lead,
    )
  const isYearRecap = /^2023 BREMEN/.test(item.caption.trim())
  const isDailyScene = /여름방학 활동|폭짜|오션월드|경주월드|교복제|멋진 브레멘|인물 소개/.test(
    lead,
  )

  const galleryInclude = hasThanks || isYearRecap || isDailyScene
  const setlist = /셋리스트|세트리스트|setlist/i.test(item.title)
  const recruiting = isRecruitingTitle(item.title)
  const promo =
    item.media_kind === "reel" ||
    /홍보\s*영상|홍보영상|review|BREMEN CITY|좋아하세요|브레멘의 밤|샤라웃|D-10/i.test(
      `${item.title} ${item.caption.slice(0, 260)}`,
    )
  const eventNotice =
    /초대합니다|준비했습니다|예정되어|참여하게|많은 관심|날짜|일시|장소|공연 시각|당첨자|이벤트/.test(
      lead,
    )

  let contentKind = "notice"
  if (galleryInclude) contentKind = "notice"
  else if (promo) contentKind = "promo"
  else if (recruiting) contentKind = "recruiting"
  else if (setlist) contentKind = "setlist"
  else if (eventNotice) contentKind = "event"

  const category = /공연|정기|해맞이|포카|STadium|Stadium|스타디움|새터|신입생 환영|박람회|대제전/i.test(
    text,
  )
    ? "performance"
    : "daily"

  return {
    entityType: galleryInclude ? "photo" : "post",
    schemaKey: galleryInclude ? "photo/instagram-grid/v1" : "post/instagram/v1",
    galleryInclude,
    contentKind,
    category,
  }
}

function aspect(item) {
  const width = Number(item.thumbnail_width ?? 0)
  const height = Number(item.thumbnail_height ?? 0)
  return height >= width ? "portrait" : "landscape"
}

function mediaType(item) {
  if (item.media_kind === "reel") return "reel"
  if (item.media_kind === "carousel") return "carousel"
  return "p"
}

function normalizeRow(item) {
  const uploaded = assets.uploaded?.[`instagram:${item.code}`]
  if (!uploaded?.publicUrl) {
    throw new Error(`missing uploaded asset for ${item.code}`)
  }

  const classification = classify(item)
  const eventSlug =
    classification.contentKind === "recruiting" ? null : inferEventSlug(item)
  const eventTitle = fallbackEventTitle(eventSlug)
  const title = titleOverrides[item.code] ?? item.title
  const data = {
    source: "instagram",
    shortcode: item.code,
    media_type: mediaType(item),
    source_url: item.source_url,
    source_thumbnail_url: item.thumbnail_url,
    storage_path: uploaded.path,
    caption: item.caption,
    display_date: displayDate(item.taken_at),
    taken_at: item.taken_at,
    taken_at_timestamp: item.taken_at_timestamp,
    content_kind: classification.contentKind,
    gallery_include: classification.galleryInclude,
    category: classification.category,
    aspect: aspect(item),
    event_slug: eventSlug,
    event_title: eventTitle,
    carousel_count: item.carousel_count,
    like_count: item.like_count,
    comment_count: item.comment_count,
    imported_at: feed.generated_at,
    source_index: item.index,
  }

  return {
    slug: `instagram-${item.code}`,
    entityType: classification.entityType,
    schemaKey: classification.schemaKey,
    title,
    summary: compactText(item.caption),
    thumbnailUrl: uploaded.publicUrl,
    sortAt: timestampAtKst(item),
    data,
  }
}

function values(rows) {
  return rows
    .map(
      (row) =>
        `    (${[
          schemaIdExpr(row.schemaKey),
          sqlString(row.slug),
          sqlString(row.title),
          "null",
          sqlString(row.summary),
          sqlString(row.thumbnailUrl),
          "true",
          sqlString(row.sortAt),
          sqlJson(row.data),
        ].join(", ")})`,
    )
    .join(",\n")
}

function relationValues(rows) {
  return rows
    .filter((row) => row.data.event_slug)
    .map(
      (row) =>
        `    (${[
          sqlString(row.slug),
          sqlString(row.data.event_slug),
          sqlString(row.entityType === "photo" ? "has_photo" : "has_post"),
          sqlString(row.entityType === "photo" ? row.data.category : row.data.content_kind),
          Number(row.data.source_index + 1) * 10,
        ].join(", ")})`,
    )
    .join(",\n")
}

const rows = feed.items.map(normalizeRow)
const photoCount = rows.filter((row) => row.entityType === "photo").length
const postCount = rows.filter((row) => row.entityType === "post").length

const sql = `-- Bremen — expanded Instagram feed seed.
--
-- Source: https://www.instagram.com/postech.bremen/
-- Captured ${feed.total} posts from ${feed.pages.length} paginated feed pages.
-- Thumbnails are stored in Supabase Storage bucket images/instagram.

insert into public.sections (
  key,
  section_type,
  schema_id,
  eyebrow,
  title,
  subtitle,
  published,
  props
)
values (
  'performances-updates',
  'entity_post_grid',
  ${schemaIdExpr("section/performance-updates/v1")},
  'Notice board',
  'Around the stages',
  '공연 전후의 소식',
  true,
  '{}'::jsonb
)
on conflict (key) do update
set section_type = excluded.section_type,
    schema_id = excluded.schema_id,
    eyebrow = excluded.eyebrow,
    title = excluded.title,
    subtitle = excluded.subtitle,
    published = excluded.published,
    props = excluded.props;

with target as (
  select page_entity.id as page_entity_id, section_entity.id as section_entity_id
  from public.pages page
  join public.sections section on section.key = 'performances-updates'
  join public.entities page_entity
    on page_entity.schema_id = ${schemaIdExpr("page/default/v1")}
   and page_entity.slug = 'page:' || page.slug
  join public.entities section_entity
    on ${sectionSchemaPredicate("section_entity")}
   and section_entity.slug = 'section:' || section.key
  where page.slug = 'performances'
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  page_entity_id,
  section_entity_id,
  ${schemaIdExpr("relation/page-section/v1")},
  'contains_section',
  'sections',
  25,
  '{}'::jsonb
from target
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_id = excluded.schema_id,
    sort_order = excluded.sort_order,
    props = excluded.props;

insert into public.entities (
  schema_id,
  slug,
  title,
  subtitle,
  summary,
  thumbnail_url,
  published,
  sort_at,
  data
)
values
${values(rows)}
on conflict (slug) do update
set schema_id = excluded.schema_id,
    title = excluded.title,
    subtitle = excluded.subtitle,
    summary = excluded.summary,
    thumbnail_url = excluded.thumbnail_url,
    published = excluded.published,
    sort_at = excluded.sort_at,
    data = excluded.data,
    updated_at = now();

delete from public.entity_relations relation
using public.entities child
where relation.to_entity_id = child.id
  and child.data->>'source' = 'instagram'
  and relation.relation_type in ('has_photo', 'has_post');

with relation_seed(child_slug, parent_slug, relation_type, slot, sort_order) as (
  values
${relationValues(rows)}
),
relations as (
  select
    parent.id as from_entity_id,
    child.id as to_entity_id,
    ${schemaIdExpr("relation/default/v1")} as schema_id,
    relation_seed.relation_type,
    relation_seed.slot,
    relation_seed.sort_order
  from relation_seed
  join public.entities child on child.slug = relation_seed.child_slug
  join public.entities parent on parent.slug = relation_seed.parent_slug
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  from_entity_id,
  to_entity_id,
  schema_id,
  relation_type,
  slot,
  sort_order,
  '{}'::jsonb
from relations
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_id = excluded.schema_id,
    sort_order = excluded.sort_order,
    props = excluded.props;

delete from public.entity_relations relation
using public.entities section_entity, public.sections section_ref, public.entities entity
where relation.schema_id = ${schemaIdExpr("relation/section-entity/v1")}
  and relation.from_entity_id = section_entity.id
  and relation.to_entity_id = entity.id
  and ${sectionSchemaPredicate("section_entity")}
  and section_entity.slug = 'section:' || section_ref.key
  and section_ref.key = 'photos-gallery'
  and entity.data->>'source' = 'instagram';

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on ${sectionSchemaPredicate("section_entity")}
   and section_entity.slug = 'section:' || section_ref.key
  where section_ref.key = 'photos-gallery'
),
ordered as (
  select
    entity.id,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where ${semanticKindPredicate("entity", "photo")}
    and entity.data->>'source' = 'instagram'
    and coalesce((entity.data->>'gallery_include')::boolean, false) = true
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.section_entity_id,
  ordered.id,
  ${schemaIdExpr("relation/section-entity/v1")},
  'features_photo',
  'gallery',
  ordered.rank * 10,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_id = excluded.schema_id,
    sort_order = excluded.sort_order,
    props = excluded.props;

delete from public.entity_relations relation
using public.entities section_entity, public.sections section_ref, public.entities entity
where relation.schema_id = ${schemaIdExpr("relation/section-entity/v1")}
  and relation.from_entity_id = section_entity.id
  and relation.to_entity_id = entity.id
  and ${sectionSchemaPredicate("section_entity")}
  and section_entity.slug = 'section:' || section_ref.key
  and section_ref.key = 'performances-updates'
  and entity.data->>'source' = 'instagram';

with target_section as (
  select section_entity.id as section_entity_id
  from public.sections section_ref
  join public.entities section_entity
    on ${sectionSchemaPredicate("section_entity")}
   and section_entity.slug = 'section:' || section_ref.key
  where section_ref.key = 'performances-updates'
),
ordered as (
  select
    entity.id,
    coalesce(entity.data->>'content_kind', 'notice') as content_kind,
    row_number() over (order by entity.sort_at desc, entity.title) as rank
  from public.entities entity
  where ${semanticKindPredicate("entity", "post")}
    and entity.data->>'source' = 'instagram'
    and coalesce((entity.data->>'gallery_include')::boolean, false) = false
    and entity.published = true
)
insert into public.entity_relations (
  from_entity_id,
  to_entity_id,
  schema_id,
  relation_type,
  slot,
  sort_order,
  props
)
select
  target_section.section_entity_id,
  ordered.id,
  ${schemaIdExpr("relation/section-entity/v1")},
  'features_post',
  ordered.content_kind,
  ordered.rank * 10,
  '{}'::jsonb
from target_section
cross join ordered
on conflict (from_entity_id, to_entity_id, relation_type, slot) do update
set schema_id = excluded.schema_id,
    sort_order = excluded.sort_order,
    props = excluded.props;
`

writeFileSync(outputPath, sql)
writeFileSync(
  rowsOutputPath,
  JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      feed_generated_at: feed.generated_at,
      total: rows.length,
      photos: photoCount,
      posts: postCount,
      rows,
    },
    null,
    2,
  ),
)

console.log(
  JSON.stringify(
    {
      total: rows.length,
      photos: photoCount,
      posts: postCount,
      outputPath,
      rowsOutputPath,
    },
    null,
    2,
  ),
)
