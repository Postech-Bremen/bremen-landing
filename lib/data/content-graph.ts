import { unstable_cache } from "next/cache"

import {
  PUBLIC_CONTENT_CACHE_TAG,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/data/public-cache"
import {
  buildHomeOverview,
  loadMemberStats,
} from "@/lib/data/home-overview"
import type { HomeOverview } from "@/components/home-section"
import type { Database, Json } from "@/lib/supabase/types"
import { createPublicClient } from "@/lib/supabase/public"
import {
  eventByKey,
  type EventKey,
  type Video,
} from "@/lib/data/videos"

type EntityRow = Database["public"]["Tables"]["entities"]["Row"]
type EntityRelationRow = Database["public"]["Tables"]["entity_relations"]["Row"]
type ContentEntityRow = Pick<
  EntityRow,
  | "id"
  | "schema_id"
  | "slug"
  | "title"
  | "subtitle"
  | "summary"
  | "thumbnail_url"
  | "data"
  | "sort_at"
>

const PAGE_SECTION_RELATION_SCHEMA_KEY = "relation/page-section/v1"
const SECTION_ENTITY_RELATION_SCHEMA_KEY = "relation/section-entity/v1"
const PAGE_ENTITY_SCHEMA_KEY = "page/default/v1"
const PAGE_SHADOW_PREFIX = "page:"
const SECTION_SHADOW_PREFIX = "section:"
const CONTENT_ENTITY_SELECT =
  "id, schema_id, slug, title, subtitle, summary, thumbnail_url, data, sort_at"

type GraphPageRecord = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  owner_member_id: string | null
  published: boolean
  props: Json
  created_at: string
  updated_at: string
}

export type GraphSectionItem = {
  entity: ContentEntityRow
  semanticKind: string
  relationType: string
  slot: string
  sortOrder: number
  props: Json
}

export type GraphSection = {
  id: string
  key: string
  sectionType: string
  schemaId: string
  schemaKey: string
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  props: Json
  sortOrder: number
  items: GraphSectionItem[]
}

export type GraphPage = {
  page: GraphPageRecord
  sections: GraphSection[]
}

export type ContentPageConfig = {
  slug: string
  title: string
  subtitle: string | null
  description: string | null
}

export type ContentSectionConfig = {
  key: string
  sectionType: string
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  body: string | null
  href: string | null
  actionLabel: string | null
  filters: string[]
  accentEyebrow?: string | null
  accentTitle?: string | null
  accentBody?: string | null
  accentCaption?: boolean
}

export type PerformanceTypeLabel = "정기공연" | "축제" | "특별" | "STadium"

export type PerformanceArchiveItem = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  date: string
  year: string
  isoDate: string
  venue: string
  type: PerformanceTypeLabel
  thumbnailUrl: string | null
}

export type PerformancePlaylistItem = PerformanceArchiveItem & {
  recordingCount: number
  photoCount: number
  postCount: number
  coverUrl: string | null
  videos: Video[]
  photos: PhotoArchiveItem[]
  updates: PerformanceUpdateItem[]
}

export type PerformanceUpdateKind =
  | "recruiting"
  | "notice"
  | "event"
  | "setlist"
  | "promo"

export type PerformanceUpdateItem = {
  id: string
  title: string
  summary: string | null
  date: string
  isoDate: string
  kind: PerformanceUpdateKind
  eventTitle: string | null
  sourceUrl: string | null
  thumbnailUrl: string | null
}

export type PhotoArchiveItem = {
  id: string
  title: string
  caption: string | null
  category: "공연" | "일상"
  aspect: "portrait" | "landscape"
  thumbnailUrl: string | null
}

export type HistoryMilestoneItem = {
  id: string
  title: string
  summary: string | null
  year: string
  order: number
}

export type HomeCurationVideo = Video & {
  entityId?: string
  caption?: string
}

export type HomeCurationStatItem = {
  id: string
  label: string
  type: "text" | "image" | "color"
  metric: string | null
  value: string | null
  unit: string
  detail: string
  tilt: string
  thumbnailUrl: string | null
  format: string | null
}

export type HomeCurationActivityItem = {
  id: string
  title: string
  kr: string
  description: string
  schedule: string
  variant: "text" | "color"
  tilt: string
}

export type HomeCurationSection = ContentSectionConfig

export type HomeCuration = {
  sections: HomeCurationSection[]
  heroVideo: HomeCurationVideo | null
  stageHighlights: HomeCurationVideo[]
  statItems: HomeCurationStatItem[]
  activityItems: HomeCurationActivityItem[]
}

export type SiteNavigationItem = {
  href: string
  label: string
}

export type SiteNavigationConfig = {
  brandHref: string
  brandAriaLabel: string
  logoSrc: string
  logoAlt: string
  title: string
  suffix: string
  items: SiteNavigationItem[]
  accountSignedInLabel: string
  accountSignedOutLabel: string
  accountSignedInHref: string
  accountSignedOutHref: string
}

export type SiteContactItem = {
  kind: "location" | "time" | "text"
  value: string
}

export type SiteSocialItem = {
  kind: "instagram" | "youtube" | "link"
  label: string
  href: string
}

export type SiteFooterConfig = {
  titleKr: string
  titleEn: string
  eyebrow: string
  description: string
  contactTitle: string
  contacts: SiteContactItem[]
  socialTitle: string
  socials: SiteSocialItem[]
  copyrightName: string
  foundingYear: number
  sinceLabel: string
}

export type SiteChrome = {
  navigation: SiteNavigationConfig
  footer: SiteFooterConfig
}

export type PerformancePageContent = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  playlists: PerformancePlaylistItem[]
}

export type VideoPageContent = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  featuredVideos: Video[]
  popularVideos: Video[]
  libraryVideos: Video[]
}

export type PhotoPageContent = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  photos: PhotoArchiveItem[]
}

export type HistoryPageContent = {
  page: ContentPageConfig
  sections: ContentSectionConfig[]
  milestones: HistoryMilestoneItem[]
}

