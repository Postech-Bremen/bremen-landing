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
  entityTypeFromSchemaKey,
  editableEntityFieldsForSchema,
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
  const entityType = entityTypeFromSchemaKey(schema.schemaKey)

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / New entity</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              {schema.label}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Create a reusable content record, then place it into sections or
              link it to related entities.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {entityType}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema.schemaKey}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href="/ponix/entities/new">Change schema</Link>
          </Button>
        </div>

        <form id={formId} action={createCmsEntityAction} className="space-y-6">
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
                Locked identity
              </CardTitle>
              <CardDescription>
                The schema determines renderer behavior. Relations can be added
                after the entity exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
              <ReadonlyMeta label="Entity type" value={entityType} />
              <ReadonlyMeta label="Schema" value={schema.schemaKey} />
              <ReadonlyMeta label="Description" value={schema.description} />
            </CardContent>
          </Card>

          <ThumbnailCard />

          <CreateEditorCard
            title="Entity fields"
            description="Shared columns used by cards, lists, and detail pages."
            fields={columnFields}
          />

          <CreateEditorCard
            title="Schema data"
            description="Typed JSON fields registered for this entity schema."
            fields={dataFields}
          />

          <div className="flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Creation inserts one entity row only. Section placement is a
              separate relation step.
            </p>
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/ponix/entities">Cancel</Link>
              </Button>
              <Button type="submit">Create entity</Button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}

function ThumbnailCard() {
  return (
    <Card className="rounded-md bg-card/95 shadow-xl">
      <CardHeader className="border-b">
        <CardTitle className="font-serif text-3xl italic">
          Thumbnail upload
        </CardTitle>
        <CardDescription>
          An uploaded image is stored in the shared images bucket and saved as
          the entity thumbnail URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <div className="max-w-xl space-y-2">
          <Label htmlFor="thumbnail_file">Upload image</Label>
          <ProfileImageInput id="thumbnail_file" name="thumbnail_file" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            You can also paste a URL in the thumbnail field below for
            already-hosted assets.
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
