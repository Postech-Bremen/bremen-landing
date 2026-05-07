import { HistorySection } from "@/components/history-section"
import { HomeSection } from "@/components/home-section"
import { PerformancesSection } from "@/components/performances-section"
import { PhotosSection } from "@/components/photos-section"
import { AdminSectionFrame } from "@/components/admin-section-frame"
import { Badge } from "@/components/ui/badge"
import { VideosSection } from "@/components/videos-section"
import type { DraftPreviewPageContent } from "@/lib/data/content-graph"

export function PonixPagePreviewRenderer({
  preview,
  pageId,
  selectedSectionKey,
}: {
  preview: DraftPreviewPageContent
  pageId?: string
  selectedSectionKey?: string | null
}) {
  const adminSectionControl = pageId
    ? {
        pageId,
        selectedKey: selectedSectionKey,
      }
    : undefined

  if (preview.kind === "performances") {
    return (
      <PerformancesSection
        page={preview.page}
        sections={preview.sections}
        playlists={preview.playlists}
        adminSectionControl={adminSectionControl}
      />
    )
  }

  if (preview.kind === "home") {
    return (
      <HomeSection
        overview={preview.overview}
        adminSectionControl={adminSectionControl}
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
        adminSectionControl={adminSectionControl}
      />
    )
  }

  if (preview.kind === "photos") {
    return (
      <PhotosSection
        page={preview.page}
        sections={preview.sections}
        photos={preview.photos}
        adminSectionControl={adminSectionControl}
      />
    )
  }

  if (preview.kind === "history") {
    return (
      <HistorySection
        page={preview.page}
        sections={preview.sections}
        milestones={preview.milestones}
        adminSectionControl={adminSectionControl}
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
      <div className="grid gap-4 md:grid-cols-2">
        {preview.graph.sections.map((section) => (
          <AdminSectionFrame
            key={section.id}
            sectionKey={section.key}
            sectionTitle={section.title}
            control={adminSectionControl}
          >
            <article className="rounded-md border bg-card p-5">
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
            </article>
          </AdminSectionFrame>
        ))}
      </div>
    </section>
  )
}
