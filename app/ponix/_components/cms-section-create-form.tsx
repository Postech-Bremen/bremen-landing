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
  getEditableSectionFields,
  sectionTypeFromSchemaKey,
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
  const editableFields = getEditableSectionFields(schema.schemaKey)
  const columnFields = editableFields.filter((field) => field.source === "column")
  const propsFields = editableFields.filter((field) => field.source === "props")
  const formId = `cms-section-create-${schema.schemaKey.replace(/[^a-z0-9]+/gi, "-")}`
  const sectionType = sectionTypeFromSchemaKey(schema.schemaKey) ?? "unregistered"

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / New section</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              {schema.label}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Create a section record first. Page placement and curated entities
              can be connected after the section exists.
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
            <Link href="/ponix/sections/new">Change schema</Link>
          </Button>
        </div>

        <form id={formId} action={createCmsSectionAction} className="space-y-6">
          <input type="hidden" name="schema_key" value={schema.schemaKey} />

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Create failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="rounded-md bg-card/95 shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="font-serif text-3xl italic">
                Section identity
              </CardTitle>
              <CardDescription>
                The key is the stable CMS handle. Renderer type is derived from
                the selected schema.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="section_key">Section key</Label>
                  <Badge variant="outline" className="rounded-full">
                    Required
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
                  Use lowercase letters, numbers, and hyphens. This must stay
                  unique across sections.
                </p>
              </div>
              <ReadonlyMeta label="Renderer" value={sectionType} />
            </CardContent>
          </Card>

          <CreateEditorCard
            title="Section copy"
            description="Shared columns used by section renderers."
            fields={columnFields}
          />

          <CreateEditorCard
            title="Renderer props"
            description="Schema-registered JSON props for this renderer."
            fields={propsFields}
          />

          <div className="flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Creation inserts one section row only. Page placement is a
              separate relation step.
            </p>
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/ponix/sections">Cancel</Link>
              </Button>
              <Button type="submit">Create section</Button>
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
            <CreateEditorField key={`${field.source}:${field.key}`} field={field} />
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
