import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, Database, Layers3, PencilLine } from "lucide-react"

import { CmsEntityPicker } from "@/app/ponix/_components/cms-entity-picker"
import { renderFieldInput } from "@/app/ponix/_components/cms-section-form"
import {
  CmsSaveNotice,
  CmsSubmitButton,
} from "@/app/ponix/_components/cms-save-controls"
import { addSectionEntityRelationAction } from "@/app/ponix/relations/actions"
import { updateCmsSectionAction } from "@/app/ponix/sections/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsRelationEditorOptions,
  loadCmsSectionDetail,
  loadCmsSectionRelations,
  type CmsContentDetail,
  type CmsRelationEditorOptions,
  type CmsSectionRelationContext,
} from "@/lib/cms/content"
import {
  cmsFieldInputName,
  getEditableSectionFields,
  getSectionFieldValue,
} from "@/lib/cms/section-editor"
import { loadDraftCompositionPage } from "@/lib/data/content-graph"
import type { GraphSection } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "PONIX Page Composer | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPageComposerPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixPageComposerPage({
  params,
  searchParams,
}: PonixPageComposerPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])

  await requireCmsAdmin(`/ponix/pages/${id}/compose`)
  const preview = await loadDraftCompositionPage(id)

  if (!preview) {
    notFound()
  }

  const selectedParam = searchValue(search?.section)
  const selectedSection =
    preview.graph.sections.find((section) => section.key === selectedParam) ??
    preview.graph.sections[0] ??
    null
  const selectedKey = selectedSection?.key ?? null
  const [sectionDetail, sectionRelations, relationOptions] = selectedSection
    ? await Promise.all([
        loadCmsSectionDetail(selectedSection.id),
        loadCmsSectionRelations(selectedSection.id),
        loadCmsRelationEditorOptions(),
      ])
    : [null, null, null]
  const composeUrl = selectedKey ? composeHref(id, selectedKey) : `/ponix/pages/${id}/compose`

  return (
    <section className="mx-auto flex w-full max-w-[104rem] flex-col gap-5">
      <ComposerHeader
        pageId={id}
        title={preview.page.title}
        slug={preview.page.slug}
        kind={preview.kind}
        sectionCount={preview.graph.sections.length}
      />

      <div className="grid min-h-[calc(100svh-13rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="caps text-muted-foreground">Live canvas</p>
                <CardTitle className="font-serif text-3xl italic md:text-4xl">
                  Edit in context
                </CardTitle>
                <CardDescription>
                  실제 사이트 화면을 보며 섹션을 고르고, 오른쪽에서 바로 정리합니다.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-fit rounded-full">
                <Link href={`/ponix/preview/pages/${id}`}>
                  Preview route
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
            <SectionRail
              pageId={id}
              sections={preview.graph.sections}
              selectedKey={selectedKey}
            />
          </CardHeader>
          <CardContent className="bg-[#f7f1e8] p-0">
            <iframe
              title={`${preview.page.title} live canvas`}
              src={canvasHref(id, selectedKey)}
              className="h-[calc(100svh-18rem)] min-h-[42rem] w-full border-0 bg-background"
            />
          </CardContent>
        </Card>

        <SectionInspector
          pageId={id}
          pageSlug={preview.page.slug}
          section={selectedSection}
          sectionDetail={
            sectionDetail?.kind === "section" ? sectionDetail : null
          }
          relations={sectionRelations}
          relationOptions={relationOptions}
          redirectTo={composeUrl}
          saved={search?.saved === "section"}
          relationMessage={searchValue(search?.relation_message) ?? undefined}
          relationError={searchValue(search?.relation_error) ?? undefined}
        />
      </div>
    </section>
  )
}

