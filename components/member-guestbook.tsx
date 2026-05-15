import { MessageCircle, Trash2 } from "lucide-react"

import {
  createGuestbookEntryAction,
  deleteGuestbookEntryAction,
} from "@/app/(site)/members/[id]/actions"
import { FormSubmitButton } from "@/components/form-submit-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type {
  GuestbookViewer,
  MemberGuestbookEntry,
} from "@/lib/data/member-guestbook"
import { cn } from "@/lib/utils"

type MemberGuestbookProps = {
  profileMemberId: string
  profileName: string
  entries: MemberGuestbookEntry[]
  viewer: GuestbookViewer
  message?: string
  error?: string
}

function formatEntryDate(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}.${month}.${day}`
}

function authorLine(entry: MemberGuestbookEntry) {
  if (!entry.author) return "Bremen member"

  const parts = [`${entry.author.student_year ?? "??"}학번`]
  if (entry.author.instrument) parts.push(entry.author.instrument)
  return parts.join(" · ")
}

export function MemberGuestbook({
  profileMemberId,
  profileName,
  entries,
  viewer,
  message,
  error,
}: MemberGuestbookProps) {
  const canWrite = Boolean(viewer?.approved_at)
  const isAdmin = viewer?.role === "admin"

  return (
    <Card className="gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl">
      <CardHeader className="border-b px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps mb-2">Guestbook</p>
            <CardTitle className="font-serif italic text-5xl leading-none">
              Notes for {profileName}
            </CardTitle>
            <CardDescription className="mt-4 font-serif-kr text-base">
              공연장에서, 연습실에서, 오래 지나 다시 떠오른 말을 짧게 남깁니다.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit rounded-full">
            {entries.length} notes
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-6 py-6 md:px-8 md:py-8">
        {(message || error) && (
          <Alert
            variant={error ? "destructive" : "default"}
            className={cn(!error && "bg-muted/40")}
          >
            <AlertDescription>{error ?? message}</AlertDescription>
          </Alert>
        )}

        {canWrite ? (
          <form action={createGuestbookEntryAction} className="rounded-md border bg-muted/25 p-4">
            <input type="hidden" name="member_id" value={profileMemberId} />
            <Textarea
              name="body"
              maxLength={500}
              required
              rows={4}
              placeholder="함께 남기고 싶은 짧은 안부를 적어주세요."
              className="resize-none bg-background/80"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground">
                멤버에게 보이는 공간입니다. 500자 안에서 남길 수 있습니다.
              </p>
              <FormSubmitButton className="rounded-full" pendingLabel="남기는 중...">
                Leave a note
              </FormSubmitButton>
            </div>
          </form>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/25 px-4 py-5 text-sm text-muted-foreground">
            멤버 확인이 끝난 뒤 방명록을 남길 수 있습니다.
          </div>
        )}

        {entries.length > 0 ? (
          <ul className="space-y-3">
            {entries.map((entry) => {
              const canDelete =
                isAdmin || Boolean(viewer && viewer.id === entry.author_member_id)

              return (
                <li
                  key={entry.id}
                  className="rounded-md border bg-background/65 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-serif-kr text-lg leading-tight">
                        {entry.author?.name ?? "브레멘 멤버"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {authorLine(entry)} · {formatEntryDate(entry.created_at)}
                      </p>
                    </div>
                    {canDelete && (
                      <form action={deleteGuestbookEntryAction}>
                        <input type="hidden" name="member_id" value={profileMemberId} />
                        <input type="hidden" name="entry_id" value={entry.id} />
                        <FormSubmitButton
                          type="submit"
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                          pendingLabel=""
                          aria-label="방명록 글 삭제"
                        >
                          <Trash2 className="size-4" />
                        </FormSubmitButton>
                      </form>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {entry.body}
                  </p>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
            <div>
              <MessageCircle className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-4 font-serif-kr text-xl">아직 남겨진 말이 없습니다.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                첫 안부가 이 멤버 페이지의 작은 기록이 됩니다.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
