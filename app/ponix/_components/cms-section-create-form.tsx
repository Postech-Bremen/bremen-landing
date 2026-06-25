import Link from "next/link"

import { renderFieldInput } from "@/app/ponix/_components/cms-section-form"
import { createCmsSectionAction } from "@/app/ponix/sections/actions"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  cmsFieldInputName,
  sectionTypeFromSchemaKey,
  editableSectionFieldsForSchema,
  type CmsEditableSectionField,
} from "@/lib/cms/section-editor"
import type { CmsSchemaDefinition } from "@/lib/cms/schema-registry"

export function CmsSectionCreatePage({
  schema,
  error,
}: {
  schema: CmsSchemaDefinition
  error?: string
}) {
  const editableFields = editableSectionFieldsForSchema(schema)
  const columnFields = editableFields.filter((field) => field.source === "column")
  const propsFields = editableFields.filter((field) => field.source === "props")
  const formId = `cms-section-create-${schema.schemaKey.replace(/[^a-z0-9]+/gi, "-")}`
  const sectionType = sectionTypeFromSchemaKey(schema.schemaKey) ?? "unregistered"

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-1 py-4 md:py-8">
        <div className="hero-score mb-6 flex flex-col gap-6 rounded-md p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-7">
          <div>
            <p className="caps mb-5">섹션 추가</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] italic leading-[0.9]">
              {schema.label}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              공개 페이지에 놓을 화면 블록을 먼저 만들고, 이후 페이지와 콘텐츠를 연결합니다.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {sectionType}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema.schemaKey}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href="/ponix/sections/new">형식 다시 선택</Link>
          </Button>
        </div>

        <form id={formId} action={createCmsSectionAction} className="space-y-6">
          <input type="hidden" name="schema_id" value={schema.schemaId ?? ""} />

          {error && (
            <Alert variant="destructive" className="rounded-md">
              <AlertTitle>섹션을 만들지 못했습니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="stage-card rounded-md bg-card/95 shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="font-serif text-3xl italic">
                섹션 식별 정보
              </CardTitle>
              <CardDescription>
                섹션 키는 내부에서 섹션을 찾는 이름입니다. 만든 뒤에는 신중하게 다뤄야 합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="section_key">섹션 키</Label>
                  <Badge variant="outline" className="rounded-full">
                    필수
                  </Badge>
                </div>
                <Input
                  id="section_key"
                  name="section_key"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="performances-featured"
                  required
                  className="h-11 bg-background/70 font-mono"
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  영문 소문자, 숫자, 하이픈만 사용할 수 있고 다른 섹션과 겹치면 안 됩니다.
                </p>
              </div>
              <ReadonlyMeta label="화면 타입" value={sectionType} />
            </CardContent>
          </Card>

          <CreateEditorCard
            title="섹션 문구"
            description="제목, 설명, 공개 상태처럼 화면에 직접 보이는 값입니다."
            fields={columnFields}
          />

          <CreateEditorCard
            title="화면 설정"
            description="버튼, 강조 문구, 필터처럼 이 섹션에만 적용되는 설정입니다."
            fields={propsFields}
          />

          <div className="setlist-panel flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              섹션을 만든 뒤 페이지에 배치하고 필요한 데이터를 연결합니다.
            </p>
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/ponix/sections">취소</Link>
              </Button>
              <Button type="submit">섹션 만들기</Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}

function CreateEditorCard({
  title,
  description,
  fields,
}: {
  title: string
  description: string
  fields: CmsEditableSectionField[]
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

function CreateEditorField({ field }: { field: CmsEditableSectionField }) {
  const id = `new-section-${field.source}-${field.key}`
  const name = cmsFieldInputName(field)
  const wide =
    field.type === "textarea" ||
    field.type === "json" ||
    field.type === "string-list"
  const value = field.type === "boolean" ? false : ""

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

function ReadonlyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/60 p-4">
      <p className="caps mb-2 text-muted-foreground">{label}</p>
      <p className="break-all font-mono text-xs">{value}</p>
    </div>
  )
}
