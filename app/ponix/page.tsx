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
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps mb-5">Bremen CMS</p>
            <h1 className="font-serif text-[clamp(4rem,12vw,8rem)] italic leading-[0.82] tracking-tight">
              PONIX
            </h1>
            <p className="mt-5 max-w-2xl font-serif italic text-3xl leading-tight text-muted-foreground md:text-4xl">
              Content graph control surface.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-4 py-2">
            Signed in as {member.name}
          </Badge>
        </div>

        <Card className="mb-5 rounded-md border bg-card/95 shadow-xl">
          <CardHeader>
            <CardTitle className="font-serif text-3xl italic">
              Schema registry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ["Total", stats.total],
                ["Pages", stats.pages],
                ["Sections", stats.sections],
                ["Entities", stats.entities],
                ["Relations", stats.relations],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border bg-background/60 p-4">
                  <p className="caps mb-2">{label}</p>
                  <p className="font-serif text-4xl italic">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {schemaGroups.map((group) => {
            const schemas = getCmsSchemasByKind(group.kind)

            return (
              <Card
                key={group.kind}
                className="rounded-md border bg-card/95 shadow-xl"
              >
                <CardHeader>
                  <CardTitle className="font-serif text-3xl italic">
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

        <div className="mt-5">
          <CmsAuditTrailCard audit={audit} title="Recent audit trail" />
        </div>
      </section>
    </main>
  )
}
