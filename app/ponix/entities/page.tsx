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
import { loadCmsEntities } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "PONIX Entities | 브레멘 Bremen",
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
      eyebrow="PONIX / Entities"
      title="Data Library"
      description="영상, 사진, 공연, 히스토리처럼 여러 페이지와 섹션에서 다시 쓰는 원본 데이터입니다."
      actions={
        <Button asChild className="w-fit rounded-full">
          <Link href="/ponix/entities/new">새 데이터</Link>
        </Button>
      }
    >
      <CmsStatGrid>
        <CmsStatTile label="Loaded" value={entities.length} detail={meta} accent />
        <CmsStatTile label="Published" value={publishedCount} detail="노출 가능한 데이터" />
        <CmsStatTile label="Types" value={typeCount} detail="공연, 영상, 사진 등" />
        <CmsStatTile label="Schemas" value={schemaCount} detail="등록된 데이터 형태" />
      </CmsStatGrid>

      <CmsRecordGrid>
        {entities.map((entity) => (
          <CmsRecordCard
            key={entity.id}
            href={`/ponix/entities/${entity.id}`}
            eyebrow={entity.entityType}
            title={entity.title}
            description={entity.subtitle ?? entity.slug ?? entity.id}
            actionLabel="Edit data"
            badges={
              <>
                <PublishBadge published={entity.published} />
                <SchemaBadge
                  label={entity.schemaLabel}
                  registered={entity.schemaRegistered}
                />
              </>
            }
            meta={`Sort ${formatCmsDate(entity.sortAt)}`}
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
