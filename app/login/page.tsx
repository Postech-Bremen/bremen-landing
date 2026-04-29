import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signInAction } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
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
  title: "Member Room | 브레멘 Bremen",
  description: "Bremen member room",
}

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {}
  const error = firstParam(params.error)
  const message = firstParam(params.message)
  const next = firstParam(params.next) ?? "/mypage"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/mypage")

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-1/3 h-80 w-80 rounded-full bg-muted blur-3xl" />
        <div className="absolute bottom-16 left-1/3 h-px w-[42rem] -rotate-6 bg-border" />
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p className="caps mb-5">Member access</p>
          <h1 className="font-serif italic text-[clamp(4rem,14vw,8.5rem)] leading-[0.82] tracking-tight">
            Member
            <br />
            Room
          </h1>
          <p className="mt-6 max-w-xl font-serif-kr text-2xl leading-snug text-muted-foreground md:text-3xl">
            세션과 근황, 브레멘에서의 현재를 이어서 남겨두세요.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {["프로필", "활동 상태", "멤버 카드"].map((label) => (
              <div key={label} className="rounded-md border bg-card/70 p-4 shadow-sm">
                <p className="caps">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Card className="lift-card gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl">
            <CardHeader className="border-b px-6 py-6 md:px-8">
              <CardTitle className="font-serif italic text-4xl">Sign In</CardTitle>
              <CardDescription>
                POSTECH 메일로 Member Room에 들어갑니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6 md:px-8 md:py-8">
              <form action={signInAction}>
                <input type="hidden" name="next" value={next} />
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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

                <div className="mt-5 space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
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

                <Button type="submit" size="lg" className="mt-7 w-full">
                  Sign In
                </Button>
              </form>

              <div className="mt-6 rounded-md bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
                아직 계정이 없으면{" "}
                <Link
                  href="/signup"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign Up
                </Link>
                으로 내 이름을 먼저 찾아주세요.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
