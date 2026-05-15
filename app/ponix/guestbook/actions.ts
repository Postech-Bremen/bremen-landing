"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import { createClient } from "@/lib/supabase/server"

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function redirectWithParams(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`${path}?${search.toString()}`)
}

export async function deleteGuestbookEntryAction(formData: FormData) {
  const entryId = stringField(formData, "entry_id")
  const profileMemberId = stringField(formData, "profile_member_id")

  if (!entryId) {
    redirectWithParams("/ponix/guestbook", {
      error: "삭제할 방명록 글을 찾지 못했습니다.",
    })
  }

  await requireCmsAdmin("/ponix/guestbook")
  const supabase = await createClient()
  const { error } = await supabase
    .from("member_guestbook_entries")
    .delete()
    .eq("id", entryId)

  if (error) {
    redirectWithParams("/ponix/guestbook", {
      error: "방명록 글을 삭제하지 못했습니다.",
    })
  }

  revalidatePath("/ponix/guestbook")
  if (profileMemberId) {
    revalidatePath(`/members/${profileMemberId}`)
  }

  redirectWithParams("/ponix/guestbook", {
    saved: "guestbook",
  })
}
