import type {
  CmsFieldDefinition,
  CmsSchemaDefinition,
} from "@/lib/cms/schema-registry"
import { getCmsSchema } from "@/lib/cms/schema-registry"
import type { Database, Json } from "@/lib/supabase/types"

type SectionRow = Database["public"]["Tables"]["sections"]["Row"]

const editableSectionColumns = new Set(["eyebrow", "title", "subtitle", "published"])

export type CmsEditableSectionField = CmsFieldDefinition & {
  source: "column" | "props"
}

export type CmsJsonObject = Record<string, Json>

export function cmsFieldInputName(field: CmsFieldDefinition) {
  return `cms:${field.source}:${field.key}`
}

export function getSectionEditorSchema(
  schemaKey: string,
): CmsSchemaDefinition | null {
  const schema = getCmsSchema(schemaKey)

  if (!schema || schema.kind !== "section" || schema.table !== "sections") {
    return null
  }

  return schema
}

export function getEditableSectionFields(schemaKey: string) {
  const schema = getSectionEditorSchema(schemaKey)

  if (!schema) {
    return []
  }

  return schema.fields.filter((field): field is CmsEditableSectionField => {
    if (field.readOnly) {
      return false
    }

    if (field.source === "props") {
      return true
    }

    return field.source === "column" && editableSectionColumns.has(field.key)
  })
}

export function jsonObject(value: Json): CmsJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return { ...(value as CmsJsonObject) }
}

export function getSectionFieldValue(
  section: SectionRow,
  field: CmsEditableSectionField,
) {
  if (field.source === "props") {
    return jsonObject(section.props)[field.key]
  }

  const row = section as unknown as Record<string, unknown>
  return row[field.key]
}
