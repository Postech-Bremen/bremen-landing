# Agent Instructions

This repository supports issue-scoped agent contributions. Read this file before making changes.

## Start Here

- Human contribution flow: `CONTRIBUTING.md`
- Content graph model: `docs/content-graph.md`
- Supabase setup and safe DB workflow: `docs/supabase-setup.md`
- Agent guardrails: `docs/agentic-workflow.md`
- Deployment and ops: `docs/operations.md`

## Non-Negotiable Guardrails

- Do not commit secrets.
- Do not use service role keys in browser/client code.
- Do not disable RLS.
- Do not run destructive SQL.
- Do not apply production migrations unless explicitly approved.
- Do not make ad-hoc production writes through MCP.
- Do not hardcode CMS content in React to bypass missing `sections` or `entities`.

## Working Pattern

1. Confirm the issue or create a structured issue draft.
2. Classify the task as code, content, schema, ops, or research.
3. State the write scope before editing.
4. Keep changes narrow.
5. Use migrations for durable Supabase changes.
6. Run relevant checks.
7. Summarize production impact clearly.

## Local Skill Files

Agents that support repo-local skills can use:

- `.agents/skills/create-bremen-issue/SKILL.md`
- `.agents/skills/guarded-supabase-mcp/SKILL.md`
