"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type PageSectionInsert =
  Database["public"]["Tables"]["page_sections"]["Insert"]
type PageSectionUpdate =
  Database["public"]["Tables"]["page_sections"]["Update"]
type SectionEntityInsert =
  Database["public"]["Tables"]["section_entities"]["Insert"]
type SectionEntityUpdate =
  Database["public"]["Tables"]["section_entities"]["Update"]
type EntityRelationInsert =
  Database["public"]["Tables"]["entity_relations"]["Insert"]
type EntityRelationUpdate =
  Database["public"]["Tables"]["entity_relations"]["Update"]

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

export async function addPageSectionRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const payload: PageSectionInsert = {
      page_id: parseUuid(formData, "page_id", "Page"),
      section_id: parseUuid(formData, "section_id", "Section"),
      sort_order: parseSortOrder(formData),
    }
    const { error } = await supabase
      .from("page_sections")
      .upsert(payload, {
        onConflict: "page_id,section_id",
      })

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/pages/${payload.page_id}`,
      `/ponix/sections/${payload.section_id}`,
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
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const update: PageSectionUpdate = {
      sort_order: parseSortOrder(formData),
    }
    const { data: relation, error: loadError } = await supabase
      .from("page_sections")
      .select("page_id, section_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("page_sections")
      .update(update)
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/pages/${relation.page_id}`,
      `/ponix/sections/${relation.section_id}`,
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
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const { data: relation, error: loadError } = await supabase
      .from("page_sections")
      .select("page_id, section_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("page_sections")
      .delete()
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/pages/${relation.page_id}`,
      `/ponix/sections/${relation.section_id}`,
    ])
    relationSuccess(redirectTo, "Page section removed.")
  } catch (error) {
    relationError(redirectTo, error)
  }
}

export async function addSectionEntityRelationAction(formData: FormData) {
  const redirectTo = safeRedirectPath(formData)

  try {
    await requireCmsAdmin(redirectTo)
    const supabase = await createClient()
    const payload: SectionEntityInsert = {
      section_id: parseUuid(formData, "section_id", "Section"),
      entity_id: parseUuid(formData, "entity_id", "Entity"),
      relation_type: parseText(formData, "relation_type", "Relation type"),
      slot: stringField(formData, "slot") || "default",
      sort_order: parseSortOrder(formData),
      props: parseProps(formData),
    }
    const { data: existing, error: existingError } = await supabase
      .from("section_entities")
      .select("id")
      .eq("section_id", payload.section_id)
      .eq("entity_id", payload.entity_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existingError) throw new Error(existingError.message)

    const { error } = existing
      ? await supabase
          .from("section_entities")
          .update({
            relation_type: payload.relation_type,
            slot: payload.slot,
            sort_order: payload.sort_order,
            props: payload.props,
          } satisfies SectionEntityUpdate)
          .eq("id", existing.id)
      : await supabase.from("section_entities").insert(payload)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${payload.section_id}`,
      `/ponix/entities/${payload.entity_id}`,
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
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const update: SectionEntityUpdate = {
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

    const { data: relation, error: loadError } = await supabase
      .from("section_entities")
      .select("section_id, entity_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("section_entities")
      .update(update)
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${relation.section_id}`,
      `/ponix/entities/${relation.entity_id}`,
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
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const update: SectionEntityUpdate = {
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

    const { data: relation, error: loadError } = await supabase
      .from("section_entities")
      .select("section_id, entity_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("section_entities")
      .update(update)
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${relation.section_id}`,
      `/ponix/entities/${relation.entity_id}`,
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
  relationIds,
}: {
  sectionId: string
  relationIds: string[]
}): Promise<ActionResult> {
  try {
    await requireCmsAdmin("/ponix/relations")

    if (!uuidPattern.test(sectionId)) {
      throw new Error("Section is required.")
    }

    const orderedIds = relationIds.filter((id) => uuidPattern.test(id))
    if (orderedIds.length !== relationIds.length || orderedIds.length === 0) {
      throw new Error("Relation order is invalid.")
    }

    const supabase = await createClient()
    const { data: relations, error: loadError } = await supabase
      .from("section_entities")
      .select("id, section_id, entity_id")
      .eq("section_id", sectionId)
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
        .from("section_entities")
        .update({ sort_order: (index + 1) * 10 } satisfies SectionEntityUpdate)
        .eq("id", relationId)
        .eq("section_id", sectionId),
    )
    const results = await Promise.all(updates)
    const updateError = results.find((result) => result.error)?.error

    if (updateError) {
      throw new Error(updateError.message)
    }

    revalidateRelationSurfaces([
      `/ponix/sections/${sectionId}`,
      ...(relations ?? []).map((relation) => `/ponix/entities/${relation.entity_id}`),
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
    const relationId = parseUuid(formData, "relation_id", "Relation")
    const { data: relation, error: loadError } = await supabase
      .from("section_entities")
      .select("section_id, entity_id")
      .eq("id", relationId)
      .maybeSingle()

    if (loadError || !relation) {
      throw new Error(loadError?.message ?? "Relation not found.")
    }

    const { error } = await supabase
      .from("section_entities")
      .delete()
      .eq("id", relationId)

    if (error) throw new Error(error.message)

    revalidateRelationSurfaces([
      `/ponix/sections/${relation.section_id}`,
      `/ponix/entities/${relation.entity_id}`,
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

    const payload: EntityRelationInsert = {
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
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
