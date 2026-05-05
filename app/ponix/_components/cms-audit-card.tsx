import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CmsAuditEvent, CmsAuditEventList } from "@/lib/cms/audit"

const LOW_PRIORITY_FIELDS = new Set(["created_at", "updated_at"])

export function CmsAuditTrailCard({
  audit,
  title = "Audit trail",
  description = "Append-only CMS changes recorded at the database boundary.",
  emptyMessage = "No CMS changes have been recorded yet.",
}: {
  audit: CmsAuditEventList
  title?: string
  description?: string
  emptyMessage?: string
}) {
  return (
    <Card className="rounded-md border bg-card/95 shadow-xl">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-serif text-3xl italic">{title}</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              {description}
            </CardDescription>
          </div>
          <Badge
            variant={audit.available ? "outline" : "secondary"}
            className="w-fit rounded-full"
          >
            {audit.available ? "Audit enabled" : "Migration pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {audit.events.length > 0 ? (
          <div className="divide-y rounded-md border">
            {audit.events.map((event) => (
              <AuditEventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="rounded-md border bg-background/60 p-4 text-sm leading-relaxed text-muted-foreground">
            {audit.available
              ? emptyMessage
              : "Audit storage is not available in this database yet. PONIX remains usable."}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function AuditEventRow({ event }: { event: CmsAuditEvent }) {
  const before = stringify(event.beforeData)
  const after = stringify(event.afterData)
  const diffs = auditDiffs(event)

  return (
    <div className="bg-background/50 p-4">
      <div className="grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)_12rem] md:items-center">
        <div>
          <Badge variant="outline" className="rounded-full">
            {event.action}
          </Badge>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatAuditTime(event.createdAt)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="font-medium">
            {event.targetTable}
            {event.targetId && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {event.targetId.slice(0, 8)}
              </span>
            )}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {event.changedKeys.length > 0
              ? event.changedKeys.join(", ")
              : "No top-level field diff"}
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground md:text-right">
          {event.actorMemberId ? event.actorMemberId.slice(0, 8) : "system"}
        </p>
      </div>

      {diffs.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {diffs.map((diff) => (
            <DiffBlock key={diff.key} diff={diff} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border bg-muted/25 p-3 text-sm text-muted-foreground">
          No field-level diff is available for this event.
        </p>
      )}

      {(before || after) && (
        <details className="mt-4 rounded-md border bg-muted/25 p-3">
          <summary className="cursor-pointer text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Row snapshots
          </summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <SnapshotBlock label="Before" value={before} />
            <SnapshotBlock label="After" value={after} />
          </div>
        </details>
      )}
    </div>
  )
}

type AuditDiff = {
  key: string
  before: unknown
  after: unknown
  lowPriority: boolean
}

function DiffBlock({ diff }: { diff: AuditDiff }) {
  return (
    <div
      className={
        diff.lowPriority
          ? "rounded-md border border-dashed bg-muted/15 p-3"
          : "rounded-md border bg-background/70 p-3"
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-medium">{diff.key}</span>
        {diff.lowPriority && (
          <Badge variant="secondary" className="rounded-full">
            system
          </Badge>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-start">
        <ValueBlock label="Before" value={diff.before} muted={diff.lowPriority} />
        <span className="hidden pt-8 text-muted-foreground md:block">→</span>
        <ValueBlock label="After" value={diff.after} muted={diff.lowPriority} />
      </div>
    </div>
  )
}

function ValueBlock({
  label,
  value,
  muted,
}: {
  label: string
  value: unknown
  muted: boolean
}) {
  return (
    <div>
      <p className="caps mb-2 text-muted-foreground">{label}</p>
      <div
        className={
          muted
            ? "max-h-40 overflow-auto rounded-md border bg-muted/25 p-3 font-mono text-xs leading-relaxed text-muted-foreground"
            : "max-h-40 overflow-auto rounded-md border bg-card p-3 text-sm leading-relaxed"
        }
      >
        {formatValue(value)}
      </div>
    </div>
  )
}

function SnapshotBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="caps mb-2 text-muted-foreground">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-md border bg-background/70 p-3 text-xs leading-relaxed">
        {value ?? "null"}
      </pre>
    </div>
  )
}

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value))
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return null
  return JSON.stringify(value, null, 2) ?? String(value)
}

function auditDiffs(event: CmsAuditEvent): AuditDiff[] {
  const before = asRecord(event.beforeData)
  const after = asRecord(event.afterData)

  return event.changedKeys.map((key) => ({
    key,
    before: before?.[key],
    after: after?.[key],
    lowPriority: LOW_PRIORITY_FIELDS.has(key),
  }))
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function formatValue(value: unknown) {
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
      <pre className="whitespace-pre-wrap break-words font-mono text-xs">
        {stringify(value)}
      </pre>
    )
  }

  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>
}
