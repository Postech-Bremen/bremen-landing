import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps mb-5">{eyebrow}</p>
            <h1 className="font-serif text-[clamp(3.5rem,10vw,7rem)] italic leading-[0.82] tracking-tight">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <Button asChild variant="outline" className="w-fit rounded-full">
              <Link href="/ponix">PONIX Home</Link>
            </Button>
          </div>
        </div>
        {children}
      </section>
    </main>
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
    <Card className="rounded-md border bg-card/95 shadow-xl">
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle className="font-serif text-3xl italic">{title}</CardTitle>
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
