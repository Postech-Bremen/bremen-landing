# Claude Guide

Use [AGENTS.md](./AGENTS.md) as the entry point. It routes user intent to the correct contribution, content graph, Supabase, ops, and agent workflow documents.

Default follow-up references:

- `CONTRIBUTING.md`
- `docs/agentic-workflow.md`
- `docs/supabase-setup.md`
- `docs/content-graph.md`

Do not directly mutate Supabase production unless the maintainer explicitly approves the exact action.

For GitHub issue drafting, follow `.agents/skills/create-bremen-issue/SKILL.md`.

For Supabase MCP work, follow `.agents/skills/guarded-supabase-mcp/SKILL.md`.
