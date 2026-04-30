import type { Metadata } from "next"

import {
  EntityRelationsCard,
  PageSectionRelationsCard,
  SectionEntityRelationsCard,
} from "@/app/ponix/_components/cms-relations"
import { CmsListPage } from "@/app/ponix/_components/cms-list"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsRelationGraph } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Relations | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixRelationsPage() {
  await requireCmsAdmin("/ponix/relations")
  const graph = await loadCmsRelationGraph()

  return (
    <CmsListPage
      eyebrow="PONIX / Relations"
      title="Relations"
      description="The content graph that connects pages, sections, and reusable entities."
    >
      <div className="space-y-6">
        <PageSectionRelationsCard relationList={graph.pageSections} />
        <SectionEntityRelationsCard relationList={graph.sectionEntities} />
        <EntityRelationsCard relationList={graph.entityRelations} />
      </div>
    </CmsListPage>
  )
}
