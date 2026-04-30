import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsEntityEditorPage } from "@/app/ponix/_components/cms-entity-form"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsEntityDetail } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "Edit PONIX Entity | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixEntityEditPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PonixEntityEditPage({
  params,
  searchParams,
}: PonixEntityEditPageProps) {
  const { id } = await params
  const query = (await searchParams) ?? {}

  await requireCmsAdmin(`/ponix/entities/${id}/edit`)
  const detail = await loadCmsEntityDetail(id)

  if (!detail || detail.kind !== "entity") {
    notFound()
  }

  return <CmsEntityEditorPage detail={detail} error={firstParam(query.error)} />
}
