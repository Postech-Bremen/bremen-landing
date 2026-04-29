import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { signOutAction, updateProfileAction } from "@/app/auth/actions"
import { ProfileImageInput } from "@/components/profile-image-input"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export const metadata: Metadata = {
  title: "Profile | 브레멘 Bremen",
  description: "Bremen member profile",
}

type MyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function statusLabel(status: MemberRow["status"]) {
  if (status === "active") return "활동"
  if (status === "inactive") return "휴동"
  if (status === "alumni") return "졸업"
  return "미정"
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = (await searchParams) ?? {}
  const error = firstParam(params.error)
  const message = firstParam(params.message)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=/mypage")

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, email, name, english_name, student_year, instrument, position, status, role, current_status, bio, avatar_url, approved_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle()

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-12rem] top-16 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-[-10rem] top-1/2 h-80 w-80 rounded-full bg-muted blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="caps mb-5">Member Room</p>
            <h1 className="font-serif italic text-[clamp(4rem,13vw,8rem)] leading-[0.82] tracking-tight">
              Profile
            </h1>
            <p className="mt-5 max-w-2xl font-serif italic text-3xl leading-tight text-muted-foreground md:text-4xl">
              Your session, status, and latest note.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              지금의 세션과 근황을 브레멘에 남겨두세요.
            </p>
          </div>
          <form action={signOutAction} className="lg:col-span-4 lg:justify-self-end">
            <Button type="submit" variant="outline" size="lg">
              Sign Out
            </Button>
          </form>
        </div>

        <div>
          {!member ? (
            <Card className="max-w-2xl rounded-md border bg-card/95 shadow-xl">
              <CardHeader>
                <CardTitle className="font-serif-kr text-3xl">
                  아직 연결된 프로필이 없습니다
                </CardTitle>
                <CardDescription>
                  가입할 때 입력한 이름과 학번으로 찾은 멤버가 없습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="rounded-md bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Signed in as {user.email}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <Card className="gap-0 overflow-hidden rounded-md border bg-card/95 py-0 shadow-xl lg:col-span-4">
                <CardHeader className="border-b px-6 py-6">
                  <CardTitle className="font-serif-kr text-4xl leading-tight">
                    {member.name}
                  </CardTitle>
                  <CardDescription>
                    {member.student_year}학번 · {member.instrument ?? "세션 미정"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-6">
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={member.status === "active" ? "default" : "outline"}>
                      {statusLabel(member.status)}
                    </Badge>
                    <Badge variant="outline">
                      {member.role === "admin" ? "관리자" : "멤버"}
                    </Badge>
                    {member.position && (
                      <Badge variant="secondary">{member.position}</Badge>
                    )}
                  </div>
                  <div className="mt-8 space-y-4 border-t pt-6">
                    <div>
                      <p className="caps mb-2">Email</p>
                      <p className="break-all text-sm text-muted-foreground">
                        {member.email ?? user.email}
                      </p>
                    </div>
                    <div>
                      <p className="caps mb-2">Now</p>
                      <p className="text-sm text-muted-foreground">
                        {member.current_status || "아직 남긴 근황이 없습니다."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-md border bg-card/95 py-0 shadow-xl lg:col-span-8">
                <CardHeader className="border-b px-6 py-6 md:px-8">
                  <CardTitle className="font-serif italic text-4xl">
                    Edit Profile
                  </CardTitle>
                  <CardDescription>
                    이름과 학번은 브레멘 명단 기준을 유지합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 py-6 md:px-8 md:py-8">
                  <form action={updateProfileAction}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="instrument">Session</Label>
                        <Input
                          id="instrument"
                          name="instrument"
                          defaultValue={member.instrument ?? ""}
                          placeholder="보컬, 기타, 베이스..."
                          className="h-11 bg-background/70"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={member.status ?? "unset"}>
                          <SelectTrigger id="status" className="h-11 w-full bg-background/70">
                            <SelectValue placeholder="Status 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unset">미정</SelectItem>
                            <SelectItem value="active">활동</SelectItem>
                            <SelectItem value="inactive">휴동</SelectItem>
                            <SelectItem value="alumni">졸업</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="english_name">English Name</Label>
                        <Input
                          id="english_name"
                          name="english_name"
                          defaultValue={member.english_name ?? ""}
                          placeholder="Hyeongsoo Kim"
                          className="h-11 bg-background/70"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar_file">Profile Image</Label>
                        <input
                          type="hidden"
                          name="avatar_url"
                          value={member.avatar_url ?? ""}
                        />
                        <ProfileImageInput
                          id="avatar_file"
                          name="avatar_file"
                        />
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          새 이미지를 선택하면 저장할 때 프로필에 반영됩니다.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <Label htmlFor="current_status">Now</Label>
                      <Input
                        id="current_status"
                        name="current_status"
                        defaultValue={member.current_status ?? ""}
                        placeholder="대학원, 회사, 프로젝트 등"
                        className="h-11 bg-background/70"
                      />
                    </div>

                    <div className="mt-5 space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        defaultValue={member.bio ?? ""}
                        rows={5}
                        placeholder="브레멘 안에서 나를 소개할 짧은 문장"
                        className="bg-background/70"
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
                      Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
