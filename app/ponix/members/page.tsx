import type { Metadata } from "next"
import Link from "next/link"

import {
  CmsListPage,
  CmsTableCard,
  formatCmsDate,
} from "@/app/ponix/_components/cms-list"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  title: "PONIX Members | 브레멘 Bremen",
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
      eyebrow="PONIX / Members"
      title="Members"
      description="가입 연결, 승인 상태, 공개 프로필 상태를 한 곳에서 점검합니다."
    >
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} detail="roster rows" />
        <StatCard label="Signed" value={stats.linkedAuth} detail="auth linked" />
        <StatCard label="Approved" value={stats.approved} detail="member access" />
        <StatCard label="Active" value={stats.active} detail="public status" />
      </div>

      <CmsTableCard title="Member records" meta={`${members.length} records`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Auth</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Updated</TableHead>
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
                    {member.english_name ?? member.instrument ?? "profile"}
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
                      {member.role}
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
                      {member.auth_user_id ? "linked" : "not linked"}
                    </Badge>
                    <Badge
                      variant={member.approved_at ? "secondary" : "outline"}
                      className="rounded-full"
                    >
                      {member.approved_at ? "approved" : "pending"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="max-w-[16rem] truncate text-xs text-muted-foreground">
                  {member.email ?? "empty"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatCmsDate(member.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CmsTableCard>
    </CmsListPage>
  )
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  return (
    <Card className="rounded-xl bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <p className="caps text-muted-foreground">{label}</p>
        <CardTitle className="font-serif text-5xl italic leading-none">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
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
