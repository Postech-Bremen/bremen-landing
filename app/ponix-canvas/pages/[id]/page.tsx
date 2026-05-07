import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PonixPagePreviewRenderer } from "@/app/ponix/_components/page-preview-renderer"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadDraftPreviewPage } from "@/lib/data/content-graph"

export const metadata: Metadata = {
  title: "PONIX Canvas | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixCanvasPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixCanvasPage({
  params,
  searchParams,
}: PonixCanvasPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])

  await requireCmsAdmin(`/ponix-canvas/pages/${id}`)
  const preview = await loadDraftPreviewPage(id)

  if (!preview) {
    notFound()
  }

  return (
    <PonixPagePreviewRenderer
      preview={preview}
      pageId={id}
      selectedSectionKey={searchValue(search?.section)}
    />
  )
}

function searchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}
