import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Chrome, ShieldCheck, Ticket } from "lucide-react"

import { googleTicketSignInAction } from "@/app/auth/actions"
import { FormSubmitButton } from "@/components/form-submit-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "티켓 로그인 | 브레멘 Bremen",
  description: "Google 계정으로 예매하고 입장 QR을 확인합니다.",
}

type TicketLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function safeNext(value: string | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/tickets"
  return value
}

export default async function TicketLoginPage({ searchParams }: TicketLoginPageProps) {
  const query = (await searchParams) ?? {}
  const next = safeNext(firstParam(query.next))
  const error = firstParam(query.error)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect(next)

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 px-6 py-16 md:px-8 lg:grid-cols-12">
      <section className="lg:col-span-6">
        <p className="caps mb-5">One account, every ticket</p>
        <h1 className="font-serif text-[clamp(4rem,12vw,8rem)] italic leading-[0.82]">
          Your
          <br />
          Ticket
        </h1>
        <p className="mt-6 max-w-xl font-serif-kr text-2xl leading-snug text-muted-foreground md:text-3xl">
          예매부터 입장 QR까지, 같은 Google 계정에서 다시 확인하세요.
        </p>
      </section>

      <Card className="stage-card gap-0 overflow-hidden py-0 shadow-xl lg:col-span-5 lg:col-start-8">
        <CardHeader className="border-b px-6 py-6 md:px-8">
          <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Ticket className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="font-serif-kr text-3xl">티켓 계정으로 계속하기</CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6 md:px-8 md:py-8">
          {error ? (
            <Alert variant="destructive" className="mb-5">
              <AlertTitle>로그인하지 못했습니다</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={googleTicketSignInAction}>
            <input type="hidden" name="next" value={next} />
            <FormSubmitButton
              size="lg"
              variant="outline"
              className="w-full justify-center rounded-full bg-background"
              pendingLabel="Google로 이동 중..."
            >
              <Chrome className="size-5" aria-hidden="true" />
              Google로 계속하기
            </FormSubmitButton>
          </form>

          <div className="mt-6 flex gap-3 rounded-md bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              Google 이메일은 티켓 소유권과 재접속에만 사용됩니다. 일반 관객 계정은
              Bremen 멤버 명단에 등록되지 않습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
