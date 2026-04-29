import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PhotosSection } from "@/components/photos-section"
import { loadPhotoPage } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "사진 | 브레멘 Bremen",
  description: "브레멘의 공연, 연습, 단체 활동 사진 갤러리입니다.",
}

export default async function PhotosPage() {
  const content = await loadPhotoPage()
  const hasGallerySection = content?.sections.some(
    (section) => section.key === "photos-gallery",
  )

  if (!content || !hasGallerySection || !content.photos.length) {
    notFound()
  }

  return (
    <PhotosSection
      page={content.page}
      sections={content.sections}
      photos={content.photos}
    />
  )
}
