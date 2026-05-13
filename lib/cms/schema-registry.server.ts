import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

import {
  type CmsFieldDefinition,
  type CmsFieldOption,
  type CmsFieldSource,
  type CmsFieldType,
  type CmsSchemaDefinition,
  type CmsSchemaKind,
} from "./schema-registry"

type EntitySchemaRow = Pick<
  Database["public"]["Tables"]["entity_schemas"]["Row"],
  | "id"
  | "schema_key"
  | "kind"
  | "table_name"
  | "label"
  | "description"
  | "fields"
  | "relation_slots"
  | "semantic_kind"
  | "semantic_group"
>

const fieldTypes = new Set<CmsFieldType>([
  "text",
  "textarea",
  "url",
  "image",
  "number",
  "boolean",
  "date",
  "datetime",
  "select",
  "string-list",
  "json",
])

const fieldSources = new Set<CmsFieldSource>([
  "column",
  "props",
  "data",
  "relation_props",
])

const schemaKinds = new Set<CmsSchemaKind>([
  "page",
  "section",
  "entity",
  "relation",
])

const schemaTables = new Set<CmsSchemaDefinition["table"]>([
  "entities",
  "entity_relations",
])

function isRecord(value: Json | unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : undefined
}

function normalizeOptions(value: unknown): CmsFieldOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const options = value
    .map((option): CmsFieldOption | null => {
      if (!isRecord(option)) {
        return null
      }

      const label = stringValue(option.label)
      const optionValue = stringValue(option.value)

      if (!label || !optionValue) {
        return null
      }

      return { label, value: optionValue }
    })
    .filter((option): option is CmsFieldOption => Boolean(option))

  return options.length ? options : undefined
}

function normalizeField(value: unknown): CmsFieldDefinition | null {
  if (!isRecord(value)) {
    return null
  }

  const key = stringValue(value.key)
  const label = stringValue(value.label)
  const type = stringValue(value.type)
  const source = stringValue(value.source)

  if (
    !key ||
    !label ||
    !type ||
    !source ||
    !fieldTypes.has(type as CmsFieldType) ||
    !fieldSources.has(source as CmsFieldSource)
  ) {
    return null
  }

  const description = stringValue(value.description)
  const required = booleanValue(value.required)
  const readOnly = booleanValue(value.readOnly ?? value.read_only)
  const options = normalizeOptions(value.options)

  return {
    key,
    label,
    type: type as CmsFieldType,
    source: source as CmsFieldSource,
    ...(description ? { description } : {}),
    ...(required === undefined ? {} : { required }),
    ...(readOnly === undefined ? {} : { readOnly }),
    ...(options ? { options } : {}),
  }
}

function normalizeFields(value: Json): CmsFieldDefinition[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const fields = value
    .map((field) => normalizeField(field))
    .filter((field): field is CmsFieldDefinition => Boolean(field))

  return fields.length === value.length && fields.length > 0 ? fields : null
}

function normalizeSchemaTable(
  kind: CmsSchemaKind,
  tableName: string | null,
): CmsSchemaDefinition["table"] | null {
  if (kind === "relation") {
    return tableName === "entity_relations" ? "entity_relations" : null
  }

  if (kind === "entity" && tableName === "entities") {
    return "entities"
  }

  if (kind === "page" && (tableName === "entities" || tableName === "pages")) {
    return "entities"
  }

  if (
    kind === "section" &&
    (tableName === "entities" || tableName === "sections")
  ) {
    return "entities"
  }

  return null
}

function normalizeSchemaRow(row: EntitySchemaRow): CmsSchemaDefinition | null {
  const kind = stringValue(row.kind)
  const fields = normalizeFields(row.fields)

  if (
    !schemaKinds.has(kind as CmsSchemaKind) ||
    !fields
  ) {
    return null
  }

  const table = normalizeSchemaTable(kind as CmsSchemaKind, stringValue(row.table_name))
  if (!table || !schemaTables.has(table)) {
    return null
  }

  return {
    schemaId: row.id,
    schemaKey: row.schema_key,
    kind: kind as CmsSchemaKind,
    table,
    semanticKind: stringValue(row.semantic_kind) ?? "generic",
    semanticGroup: stringValue(row.semantic_group) ?? undefined,
    label: row.label,
    description: row.description,
    fields,
    relationSlots: row.relation_slots,
  }
}

export const loadCmsSchemaRegistry = cache(
  async (): Promise<CmsSchemaDefinition[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("entity_schemas")
      .select(
        "id, schema_key, kind, table_name, semantic_kind, semantic_group, label, description, fields, relation_slots",
      )
      .eq("active", true)
      .order("schema_key", { ascending: true })

    if (error) {
      throw new Error(`Failed to load CMS schema registry: ${error.message}`)
    }

    return (data ?? [])
      .map((row) => normalizeSchemaRow(row))
      .filter((schema): schema is CmsSchemaDefinition => Boolean(schema))
  },
)

export const loadCmsSchemaRegistryMap = cache(
  async (): Promise<Map<string, CmsSchemaDefinition>> => {
    const registry = await loadCmsSchemaRegistry()
    return new Map(registry.map((schema) => [schema.schemaKey, schema]))
  },
)

export async function loadCmsSchema(schemaKey: string) {
  const registry = await loadCmsSchemaRegistryMap()
  return registry.get(schemaKey) ?? null
}

export async function loadCmsSchemaById(schemaId: string) {
  const registry = await loadCmsSchemaRegistry()
  return registry.find((schema) => schema.schemaId === schemaId) ?? null
}

export async function loadCmsSchemasByKind(kind: CmsSchemaKind) {
  const registry = await loadCmsSchemaRegistry()
  return registry.filter((schema) => schema.kind === kind)
}
