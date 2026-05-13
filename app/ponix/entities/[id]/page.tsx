import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import {
  EntityRelationsCard,
  RelationMutationNotice,
  relationMutationState,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { loadCmsAuditEventsForTarget } from "@/lib/cms/audit"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsEntityDetail,
  loadCmsEntityRelations,
  loadCmsRelationEditorOptions,
} from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "콘텐츠 상세 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixEntityRecordPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixEntityRecordPage({
  params,
  searchParams,
}: PonixEntityRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/entities/${id}`)
  const [detail, relations, options, audit, search] = await Promise.all([
    loadCmsEntityDetail(id),
    loadCmsEntityRelations(id),
    loadCmsRelationEditorOptions(),
    loadCmsAuditEventsForTarget({ targetTable: "entities", targetId: id }),
    searchParams,
  ])
  const mutation = relationMutationState(search)

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/entities"
      backLabel="콘텐츠 목록"
      audit={audit}
      actions={
        <Link
          href={`/ponix/entities/${id}/edit`}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          콘텐츠 수정
        </Link>
      }
    >
      <RelationMutationNotice
        message={mutation.message}
        error={mutation.error}
      />
      <SectionEntityRelationsCard
        title="노출 위치"
        description="이 콘텐츠를 보여주는 섹션입니다."
        relationList={relations.sectionEntityList}
        editable
        editorOptions={options}
        fixedEntityId={id}
        redirectTo={`/ponix/entities/${id}`}
      />
      <EntityRelationsCard
        title="연결된 콘텐츠"
        description="이 콘텐츠에서 이어지는 다른 기록입니다."
        relations={relations.outgoingEntityRelations}
        editable
        editorOptions={options}
        fixedFromEntityId={id}
        redirectTo={`/ponix/entities/${id}`}
      />
      <EntityRelationsCard
        title="연결해 둔 콘텐츠"
        description="이 콘텐츠를 참조하는 다른 기록입니다."
        relations={relations.incomingEntityRelations}
        editable
        allowAdd={false}
        redirectTo={`/ponix/entities/${id}`}
      />
    </CmsDetailPage>
  )
}
