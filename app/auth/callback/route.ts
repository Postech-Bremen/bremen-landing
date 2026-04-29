import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

function safeNextPath(raw: string | null) {
  if (!raw?.startsWith("/") || raw.startsWith("//")) return "/mypage"
  return raw
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = safeNextPath(requestUrl.searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
