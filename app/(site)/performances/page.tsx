import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PerformancesSection } from "@/components/performances-section"
import { loadPerformancePage } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "공연 | 브레멘 Bremen",
  description: "브레멘의 모든 공연과 활동 기록입니다.",
}

export default async function PerformancesPage() {
  const content = await loadPerformancePage()
  const sectionKeys = new Set(content?.sections.map((section) => section.key))
  const hasRequiredSections = [
    "performances-archive",
    "performances-stage-moments",
    "performances-season-index",
  ].every((key) => sectionKeys.has(key))

  if (!content || !hasRequiredSections || !content.playlists.length) {
    notFound()
  }

  return (
    <PerformancesSection
      page={content.page}
      sections={content.sections}
      playlists={content.playlists}
    />
  )
}
