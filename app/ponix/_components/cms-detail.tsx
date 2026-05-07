import Link from "next/link"
import type { ReactNode } from "react"

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
import type { CmsAuditEventList } from "@/lib/cms/audit"
import type { CmsContentDetail } from "@/lib/cms/content"
import {
  getCmsSchema,
  type CmsFieldDefinition,
  type CmsFieldSource,
} from "@/lib/cms/schema-registry"

import { CmsAuditTrailCard } from "./cms-audit-card"
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
  actions,
  audit,
  children,
}: {
  detail: CmsContentDetail
  backHref: string
  backLabel: string
  actions?: ReactNode
  audit?: CmsAuditEventList
  children?: ReactNode
}) {
  const schema = getCmsSchema(detail.schemaKey)
  const fieldCount = schema?.fields.length ?? 0

  return (
    <section className="mx-auto flex w-full max-w-[96rem] flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border bg-card/95 p-5 shadow-sm md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,color-mix(in_oklch,var(--accent)_11%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--muted)_88%,transparent),transparent_42%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="caps mb-3 text-muted-foreground">
              PONIX / {detail.table}
            </p>
            <h1 className="font-serif text-[clamp(3rem,6vw,5.5rem)] italic leading-[0.86] tracking-tight">
              {detail.title}
            </h1>
            {detail.subtitle && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {detail.subtitle}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2">
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
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild variant="outline" className="w-fit rounded-full">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
            {actions}
          </div>
        </div>
      </div>

      {!schema && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>수정 화면을 만들 스키마가 없습니다</AlertTitle>
          <AlertDescription>
            데이터는 존재하지만 <code>{detail.schemaKey}</code> 형태를 PONIX가
            아직 해석하지 못합니다.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="font-serif text-2xl italic md:text-3xl">
                  Editable fields
                </CardTitle>
                <CardDescription>
                  PONIX가 알고 있는 항목과 현재 저장된 값을 확인합니다.
                </CardDescription>
              </div>
              <p className="caps text-muted-foreground">{fieldCount} fields</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {schema ? (
              <FieldTable detail={detail} fields={schema.fields} />
            ) : (
              <div className="px-6 py-10 text-sm text-muted-foreground">
                이 데이터 형태에 대한 편집 항목이 아직 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl italic md:text-3xl">
                Record
              </CardTitle>
              <CardDescription>
                이 항목을 찾고 추적하는 데 쓰는 기본 정보입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4 text-sm">
                <MetaRow label="ID" value={detail.row.id} mono />
                <MetaRow label="Table" value={detail.table} mono />
                <MetaRow label="Schema" value={detail.schemaKey} mono />
                <MetaRow
                  label="Updated"
                  value={formatCmsDate(detail.updatedAt)}
                />
                <MetaRow
                  label="Created"
                  value={formatCmsDate(detail.row.created_at)}
                />
              </dl>
            </CardContent>
          </Card>

          {audit && (
            <CmsAuditTrailCard
              audit={audit}
              title="Record audit"
              description="Recent changes for this CMS record."
              emptyMessage="No changes have been recorded for this record yet."
            />
          )}

          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-2xl italic md:text-3xl">
                Raw data
              </CardTitle>
              <CardDescription>
                문제가 있을 때 확인하는 원본 저장값입니다.
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

      {children && <div className="space-y-6">{children}</div>}
    </section>
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
