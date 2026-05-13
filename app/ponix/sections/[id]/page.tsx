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
  title: "섹션 상세 | Bremen Admin",
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
      backLabel="섹션 목록"
      audit={audit}
      actions={
        <Link
          href={`/ponix/sections/${id}/edit`}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          섹션 수정
        </Link>
      }
    >
      <RelationMutationNotice
        message={mutation.message}
        error={mutation.error}
      />
      <PageSectionRelationsCard
        title="사용 중인 페이지"
        description="이 섹션이 표시되는 페이지입니다."
        relationList={relations.pageSectionList}
      />
      <SectionEntityRelationsCard
        title="섹션 콘텐츠"
        description="이 섹션에 노출되는 콘텐츠와 순서입니다."
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
