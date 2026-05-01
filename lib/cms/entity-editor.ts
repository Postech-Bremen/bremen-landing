import type {
  CmsFieldDefinition,
  CmsSchemaDefinition,
} from "@/lib/cms/schema-registry"
import { getCmsSchema, getCmsSchemasByKind } from "@/lib/cms/schema-registry"
import type { Database, Json } from "@/lib/supabase/types"

type EntityRow = Database["public"]["Tables"]["entities"]["Row"]

const editableEntityColumns = new Set([
  "slug",
  "title",
  "subtitle",
  "summary",
  "thumbnail_url",
  "sort_at",
  "published",
])

export type CmsEditableEntityField = CmsFieldDefinition & {
  source: "column" | "data"
}

export type CmsJsonObject = Record<string, Json>

export function cmsEntityFieldInputName(field: CmsFieldDefinition) {
  return `cms:${field.source}:${field.key}`
}

export function getEntityEditorSchema(
  schemaKey: string,
): CmsSchemaDefinition | null {
  const schema = getCmsSchema(schemaKey)

  if (!schema || schema.kind !== "entity" || schema.table !== "entities") {
    return null
  }

  return schema
}

export function entityTypeFromSchemaKey(schemaKey: string) {
  return schemaKey.split("/")[0] || "entity"
}

function hasRequiredReadOnlyField(schema: CmsSchemaDefinition) {
  return schema.fields.some((field) => {
    if (!field.required || !field.readOnly) {
      return false
    }

    return !(field.source === "column" && field.key === "entity_type")
  })
}

export function getEntityCreationSchema(
  schemaKey: string,
): CmsSchemaDefinition | null {
  const schema = getEntityEditorSchema(schemaKey)

  if (!schema || hasRequiredReadOnlyField(schema)) {
    return null
  }

  return schema
}

export function getEntityCreationSchemas() {
  return getCmsSchemasByKind("entity")
    .filter((schema) => getEntityCreationSchema(schema.schemaKey))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function getEditableEntityFields(schemaKey: string) {
  const schema = getEntityEditorSchema(schemaKey)

  if (!schema) {
    return []
  }

  return schema.fields.filter((field): field is CmsEditableEntityField => {
    if (field.readOnly) {
      return false
    }

    if (field.source === "data") {
      return true
    }

    return field.source === "column" && editableEntityColumns.has(field.key)
  })
}

export function jsonObject(value: Json): CmsJsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return { ...(value as CmsJsonObject) }
}

export function getEntityFieldValue(
  entity: EntityRow,
  field: CmsEditableEntityField,
) {
  if (field.source === "data") {
    return jsonObject(entity.data)[field.key]
  }

  const row = entity as unknown as Record<string, unknown>
  return row[field.key]
}
