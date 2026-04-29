import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

import type { Database } from "./types"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          try {
            for (const { name, value, options } of cookies) {
              cookieStore.set(name, value, options as CookieOptions)
            }
          } catch {
            // Server Components cannot write cookies; middleware refreshes.
          }
        },
      },
    },
  )
}
