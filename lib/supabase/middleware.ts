import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./types"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Gracefully no-op when Supabase is not yet configured —
  // lets the site build/render before .env.local is filled in.
  if (!url || !anonKey) return response

  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          for (const { name, value } of cookies) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookies) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Refresh session — required by @supabase/ssr.
  await supabase.auth.getUser()

  return response
}
