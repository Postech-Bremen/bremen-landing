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

function shadowSlug(sourceTable, sourceKey) {
  return `${sourceTable === "pages" ? "page:" : "section:"}${sourceKey}`
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

async function loadShadowSchemaIds(supabase, sourceTable, label) {
  if (sourceTable === "pages") {
    return [
      await loadSchemaIdByKey(
        supabase,
        "page/default/v1",
        `${label} page shadow`,
      ),
    ]
  }

  const rows = requireOk(
    await supabase
      .from("entity_schemas")
      .select("id")
      .eq("kind", "section")
      .eq("active", true),
    `${label} section shadow schemas`,
  )
  const ids = rows.map((row) => row.id).filter(Boolean)
  if (!ids.length) {
    throw new Error(`${label}: missing active section schemas`)
  }

  return ids
}

async function upsertRelationRows(supabase, rows, label) {
  for (const [index, part] of chunk(rows).entries()) {
    requireOk(
      await supabase
        .from("entity_relations")
        .upsert(part, { onConflict: "from_entity_id,to_entity_id,relation_type,slot" }),
      `${label} chunk ${index + 1}`,
    )
  }
}

async function loadShadowEntityMap(supabase, sourceTable, sourceIds, label) {
  const ids = uniqueStrings(sourceIds)
  if (!ids.length) return new Map()

  const sourceRows = []
  for (const part of chunk(ids)) {
    sourceRows.push(
      ...requireOk(
        sourceTable === "pages"
          ? await supabase.from("pages").select("id,slug").in("id", part)
          : await supabase.from("sections").select("id,key").in("id", part),
        `${label} ${sourceTable} source records`,
      ),
    )
  }

  const sourceKeyById = new Map(
    sourceRows.map((row) => [row.id, sourceTable === "pages" ? row.slug : row.key]),
  )
  const missingSources = ids.filter((id) => !sourceKeyById.has(id))
  if (missingSources.length) {
    throw new Error(
      `${label}: missing ${sourceTable} source records for ${missingSources.join(", ")}`,
    )
  }

  const shadowSlugs = ids.map((id) => shadowSlug(sourceTable, sourceKeyById.get(id)))
  const schemaIds = await loadShadowSchemaIds(supabase, sourceTable, label)
  const rows = []
  for (const part of chunk(shadowSlugs)) {
    const query = supabase
      .from("entities")
      .select("id,slug")
      .in("schema_id", schemaIds)
      .in("slug", part)

    rows.push(
      ...requireOk(await query, `${label} ${sourceTable} shadow entities`),
    )
  }

  const idByShadowSlug = new Map(rows.map((row) => [row.slug, row.id]))
  const bySourceId = new Map(
    ids
      .map((id) => [
        id,
        idByShadowSlug.get(shadowSlug(sourceTable, sourceKeyById.get(id))),
      ])
      .filter(([, entityId]) => typeof entityId === "string" && entityId),
  )
  const missing = ids.filter((id) => !bySourceId.has(id))
  if (missing.length) {
    throw new Error(
      `${label}: missing ${sourceTable} shadow entities for ${missing.join(", ")}`,
    )
  }

  return bySourceId
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

  const pageIds = rows.map((row) =>
    requiredRelationId(row, "pageId", "page_id", label),
  )
  const sectionIds = rows.map((row) =>
    requiredRelationId(row, "sectionId", "section_id", label),
  )
  const [pageEntities, sectionEntities, relationSchemaId] = await Promise.all([
    loadShadowEntityMap(supabase, "pages", pageIds, label),
    loadShadowEntityMap(supabase, "sections", sectionIds, label),
    loadSchemaIdByKey(
      supabase,
      "relation/page-section/v1",
      `${label} relation`,
    ),
  ])

  await upsertRelationRows(
    supabase,
    rows.map((row) => {
      const pageId = requiredRelationId(row, "pageId", "page_id", label)
      const sectionId = requiredRelationId(row, "sectionId", "section_id", label)

      return {
        from_entity_id: pageEntities.get(pageId),
        to_entity_id: sectionEntities.get(sectionId),
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
  { sectionIds = [], entityIds = [], label = "delete section-entity graph relations" },
) {
  const normalizedSectionIds = uniqueStrings(sectionIds)
  const normalizedEntityIds = uniqueStrings(entityIds)

  if (!normalizedSectionIds.length && !normalizedEntityIds.length) {
    throw new Error(`${label}: refusing to delete unscoped section-entity relations`)
  }

  const sectionEntities = normalizedSectionIds.length
    ? await loadShadowEntityMap(supabase, "sections", normalizedSectionIds, label)
    : new Map()
  const fromEntityIds = [...sectionEntities.values()]
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

  const sectionIds = rows.map((row) =>
    requiredRelationId(row, "sectionId", "section_id", label),
  )
  const [sectionEntities, relationSchemaId] = await Promise.all([
    loadShadowEntityMap(supabase, "sections", sectionIds, label),
    loadSchemaIdByKey(
      supabase,
      "relation/section-entity/v1",
      `${label} relation`,
    ),
  ])

  await upsertRelationRows(
    supabase,
    rows.map((row) => {
      const sectionId = requiredRelationId(row, "sectionId", "section_id", label)
      const entityId = requiredRelationId(row, "entityId", "entity_id", label)

      return {
        from_entity_id: sectionEntities.get(sectionId),
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
