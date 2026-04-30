---
name: guarded-supabase-mcp
description: Safely use Supabase MCP for Bremen Landing with read-only defaults, migration-only writes, service-role restrictions, RLS preservation, and destructive SQL guardrails.
---

# Guarded Supabase MCP

Use this skill before any Supabase MCP action in Bremen Landing.

## Default Mode

MCP is read-only unless a maintainer explicitly approves a production write.

Safe by default:

- inspect tables
- list migrations
- run `select` queries
- run advisors
- search Supabase docs
- generate TypeScript types

## Before Any Write

Confirm:

- There is an issue or PR.
- The SQL exists in `supabase/migrations`.
- The migration has been read from disk.
- The write is explicitly approved for production if it touches production.
- The SQL preserves RLS.
- The SQL has no destructive broad operation.

## Stop Immediately If SQL Contains

- `drop schema`
- `drop table`
- `truncate`
- `delete from` without a narrow `where`
- `update` without a narrow `where`
- `disable row level security`
- storage bucket deletion
- broad `delete storage.objects`

## `apply_migration` Procedure

1. Read the migration file from `supabase/migrations`.
2. State the migration name.
3. Check it against the stop list.
4. Apply exactly that SQL.
5. Run advisors if policies, functions, triggers, or storage changed.
6. Regenerate types if schema changed.
7. Report the action in the final summary.

## Service Role

Never request or use the service role key unless the task is an approved maintainer operation. Never place it in client code, issue text, PR text, README examples, or chat logs.
