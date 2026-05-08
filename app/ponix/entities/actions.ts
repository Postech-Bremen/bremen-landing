"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  cmsEntityFieldInputName,
  entityTypeFromSchemaKey,
  editableEntityFieldsForSchema,
  jsonObject,
  type CmsEditableEntityField,
  type CmsJsonObject,
} from "@/lib/cms/entity-editor"
import {
  loadEntityCreationSchema,
  loadEntityEditorSchema,
} from "@/lib/cms/entity-editor.server"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type EntityUpdate = Database["public"]["Tables"]["entities"]["Update"]
type EntityInsert = Database["public"]["Tables"]["entities"]["Insert"]
type EntityRow = Database["public"]["Tables"]["entities"]["Row"]

type ActionResult =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

type ParsedValue =
  | {
      ok: true
      empty: boolean
      value: Json
    }
  | {
      ok: false
      error: string
    }

const maxThumbnailSize = 5 * 1024 * 1024
const entityThumbnailBucket = "images"

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithParams(path: string, params: Record<string, string>): never {
  const [pathname, currentSearch = ""] = path.split("?")
  const search = new URLSearchParams(currentSearch)

  for (const [key, value] of Object.entries(params)) {
    search.set(key, value)
  }

  redirect(`${pathname}?${search.toString()}`)
}

function safeRedirectPath(formData: FormData, fallback: string) {
  const value = stringField(formData, "redirect_to")
  return value.startsWith("/ponix") && !value.startsWith("//") ? value : fallback
}

function revalidateEntitySurfaces(entityId?: string) {
  revalidatePath("/")
  revalidatePath("/performances")
  revalidatePath("/performances/updates")
  revalidatePath("/videos")
  revalidatePath("/photos")
  revalidatePath("/history")
  updateTag(PUBLIC_CONTENT_CACHE_TAG)
  revalidatePath("/ponix")
  revalidatePath("/ponix/entities")
  revalidatePath("/ponix/entities/new")
  revalidatePath("/ponix/relations")

  if (entityId) {
    revalidatePath(`/ponix/entities/${entityId}`)
    revalidatePath(`/ponix/entities/${entityId}/edit`)
  }
}

function isSafeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function parseBoolean(formData: FormData, field: CmsEditableEntityField): ParsedValue {
  const values = formData.getAll(cmsEntityFieldInputName(field))

  return {
    ok: true,
    empty: false,
    value: values.includes("true"),
  }
}

function parseStringList(
  formData: FormData,
  field: CmsEditableEntityField,
): ParsedValue {
  const value = stringField(formData, cmsEntityFieldInputName(field))
  const items = value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)

  if (field.required && items.length === 0) {
    return { ok: false, error: `${field.label} is required.` }
  }

  return {
    ok: true,
    empty: items.length === 0,
    value: items,
  }
}

function parseJson(formData: FormData, field: CmsEditableEntityField): ParsedValue {
  const value = stringField(formData, cmsEntityFieldInputName(field))

  if (!value) {
    if (field.required) {
      return { ok: false, error: `${field.label} is required.` }
    }

    return { ok: true, empty: true, value: null }
  }

  try {
    return {
      ok: true,
      empty: false,
      value: JSON.parse(value) as Json,
    }
  } catch {
    return { ok: false, error: `${field.label} must be valid JSON.` }
  }
}

function parseNumber(formData: FormData, field: CmsEditableEntityField): ParsedValue {
  const value = stringField(formData, cmsEntityFieldInputName(field))

  if (!value) {
    if (field.required) {
      return { ok: false, error: `${field.label} is required.` }
    }

    return { ok: true, empty: true, value: null }
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `${field.label} must be a number.` }
  }

  return {
    ok: true,
    empty: false,
    value: parsed,
  }
}

function parseTextLike(
  formData: FormData,
  field: CmsEditableEntityField,
): ParsedValue {
  const value = stringField(formData, cmsEntityFieldInputName(field))

  if (!value) {
    if (field.required) {
      return { ok: false, error: `${field.label} is required.` }
    }

    return { ok: true, empty: true, value: null }
  }

  if ((field.type === "url" || field.type === "image") && !isSafeUrl(value)) {
    return {
      ok: false,
      error: `${field.label} must be an absolute URL or site-root path.`,
    }
  }

  if (field.type === "date" && Number.isNaN(Date.parse(value))) {
    return { ok: false, error: `${field.label} must be a valid date.` }
  }

  if (field.type === "datetime" && Number.isNaN(Date.parse(value))) {
    return { ok: false, error: `${field.label} must be a valid date and time.` }
  }

  if (
    field.type === "select" &&
    field.options?.length &&
    !field.options.some((option) => option.value === value)
  ) {
    return { ok: false, error: `${field.label} has an invalid option.` }
  }

  return {
    ok: true,
    empty: false,
    value,
  }
}

