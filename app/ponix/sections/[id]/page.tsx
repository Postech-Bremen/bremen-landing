import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import {
  PageSectionRelationsCard,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsSectionDetail,
  loadCmsSectionRelations,
} from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Section Detail | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixSectionRecordPageProps = {
  params: Promise<{ id: string }>
}

export default async function PonixSectionRecordPage({
  params,
}: PonixSectionRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/sections/${id}`)
  const [detail, relations] = await Promise.all([
    loadCmsSectionDetail(id),
    loadCmsSectionRelations(id),
  ])

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/sections"
      backLabel="All sections"
    >
      <PageSectionRelationsCard
        title="Page placements"
        description="Pages that include this section."
        relations={relations.pageSections}
      />
      <SectionEntityRelationsCard
        title="Curated entities"
        description="Entities attached to this section by slot and order."
        relations={relations.sectionEntities}
      />
    </CmsDetailPage>
  )
}