export type DraftPreviewPageContent =
  | {
      kind: "home"
      page: ContentPageConfig
      sections: ContentSectionConfig[]
      graph: GraphPage
      overview: HomeOverview
    }
  | ({ kind: "performances"; graph: GraphPage } & PerformancePageContent)
  | ({ kind: "videos"; graph: GraphPage } & VideoPageContent)
  | ({ kind: "photos"; graph: GraphPage } & PhotoPageContent)
  | ({ kind: "history"; graph: GraphPage } & HistoryPageContent)
  | {
      kind: "generic"
      page: ContentPageConfig
      sections: ContentSectionConfig[]
      graph: GraphPage
    }

export type DraftCompositionPageContent = {
  kind: DraftPreviewPageContent["kind"]
  page: ContentPageConfig
  graph: GraphPage
}

type GraphPageLoadOptions = {
  id?: string
  slug?: string
  includeDrafts?: boolean
}

type EntityGraphLink = {
  id: string
  slug: string | null
  schema_id: string
  title: string
  subtitle: string | null
  published: boolean
  data: Json
}

type EntityGraphRelation = EntityRelationRow & {
  toEntity?: EntityGraphLink | null
}

type PublicSupabaseClient = ReturnType<typeof createPublicClient>

type ContentGraphSchemaContext = {
  pageSchemaId: string
  pageSectionRelationSchemaId: string
  sectionEntityRelationSchemaId: string
  schemaKeyById: Map<string, string>
}

type PageShadowEntityRow = Pick<
  EntityRow,
  | "id"
  | "schema_id"
  | "slug"
  | "title"
  | "subtitle"
  | "summary"
  | "owner_member_id"
  | "published"
  | "data"
  | "created_at"
  | "updated_at"
>

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

function jsonObject(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value
}

function jsonObjectField(
  data: Record<string, Json | undefined>,
  key: string,
): Json {
  const value = data[key]
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

type ShadowEntityKind = "page" | "section"

function shadowSlug(shadowKind: ShadowEntityKind, sourceKey: string) {
  return `${shadowKind === "page" ? PAGE_SHADOW_PREFIX : SECTION_SHADOW_PREFIX}${sourceKey}`
}

function shadowKey(
  entity: EntityGraphLink | null | undefined,
  shadowKind: ShadowEntityKind,
) {
  const prefix = shadowKind === "page" ? PAGE_SHADOW_PREFIX : SECTION_SHADOW_PREFIX
  return entity?.slug?.startsWith(prefix) ? entity.slug.slice(prefix.length) : null
}

async function loadContentGraphSchemaContext(
  supabase: PublicSupabaseClient,
): Promise<ContentGraphSchemaContext | null> {
  const { data, error } = await supabase
    .from("entity_schemas")
    .select("id, schema_key")
    .eq("active", true)

  if (error || !data) return null

  const byKey = new Map(data.map((schema) => [schema.schema_key, schema.id]))
  const pageSchemaId = byKey.get(PAGE_ENTITY_SCHEMA_KEY)
  const pageSectionRelationSchemaId = byKey.get(PAGE_SECTION_RELATION_SCHEMA_KEY)
  const sectionEntityRelationSchemaId = byKey.get(SECTION_ENTITY_RELATION_SCHEMA_KEY)

  if (
    !pageSchemaId ||
    !pageSectionRelationSchemaId ||
    !sectionEntityRelationSchemaId
  ) {
    return null
  }

  return {
    pageSchemaId,
    pageSectionRelationSchemaId,
    sectionEntityRelationSchemaId,
    schemaKeyById: new Map(data.map((schema) => [schema.id, schema.schema_key])),
  }
}

async function loadSemanticKindBySchemaId(
  supabase: PublicSupabaseClient,
  entities: ContentEntityRow[],
) {
  const schemaIds = uniqueStrings(entities.map((entity) => entity.schema_id))
  if (!schemaIds.length) return new Map<string, string>()

  const { data, error } = await supabase
    .from("entity_schemas")
    .select("id, semantic_kind")
    .in("id", schemaIds)

  if (error || !data) return new Map<string, string>()

  return new Map(
    data
      .filter((schema) => schema.semantic_kind)
      .map((schema) => [schema.id, schema.semantic_kind]),
  )
}

function semanticKindForEntity(
  entity: ContentEntityRow,
  semanticKindBySchemaId: Map<string, string>,
) {
  return semanticKindBySchemaId.get(entity.schema_id) ?? "unregistered"
}

function stringArrayValue(data: Record<string, Json | undefined>, key: string) {
  const value = data[key]
  if (!Array.isArray(value)) return []

  return value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0,
  )
}

function stringValue(data: Record<string, Json | undefined>, key: string) {
  const value = data[key]
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null
}

function displayStringValue(data: Record<string, Json | undefined>, key: string) {
  const value = data[key]
  if (typeof value === "string" && value.trim().length > 0) return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return null
}

