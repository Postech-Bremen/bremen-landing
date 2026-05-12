"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect, unstable_rethrow } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type EntityRelationInsert =
  Database["public"]["Tables"]["entity_relations"]["Insert"]
type EntityRelationUpdate =
  Database["public"]["Tables"]["entity_relations"]["Update"]
type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

type PageSectionGraphRelation = {
  id: string
  from_entity_id: string
  to_entity_id: string
}

type SectionEntityGraphRelation = {
  id: string
  from_entity_id: string
  to_entity_id: string
}

type ActionResult =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAGE_ENTITY_SCHEMA_KEY = "page/default/v1"
const DEFAULT_RELATION_SCHEMA_KEY = "relation/default/v1"
const PAGE_SECTION_RELATION_SCHEMA_KEY = "relation/page-section/v1"
const SECTION_ENTITY_RELATION_SCHEMA_KEY = "relation/section-entity/v1"
const PAGE_SHADOW_PREFIX = "page:"
const SECTION_SHADOW_PREFIX = "section:"

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function safeRedirectPath(formData: FormData) {
  const value = stringField(formData, "redirect_to")
  return value.startsWith("/ponix") && !value.startsWith("//")
    ? value
    : "/ponix/relations"
}

function redirectWithParams(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`${path}?${search.toString()}`)
}

function parseUuid(formData: FormData, key: string, label: string) {
  const value = stringField(formData, key)
  if (!uuidPattern.test(value)) {
    throw new Error(`${label} is required.`)
  }

  return value
}

function parseText(formData: FormData, key: string, label: string) {
  const value = stringField(formData, key)
  if (!value) {
    throw new Error(`${label} is required.`)
  }

  return value
}

function hasField(formData: FormData, key: string) {
  return formData.has(key)
}

function parseSortOrder(formData: FormData) {
  const raw = stringField(formData, "sort_order")
  if (!raw) return 0

  const value = Number(raw)
  if (!Number.isInteger(value)) {
    throw new Error("Sort order must be an integer.")
  }

  return value
}

function parseProps(formData: FormData): Json {
  const raw = stringField(formData, "props")
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as Json
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Relation props must be a JSON object.")
    }

    return parsed
  } catch {
    throw new Error("Relation props must be valid JSON object syntax.")
  }
}

function relationError(path: string, error: unknown): never {
  unstable_rethrow(error)

  redirectWithParams(path, {
    relation_error:
      error instanceof Error ? error.message : "Relation mutation failed.",
  })
}

function relationSuccess(path: string, message: string): never {
  redirectWithParams(path, {
    relation_message: message,
  })
}

function revalidateRelationSurfaces(paths: string[]) {
  updateTag(PUBLIC_CONTENT_CACHE_TAG)

  for (const path of [
    "/",
    "/performances",
    "/performances/updates",
    "/videos",
    "/photos",
    "/history",
    "/ponix",
    "/ponix/relations",
    "/ponix/pages",
    "/ponix/sections",
    "/ponix/entities",
    ...paths,
  ]) {
    revalidatePath(path)
  }
}

function shadowSlug(sourceTable: "pages" | "sections", sourceKey: string) {
  return `${sourceTable === "pages" ? PAGE_SHADOW_PREFIX : SECTION_SHADOW_PREFIX}${sourceKey}`
}

async function loadSchemaIdByKey({
  supabase,
  schemaKey,
  label,
}: {
  supabase: ServerSupabaseClient
  schemaKey: string
  label: string
}) {
  const { data, error } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("schema_key", schemaKey)
    .eq("active", true)
    .maybeSingle()

  if (error || !data?.id) {
    throw new Error(error?.message ?? `${label} schema is not registered.`)
  }

  return data.id
}

