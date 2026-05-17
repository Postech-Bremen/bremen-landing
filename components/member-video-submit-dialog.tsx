"use client"

import {
  CaretDown,
  CheckCircle,
  FilmSlate,
  LinkSimple,
  UploadSimple,
  X,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"

import { createMemberVideoSubmissionAction } from "@/app/(site)/videos/actions"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MEMBER_MEDIA_BUCKET } from "@/lib/data/member-media"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type AccessState =
  | {
      state: "idle" | "loading"
    }
  | {
      state: "anonymous"
    }
  | {
      state: "blocked"
      message: string
    }
  | {
      state: "ready"
      authUserId: string
      memberLabel: string
    }

type SubmitState =
  | {
      kind: "idle"
    }
  | {
      kind: "uploading"
      label: string
    }
  | {
      kind: "success"
      message: string
    }
  | {
      kind: "error"
      message: string
    }

const videoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
])
const videoExtensions = new Set(["mp4", "webm", "mov"])

function extensionFromFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension && videoExtensions.has(extension)) return extension
  if (file.type === "video/mp4") return "mp4"
  if (file.type === "video/webm") return "webm"
  if (file.type === "video/quicktime") return "mov"
  return "mp4"
}

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${value} B`
}

function validateVideoFile(file: File) {
  if (!videoMimeTypes.has(file.type)) {
    return "mp4, webm, mov 영상만 올릴 수 있습니다."
  }

  if (file.size > 100 * 1024 * 1024) {
    return "영상은 100MB 이하로 올려 주세요."
  }

  return null
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function youtubeIdFromUrl(value: string) {
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v")

      const parts = url.pathname.split("/").filter(Boolean)
      if (parts[0] === "shorts" || parts[0] === "embed") {
        return parts[1] ?? null
      }
    }
  } catch {
    return null
  }

  return null
}

function youtubeThumbnailFromUrl(value: string) {
  const id = youtubeIdFromUrl(value)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

export function MemberVideoSubmitDialog() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [access, setAccess] = useState<AccessState>({ state: "idle" })
  const [sourceMode, setSourceMode] = useState<"url" | "file">("url")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [visibility, setVisibility] = useState("public")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [artist, setArtist] = useState("")
  const [song, setSong] = useState("")
  const [team, setTeam] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [duration, setDuration] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" })

  const isUploading = submitState.kind === "uploading"
  const formDisabled = isUploading || access.state !== "ready"
  const urlPreview = sourceMode === "url" ? youtubeThumbnailFromUrl(videoUrl) : null
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function resolveAccess() {
      setAccess({ state: "loading" })
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return
      if (!user) {
        setAccess({ state: "anonymous" })
        return
      }

      const { data: member, error } = await supabase
        .from("members")
        .select("name, student_year, status, approved_at")
        .eq("auth_user_id", user.id)
        .maybeSingle()

      if (cancelled) return

      if (error || !member) {
        setAccess({
          state: "blocked",
          message: "가입 정보와 연결된 멤버 프로필을 찾지 못했습니다.",
        })
        return
      }

      if (!member.approved_at) {
        setAccess({
          state: "blocked",
          message: "멤버 확인이 끝난 뒤 영상을 제출할 수 있습니다.",
        })
        return
      }

      if (member.status !== "active") {
        setAccess({
          state: "blocked",
          message: "활동 상태 멤버만 영상을 제출할 수 있습니다.",
        })
        return
      }

      setAccess({
        state: "ready",
        authUserId: user.id,
        memberLabel: `${member.student_year}학번 · ${member.name}`,
      })
    }

    resolveAccess()

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function resetForm() {
    setSourceMode("url")
    setAdvancedOpen(false)
    setVisibility("public")
    setTitle("")
    setDescription("")
    setArtist("")
    setSong("")
    setTeam("")
    setEventTitle("")
    setDuration("")
    setVideoUrl("")
    setFile(null)
    setSubmitState({ kind: "idle" })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
      setAccess({ state: "idle" })
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0] ?? null
    setFile(nextFile)

    if (nextFile && !title.trim()) {
      setTitle(titleFromFilename(nextFile.name))
    }
  }

  function clearFile() {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (access.state !== "ready") {
      setSubmitState({
        kind: "error",
        message: "영상을 제출할 수 있는 멤버 계정으로 로그인해 주세요.",
      })
      return
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setSubmitState({ kind: "error", message: "제목을 적어 주세요." })
      return
    }

    let storagePath: string | undefined
    const supabase = createClient()

    if (sourceMode === "url") {
      if (!videoUrl.trim() || !isHttpUrl(videoUrl.trim())) {
        setSubmitState({
          kind: "error",
          message: "공유 가능한 영상 링크를 입력해 주세요.",
        })
        return
      }
    } else {
      if (!file) {
        setSubmitState({ kind: "error", message: "올릴 영상 파일을 선택해 주세요." })
        return
      }

      const fileError = validateVideoFile(file)
      if (fileError) {
        setSubmitState({ kind: "error", message: fileError })
        return
      }

      const extension = extensionFromFile(file)
      storagePath = `${access.authUserId}/videos/${crypto.randomUUID()}.${extension}`

      setSubmitState({ kind: "uploading", label: "영상 파일을 올리는 중..." })

      const { error: uploadError } = await supabase.storage
        .from(MEMBER_MEDIA_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        setSubmitState({
          kind: "error",
          message:
            uploadError.message ||
            "영상 파일을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
        })
        return
      }
    }

    setSubmitState({ kind: "uploading", label: "영상 기록을 저장하는 중..." })

    const result = await createMemberVideoSubmissionAction({
      title: cleanTitle,
      description,
      artist,
      song,
      team,
      eventTitle,
      duration,
      visibility,
      videoUrl: sourceMode === "url" ? videoUrl : undefined,
      storagePath,
      mediaType: sourceMode === "file" ? file?.type : undefined,
      originalFilename: sourceMode === "file" ? file?.name : undefined,
      fileSize: sourceMode === "file" ? file?.size : undefined,
    })

    if (!result.ok) {
      if (storagePath) {
        await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([storagePath])
      }
      setSubmitState({ kind: "error", message: result.error })
      return
    }

    resetForm()
    setSubmitState({
      kind: "success",
      message: result.published
        ? "영상이 갤러리에 반영되었습니다."
        : "영상이 제출되었습니다. 확인이 끝나면 선택한 공개 범위로 보입니다.",
    })
    router.refresh()
  }

  const hasFilePreview = sourceMode === "file" && Boolean(previewUrl)
  const hasUrlPreview = sourceMode === "url" && Boolean(urlPreview)
  const canPickFile = sourceMode === "file" && !formDisabled

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="rounded-full px-6">
          <FilmSlate weight="light" className="size-4" />
          영상 올리기
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-[min(96vw,68rem)] max-w-5xl overflow-hidden rounded-3xl p-0 sm:max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="flex max-h-[92vh] flex-col">
          <div className="flex h-14 items-center justify-between border-b px-4 md:px-5">
            <div>
              <p className="caps text-muted-foreground">Gallery Compose</p>
              <DialogTitle className="text-base font-medium">새 영상</DialogTitle>
              <DialogDescription className="sr-only">
                영상 링크나 파일을 선택하고 캡션과 공개 범위를 정해 갤러리에 남깁니다.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="submit"
                variant="ghost"
                className="rounded-full px-4 font-medium"
                disabled={formDisabled}
              >
                {isUploading ? "제출 중" : "제출"}
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="닫기"
                >
                  <X weight="light" className="size-4" />
                </Button>
              </DialogClose>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1.08fr)_25rem] md:overflow-hidden">
            <div className="flex min-h-[24rem] items-center justify-center bg-stone-950 p-4 md:min-h-[38rem] md:p-8">
              <input
                ref={fileInputRef}
                id="member-video-file"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="sr-only"
                onChange={handleFileChange}
                disabled={formDisabled || sourceMode !== "file"}
              />
              <button
                type="button"
                onClick={() => {
                  if (canPickFile) fileInputRef.current?.click()
                }}
                disabled={sourceMode === "file" ? formDisabled : true}
                className={cn(
                  "group relative flex aspect-[4/5] w-full max-w-[32rem] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 text-left shadow-2xl md:aspect-[4/3]",
                  !hasFilePreview &&
                    !hasUrlPreview &&
                    "border-dashed border-white/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
                  canPickFile && "transition hover:border-white/40",
                )}
              >
                {hasFilePreview && previewUrl ? (
                  <video
                    src={previewUrl}
                    controls
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : hasUrlPreview && urlPreview ? (
                  // YouTube thumbnail URL is remote and user-entered, so keep it as a plain image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlPreview}
                    alt="영상 링크 미리보기"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center text-white">
                    <div className="grid size-20 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                      {sourceMode === "url" ? (
                        <LinkSimple weight="light" className="size-10" />
                      ) : (
                        <FilmSlate weight="light" className="size-10" />
                      )}
                    </div>
                    <div>
                      <p className="font-serif italic text-3xl">Add a clip</p>
                      <p className="mt-2 max-w-64 text-sm text-white/60">
                        {sourceMode === "url"
                          ? "오른쪽에 공유 링크를 붙이면 미리보기가 잡힙니다."
                          : "클릭해서 영상 파일을 고릅니다."}
                      </p>
                    </div>
                  </div>
                )}
                {file && sourceMode === "file" && (
                  <span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    {file.name} · {formatBytes(file.size)}
                  </span>
                )}
              </button>
            </div>

            <div className="flex min-h-0 flex-col border-t bg-background md:border-l md:border-t-0">
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <div className="grid size-10 place-items-center rounded-full bg-foreground font-serif italic text-background">
                  B
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {access.state === "ready" ? access.memberLabel : "Bremen member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {access.state === "loading" && "멤버 정보를 확인하는 중"}
                    {access.state === "anonymous" && "로그인이 필요합니다"}
                    {access.state === "blocked" && access.message}
                    {access.state === "ready" && "갤러리에 남길 영상을 정리합니다"}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                {access.state === "anonymous" && (
                  <Button asChild className="w-full rounded-full" variant="outline">
                    <Link href="/login?next=/photos">Sign In</Link>
                  </Button>
                )}

                <Tabs
                  value={sourceMode}
                  onValueChange={(value) => setSourceMode(value as "url" | "file")}
                >
                  <TabsList className="grid w-full grid-cols-2 rounded-full">
                    <TabsTrigger value="url" className="rounded-full" disabled={isUploading}>
                      링크
                    </TabsTrigger>
                    <TabsTrigger value="file" className="rounded-full" disabled={isUploading}>
                      파일
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="mt-4 space-y-2">
                    <Label htmlFor="member-video-url">Video URL</Label>
                    <div className="relative">
                      <LinkSimple
                        weight="light"
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="member-video-url"
                        value={videoUrl}
                        onChange={(event) => setVideoUrl(event.currentTarget.value)}
                        placeholder="YouTube, Vimeo, 공유 가능한 영상 링크"
                        className="h-11 rounded-2xl bg-background pl-9"
                        disabled={formDisabled || sourceMode !== "url"}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="file" className="mt-4 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={formDisabled || sourceMode !== "file"}
                    >
                      <FilmSlate weight="light" className="size-4" />
                      영상 파일 선택
                    </Button>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      mp4, webm, mov · 최대 100MB
                    </p>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="member-video-title">Title</Label>
                  <Input
                    id="member-video-title"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                    placeholder="빨간 피터, 새터 리허설..."
                    className="h-11 rounded-2xl bg-background"
                    maxLength={120}
                    disabled={formDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-video-description">Caption</Label>
                  <Textarea
                    id="member-video-description"
                    value={description}
                    onChange={(event) => setDescription(event.currentTarget.value)}
                    placeholder="무슨 장면이었나요?"
                    className="min-h-32 resize-none rounded-2xl bg-background"
                    maxLength={1000}
                    disabled={formDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-video-visibility">공개 범위</Label>
                  <Select
                    value={visibility}
                    onValueChange={setVisibility}
                    disabled={formDisabled}
                  >
                    <SelectTrigger
                      id="member-video-visibility"
                      className="h-11 rounded-2xl bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">전체 공개</SelectItem>
                      <SelectItem value="members">멤버 공개</SelectItem>
                      <SelectItem value="private">비공개</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    영상은 확인 후 선택한 공개 범위로 보입니다.
                  </p>
                </div>

                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between rounded-2xl border px-4"
                    >
                      공연 정보 더 적기
                      <CaretDown
                        weight="light"
                        className={cn(
                          "size-4 transition-transform",
                          advancedOpen && "rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="member-video-artist">Artist</Label>
                        <Input
                          id="member-video-artist"
                          value={artist}
                          onChange={(event) => setArtist(event.currentTarget.value)}
                          placeholder="쏜애플"
                          className="h-11 rounded-2xl bg-background"
                          maxLength={120}
                          disabled={formDisabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-video-song">Song</Label>
                        <Input
                          id="member-video-song"
                          value={song}
                          onChange={(event) => setSong(event.currentTarget.value)}
                          placeholder="빨간 피터"
                          className="h-11 rounded-2xl bg-background"
                          maxLength={160}
                          disabled={formDisabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-video-team">Team</Label>
                        <Input
                          id="member-video-team"
                          value={team}
                          onChange={(event) => setTeam(event.currentTarget.value)}
                          placeholder="팀명 또는 무대"
                          className="h-11 rounded-2xl bg-background"
                          maxLength={120}
                          disabled={formDisabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member-video-event">Event</Label>
                        <Input
                          id="member-video-event"
                          value={eventTitle}
                          onChange={(event) => setEventTitle(event.currentTarget.value)}
                          placeholder="2026 신환공"
                          className="h-11 rounded-2xl bg-background"
                          maxLength={140}
                          disabled={formDisabled}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="member-video-duration">Duration</Label>
                      <Input
                        id="member-video-duration"
                        value={duration}
                        onChange={(event) => setDuration(event.currentTarget.value)}
                        placeholder="4:44"
                        className="h-11 rounded-2xl bg-background"
                        maxLength={32}
                        disabled={formDisabled}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {file && sourceMode === "file" && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/35 px-4 py-3">
                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                      {file.name} · {formatBytes(file.size)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 rounded-full"
                      aria-label="Clear selected video"
                      onClick={clearFile}
                      disabled={isUploading}
                    >
                      <X weight="light" className="size-4" />
                    </Button>
                  </div>
                )}

                {submitState.kind === "uploading" && (
                  <div className="space-y-2 rounded-2xl border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UploadSimple className="size-4" />
                      {submitState.label}
                    </div>
                    <Progress value={sourceMode === "file" ? 66 : 45} />
                  </div>
                )}

                {submitState.kind === "success" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                    <div className="flex items-start gap-2">
                      <CheckCircle
                        weight="fill"
                        className="mt-0.5 size-4 shrink-0 text-emerald-700"
                      />
                      <p className="font-medium">{submitState.message}</p>
                    </div>
                  </div>
                )}

                {submitState.kind === "error" && (
                  <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {submitState.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
