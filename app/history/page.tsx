import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HistorySection } from "@/components/history-section"
import { loadHistoryPage } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "역사 | 브레멘 Bremen",
  description: "브레멘의 시작과 치어로밴드, 공연 문화의 변화를 정리한 히스토리입니다.",
}

export default async function HistoryPage() {
  const content = await loadHistoryPage()
  const hasTimelineSection = content?.sections.some(
    (section) => section.key === "history-timeline",
  )

  if (!content || !hasTimelineSection || !content.milestones.length) {
    notFound()
  }

  return (
    <HistorySection
      page={content.page}
      sections={content.sections}
      milestones={content.milestones}
    />
  )
}
