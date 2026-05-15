"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { loadGuestbookViewer } from "@/lib/data/member-guestbook"
import { createClient } from "@/lib/supabase/server"

function stringField(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function memberPath(memberId: string, params?: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : ""
  return `/members/${memberId}${suffix}`
}

async function requireApprovedGuestbookViewer(memberId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/members/${memberId}`)

  const viewer = await loadGuestbookViewer(supabase, user.id)
  if (!viewer?.approved_at) {
    redirect(
      memberPath(memberId, {
        guestbook_error: "멤버 확인이 끝난 뒤 글을 남길 수 있습니다.",
      }),
    )
  }

  return { supabase, viewer }
}

export async function createGuestbookEntryAction(formData: FormData) {
  const memberId = stringField(formData, "member_id")
  const body = stringField(formData, "body")

  if (!memberId) redirect("/members")

  if (body.length < 1) {
    redirect(
      memberPath(memberId, {
        guestbook_error: "남길 말을 한 줄 이상 적어주세요.",
      }),
    )
  }

  if (body.length > 500) {
    redirect(
      memberPath(memberId, {
        guestbook_error: "방명록은 500자 안에서 남길 수 있습니다.",
      }),
    )
  }

  const { supabase, viewer } = await requireApprovedGuestbookViewer(memberId)
  const { error } = await supabase.from("member_guestbook_entries").insert({
    profile_member_id: memberId,
    author_member_id: viewer.id,
    body,
  })

  if (error) {
    redirect(
      memberPath(memberId, {
        guestbook_error: "지금은 글을 남기지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
      }),
    )
  }

  revalidatePath(`/members/${memberId}`)
  redirect(
    memberPath(memberId, {
      guestbook_message: "방명록에 남겼습니다.",
    }),
  )
}

export async function deleteGuestbookEntryAction(formData: FormData) {
  const memberId = stringField(formData, "member_id")
  const entryId = stringField(formData, "entry_id")

  if (!memberId) redirect("/members")

  if (!entryId) {
    redirect(
      memberPath(memberId, {
        guestbook_error: "삭제할 글을 찾지 못했습니다.",
      }),
    )
  }

  const { supabase } = await requireApprovedGuestbookViewer(memberId)
  const { error } = await supabase
    .from("member_guestbook_entries")
    .delete()
    .eq("id", entryId)

  if (error) {
    redirect(
      memberPath(memberId, {
        guestbook_error: "이 글을 삭제할 권한이 없습니다.",
      }),
    )
  }

  revalidatePath(`/members/${memberId}`)
  redirect(
    memberPath(memberId, {
      guestbook_message: "방명록 글을 지웠습니다.",
    }),
  )
}
