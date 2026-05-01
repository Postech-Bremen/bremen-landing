import type { Metadata } from "next"

import {
  EntityRelationsCard,
  PageSectionRelationsCard,
  RelationMutationNotice,
  relationMutationState,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { CmsListPage } from "@/app/ponix/_components/cms-list"
import { requireCmsAdmin } from "@/lib/cms/auth"
import {
  loadCmsRelationEditorOptions,
  loadCmsRelationGraph,
} from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Relations | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixRelationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function PonixRelationsPage({
  searchParams,
}: PonixRelationsPageProps) {
  await requireCmsAdmin("/ponix/relations")
  const [graph, options, params] = await Promise.all([
    loadCmsRelationGraph(),
    loadCmsRelationEditorOptions(),
    searchParams,
  ])
  const mutation = relationMutationState(params)

  return (
    <CmsListPage
      eyebrow="PONIX / Relations"
      title="Relations"
      description="The content graph that connects pages, sections, and reusable entities."
    >
      <div className="space-y-6">
        <RelationMutationNotice
          message={mutation.message}
          error={mutation.error}
        />
        <PageSectionRelationsCard relationList={graph.pageSections} />
        <SectionEntityRelationsCard
          relationList={graph.sectionEntities}
          editable
          editorOptions={options}
          redirectTo="/ponix/relations"
        />
        <EntityRelationsCard
          relationList={graph.entityRelations}
          editable
          editorOptions={options}
          redirectTo="/ponix/relations"
        />
      </div>
    </CmsListPage>
  )
}
