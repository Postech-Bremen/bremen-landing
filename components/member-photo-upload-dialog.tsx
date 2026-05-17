"use client"

import { CheckCircle, ImageSquare, UploadSimple, X } from "@phosphor-icons/react"
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

import { createMemberPhotoSubmissionAction } from "@/app/(site)/photos/actions"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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

type UploadState =
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

const photoMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const photoExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif"])

function extensionFromFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase()

  if (extension && photoExtensions.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension
  }

  if (file.type === "image/jpeg") return "jpg"
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

function titleFromFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim()
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${value} B`
}

function validateFile(file: File) {
  if (!photoMimeTypes.has(file.type)) {
    return "jpg, png, webp, gif 이미지만 올릴 수 있습니다."
  }

  if (file.size > 20 * 1024 * 1024) {
    return "사진은 20MB 이하로 올려 주세요."
  }

  return null
}

type MemberPhotoUploadDialogProps = {
  onPublished?: (photo: { entityId: string; title: string }) => void
}

export function MemberPhotoUploadDialog({
  onPublished,
}: MemberPhotoUploadDialogProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [access, setAccess] = useState<AccessState>({ state: "idle" })
  const [category, setCategory] = useState("daily")
  const [aspect, setAspect] = useState("portrait")
  const [visibility, setVisibility] = useState("public")
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" })
  const [publishedPhoto, setPublishedPhoto] = useState<{
    entityId: string
    title: string
    visibility: string
  } | null>(null)

  const isUploading = uploadState.kind === "uploading"
  const formDisabled = isUploading || access.state !== "ready"
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
          message: "멤버 확인이 끝난 뒤 사진을 올릴 수 있습니다.",
        })
        return
      }

      if (member.status !== "active") {
        setAccess({
          state: "blocked",
          message: "활동 상태 멤버만 사진을 올릴 수 있습니다.",
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

  function resetForm() {
    setCategory("daily")
    setAspect("portrait")
    setVisibility("public")
    setTitle("")
    setCaption("")
    setFile(null)
    setPublishedPhoto(null)
    setUploadState({ kind: "idle" })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
      setAccess({ state: "idle" })
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (access.state !== "ready") {
      setUploadState({
        kind: "error",
        message: "사진을 올릴 수 있는 멤버 계정으로 로그인해 주세요.",
      })
      return
    }

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setUploadState({ kind: "error", message: "제목을 적어 주세요." })
      return
    }

    if (!file) {
      setUploadState({ kind: "error", message: "올릴 사진을 선택해 주세요." })
      return
    }

    const fileError = validateFile(file)
    if (fileError) {
      setUploadState({ kind: "error", message: fileError })
      return
    }

    const extension = extensionFromFile(file)
    const storagePath = `${access.authUserId}/photos/${crypto.randomUUID()}.${extension}`
    const supabase = createClient()

    setUploadState({ kind: "uploading", label: "사진을 올리는 중..." })

    const { error: uploadError } = await supabase.storage
      .from(MEMBER_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      setUploadState({
        kind: "error",
        message:
          uploadError.message || "사진을 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      })
      return
    }

    setUploadState({ kind: "uploading", label: "사진 탭에 남기는 중..." })

    const result = await createMemberPhotoSubmissionAction({
      title: cleanTitle,
      caption,
      category,
      aspect,
      visibility,
      storagePath,
      mediaType: file.type,
      originalFilename: file.name,
      fileSize: file.size,
    })

    if (!result.ok) {
      await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([storagePath])
      setUploadState({ kind: "error", message: result.error })
      return
    }

    const published = {
      entityId: result.entityId,
      title: cleanTitle,
      visibility,
    }

    resetForm()
    setPublishedPhoto(published)
    setUploadState({
      kind: "success",
      message:
        visibility === "members"
          ? `"${cleanTitle}"이 멤버 공개 기록에 올라갔습니다.`
          : `"${cleanTitle}"이 사진 탭에 올라갔습니다.`,
    })
    onPublished?.(published)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full px-6">
          <ImageSquare weight="light" className="size-4" />
          사진 올리기
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
              <DialogTitle className="text-base font-medium">새 사진</DialogTitle>
              <DialogDescription className="sr-only">
                사진을 선택하고 캡션과 공개 범위를 정해 갤러리에 올립니다.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="submit"
                variant="ghost"
                className="rounded-full px-4 font-medium text-accent-foreground"
                disabled={formDisabled}
              >
                {isUploading ? "공유 중" : "공유"}
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
                id="member-photo-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleFileChange}
                disabled={formDisabled}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={formDisabled}
                className={cn(
                  "group relative flex w-full max-w-[32rem] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 text-left shadow-2xl transition",
                  aspect === "landscape" ? "aspect-[4/3]" : "aspect-[4/5]",
                  !previewUrl && "border-dashed border-white/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
                  !formDisabled && "hover:border-white/40",
                )}
              >
                {previewUrl ? (
                  // blob URL preview cannot use next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="선택한 사진 미리보기"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center text-white">
                    <div className="grid size-20 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                      <ImageSquare weight="light" className="size-10" />
                    </div>
                    <div>
                      <p className="font-serif italic text-3xl">Drop a moment</p>
                      <p className="mt-2 text-sm text-white/60">
                        클릭해서 사진을 고릅니다.
                      </p>
                    </div>
                  </div>
                )}
                {file && (
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
                    {access.state === "ready" && "사진 탭에 남길 순간을 정리합니다"}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                {access.state === "anonymous" && (
                  <Button asChild className="w-full rounded-full" variant="outline">
                    <Link href="/login?next=/photos">Sign In</Link>
                  </Button>
                )}

                <div className="space-y-2">
                  <Label htmlFor="member-photo-title">Title</Label>
                  <Input
                    id="member-photo-title"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                    placeholder="새터 리허설, 공연 끝난 밤..."
                    className="h-11 rounded-2xl bg-background"
                    maxLength={120}
                    disabled={formDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member-photo-caption">Caption</Label>
                  <Textarea
                    id="member-photo-caption"
                    value={caption}
                    onChange={(event) => setCaption(event.currentTarget.value)}
                    placeholder="무슨 장면이었나요?"
                    className="min-h-32 resize-none rounded-2xl bg-background"
                    maxLength={1000}
                    disabled={formDisabled}
                  />
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>분류</Label>
                    <ToggleGroup
                      type="single"
                      value={category}
                      onValueChange={(value) => value && setCategory(value)}
                      variant="outline"
                      className="grid w-full grid-cols-2 rounded-full"
                      disabled={formDisabled}
                    >
                      <ToggleGroupItem value="daily" className="rounded-l-full">
                        일상
                      </ToggleGroupItem>
                      <ToggleGroupItem value="performance" className="rounded-r-full">
                        공연
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>프레임</Label>
                    <ToggleGroup
                      type="single"
                      value={aspect}
                      onValueChange={(value) => value && setAspect(value)}
                      variant="outline"
                      className="grid w-full grid-cols-2 rounded-full"
                      disabled={formDisabled}
                    >
                      <ToggleGroupItem value="portrait" className="rounded-l-full">
                        Portrait
                      </ToggleGroupItem>
                      <ToggleGroupItem value="landscape" className="rounded-r-full">
                        Landscape
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-photo-visibility">공개 범위</Label>
                    <Select
                      value={visibility}
                      onValueChange={setVisibility}
                      disabled={formDisabled}
                    >
                      <SelectTrigger
                        id="member-photo-visibility"
                        className="h-11 rounded-2xl bg-background"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">전체 공개</SelectItem>
                        <SelectItem value="members">멤버 공개</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      멤버 공개는 로그인한 활동 멤버에게만 보입니다.
                    </p>
                  </div>
                </div>

                {file && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/35 px-4 py-3">
                    <p className="min-w-0 truncate text-sm text-muted-foreground">
                      {file.name} · {formatBytes(file.size)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 rounded-full"
                      aria-label="Clear selected photo"
                      onClick={clearFile}
                      disabled={isUploading}
                    >
                      <X weight="light" className="size-4" />
                    </Button>
                  </div>
                )}

                {uploadState.kind === "uploading" && (
                  <div className="space-y-2 rounded-2xl border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UploadSimple className="size-4" />
                      {uploadState.label}
                    </div>
                    <Progress value={66} />
                  </div>
                )}

                {uploadState.kind === "success" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                    <div className="flex items-start gap-2">
                      <CheckCircle
                        weight="fill"
                        className="mt-0.5 size-4 shrink-0 text-emerald-700"
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{uploadState.message}</p>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-900/75">
                          {publishedPhoto?.visibility === "members"
                            ? "멤버 공개 기록에서 방금 올린 사진을 확인할 수 있습니다."
                            : "갤러리 맨 위에서 방금 올린 사진을 확인할 수 있습니다."}
                        </p>
                        {publishedPhoto?.visibility === "members" ? (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="mt-3 rounded-full border-emerald-300 bg-white/70 text-emerald-950 hover:bg-white"
                          >
                            <Link href="/members/media">멤버 공개 기록 열기</Link>
                          </Button>
                        ) : publishedPhoto ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3 rounded-full border-emerald-300 bg-white/70 text-emerald-950 hover:bg-white"
                            onClick={() => {
                              onPublished?.(publishedPhoto)
                              setOpen(false)
                            }}
                          >
                            갤러리에서 보기
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {uploadState.kind === "error" && (
                  <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {uploadState.message}
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
