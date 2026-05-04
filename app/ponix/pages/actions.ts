"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  cmsPageFieldInputName,
  getEditablePageFields,
  getPageEditorSchema,
  jsonObject,
  type CmsEditablePageField,
  type CmsJsonObject,
} from "@/lib/cms/page-editor"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

type PageUpdate = Database["public"]["Tables"]["pages"]["Update"]

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
  const [pathname, currentSearch = ""] = path.split("?")
  const search = new URLSearchParams(currentSearch)

  for (const [key, value] of Object.entries(params)) {
    search.set(key, value)
  }

  redirect(`${pathname}?${search.toString()}`)
}

function revalidatePageSurfaces(pageId: string, slug?: string) {
  revalidatePath("/")
  revalidatePath("/performances")
  revalidatePath("/performances/updates")
  revalidatePath("/videos")
  revalidatePath("/photos")
  revalidatePath("/history")

  if (slug && slug !== "home") {
    revalidatePath(`/${slug}`)
  }

  updateTag(PUBLIC_CONTENT_CACHE_TAG)
  revalidatePath("/ponix")
  revalidatePath("/ponix/pages")
  revalidatePath(`/ponix/pages/${pageId}`)
  revalidatePath(`/ponix/pages/${pageId}/edit`)
}

function parseBoolean(formData: FormData, field: CmsEditablePageField): ParsedValue {
  const values = formData.getAll(cmsPageFieldInputName(field))

  return {
    ok: true,
    empty: false,
    value: values.includes("true"),
  }
}

function parseJson(formData: FormData, field: CmsEditablePageField): ParsedValue {
  const value = stringField(formData, cmsPageFieldInputName(field))

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

function parseTextLike(
  formData: FormData,
  field: CmsEditablePageField,
): ParsedValue {
  const value = stringField(formData, cmsPageFieldInputName(field))

  if (!value) {
    if (field.required) {
      return { ok: false, error: `${field.label} is required.` }
    }

    return { ok: true, empty: true, value: null }
  }

  return {
    ok: true,
    empty: false,
    value,
  }
}

function parseFieldValue(
  formData: FormData,
  field: CmsEditablePageField,
): ParsedValue {
  if (field.type === "boolean") {
    return parseBoolean(formData, field)
  }

  if (field.type === "json") {
    return parseJson(formData, field)
  }

  return parseTextLike(formData, field)
}

function updatePropsValue(
  props: CmsJsonObject,
  field: CmsEditablePageField,
  parsed: ParsedValue & { ok: true },
) {
  if (parsed.empty) {
    delete props[field.key]
    return
  }

  props[field.key] = parsed.value
}

export async function updateCmsPageAction(formData: FormData) {
  const pageId = stringField(formData, "page_id")

  if (!pageId) {
    redirectWithParams("/ponix/pages", {
      error: "Missing page id.",
    })
  }

  const editPath = `/ponix/pages/${pageId}/edit`
  await requireCmsAdmin(editPath)

  const schema = getPageEditorSchema()
  if (!schema) {
    redirectWithParams(editPath, {
      error: "The page editor schema is not registered.",
    })
  }

  const supabase = await createClient()
  const { data: page, error: loadError } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .maybeSingle()

  if (loadError || !page) {
    redirectWithParams(editPath, {
      error: "Page not found.",
    })
  }

  const fields = getEditablePageFields()
  const props = jsonObject(page.props)
  const update: PageUpdate = {}

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

    if (field.key === "title") {
      update.title = String(parsed.value)
    }

    if (field.key === "subtitle") {
      update.subtitle = parsed.value === null ? null : String(parsed.value)
    }

    if (field.key === "description") {
      update.description = parsed.value === null ? null : String(parsed.value)
    }
  }

  update.props = props

  const { error: updateError } = await supabase
    .from("pages")
    .update(update)
    .eq("id", pageId)

  if (updateError) {
    redirectWithParams(editPath, {
      error: "Page save failed.",
    })
  }

  revalidatePageSurfaces(pageId, page.slug)

  redirect(`/ponix/pages/${pageId}`)
}
