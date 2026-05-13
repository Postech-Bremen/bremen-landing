import Link from "next/link"

import { createCmsEntityAction } from "@/app/ponix/entities/actions"
import { renderFieldInput } from "@/app/ponix/_components/cms-entity-form"
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
import { Label } from "@/components/ui/label"
import type { CmsSchemaDefinition } from "@/lib/cms/schema-registry"
import {
  cmsEntityFieldInputName,
  editableEntityFieldsForSchema,
  semanticKindForSchema,
  type CmsEditableEntityField,
} from "@/lib/cms/entity-editor"

export function CmsEntityCreatePage({
  schema,
  error,
}: {
  schema: CmsSchemaDefinition
  error?: string
}) {
  const editableFields = editableEntityFieldsForSchema(schema)
  const columnFields = editableFields.filter((field) => field.source === "column")
  const dataFields = editableFields.filter((field) => field.source === "data")
  const formId = `cms-entity-create-${schema.schemaKey.replace(/[^a-z0-9]+/gi, "-")}`
  const semanticKind = semanticKindForSchema(schema)

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-5xl px-1 py-4 md:py-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">콘텐츠 추가</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] italic leading-[0.9] tracking-tight">
              {schema.label}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              사이트 여러 곳에서 다시 쓸 콘텐츠를 먼저 만들고, 필요한 섹션에 배치합니다.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {semanticKind}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema.schemaKey}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href="/ponix/entities/new">형식 다시 선택</Link>
          </Button>
        </div>

        <form id={formId} action={createCmsEntityAction} className="space-y-6">
          <input type="hidden" name="schema_id" value={schema.schemaId ?? ""} />

          {error && (
            <Alert variant="destructive">
              <AlertTitle>콘텐츠를 만들지 못했습니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="rounded-[1.5rem] bg-card/95 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="font-serif text-3xl italic">
                고정된 식별 정보
              </CardTitle>
              <CardDescription>
                선택한 형식에 맞춰 입력 항목이 정해집니다. 섹션 배치는 만든 뒤 연결합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
              <ReadonlyMeta label="분류" value={semanticKind} />
              <ReadonlyMeta label="입력 양식" value={schema.schemaKey} />
              <ReadonlyMeta label="설명" value={schema.description} />
            </CardContent>
          </Card>

          <ThumbnailCard />

          <CreateEditorCard
            title="기본 정보"
            description="카드, 목록, 상세 화면에서 공통으로 쓰는 값입니다."
            fields={columnFields}
          />

          <CreateEditorCard
            title="콘텐츠 세부 정보"
            description="콘텐츠 종류별로 필요한 추가 정보입니다."
            fields={dataFields}
          />

          <div className="flex flex-col gap-3 rounded-[1.25rem] border bg-card/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              저장 후 섹션에 배치하거나 다른 콘텐츠와 연결할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/ponix/entities">취소</Link>
              </Button>
              <Button type="submit">콘텐츠 만들기</Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}

function ThumbnailCard() {
  return (
    <Card className="rounded-[1.5rem] bg-card/95 shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="font-serif text-3xl italic">
          대표 이미지
        </CardTitle>
        <CardDescription>
          업로드한 이미지는 Storage에 저장되고 콘텐츠 썸네일로 사용됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <div className="max-w-xl space-y-2">
          <Label htmlFor="thumbnail_file">이미지 업로드</Label>
          <ProfileImageInput id="thumbnail_file" name="thumbnail_file" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            이미 업로드된 이미지는 아래 썸네일 URL 항목에 직접 넣을 수도 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateEditorCard({
  title,
  description,
  fields,
}: {
  title: string
  description: string
  fields: CmsEditableEntityField[]
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
            <CreateEditorField key={`${field.source}:${field.key}`} field={field} />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            이 묶음에는 입력할 항목이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function CreateEditorField({ field }: { field: CmsEditableEntityField }) {
  const id = `new-entity-${field.source}-${field.key}`
  const name = cmsEntityFieldInputName(field)
  const wide =
    field.type === "textarea" ||
    field.type === "json" ||
    field.type === "string-list"
  const value = createDefaultValue(field)

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

function createDefaultValue(field: CmsEditableEntityField) {
  if (field.source === "column" && field.key === "sort_at") {
    return new Date().toISOString().slice(0, 16)
  }

  if (field.type === "boolean") {
    return false
  }

  return ""
}

function ReadonlyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/60 p-4">
      <p className="caps mb-2 text-muted-foreground">{label}</p>
      <p className="break-words text-xs leading-relaxed text-muted-foreground">
        {value}
      </p>
    </div>
  )
}
