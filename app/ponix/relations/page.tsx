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
  title: "노출 순서 | Bremen Admin",
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
      eyebrow="사이트 운영 / 연결"
      title="Display map"
      description="어떤 페이지에 어떤 섹션이 보이고, 각 섹션에 어떤 콘텐츠가 놓이는지 확인하고 조정합니다."
    >
      <div className="space-y-6">
        <CmsStatGrid>
          <CmsStatTile
            label="페이지-섹션"
            value={graph.pageSections.relations.length}
            detail="페이지에 배치된 섹션"
            accent
          />
          <CmsStatTile
            label="섹션-콘텐츠"
            value={graph.sectionEntities.relations.length}
            detail="섹션에 노출되는 데이터"
          />
          <CmsStatTile
            label="콘텐츠 연결"
            value={graph.entityRelations.relations.length}
            detail="공연과 영상처럼 연결된 기록"
          />
          <CmsStatTile
            label="연결 가능"
            value={options.entities.length}
            detail="연결할 수 있는 기록"
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
