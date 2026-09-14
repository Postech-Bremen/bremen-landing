import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Chrome, CreditCard, Mail, ShieldCheck } from "lucide-react"

import { googleTicketSignInAction } from "@/app/auth/actions"
import { createTicketOrderAction } from "@/app/(site)/tickets/actions"
import { FormSubmitButton } from "@/components/form-submit-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"
import { loadPublicTicketEventBySlug } from "@/lib/tickets/data"
import { formatTicketDate, formatWon } from "@/lib/tickets/presentation"

export const metadata: Metadata = {
  title: "티켓 예매 | 브레멘 Bremen",
}

type ReservePageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ReservePage({ params, searchParams }: ReservePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const event = await loadPublicTicketEventBySlug(slug)
  if (!event) notFound()

  const error = firstParam(query?.error)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const remaining = event.availability?.remaining ?? event.capacity
  const canReserve =
    event.status === "sales_open" &&
    event.ticketTypes.length > 0 &&
    remaining > 0
  const next = `/performances/${event.slug}/reserve`

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-16">
      <Button asChild variant="ghost" className="mb-6 -ml-3 rounded-full">
        <Link href={`/performances/${event.slug}`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          공연 정보로 돌아가기
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <p className="caps mb-4">Reservation</p>
          <h1 className="font-serif-kr text-[clamp(2.75rem,7vw,5rem)] leading-[0.95]">
            {event.title}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {formatTicketDate(event.startsAt)}
            <br />
            {event.venueName}
          </p>

          <div className="mt-8 border-y border-dashed py-5">
            <ol className="space-y-4 text-sm">
              {[
                ["1", "Google 계정 확인"],
                ["2", "티켓 수량과 연락처 입력"],
                ["3", "계좌이체 후 입금 완료 표시"],
                ["4", "운영자 확인 후 QR 발급"],
              ].map(([step, label]) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full border font-mono text-xs">
                    {step}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lg:col-span-6 lg:col-start-7">
          {!canReserve ? (
            <Alert>
              <AlertTitle>현재 온라인 예매 기간이 아닙니다</AlertTitle>
              <AlertDescription>
                공연 정보 페이지에서 예매 상태와 문의처를 확인해 주세요.
              </AlertDescription>
            </Alert>
          ) : !user ? (
            <Card className="stage-card gap-0 overflow-hidden py-0 shadow-xl">
              <CardHeader className="border-b px-6 py-6">
                <CardTitle className="font-serif-kr text-3xl">먼저 이메일을 확인합니다</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <form action={googleTicketSignInAction}>
                  <input type="hidden" name="next" value={next} />
                  <FormSubmitButton
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full bg-background"
                    pendingLabel="Google로 이동 중..."
                  >
                    <Chrome className="size-5" aria-hidden="true" />
                    Google로 로그인하고 예매하기
                  </FormSubmitButton>
                </form>
                <div className="mt-6 flex gap-3 rounded-md bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
                  <Mail className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  같은 Google 계정으로 언제든 내 티켓과 입장 QR을 다시 열 수 있습니다.
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="stage-card gap-0 overflow-hidden py-0 shadow-xl">
              <CardHeader className="border-b px-6 py-6">
                <p className="caps">Signed in as {user.email}</p>
                <CardTitle className="font-serif-kr text-3xl">예매 정보를 입력하세요</CardTitle>
              </CardHeader>
              <CardContent className="px-6 py-6 md:px-8 md:py-8">
                {error ? (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTitle>예매하지 못했습니다</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <form action={createTicketOrderAction}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="event_slug" value={event.slug} />

                  <div className="space-y-2">
                    <Label htmlFor="ticket_type_id">티켓 종류</Label>
                    <select
                      id="ticket_type_id"
                      name="ticket_type_id"
                      className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                      required
                    >
                      {event.ticketTypes.map((ticketType) => (
                        <option key={ticketType.id} value={ticketType.id}>
                          {ticketType.name} · {formatWon(ticketType.price_won)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">수량</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min={1}
                        max={Math.min(
                          event.maxPerOrder,
                          remaining,
                        )}
                        defaultValue={1}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer_name">예매자 이름</Label>
                      <Input
                        id="buyer_name"
                        name="buyer_name"
                        autoComplete="name"
                        defaultValue={
                          (user.user_metadata.full_name as string | undefined) ??
                          (user.user_metadata.name as string | undefined) ??
                          ""
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="buyer_phone">연락처</Label>
                      <Input
                        id="buyer_phone"
                        name="buyer_phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depositor_name">입금자명</Label>
                      <Input id="depositor_name" name="depositor_name" required />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 rounded-md bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
                    <CreditCard className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    주문을 만든 다음 내 티켓 화면에서 입금 계좌와 기한을 확인합니다.
                  </div>

                  <div className="mt-4 flex gap-3 rounded-md border p-4 text-sm leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    예매를 진행하면 공연의 환불·입장 안내에 동의한 것으로 봅니다.
                  </div>

                  <FormSubmitButton
                    size="lg"
                    className="mt-7 w-full rounded-full"
                    pendingLabel="예매를 만드는 중..."
                  >
                    예매하고 입금 안내 보기
                  </FormSubmitButton>
                </form>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