function parseFieldValue(
  formData: FormData,
  field: CmsEditableEntityField,
): ParsedValue {
  if (field.type === "boolean") {
    return parseBoolean(formData, field)
  }

  if (field.type === "string-list") {
    return parseStringList(formData, field)
  }

  if (field.type === "json") {
    return parseJson(formData, field)
  }

  if (field.type === "number") {
    return parseNumber(formData, field)
  }

  return parseTextLike(formData, field)
}

function updateDataValue(
  data: CmsJsonObject,
  field: CmsEditableEntityField,
  parsed: ParsedValue & { ok: true },
) {
  if (parsed.empty) {
    delete data[field.key]
    return
  }

  data[field.key] = parsed.value
}

function extensionFromImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }

  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

async function uploadThumbnailIfPresent({
  supabase,
  entity,
  formData,
  editPath,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  entity: EntityRow
  formData: FormData
  editPath: string
}) {
  const file = formData.get("thumbnail_file")
  if (!(file instanceof File) || file.size === 0) return null

  if (!file.type.startsWith("image/")) {
    redirectWithParams(editPath, {
      error: "Thumbnail upload accepts image files only.",
    })
  }

  if (file.size > maxThumbnailSize) {
    redirectWithParams(editPath, {
      error: "Thumbnail image must be 5MB or smaller.",
    })
  }

  const extension = extensionFromImage(file)
  const safeKey = (entity.slug ?? entity.id).replace(/[^a-zA-Z0-9._-]+/g, "-")
  const safeType = entity.entity_type.replace(/[^a-zA-Z0-9._-]+/g, "-")
  const path = `entities/${safeType}/${entity.id}/${safeKey}-thumbnail-${Date.now()}.${extension}`
  const { error } = await supabase.storage
    .from(entityThumbnailBucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || `image/${extension}`,
      upsert: true,
    })

  if (error) {
    redirectWithParams(editPath, {
      error: "Thumbnail upload failed.",
    })
  }

  return supabase.storage.from(entityThumbnailBucket).getPublicUrl(path).data.publicUrl
}

async function buildEntityUpdate({
  formData,
  entity,
  editPath,
  redirectOnError,
}: {
  formData: FormData
  entity: EntityRow
  editPath: string
  redirectOnError: boolean
}) {
  const schema = await loadEntityEditorSchema(entity.schema_key)
  if (!schema) {
    const error = "This entity schema is not registered for editing."
    if (redirectOnError) {
      redirectWithParams(editPath, { error })
    }
    throw new Error(error)
  }

  const fields = editableEntityFieldsForSchema(schema)
  const data = jsonObject(entity.data)
  const update: EntityUpdate = {}

  for (const field of fields) {
    const parsed = parseFieldValue(formData, field)

    if (!parsed.ok) {
      if (redirectOnError) {
        redirectWithParams(editPath, {
          error: parsed.error,
        })
      }
      throw new Error(parsed.error)
    }

    if (field.source === "data") {
      updateDataValue(data, field, parsed)
      continue
    }

    if (field.key === "published") {
      update.published = Boolean(parsed.value)
    }

    if (field.key === "slug") {
      update.slug = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "title") {
      update.title = String(parsed.value)
    }

    if (field.key === "subtitle") {
      update.subtitle = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "summary") {
      update.summary = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "thumbnail_url") {
      update.thumbnail_url =
        parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "sort_at") {
      update.sort_at = new Date(String(parsed.value)).toISOString()
    }
  }

  update.data = data
  return update
}

