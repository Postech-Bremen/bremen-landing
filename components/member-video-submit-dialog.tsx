"use client"

import { FilmSlate, LinkSimple, UploadSimple, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react"

import { createMemberVideoSubmissionAction } from "@/app/(site)/videos/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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

export function MemberVideoSubmitDialog() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [access, setAccess] = useState<AccessState>({ state: "idle" })
  const [sourceMode, setSourceMode] = useState<"url" | "file">("url")
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

  function resetForm() {
    setSourceMode("url")
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
        ? "영상이 아카이브에 반영되었습니다."
        : "영상이 제출되었습니다. 확인이 끝나면 선택한 공개 범위로 보입니다.",
    })
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="rounded-full px-6">
          <FilmSlate weight="light" className="size-4" />
          영상 제출
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(92vh,54rem)] max-w-4xl overflow-y-auto p-0">
        <div className="grid md:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b bg-muted/50 p-6 md:border-b-0 md:border-r md:p-8">
            <DialogHeader>
              <p className="caps text-muted-foreground">Video Submission</p>
              <DialogTitle className="font-serif italic text-4xl">
                Add a recording
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                브레멘의 영상 기록을 아카이브에 남깁니다.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 rounded-md border bg-background/70 p-4 text-sm leading-relaxed text-muted-foreground">
              {access.state === "loading" && "멤버 정보를 확인하는 중입니다."}
              {access.state === "anonymous" && (
                <>
                  로그인한 활동 멤버만 영상을 제출할 수 있습니다.
                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href="/login?next=/videos">Sign In</Link>
                  </Button>
                </>
              )}
              {access.state === "blocked" && access.message}
              {access.state === "ready" && (
                <>
                  <span className="caps mb-2 block text-foreground">
                    {access.memberLabel}
                  </span>
                  제출한 영상은 바로 공개되지 않습니다. 확인이 끝나면 선택한 공개
                  범위에 맞춰 아카이브에 반영됩니다.
                  <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href="/members/media">멤버 공개 기록 보기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
            <Tabs
              value={sourceMode}
              onValueChange={(value) => setSourceMode(value as "url" | "file")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" disabled={isUploading}>
                  영상 링크
                </TabsTrigger>
                <TabsTrigger value="file" disabled={isUploading}>
                  파일 업로드
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
                    className="h-11 bg-background/70 pl-9"
                    disabled={formDisabled || sourceMode !== "url"}
                  />
                </div>
              </TabsContent>
              <TabsContent value="file" className="mt-4 space-y-2">
                <Label htmlFor="member-video-file">Video File</Label>
                <div className="rounded-md border bg-background/70 p-3">
                  <input
                    ref={fileInputRef}
                    id="member-video-file"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={formDisabled || sourceMode !== "file"}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={formDisabled || sourceMode !== "file"}
                    >
                      <FilmSlate weight="light" className="size-4" />
                      Choose Video
                    </Button>
                    <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {file ? `${file.name} · ${formatBytes(file.size)}` : "No file selected"}
                    </p>
                    {file && (
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
                    )}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  mp4, webm, mov · 최대 100MB
                </p>
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <div className="space-y-2">
                <Label htmlFor="member-video-title">Title</Label>
                <Input
                  id="member-video-title"
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  placeholder="빨간 피터, 새터 리허설..."
                  className="h-11 bg-background/70"
                  maxLength={120}
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
                    className="h-11 bg-background/70"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">전체 공개</SelectItem>
                    <SelectItem value="members">멤버 공개</SelectItem>
                    <SelectItem value="private">비공개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-video-description">Description</Label>
              <Textarea
                id="member-video-description"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
                placeholder="영상에 함께 남길 짧은 설명"
                className="min-h-24 bg-background/70"
                maxLength={1000}
                disabled={formDisabled}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member-video-artist">Artist</Label>
                <Input
                  id="member-video-artist"
                  value={artist}
                  onChange={(event) => setArtist(event.currentTarget.value)}
                  placeholder="쏜애플"
                  className="h-11 bg-background/70"
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
                  className="h-11 bg-background/70"
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
                  className="h-11 bg-background/70"
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
                  className="h-11 bg-background/70"
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
                className="h-11 bg-background/70"
                maxLength={32}
                disabled={formDisabled}
              />
            </div>

            {submitState.kind === "uploading" && (
              <div className="space-y-2 rounded-md border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UploadSimple className="size-4" />
                  {submitState.label}
                </div>
                <Progress value={sourceMode === "file" ? 66 : 45} />
              </div>
            )}

            {submitState.kind === "success" && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                {submitState.message}
              </p>
            )}

            {submitState.kind === "error" && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitState.message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={formDisabled}
            >
              {isUploading ? "Submitting..." : "Submit recording"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
