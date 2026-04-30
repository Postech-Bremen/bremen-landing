import Link from "next/link"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CmsContentDetail } from "@/lib/cms/content"
import {
  getCmsSchema,
  type CmsFieldDefinition,
  type CmsFieldSource,
} from "@/lib/cms/schema-registry"

import { formatCmsDate, PublishBadge, SchemaBadge } from "./cms-list"

const sourceLabels: Record<CmsFieldSource, string> = {
  column: "Column",
  props: "Props",
  data: "Data",
  relation_props: "Relation props",
}

export function CmsDetailPage({
  detail,
  backHref,
  backLabel,
}: {
  detail: CmsContentDetail
  backHref: string
  backLabel: string
}) {
  const schema = getCmsSchema(detail.schemaKey)
  const fieldCount = schema?.fields.length ?? 0

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="caps mb-5">PONIX / {detail.table}</p>
            <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
              {detail.title}
            </h1>
            {detail.subtitle && (
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {detail.subtitle}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <PublishBadge published={detail.published} />
              <SchemaBadge
                label={detail.schemaLabel}
                registered={detail.schemaRegistered}
              />
              <Badge variant="outline" className="rounded-full font-mono">
                {detail.kind}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-full">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>

        {!schema && (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Schema is not registered</AlertTitle>
            <AlertDescription>
              This record exists in the database, but PONIX does not know how to
              render editable fields for <code>{detail.schemaKey}</code> yet.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-md bg-card/95 shadow-xl">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <CardTitle className="font-serif text-3xl italic">
                    Registered fields
                  </CardTitle>
                  <CardDescription>
                    Values are resolved from the schema registry sources.
                  </CardDescription>
                </div>
                <p className="caps text-muted-foreground">
                  {fieldCount} fields
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {schema ? (
                <FieldTable detail={detail} fields={schema.fields} />
              ) : (
                <div className="px-6 py-10 text-sm text-muted-foreground">
                  No field definition is available for this schema key.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-md bg-card/95 shadow-xl">
              <CardHeader>
                <CardTitle className="font-serif text-3xl italic">
                  Record
                </CardTitle>
                <CardDescription>
                  Stable identifiers for CMS routing and audits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <MetaRow label="ID" value={detail.row.id} mono />
                  <MetaRow label="Table" value={detail.table} mono />
                  <MetaRow label="Schema" value={detail.schemaKey} mono />
                  <MetaRow label="Updated" value={formatCmsDate(detail.updatedAt)} />
                  <MetaRow
                    label="Created"
                    value={formatCmsDate(detail.row.created_at)}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card className="rounded-md bg-card/95 shadow-xl">
              <CardHeader>
                <CardTitle className="font-serif text-3xl italic">
                  Raw data
                </CardTitle>
                <CardDescription>
                  Full row payload for schema backfill checks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[32rem] overflow-auto rounded-md border bg-muted/40 p-4 text-xs leading-relaxed">
                  {stringify(detail.row)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}

function FieldTable({
  detail,
  fields,
}: {
  detail: CmsContentDetail
  fields: CmsFieldDefinition[]
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Rules</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={`${field.source}:${field.key}`}>
            <TableCell>
              <div className="font-medium">{field.label}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {field.key}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="rounded-full">
                {sourceLabels[field.source]}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {field.type}
            </TableCell>
            <TableCell className="min-w-[18rem] max-w-[32rem] whitespace-normal">
              <FieldValue value={resolveFieldValue(detail, field)} field={field} />
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-2">
                {field.required && (
                  <Badge variant="secondary" className="rounded-full">
                    Required
                  </Badge>
                )}
                {field.readOnly && (
                  <Badge variant="outline" className="rounded-full">
                    Read only
                  </Badge>
                )}
                {!field.required && !field.readOnly && (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FieldValue({
  value,
  field,
}: {
  value: unknown
  field: CmsFieldDefinition
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">Empty</span>
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "outline"} className="rounded-full">
        {value ? "true" : "false"}
      </Badge>
    )
  }

  if (typeof value === "object") {
    return (
      <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
        {stringify(value)}
      </pre>
    )
  }

  const text = String(value)

  if (field.type === "url" || field.type === "image") {
    return (
      <Link
        href={text}
        target="_blank"
        rel="noreferrer"
        className="break-all text-sm underline underline-offset-4"
      >
        {text}
      </Link>
    )
  }

  return <span className="whitespace-pre-wrap text-sm">{text}</span>
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="caps mb-1 text-muted-foreground">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : undefined}>{value}</dd>
    </div>
  )
}

function resolveFieldValue(
  detail: CmsContentDetail,
  field: CmsFieldDefinition,
): unknown {
  const row = detail.row as unknown as Record<string, unknown>

  if (field.source === "column") {
    return row[field.key]
  }

  if (field.source === "props") {
    return asRecord(row.props)?.[field.key]
  }

  if (field.source === "data") {
    return asRecord(row.data)?.[field.key]
  }

  if (field.source === "relation_props") {
    return asRecord(row.props)?.[field.key]
  }

  return undefined
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function stringify(value: unknown) {
  const serialized = JSON.stringify(value, null, 2)
  return serialized ?? String(value)
}
