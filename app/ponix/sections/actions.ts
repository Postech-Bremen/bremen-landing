"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  cmsFieldInputName,
  getEditableSectionFields,
  getSectionEditorSchema,
  jsonObject,
  type CmsEditableSectionField,
  type CmsJsonObject,
} from "@/lib/cms/section-editor"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type SectionUpdate = Database["public"]["Tables"]["sections"]["Update"]

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

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithParams(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`${path}?${search.toString()}`)
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

function parseBoolean(formData: FormData, field: CmsEditableSectionField): ParsedValue {
  const values = formData.getAll(cmsFieldInputName(field))

  return {
    ok: true,
    empty: false,
    value: values.includes("true"),
  }
}

function parseStringList(
  formData: FormData,
  field: CmsEditableSectionField,
): ParsedValue {
  const value = stringField(formData, cmsFieldInputName(field))
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

function parseJson(formData: FormData, field: CmsEditableSectionField): ParsedValue {
  const value = stringField(formData, cmsFieldInputName(field))

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

function parseNumber(formData: FormData, field: CmsEditableSectionField): ParsedValue {
  const value = stringField(formData, cmsFieldInputName(field))

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
  field: CmsEditableSectionField,
): ParsedValue {
  const value = stringField(formData, cmsFieldInputName(field))

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
  field: CmsEditableSectionField,
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

function updatePropsValue(
  props: CmsJsonObject,
  field: CmsEditableSectionField,
  parsed: ParsedValue & { ok: true },
) {
  if (parsed.empty) {
    delete props[field.key]
    return
  }

  props[field.key] = parsed.value
}

export async function updateCmsSectionAction(formData: FormData) {
  const sectionId = stringField(formData, "section_id")

  if (!sectionId) {
    redirectWithParams("/ponix/sections", {
      error: "Missing section id.",
    })
  }

  const editPath = `/ponix/sections/${sectionId}/edit`
  await requireCmsAdmin(editPath)

  const supabase = await createClient()
  const { data: section, error: loadError } = await supabase
    .from("sections")
    .select("*")
    .eq("id", sectionId)
    .maybeSingle()

  if (loadError || !section) {
    redirectWithParams(editPath, {
      error: "Section not found.",
    })
  }

  const schema = getSectionEditorSchema(section.schema_key)
  if (!schema) {
    redirectWithParams(editPath, {
      error: "This section schema is not registered for editing.",
    })
  }

  const fields = getEditableSectionFields(section.schema_key)
  const props = jsonObject(section.props)
  const update: SectionUpdate = {}

  for (const field of fields) {
    const parsed = parseFieldValue(formData, field)

    if (!parsed.ok) {
      redirectWithParams(editPath, {
        error: parsed.error,
      })
    }

    if (field.source === "props") {
      updatePropsValue(props, field, parsed)
      continue
    }

    if (field.key === "published") {
      update.published = Boolean(parsed.value)
    }

    if (field.key === "eyebrow") {
      update.eyebrow = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "title") {
      update.title = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "subtitle") {
      update.subtitle = parsed.value === null ? null : String(parsed.value)
    }
  }

  update.props = props

  const { error: updateError } = await supabase
    .from("sections")
    .update(update)
    .eq("id", sectionId)

  if (updateError) {
    redirectWithParams(editPath, {
      error: "Section save failed.",
    })
  }

  revalidatePath("/")
  revalidatePath("/performances")
  revalidatePath("/videos")
  revalidatePath("/photos")
  revalidatePath("/history")
  revalidatePath("/ponix")
  revalidatePath("/ponix/sections")
  revalidatePath(`/ponix/sections/${sectionId}`)
  revalidatePath("/ponix/relations")

  redirect(`/ponix/sections/${sectionId}`)
}
