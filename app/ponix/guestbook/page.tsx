import type { Metadata } from "next"

import { CmsListPage, CmsStatGrid, CmsStatTile, CmsTableCard } from "@/app/ponix/_components/cms-list"
import { CmsSaveNotice } from "@/app/ponix/_components/cms-save-controls"
import { GuestbookModerationList } from "@/app/ponix/guestbook/guestbook-moderation-list"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsGuestbookEntries } from "@/lib/cms/guestbook"

export const metadata: Metadata = {
  title: "방명록 관리 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

type PonixGuestbookPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function latestDetail(value: string | null) {
  if (!value) return "아직 남겨진 글 없음"

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export default async function PonixGuestbookPage({
  searchParams,
}: PonixGuestbookPageProps) {
  await requireCmsAdmin("/ponix/guestbook")
  const [query, { entries, stats }] = await Promise.all([
    searchParams,
    loadCmsGuestbookEntries(),
  ])
  const saved = firstParam(query?.saved) === "guestbook"
  const error = firstParam(query?.error)

  return (
    <CmsListPage
      eyebrow="동아리 운영 / 방명록"
      title="Guestbook desk"
      description="멤버 프로필에 남겨진 안부를 한곳에서 확인하고, 문제가 있는 글은 바로 정리합니다."
    >
      <CmsSaveNotice
        saved={saved}
        error={error}
        savedTitle="방명록을 정리했습니다"
        savedDescription="선택한 글이 멤버 프로필에서 사라졌습니다."
        errorTitle="방명록을 정리하지 못했습니다"
      />

      <CmsStatGrid>
        <CmsStatTile label="글" value={stats.total} detail="최근 200개 기준" accent />
        <CmsStatTile label="프로필" value={stats.profiles} detail="글이 남겨진 멤버" />
        <CmsStatTile label="작성자" value={stats.authors} detail="방명록을 남긴 멤버" />
        <CmsStatTile
          label="최근"
          value={stats.latestAt ? "New" : "-"}
          detail={latestDetail(stats.latestAt)}
        />
      </CmsStatGrid>

      <CmsTableCard title="방명록 글" meta={`${entries.length}개`}>
        <GuestbookModerationList entries={entries} />
      </CmsTableCard>
    </CmsListPage>
  )
}
