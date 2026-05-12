import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import { CmsSectionLivePreview } from "@/app/ponix/_components/cms-live-preview"
import {
  PageSectionRelationsCard,
  RelationMutationNotice,
  relationMutationState,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { loadCmsAuditEventsForTarget } from "@/lib/cms/audit"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsRelationEditorOptions,
  loadCmsSectionDetail,
  loadCmsSectionRelations,
} from "@/lib/cms/content"
import { loadEditableSectionFields } from "@/lib/cms/section-editor.server"

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
  const [detail, relations, options, audit, search] = await Promise.all([
    loadCmsSectionDetail(id),
    loadCmsSectionRelations(id),
    loadCmsRelationEditorOptions(),
    loadCmsAuditEventsForTarget({ targetTable: "entities", targetId: id }),
    searchParams,
  ])
  const mutation = relationMutationState(search)

  if (!detail || detail.kind !== "section") {
    notFound()
  }

  const editableFields = await loadEditableSectionFields(detail.schemaKey)

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/sections"
      backLabel="All sections"
      audit={audit}
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
        relationList={relations.pageSectionList}
      />
      <SectionEntityRelationsCard
        title="Curated entities"
        description="Search existing entities, attach them here, and tune their order."
        relationList={relations.sectionEntityList}
        editable
        editorOptions={options}
        fixedSectionId={id}
        redirectTo={`/ponix/sections/${id}`}
      />
      <CmsSectionLivePreview
        detail={detail}
        fields={editableFields}
        sectionEntities={relations.sectionEntities}
        entityRelations={relations.entityRelations}
      />
    </CmsDetailPage>
  )
}
