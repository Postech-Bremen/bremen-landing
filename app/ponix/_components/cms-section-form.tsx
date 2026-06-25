import Link from "next/link"

import {
  CmsSaveNotice,
  CmsSubmitButton,
} from "@/app/ponix/_components/cms-save-controls"
import { CmsSelectField } from "@/app/ponix/_components/cms-select-field"
import { updateCmsSectionAction } from "@/app/ponix/sections/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CmsContentDetail, CmsSectionRelationContext } from "@/lib/cms/content"
import {
  cmsFieldInputName,
  getSectionFieldValue,
  editableSectionFieldsForSchema,
  type CmsEditableSectionField,
} from "@/lib/cms/section-editor"
import { loadSectionEditorSchemaById } from "@/lib/cms/section-editor.server"

import { CmsSectionLivePreview } from "./cms-live-preview"

type CmsSectionDetail = Extract<CmsContentDetail, { kind: "section" }>

export async function CmsSectionEditorPage({
  detail,
  relations,
  error,
  saved,
}: {
  detail: CmsSectionDetail
  relations: CmsSectionRelationContext
  error?: string
  saved?: boolean
}) {
  const schema = await loadSectionEditorSchemaById(detail.row.schema_id)
  const editableFields = schema ? editableSectionFieldsForSchema(schema) : []
  const columnFields = editableFields.filter((field) => field.source === "column")
  const propsFields = editableFields.filter((field) => field.source === "props")
  const formId = `cms-section-form-${detail.row.id}`

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-[92rem] px-1 py-4 md:py-8">
        <div className="hero-score mb-6 flex flex-col gap-6 rounded-md p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-7">
          <div>
            <p className="caps mb-5">섹션 편집</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] italic leading-[0.9]">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              공개 화면에 보이는 문구와 버튼, 섹션별 설정을 수정합니다.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {detail.row.key}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema?.label ?? "등록되지 않은 형식"}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href={`/ponix/sections/${detail.row.id}`}>상세로 돌아가기</Link>
          </Button>
        </div>

        {!schema ? (
          <Alert variant="destructive" className="rounded-md">
            <AlertTitle>수정할 수 없는 섹션입니다</AlertTitle>
            <AlertDescription>
              이 섹션에 맞는 입력 양식이 아직 등록되지 않았습니다.
            </AlertDescription>
          </Alert>
        ) : (
          <form
            id={formId}
            action={updateCmsSectionAction}
            className="grid gap-6 xl:grid-cols-[minmax(26rem,0.8fr)_minmax(42rem,1.2fr)]"
          >
            <input type="hidden" name="section_id" value={detail.row.id} />
            <input
              type="hidden"
              name="redirect_to"
              value={`/ponix/sections/${detail.row.id}/edit`}
            />

            <div className="space-y-6">
              <CmsSaveNotice
                saved={saved}
                error={error}
                savedDescription="섹션 문구와 설정이 저장되었습니다."
              />

              <Card className="stage-card rounded-md bg-card/95 shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="font-serif text-3xl italic">
                    고정된 식별 정보
                  </CardTitle>
                  <CardDescription>
                    섹션을 찾고 렌더러를 고르는 값이라 이 화면에서는 바꾸지 않습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
                  <ReadonlyMeta label="Key" value={detail.row.key} />
                  <ReadonlyMeta label="Renderer" value={detail.row.section_type} />
                  <ReadonlyMeta label="Schema" value={detail.schemaKey} />
                </CardContent>
              </Card>

              <EditorCard
                title="섹션 문구"
                description="제목, 보조 설명, 공개 상태처럼 화면에 직접 보이는 값입니다."
                fields={columnFields}
                detail={detail}
              />

              <EditorCard
                title="화면 설정"
                description="버튼, 강조 문구, 필터처럼 이 섹션에만 적용되는 설정입니다."
                fields={propsFields}
                detail={detail}
              />

              <div className="setlist-panel flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  저장하면 이 섹션의 문구와 설정만 바뀝니다. 연결된 데이터는 그대로 둡니다.
                </p>
                <div className="flex gap-2">
                  <Button asChild type="button" variant="outline">
                    <Link href={`/ponix/sections/${detail.row.id}`}>취소</Link>
                  </Button>
                  <CmsSubmitButton>섹션 저장</CmsSubmitButton>
                </div>
              </div>
            </div>

            <CmsSectionLivePreview
              formId={formId}
              detail={detail}
              fields={editableFields}
              sectionEntities={relations.sectionEntities}
              entityRelations={relations.entityRelations}
            />
          </form>
        )}
      </section>
    </main>
  )
}

