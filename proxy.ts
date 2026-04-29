import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every page except static assets, image optimization, and
     * favicons — i.e. when the user is actually navigating somewhere
     * that may need a refreshed Supabase session cookie.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