export async function createCmsEntityAction(formData: FormData) {
  const schemaKey = stringField(formData, "schema_key")
  const createPath = schemaKey
    ? `/ponix/entities/new?schema=${encodeURIComponent(schemaKey)}`
    : "/ponix/entities/new"
  const admin = await requireCmsAdmin(createPath)

  const schema = await loadEntityCreationSchema(schemaKey)
  if (!schema) {
    redirectWithParams("/ponix/entities/new", {
      error: "Choose a schema that can be created from CMS.",
    })
  }

  const fields = editableEntityFieldsForSchema(schema)
  const data: CmsJsonObject = {}
  const insert: EntityInsert = {
    data,
    entity_type: entityTypeFromSchemaKey(schema.schemaKey),
    owner_member_id: admin.id,
    published: false,
    schema_key: schema.schemaKey,
    sort_at: new Date().toISOString(),
    title: "",
  }

  for (const field of fields) {
    const parsed = parseFieldValue(formData, field)

    if (!parsed.ok) {
      redirectWithParams(createPath, {
        error: parsed.error,
      })
    }

    if (field.source === "data") {
      updateDataValue(data, field, parsed)
      continue
    }

    if (field.key === "published") {
      insert.published = Boolean(parsed.value)
    }

    if (field.key === "slug") {
      insert.slug = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "title") {
      insert.title = String(parsed.value)
    }

    if (field.key === "subtitle") {
      insert.subtitle = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "summary") {
      insert.summary = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "thumbnail_url") {
      insert.thumbnail_url = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "sort_at") {
      insert.sort_at = new Date(String(parsed.value)).toISOString()
    }
  }

  const supabase = await createClient()
  const { data: created, error: insertError } = await supabase
    .from("entities")
    .insert(insert)
    .select("*")
    .single()

  if (insertError || !created) {
    redirectWithParams(createPath, {
      error: "Entity creation failed.",
    })
  }

  const editPath = `/ponix/entities/${created.id}/edit`
  const uploadedThumbnailUrl = await uploadThumbnailIfPresent({
    supabase,
    entity: created,
    formData,
    editPath,
  })

  if (uploadedThumbnailUrl) {
    const { error: thumbnailUpdateError } = await supabase
      .from("entities")
      .update({ thumbnail_url: uploadedThumbnailUrl })
      .eq("id", created.id)

    if (thumbnailUpdateError) {
      redirectWithParams(editPath, {
        error: "Thumbnail URL save failed.",
      })
    }
  }

  revalidateEntitySurfaces(created.id)

  redirect(`/ponix/entities/${created.id}`)
}

export async function updateCmsEntityAction(formData: FormData) {
  const entityId = stringField(formData, "entity_id")

  if (!entityId) {
    redirectWithParams("/ponix/entities", {
      error: "Missing entity id.",
    })
  }

  const editPath = `/ponix/entities/${entityId}/edit`
  const redirectTo = safeRedirectPath(formData, editPath)
  await requireCmsAdmin(editPath)

  const supabase = await createClient()
  const { data: entity, error: loadError } = await supabase
    .from("entities")
    .select("*")
    .eq("id", entityId)
    .maybeSingle()

  if (loadError || !entity) {
    redirectWithParams(editPath, {
      error: "Entity not found.",
    })
  }

  const update = await buildEntityUpdate({
    formData,
    entity,
    editPath,
    redirectOnError: true,
  })

  const uploadedThumbnailUrl = await uploadThumbnailIfPresent({
    supabase,
    entity,
    formData,
    editPath,
  })

  if (uploadedThumbnailUrl) {
    update.thumbnail_url = uploadedThumbnailUrl
  }

  const { error: updateError } = await supabase
    .from("entities")
    .update(update)
    .eq("id", entityId)

  if (updateError) {
    redirectWithParams(editPath, {
      error: "Entity save failed.",
    })
  }

  revalidateEntitySurfaces(entityId)

  redirectWithParams(redirectTo, {
    saved: "entity",
  })
}

export async function updateCmsEntityInlineAction(
  formData: FormData,
): Promise<ActionResult> {
  const entityId = stringField(formData, "entity_id")

  try {
    if (!entityId) {
      throw new Error("Missing entity id.")
    }

    const editPath = `/ponix/entities/${entityId}/edit`
    await requireCmsAdmin(editPath)

    const supabase = await createClient()
    const { data: entity, error: loadError } = await supabase
      .from("entities")
      .select("*")
      .eq("id", entityId)
      .maybeSingle()

    if (loadError || !entity) {
      throw new Error("Entity not found.")
    }

    const update = await buildEntityUpdate({
      formData,
      entity,
      editPath,
      redirectOnError: false,
    })

    const { error: updateError } = await supabase
      .from("entities")
      .update(update)
      .eq("id", entityId)

    if (updateError) {
      throw new Error("Entity save failed.")
    }

    revalidateEntitySurfaces(entityId)

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Entity save failed.",
    }
  }
}
