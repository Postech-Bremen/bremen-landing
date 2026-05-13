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
  title: "섹션 관리 | Bremen Admin",
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
      eyebrow="사이트 운영 / 섹션"
      title="Section shelf"
      description="각 페이지를 이루는 화면 블록을 관리합니다. 제목, 설명, 버튼, 노출 상태를 한곳에서 정리합니다."
      actions={
        <Button asChild className="w-fit rounded-full">
          <Link href="/ponix/sections/new">섹션 추가</Link>
        </Button>
      }
    >
      <CmsStatGrid>
        <CmsStatTile label="섹션" value={sections.length} detail="페이지를 구성하는 화면 블록" accent />
        <CmsStatTile label="공개 중" value={publishedCount} detail="페이지에서 사용할 수 있는 섹션" />
        <CmsStatTile label="화면 타입" value={rendererCount} detail="사용 중인 렌더링 방식" />
        <CmsStatTile label="점검 필요" value={unregisteredCount} detail="등록 정보가 맞지 않는 항목" />
      </CmsStatGrid>

      <CmsRecordGrid>
        {sections.map((section) => (
          <CmsRecordCard
            key={section.id}
            href={`/ponix/sections/${section.id}`}
            eyebrow={section.key}
            title={section.title ?? "제목 없는 섹션"}
            description={section.subtitle ?? section.sectionType}
            actionLabel="섹션 열기"
            badges={
              <>
                <PublishBadge published={section.published} />
                <SchemaBadge
                  label={section.schemaLabel}
                  registered={section.schemaRegistered}
                />
              </>
            }
            meta={`수정 ${formatCmsDate(section.updatedAt)}`}
          />
        ))}
      </CmsRecordGrid>
    </CmsListPage>
  )
}