function ComposerHeader({
  pageId,
  title,
  slug,
  kind,
  sectionCount,
}: {
  pageId: string
  title: string
  slug: string
  kind: string
  sectionCount: number
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/95 p-5 shadow-sm md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_oklch,var(--accent)_12%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--secondary)_84%,transparent),transparent_42%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="caps mb-3 text-muted-foreground">PONIX / Composer</p>
          <h1 className="font-serif text-[clamp(3rem,6vw,5.5rem)] italic leading-[0.86] tracking-tight">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full font-mono">
              /{slug}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {kind}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {sectionCount} sections
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/ponix/pages/${pageId}`}>Record</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href={`/ponix/pages/${pageId}/edit`}>Page settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function SectionRail({
  pageId,
  sections,
  selectedKey,
}: {
  pageId: string
  sections: GraphSection[]
  selectedKey: string | null
}) {
  if (!sections.length) {
    return null
  }

  return (
    <ScrollArea className="mt-5 whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {sections.map((section, index) => {
          const selected = section.key === selectedKey

          return (
            <Button
              key={section.id}
              asChild
              variant={selected ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              <Link href={composeHref(pageId, section.key)}>
                <span className="tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title ?? section.key}
              </Link>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function SectionInspector({
  pageId,
  pageSlug,
  section,
  sectionDetail,
  relations,
  relationOptions,
  redirectTo,
  saved,
  relationMessage,
  relationError,
}: {
  pageId: string
  pageSlug: string
  section: GraphSection | null
  sectionDetail: (Extract<CmsContentDetail, { kind: "section" }>) | null
  relations: CmsSectionRelationContext | null
  relationOptions: CmsRelationEditorOptions | null
  redirectTo: string
  saved: boolean
  relationMessage?: string
  relationError?: string
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-40 xl:max-h-[calc(100svh-10rem)] xl:overflow-auto xl:pr-1">
      <CmsSaveNotice
        saved={saved}
        error={relationError}
        savedDescription="선택한 섹션 정보가 저장되었습니다."
      />
      {relationMessage && (
        <CmsSaveNotice
          saved
          savedTitle="연결을 반영했습니다"
          savedDescription={relationMessage}
        />
      )}
      <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <p className="caps text-muted-foreground">선택한 섹션</p>
          <CardTitle className="font-serif text-3xl italic">
            {section ? (section.title ?? section.key) : "섹션 없음"}
          </CardTitle>
          <CardDescription>
            화면에서 고른 블록의 문구와 연결 데이터를 여기서 정리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {!section ? (
            <p className="text-sm text-muted-foreground">
              이 페이지에 연결된 섹션이 없습니다.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full font-mono">
                  {section.key}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {section.sectionType}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm">
                <MetaRow label="Page" value={`/${pageSlug}`} />
                <MetaRow label="Schema" value={section.schemaKey} mono />
                <MetaRow label="Sort" value={String(section.sortOrder)} />
                <MetaRow
                  label="Entities"
                  value={`${section.items.length} linked`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/ponix/sections/${section.id}/edit`}>
                    <PencilLine className="size-4" />
                    전체 편집
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/ponix/pages/${pageId}`}>구성 관계 보기</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {sectionDetail && (
        <SectionQuickEditCard detail={sectionDetail} redirectTo={redirectTo} />
      )}

      {section && relations && relationOptions && (
        <SectionEntityWorkspace
          section={section}
          relations={relations}
          options={relationOptions}
          redirectTo={redirectTo}
        />
      )}
    </aside>
  )
}

function SectionQuickEditCard({
  detail,
  redirectTo,
}: {
  detail: Extract<CmsContentDetail, { kind: "section" }>
  redirectTo: string
}) {
  const fields = getEditableSectionFields(detail.schemaKey)

  return (
    <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="font-serif text-2xl italic">Copy & buttons</CardTitle>
        <CardDescription>
          방문자가 보는 제목, 설명, 버튼 문구를 수정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <form action={updateCmsSectionAction} className="space-y-4">
          <input type="hidden" name="section_id" value={detail.row.id} />
          <input type="hidden" name="redirect_to" value={redirectTo} />
          <div className="max-h-[32rem] space-y-4 overflow-auto pr-1">
            {fields.map((field) => {
              const id = `composer-section-${field.source}-${field.key}`
              const name = cmsFieldInputName(field)
              const value = getSectionFieldValue(detail.row, field)
              return (
                <div key={`${field.source}:${field.key}`} className="space-y-2">
                  <Label htmlFor={id}>{field.label}</Label>
                  {renderFieldInput({ field, id, name, value })}
                  {field.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {field.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <CmsSubmitButton className="w-full rounded-full">
            섹션 저장
          </CmsSubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}

function SectionEntityWorkspace({
  section,
  relations,
  options,
  redirectTo,
}: {
  section: GraphSection
  relations: CmsSectionRelationContext
  options: CmsRelationEditorOptions
  redirectTo: string
}) {
  const nextSortOrder =
    Math.max(0, ...relations.sectionEntities.map((relation) => relation.sortOrder)) +
    10

  return (
    <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          <CardTitle className="font-serif text-2xl italic">Shown data</CardTitle>
        </div>
        <CardDescription>
          이 섹션에 노출할 영상, 사진, 공연, 기록을 연결합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form action={addSectionEntityRelationAction} className="space-y-4">
          <input type="hidden" name="redirect_to" value={redirectTo} />
          <input type="hidden" name="section_id" value={section.id} />
          <CmsEntityPicker
            name="entity_id"
            entities={options.entities}
            schemaOptions={options.entitySchemas}
            showSchemaFilter
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="composer-relation-type">관계</Label>
              <Input
                id="composer-relation-type"
                name="relation_type"
                defaultValue="item"
                className="h-10 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="composer-slot">슬롯</Label>
              <Input
                id="composer-slot"
                name="slot"
                defaultValue="default"
                className="h-10 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="composer-sort-order">순서</Label>
              <Input
                id="composer-sort-order"
                name="sort_order"
                type="number"
                defaultValue={nextSortOrder}
                className="h-10 bg-background/80"
              />
            </div>
          </div>
          <CmsSubmitButton className="w-full rounded-full">
            데이터 연결
          </CmsSubmitButton>
        </form>

        <Separator />

        {relations.sectionEntities.length ? (
          <ul className="space-y-2">
            {relations.sectionEntities.map((relation) => (
              <li key={relation.id} className="rounded-md border bg-background/70 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/ponix/entities/${relation.entityId}`}
                      className="line-clamp-1 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {relation.entity?.title ?? relation.entityId}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">
                      {relation.entity?.schemaKey ?? "schema"}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {relation.slot}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {relation.relationType} · order {relation.sortOrder}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            아직 연결된 데이터가 없습니다.
          </p>
        )}

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Layers3 className="size-4 text-muted-foreground" />
            <h2 className="font-medium">Props</h2>
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            {JSON.stringify(section.props, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
      <dt className="caps text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : "truncate"}>
        {value}
      </dd>
    </div>
  )
}

function composeHref(pageId: string, sectionKey: string) {
  return `/ponix/pages/${pageId}/compose?section=${encodeURIComponent(sectionKey)}`
}

function canvasHref(pageId: string, sectionKey: string | null) {
  const params = sectionKey
    ? `?section=${encodeURIComponent(sectionKey)}`
    : ""

  return `/ponix-canvas/pages/${pageId}${params}`
}

function searchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}
