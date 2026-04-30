import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import { PageSectionRelationsCard } from "@/app/ponix/_components/cms-relations"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsPageDetail, loadCmsPageRelations } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Page Detail | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPageRecordPageProps = {
  params: Promise<{ id: string }>
}

export default async function PonixPageRecordPage({
  params,
}: PonixPageRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/pages/${id}`)
  const [detail, relations] = await Promise.all([
    loadCmsPageDetail(id),
    loadCmsPageRelations(id),
  ])

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/pages"
      backLabel="All pages"
    >
      <PageSectionRelationsCard
        title="Page structure"
        description="Sections attached to this page in render order."
        relations={relations.pageSections}
      />
    </CmsDetailPage>
  )
}
