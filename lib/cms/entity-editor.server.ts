import {
  canCreateEntitySchema,
  editableEntityFieldsForSchema,
  isEntityEditorSchema,
} from "@/lib/cms/entity-editor"
import {
  loadCmsSchema,
  loadCmsSchemaById,
  loadCmsSchemasByKind,
} from "@/lib/cms/schema-registry.server"

export async function loadEntityEditorSchema(schemaKey: string) {
  const schema = await loadCmsSchema(schemaKey)
  return schema && isEntityEditorSchema(schema) ? schema : null
}

export async function loadEntityEditorSchemaById(schemaId: string) {
  const schema = await loadCmsSchemaById(schemaId)
  return schema && isEntityEditorSchema(schema) ? schema : null
}

export async function loadEntityCreationSchema(schemaKey: string) {
  const schema = await loadEntityEditorSchema(schemaKey)
  return schema && canCreateEntitySchema(schema) ? schema : null
}

export async function loadEntityCreationSchemaById(schemaId: string) {
  const schema = await loadEntityEditorSchemaById(schemaId)
  return schema && canCreateEntitySchema(schema) ? schema : null
}

export async function loadEntityCreationSchemas() {
  const schemas = await loadCmsSchemasByKind("entity")
  return schemas
    .filter(canCreateEntitySchema)
    .sort((left, right) => left.label.localeCompare(right.label))
}

export async function loadEditableEntityFields(schemaKey: string) {
  const schema = await loadEntityEditorSchema(schemaKey)
  return schema ? editableEntityFieldsForSchema(schema) : []
}