function numberValue(data: Record<string, Json | undefined>, key: string) {
  const value = data[key]
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function booleanValue(data: Record<string, Json | undefined>, key: string) {
  const value = data[key]
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value === "true"
  return null
}

function formatMonthDay(isoDate: string) {
  const [, month, day] = isoDate.split("-")
  return month && day ? `${month}/${day}` : isoDate
}

function parseVideoTitle(title: string) {
  const segments = title.split("|").map((segment) => segment.trim()).filter(Boolean)
  const head = segments[0] ?? title.trim()
  const second = segments[1]

  function isContextSegment(segment: string | undefined) {
    if (!segment) return true
    const normalized = segment.toLowerCase()
    return (
      normalized.includes("bremen cover") ||
      segment.includes("브레멘 커버") ||
      segment.includes("포스텍") ||
      segment.includes("정기공연") ||
      segment.includes("정기 공연") ||
      segment.includes("신환공") ||
      segment.includes("새터") ||
      segment.includes("해맞이") ||
      segment.includes("STadium")
    )
  }

  function cleanTeam(segment: string) {
    return segment.replace(/\s*팀$/, "").trim()
  }

  function cleanSong(segment: string) {
    return segment.replace(/\s*\(20\d{2}.*\)$/, "").trim()
  }

  const secondSong = second ? cleanSong(second) : undefined

  if (secondSong && !isContextSegment(secondSong) && head.includes("팀")) {
    return {
      artist: undefined,
      song: secondSong,
      team: cleanTeam(head),
    }
  }

  if (second && !isContextSegment(second) && !head.includes("-")) {
    return {
      artist: undefined,
      song: head,
      team: cleanTeam(second),
    }
  }

  const match = head.match(/^\d{4}\b/)
    ? null
    : head.match(/^(.+?)\s*-\s*(.+)$/)
  const teamSegment = segments.slice(1).find((segment) => !isContextSegment(segment))

  return {
    artist: match?.[1]?.trim(),
    song: match?.[2]?.trim(),
    team: teamSegment ? cleanTeam(teamSegment) : undefined,
  }
}

function performanceTypeLabel(type: string | null): PerformanceTypeLabel {
  if (type === "regular") return "정기공연"
  if (type === "festival") return "축제"
  if (type === "stadium") return "STadium"
  return "특별"
}

function performanceUpdateKind(kind: string | null): PerformanceUpdateKind {
  if (kind === "recruiting") return "recruiting"
  if (kind === "event") return "event"
  if (kind === "setlist") return "setlist"
  if (kind === "promo") return "promo"
  return "notice"
}

function photoCategoryLabel(category: string | null): "공연" | "일상" {
  return category === "live" ||
    category === "events" ||
    category === "performance"
    ? "공연"
    : "일상"
}

function photoAspect(value: string | null): "portrait" | "landscape" {
  return value === "portrait" ? "portrait" : "landscape"
}

function activityVariant(value: string | null): HomeCurationActivityItem["variant"] {
  return value === "color" ? "color" : "text"
}

function contactKind(value: string | null): SiteContactItem["kind"] {
  if (value === "location" || value === "time") return value
  return "text"
}

function socialKind(value: string | null): SiteSocialItem["kind"] {
  if (value === "instagram" || value === "youtube") return value
  return "link"
}

function contentPageFromGraph(page: GraphPageRecord): ContentPageConfig {
  return {
    slug: page.slug,
    title: page.title,
    subtitle: page.subtitle,
    description: page.description,
  }
}

function pageRecordFromEntity(
  entity: PageShadowEntityRow,
): GraphPageRecord | null {
  const data = jsonObject(entity.data)
  const slug =
    shadowKey(entity, "page") ??
    stringValue(data, "slug")

  if (!slug) return null

  return {
    id: entity.id,
    slug,
    title: entity.title,
    subtitle: entity.subtitle,
    description: entity.summary,
    owner_member_id: entity.owner_member_id,
    published: entity.published,
    props: jsonObjectField(data, "props"),
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  }
}

function contentSectionFromGraph(section: GraphSection): ContentSectionConfig {
  const props = jsonObject(section.props)

  return {
    key: section.key,
    sectionType: section.sectionType,
    eyebrow: section.eyebrow,
    title: section.title,
    subtitle: section.subtitle,
    body: stringValue(props, "body"),
    href: stringValue(props, "href"),
    actionLabel: stringValue(props, "action_label"),
    filters: stringArrayValue(props, "filters"),
    accentEyebrow: stringValue(props, "eyebrow_accent"),
    accentTitle: stringValue(props, "title_accent"),
    accentBody: stringValue(props, "body_accent"),
    accentCaption: booleanValue(props, "feature_caption_accent") ?? false,
  }
}

function graphSectionFromShadowEntity({
  entity,
  schemas,
  sortOrder,
}: {
  entity: EntityGraphLink | null | undefined
  schemas: ContentGraphSchemaContext
  sortOrder: number
}): GraphSection | null {
  if (!entity) return null

  const data = jsonObject(entity.data)
  const key = shadowKey(entity, "section") ?? stringValue(data, "key")
  const sectionType = stringValue(data, "section_type")

  if (!key || !sectionType) return null

  return {
    id: entity.id,
    key,
    sectionType,
    schemaId: entity.schema_id,
    schemaKey:
      schemas.schemaKeyById.get(entity.schema_id) ??
      `unregistered:${entity.schema_id}`,
    eyebrow: stringValue(data, "eyebrow"),
    title: entity.title,
    subtitle: entity.subtitle,
    props: jsonObjectField(data, "props"),
    sortOrder,
    items: [],
  }
}

async function loadSectionItemsByShadowId({
  supabase,
  sectionShadowIds,
  relationSchemaId,
  includeDrafts,
}: {
  supabase: PublicSupabaseClient
  sectionShadowIds: string[]
  relationSchemaId: string
  includeDrafts: boolean
}) {
  const { data: sectionEntityRelations, error: sectionEntityError } =
    sectionShadowIds.length
      ? await supabase
          .from("entity_relations")
          .select("*")
          .eq("schema_id", relationSchemaId)
          .in("from_entity_id", sectionShadowIds)
      : { data: [], error: null }

  if (sectionEntityError) return null

  const graphSectionEntities =
    (sectionEntityRelations ?? []) as EntityRelationRow[]
  const entityIds = uniqueStrings(
    graphSectionEntities.map((relation) => relation.to_entity_id),
  )
  let entitiesResult: {
    data: ContentEntityRow[] | null
    error: { message: string } | null
  } = { data: [], error: null }

  if (entityIds.length) {
    let entitiesQuery = supabase
      .from("entities")
      .select(CONTENT_ENTITY_SELECT)
      .in("id", entityIds)

    if (!includeDrafts) {
      entitiesQuery = entitiesQuery.eq("published", true)
    }

    entitiesResult = await entitiesQuery
  }

  const { data: entities, error: entitiesError } = entitiesResult

  if (entitiesError) return null

  const semanticKindBySchemaId = await loadSemanticKindBySchemaId(
    supabase,
    entities ?? [],
  )
  const sectionShadowIdSet = new Set(sectionShadowIds)
  const entityById = new Map((entities ?? []).map((entity) => [entity.id, entity]))
  const itemsByShadowId = new Map<string, GraphSectionItem[]>()

  for (const relation of [...graphSectionEntities].sort(sortRelations)) {
    if (!sectionShadowIdSet.has(relation.from_entity_id)) continue

    const entity = entityById.get(relation.to_entity_id)
    if (!entity) continue

    const existing = itemsByShadowId.get(relation.from_entity_id) ?? []
    existing.push({
      entity,
      semanticKind: semanticKindForEntity(entity, semanticKindBySchemaId),
      relationType: relation.relation_type,
      slot: relation.slot,
      sortOrder: relation.sort_order,
      props: relation.props,
    })
    itemsByShadowId.set(relation.from_entity_id, existing)
  }

  return itemsByShadowId
}

async function loadGraphPageUncached(
  query: string | GraphPageLoadOptions,
): Promise<GraphPage | null> {
  if (!hasSupabaseEnv()) return null

  try {
    const options = typeof query === "string" ? { slug: query } : query
    const includeDrafts = Boolean(options.includeDrafts)
    const supabase = createPublicClient()
    const schemas = await loadContentGraphSchemaContext(supabase)

    if (!schemas) return null

    if (options.slug && !options.id) {
      let pageEntityQuery = supabase
        .from("entities")
        .select(
          "id, schema_id, slug, title, subtitle, summary, owner_member_id, published, data, created_at, updated_at",
        )
        .eq("schema_id", schemas.pageSchemaId)
        .eq("slug", shadowSlug("page", options.slug))

      if (!includeDrafts) {
        pageEntityQuery = pageEntityQuery.eq("published", true)
      }

      const { data: pageEntity, error: pageEntityError } =
        await pageEntityQuery.maybeSingle()

      if (pageEntityError || !pageEntity) return null

      const page = pageRecordFromEntity(pageEntity)
      if (!page) return null

      return await loadGraphPageFromEntityRelations({
        page,
        supabase,
        includeDrafts,
        schemas,
        pageEntityId: pageEntity.id,
      })
    }

    if (options.id) {
      let pageEntityQuery = supabase
        .from("entities")
        .select(
          "id, schema_id, slug, title, subtitle, summary, owner_member_id, published, data, created_at, updated_at",
        )
        .eq("id", options.id)
        .eq("schema_id", schemas.pageSchemaId)

      if (!includeDrafts) {
        pageEntityQuery = pageEntityQuery.eq("published", true)
      }

      const { data: pageEntity, error: pageEntityError } =
        await pageEntityQuery.maybeSingle()

      if (!pageEntityError && pageEntity) {
        const page = pageRecordFromEntity(pageEntity)

        if (page) {
          return await loadGraphPageFromEntityRelations({
            page,
            supabase,
            includeDrafts,
            schemas,
            pageEntityId: pageEntity.id,
          })
        }
      }
    }

    return null
  } catch {
    return null
  }
}

async function loadGraphPageFromEntityRelations({
  supabase,
  page,
  includeDrafts,
  schemas,
  pageEntityId,
}: {
  supabase: PublicSupabaseClient
  page: GraphPageRecord
  includeDrafts: boolean
  schemas?: ContentGraphSchemaContext
  pageEntityId?: string
}): Promise<GraphPage> {
  const resolvedSchemas = schemas ?? await loadContentGraphSchemaContext(supabase)
  if (!resolvedSchemas) return { page, sections: [] }

  let resolvedPageEntityId = pageEntityId

  if (!resolvedPageEntityId) {
    const { data: pageEntity, error: pageEntityError } = await supabase
      .from("entities")
      .select("id")
      .eq("schema_id", resolvedSchemas.pageSchemaId)
      .eq("slug", shadowSlug("page", page.slug))
      .maybeSingle()

    if (pageEntityError || !pageEntity) return { page, sections: [] }
    resolvedPageEntityId = pageEntity.id
  }

  const { data: pageSectionRelations, error: pageSectionError } = await supabase
    .from("entity_relations")
    .select(
      `
        *,
        toEntity:entities!entity_relations_to_entity_id_fkey(id, slug, schema_id, title, subtitle, published, data)
      `,
    )
    .eq("schema_id", resolvedSchemas.pageSectionRelationSchemaId)
    .eq("from_entity_id", resolvedPageEntityId)
    .order("sort_order", { ascending: true })

  if (pageSectionError || !pageSectionRelations?.length) {
    return { page, sections: [] }
  }

  const graphPageSections =
    pageSectionRelations as unknown as EntityGraphRelation[]

  const sections = graphPageSections
    .filter((relation) => includeDrafts || relation.toEntity?.published === true)
    .map((relation) =>
      graphSectionFromShadowEntity({
        entity: relation.toEntity,
        schemas: resolvedSchemas,
        sortOrder: relation.sort_order,
      }),
    )
    .filter((section): section is GraphSection => Boolean(section))
  const sectionShadowIds = sections.map((section) => section.id)
  const itemsBySectionId = await loadSectionItemsByShadowId({
    supabase,
    sectionShadowIds,
    relationSchemaId: resolvedSchemas.sectionEntityRelationSchemaId,
    includeDrafts,
  })

  if (!itemsBySectionId) return { page, sections: [] }

  return {
    page,
    sections: sections.map((section) => ({
      ...section,
      items: itemsBySectionId.get(section.id) ?? [],
    })),
  }
}

export const loadGraphPage = unstable_cache(
  loadGraphPageUncached,
  ["public-content", "graph-page"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAG],
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
  },
)

