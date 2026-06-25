"use client"

import { useDeferredValue, useMemo, useState } from "react"
import Link from "next/link"
import {
  ExternalLink,
  FileVideo,
  Globe2,
  LinkIcon,
  Lock,
  PlayCircle,
  Search,
  Trash2,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react"

import {
  deleteMemberVideoAction,
  updateMemberVideoPublicationAction,
} from "@/app/ponix/videos/actions"
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
import type { CmsMemberVideo } from "@/lib/cms/member-videos"
import { cn } from "@/lib/utils"

type Filter = "all" | "review" | "public" | "members" | "file" | "url"
type PublicationState = "public" | "members" | "hidden"

const filterLabels: Record<Filter, string> = {
  all: "전체",
  review: "검토",
  public: "전체 공개",
  members: "멤버 공개",
  file: "파일",
  url: "링크",
}

const stateLabels: Record<PublicationState, string> = {
  public: "전체 공개",
  members: "멤버 공개",
  hidden: "숨김",
}

export function VideoOperationsList({ videos }: { videos: CmsMemberVideo[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const filteredVideos = useMemo(
    () =>
      videos.filter((video) => {
        const visible =
          filter === "all" ||
          (filter === "review" && publicationState(video) === "hidden") ||
          (filter === "public" && publicationState(video) === "public") ||
          (filter === "members" && publicationState(video) === "members") ||
          (filter === "file" && video.submissionKind === "file") ||
          (filter === "url" && video.submissionKind === "url")

        return visible && videoSearchText(video).includes(deferredQuery)
      }),
    [deferredQuery, filter, videos],
  )
  const hasQuery = query.trim().length > 0

  return (
    <div data-video-operations>
      <div className="border-b bg-muted/10 p-4 md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Video className="size-4 text-muted-foreground" />
              멤버 제출 영상
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              업로드 파일과 영상 링크를 한곳에서 확인하고, 공개 범위를 정리합니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>표시 {filteredVideos.length}개</span>
            <span>/</span>
            <span>전체 {videos.length}개</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 곡명, 멤버, 파일명으로 검색"
              className="h-10 rounded-full bg-background pl-9"
              data-video-search
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

      {filteredVideos.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="min-w-[86rem]">
            <TableHeader>
              <TableRow>
                <TableHead>영상</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>올린 멤버</TableHead>
                <TableHead>출처</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="min-w-[25rem]">
                    <div className="flex items-center gap-4">
                      <div className="media-frame relative grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted">
                        {video.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileVideo className="size-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-serif-kr text-lg leading-snug">
                          {video.title}
                        </p>
                        {videoMeta(video) && (
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                            {videoMeta(video)}
                          </p>
                        )}
                        {video.description && (
                          <p className="mt-2 line-clamp-2 max-w-lg text-xs leading-relaxed text-muted-foreground">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <VideoStatusBadges video={video} />
                  </TableCell>
                  <TableCell className="min-w-40">
                    {video.owner ? (
                      <div>
                        <p className="font-medium">{video.owner.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {memberMeta(video.owner)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        연결된 멤버 없음
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-64">
                    <VideoSource video={video} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatCmsDate(video.submittedAt ?? video.sortAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-72 flex-col gap-2">
                      <PublicationForm video={video} />
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <Link href={`/ponix/entities/${video.id}/edit`}>
                            편집
                          </Link>
                        </Button>
                        <DeleteVideoDialog video={video} />
                      </div>
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
              표시할 영상이 없습니다
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {hasQuery || filter !== "all"
                ? "검색어나 필터를 초기화해 다시 확인하세요."
                : "아직 멤버가 영상 탭에서 제출한 영상이 없습니다."}
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

function VideoStatusBadges({ video }: { video: CmsMemberVideo }) {
  const state = publicationState(video)

  return (
    <div className="flex flex-col items-start gap-2">
      <Badge
        variant={state === "public" ? "default" : "outline"}
        className={cn("rounded-full", state !== "public" && "text-muted-foreground")}
      >
        {state === "public" ? "영상 탭 공개" : stateLabels[state]}
      </Badge>
      <Badge variant="outline" className="rounded-full text-muted-foreground">
        {video.submissionKind === "file" ? "파일 업로드" : "링크 제출"}
      </Badge>
    </div>
  )
}

function VideoSource({ video }: { video: CmsMemberVideo }) {
  const label =
    video.submissionKind === "file"
      ? (video.originalFilename ?? "업로드 파일")
      : (video.sourceUrl ?? "영상 링크")

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2">
        {video.submissionKind === "file" ? (
          <Upload className="size-4 text-muted-foreground" />
        ) : (
          <LinkIcon className="size-4 text-muted-foreground" />
        )}
        <p className="truncate">{label}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {[video.mediaType, formatBytes(video.fileSize)]
          .filter(Boolean)
          .join(" · ") ||
          (video.youtubeId ? `YouTube ${video.youtubeId}` : "출처 정보 없음")}
      </p>
      {video.sourceUrl && (
        <Button
          asChild
          variant="link"
          size="sm"
          className="mt-1 h-auto p-0 text-xs"
        >
          <a href={video.sourceUrl} target="_blank" rel="noopener noreferrer">
            확인하기
            <ExternalLink className="size-3" />
          </a>
        </Button>
      )}
    </div>
  )
}

function PublicationForm({ video }: { video: CmsMemberVideo }) {
  const [state, setState] = useState<PublicationState>(publicationState(video))

  return (
    <form
      action={updateMemberVideoPublicationAction}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="entity_id" value={video.id} />
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

function DeleteVideoDialog({ video }: { video: CmsMemberVideo }) {
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
          <AlertDialogTitle>이 영상을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            영상 기록과 연결된 업로드 파일을 함께 정리합니다. 복구 기능은 아직 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="setlist-panel flex gap-4 rounded-md border bg-muted/30 p-4">
          <div className="grid h-24 w-32 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted">
            {video.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <PlayCircle className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-medium">{video.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {video.storagePath ?? video.sourceUrl ?? "연결된 파일이나 링크 없음"}
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <form action={deleteMemberVideoAction}>
            <input type="hidden" name="entity_id" value={video.id} />
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

function publicationState(video: CmsMemberVideo): PublicationState {
  if (video.published && video.visibility === "public") return "public"
  if (video.published && video.visibility === "members") return "members"
  return "hidden"
}

function memberMeta(owner: CmsMemberVideo["owner"]) {
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

function videoMeta(video: CmsMemberVideo) {
  return [video.artist, video.song, video.team, video.eventTitle, video.duration]
    .filter(Boolean)
    .join(" · ")
}

function videoSearchText(video: CmsMemberVideo) {
  return [
    video.title,
    video.description,
    video.artist,
    video.song,
    video.team,
    video.eventTitle,
    video.owner?.name,
    video.owner?.student_year?.toString(),
    video.owner?.instrument,
    video.originalFilename,
    video.storagePath,
    video.youtubeId,
    video.sourceUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
