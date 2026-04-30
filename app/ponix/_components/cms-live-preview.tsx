"use client"

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"

import { HistoryTimelineSurface } from "@/components/history-section"
import { HomeSection } from "@/components/home-section"
import type {
  HomeOverview,
  HomeSectionConfig,
  HomeStatCard,
  HomeVideo,
} from "@/components/home-section"
import {
  EditorialSectionHead,
  PageSection,
} from "@/components/editorial"
import {
  PlaylistCarousel,
  SeasonIndex,
  StageMoments,
  PerformanceUpdateCard,
} from "@/components/performances-section"
import { PhotoGallerySurface } from "@/components/photos-section"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FeaturedVideosSurface,
  VideoLibrarySurface,
} from "@/components/videos-section"
import type {
  ContentSectionConfig,
  HistoryMilestoneItem,
  PerformancePlaylistItem,
  PerformanceTypeLabel,
  PerformanceUpdateItem,
  PerformanceUpdateKind,
  PhotoArchiveItem,
} from "@/lib/data/content-graph"
import { type EventKey, type Video } from "@/lib/data/videos"
import type {
  CmsContentDetail,
  CmsEntityRelation,
  CmsSectionEntityRelation,
} from "@/lib/cms/content"
import type { CmsFieldDefinition } from "@/lib/cms/schema-registry"
import type { Json } from "@/lib/supabase/types"

type CmsEntityDetail = Extract<CmsContentDetail, { kind: "entity" }>
type CmsSectionDetail = Extract<CmsContentDetail, { kind: "section" }>
type PreviewLinkedEntity = NonNullable<CmsSectionEntityRelation["entity"]>

type PreviewValue = {
  key: string
  label: string
  value: unknown
  type: CmsFieldDefinition["type"]
}

type EntityPreviewSnapshot = {
  title: string
  subtitle: string
  summary: string
  thumbnailUrl: string
  published: boolean
  values: PreviewValue[]
}

type SectionPreviewSnapshot = {
  eyebrow: string
  title: string
  subtitle: string
  body: string
  actionLabel: string
  actionHref: string
  published: boolean
  values: PreviewValue[]
}

const primaryPreviewKeys = new Set([
  "eyebrow",
  "title",
  "subtitle",
  "summary",
  "thumbnail_url",
  "published",
  "body",
  "action_label",
  "href",
])

export function CmsEntityLivePreview({
  formId,
  detail,
  fields,
}: {
  formId: string
  detail: CmsEntityDetail
  fields: CmsFieldDefinition[]
}) {
  const fileRef = useRef<File | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const initialSnapshot = useMemo(
    () => entitySnapshotFromDetail(detail, fields),
    [detail, fields],
  )
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const deferredSnapshot = useDeferredValue(snapshot)

  useEffect(() => {
    const form = document.getElementById(formId)

    if (!(form instanceof HTMLFormElement)) {
      return
    }

    const update = () => {
      const nextSnapshot = entitySnapshotFromForm({
        detail,
        fields,
        form,
        currentObjectUrl: objectUrlRef.current,
        currentFile: fileRef.current,
        setObjectUrl: (url) => {
          objectUrlRef.current = url
        },
        setFile: (file) => {
          fileRef.current = file
        },
      })

      startTransition(() => {
        setSnapshot(nextSnapshot)
      })
    }

    update()
    form.addEventListener("input", update)
    form.addEventListener("change", update)

    return () => {
      form.removeEventListener("input", update)
      form.removeEventListener("change", update)

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [detail, fields, formId])

  return (
    <PreviewShell eyebrow="Live preview" title="Entity card">
      <EntityPreviewCard
        schemaLabel={detail.schemaLabel}
        entityType={detail.row.entity_type}
        snapshot={deferredSnapshot}
      />
    </PreviewShell>
  )
}

export function CmsSectionLivePreview({
  formId,
  detail,
  fields,
  sectionEntities,
  entityRelations,
}: {
  formId: string
  detail: CmsSectionDetail
  fields: CmsFieldDefinition[]
  sectionEntities: CmsSectionEntityRelation[]
  entityRelations: CmsEntityRelation[]
}) {
  const initialSnapshot = useMemo(
    () => sectionSnapshotFromDetail(detail, fields),
    [detail, fields],
  )
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const deferredSnapshot = useDeferredValue(snapshot)

  useEffect(() => {
    const form = document.getElementById(formId)

    if (!(form instanceof HTMLFormElement)) {
      return
    }

    const update = () => {
      const nextSnapshot = sectionSnapshotFromForm(detail, fields, form)

      startTransition(() => {
        setSnapshot(nextSnapshot)
      })
    }

    update()
    form.addEventListener("input", update)
    form.addEventListener("change", update)

    return () => {
      form.removeEventListener("input", update)
      form.removeEventListener("change", update)
    }
  }, [detail, fields, formId])

  return (
    <PreviewShell eyebrow="Live preview" title="Section surface">
      <PublicSectionPreview
        detail={detail}
        snapshot={deferredSnapshot}
        sectionEntities={sectionEntities}
        entityRelations={entityRelations}
        fallback={
          <SectionPreviewCard
            sectionKey={detail.row.key}
            sectionType={detail.row.section_type}
            schemaLabel={detail.schemaLabel}
            snapshot={deferredSnapshot}
            sectionEntities={sectionEntities}
          />
        }
      />
    </PreviewShell>
  )
}

function PreviewShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="xl:sticky xl:top-24">
      <Card className="overflow-hidden rounded-md bg-card/95 shadow-xl">
        <CardHeader className="border-b">
          <p className="caps text-muted-foreground">{eyebrow}</p>
          <CardTitle className="font-serif text-3xl italic">{title}</CardTitle>
          <CardDescription>
            Common CMS preview rendered from the current form state.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-muted/25 p-4">{children}</CardContent>
      </Card>
    </div>
  )
}

