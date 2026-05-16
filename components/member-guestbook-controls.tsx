"use client"

import { useId, useState } from "react"
import { Trash2 } from "lucide-react"

import {
  createGuestbookEntryAction,
  deleteGuestbookEntryAction,
} from "@/app/(site)/members/[id]/actions"
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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const GUESTBOOK_BODY_LIMIT = 500

export function MemberGuestbookComposer({
  profileMemberId,
}: {
  profileMemberId: string
}) {
  const [body, setBody] = useState("")
  const textareaId = useId()
  const length = body.length
  const remaining = GUESTBOOK_BODY_LIMIT - length
  const canSubmit = body.trim().length > 0

  return (
    <form
      action={createGuestbookEntryAction}
      className="rounded-md border bg-muted/25 p-4"
    >
      <input type="hidden" name="member_id" value={profileMemberId} />
      <Textarea
        id={textareaId}
        name="body"
        value={body}
        maxLength={GUESTBOOK_BODY_LIMIT}
        required
        rows={4}
        placeholder="함께 남기고 싶은 짧은 안부를 적어주세요."
        className="resize-none bg-background/80"
        aria-describedby={`${textareaId}-hint ${textareaId}-count`}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p
            id={`${textareaId}-hint`}
            className="text-xs leading-relaxed text-muted-foreground"
          >
            멤버에게 보이는 공간입니다. 짧고 편하게 남겨주세요.
          </p>
          <p
            id={`${textareaId}-count`}
            className={cn(
              "text-xs text-muted-foreground",
              remaining <= 40 && "text-foreground",
            )}
            aria-live="polite"
          >
            {length}/{GUESTBOOK_BODY_LIMIT}
          </p>
        </div>
        <FormSubmitButton
          className="rounded-full"
          pendingLabel="남기는 중..."
          disabled={!canSubmit}
        >
          Leave a note
        </FormSubmitButton>
      </div>
    </form>
  )
}

export function DeleteGuestbookEntryDialog({
  profileMemberId,
  entryId,
  entryBody,
  authorName,
}: {
  profileMemberId: string
  entryId: string
  entryBody: string
  authorName: string
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 rounded-full text-muted-foreground hover:text-destructive"
          aria-label="방명록 글 삭제"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 방명록 글을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            삭제하면 멤버 프로필과 관리자 방명록 목록에서 바로 사라집니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {authorName}
          </p>
          <p className="max-h-44 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {entryBody}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <form action={deleteGuestbookEntryAction}>
            <input type="hidden" name="member_id" value={profileMemberId} />
            <input type="hidden" name="entry_id" value={entryId} />
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
