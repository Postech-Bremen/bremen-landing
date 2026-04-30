import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsEntityDetail } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Entity Detail | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixEntityRecordPageProps = {
  params: Promise<{ id: string }>
}

export default async function PonixEntityRecordPage({
  params,
}: PonixEntityRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/entities/${id}`)
  const detail = await loadCmsEntityDetail(id)

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/entities"
      backLabel="All entities"
    />
  )
}
