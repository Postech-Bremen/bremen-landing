import Link from "next/link"

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
  getEditableSectionFields,
  getSectionEditorSchema,
  getSectionFieldValue,
  type CmsEditableSectionField,
} from "@/lib/cms/section-editor"

import { CmsSectionLivePreview } from "./cms-live-preview"

type CmsSectionDetail = Extract<CmsContentDetail, { kind: "section" }>

export function CmsSectionEditorPage({
  detail,
  relations,
  error,
}: {
  detail: CmsSectionDetail
  relations: CmsSectionRelationContext
  error?: string
}) {
  const schema = getSectionEditorSchema(detail.schemaKey)
  const editableFields = getEditableSectionFields(detail.schemaKey)
  const columnFields = editableFields.filter((field) => field.source === "column")
  const propsFields = editableFields.filter((field) => field.source === "props")
  const formId = `cms-section-form-${detail.row.id}`

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-[96rem] px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / Edit section</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Edit only the fields registered for this section schema.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {detail.row.key}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema?.label ?? "Unregistered schema"}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href={`/ponix/sections/${detail.row.id}`}>Back to section</Link>
          </Button>
        </div>

        {!schema ? (
          <Alert variant="destructive">
            <AlertTitle>Schema is not editable</AlertTitle>
            <AlertDescription>
              This section uses <code>{detail.schemaKey}</code>, which is not
              registered as a section editor schema.
            </AlertDescription>
          </Alert>
        ) : (
          <form
            id={formId}
            action={updateCmsSectionAction}
            className="grid gap-6 xl:grid-cols-[minmax(26rem,0.8fr)_minmax(42rem,1.2fr)]"
          >
            <input type="hidden" name="section_id" value={detail.row.id} />

            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Save failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card className="rounded-md bg-card/95 shadow-xl">
                <CardHeader className="border-b">
                  <CardTitle className="font-serif text-3xl italic">
                    Locked identity
                  </CardTitle>
                  <CardDescription>
                    These values define routing and renderer behavior and are not
                    editable in this slice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
                  <ReadonlyMeta label="Key" value={detail.row.key} />
                  <ReadonlyMeta label="Renderer" value={detail.row.section_type} />
                  <ReadonlyMeta label="Schema" value={detail.row.schema_key} />
                </CardContent>
              </Card>

              <EditorCard
                title="Section copy"
                description="Column fields shared by section renderers."
                fields={columnFields}
                detail={detail}
              />

              <EditorCard
                title="Renderer props"
                description="Schema-registered JSON props for this section renderer."
                fields={propsFields}
                detail={detail}
              />

              <div className="flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Saving updates this section row only. Relations and entities stay untouched.
                </p>
                <div className="flex gap-2">
                  <Button asChild type="button" variant="outline">
                    <Link href={`/ponix/sections/${detail.row.id}`}>Cancel</Link>
                  </Button>
                  <Button type="submit">Save section</Button>
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

function renderFieldInput({
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
      <select
        id={id}
        name={name}
        defaultValue={fieldDefaultText(field, value)}
        className="border-input h-11 w-full rounded-md border bg-background/70 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {!field.required && <option value="">Empty</option>}
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
