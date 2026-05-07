import { unstable_cache } from "next/cache"

import {
  PUBLIC_CONTENT_CACHE_TAG,
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
} from "@/lib/data/public-cache"
import { createPublicClient } from "@/lib/supabase/public"
import type { Database } from "@/lib/supabase/types"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type MemberRecord = Pick<
  MemberRow,
  | "id"
  | "name"
  | "english_name"
  | "student_year"
  | "instrument"
  | "position"
  | "status"
  | "current_status"
  | "avatar_url"
  | "bio"
>

export type MemberGroup = {
  year: number
  listed: MemberRecord[]
  active: MemberRecord[]
  inactive: MemberRecord[]
  alumni: MemberRecord[]
  total: number
}

export const memberPublicSelect =
  "id, name, english_name, student_year, instrument, position, status, current_status, avatar_url, bio"

const leadershipOrder = ["밴드장", "부밴드장", "회장", "부회장", "총무"]

function leadershipRank(position: string | null) {
  if (!position) return leadershipOrder.length + 1

  const index = leadershipOrder.indexOf(position)
  return index === -1 ? leadershipOrder.length : index
}

export function sortPublicMembers(members: MemberRecord[]) {
  return [...members].sort((left, right) => {
    const yearGap = (right.student_year ?? 0) - (left.student_year ?? 0)
    if (yearGap !== 0) return yearGap

    if (left.status !== right.status) {
      const statusRank = {
        active: 0,
        unset: 1,
        inactive: 2,
        alumni: 3,
      } as const

      return (
        statusRank[left.status ?? "unset"] -
        statusRank[right.status ?? "unset"]
      )
    }

    const leadershipGap = leadershipRank(left.position) - leadershipRank(right.position)
    if (leadershipGap !== 0) return leadershipGap

    const instrumentLeft = left.instrument ?? ""
    const instrumentRight = right.instrument ?? ""
    const instrumentGap = instrumentLeft.localeCompare(instrumentRight, "ko")
    if (instrumentGap !== 0) return instrumentGap

    return left.name.localeCompare(right.name, "ko")
  })
}

export function groupMembersByYear(members: MemberRecord[]): MemberGroup[] {
  const grouped = new Map<number, MemberRecord[]>()

  for (const member of sortPublicMembers(members)) {
    if (!member.student_year) continue

    const existing = grouped.get(member.student_year) ?? []
    existing.push(member)
    grouped.set(member.student_year, existing)
  }

  return [...grouped.entries()]
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)
    .map(([year, yearMembers]) => ({
      year,
      listed: yearMembers.filter((member) => member.status === null),
      active: yearMembers.filter((member) => member.status === "active"),
      inactive: yearMembers.filter((member) => member.status === "inactive"),
      alumni: yearMembers.filter((member) => member.status === "alumni"),
      total: yearMembers.length,
    }))
}

async function loadPublicMembersUncached(): Promise<MemberRecord[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from("members")
      .select(memberPublicSelect)
      .not("student_year", "is", null)

    if (error || !data?.length) {
      return []
    }

    return sortPublicMembers(data)
  } catch {
    return []
  }
}

export const loadPublicMembers = unstable_cache(
  loadPublicMembersUncached,
  ["public-content", "members"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAG],
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
  },
)
