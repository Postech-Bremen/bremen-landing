import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

type Supabase = SupabaseClient<Database>
type GuestbookRow =
  Database["public"]["Tables"]["member_guestbook_entries"]["Row"]

export type MemberGuestbookAuthor = {
  id: string
  name: string
  student_year: number | null
  instrument: string | null
}

export type MemberGuestbookEntry = Pick<
  GuestbookRow,
  "id" | "author_member_id" | "body" | "created_at"
> & {
  author: MemberGuestbookAuthor | null
}

export type GuestbookViewer = {
  id: string
  role: Database["public"]["Enums"]["member_role"]
  approved_at: string | null
} | null

const guestbookMemberSelect = "id, name, student_year, instrument"

export async function loadGuestbookViewer(
  supabase: Supabase,
  authUserId: string,
): Promise<GuestbookViewer> {
  const { data } = await supabase
    .from("members")
    .select("id, role, approved_at")
    .eq("auth_user_id", authUserId)
    .maybeSingle()

  return data ?? null
}

export async function loadMemberGuestbook(
  supabase: Supabase,
  profileMemberId: string,
): Promise<MemberGuestbookEntry[]> {
  const { data: entries, error } = await supabase
    .from("member_guestbook_entries")
    .select("id, author_member_id, body, created_at")
    .eq("profile_member_id", profileMemberId)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error || !entries?.length) return []

  const authorIds = [...new Set(entries.map((entry) => entry.author_member_id))]
  const { data: authors } = await supabase
    .from("members")
    .select(guestbookMemberSelect)
    .in("id", authorIds)

  const authorById = new Map(
    (authors ?? []).map((author) => [author.id, author] as const),
  )

  return entries.map((entry) => ({
    ...entry,
    author: authorById.get(entry.author_member_id) ?? null,
  }))
}
