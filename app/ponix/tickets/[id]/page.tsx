import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, ScanLine, Users } from "lucide-react"

import {
  addTicketEventStaffAction,
  updateTicketEventStatusAction,
} from "@/app/ponix/tickets/actions"
import { TicketOrderActions } from "@/app/ponix/tickets/ticket-order-actions"
import {
  CmsListPage,
  CmsStatGrid,
  CmsStatTile,
  CmsTableCard,
} from "@/app/ponix/_components/cms-list"
import { CmsSaveNotice, CmsSubmitButton } from "@/app/ponix/_components/cms-save-controls"
import { CmsSelectField } from "@/app/ponix/_components/cms-select-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsMembers } from "@/lib/cms/members"
import { loadCmsTicketEvent } from "@/lib/tickets/data"
import {
  eventStatusMeta,
  formatTicketDate,
  formatWon,
  orderStatusMeta,
} from "@/lib/tickets/presentation"

export const metadata: Metadata = {
  title: "공연 예매 관리 | Bremen Admin",
  robots: { index: false, follow: false },
}

type TicketEventAdminPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

const staffRoleLabel = {
  manager: "매니저",
  door: "입장 스태프",
  viewer: "조회 전용",
} as const

export default async function TicketEventAdminPage({
  params,
  searchParams,
}: TicketEventAdminPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  await requireCmsAdmin(`/ponix/tickets/${id}`)
  const [event, memberList] = await Promise.all([
    loadCmsTicketEvent(id),
    loadCmsMembers(),
  ])
  if (!event) notFound()

  const saved = firstParam(query?.saved)
  const error = firstParam(query?.error)
  const eligibleMembers = memberList.members.filter((member) => member.auth_user_id)

  return (
    <CmsListPage
      eyebrow="Ticket desk / Event"
      title={event.performance.title}
      description={`${formatTicketDate(event.starts_at)} · ${event.venue_name}`}
      actions={
        <>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/ponix/tickets">
              <ArrowLeft className="size-4" aria-hidden="true" />
              목록
            </Link>
          </Button>
          {event.status !== "draft" && event.status !== "cancelled" ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/performances/${event.slug}`} target="_blank">
                공개 페이지
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          <Button asChild className="rounded-full">
            <Link href={`/staff/events/${event.id}/check-in`}>
              <ScanLine className="size-4" aria-hidden="true" />
              현장 체크인
            </Link>
          </Button>
        </>
      }
    >
      <CmsSaveNotice
        saved={Boolean(saved)}
        error={error}
        savedTitle="공연 운영 정보가 반영되었습니다"
        savedDescription="판매·주문·스태프 상태를 최신 정보로 갱신했습니다."
      />

      <CmsStatGrid>
        <CmsStatTile label="예약" value={`${event.stats.reserved}/${event.capacity}`} detail="결제 대기 포함" accent />
        <CmsStatTile label="티켓 발급" value={event.stats.confirmed} detail="승인된 좌석" />
        <CmsStatTile label="입장" value={event.stats.checkedIn} detail="체크인 완료" />
        <CmsStatTile label="확정 매출" value={formatWon(event.stats.revenue)} detail={`입금 확인 ${event.stats.pendingReview}건 대기`} />
      </CmsStatGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <CmsTableCard title="예매 주문" meta={`${event.orders.length}건`}>
          {event.orders.length ? (
            <Table className="min-w-[72rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>주문</TableHead>
                  <TableHead>예매자</TableHead>
                  <TableHead>티켓</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono text-xs">{order.order_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.buyer_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.depositor_name ? `입금자 ${order.depositor_name}` : order.buyer_email}
                      </p>
                    </TableCell>
                    <TableCell>
                      {order.ticket_order_items
                        .map((item) => `${item.ticket_type.name} ${item.quantity}매`)
                        .join(" · ")}
                    </TableCell>
                    <TableCell>{formatWon(order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "confirmed" ? "default" : "outline"}>
                        {orderStatusMeta[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TicketOrderActions
                        eventId={event.id}
                        orderId={order.id}
                        canApprove={["pending_payment", "payment_review"].includes(order.status)}
                        canCancel={!(["cancelled", "expired", "refunded"] as string[]).includes(order.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              아직 접수된 예매가 없습니다.
            </p>
          )}
        </CmsTableCard>

        <div className="space-y-6">
          <Card className="setlist-panel gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5">
              <CardTitle className="font-serif-kr text-2xl">판매 상태</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                현재 {eventStatusMeta[event.status].label}: {eventStatusMeta[event.status].description}
              </p>
              <form action={updateTicketEventStatusAction} className="space-y-3">
                <input type="hidden" name="event_id" value={event.id} />
                <input type="hidden" name="event_slug" value={event.slug} />
                <Label htmlFor="status">새 상태</Label>
                <CmsSelectField
                  id="status"
                  name="status"
                  defaultValue={event.status}
                  required
                  options={[
                    { value: "draft", label: "작성 중" },
                    { value: "published", label: "예매 예정" },
                    { value: "sales_open", label: "예매 중" },
                    { value: "sales_closed", label: "예매 마감" },
                    { value: "ended", label: "공연 종료" },
                    { value: "cancelled", label: "공연 취소" },
                  ]}
                />
                <CmsSubmitButton className="w-full" pendingLabel="바꾸는 중...">상태 변경</CmsSubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card className="setlist-panel gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5">
              <CardTitle className="flex items-center gap-2 font-serif-kr text-2xl">
                <Users className="size-5 text-accent" aria-hidden="true" />
                현장 스태프
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <div className="space-y-3">
                {event.ticket_event_staff.map((staff) => (
                  <div key={staff.member_id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{staff.member.name}</p>
                      <p className="text-xs text-muted-foreground">{staff.member.student_year}학번</p>
                    </div>
                    <Badge variant="outline">{staffRoleLabel[staff.role]}</Badge>
                  </div>
                ))}
                {!event.ticket_event_staff.length ? (
                  <p className="text-sm text-muted-foreground">지정된 스태프가 없습니다. 관리자는 항상 입장 화면을 열 수 있습니다.</p>
                ) : null}
              </div>

              <form action={addTicketEventStaffAction} className="mt-5 space-y-3 border-t pt-5">
                <input type="hidden" name="event_id" value={event.id} />
                <Label htmlFor="member_id">스태프 추가</Label>
                <CmsSelectField
                  id="member_id"
                  name="member_id"
                  required
                  placeholder="계정 연결 멤버 선택"
                  options={eligibleMembers.map((member) => ({
                    value: member.id,
                    label: `${member.name} · ${member.student_year ?? "학번 미정"}`,
                  }))}
                />
                <Label htmlFor="role">권한</Label>
                <CmsSelectField
                  id="role"
                  name="role"
                  defaultValue="door"
                  required
                  options={[
                    { value: "door", label: "입장 체크인" },
                    { value: "manager", label: "주문·입장 관리" },
                    { value: "viewer", label: "조회 전용" },
                  ]}
                />
                <CmsSubmitButton className="w-full" pendingLabel="추가 중...">스태프 추가</CmsSubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card className="setlist-panel gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5">
              <CardTitle className="font-serif-kr text-2xl">입금 계좌</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5 text-sm">
              {event.ticket_payment_settings ? (
                <>
                  <p className="font-medium">
                    {event.ticket_payment_settings.bank_name} {event.ticket_payment_settings.account_number}
                  </p>
                  <p className="mt-1 text-muted-foreground">예금주 {event.ticket_payment_settings.account_holder}</p>
                </>
              ) : (
                <p className="text-muted-foreground">등록된 계좌가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CmsListPage>
  )
}
