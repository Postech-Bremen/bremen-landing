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

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  CmsContentDetail,
  CmsSectionEntityRelation,
} from "@/lib/cms/content"
import type { CmsFieldDefinition } from "@/lib/cms/schema-registry"
import type { Json } from "@/lib/supabase/types"

type CmsEntityDetail = Extract<CmsContentDetail, { kind: "entity" }>
type CmsSectionDetail = Extract<CmsContentDetail, { kind: "section" }>

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
}: {
  formId: string
  detail: CmsSectionDetail
  fields: CmsFieldDefinition[]
  sectionEntities: CmsSectionEntityRelation[]
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
      <SectionPreviewCard
        sectionKey={detail.row.key}
        sectionType={detail.row.section_type}
        schemaLabel={detail.schemaLabel}
        snapshot={deferredSnapshot}
        sectionEntities={sectionEntities}
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
