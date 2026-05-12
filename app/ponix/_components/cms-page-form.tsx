import Link from "next/link"

import { updateCmsPageAction } from "@/app/ponix/pages/actions"
import {
  CmsSaveNotice,
  CmsSubmitButton,
} from "@/app/ponix/_components/cms-save-controls"
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
  cmsPageFieldInputName,
  getPageFieldValue,
  editablePageFieldsForSchema,
  type CmsEditablePageField,
} from "@/lib/cms/page-editor"
import { loadPageEditorSchema } from "@/lib/cms/page-editor.server"

type CmsPageDetail = Extract<CmsContentDetail, { kind: "page" }>

export async function CmsPageEditorPage({
  detail,
  error,
  saved,
}: {
  detail: CmsPageDetail
  error?: string
  saved?: boolean
}) {
  const schema = await loadPageEditorSchema()
  const editableFields = schema ? editablePageFieldsForSchema(schema) : []
  const columnFields = editableFields.filter((field) => field.source === "column")
  const propsFields = editableFields.filter((field) => field.source === "props")

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / Edit page</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Edit route-level copy, publish state, and registered page props.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                /{detail.row.slug === "home" ? "" : detail.row.slug}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema?.label ?? "Unregistered schema"}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href={`/ponix/pages/${detail.row.id}`}>Back to page</Link>
          </Button>
        </div>

        {!schema ? (
          <Alert variant="destructive">
            <AlertTitle>Schema is not editable</AlertTitle>
            <AlertDescription>
              The default page schema is not registered as a page editor schema.
            </AlertDescription>
          </Alert>
        ) : (
          <form action={updateCmsPageAction} className="space-y-6">
            <input type="hidden" name="page_id" value={detail.row.id} />
            <input
              type="hidden"
              name="redirect_to"
              value={`/ponix/pages/${detail.row.id}/edit`}
            />

            <CmsSaveNotice
              saved={saved}
              error={error}
              savedDescription="페이지 기본 정보가 저장되었습니다."
            />

            <Card className="rounded-md bg-card/95 shadow-xl">
              <CardHeader className="border-b">
                <CardTitle className="font-serif text-3xl italic">
                  Locked route
                </CardTitle>
                <CardDescription>
                  Page slug controls the public route and stays locked in this
                  editor.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-2">
                <ReadonlyMeta label="Slug" value={detail.row.slug} />
                <ReadonlyMeta label="ID" value={detail.row.id} />
              </CardContent>
            </Card>

            <EditorCard
              title="Page fields"
              description="Route-level copy and publish state."
              fields={columnFields}
              detail={detail}
            />

            <EditorCard
              title="Page props"
              description="Schema-registered JSON props for page-level metadata."
              fields={propsFields}
              detail={detail}
            />

            <div className="flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                저장하면 페이지 제목, 설명, 공개 상태만 바뀝니다. 섹션 구성은 그대로 둡니다.
              </p>
              <div className="flex gap-2">
                <Button asChild type="button" variant="outline">
                  <Link href={`/ponix/pages/${detail.row.id}`}>Cancel</Link>
                </Button>
                  <CmsSubmitButton>페이지 저장</CmsSubmitButton>
                </div>
              </div>
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
  fields: CmsEditablePageField[]
  detail: CmsPageDetail
}) {
  return (
    <Card className="rounded-md bg-card/95 shadow-xl">
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
  field: CmsEditablePageField
  detail: CmsPageDetail
}) {
  const id = `page-${field.source}-${field.key}`
  const name = cmsPageFieldInputName(field)
  const value = getPageFieldValue(detail.row, field)
  const wide = field.type === "textarea" || field.type === "json"

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

function renderFieldInput({
  field,
  id,
  name,
  value,
}: {
  field: CmsEditablePageField
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
          Published
        </Label>
      </div>
    )
  }

  if (field.type === "textarea" || field.type === "json") {
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

  return (
    <Input
      id={id}
      name={name}
      defaultValue={fieldDefaultText(field, value)}
      className="h-11 bg-background/70"
    />
  )
}

function fieldDefaultText(field: CmsEditablePageField, value: unknown) {
  if (value === null || value === undefined) {
    return ""
  }

  if (field.type === "json") {
    return JSON.stringify(value, null, 2)
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
