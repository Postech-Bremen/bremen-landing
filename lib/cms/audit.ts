import { createClient } from "@/lib/supabase/server"

export type CmsAuditEvent = {
  id: string
  createdAt: string
  actorMemberId: string | null
  action: string
  targetTable: string
  targetId: string | null
  changedKeys: string[]
}

export type CmsAuditEventList = {
  available: boolean
  events: CmsAuditEvent[]
}

export async function loadRecentCmsAuditEvents(
  limit = 8,
): Promise<CmsAuditEventList> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cms_audit_events")
    .select(
      "id, created_at, actor_member_id, action, target_table, target_id, changed_keys",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    // The audit migration may be reviewed and applied after the app deploy.
    // Keep PONIX usable until the migration is present in the target DB.
    return { available: false, events: [] }
  }

  return {
    available: true,
    events: (data ?? []).map((event) => ({
      id: event.id,
      createdAt: event.created_at,
      actorMemberId: event.actor_member_id,
      action: event.action,
      targetTable: event.target_table,
      targetId: event.target_id,
      changedKeys: event.changed_keys,
    })),
  }
}
