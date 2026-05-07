import { NextResponse } from "next/server"

import { loadCmsEntityOptions } from "@/lib/cms/content"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: member } = await supabase
    .from("members")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle()

  if (member?.role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get("q")
  const schemaKey = url.searchParams.get("schema")
  const limitParam = Number(url.searchParams.get("limit"))
  const limit = Number.isFinite(limitParam) ? limitParam : undefined
  const entities = await loadCmsEntityOptions({ query, schemaKey, limit })

  return NextResponse.json({ entities })
}
