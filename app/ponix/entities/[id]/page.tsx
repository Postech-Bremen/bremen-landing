import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import {
  EntityRelationsCard,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsEntityDetail,
  loadCmsEntityRelations,
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
}

export default async function PonixEntityRecordPage({
  params,
}: PonixEntityRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/entities/${id}`)
  const [detail, relations] = await Promise.all([
    loadCmsEntityDetail(id),
    loadCmsEntityRelations(id),
  ])

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
      <SectionEntityRelationsCard
        title="Section placements"
        description="Sections that curate this entity."
        relations={relations.sectionEntities}
      />
      <EntityRelationsCard
        title="Outgoing relations"
        description="Entities linked from this record."
        relations={relations.outgoingEntityRelations}
      />
      <EntityRelationsCard
        title="Incoming relations"
        description="Entities that link to this record."
        relations={relations.incomingEntityRelations}
      />
    </CmsDetailPage>
  )
}
