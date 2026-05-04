import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { HistorySection } from "@/components/history-section"
import { PerformancesSection } from "@/components/performances-section"
import { PhotosSection } from "@/components/photos-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VideosSection } from "@/components/videos-section"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadDraftPreviewPage,
  type DraftPreviewPageContent,
} from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "PONIX Draft Preview | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPagePreviewProps = {
  params: Promise<{ id: string }>
}

export default async function PonixPagePreview({ params }: PonixPagePreviewProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/preview/pages/${id}`)
  const preview = await loadDraftPreviewPage(id)

  if (!preview) {
    notFound()
  }

  return (
    <div>
      <PreviewBanner preview={preview} pageId={id} />
      {renderPreview(preview)}
    </div>
  )
}

function renderPreview(preview: DraftPreviewPageContent) {
  if (preview.kind === "performances") {
    return (
      <PerformancesSection
        page={preview.page}
        sections={preview.sections}
        playlists={preview.playlists}
      />
    )
  }

  if (preview.kind === "videos") {
    return (
      <VideosSection
        page={preview.page}
        sections={preview.sections}
        videos={preview.libraryVideos}
        featuredVideos={preview.featuredVideos}
        popularVideos={preview.popularVideos}
      />
    )
  }

  if (preview.kind === "photos") {
    return (
      <PhotosSection
        page={preview.page}
        sections={preview.sections}
        photos={preview.photos}
      />
    )
  }

  if (preview.kind === "history") {
    return (
      <HistorySection
        page={preview.page}
        sections={preview.sections}
        milestones={preview.milestones}
      />
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-24">
      <div className="mb-10">
        <p className="caps mb-5 text-muted-foreground">Generic page preview</p>
        <h1 className="font-serif text-[clamp(3.25rem,8vw,6.5rem)] italic leading-[0.84] tracking-tight">
          {preview.page.title}
        </h1>
        {preview.page.description && (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {preview.page.description}
          </p>
        )}
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {preview.graph.sections.map((section) => (
          <li key={section.id} className="rounded-md border bg-card p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="outline">{section.key}</Badge>
              <Badge variant="secondary">{section.sectionType}</Badge>
            </div>
            <h2 className="font-serif text-3xl italic">
              {section.title ?? section.key}
            </h2>
            {section.subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">
                {section.subtitle}
              </p>
            )}
            <p className="caps mt-5 text-muted-foreground">
              {section.items.length} entities
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PreviewBanner({
  preview,
  pageId,
}: {
  preview: DraftPreviewPageContent
  pageId: string
}) {
  return (
    <aside className="sticky top-20 z-40 border-b bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge>Draft preview</Badge>
            <Badge variant="outline" className="font-mono">
              {preview.kind}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            PONIX admin preview. Public routes still hide unpublished content.
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit rounded-full">
          <Link href={`/ponix/pages/${pageId}`}>Back to page record</Link>
        </Button>
      </div>
    </aside>
  )
}
