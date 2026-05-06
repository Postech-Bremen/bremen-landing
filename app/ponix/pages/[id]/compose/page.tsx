import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, Database, Layers3, PencilLine } from "lucide-react"

import { PonixPagePreviewRenderer } from "@/app/ponix/_components/page-preview-renderer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadDraftPreviewPage } from "@/lib/data/content-graph"
import type { GraphSection } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "PONIX Page Composer | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPageComposerPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixPageComposerPage({
  params,
  searchParams,
}: PonixPageComposerPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])

  await requireCmsAdmin(`/ponix/pages/${id}/compose`)
  const preview = await loadDraftPreviewPage(id)

  if (!preview) {
    notFound()
  }

  const selectedParam = searchValue(search?.section)
  const selectedSection =
    preview.graph.sections.find((section) => section.key === selectedParam) ??
    preview.graph.sections[0] ??
    null
  const selectedKey = selectedSection?.key ?? null

  return (
    <section className="mx-auto flex w-full max-w-[104rem] flex-col gap-5">
      <ComposerHeader
        pageId={id}
        title={preview.page.title}
        slug={preview.page.slug}
        kind={preview.kind}
        sectionCount={preview.graph.sections.length}
      />

      <div className="grid min-h-[calc(100svh-13rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden rounded-xl bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="caps text-muted-foreground">Page canvas</p>
                <CardTitle className="font-serif text-3xl italic md:text-4xl">
                  Live composition
                </CardTitle>
                <CardDescription>
                  실제 공개 페이지 renderer에 PONIX 섹션 선택 레이어만 얹은 화면입니다.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="w-fit rounded-full">
                <Link href={`/ponix/preview/pages/${id}`}>
                  Preview route
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
            <SectionRail
              pageId={id}
              sections={preview.graph.sections}
              selectedKey={selectedKey}
            />
          </CardHeader>
          <CardContent className="bg-[#f7f1e8] p-0">
            <div className="max-h-[calc(100svh-18rem)] overflow-auto">
              <PonixPagePreviewRenderer
                preview={preview}
                pageId={id}
                selectedSectionKey={selectedKey}
              />
            </div>
          </CardContent>
        </Card>

        <SectionInspector
          pageSlug={preview.page.slug}
          section={selectedSection}
        />
      </div>
    </section>
  )
}

function ComposerHeader({
  pageId,
  title,
  slug,
  kind,
  sectionCount,
}: {
  pageId: string
  title: string
  slug: string
  kind: string
  sectionCount: number
}) {
  return (
    <div className="rounded-xl border bg-card/90 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="caps mb-3 text-muted-foreground">PONIX / Composer</p>
          <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] italic leading-[0.9] tracking-tight">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full font-mono">
              /{slug}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {kind}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {sectionCount} sections
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/ponix/pages/${pageId}`}>Record</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href={`/ponix/pages/${pageId}/edit`}>Edit page</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function SectionRail({
  pageId,
  sections,
  selectedKey,
}: {
  pageId: string
  sections: GraphSection[]
  selectedKey: string | null
}) {
  if (!sections.length) {
    return null
  }

  return (
    <ScrollArea className="mt-5 whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        {sections.map((section, index) => {
          const selected = section.key === selectedKey

          return (
            <Button
              key={section.id}
              asChild
              variant={selected ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              <Link href={composeHref(pageId, section.key)}>
                <span className="tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title ?? section.key}
              </Link>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function SectionInspector({
  pageSlug,
  section,
}: {
  pageSlug: string
  section: GraphSection | null
}) {
  return (
    <aside className="xl:sticky xl:top-40 xl:self-start">
      <Card className="overflow-hidden rounded-xl bg-card/95 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <p className="caps text-muted-foreground">Inspector</p>
          <CardTitle className="font-serif text-3xl italic">
            {section ? (section.title ?? section.key) : "No section"}
          </CardTitle>
          <CardDescription>
            선택한 섹션의 renderer, schema, 연결 엔티티를 확인하고 편집 화면으로 이동합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {!section ? (
            <p className="text-sm text-muted-foreground">
              이 페이지에 연결된 섹션이 없습니다.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full font-mono">
                  {section.key}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {section.sectionType}
                </Badge>
              </div>

              <div className="grid gap-3 text-sm">
                <MetaRow label="Page" value={`/${pageSlug}`} />
                <MetaRow label="Schema" value={section.schemaKey} mono />
                <MetaRow label="Sort" value={String(section.sortOrder)} />
                <MetaRow
                  label="Entities"
                  value={`${section.items.length} linked`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild className="rounded-full">
                  <Link href={`/ponix/sections/${section.id}/edit`}>
                    <PencilLine className="size-4" />
                    Edit section
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/ponix/sections/${section.id}`}>Open record</Link>
                </Button>
              </div>

              <Separator />

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Database className="size-4 text-muted-foreground" />
                  <h2 className="font-medium">Section entities</h2>
                </div>
                {section.items.length ? (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li
                        key={`${item.entity.id}:${item.slot}:${item.sortOrder}`}
                        className="rounded-md border bg-background/70 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/ponix/entities/${item.entity.id}`}
                              className="line-clamp-1 text-sm font-medium underline-offset-4 hover:underline"
                            >
                              {item.entity.title}
                            </Link>
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.entity.schema_key}
                            </p>
                          </div>
                          <Badge variant="outline" className="rounded-full">
                            {item.slot}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {item.entity.subtitle ?? item.entity.summary ?? item.entity.entity_type}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                    이 섹션에 연결된 엔티티가 없습니다.
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Layers3 className="size-4 text-muted-foreground" />
                  <h2 className="font-medium">Props</h2>
                </div>
                <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                  {JSON.stringify(section.props, null, 2)}
                </pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
      <dt className="caps text-muted-foreground">{label}</dt>
      <dd className={mono ? "truncate font-mono text-xs" : "truncate"}>
        {value}
      </dd>
    </div>
  )
}

function composeHref(pageId: string, sectionKey: string) {
  return `/ponix/pages/${pageId}/compose?section=${encodeURIComponent(sectionKey)}`
}

function searchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}
