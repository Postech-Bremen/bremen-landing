import type { Metadata } from "next"
import Link from "next/link"

import {
  CmsListPage,
  CmsStatGrid,
  CmsStatTile,
  CmsTableCard,
} from "@/app/ponix/_components/cms-list"
import { CmsSaveNotice } from "@/app/ponix/_components/cms-save-controls"
import { VideoOperationsList } from "@/app/ponix/videos/video-operations-list"
import { Button } from "@/components/ui/button"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsMemberVideos } from "@/lib/cms/member-videos"

export const metadata: Metadata = {
  title: "영상 운영 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixVideosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function savedCopy(value?: string) {
  if (value === "public") {
    return {
      title: "영상을 전체 공개했습니다",
      description: "영상 탭과 공개 캐시에 변경 사항을 반영했습니다.",
    }
  }

  if (value === "members") {
    return {
      title: "영상을 멤버 공개로 저장했습니다",
      description: "공개 영상 탭에서는 제외하고, 멤버 공개 상태로 보관합니다.",
    }
  }

  if (value === "hidden") {
    return {
      title: "영상을 숨겼습니다",
      description: "영상 탭에서 해당 영상이 보이지 않도록 정리했습니다.",
    }
  }

  if (value === "deleted") {
    return {
      title: "영상을 삭제했습니다",
      description: "영상 기록과 연결된 업로드 파일을 정리했습니다.",
    }
  }

  return {
    title: "영상 운영 변경 사항을 저장했습니다",
    description: "영상 탭과 공개 캐시에 변경 사항을 반영했습니다.",
  }
}

function latestDetail(value: string | null) {
  if (!value) return "아직 제출된 영상 없음"

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default async function PonixVideosPage({
  searchParams,
}: PonixVideosPageProps) {
  await requireCmsAdmin("/ponix/videos")
  const [query, { videos, stats }] = await Promise.all([
    searchParams,
    loadCmsMemberVideos(),
  ])
  const saved = firstParam(query?.saved)
  const error = firstParam(query?.error)
  const copy = savedCopy(saved)

  return (
    <CmsListPage
      eyebrow="동아리 운영 / 영상"
      title="Video desk"
      description="멤버들이 영상 탭에 제출한 링크와 파일을 확인하고, 공개 범위와 삭제를 바로 관리합니다."
      actions={
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/videos">영상 탭 열기</Link>
        </Button>
      }
    >
      <CmsSaveNotice
        saved={Boolean(saved)}
        error={error}
        savedTitle={copy.title}
        savedDescription={copy.description}
        errorTitle="영상 운영 변경 사항을 저장하지 못했습니다"
      />

      <CmsStatGrid>
        <CmsStatTile label="제출" value={stats.total} detail="멤버가 보낸 영상" accent />
        <CmsStatTile label="전체 공개" value={stats.publicCount} detail="영상 탭에 보이는 영상" />
        <CmsStatTile label="멤버 공개" value={stats.membersCount} detail="공개 화면에서는 숨김" />
        <CmsStatTile
          label="최근"
          value={stats.latestAt ? "New" : "-"}
          detail={latestDetail(stats.latestAt)}
        />
      </CmsStatGrid>

      <CmsTableCard
        title="멤버 제출 영상"
        meta={`${videos.length}개 · 숨김 ${stats.hiddenCount} · 파일 ${stats.fileCount} · 링크 ${stats.urlCount}`}
      >
        <VideoOperationsList videos={videos} />
      </CmsTableCard>
    </CmsListPage>
  )
}
