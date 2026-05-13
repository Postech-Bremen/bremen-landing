import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import {
  deleteSectionEntityRelations,
  loadPageEntityMapBySlug,
  loadSectionEntityMapByKey,
  upsertPageEntities,
  upsertPageSectionRelations,
  upsertSectionEntities,
  upsertSectionEntityRelations,
} from "./content-graph-write-helpers.mjs"

const envPath = ".env.local"
const rowsPath = process.argv[2] ?? "/tmp/bremen_seed_rows.json"

const entitySchemaKeys = {
  performance: "performance/scraped/v1",
  video: "video/youtube/v1",
  photo: "photo/instagram-grid/v1",
  history: "history/milestone/v1",
  playlist: "playlist/youtube/v1",
}
const defaultRelationSchemaKey = "relation/default/v1"
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

function loadEnv(path) {
  const text = readFileSync(path, "utf8")
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, "")
  }
}

function chunk(items, size = 100) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function requireOk(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }
  return result.data
}

function schemaIdByKey(schemas, schemaKey) {
  const schema = schemas.byKey.get(schemaKey)
  if (!schema?.id) {
    throw new Error(`Missing active schema ${schemaKey}`)
  }

  return schema.id
}

function semanticKindForEntity(entity, schemas) {
  return schemas.byId.get(entity.schema_id)?.semantic_kind ?? null
}

function schemaIdsBySemanticKind(schemas, semanticKind) {
  const ids = (schemas.bySemanticKind.get(semanticKind) ?? [])
    .map((schema) => schema.id)
    .filter(Boolean)
  if (!ids.length) {
    throw new Error(`Missing active schemas for ${semanticKind}`)
  }

  return ids
}

async function loadSchemaRegistry(supabase) {
  const rows = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id,schema_key,semantic_kind")
      .eq("active", true),
    "load schema registry",
  )
  const byKey = new Map(rows.map((schema) => [schema.schema_key, schema]))
  const byId = new Map(rows.map((schema) => [schema.id, schema]))
  const bySemanticKind = new Map()

  for (const schema of rows) {
    const list = bySemanticKind.get(schema.semantic_kind) ?? []
    list.push(schema)
    bySemanticKind.set(schema.semantic_kind, list)
  }

  return { byKey, byId, bySemanticKind }
}

function entityRow(row, schemaKey, schemas) {
  return {
    schema_id: schemaIdByKey(schemas, schemaKey),
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? null,
    summary: row.summary ?? null,
    thumbnail_url: row.thumbnailUrl ?? null,
    sort_at: row.sortAt,
    data: row.data,
    published: true,
  }
}

function sortByDateDesc(left, right) {
  return String(right.sort_at).localeCompare(String(left.sort_at)) ||
    String(left.title).localeCompare(String(right.title))
}

function sortByRank(left, right) {
  const leftRank = Number(left.data?.display_order ?? left.data?.source_index ?? 0)
  const rightRank = Number(right.data?.display_order ?? right.data?.source_index ?? 0)
  return leftRank - rightRank || String(left.title).localeCompare(String(right.title))
}

function entityYear(entity) {
  return entity.data?.year ?? String(entity.sort_at).slice(0, 4)
}

async function loadPublishedEntitiesBySemanticKind(supabase, schemas, semanticKind, label) {
  const schemaIds = schemaIdsBySemanticKind(schemas, semanticKind)

  return requireOk(
    await supabase
      .from("entities")
      .select("id,slug,schema_id,title,sort_at,data,published")
      .in("schema_id", schemaIds)
      .eq("published", true),
    label,
  )
}

async function upsertChunked(supabase, table, rows, options, label) {
  for (const [index, part] of chunk(rows).entries()) {
    requireOk(
      await supabase.from(table).upsert(part, options),
      `${label} chunk ${index + 1}`,
    )
  }
}

