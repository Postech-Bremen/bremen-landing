import type { Metadata } from "next"

import {
  CmsListPage,
  CmsStatGrid,
  CmsStatTile,
  CmsTableCard,
} from "@/app/ponix/_components/cms-list"
import { MemberDirectory } from "@/app/ponix/members/member-directory"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsMembers } from "@/lib/cms/members"

export const metadata: Metadata = {
  title: "멤버 운영 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixMembersPage() {
  await requireCmsAdmin("/ponix/members")
  const { members, stats } = await loadCmsMembers()

  return (
    <CmsListPage
      eyebrow="동아리 운영 / 멤버"
      title="Member room"
      description="가입한 부원을 확인하고, 관리자 권한과 활동 상태를 필요할 때 바로 조정합니다."
    >
      <CmsStatGrid>
        <CmsStatTile label="멤버" value={stats.total} detail="등록된 전체 멤버" accent />
        <CmsStatTile label="계정 연결" value={stats.linkedAuth} detail="로그인 가능한 멤버" />
        <CmsStatTile
          label="승인 완료"
          value={stats.approved}
          detail={`${stats.total - stats.approved}명 승인 대기`}
        />
        <CmsStatTile
          label="활동 중"
          value={stats.active}
          detail={`휴동 ${stats.inactive} / 졸업 ${stats.alumni} / 미정 ${stats.unset}`}
        />
      </CmsStatGrid>

      <CmsTableCard title="멤버 명단" meta={`${members.length}명`}>
        <MemberDirectory members={members} />
      </CmsTableCard>
    </CmsListPage>
  )
}
