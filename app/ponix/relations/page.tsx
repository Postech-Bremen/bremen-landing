import type { Metadata } from "next"

import {
  EntityRelationsCard,
  PageSectionRelationsCard,
  RelationMutationNotice,
  relationMutationState,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import {
  CmsListPage,
  CmsStatGrid,
  CmsStatTile,
} from "@/app/ponix/_components/cms-list"
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
      title="Content Graph"
      description="페이지, 섹션, 데이터를 어떤 순서로 보여줄지 연결하는 운영 지도입니다."
    >
      <div className="space-y-6">
        <CmsStatGrid>
          <CmsStatTile
            label="Page sections"
            value={graph.pageSections.relations.length}
            detail="페이지에 배치된 섹션"
            accent
          />
          <CmsStatTile
            label="Section data"
            value={graph.sectionEntities.relations.length}
            detail="섹션에 노출되는 데이터"
          />
          <CmsStatTile
            label="Entity links"
            value={graph.entityRelations.relations.length}
            detail="공연과 영상처럼 연결된 기록"
          />
          <CmsStatTile
            label="Data options"
            value={options.entities.length}
            detail="연결 후보 데이터"
          />
        </CmsStatGrid>
        <RelationMutationNotice
          message={mutation.message}
          error={mutation.error}
        />
        <PageSectionRelationsCard
          relationList={graph.pageSections}
          editable
          editorOptions={options}
          redirectTo="/ponix/relations"
        />
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
