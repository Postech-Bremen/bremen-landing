import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Banknote, CalendarClock, Ticket } from "lucide-react"

import { createTicketEventAction } from "@/app/ponix/tickets/actions"
import { CmsSaveNotice, CmsSubmitButton } from "@/app/ponix/_components/cms-save-controls"
import { CmsSelectField } from "@/app/ponix/_components/cms-select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requireCmsAdmin } from "@/lib/cms/auth"

export const metadata: Metadata = {
  title: "새 예매 공연 | Bremen Admin",
  robots: { index: false, follow: false },
}

type NewTicketEventPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export default async function NewTicketEventPage({ searchParams }: NewTicketEventPageProps) {
  await requireCmsAdmin("/ponix/tickets/new")
  const query = await searchParams
  const error = firstParam(query?.error)

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 rounded-full">
          <Link href="/ponix/tickets">
            <ArrowLeft className="size-4" aria-hidden="true" />
            공연 예매로 돌아가기
          </Link>
        </Button>
        <p className="caps mb-3 mt-6 text-muted-foreground">Ticket desk / New event</p>
        <h1 className="font-serif text-[clamp(2.75rem,6vw,5.5rem)] italic leading-[0.9]">
          Create a show
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          저장하면 공연 콘텐츠와 예매 설정이 함께 만들어집니다. 작성 중으로 먼저 저장한 뒤 공개 상태를 바꿀 수 있습니다.
        </p>
      </div>

      <CmsSaveNotice error={error} />

      <form action={createTicketEventAction} className="space-y-6">
        <Card className="setlist-panel gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="flex items-center gap-2 font-serif-kr text-2xl">
              <CalendarClock className="size-5 text-accent" aria-hidden="true" />
              공연 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-2">
            <FormField label="공연명" htmlFor="title">
              <Input id="title" name="title" required />
            </FormField>
            <FormField label="주소 슬러그" htmlFor="slug" hint="영문 소문자, 숫자, 하이픈으로 입력하세요. 예: bremen-2026-fall">
              <Input id="slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
            </FormField>
            <FormField label="공연 시작" htmlFor="starts_at" hint="한국 시간 기준">
              <Input id="starts_at" name="starts_at" type="datetime-local" required />
            </FormField>
            <FormField label="공연 종료" htmlFor="ends_at" hint="선택 입력">
              <Input id="ends_at" name="ends_at" type="datetime-local" />
            </FormField>
            <FormField label="공연장" htmlFor="venue_name">
              <Input id="venue_name" name="venue_name" required />
            </FormField>
            <FormField label="공연장 주소" htmlFor="venue_address">
              <Input id="venue_address" name="venue_address" />
            </FormField>
            <FormField label="포스터 URL" htmlFor="poster_url" hint="Supabase Storage 등 공개 이미지 URL">
              <Input id="poster_url" name="poster_url" type="url" />
            </FormField>
            <FormField label="초기 공개 상태" htmlFor="status">
              <CmsSelectField
                id="status"
                name="status"
                defaultValue="draft"
                required
                options={[
                  { value: "draft", label: "작성 중" },
                  { value: "published", label: "예매 예정" },
                  { value: "sales_open", label: "바로 예매 시작" },
                ]}
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="공연 소개" htmlFor="summary">
                <Textarea id="summary" name="summary" rows={4} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card className="setlist-panel gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="flex items-center gap-2 font-serif-kr text-2xl">
              <Ticket className="size-5 text-accent" aria-hidden="true" />
              예매 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-2">
            <FormField label="전체 좌석" htmlFor="capacity">
              <Input id="capacity" name="capacity" type="number" min={1} defaultValue={100} required />
            </FormField>
            <FormField label="한 주문 최대 수량" htmlFor="max_per_order">
              <Input id="max_per_order" name="max_per_order" type="number" min={1} max={20} defaultValue={6} required />
            </FormField>
            <FormField label="예매 시작" htmlFor="sales_open_at" hint="상태를 ‘예매 중’으로 바꾸는 일시는 관리자가 결정합니다.">
              <Input id="sales_open_at" name="sales_open_at" type="datetime-local" />
            </FormField>
            <FormField label="예매 마감" htmlFor="sales_close_at">
              <Input id="sales_close_at" name="sales_close_at" type="datetime-local" />
            </FormField>
            <FormField label="티켓 이름" htmlFor="ticket_name">
              <Input id="ticket_name" name="ticket_name" defaultValue="일반 예매" required />
            </FormField>
            <FormField label="티켓 가격(원)" htmlFor="ticket_price_won">
              <Input id="ticket_price_won" name="ticket_price_won" type="number" min={1} step={1000} required />
            </FormField>
            <FormField label="입금 기한(분)" htmlFor="payment_due_minutes" hint="기본 24시간 = 1440분">
              <Input id="payment_due_minutes" name="payment_due_minutes" type="number" min={10} max={10080} defaultValue={1440} required />
            </FormField>
            <FormField label="문의처" htmlFor="contact_text">
              <Input id="contact_text" name="contact_text" placeholder="인스타그램 @postech.bremen" />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="환불·입장 안내" htmlFor="refund_policy">
                <Textarea id="refund_policy" name="refund_policy" rows={4} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card className="setlist-panel gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-6 py-5">
            <CardTitle className="flex items-center gap-2 font-serif-kr text-2xl">
              <Banknote className="size-5 text-accent" aria-hidden="true" />
              입금 계좌
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-3">
            <FormField label="은행" htmlFor="bank_name">
              <Input id="bank_name" name="bank_name" required />
            </FormField>
            <FormField label="계좌번호" htmlFor="account_number">
              <Input id="account_number" name="account_number" inputMode="numeric" required />
            </FormField>
            <FormField label="예금주" htmlFor="account_holder">
              <Input id="account_holder" name="account_holder" required />
            </FormField>
            <div className="md:col-span-3">
              <FormField label="입금 안내" htmlFor="transfer_note">
                <Textarea id="transfer_note" name="transfer_note" rows={3} placeholder="입금자명을 예매 정보와 같게 입력해 주세요." />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end rounded-md border bg-background/90 p-4 shadow-xl backdrop-blur">
          <CmsSubmitButton pendingLabel="공연 만드는 중...">공연과 예매 만들기</CmsSubmitButton>
        </div>
      </form>
    </section>
  )
}