function sectionItems(page: GraphPage | null, key: string) {
  return page?.sections.find((section) => section.key === key)?.items ?? []
}

function sectionByKey(page: GraphPage | null, key: string) {
  return page?.sections.find((section) => section.key === key) ?? null
}

function siteNavigationItemFromSectionItem(
  item: GraphSectionItem,
): SiteNavigationItem | null {
  if (item.semanticKind !== "navigation_item") return null

  const data = jsonObject(item.entity.data)
  const href = stringValue(data, "href")
  if (!href) return null

  return {
    href,
    label: item.entity.title,
  }
}

function siteContactFromSectionItem(item: GraphSectionItem): SiteContactItem | null {
  if (item.semanticKind !== "contact_item") return null

  const data = jsonObject(item.entity.data)
  const value = item.entity.title || stringValue(data, "value")
  if (!value) return null

  return {
    kind: contactKind(stringValue(data, "kind")),
    value,
  }
}

function siteSocialFromSectionItem(item: GraphSectionItem): SiteSocialItem | null {
  if (item.semanticKind !== "social_link") return null

  const data = jsonObject(item.entity.data)
  const href = stringValue(data, "href")
  if (!href) return null

  return {
    kind: socialKind(stringValue(data, "kind")),
    label: item.entity.title,
    href,
  }
}

