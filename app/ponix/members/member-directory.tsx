"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { PencilLine, Search, SlidersHorizontal, X } from "lucide-react"

import { formatCmsDate } from "@/app/ponix/_components/cms-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CmsMemberSummary } from "@/lib/cms/members"

type StatusFilter = "all" | "active" | "inactive" | "alumni" | "unset"
type AccessFilter = "all" | "approved" | "pending" | "linked" | "unlinked"
type RoleFilter = "all" | "admin" | "member"

const statusLabels: Record<string, string> = {
  active: "활동",
  inactive: "휴동",
  alumni: "졸업",
}

export function MemberDirectory({ members }: { members: CmsMemberSummary[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [access, setAccess] = useState<AccessFilter>("all")
  const [role, setRole] = useState<RoleFilter>("all")
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const filteredMembers = members.filter((member) =>
    matchesMember(member, {
      query: deferredQuery,
      status,
      access,
      role,
    }),
  )
  const hasFilters =
    query.trim().length > 0 ||
    status !== "all" ||
    access !== "all" ||
    role !== "all"

  function clearFilters() {
    setQuery("")
    setStatus("all")
    setAccess("all")
    setRole("all")
  }

  return (
    <div data-member-directory>
      <div className="border-b bg-muted/10 p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              멤버 찾기
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              이름, 학번, 세션, 이메일, 현재 하는 일로 찾고 운영 상태별로 좁혀봅니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>표시 {filteredMembers.length}명</span>
            <span>/</span>
            <span>전체 {members.length}명</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(18rem,1fr)_11rem_11rem_9rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름, 학번, 이메일, 세션으로 검색"
              className="h-10 rounded-full bg-background pl-9"
              data-member-search
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="h-10 rounded-full bg-background">
              <SelectValue placeholder="활동 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="active">활동</SelectItem>
              <SelectItem value="inactive">휴동</SelectItem>
              <SelectItem value="alumni">졸업</SelectItem>
              <SelectItem value="unset">미정</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={access}
            onValueChange={(value) => setAccess(value as AccessFilter)}
          >
            <SelectTrigger className="h-10 rounded-full bg-background">
              <SelectValue placeholder="가입/계정" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 가입 상태</SelectItem>
              <SelectItem value="approved">승인 완료</SelectItem>
              <SelectItem value="pending">승인 대기</SelectItem>
              <SelectItem value="linked">계정 연결</SelectItem>
              <SelectItem value="unlinked">계정 없음</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={(value) => setRole(value as RoleFilter)}>
            <SelectTrigger className="h-10 rounded-full bg-background">
              <SelectValue placeholder="권한" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 권한</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
              <SelectItem value="member">멤버</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            disabled={!hasFilters}
            onClick={clearFilters}
          >
            <X className="size-4" />
            초기화
          </Button>
        </div>
      </div>

      {filteredMembers.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[64rem]">
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
              {filteredMembers.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center px-5 py-12 text-center">
          <div className="max-w-sm">
            <p className="font-serif text-3xl italic">
              조건에 맞는 멤버가 없습니다
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              조건에 맞는 멤버가 없습니다. 검색어를 줄이거나 필터를 초기화해 다시
              확인하세요.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 rounded-full"
              onClick={clearFilters}
            >
              필터 초기화
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberRow({ member }: { member: CmsMemberSummary }) {
  return (
    <TableRow>
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
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
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

function matchesMember(
  member: CmsMemberSummary,
  filters: {
    query: string
    status: StatusFilter
    access: AccessFilter
    role: RoleFilter
  },
) {
  if (filters.status !== "all") {
    if (filters.status === "unset") {
      if (member.status !== null) return false
    } else if (member.status !== filters.status) {
      return false
    }
  }

  if (filters.access === "approved" && !member.approved_at) return false
  if (filters.access === "pending" && member.approved_at) return false
  if (filters.access === "linked" && !member.auth_user_id) return false
  if (filters.access === "unlinked" && member.auth_user_id) return false

  if (filters.role !== "all" && member.role !== filters.role) {
    return false
  }

  if (!filters.query) return true

  return memberSearchText(member).includes(filters.query)
}

function memberSearchText(member: CmsMemberSummary) {
  return [
    member.name,
    member.english_name,
    member.student_year?.toString(),
    member.instrument,
    member.position,
    member.status ? statusLabels[member.status] : "미정",
    member.current_status,
    member.email,
    member.role === "admin" ? "관리자" : "멤버",
    member.auth_user_id ? "계정 연결" : "계정 없음",
    member.approved_at ? "승인" : "미승인",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
