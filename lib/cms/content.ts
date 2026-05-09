import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

import type { CmsSchemaDefinition } from "./schema-registry"
import {
  countLegacyPageSectionMirrorRows,
  countLegacySectionEntityMirrorRows,
} from "./legacy-bridge-health"
import {
  loadCmsSchemaRegistryMap,
  loadCmsSchemasByKind,
} from "./schema-registry.server"

const ENTITY_LIST_LIMIT = 200
const RELATION_ENTITY_OPTION_LIMIT = 80
const RELATION_ENTITY_SEARCH_LIMIT = 60
const RELATION_LIST_LIMIT = 300

type PageRow = Database["public"]["Tables"]["pages"]["Row"]
type SectionRow = Database["public"]["Tables"]["sections"]["Row"]
type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const ENTITY_RELATION_SELECT = `
  id,
  from_entity_id,
  to_entity_id,
  relation_type,
  slot,
  sort_order,
  props,
  source_table,
  source_id,
  updated_at,
  fromEntity:entities!entity_relations_from_entity_id_fkey(id, entity_type, slug, title, subtitle, summary, thumbnail_url, schema_key, data, published, sort_at, source_table, source_id),
  toEntity:entities!entity_relations_to_entity_id_fkey(id, entity_type, slug, title, subtitle, summary, thumbnail_url, schema_key, data, published, sort_at, source_table, source_id)
`

type SchemaSummary = {
  schemaKey: string
  schemaLabel: string
  schemaRegistered: boolean
}
type SchemaRegistryMap = Map<string, CmsSchemaDefinition>

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
  bridgeHealth?: CmsBridgeHealth
}