async function loadSchemaIdsByKind({
  supabase,
  kind,
  label,
}: {
  supabase: ServerSupabaseClient
  kind: string
  label: string
}) {
  const { data, error } = await supabase
    .from("entity_schemas")
    .select("id")
    .eq("kind", kind)
    .eq("active", true)

  const ids = (data ?? []).map((schema) => schema.id).filter(Boolean)
  if (error || !ids.length) {
    throw new Error(error?.message ?? `${label} schemas are not registered.`)
  }

  return ids
}

async function loadShadowEntityId({
  supabase,
  sourceTable,
  sourceId,
  label,
}: {
  supabase: ServerSupabaseClient
  sourceTable: "pages" | "sections"
  sourceId: string
  label: string
}) {
  const { data: directEntity, error: directEntityError } = await supabase
    .from("entities")
    .select("id, schema_id")
    .eq("id", sourceId)
    .maybeSingle()

  if (directEntityError) {
    throw new Error(directEntityError.message)
  }

  if (directEntity) {
    const validSchema =
      sourceTable === "pages"
        ? directEntity.schema_id ===
          (await loadSchemaIdByKey({
            supabase,
            schemaKey: PAGE_ENTITY_SCHEMA_KEY,
            label: "Page",
          }))
        : (
            await loadSchemaIdsByKind({
              supabase,
              kind: "section",
              label: "Section",
            })
          ).includes(directEntity.schema_id)

    if (!validSchema) {
      throw new Error(`${label} graph entity is not a ${label.toLowerCase()}.`)
    }

    return directEntity.id
  }

  const source =
    sourceTable === "pages"
      ? await supabase
          .from("pages")
          .select("slug")
          .eq("id", sourceId)
          .maybeSingle()
      : await supabase
          .from("sections")
          .select("key")
          .eq("id", sourceId)
          .maybeSingle()

  if (source.error) {
    throw new Error(source.error.message)
  }

  const sourceKey =
    sourceTable === "pages"
      ? (source.data as { slug?: string } | null)?.slug
      : (source.data as { key?: string } | null)?.key

  if (!sourceKey) {
    throw new Error(`${label} source record not found.`)
  }

  let query = supabase
    .from("entities")
    .select("id")
    .eq("slug", shadowSlug(sourceTable, sourceKey))

  if (sourceTable === "pages") {
    const pageSchemaId = await loadSchemaIdByKey({
      supabase,
      schemaKey: PAGE_ENTITY_SCHEMA_KEY,
      label: "Page",
    })
    query = query.eq("schema_id", pageSchemaId)
  } else {
    const sectionSchemaIds = await loadSchemaIdsByKind({
      supabase,
      kind: "section",
      label: "Section",
    })
    query = query.in("schema_id", sectionSchemaIds)
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data?.id) {
    throw new Error(error?.message ?? `${label} graph entity not found.`)
  }

  return data.id
}

async function loadPageSectionGraphRelation(
  supabase: ServerSupabaseClient,
  graphRelationId: string,
) {
  const relationSchemaId = await loadSchemaIdByKey({
    supabase,
    schemaKey: PAGE_SECTION_RELATION_SCHEMA_KEY,
    label: "Page section relation",
  })
  const { data, error } = await supabase
    .from("entity_relations")
    .select(
      `
        id,
        from_entity_id,
        to_entity_id
      `,
    )
    .eq("id", graphRelationId)
    .eq("schema_id", relationSchemaId)
    .maybeSingle()

  const relation = data as unknown as PageSectionGraphRelation | null

  if (error || !relation) {
    throw new Error(error?.message ?? "Page section graph relation not found.")
  }

  return {
    ...relation,
    pageId: relation.from_entity_id,
    sectionId: relation.to_entity_id,
  }
}

