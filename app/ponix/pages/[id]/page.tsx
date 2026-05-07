import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CmsDetailPage } from "@/app/ponix/_components/cms-detail"
import {
  PageSectionRelationsCard,
  RelationMutationNotice,
  relationMutationState,
} from "@/app/ponix/_components/cms-relations"
import { loadCmsAuditEventsForTarget } from "@/lib/cms/audit"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsPageDetail,
  loadCmsPageRelations,
  loadCmsRelationEditorOptions,
} from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Page Detail | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPageRecordPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixPageRecordPage({
  params,
  searchParams,
}: PonixPageRecordPageProps) {
  const { id } = await params

  await requireCmsAdmin(`/ponix/pages/${id}`)
  const [detail, relations, options, audit, search] = await Promise.all([
    loadCmsPageDetail(id),
    loadCmsPageRelations(id),
    loadCmsRelationEditorOptions({ includeEntities: false }),
    loadCmsAuditEventsForTarget({ targetTable: "pages", targetId: id }),
    searchParams,
  ])
  const mutation = relationMutationState(search)

  if (!detail) {
    notFound()
  }

  return (
    <CmsDetailPage
      detail={detail}
      backHref="/ponix/pages"
      backLabel="All pages"
      audit={audit}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ponix/pages/${id}/edit`}
            className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Edit page
          </Link>
          <Link
            href={`/ponix/pages/${id}/compose`}
            className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            Compose page
          </Link>
          <Link
            href={`/ponix/preview/pages/${id}`}
            className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Preview
          </Link>
        </div>
      }
    >
      <RelationMutationNotice
        message={mutation.message}
        error={mutation.error}
      />
      <PageSectionRelationsCard
        title="Page structure"
        description="Sections attached to this page in render order."
        relations={relations.pageSections}
        editable
        editorOptions={options}
        fixedPageId={id}
        redirectTo={`/ponix/pages/${id}`}
      />
    </CmsDetailPage>
  )
}