async function loadSiteChromeUncached(): Promise<SiteChrome | null> {
  const page = await loadGraphPage("site")
  if (!page) return null

  const navigationSection = sectionByKey(page, "site-navigation")
  const footerSection = sectionByKey(page, "site-footer")
  if (!navigationSection || !footerSection) return null

  const navigationProps = jsonObject(navigationSection.props)
  const footerProps = jsonObject(footerSection.props)
  const navigationItems = sectionItems(page, "site-navigation")
    .map((item) => siteNavigationItemFromSectionItem(item))
    .filter((item): item is SiteNavigationItem => Boolean(item))
  const contacts = sectionItems(page, "site-footer")
    .filter((item) => item.slot === "contact")
    .map((item) => siteContactFromSectionItem(item))
    .filter((item): item is SiteContactItem => Boolean(item))
  const socials = sectionItems(page, "site-footer")
    .filter((item) => item.slot === "social")
    .map((item) => siteSocialFromSectionItem(item))
    .filter((item): item is SiteSocialItem => Boolean(item))
  const brandHref = stringValue(navigationProps, "brand_href")
  const brandAriaLabel = stringValue(navigationProps, "brand_aria_label")
  const logoSrc = stringValue(navigationProps, "logo_src")
  const logoAlt = stringValue(navigationProps, "logo_alt") ?? ""
  const title = stringValue(navigationProps, "brand_title")
  const suffix = stringValue(navigationProps, "brand_suffix")
  const accountSignedInLabel = stringValue(navigationProps, "account_signed_in_label")
  const accountSignedOutLabel = stringValue(navigationProps, "account_signed_out_label")
  const accountSignedInHref = stringValue(navigationProps, "account_signed_in_href")
  const accountSignedOutHref = stringValue(navigationProps, "account_signed_out_href")
  const titleKr = stringValue(footerProps, "title_kr")
  const titleEn = stringValue(footerProps, "title_en")
  const eyebrow = stringValue(footerProps, "eyebrow")
  const description = stringValue(footerProps, "description")
  const contactTitle = stringValue(footerProps, "contact_title")
  const socialTitle = stringValue(footerProps, "social_title")
  const copyrightName = stringValue(footerProps, "copyright_name")
  const foundingYear = numberValue(footerProps, "founding_year")
  const sinceLabel = stringValue(footerProps, "since_label")

  if (
    !brandHref ||
    !brandAriaLabel ||
    !logoSrc ||
    !title ||
    !suffix ||
    !accountSignedInLabel ||
    !accountSignedOutLabel ||
    !accountSignedInHref ||
    !accountSignedOutHref ||
    !navigationItems.length ||
    !titleKr ||
    !titleEn ||
    !eyebrow ||
    !description ||
    !contactTitle ||
    !contacts.length ||
    !socialTitle ||
    !socials.length ||
    !copyrightName ||
    !foundingYear ||
    !sinceLabel
  ) {
    return null
  }

  return {
    navigation: {
      brandHref,
      brandAriaLabel,
      logoSrc,
      logoAlt,
      title,
      suffix,
      items: navigationItems,
      accountSignedInLabel,
      accountSignedOutLabel,
      accountSignedInHref,
      accountSignedOutHref,
    },
    footer: {
      titleKr,
      titleEn,
      eyebrow,
      description,
      contactTitle,
      contacts,
      socialTitle,
      socials,
      copyrightName,
      foundingYear,
      sinceLabel,
    },
  }
}

function performanceFromEntity(entity: ContentEntityRow): PerformanceArchiveItem | null {
  const data = jsonObject(entity.data)
  const isoDate = stringValue(data, "event_date") ?? entity.sort_at.slice(0, 10)
  const year = isoDate.slice(0, 4)

  if (!year) return null

  return {
    id: entity.id,
    slug: entity.slug ?? entity.id,
    title: entity.title,
    subtitle: entity.subtitle,
    date: stringValue(data, "display_date") ?? formatMonthDay(isoDate),
    year,
    isoDate,
    venue: stringValue(data, "venue") ?? "",
    type: performanceTypeLabel(stringValue(data, "type")),
    thumbnailUrl: entity.thumbnail_url,
  }
}

function sortRelations(left: EntityRelationRow, right: EntityRelationRow) {
  return left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at)
}

function performanceUpdateFromEntity(
  entity: ContentEntityRow,
): PerformanceUpdateItem | null {
  const data = jsonObject(entity.data)
  const isoDate = stringValue(data, "taken_at") ?? entity.sort_at.slice(0, 10)

  return {
    id: entity.id,
    title: entity.title,
    summary: entity.summary,
    date: stringValue(data, "display_date") ?? formatMonthDay(isoDate),
    isoDate,
    kind: performanceUpdateKind(stringValue(data, "content_kind")),
    eventTitle: stringValue(data, "event_title"),
    sourceUrl: stringValue(data, "source_url"),
    thumbnailUrl: entity.thumbnail_url,
  }
}

function videoFromEntity(
  entity: ContentEntityRow,
  performanceSlugById: Map<string, string>,
): Video | null {
  const data = jsonObject(entity.data)
  const youtubeId = stringValue(data, "youtube_id")
  if (!youtubeId) return null

  const performanceId = stringValue(data, "performance_id")
  const event =
    stringValue(data, "event_slug") ||
    (performanceId && performanceSlugById.get(performanceId)) ||
    "recording"
  const parsedTitle = parseVideoTitle(entity.title)

  return {
    id: youtubeId,
    thumbnailUrl: entity.thumbnail_url ?? undefined,
    watchUrl: stringValue(data, "youtube_url") ?? undefined,
    artist: stringValue(data, "artist") ?? parsedTitle.artist,
    song: stringValue(data, "song") ?? parsedTitle.song,
    raw_title: entity.title,
    team: stringValue(data, "team") ?? parsedTitle.team,
    event: event as EventKey,
    eventLabel: stringValue(data, "event_title") ?? undefined,
    eventOrder: numberValue(data, "source_index") ?? undefined,
    duration: stringValue(data, "duration") ?? "",
    views: numberValue(data, "views") ?? 0,
    highlight: booleanValue(data, "is_highlight") ?? false,
  }
}

function historyFromEntity(entity: ContentEntityRow): HistoryMilestoneItem | null {
  const data = jsonObject(entity.data)
  const year = stringValue(data, "year") ?? entity.title.match(/\d{4}/)?.[0]

  if (!year) return null

  return {
    id: entity.id,
    title: entity.title,
    summary: entity.summary,
    year,
    order: numberValue(data, "display_order") ?? 0,
  }
}

