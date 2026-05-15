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
  VisibilityBadge,
} from "@/app/ponix/_components/cms-list"
import { Button } from "@/components/ui/button"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsEntities } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "콘텐츠 자료 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixEntitiesPage() {
  await requireCmsAdmin("/ponix/entities")
  const { entities, count, limit } = await loadCmsEntities()
  const meta = count && count > limit
    ? `${entities.length} of ${count} records`
    : `${entities.length} records`
  const publishedCount = entities.filter((entity) => entity.published).length
  const schemaCount = new Set(entities.map((entity) => entity.schemaKey)).size
  const typeCount = new Set(entities.map((entity) => entity.entityType)).size

  return (
    <CmsListPage
      eyebrow="사이트 운영 / 콘텐츠"
      title="Content vault"
      description="공연, 영상, 사진, 히스토리 기록처럼 사이트 여러 곳에서 다시 쓰는 콘텐츠 원본을 관리합니다."
      actions={
        <Button asChild className="w-fit rounded-full">
          <Link href="/ponix/entities/new">콘텐츠 추가</Link>
        </Button>
      }
    >
      <CmsStatGrid>
        <CmsStatTile label="표시 중" value={entities.length} detail={meta} accent />
        <CmsStatTile label="공개 중" value={publishedCount} detail="사이트에 사용할 수 있는 콘텐츠" />
        <CmsStatTile label="분류" value={typeCount} detail="공연, 영상, 사진 등" />
        <CmsStatTile label="형식" value={schemaCount} detail="등록된 입력 양식" />
      </CmsStatGrid>

      <CmsRecordGrid>
        {entities.map((entity) => (
          <CmsRecordCard
            key={entity.id}
            href={`/ponix/entities/${entity.id}`}
            eyebrow={entity.entityType}
            title={entity.title}
            description={entity.subtitle ?? entity.slug ?? entity.id}
            actionLabel="콘텐츠 열기"
            badges={
              <>
                <PublishBadge published={entity.published} />
                <VisibilityBadge visibility={entity.visibility} />
                <SchemaBadge
                  label={entity.schemaLabel}
                  registered={entity.schemaRegistered}
                />
              </>
            }
            meta={`기준일 ${formatCmsDate(entity.sortAt)}`}
            media={
              entity.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entity.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="grid h-full place-items-center font-serif text-4xl italic text-muted-foreground/50">
                  {entity.entityType.slice(0, 2)}
                </div>
              )
            }
          />
        ))}
      </CmsRecordGrid>
    </CmsListPage>
  )
}
