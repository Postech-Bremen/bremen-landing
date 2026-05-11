import {
  canCreateSectionSchema,
  editableSectionFieldsForSchema,
  isSectionEditorSchema,
} from "@/lib/cms/section-editor"
import {
  loadCmsSchema,
  loadCmsSchemaById,
  loadCmsSchemasByKind,
} from "@/lib/cms/schema-registry.server"

export async function loadSectionEditorSchema(schemaKey: string) {
  const schema = await loadCmsSchema(schemaKey)
  return schema && isSectionEditorSchema(schema) ? schema : null
}

export async function loadSectionEditorSchemaById(schemaId: string) {
  const schema = await loadCmsSchemaById(schemaId)
  return schema && isSectionEditorSchema(schema) ? schema : null
}

export async function loadSectionCreationSchema(schemaKey: string) {
  const schema = await loadSectionEditorSchema(schemaKey)
  return schema && canCreateSectionSchema(schema) ? schema : null
}

export async function loadSectionCreationSchemaById(schemaId: string) {
  const schema = await loadSectionEditorSchemaById(schemaId)
  return schema && canCreateSectionSchema(schema) ? schema : null
}

export async function loadSectionCreationSchemas() {
  const schemas = await loadCmsSchemasByKind("section")
  return schemas
    .filter(canCreateSectionSchema)
    .sort((left, right) => left.label.localeCompare(right.label))
}

export async function loadEditableSectionFields(schemaKey: string) {
  const schema = await loadSectionEditorSchema(schemaKey)
  return schema ? editableSectionFieldsForSchema(schema) : []
}