function photoFromEntity(entity: ContentEntityRow): PhotoArchiveItem | null {
  const data = jsonObject(entity.data)

  if (booleanValue(data, "gallery_include") === false) return null

  return {
    id: entity.id,
    title: entity.title,
    caption: entity.summary,
    category: photoCategoryLabel(stringValue(data, "category")),
    aspect: photoAspect(stringValue(data, "aspect")),
    thumbnailUrl: entity.thumbnail_url,
  }
}

function homeStatType(value: string | null): HomeCurationStatItem["type"] {
  if (value === "image" || value === "color") return value
  return "text"
}

function homeVideoFromSectionItem(
  item: GraphSectionItem,
  performanceSlugById: Map<string, string>,
): HomeCurationVideo | null {
  const video = videoFromEntity(item.entity, performanceSlugById)
  if (!video) return null

  const props = jsonObject(item.props)
  return {
    ...video,
    entityId: item.entity.id,
    caption: stringValue(props, "caption") ?? undefined,
  }
}

function homeStatFromSectionItem(item: GraphSectionItem): HomeCurationStatItem | null {
  if (item.semanticKind !== "stat") return null

  const data = jsonObject(item.entity.data)
  const detail =
    item.entity.summary ??
    stringValue(data, "detail") ??
    ""

  return {
    id: item.entity.id,
    label: item.entity.title,
    type: homeStatType(stringValue(data, "card_type")),
    metric: stringValue(data, "metric"),
    value: displayStringValue(data, "value"),
    unit: stringValue(data, "unit") ?? "",
    detail,
    tilt: stringValue(data, "tilt") ?? "0deg",
    thumbnailUrl: item.entity.thumbnail_url,
    format: stringValue(data, "format"),
  }
}

function homeActivityFromSectionItem(
  item: GraphSectionItem,
): HomeCurationActivityItem | null {
  if (item.semanticKind !== "activity") return null

  const data = jsonObject(item.entity.data)

  return {
    id: item.entity.id,
    title: item.entity.title,
    kr: item.entity.subtitle ?? stringValue(data, "kr") ?? "",
    description: item.entity.summary ?? stringValue(data, "description") ?? "",
    schedule: stringValue(data, "schedule") ?? "",
    variant: activityVariant(stringValue(data, "variant")),
    tilt: stringValue(data, "tilt") ?? "0deg",
  }
}

async function loadPerformanceSlugsById(includeDrafts = false) {
  const page = includeDrafts
    ? await loadGraphPageUncached({ slug: "performances", includeDrafts: true })
    : await loadGraphPage("performances")
  const entries = sectionItems(page, "performances-archive")
    .filter((item) => item.semanticKind === "performance")
    .map((item) => item.entity)

  return new Map(entries.map((entity) => [entity.id, entity.slug ?? entity.id]))
}

async function loadHomeCurationUncached(): Promise<HomeCuration | null> {
  const page = await loadGraphPage("home")
  if (!page) return null

  return homeCurationFromGraph(page)
}

async function homeCurationFromGraph(
  page: GraphPage,
  options: { includeDrafts?: boolean } = {},
): Promise<HomeCuration | null> {
  const sections = page.sections.map((section) => contentSectionFromGraph(section))
  const performanceSlugById = await loadPerformanceSlugsById(
    Boolean(options.includeDrafts),
  )
  const heroVideo =
    sectionItems(page, "home-hero")
      .map((item) => homeVideoFromSectionItem(item, performanceSlugById))
      .find((item): item is HomeCurationVideo => Boolean(item)) ?? null

  const stageHighlights = sectionItems(page, "home-stage-highlights")
    .map((item) => homeVideoFromSectionItem(item, performanceSlugById))
    .filter((item): item is HomeCurationVideo => Boolean(item))

  const statItems = sectionItems(page, "home-stats")
    .map((item) => homeStatFromSectionItem(item))
    .filter((item): item is HomeCurationStatItem => Boolean(item))

  const activityItems = sectionItems(page, "home-activities")
    .map((item) => homeActivityFromSectionItem(item))
    .filter((item): item is HomeCurationActivityItem => Boolean(item))

  if (
    !sections.length &&
    !heroVideo &&
    !stageHighlights.length &&
    !statItems.length &&
    !activityItems.length
  ) {
    return null
  }

  return {
    sections,
    heroVideo,
    stageHighlights,
    statItems,
    activityItems,
  }
}

