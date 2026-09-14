import type { Database } from "@/lib/supabase/types"

type EventStatus = Database["public"]["Enums"]["ticket_event_status"]
type OrderStatus = Database["public"]["Enums"]["ticket_order_status"]
type TicketStatus = Database["public"]["Enums"]["ticket_status"]

export const eventStatusMeta: Record<
  EventStatus,
  { label: string; description: string }
> = {
  draft: { label: "작성 중", description: "관리자에게만 보입니다." },
  published: { label: "예매 예정", description: "공연 정보가 공개되었습니다." },
  sales_open: { label: "예매 중", description: "지금 온라인 예매할 수 있습니다." },
  sales_closed: { label: "예매 마감", description: "온라인 예매가 끝났습니다." },
  ended: { label: "공연 종료", description: "공연과 입장이 종료되었습니다." },
  cancelled: { label: "공연 취소", description: "취소된 공연입니다." },
}
export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; description: string }
> = {
  pending_payment: { label: "입금 대기", description: "입금 후 완료 버튼을 눌러주세요." },
  payment_review: { label: "입금 확인 중", description: "운영자가 입금 내역을 확인하고 있습니다." },
  confirmed: { label: "티켓 발급", description: "입장 QR이 준비되었습니다." },
  cancelled: { label: "주문 취소", description: "취소된 주문입니다." },
  expired: { label: "기한 만료", description: "입금 기한이 지나 예약이 만료되었습니다." },
  refunded: { label: "환불 완료", description: "환불 처리된 주문입니다." },
}

export const ticketStatusMeta: Record<TicketStatus, { label: string }> = {
  issued: { label: "입장 가능" },
  checked_in: { label: "입장 완료" },
  void: { label: "사용 불가" },
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
})

export function formatTicketDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value) + "원"
}
