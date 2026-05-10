import { NextResponse, type NextRequest } from "next/server"

import {
  invalidAuthLinkMessage,
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_COOKIE_MAX_AGE_SECONDS,
  passwordRecoveryExpiredMessage,
} from "@/lib/auth/password-recovery"
import { createClient } from "@/lib/supabase/server"

function safeNextPath(raw: string | null) {
  if (!raw?.startsWith("/") || raw.startsWith("//")) return "/mypage"
  return raw
}

function errorRedirect(requestUrl: URL, next: string) {
  const fallbackPath = next === "/reset-password" ? "/forgot-password" : "/login"
  const message =
    next === "/reset-password"
      ? passwordRecoveryExpiredMessage
      : invalidAuthLinkMessage
  const redirectUrl = new URL(fallbackPath, requestUrl.origin)
  redirectUrl.searchParams.set("error", message)
  return NextResponse.redirect(redirectUrl)
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = safeNextPath(requestUrl.searchParams.get("next"))

  if (!code) {
    return errorRedirect(requestUrl, next)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return errorRedirect(requestUrl, next)
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  if (next === "/reset-password") {
    response.cookies.set(PASSWORD_RECOVERY_COOKIE, "1", {
      httpOnly: true,
      maxAge: PASSWORD_RECOVERY_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
    })
  }

  return response
}
