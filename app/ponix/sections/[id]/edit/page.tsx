import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CmsSectionEditorPage } from "@/app/ponix/_components/cms-section-form"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsSectionDetail,
  loadCmsSectionRelations,
} from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "Edit PONIX Section | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixSectionEditPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PonixSectionEditPage({
  params,
  searchParams,
}: PonixSectionEditPageProps) {
  const { id } = await params
  const query = (await searchParams) ?? {}

  await requireCmsAdmin(`/ponix/sections/${id}/edit`)
  const [detail, relations] = await Promise.all([
    loadCmsSectionDetail(id),
    loadCmsSectionRelations(id),
  ])

  if (!detail || detail.kind !== "section") {
    notFound()
  }

  return (
    <CmsSectionEditorPage
      detail={detail}
      relations={relations}
      error={firstParam(query.error)}
    />
  )
}