function PublicSectionPreview({
  detail,
  snapshot,
  sectionEntities,
  entityRelations,
  fallback,
}: {
  detail: CmsSectionDetail
  snapshot: SectionPreviewSnapshot
  sectionEntities: CmsSectionEntityRelation[]
  entityRelations: CmsEntityRelation[]
  fallback: ReactNode
}) {
  const section = contentSectionFromPreview(detail, snapshot)
  const videos = sectionEntities
    .map((relation) => videoFromRelation(relation))
    .filter((item): item is Video => Boolean(item))
  const playlists = sectionEntities
    .map((relation) => performancePlaylistFromRelation(relation, entityRelations))
    .filter((item): item is PerformancePlaylistItem => Boolean(item))
  const directPhotos = sectionEntities
    .map((relation) => photoFromRelation(relation))
    .filter((item): item is PhotoArchiveItem => Boolean(item))
  const photos = uniqueById([
    ...directPhotos,
    ...playlists.flatMap((playlist) => playlist.photos),
  ])
  const milestones = sectionEntities
    .map((relation) => historyMilestoneFromRelation(relation))
    .filter((item): item is HistoryMilestoneItem => Boolean(item))
    .sort((left, right) => left.order - right.order)
  const directUpdates = sectionEntities
    .map((relation) => performanceUpdateFromRelation(relation))
    .filter((item): item is PerformanceUpdateItem => Boolean(item))
  const updates = uniqueById([
    ...directUpdates,
    ...playlists.flatMap((playlist) => playlist.updates),
  ])
    .sort((left, right) => right.isoDate.localeCompare(left.isoDate))

  if (detail.row.key.startsWith("home-")) {
    return (
      <PublicPreviewCanvas>
        <HomeSection
          overview={homeOverviewFromRelations(section, sectionEntities, entityRelations)}
        />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "performances-archive" && playlists.length) {
    return (
      <PublicPreviewCanvas>
        <PlaylistCarousel
          playlists={playlists.filter((playlist) => playlist.recordingCount > 0)}
          section={section}
        />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "performances-season-index" && playlists.length) {
    return (
      <PublicPreviewCanvas>
        <SeasonIndex playlists={playlists} section={section} />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "performances-stage-moments" && photos.length) {
    return (
      <PublicPreviewCanvas>
        <StageMoments photos={photos} section={section} />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "performances-updates" && updates.length) {
    return (
      <PublicPreviewCanvas>
        <PerformanceUpdatesSurface section={section} updates={updates} />
      </PublicPreviewCanvas>
    )
  }

  if (
    (detail.row.key === "videos-featured" || detail.row.key === "videos-popular") &&
    videos.length
  ) {
    const featured = videos.find((video) => video.highlight) ?? videos[0]

    return (
      <PublicPreviewCanvas>
        <FeaturedVideosSurface
          featuredSection={section}
          popularSection={section}
          featured={featured}
          picks={videos.filter((video) => video.id !== featured.id).slice(0, 3)}
        />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "videos-library" && videos.length) {
    return (
      <PublicPreviewCanvas>
        <VideoLibrarySurface section={section} videos={videos} />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "photos-gallery" && photos.length) {
    return (
      <PublicPreviewCanvas>
        <PhotoGallerySurface gallerySection={section} photos={photos} />
      </PublicPreviewCanvas>
    )
  }

  if (detail.row.key === "history-timeline" && milestones.length) {
    return (
      <PublicPreviewCanvas>
        <HistoryTimelineSurface
          timelineSection={section}
          milestones={milestones}
        />
      </PublicPreviewCanvas>
    )
  }

  return fallback
}

function PublicPreviewCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border bg-background">
      {children}
    </div>
  )
}

function PerformanceUpdatesSurface({
  section,
  updates,
}: {
  section: ContentSectionConfig
  updates: PerformanceUpdateItem[]
}) {
  return (
    <PageSection className="p-6 md:p-8">
      <EditorialSectionHead
        eyebrow={section.eyebrow ?? ""}
        en={section.title ?? ""}
        kr={section.subtitle ?? ""}
      />
      <ul className="grid gap-5 md:grid-cols-2">
        {updates.slice(0, 4).map((update, index) => (
          <PerformanceUpdateCard
            key={update.id}
            update={update}
            index={index}
          />
        ))}
      </ul>
    </PageSection>
  )
}

function EntityPreviewCard({
  entityType,
  schemaLabel,
  snapshot,
}: {
  entityType: string
  schemaLabel: string
  snapshot: EntityPreviewSnapshot
}) {
  return (
    <article className="overflow-hidden rounded-md border bg-background shadow-sm">
      {snapshot.thumbnailUrl && (
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={snapshot.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant={snapshot.published ? "default" : "outline"}>
            {snapshot.published ? "Published" : "Draft"}
          </Badge>
          <Badge variant="secondary">{schemaLabel}</Badge>
          <Badge variant="outline" className="font-mono">
            {entityType}
          </Badge>
        </div>
        <div>
          <h2 className="font-serif text-4xl italic leading-none">
            {snapshot.title || "Untitled entity"}
          </h2>
          {snapshot.subtitle && (
            <p className="mt-3 text-sm text-muted-foreground">
              {snapshot.subtitle}
            </p>
          )}
        </div>
        {snapshot.summary && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {snapshot.summary}
          </p>
        )}
        <PreviewValueList values={snapshot.values} />
      </div>
    </article>
  )
}

function SectionPreviewCard({
  sectionKey,
  sectionType,
  schemaLabel,
  snapshot,
  sectionEntities,
}: {
  sectionKey: string
  sectionType: string
  schemaLabel: string
  snapshot: SectionPreviewSnapshot
  sectionEntities: CmsSectionEntityRelation[]
}) {
  return (
    <section className="space-y-5 rounded-md border bg-background p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <Badge variant={snapshot.published ? "default" : "outline"}>
          {snapshot.published ? "Published" : "Draft"}
        </Badge>
        <Badge variant="secondary">{schemaLabel}</Badge>
        <Badge variant="outline" className="font-mono">
          {sectionType}
        </Badge>
      </div>
      <div>
        {snapshot.eyebrow && (
          <p className="caps mb-4 text-muted-foreground">{snapshot.eyebrow}</p>
        )}
        <h2 className="font-serif text-5xl italic leading-none">
          {snapshot.title || sectionKey}
        </h2>
        {snapshot.subtitle && (
          <p className="mt-3 text-lg text-muted-foreground">
            {snapshot.subtitle}
          </p>
        )}
      </div>
      {snapshot.body && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {snapshot.body}
        </p>
      )}
      {snapshot.actionLabel && (
        <div className="inline-flex rounded-full border px-4 py-2 text-sm">
          {snapshot.actionLabel}
          {snapshot.actionHref && (
            <span className="ml-2 text-muted-foreground">-&gt;</span>
          )}
        </div>
      )}
      <PreviewValueList values={snapshot.values} />
      <LinkedEntityPreviewList relations={sectionEntities} />
    </section>
  )
}

function PreviewValueList({ values }: { values: PreviewValue[] }) {
  const visibleValues = values.filter((item) => hasPreviewValue(item.value))

  if (visibleValues.length === 0) {
    return null
  }

  return (
    <dl className="grid gap-2 border-t pt-4 text-sm">
      {visibleValues.slice(0, 8).map((item) => (
        <div
          key={item.key}
          className="grid gap-1 rounded-md bg-muted/35 p-3 sm:grid-cols-[7rem_minmax(0,1fr)]"
        >
          <dt className="caps text-muted-foreground">{item.label}</dt>
          <dd className="break-words">{formatPreviewValue(item.value, item.type)}</dd>
        </div>
      ))}
    </dl>
  )
}

function LinkedEntityPreviewList({
  relations,
}: {
  relations: CmsSectionEntityRelation[]
}) {
  if (relations.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No linked entities yet.
      </div>
    )
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-4">
        <p className="caps text-muted-foreground">Linked entities</p>
        <p className="font-mono text-xs text-muted-foreground">
          {relations.length}
        </p>
      </div>
      <div className="grid gap-3">
        {relations.slice(0, 6).map((relation) => (
          <div
            key={relation.id}
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-md border bg-card p-3"
          >
            {relation.entity?.thumbnailUrl ? (
              <div className="h-16 overflow-hidden rounded-sm bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={relation.entity.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="grid h-16 place-items-center rounded-sm bg-muted text-lg font-serif italic text-muted-foreground">
                {relation.entity?.title?.slice(0, 1) ?? "E"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium">
                {relation.entity?.title ?? relation.entityId}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {relation.entity?.subtitle ?? relation.entity?.schemaLabel ?? relation.slot}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="rounded-full text-[0.65rem]">
                  {relation.slot}
                </Badge>
                <Badge variant="secondary" className="rounded-full text-[0.65rem]">
                  {relation.sortOrder}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function entitySnapshotFromDetail(
  detail: CmsEntityDetail,
  fields: CmsFieldDefinition[],
): EntityPreviewSnapshot {
  return {
    title: detail.row.title,
    subtitle: detail.row.subtitle ?? "",
    summary: detail.row.summary ?? "",
    thumbnailUrl: detail.row.thumbnail_url ?? "",
    published: detail.row.published,
    values: previewValuesFromDetail(fields, detail.row.data, {
      slug: detail.row.slug,
      sort_at: detail.row.sort_at,
    }),
  }
}

function entitySnapshotFromForm({
  detail,
  fields,
  form,
  currentObjectUrl,
  currentFile,
  setObjectUrl,
  setFile,
}: {
  detail: CmsEntityDetail
  fields: CmsFieldDefinition[]
  form: HTMLFormElement
  currentObjectUrl: string | null
  currentFile: File | null
  setObjectUrl: (url: string | null) => void
  setFile: (file: File | null) => void
}): EntityPreviewSnapshot {
  const formData = new FormData(form)
  const fileInput = form.elements.namedItem("thumbnail_file")
  let filePreviewUrl = currentObjectUrl

  if (fileInput instanceof HTMLInputElement) {
    const nextFile = fileInput.files?.[0] ?? null

    if (nextFile !== currentFile) {
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl)
      }

      filePreviewUrl = nextFile ? URL.createObjectURL(nextFile) : null
      setObjectUrl(filePreviewUrl)
      setFile(nextFile)
    }
  }

  const base = entitySnapshotFromDetail(detail, fields)
  const values = previewValuesFromForm(fields, formData)

  return {
    ...base,
    title: textFormValue(formData, "cms:column:title", base.title),
    subtitle: textFormValue(formData, "cms:column:subtitle", base.subtitle),
    summary: textFormValue(formData, "cms:column:summary", base.summary),
    thumbnailUrl:
      filePreviewUrl ??
      textFormValue(formData, "cms:column:thumbnail_url", base.thumbnailUrl),
    published: booleanFormValue(formData, "cms:column:published", base.published),
    values,
  }
}

function sectionSnapshotFromDetail(
  detail: CmsSectionDetail,
  fields: CmsFieldDefinition[],
): SectionPreviewSnapshot {
  const props = jsonObject(detail.row.props)

  return {
    eyebrow: detail.row.eyebrow ?? "",
    title: detail.row.title ?? detail.row.key,
    subtitle: detail.row.subtitle ?? "",
    body: textValue(props.body),
    actionLabel: textValue(props.action_label),
    actionHref: textValue(props.href),
    published: detail.row.published,
    values: previewValuesFromDetail(fields, detail.row.props, {}),
  }
}

function sectionSnapshotFromForm(
  detail: CmsSectionDetail,
  fields: CmsFieldDefinition[],
  form: HTMLFormElement,
): SectionPreviewSnapshot {
  const formData = new FormData(form)
  const base = sectionSnapshotFromDetail(detail, fields)
  const values = previewValuesFromForm(fields, formData)

  return {
    ...base,
    eyebrow: textFormValue(formData, "cms:column:eyebrow", base.eyebrow),
    title: textFormValue(formData, "cms:column:title", base.title),
    subtitle: textFormValue(formData, "cms:column:subtitle", base.subtitle),
    body: textFormValue(formData, "cms:props:body", base.body),
    actionLabel: textFormValue(
      formData,
      "cms:props:action_label",
      base.actionLabel,
    ),
    actionHref: textFormValue(formData, "cms:props:href", base.actionHref),
    published: booleanFormValue(formData, "cms:column:published", base.published),
    values,
  }
}

function previewValuesFromDetail(
  fields: CmsFieldDefinition[],
  sourceJson: Json,
  columnValues: Record<string, unknown>,
): PreviewValue[] {
  const sourceObject = jsonObject(sourceJson)

  return fields
    .filter((field) => isSupplementalPreviewField(field))
    .map((field) => ({
      key: `${field.source}:${field.key}`,
      label: field.label,
      type: field.type,
      value:
        field.source === "column" ? columnValues[field.key] : sourceObject[field.key],
    }))
}

function previewValuesFromForm(
  fields: CmsFieldDefinition[],
  formData: FormData,
): PreviewValue[] {
  return fields
    .filter((field) => isSupplementalPreviewField(field))
    .map((field) => ({
      key: `${field.source}:${field.key}`,
      label: field.label,
      type: field.type,
      value: fieldValueFromForm(field, formData),
    }))
}

function isSupplementalPreviewField(field: CmsFieldDefinition) {
  if (field.readOnly) {
    return false
  }

  return !primaryPreviewKeys.has(field.key)
}

function fieldValueFromForm(field: CmsFieldDefinition, formData: FormData) {
  const value = formData.get(`cms:${field.source}:${field.key}`)

  if (field.type === "boolean") {
    return formData.getAll(`cms:${field.source}:${field.key}`).includes("true")
  }

  if (typeof value !== "string") {
    return ""
  }

  if (field.type === "number") {
    return value === "" ? "" : Number(value)
  }

  if (field.type === "string-list") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (field.type === "json") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  return value
}

function textFormValue(formData: FormData, name: string, fallback: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value : fallback
}

function booleanFormValue(formData: FormData, name: string, fallback: boolean) {
  if (!formData.has(name)) {
    return fallback
  }

  return formData.getAll(name).includes("true")
}

function jsonObject(value: Json): Record<string, Json> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, Json>
}

function textValue(value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function hasPreviewValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return true
}

function formatPreviewValue(
  value: unknown,
  type: CmsFieldDefinition["type"],
) {
  if (Array.isArray(value)) {
    return value.join(", ")
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value)
  }

  if ((type === "date" || type === "datetime") && typeof value === "string") {
    return value.replace("T", " ")
  }

  return String(value)
}

function contentSectionFromPreview(
  detail: CmsSectionDetail,
  snapshot: SectionPreviewSnapshot,
): ContentSectionConfig {
  const props = jsonObject(detail.row.props)
  const values = new Map(snapshot.values.map((item) => [item.key, item.value]))

  return {
    key: detail.row.key,
    sectionType: detail.row.section_type,
    eyebrow: snapshot.eyebrow || null,
    title: snapshot.title || null,
    subtitle: snapshot.subtitle || null,
    body: snapshot.body || null,
    href: snapshot.actionHref || null,
    actionLabel: snapshot.actionLabel || null,
    filters:
      stringArray(values.get("props:filters")) ||
      stringArray(props.filters) ||
      [],
    accentEyebrow:
      stringOrNull(values.get("props:eyebrow_accent")) ??
      stringOrNull(props.eyebrow_accent),
    accentTitle:
      stringOrNull(values.get("props:title_accent")) ??
      stringOrNull(props.title_accent),
    accentBody:
      stringOrNull(values.get("props:body_accent")) ??
      stringOrNull(props.body_accent),
    accentCaption:
      booleanOrNull(values.get("props:feature_caption_accent")) ??
      booleanOrNull(props.feature_caption_accent) ??
      false,
  }
}

function homeOverviewFromRelations(
  section: ContentSectionConfig,
  relations: CmsSectionEntityRelation[],
  entityRelations: CmsEntityRelation[],
): HomeOverview {
  const videos = relations
    .map((relation) => homeVideoFromRelation(relation))
    .filter((item): item is HomeVideo => Boolean(item))
  const statCards = relations
    .map((relation) => homeStatCardFromRelation(relation))
    .filter((item): item is HomeStatCard => Boolean(item))
  const activities = relations
    .map((relation) => homeActivityFromRelation(relation))
    .filter((item): item is HomeOverview["activities"][number] => Boolean(item))
  const upcomingEvents = relations
    .map((relation) => performancePlaylistFromRelation(relation, entityRelations))
    .filter((item): item is PerformancePlaylistItem => Boolean(item))
    .slice(0, 2)
    .map((performance) => ({
      date: performance.date,
      year: performance.year,
      title: performance.title,
      location: performance.venue,
      time: "TBA",
    }))
  const featuredVideo = videos[0] ?? placeholderHomeVideo(section)

  return {
    sections: [homeSectionConfig(section)],
    activeYears: 0,
    performanceCount: upcomingEvents.length,
    videoCount: videos.length,
    photoCount: 0,
    memberCount: 0,
    activeMemberCount: 0,
    totalViews: videos.reduce((sum, video) => sum + video.views, 0),
    statCards,
    featuredVideo,
    stageHighlights: videos,
    upcomingEvents,
    activities,
  }
}

function homeSectionConfig(section: ContentSectionConfig): HomeSectionConfig {
  return {
    key: section.key,
    sectionType: section.sectionType,
    eyebrow: section.eyebrow ?? undefined,
    title: section.title ?? undefined,
    subtitle: section.subtitle ?? undefined,
    body: section.body ?? undefined,
    href: section.href ?? undefined,
    actionLabel: section.actionLabel ?? undefined,
    accentEyebrow: section.accentEyebrow ?? undefined,
    accentTitle: section.accentTitle ?? undefined,
    accentBody: section.accentBody ?? undefined,
    accentCaption: section.accentCaption,
  }
}

function placeholderHomeVideo(section: ContentSectionConfig): HomeVideo {
  return {
    id: "preview",
    title: section.title ?? "Preview video",
    duration: "",
    views: 0,
    caption: section.eyebrow ?? undefined,
  }
}

function linkedEntity(relation: CmsSectionEntityRelation) {
  return relation.entity
}

function relationData(relation: CmsSectionEntityRelation) {
  const entity = linkedEntity(relation)
  return entity ? entityData(entity) : {}
}

function entityData(entity: PreviewLinkedEntity) {
  return jsonObject(entity.data)
}

function relationProps(relation: CmsSectionEntityRelation) {
  return jsonObject(relation.props)
}

function homeVideoFromRelation(relation: CmsSectionEntityRelation): HomeVideo | null {
  const video = videoFromRelation(relation)
  if (!video) return null

  const props = relationProps(relation)

  return {
    id: video.id,
    title: video.song || video.raw_title,
    thumbnailUrl: video.thumbnailUrl,
    watchUrl: video.watchUrl,
    artist: video.artist,
    song: video.song,
    team: video.team,
    duration: video.duration,
    views: video.views,
    caption: stringOrUndefined(props.caption),
  }
}

function homeStatCardFromRelation(
  relation: CmsSectionEntityRelation,
): HomeStatCard | null {
  const entity = linkedEntity(relation)
  if (!entity || entity.entityType !== "stat") return null

  const data = relationData(relation)
  const base = {
    label: entity.title,
    value: displayString(data.value) ?? "0",
    unit: stringOrNull(data.unit) ?? "",
    detail: entity.summary ?? stringOrNull(data.detail) ?? "",
    tilt: stringOrNull(data.tilt) ?? "0deg",
  }
  const type = stringOrNull(data.card_type)

  if (type === "image") {
    return {
      ...base,
      type: "image",
      thumbnailUrl: entity.thumbnailUrl ?? undefined,
    }
  }

  if (type === "color") {
    return {
      ...base,
      type: "color",
    }
  }

  return {
    ...base,
    type: "text",
  }
}

function homeActivityFromRelation(
  relation: CmsSectionEntityRelation,
): HomeOverview["activities"][number] | null {
  const entity = linkedEntity(relation)
  if (!entity || entity.entityType !== "activity") return null

  const data = relationData(relation)

  return {
    id: entity.id,
    title: entity.title,
    kr: entity.subtitle ?? stringOrNull(data.kr) ?? "",
    description: entity.summary ?? stringOrNull(data.description) ?? "",
    schedule: stringOrNull(data.schedule) ?? "",
    variant: stringOrNull(data.variant) === "color" ? "color" : "text",
    tilt: stringOrNull(data.tilt) ?? "0deg",
  }
}

function videoFromRelation(relation: CmsSectionEntityRelation): Video | null {
  const entity = linkedEntity(relation)
  return entity ? videoFromEntity(entity) : null
}

function videoFromEntity(entity: PreviewLinkedEntity): Video | null {
  if (entity.entityType !== "video") return null

  const data = entityData(entity)
  const youtubeId = stringOrNull(data.youtube_id)
  if (!youtubeId) return null

  const parsed = parseVideoTitle(entity.title)

  return {
    id: youtubeId,
    thumbnailUrl: entity.thumbnailUrl ?? undefined,
    watchUrl: stringOrUndefined(data.youtube_url),
    artist: stringOrUndefined(data.artist) ?? parsed.artist,
    song: stringOrUndefined(data.song) ?? parsed.song,
    raw_title: entity.title,
    team: stringOrUndefined(data.team) ?? parsed.team,
    event: (stringOrNull(data.event_slug) ?? "recording") as EventKey,
    eventLabel: stringOrUndefined(data.event_title),
    eventOrder: numberOrUndefined(data.source_index),
    duration: stringOrNull(data.duration) ?? "",
    views: numberOrNull(data.views) ?? 0,
    highlight: booleanOrNull(data.is_highlight) ?? false,
  }
}

function performancePlaylistFromRelation(
  relation: CmsSectionEntityRelation,
  entityRelations: CmsEntityRelation[],
): PerformancePlaylistItem | null {
  const entity = linkedEntity(relation)
  if (!entity || entity.entityType !== "performance") return null

  const data = entityData(entity)
  const isoDate = stringOrNull(data.event_date) ?? entity.sortAt.slice(0, 10)
  const year = isoDate.slice(0, 4)
  if (!year) return null

  const related = entityRelations.filter((item) => item.fromEntityId === entity.id)
  const videos = related
    .map((item) => item.toEntity)
    .filter((item): item is PreviewLinkedEntity => Boolean(item))
    .map((item) => videoFromEntity(item))
    .filter((item): item is Video => Boolean(item))
  const photos = related
    .map((item) => item.toEntity)
    .filter((item): item is PreviewLinkedEntity => Boolean(item))
    .map((item) => photoFromEntity(item))
    .filter((item): item is PhotoArchiveItem => Boolean(item))
  const updates = related
    .map((item) => item.toEntity)
    .filter((item): item is PreviewLinkedEntity => Boolean(item))
    .map((item) => performanceUpdateFromEntity(item))
    .filter((item): item is PerformanceUpdateItem => Boolean(item))
  const recordingCount = videos.length || numberOrNull(data.recording_count) || 0
  const photoCount = photos.length || numberOrNull(data.photo_count) || 0
  const postCount = updates.length || numberOrNull(data.post_count) || 0

  return {
    id: entity.id,
    slug: entity.slug ?? entity.id,
    title: entity.title,
    subtitle: entity.subtitle,
    date: stringOrNull(data.display_date) ?? formatMonthDay(isoDate),
    year,
    isoDate,
    venue: stringOrNull(data.venue) ?? "",
    type: performanceTypeLabel(stringOrNull(data.type)),
    thumbnailUrl: entity.thumbnailUrl,
    recordingCount,
    photoCount,
    postCount,
    coverUrl:
      entity.thumbnailUrl ??
      videos[0]?.thumbnailUrl ??
      photos[0]?.thumbnailUrl ??
      updates[0]?.thumbnailUrl ??
      null,
    videos,
    photos,
    updates,
  }
}

function performanceUpdateFromRelation(
  relation: CmsSectionEntityRelation,
): PerformanceUpdateItem | null {
  const entity = linkedEntity(relation)
  return entity ? performanceUpdateFromEntity(entity) : null
}

function performanceUpdateFromEntity(
  entity: PreviewLinkedEntity,
): PerformanceUpdateItem | null {
  if (entity.entityType !== "post") return null

  const data = entityData(entity)
  const isoDate = stringOrNull(data.taken_at) ?? entity.sortAt.slice(0, 10)

  return {
    id: entity.id,
    title: entity.title,
    summary: entity.summary,
    date: stringOrNull(data.display_date) ?? formatMonthDay(isoDate),
    isoDate,
    kind: performanceUpdateKind(stringOrNull(data.content_kind)),
    eventTitle: stringOrNull(data.event_title),
    sourceUrl: stringOrNull(data.source_url),
    thumbnailUrl: entity.thumbnailUrl,
  }
}

function photoFromRelation(relation: CmsSectionEntityRelation): PhotoArchiveItem | null {
  const entity = linkedEntity(relation)
  return entity ? photoFromEntity(entity) : null
}

function photoFromEntity(entity: PreviewLinkedEntity): PhotoArchiveItem | null {
  if (entity.entityType !== "photo") return null

  const data = entityData(entity)
  if (booleanOrNull(data.gallery_include) === false) return null

  return {
    id: entity.id,
    title: entity.title,
    caption: entity.summary,
    category: photoCategoryLabel(stringOrNull(data.category)),
    aspect: stringOrNull(data.aspect) === "portrait" ? "portrait" : "landscape",
    thumbnailUrl: entity.thumbnailUrl,
  }
}

function historyMilestoneFromRelation(
  relation: CmsSectionEntityRelation,
): HistoryMilestoneItem | null {
  const entity = linkedEntity(relation)
  if (!entity || entity.entityType !== "history_milestone") return null

  const data = relationData(relation)
  const year = stringOrNull(data.year) ?? entity.title.match(/\d{4}/)?.[0]
  if (!year) return null

  return {
    id: entity.id,
    title: entity.title,
    summary: entity.summary,
    year,
    order: numberOrNull(data.display_order) ?? 0,
  }
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

function formatMonthDay(isoDate: string) {
  const [, month, day] = isoDate.split("-")
  return month && day ? `${month}/${day}` : isoDate
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

function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()]
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return null

  return value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0,
  )
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : null
}

function stringOrUndefined(value: unknown) {
  return stringOrNull(value) ?? undefined
}

function displayString(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return null
}

function numberOrNull(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function numberOrUndefined(value: unknown) {
  return numberOrNull(value) ?? undefined
}

function booleanOrNull(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value === "true"
  return null
}
