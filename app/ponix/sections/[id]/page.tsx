import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import {
  PageSectionRelationsCard,
  RelationMutationNotice,
  relationMutationState,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsRelationEditorOptions,
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
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixSectionRecordPage({
  params,
  searchParams,
}: PonixSectionRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/sections/${id}`)
  const [detail, relations, options, search] = await Promise.all([
    loadCmsSectionDetail(id),
    loadCmsSectionRelations(id),
    loadCmsRelationEditorOptions(),
    searchParams,
  ])
  const mutation = relationMutationState(search)

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/sections"
      backLabel="All sections"
      actions={
        <Link
          href={`/ponix/sections/${id}/edit`}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          Edit section
        </Link>
      }
    >
      <RelationMutationNotice
        message={mutation.message}
        error={mutation.error}
      />
      <PageSectionRelationsCard
        title="Page placements"
        description="Pages that include this section."
        relations={relations.pageSections}
      />
      <SectionEntityRelationsCard
        title="Curated entities"
        description="Entities attached to this section by slot and order."
        relations={relations.sectionEntities}
        editable
        editorOptions={options}
        fixedSectionId={id}
        redirectTo={`/ponix/sections/${id}`}
      />
    </CmsDetailPage>
  )
}
