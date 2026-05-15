"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { MessageSquareText, Search, Trash2, X } from "lucide-react"

import { deleteGuestbookEntryAction } from "@/app/ponix/guestbook/actions"
import { formatCmsDate } from "@/app/ponix/_components/cms-list"
import { FormSubmitButton } from "@/components/form-submit-button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CmsGuestbookEntry } from "@/lib/cms/guestbook"

export function GuestbookModerationList({
  entries,
}: {
  entries: CmsGuestbookEntry[]
}) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const filteredEntries = entries.filter((entry) =>
    guestbookSearchText(entry).includes(deferredQuery),
  )
  const hasQuery = query.trim().length > 0

  return (
    <div data-guestbook-moderation>
      <div className="border-b bg-muted/10 p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareText className="size-4 text-muted-foreground" />
              방명록 찾기
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              프로필 주인, 작성자, 본문으로 검색하고 문제가 있는 글은 바로 정리합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>표시 {filteredEntries.length}개</span>
            <span>/</span>
            <span>전체 {entries.length}개</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="멤버 이름, 작성자, 본문으로 검색"
              className="h-10 rounded-full bg-background pl-9"
              data-guestbook-search
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            disabled={!hasQuery}
            onClick={() => setQuery("")}
          >
            <X className="size-4" />
            초기화
          </Button>
        </div>
      </div>

      {filteredEntries.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[68rem]">
            <TableHeader>
              <TableRow>
                <TableHead>프로필</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="min-w-44">
                    <MemberLink
                      memberId={entry.profile_member_id}
                      name={entry.profile?.name}
                      meta={memberMeta(entry.profile)}
                    />
                  </TableCell>
                  <TableCell className="min-w-44">
                    <MemberLink
                      memberId={entry.author_member_id}
                      name={entry.author?.name}
                      meta={memberMeta(entry.author)}
                    />
                  </TableCell>
                  <TableCell className="max-w-xl">
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed">
                      {entry.body}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatCmsDate(entry.created_at)}
                  </TableCell>
                  <TableCell>
                    <DeleteEntryDialog entry={entry} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center px-5 py-12 text-center">
          <div className="max-w-sm">
            <p className="font-serif text-3xl italic">
              방명록 글이 없습니다
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {hasQuery
                ? "검색어를 줄이거나 초기화해 다시 확인하세요."
                : "아직 멤버 프로필에 남겨진 글이 없습니다."}
            </p>
            {hasQuery && (
              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-full"
                onClick={() => setQuery("")}
              >
                검색 초기화
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MemberLink({
  memberId,
  name,
  meta,
}: {
  memberId: string
  name?: string
  meta: string
}) {
  return (
    <div>
      <Link
        href={`/members/${memberId}`}
        className="font-medium underline-offset-4 hover:underline"
      >
        {name ?? "알 수 없는 멤버"}
      </Link>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="rounded-full text-xs">
          {meta}
        </Badge>
      </div>
    </div>
  )
}

function DeleteEntryDialog({ entry }: { entry: CmsGuestbookEntry }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
          삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 방명록 글을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제하면 멤버 프로필에서 바로 사라집니다. 복구 기능은 아직 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          {entry.body}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <form action={deleteGuestbookEntryAction}>
            <input type="hidden" name="entry_id" value={entry.id} />
            <input
              type="hidden"
              name="profile_member_id"
              value={entry.profile_member_id}
            />
            <FormSubmitButton
              variant="destructive"
              pendingLabel="삭제 중..."
              className="w-full sm:w-auto"
            >
              삭제
            </FormSubmitButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function memberMeta(member: CmsGuestbookEntry["author"]) {
  if (!member) return "멤버 정보 없음"

  const parts = []
  if (member.student_year) parts.push(`${member.student_year}학번`)
  if (member.instrument) parts.push(member.instrument)
  return parts.length ? parts.join(" · ") : "프로필"
}

function guestbookSearchText(entry: CmsGuestbookEntry) {
  return [
    entry.profile?.name,
    entry.profile?.student_year?.toString(),
    entry.profile?.instrument,
    entry.author?.name,
    entry.author?.student_year?.toString(),
    entry.author?.instrument,
    entry.body,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
