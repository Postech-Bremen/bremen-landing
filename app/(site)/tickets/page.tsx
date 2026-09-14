import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  Ticket,
} from "lucide-react"

import { reportTicketPaymentAction } from "@/app/(site)/tickets/actions"
import { signOutAction } from "@/app/auth/actions"
import { FormSubmitButton } from "@/components/form-submit-button"
import { TicketPass } from "@/components/ticket-pass"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { requireTicketBuyer } from "@/lib/tickets/auth"
import { loadMyTicketOrders } from "@/lib/tickets/data"
import { getAppleWalletBadgePath } from "@/lib/tickets/wallet-config"
import {
  formatTicketDate,
  formatWon,
  orderStatusMeta,
  ticketStatusMeta,
} from "@/lib/tickets/presentation"

export const metadata: Metadata = {
  title: "내 티켓 | 브레멘 Bremen",
  description: "브레멘 공연 예매 내역과 입장 QR을 확인합니다.",
}

type TicketsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

const dueFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Seoul",
})

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const [user, orders, query, walletBadgePath] = await Promise.all([
    requireTicketBuyer("/tickets"),
    loadMyTicketOrders(),
    searchParams,
    getAppleWalletBadgePath(),
  ])
  const ordered = firstParam(query?.ordered)
  const saved = firstParam(query?.saved)
  const error = firstParam(query?.error)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-16">
      <header className="mb-10 grid gap-7 border-b pb-9 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="caps mb-4">My admission</p>
          <h1 className="font-serif-kr text-[clamp(3.25rem,9vw,7rem)] leading-[0.88]">
            내 티켓
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            예매와 입금 확인 상태, 공연 당일 사용할 입장 QR을 한곳에서 확인하세요.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
          <p className="max-w-full truncate text-sm text-muted-foreground">
            {user.email}
          </p>
          <form action={signOutAction}>
            <FormSubmitButton
              variant="outline"
              className="rounded-full"
              pendingLabel="로그아웃 중..."
            >
              <LogOut className="size-4" aria-hidden="true" />
              로그아웃
            </FormSubmitButton>
          </form>
        </div>
      </header>

      {ordered ? (
        <Alert className="mb-6 border-emerald-700/25 bg-emerald-700/5">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <AlertTitle>예매가 접수되었습니다</AlertTitle>
          <AlertDescription>
            아래 계좌로 입금한 뒤 ‘입금 완료’ 버튼을 눌러주세요.
          </AlertDescription>
        </Alert>
      ) : null}
      {saved === "payment" ? (
        <Alert className="mb-6">
          <Clock3 className="size-4" aria-hidden="true" />
          <AlertTitle>입금 확인을 요청했습니다</AlertTitle>
          <AlertDescription>
            운영자가 확인하면 이 화면에 개별 입장 QR이 발급됩니다.
          </AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>처리하지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!orders.length ? (
        <Card className="stage-card gap-0 overflow-hidden py-0 shadow-lg">
          <CardContent className="grid min-h-80 place-items-center px-6 py-12 text-center">
            <div>
              <Ticket className="mx-auto size-9 text-accent" aria-hidden="true" />
              <h2 className="mt-5 font-serif-kr text-3xl">아직 예매한 공연이 없습니다</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                예매 가능한 다음 공연을 확인해 보세요.
              </p>
              <Button asChild className="mt-7 rounded-full">
                <Link href="/performances">
                  공연 보러 가기
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const effectiveStatus = order.paymentExpired ? "expired" : order.status
            const status = orderStatusMeta[effectiveStatus]
            const payment = order.event.ticket_payment_settings
            const isNew = order.id === ordered

            return (
              <article
                key={order.id}
                className={`stage-card overflow-hidden rounded-md border bg-card shadow-sm ${
                  isNew ? "ring-2 ring-accent/45 ring-offset-2 ring-offset-background" : ""
                }`}
              >
                <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed pb-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={effectiveStatus === "confirmed" ? "default" : "outline"}
                          className="rounded-full"
                        >
                          {status.label}
                        </Badge>
                        <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground">
                          {order.order_number}
                        </span>
                      </div>
                      <span className="font-serif text-2xl italic">
                        {formatWon(order.total_amount)}
                      </span>
                    </div>

                    <h2 className="mt-6 font-serif-kr text-3xl leading-tight md:text-4xl">
                      {order.event.performance.title}
                    </h2>
                    <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                        {formatTicketDate(order.event.starts_at)}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0" aria-hidden="true" />
                        {order.event.venue_name}
                      </p>
                    </div>

                    <div className="mt-6 rounded-md bg-muted/45 p-4">
                      <p className="font-medium">{status.description}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {order.ticket_order_items
                          .map(
                            (item) =>
                              `${item.ticket_type.name} ${item.quantity}매`,
                          )
                          .join(" · ")}
                      </p>
                    </div>

                    {effectiveStatus === "pending_payment" && payment ? (
                      <div className="mt-5 rounded-md border p-5">
                        <div className="flex gap-3">
                          <Banknote className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                          <div>
                            <p className="caps mb-2">Bank transfer</p>
                            <p className="font-medium">
                              {payment.bank_name} {payment.account_number}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              예금주 {payment.account_holder}
                              {order.depositor_name
                                ? ` · 입금자명 ${order.depositor_name}`
                                : ""}
                            </p>
                            {order.payment_due_at ? (
                              <p className="mt-2 text-sm font-medium text-destructive">
                                {dueFormatter.format(new Date(order.payment_due_at))}까지
                              </p>
                            ) : null}
                            {payment.transfer_note ? (
                              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                {payment.transfer_note}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <form action={reportTicketPaymentAction} className="mt-5">
                          <input type="hidden" name="order_id" value={order.id} />
                          <FormSubmitButton
                            size="lg"
                            className="w-full rounded-full"
                            pendingLabel="알리는 중..."
                          >
                            입금 완료 알리기
                          </FormSubmitButton>
                        </form>
                      </div>
                    ) : null}
                  </div>

                  <aside className="relative border-t border-dashed bg-primary p-6 text-primary-foreground lg:border-l lg:border-t-0">
                    <span className="absolute -left-3 -top-3 size-6 rounded-full border bg-background lg:left-[-0.8rem] lg:top-10" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="caps text-primary-foreground/55">Admission</p>
                        <p className="mt-2 text-sm text-primary-foreground/75">
                          {order.tickets.length
                            ? `${order.tickets.length}개의 입장권`
                            : "발급 대기 중"}
                        </p>
                      </div>
                      <Ticket className="size-7 text-primary-foreground/70" aria-hidden="true" />
                    </div>

                    {order.tickets.length ? (
                      <div className="mt-6 space-y-5">
                        {order.tickets.map((ticket) => (
                          <div key={ticket.id} className="border-t border-primary-foreground/20 pt-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{ticket.holder_name}</p>
                                <p className="mt-1 font-mono text-[10px] tracking-wider text-primary-foreground/60">
                                  {ticket.serial_code}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-primary-foreground/30 text-primary-foreground"
                              >
                                {ticketStatusMeta[ticket.status].label}
                              </Badge>
                            </div>
                            {ticket.status === "issued" ? (
                              <TicketPass
                                ticketId={ticket.id}
                                qrValue={ticket.qr_token}
                                eventTitle={order.event.performance.title}
                                eventDate={formatTicketDate(order.event.starts_at)}
                                venueName={order.event.venue_name}
                                holderName={ticket.holder_name}
                                serialCode={ticket.serial_code}
                                ticketType={ticket.ticket_type.name}
                                walletBadgePath={walletBadgePath}
                              />
                            ) : (
                              <div className="grid aspect-square place-items-center rounded-md border border-primary-foreground/20 bg-primary-foreground/5 text-center">
                                <div>
                                  <CheckCircle2 className="mx-auto size-8" aria-hidden="true" />
                                  <p className="mt-3 text-sm">
                                    {ticketStatusMeta[ticket.status].label}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-8 rounded-md border border-primary-foreground/20 p-5 text-sm leading-relaxed text-primary-foreground/70">
                        입금 확인이 끝나면 이 자리에 각 티켓의 QR이 표시됩니다.
                      </div>
                    )}
                  </aside>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