async function loadPerformancePlaylistsFromPage(
  page: GraphPage | null,
  options: { includeDrafts?: boolean } = {},
) {
  const performanceEntities = sectionItems(page, "performances-archive")
    .filter((item) => item.semanticKind === "performance")
    .map((item) => item.entity)

  if (!performanceEntities.length || !hasSupabaseEnv()) return null

  const performanceItems = performanceEntities
    .map((entity) => performanceFromEntity(entity))
    .filter((item): item is PerformanceArchiveItem => Boolean(item))
  const performanceById = new Map(performanceItems.map((item) => [item.id, item]))
  const performanceSlugById = new Map(
    performanceEntities.map((entity) => [entity.id, entity.slug ?? entity.id]),
  )

  try {
    const includeDrafts = Boolean(options.includeDrafts)
    const supabase = createPublicClient()
    const performanceIds = performanceEntities.map((entity) => entity.id)
    const { data: relations, error: relationsError } = await supabase
      .from("entity_relations")
      .select("*")
      .in("from_entity_id", performanceIds)
      .in("relation_type", ["has_recording", "has_photo", "has_post"])

    if (relationsError) return null

    const relatedIds = [
      ...new Set((relations ?? []).map((relation) => relation.to_entity_id)),
    ]
    let relatedEntitiesResult: {
      data: ContentEntityRow[] | null
      error: { message: string } | null
    } = { data: [], error: null }

    if (relatedIds.length) {
      let relatedEntitiesQuery = supabase
        .from("entities")
        .select(CONTENT_ENTITY_SELECT)
        .in("id", relatedIds)

      if (!includeDrafts) {
        relatedEntitiesQuery = relatedEntitiesQuery.eq("published", true)
      }

      relatedEntitiesResult = await relatedEntitiesQuery
    }
    const { data: relatedEntities, error: relatedEntitiesError } =
      relatedEntitiesResult

    if (relatedEntitiesError) return null

    const entityById = new Map((relatedEntities ?? []).map((entity) => [entity.id, entity]))
    const relatedSemanticKindBySchemaId = await loadSemanticKindBySchemaId(
      supabase,
      relatedEntities ?? [],
    )
    const relationsByPerformance = new Map<string, EntityRelationRow[]>()

    for (const relation of [...(relations ?? [])].sort(sortRelations)) {
      const existing = relationsByPerformance.get(relation.from_entity_id) ?? []
      existing.push(relation)
      relationsByPerformance.set(relation.from_entity_id, existing)
    }

    return performanceEntities
      .map((entity) => {
        const performance = performanceById.get(entity.id)
        if (!performance) return null

        const related = relationsByPerformance.get(entity.id) ?? []
        const videos = related
          .map((relation) => entityById.get(relation.to_entity_id))
          .filter((relatedEntity): relatedEntity is ContentEntityRow =>
            Boolean(
              relatedEntity &&
                semanticKindForEntity(relatedEntity, relatedSemanticKindBySchemaId) ===
                  "video",
            ),
          )
          .map((relatedEntity) => videoFromEntity(relatedEntity, performanceSlugById))
          .filter((video): video is Video => Boolean(video))

        const photos = related
          .map((relation) => entityById.get(relation.to_entity_id))
          .filter((relatedEntity): relatedEntity is ContentEntityRow =>
            Boolean(
              relatedEntity &&
                semanticKindForEntity(relatedEntity, relatedSemanticKindBySchemaId) ===
                  "photo",
            ),
          )
          .map((relatedEntity) => photoFromEntity(relatedEntity))
          .filter((photo): photo is PhotoArchiveItem => Boolean(photo))

        const updates = related
          .map((relation) => entityById.get(relation.to_entity_id))
          .filter((relatedEntity): relatedEntity is ContentEntityRow =>
            Boolean(
              relatedEntity &&
                semanticKindForEntity(relatedEntity, relatedSemanticKindBySchemaId) ===
                  "post",
            ),
          )
          .map((relatedEntity) => performanceUpdateFromEntity(relatedEntity))
          .filter((update): update is PerformanceUpdateItem => Boolean(update))

        return {
          ...performance,
          recordingCount: videos.length,
          photoCount: photos.length,
          postCount: updates.length,
          coverUrl:
            performance.thumbnailUrl ??
            videos[0]?.thumbnailUrl ??
            photos[0]?.thumbnailUrl ??
            updates[0]?.thumbnailUrl ??
            null,
          videos: videos.slice(0, 5),
          photos: photos.slice(0, 4),
          updates: updates.slice(0, 2),
        } satisfies PerformancePlaylistItem
      })
      .filter((item): item is PerformancePlaylistItem => Boolean(item))
      .sort((left, right) => right.isoDate.localeCompare(left.isoDate))
  } catch {
    return null
  }
}

async function loadPerformanceArchiveUncached() {
  const page = await loadGraphPage("performances")
  const archiveItems = sectionItems(page, "performances-archive")
    .map((item) => performanceFromEntity(item.entity))
    .filter((item): item is PerformanceArchiveItem => Boolean(item))

  if (archiveItems.length) {
    return archiveItems
  }

  return null
}

async function loadPerformancePlaylistsUncached() {
  const page = await loadGraphPage("performances")
  return loadPerformancePlaylistsFromPage(page)
}

async function loadPerformancePageUncached(): Promise<PerformancePageContent | null> {
  const page = await loadGraphPage("performances")
  if (!page) return null

  const playlists = await loadPerformancePlaylistsFromPage(page)

  return {
    page: contentPageFromGraph(page.page),
    sections: page.sections.map((section) => contentSectionFromGraph(section)),
    playlists: playlists ?? [],
  }
}

async function loadPerformanceUpdatesUncached() {
  const page = await loadGraphPage("performances")
  const updates = sectionItems(page, "performances-updates")
    .map((item) => performanceUpdateFromEntity(item.entity))
    .filter((item): item is PerformanceUpdateItem => Boolean(item))

  return updates.length
    ? updates.sort((left, right) => right.isoDate.localeCompare(left.isoDate))
    : null
}

function videosFromSectionItems(
  items: GraphSectionItem[],
  performanceSlugById: Map<string, string>,
) {
  return items
    .map((item) => videoFromEntity(item.entity, performanceSlugById))
    .filter((video): video is Video => Boolean(video))
}

function sortVideoArchive(recordings: Video[]) {
  return recordings.sort((left, right) => {
    const eventGap = eventByKey(left.event).order - eventByKey(right.event).order
    if (eventGap !== 0) return eventGap
    return right.views - left.views
  })
}

async function loadVideoPageUncached(): Promise<VideoPageContent | null> {
  const page = await loadGraphPage("videos")
  if (!page) return null

  const performanceSlugById = await loadPerformanceSlugsById()
  const featuredVideos = videosFromSectionItems(
    sectionItems(page, "videos-featured"),
    performanceSlugById,
  )
  const popularVideos = videosFromSectionItems(
    sectionItems(page, "videos-popular"),
    performanceSlugById,
  )
  const libraryVideos = sortVideoArchive(
    videosFromSectionItems(sectionItems(page, "videos-library"), performanceSlugById),
  )

  return {
    page: contentPageFromGraph(page.page),
    sections: page.sections.map((section) => contentSectionFromGraph(section)),
    featuredVideos,
    popularVideos,
    libraryVideos,
  }
}