async function loadSectionEntityGraphRelation(
  supabase: ServerSupabaseClient,
  graphRelationId: string,
) {
  const relationSchemaId = await loadSchemaIdByKey({
    supabase,
    schemaKey: SECTION_ENTITY_RELATION_SCHEMA_KEY,
    label: "Section entity relation",
  })
  const { data, error } = await supabase
    .from("entity_relations")
    .select(
      `
        id,
        from_entity_id,
        to_entity_id
      `,
    )
    .eq("id", graphRelationId)
    .eq("schema_id", relationSchemaId)
    .maybeSingle()

  const relation = data as unknown as SectionEntityGraphRelation | null

  if (error || !relation) {
    throw new Error(error?.message ?? "Section graph relation not found.")
  }

  return {
    ...relation,
    sectionId: relation.from_entity_id,
    entityId: relation.to_entity_id,
  }
}

export async function addPageSectionRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    const admin = await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const pageId = parseUuid(formData, "page_id", "Page")
    const sectionId = parseUuid(formData, "section_id", "Section")
    const [pageEntityId, sectionEntityId, relationSchemaId] = await Promise.all([
      loadShadowEntityId({
        supabase,
        sourceTable: "pages",
        sourceId: pageId,
        label: "Page",
      }),
      loadShadowEntityId({
        supabase,
        sourceTable: "sections",
        sourceId: sectionId,
        label: "Section",
      }),
      loadSchemaIdByKey({
        supabase,
        schemaKey: PAGE_SECTION_RELATION_SCHEMA_KEY,
        label: "Page section relation",
      }),
    ])
    const payload: EntityRelationInsert = {
      from_entity_id: pageEntityId,
      to_entity_id: sectionEntityId,
      schema_id: relationSchemaId,
      relation_type: "contains_section",
      slot: "sections",
      sort_order: parseSortOrder(formData),
      props: {},
      created_by_member_id: admin.id,
    }
    const { data: existing, error: existingError } = await supabase
      .from("entity_relations")
      .select("id")
      .eq("schema_id", relationSchemaId)
      .eq("from_entity_id", pageEntityId)
      .eq("to_entity_id", sectionEntityId)
      .eq("relation_type", "contains_section")
      .eq("slot", "sections")
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)

    const { error } = existing
      ? await supabase
          .from("entity_relations")
          .update({
            schema_id: payload.schema_id,
            sort_order: payload.sort_order,
            props: payload.props,
          } satisfies EntityRelationUpdate)
          .eq("id", existing.id)
      : await supabase.from("entity_relations").insert(payload)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/pages/${pageId}`,
      `/ponix/sections/${sectionId}`,
    ])
    relationSuccess(redirectTo, "Page section saved.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function updatePageSectionRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const graphRelationId = parseUuid(formData, "relation_id", "Relation")
    const update: EntityRelationUpdate = {
      sort_order: parseSortOrder(formData),
    }
    const relation = await loadPageSectionGraphRelation(
      supabase,
      graphRelationId,
    )

    const { error } = await supabase
      .from("entity_relations")
      .update(update)
      .eq("id", relation.id)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/pages/${relation.pageId}`,
      `/ponix/sections/${relation.sectionId}`,
    ])
    relationSuccess(redirectTo, "Page section order saved.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function deletePageSectionRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const graphRelationId = parseUuid(formData, "relation_id", "Relation")
    const relation = await loadPageSectionGraphRelation(
      supabase,
      graphRelationId,
    )

    const { error } = await supabase
      .from("entity_relations")
      .delete()
      .eq("id", relation.id)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/pages/${relation.pageId}`,
      `/ponix/sections/${relation.sectionId}`,
    ])
    relationSuccess(redirectTo, "Page section removed.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function addSectionEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    const admin = await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const sectionId = parseUuid(formData, "section_id", "Section")
    const entityId = parseUuid(formData, "entity_id", "Entity")
    const relationType = parseText(formData, "relation_type", "Relation type")
    const slot = stringField(formData, "slot") || "default"
    const [sectionEntityId, relationSchemaId] = await Promise.all([
      loadShadowEntityId({
        supabase,
        sourceTable: "sections",
        sourceId: sectionId,
        label: "Section",
      }),
      loadSchemaIdByKey({
        supabase,
        schemaKey: SECTION_ENTITY_RELATION_SCHEMA_KEY,
        label: "Section entity relation",
      }),
    ])
    const payload: EntityRelationInsert = {
      from_entity_id: sectionEntityId,
      to_entity_id: entityId,
      schema_id: relationSchemaId,
      relation_type: relationType,
      slot,
      sort_order: parseSortOrder(formData),
      props: parseProps(formData),
      created_by_member_id: admin.id,
    }
    const { data: existing, error: existingError } = await supabase
      .from("entity_relations")
      .select("id")
      .eq("schema_id", relationSchemaId)
      .eq("from_entity_id", payload.from_entity_id)
      .eq("to_entity_id", payload.to_entity_id)
      .eq("relation_type", relationType)
      .eq("slot", slot)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)

    const { error } = existing
      ? await supabase
          .from("entity_relations")
          .update({
            schema_id: payload.schema_id,
            relation_type: payload.relation_type,
            slot: payload.slot,
            sort_order: payload.sort_order,
            props: payload.props,
          } satisfies EntityRelationUpdate)
          .eq("id", existing.id)
      : await supabase.from("entity_relations").insert(payload)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${sectionId}`,
      `/ponix/entities/${entityId}`,
    ])
    relationSuccess(redirectTo, "Section relation saved.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function updateSectionEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const graphRelationId = parseUuid(formData, "relation_id", "Relation")
    const update: EntityRelationUpdate = {
      sort_order: parseSortOrder(formData),
    }

    if (hasField(formData, "relation_type")) {
      update.relation_type = parseText(
        formData,
        "relation_type",
        "Relation type",
      )
    }

    if (hasField(formData, "slot")) {
      update.slot = stringField(formData, "slot") || "default"
    }

    if (hasField(formData, "props")) {
      update.props = parseProps(formData)
    }

    const relation = await loadSectionEntityGraphRelation(
      supabase,
      graphRelationId,
    )

    const { error } = await supabase
      .from("entity_relations")
      .update(update)
      .eq("id", relation.id)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${relation.sectionId}`,
      `/ponix/entities/${relation.entityId}`,
    ])
    relationSuccess(redirectTo, "Section relation saved.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function updateSectionEntityRelationInlineAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireCmsAdmin("/ponix/relations")
    const supabase = await createClient()
    const graphRelationId = parseUuid(formData, "relation_id", "Relation")
    const update: EntityRelationUpdate = {
      sort_order: parseSortOrder(formData),
    }

    if (hasField(formData, "relation_type")) {
      update.relation_type = parseText(
        formData,
        "relation_type",
        "Relation type",
      )
    }

    if (hasField(formData, "slot")) {
      update.slot = stringField(formData, "slot") || "default"
    }

    if (hasField(formData, "props")) {
      update.props = parseProps(formData)
    }

    const relation = await loadSectionEntityGraphRelation(
      supabase,
      graphRelationId,
    )

    const { error } = await supabase
      .from("entity_relations")
      .update(update)
      .eq("id", relation.id)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${relation.sectionId}`,
      `/ponix/entities/${relation.entityId}`,
    ])

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Section relation save failed.",
    }
  }
}

