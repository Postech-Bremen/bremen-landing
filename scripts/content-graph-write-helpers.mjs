const CHUNK_SIZE = 100

function requireOk(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }

  return result.data ?? []
}

function chunk(items, size = CHUNK_SIZE) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))]
}

function pageEntitySlug(slug) {
  return `page:${slug}`
}

function sectionEntitySlug(key) {
  return `section:${key}`
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function mergeData(base, patch) {
  return {
    ...objectValue(base),
    ...objectValue(patch),
  }
}

async function loadSchemaIdByKey(supabase, schemaKey, label) {
  const rows = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id")
      .eq("schema_key", schemaKey)
      .eq("active", true)
      .maybeSingle(),
    `${label} schema`,
  )

  if (!rows?.id) {
    throw new Error(`${label}: missing active schema ${schemaKey}`)
  }

  return rows.id
}

async function loadSectionSchemaIds(supabase, label) {
  const rows = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id")
      .eq("kind", "section")
      .eq("active", true),
    `${label} section schemas`,
  )
  const ids = rows.map((row) => row.id).filter(Boolean)
  if (!ids.length) {
    throw new Error(`${label}: missing active section schemas`)
  }

  return ids
}

async function upsertChunked(supabase, table, rows, options, label) {
  for (const [index, part] of chunk(rows).entries()) {
    requireOk(
      await supabase.from(table).upsert(part, options),
      `${label} chunk ${index + 1}`,
    )
  }
}

async function upsertRelationRows(supabase, rows, label) {
  await upsertChunked(
    supabase,
    "entity_relations",
    rows,
    { onConflict: "from_entity_id,to_entity_id,relation_type,slot" },
    label,
  )
}

async function loadEntitiesBySlugs(supabase, slugs, schemaIds, label) {
  const entitySlugs = uniqueStrings(slugs)
  if (!entitySlugs.length) return []
  const rows = []
  for (const part of chunk(entitySlugs)) {
    const query = supabase
      .from("entities")
      .select("id,slug,schema_id,title,data,published")
      .in("schema_id", schemaIds)
      .in("slug", part)

    rows.push(...requireOk(await query, label))
  }

  return rows
}

export async function loadPageEntityMapBySlug(supabase, slugs, label = "load page entities") {
  const pageSlugs = uniqueStrings(slugs)
  if (!pageSlugs.length) return new Map()

  const pageSchemaId = await loadSchemaIdByKey(
    supabase,
    "page/default/v1",
    `${label} page`,
  )
  const rows = await loadEntitiesBySlugs(
    supabase,
    pageSlugs.map(pageEntitySlug),
    [pageSchemaId],
    label,
  )
  const bySlug = new Map(
    rows.map((row) => [row.slug.replace(/^page:/, ""), row]),
  )
  const missing = pageSlugs.filter((slug) => !bySlug.has(slug))
  if (missing.length) {
    throw new Error(`${label}: missing page entities for ${missing.join(", ")}`)
  }

  return bySlug
}

export async function loadSectionEntityMapByKey(
  supabase,
  keys,
  label = "load section entities",
) {
  const sectionKeys = uniqueStrings(keys)
  if (!sectionKeys.length) return new Map()

  const sectionSchemaIds = await loadSectionSchemaIds(supabase, label)
  const rows = await loadEntitiesBySlugs(
    supabase,
    sectionKeys.map(sectionEntitySlug),
    sectionSchemaIds,
    label,
  )
  const byKey = new Map(
    rows.map((row) => [row.slug.replace(/^section:/, ""), row]),
  )
  const missing = sectionKeys.filter((key) => !byKey.has(key))
  if (missing.length) {
    throw new Error(`${label}: missing section entities for ${missing.join(", ")}`)
  }

  return byKey
}

