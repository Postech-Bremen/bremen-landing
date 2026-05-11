import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import {
  deleteSectionEntityRelations,
  upsertPageSectionRelations,
  upsertSectionEntityRelations,
} from "./content-graph-write-helpers.mjs"

const rowsPath = process.argv[2] ?? "/tmp/bremen_instagram_seed_rows.json"
const envPath = ".env.local"
const defaultRelationSchemaKey = "relation/default/v1"

function loadEnv(path) {
  const text = readFileSync(path, "utf8")
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const index = trimmed.indexOf("=")
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, "")
    process.env[key] ??= value
  }
}

function requireOk(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }

  return result.data
}

function chunk(items, size = 100) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function upsertChunked(supabase, table, rows, options, label) {
  for (const part of chunk(rows, 100)) {
    requireOk(await supabase.from(table).upsert(part, options), label)
  }
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

async function loadSchemaRegistry(supabase) {
  const rows = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id,schema_key,semantic_kind")
      .eq("active", true),
    "load schema registry",
  )

  return {
    byKey: new Map(rows.map((schema) => [schema.schema_key, schema])),
    byId: new Map(rows.map((schema) => [schema.id, schema])),
  }
}

function entityRow(row, schemas) {
  return {
    schema_id: schemaIdByKey(schemas, row.schemaKey),
    slug: row.slug,
    title: row.title,
    subtitle: null,
    summary: row.summary,
    thumbnail_url: row.thumbnailUrl,
    published: true,
    sort_at: row.sortAt,
    data: row.data,
  }
}

function sortBySortAtDesc(left, right) {
  return (
    String(right.sort_at).localeCompare(String(left.sort_at)) ||
    String(left.title).localeCompare(String(right.title))
  )
}

async function main() {
  loadEnv(envPath)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
  }

  const payload = JSON.parse(readFileSync(rowsPath, "utf8"))
  const rows = payload.rows ?? []
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const schemas = await loadSchemaRegistry(supabase)
  const defaultRelationSchemaId = schemaIdByKey(schemas, defaultRelationSchemaKey)
  const performanceUpdatesSectionSchemaId = schemaIdByKey(
    schemas,
    "section/performance-updates/v1",
  )

  requireOk(
    await supabase.from("sections").upsert(
      {
        key: "performances-updates",
        section_type: "entity_post_grid",
        schema_id: performanceUpdatesSectionSchemaId,
        eyebrow: "Notice board",
        title: "Around the stages",
        subtitle: "공연 전후의 소식",
        published: true,
        props: {},
      },
      { onConflict: "key" },
    ),
    "upsert performances-updates section",
  )

  const page = requireOk(
    await supabase
      .from("pages")
      .select("id,slug")
      .eq("slug", "performances")
      .maybeSingle(),
    "load performances page",
  )
  const performanceUpdatesSection = requireOk(
    await supabase
      .from("sections")
      .select("id,key")
      .eq("key", "performances-updates")
      .maybeSingle(),
    "load performances-updates section",
  )

  if (page && performanceUpdatesSection) {
    await upsertPageSectionRelations(
      supabase,
      [
        {
          page_id: page.id,
          section_id: performanceUpdatesSection.id,
          sort_order: 25,
          props: {},
        },
      ],
      "upsert performances page section",
    )
  }

  const entityRows = rows.map((row) => entityRow(row, schemas))
  await upsertChunked(
    supabase,
    "entities",
    entityRows,
    { onConflict: "slug" },
    "upsert Instagram entities",
  )

  const slugs = rows.map((row) => row.slug)
  const entities = []
  for (const part of chunk(slugs)) {
    entities.push(
      ...requireOk(
        await supabase
          .from("entities")
          .select("id,slug,schema_id,title,sort_at,data,published")
          .in("slug", part),
        "load Instagram entities",
      ),
    )
  }

  const entityBySlug = new Map(entities.map((entity) => [entity.slug, entity]))
  const instagramIds = entities.map((entity) => entity.id)

  for (const ids of chunk(instagramIds)) {
    requireOk(
      await supabase
        .from("entity_relations")
        .delete()
        .in("to_entity_id", ids)
        .in("relation_type", ["has_photo", "has_post"]),
      "delete old Instagram relations",
    )
  }

  const eventSlugs = [
    ...new Set(rows.map((row) => row.data.event_slug).filter(Boolean)),
  ]
  const parentEntities = []
  for (const part of chunk(eventSlugs)) {
    parentEntities.push(
      ...requireOk(
        await supabase
          .from("entities")
          .select("id,slug")
          .in("slug", part),
        "load parent performance entities",
      ),
    )
  }
  const parentBySlug = new Map(parentEntities.map((entity) => [entity.slug, entity]))

  const relations = rows.flatMap((row) => {
    const child = entityBySlug.get(row.slug)
    const parent = row.data.event_slug ? parentBySlug.get(row.data.event_slug) : null
    if (!child || !parent) return []

    return [
      {
        from_entity_id: parent.id,
        to_entity_id: child.id,
        schema_id: defaultRelationSchemaId,
        relation_type:
          semanticKindForEntity(child, schemas) === "photo" ? "has_photo" : "has_post",
        slot:
          semanticKindForEntity(child, schemas) === "photo"
            ? row.data.category
            : row.data.content_kind,
        sort_order: Number(row.data.source_index + 1) * 10,
        props: {},
      },
    ]
  })

  if (relations.length) {
    await upsertChunked(
      supabase,
      "entity_relations",
      relations,
      { onConflict: "from_entity_id,to_entity_id,relation_type,slot" },
      "upsert Instagram relations",
    )
  }

  const gallerySection = requireOk(
    await supabase
      .from("sections")
      .select("id,key")
      .eq("key", "photos-gallery")
      .maybeSingle(),
    "load photos-gallery section",
  )

  const sectionIds = [gallerySection?.id, performanceUpdatesSection?.id].filter(Boolean)
  if (sectionIds.length && instagramIds.length) {
    await deleteSectionEntityRelations(supabase, {
      sectionIds,
      entityIds: instagramIds,
      label: "delete old Instagram section links",
    })
  }

  const photos = entities
    .filter(
      (entity) =>
        semanticKindForEntity(entity, schemas) === "photo" &&
        entity.data?.source === "instagram" &&
        entity.data?.gallery_include === true &&
        entity.published,
    )
    .sort(sortBySortAtDesc)

  const posts = entities
    .filter(
      (entity) =>
        semanticKindForEntity(entity, schemas) === "post" &&
        entity.data?.source === "instagram" &&
        entity.data?.gallery_include === false &&
        entity.published,
    )
    .sort(sortBySortAtDesc)

  const sectionEntities = [
    ...(gallerySection
      ? photos.map((entity, index) => ({
          section_id: gallerySection.id,
          entity_id: entity.id,
          relation_type: "features_photo",
          slot: "gallery",
          sort_order: (index + 1) * 10,
          props: {},
        }))
      : []),
    ...(performanceUpdatesSection
      ? posts.map((entity, index) => ({
          section_id: performanceUpdatesSection.id,
          entity_id: entity.id,
          relation_type: "features_post",
          slot: entity.data?.content_kind ?? "notice",
          sort_order: (index + 1) * 10,
          props: {},
        }))
      : []),
  ]

  if (sectionEntities.length) {
    await upsertSectionEntityRelations(
      supabase,
      sectionEntities,
      "upsert Instagram section links",
    )
  }

  console.log(
    JSON.stringify(
      {
        entities: entities.length,
        photos: photos.length,
        posts: posts.length,
        relations: relations.length,
        sectionLinks: sectionEntities.length,
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
