import Link from "next/link"

import {
  CmsSaveNotice,
  CmsSubmitButton,
} from "@/app/ponix/_components/cms-save-controls"
import { CmsSelectField } from "@/app/ponix/_components/cms-select-field"
import { updateCmsEntityAction } from "@/app/ponix/entities/actions"
import { ProfileImageInput } from "@/components/profile-image-input"
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
import type { CmsContentDetail } from "@/lib/cms/content"
import {
  cmsEntityFieldInputName,
  getEntityFieldValue,
  editableEntityFieldsForSchema,
  type CmsEditableEntityField,
} from "@/lib/cms/entity-editor"
import { loadEntityEditorSchemaById } from "@/lib/cms/entity-editor.server"

import { CmsEntityLivePreview } from "./cms-live-preview"

type CmsEntityDetail = Extract<CmsContentDetail, { kind: "entity" }>

export async function CmsEntityEditorPage({
  detail,
  error,
  saved,
}: {
  detail: CmsEntityDetail
  error?: string
  saved?: boolean
}) {
  const schema = await loadEntityEditorSchemaById(detail.row.schema_id)
  const editableFields = schema ? editableEntityFieldsForSchema(schema) : []
  const columnFields = editableFields.filter((field) => field.source === "column")
  const dataFields = editableFields.filter((field) => field.source === "data")
  const formId = `cms-entity-form-${detail.row.id}`

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-1 py-4 md:py-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">콘텐츠 수정</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] italic leading-[0.9] tracking-tight">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              사이트 곳곳에서 쓰이는 콘텐츠의 제목, 썸네일, 세부 정보를 수정합니다.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {detail.entityType}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema?.label ?? "등록되지 않은 형식"}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href={`/ponix/entities/${detail.row.id}`}>상세로 돌아가기</Link>
          </Button>
        </div>

        {!schema ? (
          <Alert variant="destructive">
            <AlertTitle>수정할 수 없는 콘텐츠입니다</AlertTitle>
            <AlertDescription>
              이 콘텐츠에 맞는 입력 양식이 아직 등록되지 않았습니다.
            </AlertDescription>
          </Alert>
        ) : (
          <form
            id={formId}
            action={updateCmsEntityAction}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]"
          >
            <input type="hidden" name="entity_id" value={detail.row.id} />
            <input
              type="hidden"
              name="redirect_to"
              value={`/ponix/entities/${detail.row.id}/edit`}
            />

            <div className="space-y-6">
              <CmsSaveNotice
                saved={saved}
                error={error}
                savedDescription="데이터 항목이 저장되었습니다."
              />

              <Card className="rounded-[1.5rem] bg-card/95 shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="font-serif text-3xl italic">
                    고정된 식별 정보
                  </CardTitle>
                  <CardDescription>
                    콘텐츠 분류와 입력 양식을 결정하는 값이라 이 화면에서는 바꾸지 않습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
                  <ReadonlyMeta label="분류" value={detail.entityType} />
                  <ReadonlyMeta label="입력 양식" value={detail.schemaKey} />
                  <ReadonlyMeta label="ID" value={detail.row.id} />
                </CardContent>
              </Card>

              <ThumbnailCard detail={detail} />

              <EditorCard
                title="기본 정보"
                description="카드, 목록, 상세 화면에서 공통으로 쓰는 값입니다."
                fields={columnFields}
                detail={detail}
              />

              <EditorCard
                title="콘텐츠 세부 정보"
                description="콘텐츠 종류별로 필요한 추가 정보입니다."
                fields={dataFields}
                detail={detail}
              />

              <div className="flex flex-col gap-3 rounded-[1.25rem] border bg-card/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  저장하면 이 콘텐츠의 정보만 바뀝니다. 배치된 섹션과 순서는 그대로 둡니다.
                </p>
                <div className="flex gap-2">
                  <Button asChild type="button" variant="outline">
                    <Link href={`/ponix/entities/${detail.row.id}`}>취소</Link>
                  </Button>
                  <CmsSubmitButton>콘텐츠 저장</CmsSubmitButton>
                </div>
              </div>
            </div>

            <CmsEntityLivePreview
              formId={formId}
              detail={detail}
              fields={editableFields}
            />
          </form>
        )}
      </section>
    </main>
  )
}

function ThumbnailCard({ detail }: { detail: CmsEntityDetail }) {
  return (
    <Card className="rounded-[1.5rem] bg-card/95 shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="font-serif text-3xl italic">
          대표 이미지
        </CardTitle>
        <CardDescription>
          새 이미지를 올리면 Supabase Storage에 저장되고 이 콘텐츠의 썸네일로 반영됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[12rem_minmax(0,1fr)]">
        {detail.row.thumbnail_url ? (
          <div className="h-32 w-48 max-w-full overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.row.thumbnail_url}
              alt={`${detail.title} thumbnail`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="grid h-32 w-48 max-w-full place-items-center rounded-md border bg-muted text-sm text-muted-foreground">
            대표 이미지 없음
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="thumbnail_file">이미지 업로드</Label>
          <ProfileImageInput id="thumbnail_file" name="thumbnail_file" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            비워 두면 기존 이미지를 유지합니다. 이미 업로드된 이미지는 URL로도 관리할 수 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
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
  fields: CmsEditableEntityField[]
  detail: CmsEntityDetail
}) {
  return (
    <Card className="rounded-[1.5rem] bg-card/95 shadow-sm">
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
            이 묶음에는 수정할 항목이 없습니다.
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
  field: CmsEditableEntityField
  detail: CmsEntityDetail
}) {
  const id = `entity-${field.source}-${field.key}`
  const name = cmsEntityFieldInputName(field)
  const value = getEntityFieldValue(detail.row, field)
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
  field: CmsEditableEntityField
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

function inputType(field: CmsEditableEntityField) {
  if (field.type === "number") return "number"
  if (field.type === "date") return "date"
  if (field.type === "datetime") return "datetime-local"
  return "text"
}

function fieldDefaultText(field: CmsEditableEntityField, value: unknown) {
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
