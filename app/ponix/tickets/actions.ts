"use server"

import { revalidatePath, updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { requireCmsAdmin } from "@/lib/cms/auth"
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/data/public-cache"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type EventStatus = Database["public"]["Enums"]["ticket_event_status"]
type StaffRole = Database["public"]["Enums"]["ticket_staff_role"]

const eventStatuses = new Set<EventStatus>([
  "draft",
  "published",
  "sales_open",
  "sales_closed",
  "ended",
  "cancelled",
])
const staffRoles = new Set<StaffRole>(["manager", "door", "viewer"])

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}
function integerField(formData: FormData, key: string) {
  const value = Number(stringField(formData, key))
  return Number.isInteger(value) ? value : null
}

function nullableSeoulDateTime(formData: FormData, key: string) {
  const value = stringField(formData, key)
  if (!value) return null

  const withOffset = /(?:Z|[+-]\d\d:\d\d)$/.test(value)
    ? value
    : `${value.length === 16 ? `${value}:00` : value}+09:00`
  const date = new Date(withOffset)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function requiredSeoulDateTime(formData: FormData, key: string) {
  return nullableSeoulDateTime(formData, key)
}

function redirectWithParams(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`${path}?${search.toString()}`)
}

function revalidateTicketing(eventId?: string, slug?: string) {
  revalidatePath("/performances")
  revalidatePath("/tickets")
  revalidatePath("/ponix/tickets")
  updateTag(PUBLIC_CONTENT_CACHE_TAG)

  if (eventId) {
    revalidatePath(`/ponix/tickets/${eventId}`)
    revalidatePath(`/staff/events/${eventId}/check-in`)
  }

  if (slug) {
    revalidatePath(`/performances/${slug}`)
    revalidatePath(`/performances/${slug}/reserve`)
  }
}

export async function createTicketEventAction(formData: FormData) {
  await requireCmsAdmin("/ponix/tickets/new")

  const title = stringField(formData, "title")
  const slug = stringField(formData, "slug")
  const startsAt = requiredSeoulDateTime(formData, "starts_at")
  const capacity = integerField(formData, "capacity")
  const maxPerOrder = integerField(formData, "max_per_order")
  const paymentDueMinutes = integerField(formData, "payment_due_minutes")
  const ticketPrice = integerField(formData, "ticket_price_won")
  const statusValue = stringField(formData, "status") as EventStatus
  const status = eventStatuses.has(statusValue) ? statusValue : null

  if (
    !title ||
    !slug ||
    !startsAt ||
    !capacity ||
    !maxPerOrder ||
    !paymentDueMinutes ||
    ticketPrice === null ||
    ticketPrice <= 0 ||
    !status ||
    !stringField(formData, "venue_name") ||
    !stringField(formData, "ticket_name") ||
    !stringField(formData, "bank_name") ||
    !stringField(formData, "account_number") ||
    !stringField(formData, "account_holder")
  ) {
    redirectWithParams("/ponix/tickets/new", {
      error: "필수 공연·예매·입금 정보를 정확히 입력해 주세요.",
    })
  }

  const supabase = await createClient()
  const { data: eventId, error } = await supabase.rpc("create_ticket_event", {
    p_title: title,
    p_slug: slug,
    p_summary: stringField(formData, "summary"),
    p_poster_url: stringField(formData, "poster_url"),
    p_starts_at: startsAt,
    p_ends_at: nullableSeoulDateTime(formData, "ends_at"),
    p_venue_name: stringField(formData, "venue_name"),
    p_venue_address: stringField(formData, "venue_address"),
    p_status: status,
    p_sales_open_at: nullableSeoulDateTime(formData, "sales_open_at"),
    p_sales_close_at: nullableSeoulDateTime(formData, "sales_close_at"),
    p_capacity: capacity,
    p_max_per_order: maxPerOrder,
    p_payment_due_minutes: paymentDueMinutes,
    p_ticket_name: stringField(formData, "ticket_name"),
    p_ticket_price_won: ticketPrice,
    p_bank_name: stringField(formData, "bank_name"),
    p_account_number: stringField(formData, "account_number"),
    p_account_holder: stringField(formData, "account_holder"),
    p_transfer_note: stringField(formData, "transfer_note"),
    p_contact_text: stringField(formData, "contact_text"),
    p_refund_policy: stringField(formData, "refund_policy"),
  })

  if (error || !eventId) {
    redirectWithParams("/ponix/tickets/new", {
      error: error?.message ?? "공연을 만들지 못했습니다.",
    })
  }

  revalidateTicketing(eventId, slug)
  redirect(`/ponix/tickets/${eventId}?saved=created`)
}

export async function updateTicketEventStatusAction(formData: FormData) {
  const eventId = stringField(formData, "event_id")
  const slug = stringField(formData, "event_slug")
  const statusValue = stringField(formData, "status") as EventStatus
  const status = eventStatuses.has(statusValue) ? statusValue : null
  const eventPath = `/ponix/tickets/${eventId}`
  await requireCmsAdmin(eventPath)

  if (!eventId || !status) {
    redirectWithParams(eventPath, { error: "공연 상태를 확인해 주세요." })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("update_ticket_event_status", {
    p_event_id: eventId,
    p_status: status,
  })

  if (error) redirectWithParams(eventPath, { error: error.message })

  revalidateTicketing(eventId, slug)
  redirectWithParams(eventPath, { saved: "status" })
}

export async function approveTicketOrderAction(formData: FormData) {
  const eventId = stringField(formData, "event_id")
  const orderId = stringField(formData, "order_id")
  const eventPath = `/ponix/tickets/${eventId}`
  await requireCmsAdmin(eventPath)

  if (!eventId || !orderId) {
    redirectWithParams(eventPath, { error: "확인할 주문을 찾지 못했습니다." })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("approve_ticket_order", {
    p_order_id: orderId,
  })

  if (error) redirectWithParams(eventPath, { error: error.message })

  revalidateTicketing(eventId)
  redirectWithParams(eventPath, { saved: "approved" })
}

export async function cancelTicketOrderAction(formData: FormData) {
  const eventId = stringField(formData, "event_id")
  const orderId = stringField(formData, "order_id")
  const eventPath = `/ponix/tickets/${eventId}`
  await requireCmsAdmin(eventPath)

  if (!eventId || !orderId) {
    redirectWithParams(eventPath, { error: "취소할 주문을 찾지 못했습니다." })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("cancel_ticket_order", {
    p_order_id: orderId,
  })

  if (error) redirectWithParams(eventPath, { error: error.message })

  revalidateTicketing(eventId)
  redirectWithParams(eventPath, { saved: "cancelled" })
}

export async function addTicketEventStaffAction(formData: FormData) {
  const eventId = stringField(formData, "event_id")
  const memberId = stringField(formData, "member_id")
  const roleValue = stringField(formData, "role") as StaffRole
  const role = staffRoles.has(roleValue) ? roleValue : null
  const eventPath = `/ponix/tickets/${eventId}`
  const admin = await requireCmsAdmin(eventPath)

  if (!eventId || !memberId || !role) {
    redirectWithParams(eventPath, { error: "스태프와 권한을 확인해 주세요." })
  }

  const supabase = await createClient()
  const { error } = await supabase.from("ticket_event_staff").upsert(
    {
      event_id: eventId,
      member_id: memberId,
      role,
      created_by_member_id: admin.id,
    },
    { onConflict: "event_id,member_id" },
  )

  if (error) redirectWithParams(eventPath, { error: error.message })

  revalidateTicketing(eventId)
  redirectWithParams(eventPath, { saved: "staff" })
}
