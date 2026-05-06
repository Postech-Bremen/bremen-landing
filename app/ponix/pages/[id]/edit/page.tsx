import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsPageEditorPage } from "@/app/ponix/_components/cms-page-form"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsPageDetail } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Edit Page | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixEditPageRecordPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixEditPageRecordPage({
  params,
  searchParams,
}: PonixEditPageRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/pages/${id}/edit`)
  const [detail, search] = await Promise.all([
    loadCmsPageDetail(id),
    searchParams,
  ])

  if (!detail || detail.kind !== "page") {
    notFound()
  }

  const error = typeof search?.error === "string" ? search.error : undefined
  const saved = search?.saved === "page"

  return <CmsPageEditorPage detail={detail} error={error} saved={saved} />
}
