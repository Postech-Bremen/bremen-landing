"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireTicketBuyer } from "@/lib/tickets/auth"
import { createClient } from "@/lib/supabase/server"

function stringField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}
function redirectWithParams(path: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params)
  redirect(`${path}?${search.toString()}`)
}

function positiveInteger(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export async function createTicketOrderAction(formData: FormData) {
  const eventId = stringField(formData, "event_id")
  const eventSlug = stringField(formData, "event_slug")
  const ticketTypeId = stringField(formData, "ticket_type_id")
  const quantity = positiveInteger(stringField(formData, "quantity"))
  const buyerName = stringField(formData, "buyer_name")
  const buyerPhone = stringField(formData, "buyer_phone")
  const depositorName = stringField(formData, "depositor_name")
  const reservePath = `/performances/${encodeURIComponent(eventSlug)}/reserve`

  await requireTicketBuyer(reservePath)

  if (!eventId || !eventSlug || !ticketTypeId || !quantity || !buyerName) {
    redirectWithParams(reservePath, {
      error: "티켓 종류, 수량, 예매자 이름을 확인해 주세요.",
    })
  }

  const supabase = await createClient()
  const { data: orderId, error } = await supabase.rpc("create_ticket_order", {
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId,
    p_quantity: quantity,
    p_buyer_name: buyerName,
    p_buyer_phone: buyerPhone,
    p_depositor_name: depositorName,
  })

  if (error || !orderId) {
    redirectWithParams(reservePath, {
      error: error?.message ?? "예매를 만들지 못했습니다.",
    })
  }

  revalidatePath("/tickets")
  revalidatePath(`/performances/${eventSlug}`)
  redirect(`/tickets?ordered=${encodeURIComponent(orderId)}`)
}

export async function reportTicketPaymentAction(formData: FormData) {
  const orderId = stringField(formData, "order_id")
  await requireTicketBuyer("/tickets")

  if (!orderId) {
    redirectWithParams("/tickets", {
      error: "입금 완료를 표시할 주문을 찾지 못했습니다.",
    })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("report_ticket_order_paid", {
    p_order_id: orderId,
  })

  if (error) {
    redirectWithParams("/tickets", {
      error: error.message,
    })
  }

  revalidatePath("/tickets")
  redirectWithParams("/tickets", {
    saved: "payment",
  })
}
