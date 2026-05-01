import Link from "next/link"

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
  getEditableEntityFields,
  getEntityEditorSchema,
  getEntityFieldValue,
  type CmsEditableEntityField,
} from "@/lib/cms/entity-editor"

import { CmsEntityLivePreview } from "./cms-live-preview"

type CmsEntityDetail = Extract<CmsContentDetail, { kind: "entity" }>

export function CmsEntityEditorPage({
  detail,
  error,
}: {
  detail: CmsEntityDetail
  error?: string
}) {
  const schema = getEntityEditorSchema(detail.schemaKey)
  const editableFields = getEditableEntityFields(detail.schemaKey)
  const columnFields = editableFields.filter((field) => field.source === "column")
  const dataFields = editableFields.filter((field) => field.source === "data")
  const formId = `cms-entity-form-${detail.row.id}`

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / Edit entity</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              {detail.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Edit reusable content fields and the canonical thumbnail URL.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full font-mono">
                {detail.row.entity_type}
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                {schema?.label ?? "Unregistered schema"}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href={`/ponix/entities/${detail.row.id}`}>Back to entity</Link>
          </Button>
        </div>

        {!schema ? (
          <Alert variant="destructive">
            <AlertTitle>Schema is not editable</AlertTitle>
            <AlertDescription>
              This entity uses <code>{detail.schemaKey}</code>, which is not
              registered as an entity editor schema.
            </AlertDescription>
          </Alert>
        ) : (
          <form
            id={formId}
            action={updateCmsEntityAction}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]"
          >
            <input type="hidden" name="entity_id" value={detail.row.id} />

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
                    These values define entity behavior and are not editable in
                    this slice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
                  <ReadonlyMeta label="Entity type" value={detail.row.entity_type} />
                  <ReadonlyMeta label="Schema" value={detail.row.schema_key} />
                  <ReadonlyMeta label="ID" value={detail.row.id} />
                </CardContent>
              </Card>

              <ThumbnailCard detail={detail} />

              <EditorCard
                title="Entity fields"
                description="Shared columns used by cards, lists, and detail views."
                fields={columnFields}
                detail={detail}
              />

              <EditorCard
                title="Schema data"
                description="Schema-registered JSON data for this entity type."
                fields={dataFields}
                detail={detail}
              />

              <div className="flex flex-col gap-3 rounded-md border bg-card/95 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Saving updates this entity row only. Relations stay untouched.
                </p>
                <div className="flex gap-2">
                  <Button asChild type="button" variant="outline">
                    <Link href={`/ponix/entities/${detail.row.id}`}>Cancel</Link>
                  </Button>
                  <Button type="submit">Save entity</Button>
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
    <Card className="rounded-md bg-card/95 shadow-xl">
      <CardHeader className="border-b">
        <CardTitle className="font-serif text-3xl italic">
          Thumbnail upload
        </CardTitle>
        <CardDescription>
          Uploading a new image stores it in Supabase Storage and replaces
          <code> thumbnail_url</code>.
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
            No thumbnail
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="thumbnail_file">Upload image</Label>
          <ProfileImageInput id="thumbnail_file" name="thumbnail_file" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Leave empty to keep the current URL. Manual URL edits are available
            in Entity fields.
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
