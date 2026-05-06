import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { signUpAction } from "@/app/auth/actions"
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
  title: "Sign Up | 브레멘 Bremen",
  description: "Claim your Bremen profile",
}

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {}
  const error = firstParam(params.error)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/mypage")

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-[-8rem] h-72 w-72 rounded-full bg-muted blur-3xl" />
        <div className="absolute left-10 top-36 h-px w-[38rem] rotate-[-8deg] bg-border" />
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <p className="caps mb-5">Claim your name</p>
          <h1 className="font-serif italic text-[clamp(4rem,14vw,8.5rem)] leading-[0.82] tracking-tight">
            Sign
            <br />
            Up
          </h1>
          <p className="mt-6 max-w-xl font-serif-kr text-2xl leading-snug text-muted-foreground md:text-3xl">
            브레멘 명단 속 내 이름을 찾고, 앞으로의 기록을 이어갑니다.
          </p>

          <div className="mt-10 max-w-xl rounded-md border bg-card/70 p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3 text-center">
              {["이름", "학번", "메일"].map((label, index) => (
                <div key={label} className="rounded-sm bg-muted/50 p-3">
                  <p className="font-serif italic text-3xl">{index + 1}</p>
                  <p className="caps mt-2">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <Card className="lift-card gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl">
            <CardHeader className="border-b px-6 py-6 md:px-8">
              <CardTitle className="font-serif italic text-4xl">Sign Up</CardTitle>
              <CardDescription>
                이름과 입학연도는 브레멘 명단 기준으로 입력합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6 md:px-8 md:py-8">
              <form action={signUpAction}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="김형수"
                      autoComplete="name"
                      className="h-11 bg-background/70"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_year">Student Year</Label>
                    <Input
                      id="student_year"
                      name="student_year"
                      inputMode="numeric"
                      placeholder="2021 또는 20210468"
                      className="h-11 bg-background/70"
                      required
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      20210468처럼 써도 2021학번으로 알아봅니다.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    pattern="^[^@\s]+@postech\.ac\.kr$"
                    placeholder="name@postech.ac.kr"
                    title="POSTECH 메일(@postech.ac.kr)만 사용할 수 있습니다."
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
                    autoComplete="new-password"
                    minLength={8}
                    className="h-11 bg-background/70"
                    required
                  />
                </div>

                {error && (
                  <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <FormSubmitButton
                  size="lg"
                  className="mt-7 w-full"
                  pendingLabel="Sending confirmation..."
                >
                  Find my profile
                </FormSubmitButton>
              </form>

              <div className="mt-6 rounded-md bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
                이미 계정이 있으면{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign In
                </Link>
                하세요.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