async function main() {
  loadEnv(envPath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  }

  const rows = JSON.parse(readFileSync(rowsPath, "utf8"))
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const schemas = await loadSchemaRegistry(supabase)
  const defaultRelationSchemaId = schemaIdByKey(schemas, defaultRelationSchemaKey)

  await upsertPageEntities(
    supabase,
    [
      {
        slug: "history",
        title: "브레멘 히스토리",
        subtitle: "History",
        description: "브레멘의 시작과 치어로밴드, 공연 문화의 변화",
        published: true,
        props: {},
      },
    ],
    "upsert history page entity",
  )

  await upsertSectionEntities(
    supabase,
    [
      {
        key: "videos-by-event",
        section_type: "entity_grouped_grid",
        schema_id: schemaIdByKey(schemas, "section/video-event-playlists/v1"),
        eyebrow: "Events",
        title: "Recordings by stage",
        subtitle: "공연 단위로 묶어 보는 영상 기록",
        published: true,
        props: {},
      },
      {
        key: "history-timeline",
        section_type: "entity_timeline",
        schema_id: schemaIdByKey(schemas, "section/history-timeline/v1"),
        eyebrow: "Since 2001",
        title: "Bremen History",
        subtitle: "궤짝 유랑 악단에서 현재의 브레멘까지",
        published: true,
        props: {},
      },
    ],
    "upsert extra section entities",
  )

  const pageBySlug = await loadPageEntityMapBySlug(
    supabase,
    ["videos", "history"],
    "load page entities",
  )
  const sectionByKey = await loadSectionEntityMapByKey(
    supabase,
    sectionKeys,
    "load section entities",
  )

  await upsertPageSectionRelations(
    supabase,
    [
      {
        page_entity_id: pageBySlug.get("videos").id,
        section_entity_id: sectionByKey.get("videos-by-event").id,
        sort_order: 25,
        props: {},
      },
      {
        page_entity_id: pageBySlug.get("history").id,
        section_entity_id: sectionByKey.get("history-timeline").id,
        sort_order: 10,
        props: {},
      },
    ],
    "upsert page sections",
  )

  const oldVideos = requireOk(
    await supabase
      .from("entities")
      .select("id,slug,data")
      .in("schema_id", schemaIdsBySemanticKind(schemas, "video")),
    "load existing videos",
  )

  for (const video of oldVideos) {
    const youtubeId = video.data?.youtube_id
    if (!video.slug && youtubeId) {
      requireOk(
        await supabase
          .from("entities")
          .update({ slug: `youtube-${youtubeId}` })
          .eq("id", video.id),
        `backfill video slug ${youtubeId}`,
      )
    }
  }

  const entityRows = [
    ...rows.performances.map((row) =>
      entityRow(row, entitySchemaKeys.performance, schemas),
    ),
    ...rows.videos.map((row) => entityRow(row, entitySchemaKeys.video, schemas)),
    ...rows.instagram.map((row) => entityRow(row, entitySchemaKeys.photo, schemas)),
    ...rows.history.map((row) => entityRow(row, entitySchemaKeys.history, schemas)),
    ...rows.playlists.map((row) =>
      entityRow(row, entitySchemaKeys.playlist, schemas),
    ),
  ]

  await upsertChunked(
    supabase,
    "entities",
    entityRows,
    { onConflict: "slug" },
    "upsert entities",
  )

  const entitySlugs = entityRows.map((row) => row.slug)
  const entities = []
  for (const part of chunk(entitySlugs, 100)) {
    const loaded = requireOk(
      await supabase
        .from("entities")
        .select("id,slug,schema_id,title,sort_at,data,published")
        .in("slug", part),
      "load seeded entities",
    )
    entities.push(...loaded)
  }

  const performanceBySlug = new Map(
    entities
      .filter((entity) => semanticKindForEntity(entity, schemas) === "performance")
      .map((entity) => [entity.slug, entity]),
  )
  const videos = entities.filter(
    (entity) => semanticKindForEntity(entity, schemas) === "video",
  )
  const photos = entities.filter(
    (entity) => semanticKindForEntity(entity, schemas) === "photo",
  )
  const playlists = entities.filter(
    (entity) => semanticKindForEntity(entity, schemas) === "playlist",
  )

  const relations = []
  for (const video of videos) {
    const performance = performanceBySlug.get(video.data?.event_slug)
    if (!performance) continue
    relations.push({
      from_entity_id: performance.id,
      to_entity_id: video.id,
      schema_id: defaultRelationSchemaId,
      relation_type: "has_recording",
      slot: "default",
      sort_order: Number(video.data?.display_order ?? 0),
      props: {},
    })
  }

  for (const photo of photos) {
    const performance = performanceBySlug.get(photo.data?.event_slug)
    if (!performance) continue
    relations.push({
      from_entity_id: performance.id,
      to_entity_id: photo.id,
      schema_id: defaultRelationSchemaId,
      relation_type: "has_photo",
      slot: photo.data?.category ?? "performance",
      sort_order: Number(photo.data?.display_order ?? 0),
      props: {},
    })
  }

  for (const playlist of playlists) {
    const eventSlug = playlist.data?.event_slug
    if (!eventSlug) continue
    for (const video of videos.filter((item) => item.data?.event_slug === eventSlug)) {
      relations.push({
        from_entity_id: playlist.id,
        to_entity_id: video.id,
        schema_id: defaultRelationSchemaId,
        relation_type: "contains_video",
        slot: "default",
        sort_order: Number(video.data?.display_order ?? 0),
        props: {},
      })
    }
  }

  await upsertChunked(
    supabase,
    "entity_relations",
    relations,
    { onConflict: "from_entity_id,to_entity_id,relation_type,slot" },
    "upsert relations",
  )

  const seededSectionByKey = await loadSectionEntityMapByKey(
    supabase,
    sectionKeys,
    "reload section entities",
  )
  const sectionIds = [...seededSectionByKey.values()].map((section) => section.id)

  await deleteSectionEntityRelations(supabase, {
    sectionEntityIds: sectionIds,
    label: "clear section entities",
  })

  const allPerformances = await loadPublishedEntitiesBySemanticKind(
    supabase,
    schemas,
    "performance",
    "load all performances",
  )
  const allVideos = await loadPublishedEntitiesBySemanticKind(
    supabase,
    schemas,
    "video",
    "load all videos",
  )
  const allPhotos = await loadPublishedEntitiesBySemanticKind(
    supabase,
    schemas,
    "photo",
    "load all photos",
  )
  const allPlaylists = await loadPublishedEntitiesBySemanticKind(
    supabase,
    schemas,
    "playlist",
    "load all playlists",
  )
  const allHistory = await loadPublishedEntitiesBySemanticKind(
    supabase,
    schemas,
    "history_milestone",
    "load all history",
  )

  const sectionEntities = []
  const addSectionItems = (sectionKey, items, slotForItem = () => "default") => {
    const section = seededSectionByKey.get(sectionKey)
    if (!section) return
    items.forEach((item, index) => {
      sectionEntities.push({
        section_entity_id: section.id,
        entity_id: item.id,
        relation_type: "item",
        slot: slotForItem(item),
        sort_order: (index + 1) * 10,
        props: {},
      })
    })
  }

  addSectionItems(
    "performances-current-season",
    allPerformances
      .filter((entity) => entityYear(entity) === "2026")
      .sort(sortByDateDesc),
  )

  addSectionItems(
    "performances-archive",
    allPerformances.sort(sortByDateDesc),
    (entity) => `season-${entityYear(entity)}`,
  )

  addSectionItems(
    "videos-featured",
    allVideos
      .filter((entity) => entity.data?.is_highlight === true)
      .sort(sortByDateDesc)
      .slice(0, 6),
  )

  addSectionItems(
    "videos-popular",
    [...allVideos]
      .sort((left, right) => Number(right.data?.views ?? 0) - Number(left.data?.views ?? 0))
      .slice(0, 6),
  )

  addSectionItems("videos-library", allVideos.sort(sortByDateDesc))
  addSectionItems("videos-by-event", allPlaylists.sort(sortByDateDesc))
  addSectionItems(
    "photos-gallery",
    allPhotos.sort(sortByDateDesc),
    (entity) => (entity.data?.category === "daily" ? "daily" : "performance"),
  )
  addSectionItems("history-timeline", allHistory.sort(sortByRank))

  await upsertSectionEntityRelations(
    supabase,
    sectionEntities,
    "upsert section entities",
  )

  console.log(
    JSON.stringify(
      {
        entities: entityRows.length,
        relations: relations.length,
        sectionEntities: sectionEntities.length,
        sections: sectionKeys.length,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
