import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type GuestbookRow =
  Database["public"]["Tables"]["member_guestbook_entries"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type CmsGuestbookMember = Pick<
  MemberRow,
  "id" | "name" | "student_year" | "instrument"
>

export type CmsGuestbookEntry = Pick<
  GuestbookRow,
  "id" | "profile_member_id" | "author_member_id" | "body" | "created_at"
> & {
  profile: CmsGuestbookMember | null
  author: CmsGuestbookMember | null
}

export type CmsGuestbookStats = {
  total: number
  profiles: number
  authors: number
  latestAt: string | null
}

const memberSelect = "id, name, student_year, instrument"

export async function loadCmsGuestbookEntries(): Promise<{
  entries: CmsGuestbookEntry[]
  stats: CmsGuestbookStats
}> {
  const supabase = await createClient()
  const { data: entries, error } = await supabase
    .from("member_guestbook_entries")
    .select("id, profile_member_id, author_member_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error || !entries?.length) {
    return {
      entries: [],
      stats: {
        total: 0,
        profiles: 0,
        authors: 0,
        latestAt: null,
      },
    }
  }

  const memberIds = [
    ...new Set(
      entries.flatMap((entry) => [
        entry.profile_member_id,
        entry.author_member_id,
      ]),
    ),
  ]
  const { data: members } = await supabase
    .from("members")
    .select(memberSelect)
    .in("id", memberIds)
  const memberById = new Map(
    (members ?? []).map((member) => [member.id, member] as const),
  )
  const mapped = entries.map((entry) => ({
    ...entry,
    profile: memberById.get(entry.profile_member_id) ?? null,
    author: memberById.get(entry.author_member_id) ?? null,
  }))

  return {
    entries: mapped,
    stats: {
      total: mapped.length,
      profiles: new Set(mapped.map((entry) => entry.profile_member_id)).size,
      authors: new Set(mapped.map((entry) => entry.author_member_id)).size,
      latestAt: mapped[0]?.created_at ?? null,
    },
  }
}
