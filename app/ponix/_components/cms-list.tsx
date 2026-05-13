import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function CmsListPage({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mx-auto flex w-full max-w-[92rem] flex-col gap-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border bg-card/95 p-5 shadow-sm md:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--muted)_72%,transparent),transparent_48%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="caps mb-3 text-muted-foreground">{eyebrow}</p>
            <h1 className="font-serif text-[clamp(2.5rem,4vw,4.75rem)] italic leading-[0.9] tracking-tight">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

export function CmsTableCard({
  title,
  meta,
  children,
}: {
  title: string
  meta: string
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border bg-card/95 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle className="font-serif text-2xl italic md:text-3xl">
            {title}
          </CardTitle>
          <p className="caps text-muted-foreground">{meta}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

export function CmsStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-4">{children}</div>
}

export function CmsStatTile({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string
  value: string | number
  detail: string
  accent?: boolean
}) {
  return (
    <Card
      className={cn(
        "rounded-[1.5rem] border bg-card/95 shadow-sm",
        accent && "border-transparent bg-primary text-primary-foreground",
      )}
    >
      <CardHeader className="pb-2">
        <p className={cn("caps", accent && "text-primary-foreground/65")}>
          {label}
        </p>
        <CardTitle className="font-serif text-5xl italic leading-none">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "text-sm text-muted-foreground",
          accent && "text-primary-foreground/75",
        )}
      >
        {detail}
      </CardContent>
    </Card>
  )
}

export function CmsRecordGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
}

export function CmsRecordCard({
  href,
  eyebrow,
  title,
  description,
  badges,
  meta,
  actionLabel = "Open",
  media,
}: {
  href: string
  eyebrow: string
  title: string
  description?: string | null
  badges?: ReactNode
  meta?: ReactNode
  actionLabel?: string
  media?: ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-56 flex-col overflow-hidden rounded-[1.5rem] border bg-card/95 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-xl focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {media && (
        <div className="relative h-28 overflow-hidden border-b bg-muted/40">
          {media}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <p className="caps min-w-0 truncate text-muted-foreground">{eyebrow}</p>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
        <h2 className="font-serif-kr text-2xl leading-tight">{title}</h2>
        {description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {badges && <div className="mt-5 flex flex-wrap gap-2">{badges}</div>}
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="min-w-0 text-xs text-muted-foreground">{meta}</div>
          <span className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors group-hover:border-accent/40 group-hover:bg-accent group-hover:text-accent-foreground">
            {actionLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <Badge
      variant={published ? "default" : "outline"}
      className={cn("rounded-full", !published && "text-muted-foreground")}
    >
      {published ? "공개" : "비공개"}
    </Badge>
  )
}

export function SchemaBadge({
  label,
  registered,
}: {
  label: string
  registered: boolean
}) {
  return (
    <Badge
      variant={registered ? "secondary" : "outline"}
      className={cn("rounded-full", !registered && "border-destructive/40")}
    >
      {label}
    </Badge>
  )
}

export function formatCmsDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}
