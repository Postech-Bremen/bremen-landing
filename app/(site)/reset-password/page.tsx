import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { updatePasswordAction } from "@/app/auth/actions"
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
import {
  PASSWORD_RECOVERY_COOKIE,
  passwordRecoveryExpiredMessage,
} from "@/lib/auth/password-recovery"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "New Password | 브레멘 Bremen",
  description: "Set a new Bremen member password",
}

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {}
  const error = firstParam(params.error)
  const cookieStore = await cookies()
  const hasRecoveryGuard = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === "1"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !hasRecoveryGuard) {
    const search = new URLSearchParams({
      error: passwordRecoveryExpiredMessage,
    })
    redirect(`/forgot-password?${search.toString()}`)
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-12 left-[-8rem] h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p className="caps mb-5">Member access</p>
          <h1 className="font-serif italic text-[clamp(4rem,13vw,8rem)] leading-[0.82] tracking-tight">
            New
            <br />
            Password
          </h1>
          <p className="mt-6 max-w-xl font-serif-kr text-2xl leading-snug text-muted-foreground md:text-3xl">
            다른 곳에서 쓰지 않은 긴 비밀번호로 Member Room을 지켜주세요.
          </p>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Card className="lift-card gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl">
            <CardHeader className="border-b px-6 py-6 md:px-8">
              <CardTitle className="font-serif italic text-4xl">
                Set Password
              </CardTitle>
              <CardDescription>
                재설정이 끝나면 다시 Sign In으로 들어갑니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6 md:px-8 md:py-8">
              <form action={updatePasswordAction}>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    className="h-11 bg-background/70"
                    required
                  />
                </div>

                <div className="mt-5 space-y-2">
                  <Label htmlFor="password_confirm">Confirm Password</Label>
                  <Input
                    id="password_confirm"
                    name="password_confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    className="h-11 bg-background/70"
                    required
                  />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  유출된 적 없는 비밀번호를 권장합니다. 같은 비밀번호를 여러
                  서비스에 반복해서 쓰지 마세요.
                </p>

                {error && (
                  <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <FormSubmitButton
                  size="lg"
                  className="mt-7 w-full"
                  pendingLabel="Saving password..."
                >
                  Save New Password
                </FormSubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