export async function upsertPageEntities(supabase, pages, label = "upsert page entities") {
  const rows = pages.filter(Boolean)
  if (!rows.length) return new Map()

  const pageSchemaId = await loadSchemaIdByKey(
    supabase,
    "page/default/v1",
    `${label} page`,
  )
  const existingRows = await loadEntitiesBySlugs(
    supabase,
    rows.map((row) => pageEntitySlug(row.slug)),
    [pageSchemaId],
    `${label} existing pages`,
  )
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]))

  await upsertChunked(
    supabase,
    "entities",
    rows.map((row) => {
      const slug = pageEntitySlug(row.slug)
      return {
        schema_id: pageSchemaId,
        slug,
        title: row.title,
        subtitle: row.subtitle ?? null,
        summary: row.description ?? row.summary ?? null,
        data: mergeData(
          existingBySlug.get(slug)?.data,
          mergeData(row.data, {
            slug: row.slug,
            props: row.props ?? objectValue(existingBySlug.get(slug)?.data).props ?? {},
          }),
        ),
        published: row.published ?? true,
      }
    }),
    { onConflict: "slug" },
    label,
  )

  return loadPageEntityMapBySlug(supabase, rows.map((row) => row.slug), label)
}

export async function upsertSectionEntities(
  supabase,
  sections,
  label = "upsert section entities",
) {
  const rows = sections.filter(Boolean)
  if (!rows.length) return new Map()

  const sectionSchemaIds = await loadSectionSchemaIds(supabase, label)
  const existingRows = await loadEntitiesBySlugs(
    supabase,
    rows.map((row) => sectionEntitySlug(row.key)),
    sectionSchemaIds,
    `${label} existing sections`,
  )
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]))

  await upsertChunked(
    supabase,
    "entities",
    rows.map((row) => {
      const schemaId = row.schema_id ?? row.schemaId

      if (!schemaId || !sectionSchemaIds.includes(schemaId)) {
        throw new Error(`${label}: invalid section schema for ${row.key}`)
      }

      const slug = sectionEntitySlug(row.key)
      const existingData = objectValue(existingBySlug.get(slug)?.data)

      return {
        schema_id: schemaId,
        slug,
        title: row.title ?? null,
        subtitle: row.subtitle ?? null,
        data: mergeData(
          existingData,
          mergeData(row.data, {
            key: row.key,
            section_type: row.section_type ?? row.sectionType,
            eyebrow: row.eyebrow ?? existingData.eyebrow ?? null,
            props: row.props ?? existingData.props ?? {},
          }),
        ),
        published: row.published ?? true,
      }
    }),
    { onConflict: "slug" },
    label,
  )

  return loadSectionEntityMapByKey(supabase, rows.map((row) => row.key), label)
}

function relationId(value, camelKey, snakeKey) {
  return value[camelKey] ?? value[snakeKey]
}

function requiredRelationId(value, camelKey, snakeKey, label) {
  const id = relationId(value, camelKey, snakeKey)
  if (typeof id !== "string" || !id) {
    throw new Error(`${label}: missing ${camelKey}/${snakeKey}`)
  }

  return id
}

function optionalRelationId(value, camelKey, snakeKey) {
  const id = relationId(value, camelKey, snakeKey)
  return typeof id === "string" && id ? id : null
}

function relationNumber(value, camelKey, snakeKey, fallback = 0) {
  return Number(value[camelKey] ?? value[snakeKey] ?? fallback)
}

function relationProps(value) {
  return value.props ?? {}
}

