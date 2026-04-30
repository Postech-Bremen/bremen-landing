import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

import { getCmsSchema } from "./schema-registry"

const ENTITY_LIST_LIMIT = 200

type PageRow = Database["public"]["Tables"]["pages"]["Row"]
type SectionRow = Database["public"]["Tables"]["sections"]["Row"]
type EntityRow = Database["public"]["Tables"]["entities"]["Row"]

type SchemaSummary = {
  schemaKey: string
  schemaLabel: string
  schemaRegistered: boolean
}

export type CmsPageSummary = SchemaSummary & {
  id: string
  slug: string
  title: string
  subtitle: string | null
  published: boolean
  updatedAt: string
}

export type CmsSectionSummary = SchemaSummary & {
  id: string
  key: string
  sectionType: string
  title: string | null
  subtitle: string | null
  published: boolean
  updatedAt: string
}

export type CmsEntitySummary = SchemaSummary & {
  id: string
  entityType: string
  slug: string | null
  title: string
  subtitle: string | null
  thumbnailUrl: string | null
  published: boolean
  sortAt: string
  updatedAt: string
}

export type CmsEntityList = {
  entities: CmsEntitySummary[]
  count: number | null
  limit: number
}

export type CmsContentDetail =
  | {
      kind: "page"
      table: "pages"
      title: string
      subtitle: string | null
      published: boolean
      updatedAt: string
      row: PageRow
    } & SchemaSummary
  | {
      kind: "section"
      table: "sections"
      title: string
      subtitle: string | null
      published: boolean
      updatedAt: string
      row: SectionRow
    } & SchemaSummary
  | {
      kind: "entity"
      table: "entities"
      title: string
      subtitle: string | null
      published: boolean
      updatedAt: string
      row: EntityRow
    } & SchemaSummary

function schemaSummary(schemaKey: string): SchemaSummary {
  const schema = getCmsSchema(schemaKey)

  return {
    schemaKey,
    schemaLabel: schema?.label ?? "Unregistered schema",
    schemaRegistered: Boolean(schema),
  }
}

export async function loadCmsPages(): Promise<CmsPageSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, subtitle, published, updated_at")
    .order("slug", { ascending: true })

  if (error) {
    throw new Error(`Failed to load CMS pages: ${error.message}`)
  }

  return (data ?? []).map((page) => ({
    ...schemaSummary("page/default/v1"),
    id: page.id,
    slug: page.slug,
    title: page.title,
    subtitle: page.subtitle,
    published: page.published,
    updatedAt: page.updated_at,
  }))
}

export async function loadCmsPageDetail(
  id: string,
): Promise<CmsContentDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load CMS page detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...schemaSummary("page/default/v1"),
    kind: "page",
    table: "pages",
    title: data.title,
    subtitle: data.subtitle,
    published: data.published,
    updatedAt: data.updated_at,
    row: data,
  }
}

export async function loadCmsSections(): Promise<CmsSectionSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sections")
    .select("id, key, section_type, schema_key, title, subtitle, published, updated_at")
    .order("key", { ascending: true })

  if (error) {
    throw new Error(`Failed to load CMS sections: ${error.message}`)
  }

  return (data ?? []).map((section) => ({
    ...schemaSummary(section.schema_key),
    id: section.id,
    key: section.key,
    sectionType: section.section_type,
    title: section.title,
    subtitle: section.subtitle,
    published: section.published,
    updatedAt: section.updated_at,
  }))
}

export async function loadCmsSectionDetail(
  id: string,
): Promise<CmsContentDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load CMS section detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...schemaSummary(data.schema_key),
    kind: "section",
    table: "sections",
    title: data.title ?? data.key,
    subtitle: data.subtitle,
    published: data.published,
    updatedAt: data.updated_at,
    row: data,
  }
}

export async function loadCmsEntities(): Promise<CmsEntityList> {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from("entities")
    .select(
      "id, entity_type, schema_key, slug, title, subtitle, thumbnail_url, published, sort_at, updated_at",
      { count: "exact" },
    )
    .order("sort_at", { ascending: false })
    .range(0, ENTITY_LIST_LIMIT - 1)

  if (error) {
    throw new Error(`Failed to load CMS entities: ${error.message}`)
  }

  return {
    count,
    limit: ENTITY_LIST_LIMIT,
    entities: (data ?? []).map((entity) => ({
      ...schemaSummary(entity.schema_key),
      id: entity.id,
      entityType: entity.entity_type,
      slug: entity.slug,
      title: entity.title,
      subtitle: entity.subtitle,
      thumbnailUrl: entity.thumbnail_url,
      published: entity.published,
      sortAt: entity.sort_at,
      updatedAt: entity.updated_at,
    })),
  }
}

export async function loadCmsEntityDetail(
  id: string,
): Promise<CmsContentDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load CMS entity detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...schemaSummary(data.schema_key),
    kind: "entity",
    table: "entities",
    title: data.title,
    subtitle: data.subtitle,
    published: data.published,
    updatedAt: data.updated_at,
    row: data,
  }
}
