import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsSectionDetail } from "@/lib/cms/content"

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
  const detail = await loadCmsSectionDetail(id)

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/sections"
      backLabel="All sections"
    />
  )
}
