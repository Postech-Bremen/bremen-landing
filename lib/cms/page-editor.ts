import type {
  CmsFieldDefinition,
  CmsSchemaDefinition,
} from "@/lib/cms/schema-registry"
import { getCmsSchema } from "@/lib/cms/schema-registry"
import type { Database, Json } from "@/lib/supabase/types"

type PageRow = Database["public"]["Tables"]["pages"]["Row"]

const editablePageColumns = new Set([
  "title",
  "subtitle",
  "description",
  "published",
])

export type CmsEditablePageField = CmsFieldDefinition & {
  source: "column" | "props"
}

export type CmsJsonObject = Record<string, Json>

export function cmsPageFieldInputName(field: CmsFieldDefinition) {
  return `cms:${field.source}:${field.key}`
}

export function getPageEditorSchema(): CmsSchemaDefinition | null {
  const schema = getCmsSchema("page/default/v1")

  if (!schema || schema.kind !== "page" || schema.table !== "pages") {
    return null
  }

  return schema
}

export function getEditablePageFields() {
  const schema = getPageEditorSchema()

  if (!schema) {
    return []
  }

  return schema.fields.filter((field): field is CmsEditablePageField => {
    if (field.readOnly) {
      return false
    }

    if (field.source === "props") {
      return true
    }

    return field.source === "column" && editablePageColumns.has(field.key)
  })
}

export function jsonObject(value: Json): CmsJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return { ...(value as CmsJsonObject) }
}

export function getPageFieldValue(
  page: PageRow,
  field: CmsEditablePageField,
) {
  if (field.source === "props") {
    return jsonObject(page.props)[field.key]
  }

  const row = page as unknown as Record<string, unknown>
  return row[field.key]
}
