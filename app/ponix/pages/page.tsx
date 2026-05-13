import type { Metadata } from "next"

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
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsPages } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "페이지 편집 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixPagesPage() {
  await requireCmsAdmin("/ponix/pages")
  const pages = await loadCmsPages()
  const publishedCount = pages.filter((page) => page.published).length
  const homePage = pages.find((page) => page.slug === "home")

  return (
    <CmsListPage
      eyebrow="사이트 운영 / 페이지"
      title="Page desk"
      description="홈, 공연, 영상, 사진처럼 공개 사이트에 보이는 페이지를 실제 화면 흐름에 맞춰 편집합니다."
    >
      <CmsStatGrid>
        <CmsStatTile label="페이지" value={pages.length} detail="관리 중인 공개 화면" accent />
        <CmsStatTile label="공개 중" value={publishedCount} detail="방문자에게 보이는 페이지" />
        <CmsStatTile label="비공개" value={pages.length - publishedCount} detail="아직 숨겨진 페이지" />
        <CmsStatTile label="홈" value={homePage ? "준비됨" : "누락"} detail="메인 화면 구성 상태" />
      </CmsStatGrid>

      <CmsRecordGrid>
        {pages.map((page) => (
          <CmsRecordCard
            key={page.id}
            href={`/ponix/pages/${page.id}/compose`}
            eyebrow={`/${page.slug === "home" ? "" : page.slug}`}
            title={page.title}
            description={page.subtitle ?? "섹션 순서와 연결된 콘텐츠를 조정합니다."}
            actionLabel="구성 열기"
            badges={
              <>
                <PublishBadge published={page.published} />
                <SchemaBadge
                  label={page.schemaLabel}
                  registered={page.schemaRegistered}
                />
              </>
            }
            meta={`수정 ${formatCmsDate(page.updatedAt)}`}
          />
        ))}
      </CmsRecordGrid>
    </CmsListPage>
  )
}