function EditorCard({
  title,
  description,
  fields,
  detail,
}: {
  title: string
  description: string
  fields: CmsEditableSectionField[]
  detail: CmsSectionDetail
}) {
  return (
    <Card className="stage-card rounded-md bg-card/95 shadow-sm">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-serif text-3xl italic">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <p className="caps text-muted-foreground">{fields.length} fields</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-2">
        {fields.length > 0 ? (
          fields.map((field) => (
            <EditorField key={`${field.source}:${field.key}`} field={field} detail={detail} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No editable fields in this group.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function EditorField({
  field,
  detail,
}: {
  field: CmsEditableSectionField
  detail: CmsSectionDetail
}) {
  const id = `section-${field.source}-${field.key}`
  const name = cmsFieldInputName(field)
  const value = getSectionFieldValue(detail.row, field)
  const wide = field.type === "textarea" || field.type === "json" || field.type === "string-list"

  return (
    <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{field.label}</Label>
        {field.required && (
          <Badge variant="outline" className="rounded-full">
            Required
          </Badge>
        )}
      </div>
      {renderFieldInput({ field, id, name, value })}
      <p className="font-mono text-xs text-muted-foreground">
        {field.source}.{field.key}
      </p>
      {field.description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {field.description}
        </p>
      )}
    </div>
  )
}

export function renderFieldInput({
  field,
  id,
  name,
  value,
}: {
  field: CmsEditableSectionField
  id: string
  name: string
  value: unknown
}) {
  if (field.type === "boolean") {
    return (
      <div className="flex h-11 items-center gap-3 rounded-md border bg-background/70 px-3">
        <input type="hidden" name={name} value="false" />
        <Checkbox
          id={id}
          name={name}
          value="true"
          defaultChecked={Boolean(value)}
        />
        <Label htmlFor={id} className="text-sm font-normal">
          Enabled
        </Label>
      </div>
    )
  }

  if (field.type === "textarea" || field.type === "string-list" || field.type === "json") {
    return (
      <Textarea
        id={id}
        name={name}
        defaultValue={fieldDefaultText(field, value)}
        rows={field.type === "json" ? 10 : 5}
        className="bg-background/70"
      />
    )
  }

  if (field.type === "select") {
    return (
      <CmsSelectField
        id={id}
        name={name}
        defaultValue={fieldDefaultText(field, value)}
        options={field.options ?? []}
        placeholder={`Select ${field.label}`}
        required={field.required}
      />
    )
  }

  return (
    <Input
      id={id}
      name={name}
      type={inputType(field)}
      defaultValue={fieldDefaultText(field, value)}
      className="h-11 bg-background/70"
    />
  )
}

function inputType(field: CmsEditableSectionField) {
  if (field.type === "number") return "number"
  if (field.type === "date") return "date"
  if (field.type === "datetime") return "datetime-local"
  return "text"
}

function fieldDefaultText(field: CmsEditableSectionField, value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  if (field.type === "string-list") {
    return Array.isArray(value) ? value.join("\n") : String(value)
  }

  if (field.type === "json") {
    return JSON.stringify(value, null, 2)
  }

  if (field.type === "datetime" && typeof value === "string") {
    return value.slice(0, 16)
  }

  return String(value)
}

function ReadonlyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/60 p-4">
      <p className="caps mb-2 text-muted-foreground">{label}</p>
      <p className="break-all font-mono text-xs">{value}</p>
    </div>
  )
}
