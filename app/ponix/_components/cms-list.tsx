import type { ReactNode } from "react"

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
    <section className="mx-auto flex w-full max-w-[96rem] flex-col gap-6">
      <div className="rounded-xl border bg-card/90 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="caps mb-3 text-muted-foreground">{eyebrow}</p>
            <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] italic leading-[0.9] tracking-tight">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
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
    <Card className="overflow-hidden rounded-xl border bg-card/95 shadow-sm">
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

export function PublishBadge({ published }: { published: boolean }) {
  return (
    <Badge
      variant={published ? "default" : "outline"}
      className={cn("rounded-full", !published && "text-muted-foreground")}
    >
      {published ? "Published" : "Draft"}
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