export type CmsBridgeHealth = {
  source: "entity_graph"
  expected: number | null
  mirrored: number
  missing: number | null
  ok: boolean
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
  graphRelationId: string
  sourceTable: "page_sections"
  sourceId: string
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
  graphRelationId: string
  sourceTable: "section_entities"
  sourceId: string
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

export type CmsRelationEditorOptions = {
  pages: CmsPageSummary[]
  sections: CmsSectionSummary[]
  entitySchemas: CmsEntitySchemaOption[]
  entities: CmsEntitySummary[]
  entityCount: number | null
  entityLimit: number
}

export type CmsEntitySchemaOption = {
  key: string
  label: string
}

export type LoadCmsRelationEditorOptionsOptions = {
  includeEntities?: boolean
  countEntities?: boolean
  entityLimit?: number
}

export type LoadCmsEntityOptionsOptions = {
  query?: string | null
  schemaKey?: string | null
  limit?: number
}

export type CmsPageRelationContext = {
  pageSections: CmsPageSectionRelation[]
  pageSectionList: CmsRelationList<CmsPageSectionRelation>
}

export type CmsSectionRelationContext = {
  pageSections: CmsPageSectionRelation[]
  pageSectionList: CmsRelationList<CmsPageSectionRelation>
  sectionEntities: CmsSectionEntityRelation[]
  sectionEntityList: CmsRelationList<CmsSectionEntityRelation>
  entityRelations: CmsEntityRelation[]
}

export type CmsEntityRelationContext = {
  sectionEntities: CmsSectionEntityRelation[]
  sectionEntityList: CmsRelationList<CmsSectionEntityRelation>
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

function schemaSummary(
  schemaKey: string,
  registry: SchemaRegistryMap,
): SchemaSummary {
  const schema = registry.get(schemaKey)

  return {
    schemaKey,
    schemaLabel: schema?.label ?? "Unregistered schema",
    schemaRegistered: Boolean(schema),
  }
}

async function entitySchemaOptions(): Promise<CmsEntitySchemaOption[]> {
  const schemas = await loadCmsSchemasByKind("entity")
  return schemas
    .map((schema) => ({
      key: schema.schemaKey,
      label: schema.label,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ko"))
}

function mapEntitySummary(entity: Pick<
  EntityRow,
  | "id"
  | "entity_type"
  | "schema_key"
  | "slug"
  | "title"
  | "subtitle"
  | "thumbnail_url"
  | "published"
  | "sort_at"
  | "updated_at"
>,
  registry: SchemaRegistryMap,
): CmsEntitySummary {
  return {
    ...schemaSummary(entity.schema_key, registry),
    id: entity.id,
    entityType: entity.entity_type,
    slug: entity.slug,
    title: entity.title,
    subtitle: entity.subtitle,
    thumbnailUrl: entity.thumbnail_url,
    published: entity.published,
    sortAt: entity.sort_at,
    updatedAt: entity.updated_at,
  }
}

function relationList<T>(
  relations: T[],
  count: number | null,
  limit = RELATION_LIST_LIMIT,
  bridgeHealth?: CmsBridgeHealth,
): CmsRelationList<T> {
  return {
    relations,
    count,
    limit,
    bridgeHealth,
  }
}

function bridgeHealth({
  expected,
  mirrored,
}: {
  expected: number | null
  mirrored: number
}): CmsBridgeHealth {
  const missing = expected === null ? null : Math.max(0, expected - mirrored)

  return {
    source: "entity_graph",
    expected,
    mirrored,
    missing,
    ok: expected === null ? true : expected === mirrored,
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
  registry: SchemaRegistryMap,
): CmsLinkedSection | null {
  if (!section) {
    return null
  }

  return {
    ...schemaSummary(section.schema_key, registry),
    id: section.id,
    key: section.key,
    title: section.title,
    sectionType: section.section_type,
    published: section.published,
  }
}

function linkedEntity(
  entity: RawEntityLink | null,
  registry: SchemaRegistryMap,
): CmsLinkedEntity | null {
  if (!entity) {
    return null
  }

  return {
    ...schemaSummary(entity.schema_key, registry),
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

function sourceId(entity: RawEntityLink | null, sourceTable: string) {
  return entity?.source_table === sourceTable ? entity.source_id : null
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
  | "source_table"
  | "source_id"
>

type RawEntityRelation = {
  id: string
  from_entity_id: string
  to_entity_id: string
  relation_type: string
  slot: string
  sort_order: number
  props: Json
  source_table: string | null
  source_id: string | null
  updated_at: string
  fromEntity: RawEntityLink | null
  toEntity: RawEntityLink | null
}

function mapEntityRelation(
  relation: RawEntityRelation,
  registry: SchemaRegistryMap,
): CmsEntityRelation {
  return {
    id: relation.id,
    fromEntityId: relation.from_entity_id,
    toEntityId: relation.to_entity_id,
    relationType: relation.relation_type,
    slot: relation.slot,
    sortOrder: relation.sort_order,
    props: relation.props,
    updatedAt: relation.updated_at,
    fromEntity: linkedEntity(relation.fromEntity, registry),
    toEntity: linkedEntity(relation.toEntity, registry),
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
  const pagesQuery = supabase
    .from("pages")
    .select("id, slug, title, subtitle, published, updated_at")
    .order("slug", { ascending: true })
  const [registry, result] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    pagesQuery,
  ])
  const { data, error } = result

  if (error) {
    throw new Error(`Failed to load CMS pages: ${error.message}`)
  }

  return (data ?? []).map((page) => ({
    ...schemaSummary("page/default/v1", registry),
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
  const pageQuery = supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  const [registry, result] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    pageQuery,
  ])
  const { data, error } = result

  if (error) {
    throw new Error(`Failed to load CMS page detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...schemaSummary("page/default/v1", registry),
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
  const sectionsQuery = supabase
    .from("sections")
    .select("id, key, section_type, schema_key, title, subtitle, published, updated_at")
    .order("key", { ascending: true })
  const [registry, result] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    sectionsQuery,
  ])
  const { data, error } = result

  if (error) {
    throw new Error(`Failed to load CMS sections: ${error.message}`)
  }

  return (data ?? []).map((section) => ({
    ...schemaSummary(section.schema_key, registry),
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
  const sectionQuery = supabase
    .from("sections")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  const [registry, result] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    sectionQuery,
  ])
  const { data, error } = result

  if (error) {
    throw new Error(`Failed to load CMS section detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...schemaSummary(data.schema_key, registry),
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
  const entitiesQuery = supabase
    .from("entities")
    .select(
      "id, entity_type, schema_key, slug, title, subtitle, thumbnail_url, published, sort_at, updated_at",
      { count: "exact" },
    )
    .order("sort_at", { ascending: false })
    .range(0, ENTITY_LIST_LIMIT - 1)
  const [registry, result] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    entitiesQuery,
  ])
  const { data, error, count } = result

  if (error) {
    throw new Error(`Failed to load CMS entities: ${error.message}`)
  }

  return {
    count,
    limit: ENTITY_LIST_LIMIT,
    entities: (data ?? []).map((entity) => mapEntitySummary(entity, registry)),
  }
}

export async function loadCmsEntityOptions({
  query,
  schemaKey,
  limit = RELATION_ENTITY_SEARCH_LIMIT,
}: LoadCmsEntityOptionsOptions = {}): Promise<CmsEntitySummary[]> {
  const supabase = await createClient()
  const registry = await loadCmsSchemaRegistryMap()
  const normalizedQuery = query?.trim()
  const normalizedSchema = schemaKey?.trim()
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  let entityQuery = supabase
    .from("entities")
    .select(
      "id, entity_type, schema_key, slug, title, subtitle, thumbnail_url, published, sort_at, updated_at",
    )

  if (normalizedSchema && normalizedSchema !== "all") {
    entityQuery = entityQuery.eq("schema_key", normalizedSchema)
  }

  if (normalizedQuery) {
    const safeQuery = normalizedQuery.replace(/[%,()]/g, " ").trim()
    if (safeQuery) {
      const pattern = `%${safeQuery}%`
      entityQuery = entityQuery.or(
        [
          `title.ilike.${pattern}`,
          `subtitle.ilike.${pattern}`,
          `slug.ilike.${pattern}`,
          `entity_type.ilike.${pattern}`,
          `schema_key.ilike.${pattern}`,
        ].join(","),
      )
    }
  }

  const { data, error } = await entityQuery
    .order("sort_at", { ascending: false })
    .limit(safeLimit)

  if (error) {
    throw new Error(`Failed to load CMS entity options: ${error.message}`)
  }

  return (data ?? []).map((entity) => mapEntitySummary(entity, registry))
}

export async function loadCmsRelationEditorOptions({
  includeEntities = true,
  countEntities = false,
  entityLimit = RELATION_ENTITY_OPTION_LIMIT,
}: LoadCmsRelationEditorOptionsOptions = {}): Promise<CmsRelationEditorOptions> {
  const supabase = await createClient()
  const entitySelect =
    "id, entity_type, schema_key, slug, title, subtitle, thumbnail_url, published, sort_at, updated_at"
  const entityQuery = countEntities
    ? supabase.from("entities").select(entitySelect, { count: "exact" })
    : supabase.from("entities").select(entitySelect)
  const pagesQuery = supabase
    .from("pages")
    .select("id, slug, title, subtitle, published, updated_at")
    .order("slug", { ascending: true })
  const sectionsQuery = supabase
    .from("sections")
    .select("id, key, section_type, schema_key, title, subtitle, published, updated_at")
    .order("key", { ascending: true })
  const entitiesPromise = includeEntities
    ? entityQuery
        .order("sort_at", { ascending: false })
        .range(0, Math.min(Math.max(entityLimit, 1), 100) - 1)
    : Promise.resolve({ data: [], error: null, count: null })
  const [registry, schemaOptions, pagesResult, sectionsResult, entitiesResult] =
    await Promise.all([
      loadCmsSchemaRegistryMap(),
      entitySchemaOptions(),
      pagesQuery,
      sectionsQuery,
      entitiesPromise,
    ])

  if (sectionsResult.error) {
    throw new Error(
      `Failed to load CMS section options: ${sectionsResult.error.message}`,
    )
  }

  if (pagesResult.error) {
    throw new Error(
      `Failed to load CMS page options: ${pagesResult.error.message}`,
    )
  }

  if (entitiesResult.error) {
    throw new Error(
      `Failed to load CMS entity options: ${entitiesResult.error.message}`,
    )
  }

  return {
    pages: (pagesResult.data ?? []).map((page) => ({
      ...schemaSummary("page/default/v1", registry),
      id: page.id,
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle,
      published: page.published,
      updatedAt: page.updated_at,
    })),
    sections: (sectionsResult.data ?? []).map((section) => ({
      ...schemaSummary(section.schema_key, registry),
      id: section.id,
      key: section.key,
      sectionType: section.section_type,
      title: section.title,
      subtitle: section.subtitle,
      published: section.published,
      updatedAt: section.updated_at,
    })),
    entitySchemas: schemaOptions,
    entities: (entitiesResult.data ?? []).map((entity) =>
      mapEntitySummary(entity, registry),
    ),
    entityCount: entitiesResult.count,
    entityLimit: includeEntities ? Math.min(Math.max(entityLimit, 1), 100) : 0,
  }
}

export async function loadCmsEntityDetail(
  id: string,
): Promise<CmsContentDetail | null> {
  const supabase = await createClient()
  const entityQuery = supabase
    .from("entities")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  const [registry, result] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    entityQuery,
  ])
  const { data, error } = result

  if (error) {
    throw new Error(`Failed to load CMS entity detail: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...schemaSummary(data.schema_key, registry),
    kind: "entity",
    table: "entities",
    title: data.title,
    subtitle: data.subtitle,
    published: data.published,
    updatedAt: data.updated_at,
    row: data,
  }
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

async function loadShadowEntityId({
  supabase,
  sourceTable,
  sourceId,
}: {
  supabase: SupabaseClient
  sourceTable: "pages" | "sections"
  sourceId: string
}) {
  const { data, error } = await supabase
    .from("entities")
    .select("id")
    .eq("source_table", sourceTable)
    .eq("source_id", sourceId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load ${sourceTable} graph bridge: ${error.message}`)
  }

  return data?.id ?? null
}

async function loadPageLinksById(supabase: SupabaseClient, pageIds: string[]) {
  if (!pageIds.length) return new Map<string, RawPageLink>()

  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, published")
    .in("id", pageIds)

  if (error) {
    throw new Error(`Failed to load page bridge links: ${error.message}`)
  }

  return new Map((data ?? []).map((page) => [page.id, page]))
}

async function loadSectionLinksById(
  supabase: SupabaseClient,
  sectionIds: string[],
) {
  if (!sectionIds.length) return new Map<string, RawSectionLink>()

  const { data, error } = await supabase
    .from("sections")
    .select("id, key, title, section_type, schema_key, published")
    .in("id", sectionIds)

  if (error) {
    throw new Error(`Failed to load section bridge links: ${error.message}`)
  }

  return new Map((data ?? []).map((section) => [section.id, section]))
}

async function loadPageSectionRelationsFromEntityGraph({
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
  const [pageShadowId, sectionShadowId, expected] = await Promise.all([
    pageId
      ? loadShadowEntityId({ supabase, sourceTable: "pages", sourceId: pageId })
      : Promise.resolve(null),
    sectionId
      ? loadShadowEntityId({
          supabase,
          sourceTable: "sections",
          sourceId: sectionId,
        })
      : Promise.resolve(null),
    countLegacyPageSectionMirrorRows({ supabase, pageId, sectionId }),
  ])

  if ((pageId && !pageShadowId) || (sectionId && !sectionShadowId)) {
    return relationList(
      [],
      0,
      limit,
      bridgeHealth({ expected, mirrored: 0 }),
    )
  }

  let query = supabase
    .from("entity_relations")
    .select(ENTITY_RELATION_SELECT, { count: "exact" })
    .eq("source_table", "page_sections")

  if (pageShadowId) query = query.eq("from_entity_id", pageShadowId)
  if (sectionShadowId) query = query.eq("to_entity_id", sectionShadowId)

  const { data, error, count } = await query
    .order("from_entity_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load page-section graph relations: ${error.message}`)
  }

  const rawRelations = (data ?? []) as unknown as RawEntityRelation[]
  const pageIds = uniqueStrings([
    pageId,
    ...rawRelations.map((relation) => sourceId(relation.fromEntity, "pages")),
  ])
  const sectionIds = uniqueStrings([
    sectionId,
    ...rawRelations.map((relation) => sourceId(relation.toEntity, "sections")),
  ])
  const [registry, pagesById, sectionsById] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    loadPageLinksById(supabase, pageIds),
    loadSectionLinksById(supabase, sectionIds),
  ])

  const relations = rawRelations
    .map((relation): CmsPageSectionRelation | null => {
      const mappedPageId = sourceId(relation.fromEntity, "pages") ?? pageId
      const mappedSectionId = sourceId(relation.toEntity, "sections") ?? sectionId

      if (!mappedPageId || !mappedSectionId || !relation.source_id) return null

      return {
        id: relation.source_id,
        graphRelationId: relation.id,
        sourceTable: "page_sections",
        sourceId: relation.source_id,
        pageId: mappedPageId,
        sectionId: mappedSectionId,
        sortOrder: relation.sort_order,
        props: relation.props,
        updatedAt: relation.updated_at,
        page: linkedPage(pagesById.get(mappedPageId) ?? null),
        section: linkedSection(sectionsById.get(mappedSectionId) ?? null, registry),
      }
    })
    .filter((relation): relation is CmsPageSectionRelation => Boolean(relation))
    .sort(byPageSectionOrder)

  return relationList(
    relations,
    count,
    limit,
    bridgeHealth({ expected, mirrored: count ?? relations.length }),
  )
}

async function loadSectionEntityRelationsFromEntityGraph({
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
  const [sectionShadowId, expected] = await Promise.all([
    sectionId
      ? loadShadowEntityId({
          supabase,
          sourceTable: "sections",
          sourceId: sectionId,
        })
      : Promise.resolve(null),
    countLegacySectionEntityMirrorRows({ supabase, sectionId, entityId }),
  ])

  if (sectionId && !sectionShadowId) {
    return relationList(
      [],
      0,
      limit,
      bridgeHealth({ expected, mirrored: 0 }),
    )
  }

  let query = supabase
    .from("entity_relations")
    .select(ENTITY_RELATION_SELECT, { count: "exact" })
    .eq("source_table", "section_entities")

  if (sectionShadowId) query = query.eq("from_entity_id", sectionShadowId)
  if (entityId) query = query.eq("to_entity_id", entityId)

  const { data, error, count } = await query
    .order("from_entity_id", { ascending: true })
    .order("slot", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load section-entity graph relations: ${error.message}`)
  }

  const rawRelations = (data ?? []) as unknown as RawEntityRelation[]
  const sectionIds = uniqueStrings([
    sectionId,
    ...rawRelations.map((relation) => sourceId(relation.fromEntity, "sections")),
  ])
  const [registry, sectionsById] = await Promise.all([
    loadCmsSchemaRegistryMap(),
    loadSectionLinksById(supabase, sectionIds),
  ])

  const relations = rawRelations
    .map((relation): CmsSectionEntityRelation | null => {
      const mappedSectionId =
        sourceId(relation.fromEntity, "sections") ?? sectionId

      if (!mappedSectionId || !relation.source_id || !relation.toEntity) {
        return null
      }

      return {
        id: relation.source_id,
        graphRelationId: relation.id,
        sourceTable: "section_entities",
        sourceId: relation.source_id,
        sectionId: mappedSectionId,
        entityId: relation.to_entity_id,
        relationType: relation.relation_type,
        slot: relation.slot,
        sortOrder: relation.sort_order,
        props: relation.props,
        updatedAt: relation.updated_at,
        section: linkedSection(sectionsById.get(mappedSectionId) ?? null, registry),
        entity: linkedEntity(relation.toEntity, registry),
      }
    })
    .filter((relation): relation is CmsSectionEntityRelation => Boolean(relation))
    .sort(bySectionEntityOrder)

  return relationList(
    relations,
    count,
    limit,
    bridgeHealth({ expected, mirrored: count ?? relations.length }),
  )
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
    .is("source_table", null)

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

  const registry = await loadCmsSchemaRegistryMap()
  const relations = ((data ?? []) as unknown as RawEntityRelation[])
    .map((relation) => mapEntityRelation(relation, registry))
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
    .is("source_table", null)
    .in("from_entity_id", fromEntityIds)
    .order("from_entity_id", { ascending: true })
    .order("slot", { ascending: true })
    .order("sort_order", { ascending: true })
    .range(0, limit - 1)

  if (error) {
    throw new Error(`Failed to load entity relations: ${error.message}`)
  }

  const registry = await loadCmsSchemaRegistryMap()
  const relations = ((data ?? []) as unknown as RawEntityRelation[])
    .map((relation) => mapEntityRelation(relation, registry))
    .sort(byEntityRelationOrder)

  return relationList(relations, count, limit)
}

export async function loadCmsRelationGraph(): Promise<CmsRelationGraph> {
  const supabase = await createClient()
  const [pageSections, sectionEntities, entityRelations] = await Promise.all([
    loadPageSectionRelationsFromEntityGraph({ supabase }),
    loadSectionEntityRelationsFromEntityGraph({ supabase }),
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
  const pageSections = await loadPageSectionRelationsFromEntityGraph({
    supabase,
    pageId,
  })

  return {
    pageSections: pageSections.relations,
    pageSectionList: pageSections,
  }
}

export async function loadCmsSectionRelations(
  sectionId: string,
): Promise<CmsSectionRelationContext> {
  const supabase = await createClient()
  const [pageSections, sectionEntities] = await Promise.all([
    loadPageSectionRelationsFromEntityGraph({ supabase, sectionId }),
    loadSectionEntityRelationsFromEntityGraph({ supabase, sectionId }),
  ])
  const entityRelations = await loadEntityRelationsForFromEntities({
    supabase,
    fromEntityIds: sectionEntities.relations.map((relation) => relation.entityId),
  })

  return {
    pageSections: pageSections.relations,
    pageSectionList: pageSections,
    sectionEntities: sectionEntities.relations,
    sectionEntityList: sectionEntities,
    entityRelations: entityRelations.relations,
  }
}

export async function loadCmsEntityRelations(
  entityId: string,
): Promise<CmsEntityRelationContext> {
  const supabase = await createClient()
  const [sectionEntities, outgoingEntityRelations, incomingEntityRelations] =
    await Promise.all([
      loadSectionEntityRelationsFromEntityGraph({ supabase, entityId }),
      loadEntityRelations({ supabase, fromEntityId: entityId }),
      loadEntityRelations({ supabase, toEntityId: entityId }),
    ])

  return {
    sectionEntities: sectionEntities.relations,
    sectionEntityList: sectionEntities,
    outgoingEntityRelations: outgoingEntityRelations.relations,
    incomingEntityRelations: incomingEntityRelations.relations,
  }
}
