import {
  editablePageFieldsForSchema,
  isPageEditorSchema,
} from "@/lib/cms/page-editor"
import { loadCmsSchema } from "@/lib/cms/schema-registry.server"

export async function loadPageEditorSchema() {
  const schema = await loadCmsSchema("page/default/v1")
  return schema && isPageEditorSchema(schema) ? schema : null
}

export async function loadEditablePageFields() {
  const schema = await loadPageEditorSchema()
  return schema ? editablePageFieldsForSchema(schema) : []
}

