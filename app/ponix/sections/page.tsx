import type { Metadata } from "next"
import Link from "next/link"

import {
  CmsListPage,
  CmsRecordCard,
  CmsRecordGrid,
  CmsStatGrid,
  CmsStatTile,
  formatCmsDate,
  PublishBadge,
  SchemaBadge,
} from "@/app/ponix/_components/cms-list"
import { Button } from "@/components/ui/button"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsSections } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Sections | 브레멘 Bremen",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixSectionsPage() {
  await requireCmsAdmin("/ponix/sections")
  const sections = await loadCmsSections()
  const publishedCount = sections.filter((section) => section.published).length
  const rendererCount = new Set(sections.map((section) => section.sectionType)).size
  const unregisteredCount = sections.filter(
    (section) => !section.schemaRegistered,
  ).length

  return (
    <CmsListPage
      eyebrow="PONIX / Sections"
      title="Section Library"
      description="페이지를 이루는 화면 블록입니다. 문구, 버튼, 노출 상태를 관리하고 필요한 데이터와 연결합니다."
      actions={
        <Button asChild className="w-fit rounded-full">
          <Link href="/ponix/sections/new">새 섹션</Link>
        </Button>
      }
    >
      <CmsStatGrid>
        <CmsStatTile label="Sections" value={sections.length} detail="페이지를 구성하는 블록" accent />
        <CmsStatTile label="Published" value={publishedCount} detail="현재 노출 가능" />
        <CmsStatTile label="Renderers" value={rendererCount} detail="사용 중인 화면 타입" />
        <CmsStatTile label="Needs schema" value={unregisteredCount} detail="정리 필요한 스키마" />
      </CmsStatGrid>

      <CmsRecordGrid>
        {sections.map((section) => (
          <CmsRecordCard
            key={section.id}
            href={`/ponix/sections/${section.id}`}
            eyebrow={section.key}
            title={section.title ?? "Untitled section"}
            description={section.subtitle ?? section.sectionType}
            actionLabel="Review"
            badges={
              <>
                <PublishBadge published={section.published} />
                <SchemaBadge
                  label={section.schemaLabel}
                  registered={section.schemaRegistered}
                />
              </>
            }
            meta={`Updated ${formatCmsDate(section.updatedAt)}`}
          />
        ))}
      </CmsRecordGrid>
    </CmsListPage>
  )
}