export async function upsertPageSectionRelations(
  supabase,
  placements,
  label = "upsert page-section graph relations",
) {
  const rows = placements.filter(Boolean)
  if (!rows.length) return 0

  const pageSlugs = rows.map((row) => relationId(row, "pageSlug", "page_slug"))
  const sectionKeys = rows.map((row) => relationId(row, "sectionKey", "section_key"))
  const [pageEntitiesBySlug, sectionEntitiesByKey, relationSchemaId] = await Promise.all([
    loadPageEntityMapBySlug(supabase, pageSlugs, label),
    loadSectionEntityMapByKey(supabase, sectionKeys, label),
    loadSchemaIdByKey(
      supabase,
      "relation/page-section/v1",
      `${label} relation`,
    ),
  ])

  await upsertRelationRows(
    supabase,
    rows.map((row) => {
      const pageEntityId =
        optionalRelationId(row, "pageEntityId", "page_entity_id") ??
        pageEntitiesBySlug.get(relationId(row, "pageSlug", "page_slug"))?.id
      const sectionEntityId =
        optionalRelationId(row, "sectionEntityId", "section_entity_id") ??
        sectionEntitiesByKey.get(relationId(row, "sectionKey", "section_key"))?.id

      if (!pageEntityId || !sectionEntityId) {
        throw new Error(`${label}: missing page/section entity id`)
      }

      return {
        from_entity_id: pageEntityId,
        to_entity_id: sectionEntityId,
        schema_id: relationSchemaId,
        relation_type: "contains_section",
        slot: "sections",
        sort_order: relationNumber(row, "sortOrder", "sort_order"),
        props: relationProps(row),
      }
    }),
    label,
  )

  return rows.length
}

export async function deleteSectionEntityRelations(
  supabase,
  {
    sectionEntityIds,
    sectionIds = [],
    entityIds = [],
    label = "delete section-entity graph relations",
  },
) {
  const normalizedSectionIds = uniqueStrings(sectionEntityIds ?? sectionIds)
  const normalizedEntityIds = uniqueStrings(entityIds)

  if (!normalizedSectionIds.length && !normalizedEntityIds.length) {
    throw new Error(`${label}: refusing to delete unscoped section-entity relations`)
  }

  const fromEntityIds = normalizedSectionIds
  const relationSchemaId = await loadSchemaIdByKey(
    supabase,
    "relation/section-entity/v1",
    `${label} relation`,
  )

  if (normalizedSectionIds.length && !fromEntityIds.length) return 0

  const entityChunks = normalizedEntityIds.length ? chunk(normalizedEntityIds) : [null]
  for (const [index, entityChunk] of entityChunks.entries()) {
    let query = supabase
      .from("entity_relations")
      .delete()
      .eq("schema_id", relationSchemaId)

    if (fromEntityIds.length) {
      query = query.in("from_entity_id", fromEntityIds)
    }

    if (entityChunk) {
      query = query.in("to_entity_id", entityChunk)
    }

    requireOk(await query, `${label} chunk ${index + 1}`)
  }

  return entityChunks.length
}

export async function upsertSectionEntityRelations(
  supabase,
  placements,
  label = "upsert section-entity graph relations",
) {
  const rows = placements.filter(Boolean)
  if (!rows.length) return 0

  const sectionKeys = rows.map((row) => relationId(row, "sectionKey", "section_key"))
  const [sectionEntitiesByKey, relationSchemaId] = await Promise.all([
    loadSectionEntityMapByKey(supabase, sectionKeys, label),
    loadSchemaIdByKey(
      supabase,
      "relation/section-entity/v1",
      `${label} relation`,
    ),
  ])

  await upsertRelationRows(
    supabase,
    rows.map((row) => {
      const sectionEntityId =
        optionalRelationId(row, "sectionEntityId", "section_entity_id") ??
        sectionEntitiesByKey.get(relationId(row, "sectionKey", "section_key"))?.id
      const entityId = requiredRelationId(row, "entityId", "entity_id", label)

      if (!sectionEntityId) {
        throw new Error(`${label}: missing section entity id`)
      }

      return {
        from_entity_id: sectionEntityId,
        to_entity_id: entityId,
        schema_id: relationSchemaId,
        relation_type: relationId(row, "relationType", "relation_type") ?? "item",
        slot: row.slot ?? "default",
        sort_order: relationNumber(row, "sortOrder", "sort_order"),
        props: relationProps(row),
      }
    }),
    label,
  )

  return rows.length
}