export async function loadDraftPreviewPage(
  pageId: string,
): Promise<DraftPreviewPageContent | null> {
  const page = await loadGraphPageUncached({
    id: pageId,
    includeDrafts: true,
  })

  if (!page) return null

  const contentPage = contentPageFromGraph(page.page)
  const sections = page.sections.map((section) => contentSectionFromGraph(section))

  if (page.page.slug === "home") {
    const [videos, performances, photos, memberStats, homeCuration] =
      await Promise.all([
        loadVideoArchiveUncached(),
        loadPerformancePlaylistsUncached(),
        loadPhotoArchiveUncached(),
        loadMemberStats(),
        homeCurationFromGraph(page, { includeDrafts: true }),
      ])
    const overview = buildHomeOverview({
      videos,
      performances,
      photos,
      memberStats,
      homeCuration,
    })

    if (overview) {
      return {
        kind: "home",
        graph: page,
        page: contentPage,
        sections,
        overview,
      }
    }
  }

  if (page.page.slug === "performances") {
    return {
      kind: "performances",
      graph: page,
      page: contentPage,
      sections,
      playlists:
        (await loadPerformancePlaylistsFromPage(page, { includeDrafts: true })) ??
        [],
    }
  }

  if (page.page.slug === "videos") {
    const performanceSlugById = await loadPerformanceSlugsById(true)

    return {
      kind: "videos",
      graph: page,
      page: contentPage,
      sections,
      featuredVideos: videosFromSectionItems(
        sectionItems(page, "videos-featured"),
        performanceSlugById,
      ),
      popularVideos: videosFromSectionItems(
        sectionItems(page, "videos-popular"),
        performanceSlugById,
      ),
      libraryVideos: sortVideoArchive(
        videosFromSectionItems(
          sectionItems(page, "videos-library"),
          performanceSlugById,
        ),
      ),
    }
  }

  if (page.page.slug === "photos") {
    return {
      kind: "photos",
      graph: page,
      page: contentPage,
      sections,
      photos: sectionItems(page, "photos-gallery")
        .map((item) => photoFromEntity(item.entity))
        .filter((photo): photo is PhotoArchiveItem => Boolean(photo)),
    }
  }

  if (page.page.slug === "history") {
    return {
      kind: "history",
      graph: page,
      page: contentPage,
      sections,
      milestones: sectionItems(page, "history-timeline")
        .map((item) => historyFromEntity(item.entity))
        .filter((item): item is HistoryMilestoneItem => Boolean(item))
        .sort((left, right) => left.order - right.order),
    }
  }

  return {
    kind: "generic",
    page: contentPage,
    sections,
    graph: page,
  }
}

export async function loadDraftCompositionPage(
  pageId: string,
): Promise<DraftCompositionPageContent | null> {
  const page = await loadGraphPageUncached({
    id: pageId,
    includeDrafts: true,
  })

  if (!page) return null

  const typedSlugs = new Set<DraftPreviewPageContent["kind"]>([
    "home",
    "performances",
    "videos",
    "photos",
    "history",
  ])
  const kind = typedSlugs.has(page.page.slug as DraftPreviewPageContent["kind"])
    ? (page.page.slug as DraftPreviewPageContent["kind"])
    : "generic"

  return {
    kind,
    page: contentPageFromGraph(page.page),
    graph: page,
  }
}

async function loadVideoArchiveUncached() {
  const page = await loadVideoPage()
  const recordings = page?.libraryVideos ?? []

  if (!recordings.length) return null

  return recordings
}

async function loadPhotoPageUncached(): Promise<PhotoPageContent | null> {
  const page = await loadGraphPage("photos")
  if (!page) return null

  const photos = sectionItems(page, "photos-gallery")
    .map((item) => photoFromEntity(item.entity))
    .filter((photo): photo is PhotoArchiveItem => Boolean(photo))

  return {
    page: contentPageFromGraph(page.page),
    sections: page.sections.map((section) => contentSectionFromGraph(section)),
    photos,
  }
}

async function loadPhotoArchiveUncached() {
  const page = await loadPhotoPage()
  return page?.photos.length ? page.photos : null
}

async function loadHistoryPageUncached(): Promise<HistoryPageContent | null> {
  const page = await loadGraphPage("history")
  if (!page) return null

  const milestones = sectionItems(page, "history-timeline")
    .map((item) => historyFromEntity(item.entity))
    .filter((item): item is HistoryMilestoneItem => Boolean(item))

  return {
    page: contentPageFromGraph(page.page),
    sections: page.sections.map((section) => contentSectionFromGraph(section)),
    milestones: milestones.sort((left, right) => left.order - right.order),
  }
}

async function loadHistoryArchiveUncached() {
  const page = await loadHistoryPage()
  return page?.milestones.length ? page.milestones : null
}

const publicContentCacheOptions = {
  tags: [PUBLIC_CONTENT_CACHE_TAG],
  revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
}

export const loadSiteChrome = unstable_cache(
  loadSiteChromeUncached,
  ["public-content", "site-chrome"],
  publicContentCacheOptions,
)

export const loadHomeCuration = unstable_cache(
  loadHomeCurationUncached,
  ["public-content", "home-curation"],
  publicContentCacheOptions,
)

export const loadPerformanceArchive = unstable_cache(
  loadPerformanceArchiveUncached,
  ["public-content", "performance-archive"],
  publicContentCacheOptions,
)

export const loadPerformancePlaylists = unstable_cache(
  loadPerformancePlaylistsUncached,
  ["public-content", "performance-playlists"],
  publicContentCacheOptions,
)

export const loadPerformancePage = unstable_cache(
  loadPerformancePageUncached,
  ["public-content", "performance-page"],
  publicContentCacheOptions,
)

export const loadPerformanceUpdates = unstable_cache(
  loadPerformanceUpdatesUncached,
  ["public-content", "performance-updates"],
  publicContentCacheOptions,
)

export const loadVideoPage = unstable_cache(
  loadVideoPageUncached,
  ["public-content", "video-page"],
  publicContentCacheOptions,
)

export const loadVideoArchive = unstable_cache(
  loadVideoArchiveUncached,
  ["public-content", "video-archive"],
  publicContentCacheOptions,
)

export const loadPhotoPage = unstable_cache(
  loadPhotoPageUncached,
  ["public-content", "photo-page"],
  publicContentCacheOptions,
)

export const loadPhotoArchive = unstable_cache(
  loadPhotoArchiveUncached,
  ["public-content", "photo-archive"],
  publicContentCacheOptions,
)

export const loadHistoryPage = unstable_cache(
  loadHistoryPageUncached,
  ["public-content", "history-page"],
  publicContentCacheOptions,
)

export const loadHistoryArchive = unstable_cache(
  loadHistoryArchiveUncached,
  ["public-content", "history-archive"],
  publicContentCacheOptions,
)
