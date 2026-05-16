import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { MemberMediaRoom } from "@/components/member-media-room"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  loadMemberMediaViewer,
  loadMemberRoomMedia,
} from "@/lib/data/member-room-media"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "멤버 공개 기록 | 브레멘 Bremen",
  description: "브레멘 활동 멤버에게만 공개된 사진과 영상.",
}

export default async function MemberMediaPage() {
  const supabase = await createClient()
  const viewer = await loadMemberMediaViewer(supabase)

  if (viewer.state === "anonymous") {
    redirect("/login?next=/members/media")
  }

  if (viewer.state === "blocked") {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-6 py-20 md:px-8">
        <Card className="w-full rounded-md border bg-card/95 shadow-xl">
          <CardHeader>
            <p className="caps mb-3 text-muted-foreground">Members only</p>
            <CardTitle className="font-serif-kr text-3xl leading-tight md:text-4xl">
              멤버 공개 기록을 열 수 없습니다
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {viewer.reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/mypage">내 정보 확인</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/members">멤버 페이지</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const media = await loadMemberRoomMedia(supabase, viewer.member)

  return (
    <MemberMediaRoom
      viewer={media.viewer}
      photos={media.photos}
      videos={media.videos}
    />
  )
}
