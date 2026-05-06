import type { Metadata } from "next"
import Link from "next/link"

import { CmsAuditTrailCard } from "@/app/ponix/_components/cms-audit-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { loadRecentCmsAuditEvents } from "@/lib/cms/audit"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  getCmsSchemaStats,
  getCmsSchemasByKind,
  type CmsSchemaKind,
} from "@/lib/cms/schema-registry"

export const metadata: Metadata = {
  title: "PONIX CMS | 브레멘 Bremen",
  description: "Bremen CMS control surface",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixPage() {
  const [member, audit] = await Promise.all([
    requireCmsAdmin("/ponix"),
    loadRecentCmsAuditEvents(),
  ])
  const stats = getCmsSchemaStats()
  const schemaGroups: Array<{
    kind: CmsSchemaKind
    title: string
    body: string
    href: string | null
  }> = [
    {
      kind: "page",
      title: "Pages",
      body: "Route-level records and page metadata.",
      href: "/ponix/pages",
    },
    {
      kind: "section",
      title: "Sections",
      body: "Renderer contracts, section copy, and props.",
      href: "/ponix/sections",
    },
    {
      kind: "entity",
      title: "Entities",
      body: "Videos, photos, performances, history, stats, and links.",
      href: "/ponix/entities",
    },
    {
      kind: "relation",
      title: "Relations",
      body: "Section curation and entity-to-entity domain links.",
      href: "/ponix/relations",
    },
  ]

  return (
    <section className="mx-auto flex w-full max-w-[96rem] flex-col gap-6">
      <div className="rounded-xl border bg-card/90 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="caps mb-3 text-muted-foreground">Bremen Admin</p>
            <h1 className="font-serif text-[clamp(3rem,7vw,5.5rem)] italic leading-[0.9] tracking-tight">
              PONIX
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Content graph, member operations, and audit visibility for Bremen.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-4 py-2">
            Signed in as {member.name}
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl border bg-card/95 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="font-serif text-2xl italic md:text-3xl">
            Schema registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 md:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Total", stats.total],
              ["Pages", stats.pages],
              ["Sections", stats.sections],
              ["Entities", stats.entities],
              ["Relations", stats.relations],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-background/60 p-4">
                <p className="caps mb-2 text-muted-foreground">{label}</p>
                <p className="font-serif text-4xl italic">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {schemaGroups.map((group) => {
          const schemas = getCmsSchemasByKind(group.kind)

          return (
            <Card
              key={group.kind}
              className="overflow-hidden rounded-xl border bg-card/95 shadow-sm"
            >
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="font-serif text-2xl italic md:text-3xl">
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {group.body}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {schemas.map((schema) => (
                    <Badge
                      key={schema.schemaKey}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {schema.label}
                    </Badge>
                  ))}
                </div>
                <div className="mt-6">
                  {group.href ? (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={group.href}>Open {group.title}</Link>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="rounded-full">
                      Planned
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <CmsAuditTrailCard audit={audit} title="Recent audit trail" />
    </section>
  )
}
