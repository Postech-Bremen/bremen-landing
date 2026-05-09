import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

type CmsSupabaseClient = SupabaseClient<Database>

export type LegacyPageSectionCountScope = {
  pageId?: string
  sectionId?: string
}

export type LegacySectionEntityCountScope = {
  sectionId?: string
  entityId?: string
}

export async function countLegacyPageSectionMirrorRows({
  supabase,
  pageId,
  sectionId,
}: {
  supabase: CmsSupabaseClient
} & LegacyPageSectionCountScope) {
  let query = supabase
    .from("page_sections")
    .select("id", { count: "exact", head: true })

  if (pageId) query = query.eq("page_id", pageId)
  if (sectionId) query = query.eq("section_id", sectionId)

  const { error, count } = await query
  if (error) {
    throw new Error(`Failed to count page-section bridge rows: ${error.message}`)
  }

  return count
}

export async function countLegacySectionEntityMirrorRows({
  supabase,
  sectionId,
  entityId,
}: {
  supabase: CmsSupabaseClient
} & LegacySectionEntityCountScope) {
  let query = supabase
    .from("section_entities")
    .select("id", { count: "exact", head: true })

  if (sectionId) query = query.eq("section_id", sectionId)
  if (entityId) query = query.eq("entity_id", entityId)

  const { error, count } = await query
  if (error) {
    throw new Error(`Failed to count section-entity bridge rows: ${error.message}`)
  }

  return count
}
