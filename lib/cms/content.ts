import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

import { getCmsSchema } from "./schema-registry"

const ENTITY_LIST_LIMIT = 200
const RELATION_LIST_LIMIT = 300

type PageRow = Database["public"]["Tables"]["pages"]["Row"]
type SectionRow = Database["public"]["Tables"]["sections"]["Row"]
type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const PAGE_SECTION_RELATION_SELECT = `
  id,
  page_id,
  section_id,
  sort_order,
  props,
  updated_at,
  page:pages!page_sections_page_id_fkey(id, slug, title, published),
  section:sections!page_sections_section_id_fkey(id, key, title, section_type, schema_key, published)
`

const SECTION_ENTITY_RELATION_SELECT = `
  id,
  section_id,
  entity_id,
  relation_type,
  slot,
  sort_order,
  props,
  updated_at,
  section:sections!section_entities_section_id_fkey(id, key, title, section_type, schema_key, published),
  entity:entities!section_entities_entity_id_fkey(id, entity_type, slug, title, subtitle, summary, thumbnail_url, schema_key, data, published, sort_at)
`

const ENTITY_RELATION_SELECT = `
  id,
  from_entity_id,
  to_entity_id,
  relation_type,
  slot,
  sort_order,
  props,
  updated_at,
  fromEntity:entities!entity_relations_from_entity_id_fkey(id, entity_type, slug, title, subtitle, summary, thumbnail_url, schema_key, data, published, sort_at),
  toEntity:entities!entity_relations_to_entity_id_fkey(id, entity_type, slug, title, subtitle, summary, thumbnail_url, schema_key, data, published, sort_at)
`

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

export type CmsRelationList<T> = {
  relations: T[]
  count: number | null
  limit: number
}

export type CmsLinkedPage = {
  id: string
  slug: string
  title: string
  published: boolean
}

export type CmsLinkedSection = SchemaSummary & {
  id: string
  key: string
  title: string | null
  sectionType: string
  published: boolean
}

export type CmsLinkedEntity = SchemaSummary & {
  id: string
  entityType: string
  slug: string | null
  title: string
  subtitle: string | null
  summary: string | null
  thumbnailUrl: string | null
  data: Json
  published: boolean
  sortAt: string
}

export type CmsPageSectionRelation = {
  id: string
  pageId: string
  sectionId: string
  sortOrder: number
  props: Json
  updatedAt: string
  page: CmsLinkedPage | null
  section: CmsLinkedSection | null
}

export type CmsSectionEntityRelation = {
  id: string
  sectionId: string
  entityId: string
  relationType: string
  slot: string
  sortOrder: number
  props: Json
  updatedAt: string
  section: CmsLinkedSection | null
  entity: CmsLinkedEntity | null
}

export type CmsEntityRelation = {
  id: string
  fromEntityId: string
  toEntityId: string
  relationType: string
  slot: string
  sortOrder: number
  props: Json
  updatedAt: string
  fromEntity: CmsLinkedEntity | null
  toEntity: CmsLinkedEntity | null
}

export type CmsRelationGraph = {
  pageSections: CmsRelationList<CmsPageSectionRelation>
  sectionEntities: CmsRelationList<CmsSectionEntityRelation>
  entityRelations: CmsRelationList<CmsEntityRelation>
}

export type CmsPageRelationContext = {
  pageSections: CmsPageSectionRelation[]
}

export type CmsSectionRelationContext = {
  pageSections: CmsPageSectionRelation[]
  sectionEntities: CmsSectionEntityRelation[]
  entityRelations: CmsEntityRelation[]
}

