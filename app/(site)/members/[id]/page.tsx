import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MemberGuestbook } from "@/components/member-guestbook"
import {
  loadGuestbookViewer,
  loadMemberGuestbook,
} from "@/lib/data/member-guestbook"
import { memberPublicSelect } from "@/lib/data/members"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberStatus = Database["public"]["Enums"]["member_status"] | null

export const metadata: Metadata = {
  title: "멤버 조회 | 브레멘 Bremen",
  description: "브레멘 멤버 상세 정보",
}

type MemberDetailPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function statusLabel(status: MemberStatus) {
  if (status === "active") return "활동"
  if (status === "inactive") return "휴동"
  if (status === "alumni") return "졸업"
  return "미정"
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: MemberDetailPageProps) {
  const { id } = await params
  const query = (await searchParams) ?? {}
  const guestbookMessage = firstParam(query.guestbook_message)
  const guestbookError = firstParam(query.guestbook_error)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/members/${id}`)

  const [memberResult, viewer, guestbookEntries] = await Promise.all([
    supabase.from("members").select(memberPublicSelect).eq("id", id).maybeSingle(),
    loadGuestbookViewer(supabase, user.id),
    loadMemberGuestbook(supabase, id),
  ])

  const { data: member, error } = memberResult

  if (error || !member) notFound()

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10rem] top-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-8rem] bottom-10 h-72 w-72 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-20 md:px-8 md:py-28">
        <div className="mb-10">
          <Button asChild variant="outline">
            <Link href="/members">멤버 목록으로</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl lg:col-span-4">
            <CardHeader className="border-b px-6 py-6">
              {member.avatar_url && (
                <div className="mb-6 grid h-32 w-32 place-items-center overflow-hidden rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.avatar_url}
                    alt={`${member.name} 프로필 이미지`}
                    className="block h-full w-full object-cover"
                  />
                </div>
              )}
              <CardTitle className="font-serif-kr text-4xl leading-tight">
                {member.name}
              </CardTitle>
              <CardDescription>
                {member.student_year}학번 · {member.instrument ?? "세션 미정"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant={member.status === "active" ? "default" : "outline"}>
                  {statusLabel(member.status)}
                </Badge>
                {member.position && <Badge variant="secondary">{member.position}</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-md border bg-card/95 py-0 shadow-xl lg:col-span-8">
            <CardHeader className="border-b px-6 py-6 md:px-8">
              <p className="caps mb-2">Member profile</p>
              <CardTitle className="font-serif italic text-5xl leading-none">
                {member.english_name || member.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 px-6 py-6 md:px-8 md:py-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-md border bg-muted/25 p-4">
                  <p className="caps mb-2">Session</p>
                  <p className="font-serif-kr text-xl">
                    {member.instrument || "세션 미정"}
                  </p>
                </div>
                <div className="rounded-md border bg-muted/25 p-4">
                  <p className="caps mb-2">Status</p>
                  <p className="font-serif-kr text-xl">{statusLabel(member.status)}</p>
                </div>
              </div>

              <div>
                <p className="caps mb-3">Bio</p>
                <p className="font-serif-kr text-2xl leading-relaxed text-muted-foreground">
                  {member.bio || "아직 남긴 소개가 없습니다."}
                </p>
              </div>

              <div>
                <p className="caps mb-3">Now</p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {member.current_status || "아직 남긴 근황이 없습니다."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <MemberGuestbook
            profileMemberId={member.id}
            profileName={member.name}
            entries={guestbookEntries}
            viewer={viewer}
            message={guestbookMessage}
            error={guestbookError}
          />
        </div>
      </section>
    </main>
  )
}
