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
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsEntityDetail,
  loadCmsEntityRelations,
  loadCmsRelationEditorOptions,
} from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Entity Detail | 브레멘 Bremen",
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
  const [detail, relations, options, search] = await Promise.all([
    loadCmsEntityDetail(id),
    loadCmsEntityRelations(id),
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
      backHref="/ponix/entities"
      backLabel="All entities"
      actions={
        <Link
          href={`/ponix/entities/${id}/edit`}
          className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
        >
          Edit entity
        </Link>
      }
    >
      <RelationMutationNotice
        message={mutation.message}
        error={mutation.error}
      />
      <SectionEntityRelationsCard
        title="Section placements"
        description="Sections that curate this entity."
        relations={relations.sectionEntities}
        editable
        editorOptions={options}
        fixedEntityId={id}
        redirectTo={`/ponix/entities/${id}`}
      />
      <EntityRelationsCard
        title="Outgoing relations"
        description="Entities linked from this record."
        relations={relations.outgoingEntityRelations}
        editable
        editorOptions={options}
        fixedFromEntityId={id}
        redirectTo={`/ponix/entities/${id}`}
      />
      <EntityRelationsCard
        title="Incoming relations"
        description="Entities that link to this record."
        relations={relations.incomingEntityRelations}
        editable
        allowAdd={false}
        redirectTo={`/ponix/entities/${id}`}
      />
    </CmsDetailPage>
  )
}
