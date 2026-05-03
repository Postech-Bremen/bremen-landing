import type {
  CmsFieldDefinition,
  CmsSchemaDefinition,
} from "@/lib/cms/schema-registry"
import { getCmsSchema, getCmsSchemasByKind } from "@/lib/cms/schema-registry"
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

const sectionTypeBySchemaKey: Record<string, string> = {
  "section/history-timeline/v1": "entity_timeline",
  "section/home-activities/v1": "static_activity_grid",
  "section/home-hero/v1": "entity_feature",
  "section/home-join/v1": "static_cta",
  "section/home-stage-highlights/v1": "entity_video_grid",
  "section/home-stats/v1": "entity_stat_grid",
  "section/home-upcoming/v1": "computed_event_list",
  "section/performance-archive/v1": "entity_carousel",
  "section/performance-current-season/v1": "entity_feature_grid",
  "section/performance-season-index/v1": "computed_year_index",
  "section/performance-stage-moments/v1": "computed_photo_strip",
  "section/performance-updates/v1": "entity_post_grid",
  "section/photo-gallery/v1": "entity_masonry",
  "section/site-footer/v1": "site_footer",
  "section/site-navigation/v1": "site_navigation",
  "section/video-event-playlists/v1": "entity_grouped_grid",
  "section/video-featured/v1": "entity_feature",
  "section/video-library/v1": "entity_grid",
  "section/video-popular/v1": "entity_list",
}

export function sectionTypeFromSchemaKey(schemaKey: string) {
  return sectionTypeBySchemaKey[schemaKey] ?? null
}

function hasRequiredReadOnlyField(schema: CmsSchemaDefinition) {
  return schema.fields.some((field) => {
    if (!field.required || !field.readOnly) {
      return false
    }

    return !(
      field.source === "column" &&
      (field.key === "key" || field.key === "section_type")
    )
  })
}

export function getSectionCreationSchema(
  schemaKey: string,
): CmsSchemaDefinition | null {
  const schema = getSectionEditorSchema(schemaKey)

  if (!schema || !sectionTypeFromSchemaKey(schema.schemaKey)) {
    return null
  }

  if (hasRequiredReadOnlyField(schema)) {
    return null
  }

  return schema
}

export function getSectionCreationSchemas() {
  return getCmsSchemasByKind("section")
    .filter((schema) => getSectionCreationSchema(schema.schemaKey))
    .sort((left, right) => left.label.localeCompare(right.label))
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