export async function reorderSectionEntityRelationsAction({
  sectionId,
  graphRelationIds,
}: {
  sectionId: string
  graphRelationIds: string[]
}): Promise<ActionResult> {
  try {
    await requireCmsAdmin("/ponix/relations")

    if (!uuidPattern.test(sectionId)) {
      throw new Error("Section is required.")
    }

    const orderedIds = graphRelationIds.filter((id) => uuidPattern.test(id))
    if (
      orderedIds.length !== graphRelationIds.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.length === 0
    ) {
      throw new Error("Relation order is invalid.")
    }

    const supabase = await createClient()
    const [sectionShadowId, relationSchemaId] = await Promise.all([
      loadShadowEntityId({
        supabase,
        sourceTable: "sections",
        sourceId: sectionId,
        label: "Section",
      }),
      loadSchemaIdByKey({
        supabase,
        schemaKey: SECTION_ENTITY_RELATION_SCHEMA_KEY,
        label: "Section entity relation",
      }),
    ])

    const { data: relations, error: loadError } = await supabase
      .from("entity_relations")
      .select("id, to_entity_id")
      .eq("schema_id", relationSchemaId)
      .eq("from_entity_id", sectionShadowId)
      .in("id", orderedIds)

    if (loadError) {
      throw new Error(loadError.message)
    }

    const loadedIds = new Set((relations ?? []).map((relation) => relation.id))
    if (loadedIds.size !== orderedIds.length) {
      throw new Error("Some relations do not belong to this section.")
    }

    const updates = orderedIds.map((relationId, index) =>
      supabase
        .from("entity_relations")
        .update({ sort_order: (index + 1) * 10 } satisfies EntityRelationUpdate)
        .eq("id", relationId)
        .eq("schema_id", relationSchemaId)
        .eq("from_entity_id", sectionShadowId),
    )
    const results = await Promise.all(updates)
    const updateError = results.find((result) => result.error)?.error

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidateRelationSurfaces([
      `/ponix/sections/${sectionId}`,
      ...(relations ?? []).map((relation) => `/ponix/entities/${relation.to_entity_id}`),
    ])

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Relation reorder failed.",
    }
  }
}

