import { createClient } from "@/lib/supabase/server"
import type { Database, Json } from "@/lib/supabase/types"

export type CmsAuditTargetTable =
  Database["public"]["Tables"]["cms_audit_events"]["Row"]["target_table"]

export type CmsAuditEvent = {
  id: string
  createdAt: string
  actorMemberId: string | null
  action: string
  targetTable: string
  targetId: string | null
  changedKeys: string[]
  beforeData: Json | null
  afterData: Json | null
}

export type CmsAuditEventList = {
  available: boolean
  events: CmsAuditEvent[]
}

type CmsAuditEventProjection = Pick<
  Database["public"]["Tables"]["cms_audit_events"]["Row"],
  | "id"
  | "created_at"
  | "actor_member_id"
  | "action"
  | "target_table"
  | "target_id"
  | "changed_keys"
  | "before_data"
  | "after_data"
>

export async function loadRecentCmsAuditEvents(
  limit = 8,
): Promise<CmsAuditEventList> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cms_audit_events")
    .select(
      "id, created_at, actor_member_id, action, target_table, target_id, changed_keys, before_data, after_data",
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
    events: (data ?? []).map(mapAuditEvent),
  }
}

export async function loadCmsAuditEventsForTarget({
  targetTable,
  targetId,
  limit = 6,
}: {
  targetTable: CmsAuditTargetTable
  targetId: string
  limit?: number
}): Promise<CmsAuditEventList> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("cms_audit_events")
    .select(
      "id, created_at, actor_member_id, action, target_table, target_id, changed_keys, before_data, after_data",
    )
    .eq("target_table", targetTable)
    .eq("target_id", targetId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { available: false, events: [] }
  }

  return {
    available: true,
    events: (data ?? []).map(mapAuditEvent),
  }
}

function mapAuditEvent(event: CmsAuditEventProjection): CmsAuditEvent {
  return {
    id: event.id,
    createdAt: event.created_at,
    actorMemberId: event.actor_member_id,
    action: event.action,
    targetTable: event.target_table,
    targetId: event.target_id,
    changedKeys: event.changed_keys,
    beforeData: event.before_data,
    afterData: event.after_data,
  }
}
