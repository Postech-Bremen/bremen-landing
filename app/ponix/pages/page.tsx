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
  title: "PONIX Pages | 브레멘 Bremen",
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
      eyebrow="PONIX / Pages"
      title="Page Studio"
      description="공개 사이트의 각 페이지를 실제 화면 기준으로 열고, 섹션과 데이터를 이어서 관리합니다."
    >
      <CmsStatGrid>
        <CmsStatTile label="Pages" value={pages.length} detail="관리 중인 공개 페이지" accent />
        <CmsStatTile label="Published" value={publishedCount} detail="사이트에 노출 중" />
        <CmsStatTile label="Draft" value={pages.length - publishedCount} detail="검토가 필요한 페이지" />
        <CmsStatTile label="Home" value={homePage ? "Ready" : "Missing"} detail="메인 페이지 구성 상태" />
      </CmsStatGrid>

      <CmsRecordGrid>
        {pages.map((page) => (
          <CmsRecordCard
            key={page.id}
            href={`/ponix/pages/${page.id}/compose`}
            eyebrow={`/${page.slug === "home" ? "" : page.slug}`}
            title={page.title}
            description={page.subtitle ?? "화면 구성과 섹션 연결을 관리합니다."}
            actionLabel="Compose"
            badges={
              <>
                <PublishBadge published={page.published} />
                <SchemaBadge
                  label={page.schemaLabel}
                  registered={page.schemaRegistered}
                />
              </>
            }
            meta={`Updated ${formatCmsDate(page.updatedAt)}`}
          />
        ))}
      </CmsRecordGrid>
    </CmsListPage>
  )
}
