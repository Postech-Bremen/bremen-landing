import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { requestPasswordResetAction } from "@/app/auth/actions"
import { FormSubmitButton } from "@/components/form-submit-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Reset Password | 브레멘 Bremen",
  description: "Bremen member password reset",
}

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {}
  const error = firstParam(params.error)
  const message = firstParam(params.message)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/mypage")

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10rem] top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-10 right-[-8rem] h-80 w-80 rounded-full bg-muted blur-3xl" />
        <div className="absolute left-1/4 top-1/2 h-px w-[38rem] rotate-[-7deg] bg-border" />
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p className="caps mb-5">Member access</p>
          <h1 className="font-serif italic text-[clamp(4rem,13vw,8rem)] leading-[0.82] tracking-tight">
            Reset
            <br />
            Password
          </h1>
          <p className="mt-6 max-w-xl font-serif-kr text-2xl leading-snug text-muted-foreground md:text-3xl">
            POSTECH 메일로 새 비밀번호를 설정할 링크를 받습니다.
          </p>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Card className="lift-card gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl">
            <CardHeader className="border-b px-6 py-6 md:px-8">
              <CardTitle className="font-serif italic text-4xl">
                Find Your Room
              </CardTitle>
              <CardDescription>
                가입한 POSTECH 메일을 입력하면 재설정 링크를 보냅니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6 md:px-8 md:py-8">
              <form action={requestPasswordResetAction}>
                <div className="space-y-2">
                  <Label htmlFor="email">POSTECH Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@postech.ac.kr"
                    className="h-11 bg-background/70"
                    required
                  />
                </div>

                {message && (
                  <p className="mt-5 rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    {message}
                  </p>
                )}
                {error && (
                  <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <FormSubmitButton
                  size="lg"
                  className="mt-7 w-full"
                  pendingLabel="Sending link..."
                >
                  Send Reset Link
                </FormSubmitButton>
              </form>

              <div className="mt-6 rounded-md bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
                비밀번호가 기억났다면{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign In
                </Link>
                으로 돌아가세요.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
