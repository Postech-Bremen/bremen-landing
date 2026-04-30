import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "PONIX CMS | 브레멘 Bremen",
  description: "Bremen CMS control surface",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PonixPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/ponix")
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (member?.role !== "admin") {
    notFound()
  }

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-0 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="caps mb-5">Bremen CMS</p>
            <h1 className="font-serif text-[clamp(4rem,12vw,8rem)] italic leading-[0.82] tracking-tight">
              PONIX
            </h1>
            <p className="mt-5 max-w-2xl font-serif italic text-3xl leading-tight text-muted-foreground md:text-4xl">
              Content graph control surface.
            </p>
          </div>
          <Badge variant="outline" className="w-fit rounded-full px-4 py-2">
            Signed in as {member.name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            ["Pages", "페이지별 섹션 구성과 공개 상태를 관리합니다."],
            ["Sections", "섹션 문구, props, renderer contract를 관리합니다."],
            ["Entities", "영상, 사진, 공연, 히스토리, 링크 데이터를 관리합니다."],
          ].map(([title, body]) => (
            <Card key={title} className="rounded-md border bg-card/95 shadow-xl">
              <CardHeader>
                <CardTitle className="font-serif text-3xl italic">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
