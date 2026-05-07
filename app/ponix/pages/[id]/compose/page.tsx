import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Database, Layers3, PencilLine } from "lucide-react"

import { CmsEntityPicker } from "@/app/ponix/_components/cms-entity-picker"
import { renderFieldInput } from "@/app/ponix/_components/cms-section-form"
import {
  CmsSaveNotice,
  CmsSubmitButton,
} from "@/app/ponix/_components/cms-save-controls"
import { PonixComposerWorkspace } from "@/app/ponix/pages/[id]/compose/composer-workspace"
import {
  addSectionEntityRelationAction,
  deleteSectionEntityRelationAction,
  updateSectionEntityRelationAction,
} from "@/app/ponix/relations/actions"
import { updateCmsSectionAction } from "@/app/ponix/sections/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { getCmsSchema } from "@/lib/cms/schema-registry"
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
  const [relationOptions, sectionContexts] = await Promise.all([
    loadCmsRelationEditorOptions(),
    Promise.all(
      preview.graph.sections.map(async (section) => {
        const [sectionDetail, sectionRelations] = await Promise.all([
          loadCmsSectionDetail(section.id),
          loadCmsSectionRelations(section.id),
        ])

        return {
          section,
          sectionDetail:
            sectionDetail?.kind === "section" ? sectionDetail : null,
          sectionRelations,
        }
      }),
    ),
  ])
  const sectionSaved = searchValue(search?.saved) === "section"
  const relationMessage = searchValue(search?.relation_message) ?? undefined
  const relationError = searchValue(search?.relation_error) ?? undefined

  return (
    <section className="mx-auto flex w-full max-w-[104rem] flex-col gap-5">
      <PonixComposerWorkspace
        pageId={id}
        title={preview.page.title}
        slug={preview.page.slug}
        kind={preview.kind}
        sections={preview.graph.sections.map((section) => ({
          id: section.id,
          key: section.key,
          title: section.title,
        }))}
        initialSelectedKey={selectedKey}
      >
        {sectionContexts.map(({ section, sectionDetail, sectionRelations }) => (
          <div
            key={section.id}
            data-composer-panel={section.key}
            data-state={section.key === selectedKey ? "selected" : "idle"}
            hidden={section.key !== selectedKey}
          >
            <SectionInspector
              pageId={id}
              pageSlug={preview.page.slug}
              section={section}
              sectionDetail={sectionDetail}
              relations={sectionRelations}
              relationOptions={relationOptions}
              redirectTo={composeHref(id, section.key)}
              saved={section.key === selectedKey && sectionSaved}
              relationMessage={
                section.key === selectedKey ? relationMessage : undefined
              }
              relationError={
                section.key === selectedKey ? relationError : undefined
              }
            />
          </div>
        ))}
      </PonixComposerWorkspace>
    </section>
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
  const slotOptions = getCmsSchema(section.schemaKey)?.relationSlots ?? ["default"]
  const relationTypeOptions = uniqueStrings([
    "item",
    ...relations.sectionEntities.map((relation) => relation.relationType),
  ])

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
        {relations.sectionEntityList.bridgeHealth && (
          <ComposerBridgeHealth
            health={relations.sectionEntityList.bridgeHealth}
          />
        )}
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
                list="composer-relation-types"
                className="h-10 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="composer-slot">슬롯</Label>
              <Input
                id="composer-slot"
                name="slot"
                defaultValue={slotOptions[0] ?? "default"}
                list="composer-slots"
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
          <RelationDatalists
            typeOptions={relationTypeOptions}
            slotOptions={slotOptions}
          />
        </form>

        <Separator />

        {relations.sectionEntities.length ? (
          <ul className="space-y-2">
            {relations.sectionEntities.map((relation) => (
              <SectionEntityRelationEditor
                key={relation.id}
                relation={relation}
                redirectTo={redirectTo}
                typeOptions={relationTypeOptions}
                slotOptions={slotOptions}
              />
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

function SectionEntityRelationEditor({
  relation,
  redirectTo,
  typeOptions,
  slotOptions,
}: {
  relation: CmsSectionRelationContext["sectionEntities"][number]
  redirectTo: string
  typeOptions: string[]
  slotOptions: string[]
}) {
  const typeListId = `relation-types-${relation.id}`
  const slotListId = `relation-slots-${relation.id}`

  return (
    <li className="rounded-xl border bg-background/70 p-3 shadow-xs">
      <div className="mb-3 flex items-start justify-between gap-3">
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
          {relation.entity?.published ? "published" : "draft"}
        </Badge>
      </div>

      <form
        action={updateSectionEntityRelationAction}
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_5.5rem]"
      >
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="relation_id" value={relation.id} />
        <div className="space-y-1.5">
          <Label htmlFor={`relation-type-${relation.id}`} className="text-xs">
            Type
          </Label>
          <Input
            id={`relation-type-${relation.id}`}
            name="relation_type"
            defaultValue={relation.relationType}
            list={typeListId}
            className="h-9 bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`relation-slot-${relation.id}`} className="text-xs">
            Slot
          </Label>
          <Input
            id={`relation-slot-${relation.id}`}
            name="slot"
            defaultValue={relation.slot}
            list={slotListId}
            className="h-9 bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`relation-order-${relation.id}`} className="text-xs">
            Order
          </Label>
          <Input
            id={`relation-order-${relation.id}`}
            name="sort_order"
            type="number"
            defaultValue={relation.sortOrder}
            className="h-9 bg-card"
          />
        </div>
        <div className="flex gap-2 sm:col-span-3">
          <CmsSubmitButton
            className="h-9 flex-1 rounded-full"
            pendingLabel="반영 중..."
          >
            연결 정보 저장
          </CmsSubmitButton>
          <Button asChild variant="outline" className="h-9 rounded-full">
            <Link href={`/ponix/entities/${relation.entityId}`}>데이터 보기</Link>
          </Button>
        </div>
        <RelationDatalists
          typeOptions={typeOptions}
          slotOptions={slotOptions}
          typeListId={typeListId}
          slotListId={slotListId}
        />
      </form>

      <form action={deleteSectionEntityRelationAction} className="mt-2">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="relation_id" value={relation.id} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-destructive hover:text-destructive"
        >
          이 섹션에서 제거
        </Button>
      </form>
    </li>
  )
}

function RelationDatalists({
  typeOptions,
  slotOptions,
  typeListId = "composer-relation-types",
  slotListId = "composer-slots",
}: {
  typeOptions: string[]
  slotOptions: string[]
  typeListId?: string
  slotListId?: string
}) {
  return (
    <>
      <datalist id={typeListId}>
        {typeOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id={slotListId}>
        {slotOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  )
}

function ComposerBridgeHealth({
  health,
}: {
  health: NonNullable<CmsSectionRelationContext["sectionEntityList"]["bridgeHealth"]>
}) {
  if (health.ok) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="rounded-full">
          Entity graph synced
        </Badge>
        <span>
          {health.mirrored}
          {health.expected !== null ? ` / ${health.expected}` : ""} mirror rows
        </span>
      </div>
    )
  }

  return (
    <Alert variant="destructive" className="mt-3 rounded-md">
      <AlertDescription>
        Entity graph mirror is out of sync: {health.mirrored}
        {health.expected !== null ? ` / ${health.expected}` : ""} rows available.
      </AlertDescription>
    </Alert>
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

function searchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}