export async function deleteSectionEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const graphRelationId = parseUuid(formData, "relation_id", "Relation")
    const relation = await loadSectionEntityGraphRelation(
      supabase,
      graphRelationId,
    )

    const { error } = await supabase
      .from("entity_relations")
      .delete()
      .eq("id", relation.id)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${relation.sectionId}`,
      `/ponix/entities/${relation.entityId}`,
    ])
    relationSuccess(redirectTo, "Section relation removed.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function addEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    const admin = await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const fromEntityId = parseUuid(formData, "from_entity_id", "From entity")
    const toEntityId = parseUuid(formData, "to_entity_id", "To entity")

    if (fromEntityId === toEntityId) {
      throw new Error("Entity relations cannot point to the same entity.")
    }

    const relationSchemaId = await loadSchemaIdByKey({
      supabase,
      schemaKey: DEFAULT_RELATION_SCHEMA_KEY,
      label: "Entity relation",
    })
    const payload: EntityRelationInsert = {
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      schema_id: relationSchemaId,
      relation_type: parseText(formData, "relation_type", "Relation type"),
      slot: stringField(formData, "slot") || "default",
      sort_order: parseSortOrder(formData),
      props: parseProps(formData),
      created_by_member_id: admin.id,
    }
    const { error } = await supabase
      .from("entity_relations")
      .upsert(payload, {
        onConflict: "from_entity_id,to_entity_id,relation_type,slot",
      })

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/entities/${fromEntityId}`,
      `/ponix/entities/${toEntityId}`,
    ])
    relationSuccess(redirectTo, "Entity relation saved.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function updateEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const update: EntityRelationUpdate = {
      sort_order: parseSortOrder(formData),
    }
    const { data: relation, error: loadError } = await supabase
      .from("entity_relations")
      .select("from_entity_id, to_entity_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("entity_relations")
      .update(update)
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/entities/${relation.from_entity_id}`,
      `/ponix/entities/${relation.to_entity_id}`,
    ])
    relationSuccess(redirectTo, "Entity relation order saved.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function deleteEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const { data: relation, error: loadError } = await supabase
      .from("entity_relations")
      .select("from_entity_id, to_entity_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("entity_relations")
      .delete()
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/entities/${relation.from_entity_id}`,
      `/ponix/entities/${relation.to_entity_id}`,
    ])
    relationSuccess(redirectTo, "Entity relation removed.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}
