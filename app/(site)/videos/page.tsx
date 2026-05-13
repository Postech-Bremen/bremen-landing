import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { VideosSection } from "@/components/videos-section"
import { loadVideoPage } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "영상 | 브레멘 Bremen",
  description: "포스텍 밴드 동아리 브레멘의 공연 영상 아카이브.",
}

export default async function VideosPage() {
  const content = await loadVideoPage()
  const sectionKeys = new Set(content?.sections.map((section) => section.key))
  const hasRequiredSections = [
    "videos-featured",
    "videos-popular",
    "videos-library",
  ].every((key) => sectionKeys.has(key))

  if (
    !content ||
    !hasRequiredSections ||
    !content.featuredVideos.length ||
    !content.popularVideos.length ||
    !content.libraryVideos.length
  ) {
    notFound()
  }

  return (
    <VideosSection
      page={content.page}
      sections={content.sections}
      videos={content.libraryVideos}
      featuredVideos={content.featuredVideos}
      popularVideos={content.popularVideos}
    />
  )
}
