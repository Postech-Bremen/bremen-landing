import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle, CalendarDays, MapPin } from "lucide-react"

import {
  CmsListPage,
  CmsRecordCard,
  CmsRecordGrid,
  CmsStatGrid,
  CmsStatTile,
} from "@/app/ponix/_components/cms-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { loadCmsTicketEvents } from "@/lib/tickets/data"
import {
  eventStatusMeta,
  formatTicketDate,
  formatWon,
} from "@/lib/tickets/presentation"

export const metadata: Metadata = {
  title: "공연 예매 | Bremen Admin",
  robots: { index: false, follow: false },
}

export default async function PonixTicketsPage() {
  await requireCmsAdmin("/ponix/tickets")
  const { available, events } = await loadCmsTicketEvents()
  const upcoming = events.filter((event) => new Date(event.starts_at) >= new Date())
  const reserved = events.reduce((total, event) => total + event.reserved, 0)
  const checkedIn = events.reduce((total, event) => total + event.checkedIn, 0)
  const revenue = events.reduce((total, event) => total + event.revenue, 0)

  return (
    <CmsListPage
      eyebrow="동아리 운영 / 공연 예매"
      title="Ticket desk"
      description="공연을 공개하고 예매를 받은 뒤, 입금 확인부터 개별 QR 발급과 현장 체크인까지 이어서 관리합니다."
      actions={
        <Button asChild className="rounded-full">
          <Link href="/ponix/tickets/new">새 공연 만들기</Link>
        </Button>
      }
    >
      {!available ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>티켓 데이터베이스가 아직 준비되지 않았습니다</AlertTitle>
          <AlertDescription>
            새 티켓팅 마이그레이션을 검토하고 적용한 뒤 다시 열어주세요.
          </AlertDescription>
        </Alert>
      ) : null}

      <CmsStatGrid>
        <CmsStatTile label="공연" value={events.length} detail={`예정 ${upcoming.length}개`} accent />
        <CmsStatTile label="예약 좌석" value={reserved} detail="결제 대기 포함" />
        <CmsStatTile label="입장 완료" value={checkedIn} detail="QR 체크인 누계" />
        <CmsStatTile label="확정 매출" value={formatWon(revenue)} detail="입금 승인 주문 기준" />
      </CmsStatGrid>

      {events.length ? (
        <CmsRecordGrid>
          {events.map((event) => (
            <CmsRecordCard
              key={event.id}
              href={`/ponix/tickets/${event.id}`}
              eyebrow={eventStatusMeta[event.status].label}
              title={event.performance.title}
              description={`${event.reserved}/${event.capacity}석 예약 · ${event.confirmed}석 발급`}
              actionLabel="예매 관리"
              badges={
                <>
                  <Badge variant={event.status === "sales_open" ? "default" : "outline"}>
                    {eventStatusMeta[event.status].label}
                  </Badge>
                  <Badge variant="secondary">입장 {event.checkedIn}</Badge>
                </>
              }
              meta={
                <span className="space-y-1">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    {formatTicketDate(event.starts_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {event.venue_name}
                  </span>
                </span>
              }
              media={
                event.performance.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.performance.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null
              }
            />
          ))}
        </CmsRecordGrid>
      ) : available ? (
        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          아직 만든 공연이 없습니다. 첫 예매 공연을 추가해 주세요.
        </div>
      ) : null}
    </CmsListPage>
  )
}
