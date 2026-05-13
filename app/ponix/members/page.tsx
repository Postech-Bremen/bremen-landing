import type { Metadata } from "next"
import Link from "next/link"
import { PencilLine } from "lucide-react"

import {
  CmsListPage,
  CmsStatGrid,
  CmsStatTile,
  CmsTableCard,
  formatCmsDate,
} from "@/app/ponix/_components/cms-list"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsMembers } from "@/lib/cms/members"

export const metadata: Metadata = {
  title: "멤버 운영 | Bremen Admin",
  robots: {
    index: false,
    follow: false,
  },
}

const statusLabels: Record<string, string> = {
  active: "활동",
  inactive: "휴동",
  alumni: "졸업",
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
        <CmsStatTile label="승인 완료" value={stats.approved} detail="멤버 공간 접근 가능" />
        <CmsStatTile label="활동 중" value={stats.active} detail="현재 활동 상태" />
      </CmsStatGrid>

      <CmsTableCard title="멤버 명단" meta={`${members.length}명`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>멤버</TableHead>
              <TableHead>학번</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>권한/직책</TableHead>
              <TableHead>가입</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>수정</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Link
                    href={`/members/${member.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {member.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {member.english_name ?? member.instrument ?? "프로필"}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {member.student_year ? `${member.student_year}학번` : "미정"}
                </TableCell>
                <TableCell>
                  <MemberStatusBadge status={member.status} />
                  {member.current_status && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {member.current_status}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="rounded-full">
                      {member.role === "admin" ? "관리자" : "멤버"}
                    </Badge>
                    {member.position && (
                      <Badge variant="secondary" className="rounded-full">
                        {member.position}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant={member.auth_user_id ? "default" : "outline"}
                      className="rounded-full"
                    >
                      {member.auth_user_id ? "계정 연결" : "계정 없음"}
                    </Badge>
                    <Badge
                      variant={member.approved_at ? "secondary" : "outline"}
                      className="rounded-full"
                    >
                      {member.approved_at ? "승인" : "미승인"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="max-w-[16rem] truncate text-xs text-muted-foreground">
                  {member.email ?? "비어 있음"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/ponix/members/${member.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    title={`최근 수정 ${formatCmsDate(member.updated_at)}`}
                  >
                    <PencilLine className="size-3.5" />
                    수정
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CmsTableCard>
    </CmsListPage>
  )
}

function MemberStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="rounded-full text-muted-foreground">
        미정
      </Badge>
    )
  }

  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className="rounded-full"
    >
      {statusLabels[status] ?? status}
    </Badge>
  )
}