export type CmsEntityRelationContext = {
  sectionEntities: CmsSectionEntityRelation[]
  outgoingEntityRelations: CmsEntityRelation[]
  incomingEntityRelations: CmsEntityRelation[]
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

function relationList<T>(
  relations: T[],
  count: number | null,
  limit = RELATION_LIST_LIMIT,
): CmsRelationList<T> {
  return {
    relations,
    count,
    limit,
  }
}

function linkedPage(page: RawPageLink | null): CmsLinkedPage | null {
  if (!page) {
    return null
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    published: page.published,
  }
}

function linkedSection(
  section: RawSectionLink | null,
): CmsLinkedSection | null {
  if (!section) {
    return null
  }

  return {
    ...schemaSummary(section.schema_key),
    id: section.id,
    key: section.key,
    title: section.title,
    sectionType: section.section_type,
    published: section.published,
  }
}

function linkedEntity(entity: RawEntityLink | null): CmsLinkedEntity | null {
  if (!entity) {
    return null
  }

  return {
    ...schemaSummary(entity.schema_key),
    id: entity.id,
    entityType: entity.entity_type,
    slug: entity.slug,
    title: entity.title,
    subtitle: entity.subtitle,
    summary: entity.summary,
    thumbnailUrl: entity.thumbnail_url,
    data: entity.data,
    published: entity.published,
    sortAt: entity.sort_at,
  }
}

type RawPageLink = Pick<PageRow, "id" | "slug" | "title" | "published">
type RawSectionLink = Pick<
  SectionRow,
  "id" | "key" | "title" | "section_type" | "schema_key" | "published"
>
type RawEntityLink = Pick<
  EntityRow,
  | "id"
  | "entity_type"
  | "slug"
  | "title"
  | "subtitle"
  | "summary"
  | "thumbnail_url"
  | "schema_key"
  | "data"
  | "published"
  | "sort_at"
>

type RawPageSectionRelation = {
  id: string
  page_id: string
  section_id: string
  sort_order: number
  props: Json
  updated_at: string
  page: RawPageLink | null
  section: RawSectionLink | null
}

type RawSectionEntityRelation = {
  id: string
  section_id: string
  entity_id: string
  relation_type: string
  slot: string
  sort_order: number
  props: Json
  updated_at: string
  section: RawSectionLink | null
  entity: RawEntityLink | null
}

type RawEntityRelation = {
  id: string
  from_entity_id: string
  to_entity_id: string
  relation_type: string
  slot: string
  sort_order: number
  props: Json
  updated_at: string
  fromEntity: RawEntityLink | null
  toEntity: RawEntityLink | null
}

function mapPageSectionRelation(
  relation: RawPageSectionRelation,
): CmsPageSectionRelation {
  return {
    id: relation.id,
    pageId: relation.page_id,
    sectionId: relation.section_id,
    sortOrder: relation.sort_order,
    props: relation.props,
    updatedAt: relation.updated_at,
    page: linkedPage(relation.page),
    section: linkedSection(relation.section),
  }
}

function mapSectionEntityRelation(
  relation: RawSectionEntityRelation,
): CmsSectionEntityRelation {
  return {
    id: relation.id,
    sectionId: relation.section_id,
    entityId: relation.entity_id,
    relationType: relation.relation_type,
    slot: relation.slot,
    sortOrder: relation.sort_order,
    props: relation.props,
    updatedAt: relation.updated_at,
    section: linkedSection(relation.section),
    entity: linkedEntity(relation.entity),
  }
}

function mapEntityRelation(relation: RawEntityRelation): CmsEntityRelation {
  return {
    id: relation.id,
    fromEntityId: relation.from_entity_id,
    toEntityId: relation.to_entity_id,
    relationType: relation.relation_type,
    slot: relation.slot,
    sortOrder: relation.sort_order,
    props: relation.props,
    updatedAt: relation.updated_at,
    fromEntity: linkedEntity(relation.fromEntity),
    toEntity: linkedEntity(relation.toEntity),
  }
}

function byPageSectionOrder(
  left: CmsPageSectionRelation,
  right: CmsPageSectionRelation,
) {
  return (
    (left.page?.slug ?? left.pageId).localeCompare(right.page?.slug ?? right.pageId) ||
    left.sortOrder - right.sortOrder ||
    (left.section?.key ?? left.sectionId).localeCompare(
      right.section?.key ?? right.sectionId,
    )
  )
}

function bySectionEntityOrder(
  left: CmsSectionEntityRelation,
  right: CmsSectionEntityRelation,
) {
  return (
    (left.section?.key ?? left.sectionId).localeCompare(
      right.section?.key ?? right.sectionId,
    ) ||
    left.slot.localeCompare(right.slot) ||
    left.sortOrder - right.sortOrder ||
    (left.entity?.title ?? left.entityId).localeCompare(
      right.entity?.title ?? right.entityId,
    )
  )
}

function byEntityRelationOrder(left: CmsEntityRelation, right: CmsEntityRelation) {
  return (
    (left.fromEntity?.title ?? left.fromEntityId).localeCompare(
      right.fromEntity?.title ?? right.fromEntityId,
    ) ||
    left.slot.localeCompare(right.slot) ||
    left.sortOrder - right.sortOrder ||
    (left.toEntity?.title ?? left.toEntityId).localeCompare(
      right.toEntity?.title ?? right.toEntityId,
    )
  )
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

async function loadPageSectionRelations({
  supabase,
  pageId,
  sectionId,
  limit = RELATION_LIST_LIMIT,
}: {
  supabase: SupabaseClient
  pageId?: string
  sectionId?: string
  limit?: number
}): Promise<CmsRelationList<CmsPageSectionRelation>> {
  let query = supabase
    .from("page_sections")
    .select(PAGE_SECTION_RELATION_SELECT, { count: "exact" })

  if (pageId) {
    query = query.eq("page_id", pageId)
  }

  if (sectionId) {
    query = query.eq("section_id", sectionId)
  }

  const { data, error, count } = await query
    .order("page_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load page-section relations: ${error.message}`)
  }

  const relations = ((data ?? []) as unknown as RawPageSectionRelation[])
    .map(mapPageSectionRelation)
    .sort(byPageSectionOrder)

  return relationList(relations, count, limit)
}

async function loadSectionEntityRelations({
  supabase,
  sectionId,
  entityId,
  limit = RELATION_LIST_LIMIT,
}: {
  supabase: SupabaseClient
  sectionId?: string
  entityId?: string
  limit?: number
}): Promise<CmsRelationList<CmsSectionEntityRelation>> {
  let query = supabase
    .from("section_entities")
    .select(SECTION_ENTITY_RELATION_SELECT, { count: "exact" })

  if (sectionId) {
    query = query.eq("section_id", sectionId)
  }

  if (entityId) {
    query = query.eq("entity_id", entityId)
  }

  const { data, error, count } = await query
    .order("section_id", { ascending: true })
    .order("slot", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load section-entity relations: ${error.message}`)
  }

  const relations = ((data ?? []) as unknown as RawSectionEntityRelation[])
    .map(mapSectionEntityRelation)
    .sort(bySectionEntityOrder)

  return relationList(relations, count, limit)
}

async function loadEntityRelations({
  supabase,
  fromEntityId,
  toEntityId,
  limit = RELATION_LIST_LIMIT,
}: {
  supabase: SupabaseClient
  fromEntityId?: string
  toEntityId?: string
  limit?: number
}): Promise<CmsRelationList<CmsEntityRelation>> {
  let query = supabase
    .from("entity_relations")
    .select(ENTITY_RELATION_SELECT, { count: "exact" })

  if (fromEntityId) {
    query = query.eq("from_entity_id", fromEntityId)
  }

  if (toEntityId) {
    query = query.eq("to_entity_id", toEntityId)
  }

  const { data, error, count } = await query
    .order("from_entity_id", { ascending: true })
    .order("slot", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load entity relations: ${error.message}`)
  }

  const relations = ((data ?? []) as unknown as RawEntityRelation[])
    .map(mapEntityRelation)
    .sort(byEntityRelationOrder)

  return relationList(relations, count, limit)
}

async function loadEntityRelationsForFromEntities({
  supabase,
  fromEntityIds,
  limit = RELATION_LIST_LIMIT,
}: {
  supabase: SupabaseClient
  fromEntityIds: string[]
  limit?: number
}): Promise<CmsRelationList<CmsEntityRelation>> {
  if (!fromEntityIds.length) {
    return relationList([], 0, limit)
  }

  const { data, error, count } = await supabase
    .from("entity_relations")
    .select(ENTITY_RELATION_SELECT, { count: "exact" })
    .in("from_entity_id", fromEntityIds)
    .order("from_entity_id", { ascending: true })
    .order("slot", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load entity relations: ${error.message}`)
  }

  const relations = ((data ?? []) as unknown as RawEntityRelation[])
    .map(mapEntityRelation)
    .sort(byEntityRelationOrder)

  return relationList(relations, count, limit)
}

export async function loadCmsRelationGraph(): Promise<CmsRelationGraph> {
  const supabase = await createClient()
  const [pageSections, sectionEntities, entityRelations] = await Promise.all([
    loadPageSectionRelations({ supabase }),
    loadSectionEntityRelations({ supabase }),
    loadEntityRelations({ supabase }),
  ])

  return {
    pageSections,
    sectionEntities,
    entityRelations,
  }
}

export async function loadCmsPageRelations(
  pageId: string,
): Promise<CmsPageRelationContext> {
  const supabase = await createClient()
  const pageSections = await loadPageSectionRelations({ supabase, pageId })

  return {
    pageSections: pageSections.relations,
  }
}

export async function loadCmsSectionRelations(
  sectionId: string,
): Promise<CmsSectionRelationContext> {
  const supabase = await createClient()
  const [pageSections, sectionEntities] = await Promise.all([
    loadPageSectionRelations({ supabase, sectionId }),
    loadSectionEntityRelations({ supabase, sectionId }),
  ])
  const entityRelations = await loadEntityRelationsForFromEntities({
    supabase,
    fromEntityIds: sectionEntities.relations.map((relation) => relation.entityId),
  })

  return {
    pageSections: pageSections.relations,
    sectionEntities: sectionEntities.relations,
    entityRelations: entityRelations.relations,
  }
}

export async function loadCmsEntityRelations(
  entityId: string,
): Promise<CmsEntityRelationContext> {
  const supabase = await createClient()
  const [sectionEntities, outgoingEntityRelations, incomingEntityRelations] =
    await Promise.all([
      loadSectionEntityRelations({ supabase, entityId }),
      loadEntityRelations({ supabase, fromEntityId: entityId }),
      loadEntityRelations({ supabase, toEntityId: entityId }),
    ])

  return {
    sectionEntities: sectionEntities.relations,
    outgoingEntityRelations: outgoingEntityRelations.relations,
    incomingEntityRelations: incomingEntityRelations.relations,
  }
}
