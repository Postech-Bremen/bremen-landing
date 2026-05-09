import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Database, Layers3, PencilLine } from "lucide-react"

import { CmsEntityPicker } from "@/app/ponix/_components/cms-entity-picker"
import { renderFieldInput } from "@/app/ponix/_components/cms-section-form"
import { CmsSubmitButton } from "@/app/ponix/_components/cms-save-controls"
import { CmsComboboxField } from "@/app/ponix/_components/cms-select-field"
import { ComposerRelationList } from "@/app/ponix/pages/[id]/compose/composer-relation-list"
import { ComposerSaveFeedback } from "@/app/ponix/pages/[id]/compose/composer-save-feedback"
import { PonixComposerWorkspace } from "@/app/ponix/pages/[id]/compose/composer-workspace"
import { addSectionEntityRelationAction } from "@/app/ponix/relations/actions"
import { updateCmsSectionAction } from "@/app/ponix/sections/actions"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
  getSectionFieldValue,
  type CmsEditableSectionField,
} from "@/lib/cms/section-editor"
import { loadEditableSectionFields } from "@/lib/cms/section-editor.server"
import { loadCmsSchema } from "@/lib/cms/schema-registry.server"
import { loadEditableEntityFields } from "@/lib/cms/entity-editor.server"
import type { CmsEditableEntityField } from "@/lib/cms/entity-editor"
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
        const [sectionDetail, sectionRelations, editableSectionFields, schema] =
          await Promise.all([
            loadCmsSectionDetail(section.id),
            loadCmsSectionRelations(section.id),
            loadEditableSectionFields(section.schemaKey),
            loadCmsSchema(section.schemaKey),
          ])
        const entitySchemaKeys = uniqueStrings(
          sectionRelations?.sectionEntities.map(
            (relation) => relation.entity?.schemaKey,
          ) ?? [],
        )
        const entityFieldEntries = await Promise.all(
          entitySchemaKeys.map(async (schemaKey) => [
            schemaKey,
            await loadEditableEntityFields(schemaKey),
          ] as const),
        )

        return {
          section,
          sectionDetail:
            sectionDetail?.kind === "section" ? sectionDetail : null,
          sectionRelations,
          editableSectionFields,
          sectionSlotOptions: schema?.relationSlots?.length
            ? schema.relationSlots
            : ["default"],
          entityFieldsBySchemaKey: Object.fromEntries(entityFieldEntries),
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
        {sectionContexts.map(({
          section,
          sectionDetail,
          sectionRelations,
          editableSectionFields,
          sectionSlotOptions,
          entityFieldsBySchemaKey,
        }) => (
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
              editableSectionFields={editableSectionFields}
              sectionSlotOptions={sectionSlotOptions}
              entityFieldsBySchemaKey={entityFieldsBySchemaKey}
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
  editableSectionFields,
  sectionSlotOptions,
  entityFieldsBySchemaKey,
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
  editableSectionFields: CmsEditableSectionField[]
  sectionSlotOptions: string[]
  entityFieldsBySchemaKey: Record<string, CmsEditableEntityField[]>
  redirectTo: string
  saved: boolean
  relationMessage?: string
  relationError?: string
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-40 xl:max-h-[calc(100svh-10rem)] xl:overflow-auto xl:pr-1">
      <ComposerSaveFeedback
        sectionSaved={saved}
        relationMessage={relationMessage}
        relationError={relationError}
      />
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

      {section && relations && relationOptions && (
        <SectionEntityWorkspace
          section={section}
          relations={relations}
          options={relationOptions}
          slotOptions={sectionSlotOptions}
          entityFieldsBySchemaKey={entityFieldsBySchemaKey}
          redirectTo={redirectTo}
        />
      )}

      {sectionDetail && (
        <SectionQuickEditCard
          detail={sectionDetail}
          fields={editableSectionFields}
          redirectTo={redirectTo}
        />
      )}

      {section && <SectionAdvancedSettingsCard section={section} />}
    </aside>
  )
}

function SectionQuickEditCard({
  detail,
  fields,
  redirectTo,
}: {
  detail: Extract<CmsContentDetail, { kind: "section" }>
  fields: CmsEditableSectionField[]
  redirectTo: string
}) {
  return (
    <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="copy" className="border-0">
          <CardHeader className="border-b bg-muted/20 p-0">
            <AccordionTrigger
              className="px-5 py-4 hover:no-underline"
              data-composer-copy-trigger
            >
              <div className="min-w-0 text-left">
                <p className="font-serif text-2xl italic leading-none">
                  섹션 문구
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  제목, 설명, 버튼처럼 화면에 바로 보이는 말을 정리합니다.
                </p>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent className="p-5" data-composer-copy-editor>
            <form
              action={updateCmsSectionAction}
              className="space-y-4"
              data-composer-track-dirty
            >
              <input type="hidden" name="section_id" value={detail.row.id} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <div className="max-h-[32rem] space-y-4 overflow-auto pr-1">
                {fields.map((field) => {
                  const id = `composer-section-${field.source}-${field.key}`
                  const name = cmsFieldInputName(field)
                  const value = getSectionFieldValue(detail.row, field)
                  return (
                    <div
                      key={`${field.source}:${field.key}`}
                      className="space-y-2"
                    >
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

function SectionEntityWorkspace({
  section,
  relations,
  options,
  slotOptions,
  entityFieldsBySchemaKey,
  redirectTo,
}: {
  section: GraphSection
  relations: CmsSectionRelationContext
  options: CmsRelationEditorOptions
  slotOptions: string[]
  entityFieldsBySchemaKey: Record<string, CmsEditableEntityField[]>
  redirectTo: string
}) {
  const nextSortOrder =
    Math.max(0, ...relations.sectionEntities.map((relation) => relation.sortOrder)) +
    10
  const relationTypeOptions = uniqueStrings([
    "item",
    ...relations.sectionEntities.map((relation) => relation.relationType),
  ])

  return (
    <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" />
          <CardTitle className="font-serif text-2xl italic">연결 데이터</CardTitle>
        </div>
        <CardDescription>
          이 섹션에 보여줄 영상, 사진, 공연, 기록을 고릅니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <form
          action={addSectionEntityRelationAction}
          className="space-y-4"
          data-composer-track-dirty
        >
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
              <CmsComboboxField
                id="composer-relation-type"
                name="relation_type"
                defaultValue="item"
                options={relationTypeOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
                placeholder="관계 선택"
                searchPlaceholder="관계 검색 또는 입력"
                emptyLabel="새 관계 이름을 입력하세요"
                customLabel="사용"
                triggerClassName="h-10 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="composer-slot">슬롯</Label>
              <CmsComboboxField
                id="composer-slot"
                name="slot"
                defaultValue={slotOptions[0] ?? "default"}
                options={slotOptions.map((option) => ({
                  value: option,
                  label: option,
                }))}
                placeholder="슬롯 선택"
                searchPlaceholder="슬롯 검색 또는 입력"
                emptyLabel="새 슬롯 이름을 입력하세요"
                customLabel="사용"
                triggerClassName="h-10 bg-background/80"
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

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-medium">현재 노출 중인 데이터</h2>
              <p className="text-xs text-muted-foreground">
                목록에서 항목을 고른 뒤 연결 정보만 펼쳐 수정합니다.
              </p>
            </div>
            <Badge variant="outline" className="rounded-full">
              {relations.sectionEntities.length}
            </Badge>
          </div>

          <ComposerRelationList
            sectionId={section.id}
            relations={relations.sectionEntities}
            redirectTo={redirectTo}
            typeOptions={relationTypeOptions}
            slotOptions={slotOptions}
            entityFieldsBySchemaKey={entityFieldsBySchemaKey}
          />
        </div>

      </CardContent>
    </Card>
  )
}

function SectionAdvancedSettingsCard({ section }: { section: GraphSection }) {
  return (
    <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border-0">
          <CardHeader className="border-b bg-muted/20 p-0">
            <AccordionTrigger
              className="px-5 py-4 hover:no-underline"
              data-composer-advanced-trigger
            >
              <div className="flex min-w-0 items-center gap-2 text-left">
                <Layers3 className="size-4 text-muted-foreground" />
                <div>
                  <p className="font-serif text-2xl italic leading-none">
                    고급 설정
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    렌더러가 읽는 원본 설정입니다. 필요한 경우에만 확인합니다.
                  </p>
                </div>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent className="p-5" data-composer-advanced-panel>
            <pre className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
              {JSON.stringify(section.props, null, 2)}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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

function searchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const strings = values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))

  return Array.from(new Set(strings))
}
