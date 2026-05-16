"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { Globe2, ImageIcon, Lock, Search, Trash2, Users, X } from "lucide-react"

import {
  deleteMemberPhotoAction,
  updateMemberPhotoVisibilityAction,
} from "@/app/ponix/photos/actions"
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
import type { CmsMemberPhoto } from "@/lib/cms/member-photos"
import { cn } from "@/lib/utils"

type Filter = "all" | "public" | "members" | "hidden"
type PublicationState = "public" | "members" | "hidden"

const filterLabels: Record<Filter, string> = {
  all: "전체",
  public: "공개",
  members: "멤버 공개",
  hidden: "숨김",
}

const stateLabels: Record<PublicationState, string> = {
  public: "전체 공개",
  members: "멤버 공개",
  hidden: "숨김",
}

export function PhotoOperationsList({ photos }: { photos: CmsMemberPhoto[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const filteredPhotos = photos.filter((photo) => {
    const visible =
      filter === "all" ||
      (filter === "public" && publicationState(photo) === "public") ||
      (filter === "members" && publicationState(photo) === "members") ||
      (filter === "hidden" && publicationState(photo) === "hidden")

    return visible && photoSearchText(photo).includes(deferredQuery)
  })
  const hasQuery = query.trim().length > 0

  return (
    <div data-photo-operations>
      <div className="border-b bg-muted/10 p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="size-4 text-muted-foreground" />
              멤버 업로드 사진
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              사진 탭에 올라온 멤버 업로드만 모아 보고, 공개 상태와 삭제를 바로 처리합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>표시 {filteredPhotos.length}개</span>
            <span>/</span>
            <span>전체 {photos.length}개</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 올린 멤버, 파일명으로 검색"
              className="h-10 rounded-full bg-background pl-9"
              data-photo-search
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(filterLabels) as Filter[]).map((value) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                className="h-10 rounded-full"
                onClick={() => setFilter(value)}
              >
                {filterLabels[value]}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full"
              disabled={!hasQuery && filter === "all"}
              onClick={() => {
                setQuery("")
                setFilter("all")
              }}
            >
              <X className="size-4" />
              초기화
            </Button>
          </div>
        </div>
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[76rem]">
            <TableHeader>
              <TableRow>
                <TableHead>사진</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>올린 멤버</TableHead>
                <TableHead>파일</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPhotos.map((photo) => (
                <TableRow key={photo.id}>
                  <TableCell className="min-w-[22rem]">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted">
                        {photo.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-serif-kr text-lg leading-snug">
                          {photo.title}
                        </p>
                        {photo.caption && (
                          <p className="mt-1 line-clamp-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                            {photo.caption}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="rounded-full">
                            {photo.category}
                          </Badge>
                          <Badge variant="outline" className="rounded-full">
                            {photo.aspect === "landscape" ? "가로" : "세로"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PhotoStatusBadges photo={photo} />
                  </TableCell>
                  <TableCell className="min-w-40">
                    {photo.owner ? (
                      <div>
                        <p className="font-medium">{photo.owner.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {memberMeta(photo.owner)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        연결된 멤버 없음
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-56">
                    <p className="truncate text-sm">
                      {photo.originalFilename ?? "파일명 없음"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[photo.mediaType, formatBytes(photo.fileSize)]
                        .filter(Boolean)
                        .join(" · ") || "파일 정보 없음"}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatCmsDate(photo.submittedAt ?? photo.sortAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <VisibilityForm photo={photo} />
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/ponix/entities/${photo.id}/edit`}>
                          편집
                        </Link>
                      </Button>
                      <DeletePhotoDialog photo={photo} />
                    </div>
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
              표시할 사진이 없습니다
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {hasQuery || filter !== "all"
                ? "검색어나 필터를 초기화해 다시 확인하세요."
                : "아직 멤버가 사진 탭에서 올린 사진이 없습니다."}
            </p>
            {(hasQuery || filter !== "all") && (
              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-full"
                onClick={() => {
                  setQuery("")
                  setFilter("all")
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoStatusBadges({ photo }: { photo: CmsMemberPhoto }) {
  const state = publicationState(photo)

  return (
    <div className="flex flex-col items-start gap-2">
      <Badge
        variant={state === "public" ? "default" : "outline"}
        className={cn("rounded-full", state !== "public" && "text-muted-foreground")}
      >
        {state === "public" ? "사진 탭 공개" : stateLabels[state]}
      </Badge>
      <Badge variant="outline" className="rounded-full text-muted-foreground">
        {photo.visibility === "public"
          ? "전체 공개"
          : photo.visibility === "members"
            ? "멤버 공개"
            : "비공개"}
      </Badge>
    </div>
  )
}

function VisibilityForm({ photo }: { photo: CmsMemberPhoto }) {
  const [state, setState] = useState<PublicationState>(publicationState(photo))

  return (
    <form
      action={updateMemberPhotoVisibilityAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="entity_id" value={photo.id} />
      <input type="hidden" name="state" value={state} />
      <Select
        value={state}
        onValueChange={(value) => setState(value as PublicationState)}
      >
        <SelectTrigger
          size="sm"
          className="h-9 min-w-36 rounded-full bg-background"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="public">
            <Globe2 className="size-4" />
            전체 공개
          </SelectItem>
          <SelectItem value="members">
            <Users className="size-4" />
            멤버 공개
          </SelectItem>
          <SelectItem value="hidden">
            <Lock className="size-4" />
            숨김
          </SelectItem>
        </SelectContent>
      </Select>
      <FormSubmitButton
        size="sm"
        pendingLabel="저장 중..."
        className="rounded-full"
      >
        상태 저장
      </FormSubmitButton>
    </form>
  )
}

function DeletePhotoDialog({ photo }: { photo: CmsMemberPhoto }) {
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
          <AlertDialogTitle>이 사진을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            사진 탭의 기록과 연결된 업로드 파일을 함께 정리합니다. 복구 기능은 아직 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-4 rounded-xl border bg-muted/30 p-4">
          <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg border bg-muted">
            {photo.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <ImageIcon className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-medium">{photo.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {photo.storagePath ?? "연결된 Storage 경로 없음"}
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <form action={deleteMemberPhotoAction}>
            <input type="hidden" name="entity_id" value={photo.id} />
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

function publicationState(photo: CmsMemberPhoto): PublicationState {
  if (photo.published && photo.visibility === "public") return "public"
  if (photo.published && photo.visibility === "members") return "members"
  return "hidden"
}

function memberMeta(owner: CmsMemberPhoto["owner"]) {
  if (!owner) return "멤버 정보 없음"

  return [
    owner.student_year ? `${owner.student_year}학번` : null,
    owner.instrument,
    owner.status === "active" ? "활동" : owner.status,
  ]
    .filter(Boolean)
    .join(" · ")
}

function formatBytes(value: number | null) {
  if (!value) return null
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${value} B`
}

function photoSearchText(photo: CmsMemberPhoto) {
  return [
    photo.title,
    photo.caption,
    photo.owner?.name,
    photo.owner?.student_year?.toString(),
    photo.owner?.instrument,
    photo.originalFilename,
    photo.storagePath,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
