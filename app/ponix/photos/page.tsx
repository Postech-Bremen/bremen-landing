import type { Metadata } from "next"
import Link from "next/link"

import {
  CmsListPage,
  CmsStatGrid,
  CmsStatTile,
  CmsTableCard,
} from "@/app/ponix/_components/cms-list"
import { CmsSaveNotice } from "@/app/ponix/_components/cms-save-controls"
import { PhotoOperationsList } from "@/app/ponix/photos/photo-operations-list"
import { Button } from "@/components/ui/button"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsMemberPhotos } from "@/lib/cms/member-photos"

export const metadata: Metadata = {
  title: "사진 운영 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixPhotosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function savedCopy(value?: string) {
  if (value === "published") {
    return {
      title: "사진을 공개했습니다",
      description: "사진 탭과 공개 캐시에 변경 사항을 반영했습니다.",
    }
  }

  if (value === "hidden") {
    return {
      title: "사진을 숨겼습니다",
      description: "사진 탭에서 해당 사진이 보이지 않도록 정리했습니다.",
    }
  }

  if (value === "members") {
    return {
      title: "사진을 멤버 공개로 저장했습니다",
      description: "사진 탭에서는 제외하고, 멤버 공개 기록에 보이도록 정리했습니다.",
    }
  }

  if (value === "deleted") {
    return {
      title: "사진을 삭제했습니다",
      description: "사진 기록과 연결된 업로드 파일을 정리했습니다.",
    }
  }

  return {
    title: "사진 운영 변경 사항을 저장했습니다",
    description: "사진 탭과 공개 캐시에 변경 사항을 반영했습니다.",
  }
}

function latestDetail(value: string | null) {
  if (!value) return "아직 업로드 없음"

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default async function PonixPhotosPage({
  searchParams,
}: PonixPhotosPageProps) {
  await requireCmsAdmin("/ponix/photos")
  const [query, { photos, stats }] = await Promise.all([
    searchParams,
    loadCmsMemberPhotos(),
  ])
  const saved = firstParam(query?.saved)
  const error = firstParam(query?.error)
  const copy = savedCopy(saved)

  return (
    <CmsListPage
      eyebrow="동아리 운영 / 사진"
      title="Photo desk"
      description="멤버들이 사진 탭에 올린 장면을 확인하고, 공개 여부와 삭제를 바로 관리합니다."
      actions={
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/photos">사진 탭 열기</Link>
        </Button>
      }
    >
      <CmsSaveNotice
        saved={Boolean(saved)}
        error={error}
        savedTitle={copy.title}
        savedDescription={copy.description}
        errorTitle="사진 운영 변경 사항을 저장하지 못했습니다"
      />

      <CmsStatGrid>
        <CmsStatTile label="업로드" value={stats.total} detail="멤버가 올린 사진" accent />
        <CmsStatTile label="공개" value={stats.publicCount} detail="사진 탭에 보이는 사진" />
        <CmsStatTile label="멤버 공개" value={stats.membersCount} detail="활동 멤버에게 보이는 사진" />
        <CmsStatTile
          label="최근"
          value={stats.latestAt ? "New" : "-"}
          detail={latestDetail(stats.latestAt)}
        />
      </CmsStatGrid>

      <CmsTableCard title="멤버 업로드 사진" meta={`${photos.length}개`}>
        <PhotoOperationsList photos={photos} />
      </CmsTableCard>
    </CmsListPage>
  )
}
