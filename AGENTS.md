# Agent Entry Point

This is the first file Claude, Codex, and other coding agents should read. Do not load every document by default. Classify the user's intent, then read only the documents needed for that task.

## Intent Router

| User intent | Read first | Then read if needed |
| --- | --- | --- |
| "What should we do?", planning, issue drafting, task breakdown | `CONTRIBUTING.md` | `docs/issue-driven-development.md`, `.agents/skills/create-bremen-issue/SKILL.md` |
| UI, layout, shadcn/ui, Tailwind, animation, responsive behavior | `CONTRIBUTING.md` | `docs/content-graph.md` if content/section data is involved |
| Page copy, section order, curated videos/photos/stats, home hero, Join Us | `docs/content-graph.md` | `docs/supabase-setup.md` if a migration or DB write is needed |
| New section renderer or CMS-ready page structure | `docs/content-graph.md` | `docs/agentic-workflow.md`, then relevant component/loader files |
| Supabase schema, RLS, Storage policy, Auth trigger, migrations | `docs/supabase-setup.md` | `.agents/skills/guarded-supabase-mcp/SKILL.md`, `docs/agentic-workflow.md` |
| Supabase MCP inspection or production DB work | `.agents/skills/guarded-supabase-mcp/SKILL.md` | `docs/supabase-setup.md`, `docs/agentic-workflow.md` |
| Vercel, deployment, env vars, SMTP, domains, Auth redirect URLs | `docs/operations.md` | `CONTRIBUTING.md` for issue/PR tracking |
| First-time contributor access, GitHub/Vercel/Supabase invite | `CONTRIBUTING.md` | `docs/operations.md`, `.github/ISSUE_TEMPLATE/access-request.yml` |
| Security review, production risk, destructive DB concern | `docs/agentic-workflow.md` | `docs/supabase-setup.md`, `docs/operations.md` |
| README/docs/contribution guide changes | `CONTRIBUTING.md` | `docs/issue-driven-development.md`, `docs/operations.md` for Vercel docs-only skip behavior |
| Bug report or regression triage | `CONTRIBUTING.md` | Pick the domain doc from the failing surface |

If the user request spans multiple intents, read the highest-risk document first. Supabase/Auth/Ops risk takes precedence over UI convenience.

## Non-Negotiable Guardrails

- Do not commit secrets.
- Do not use service role keys in browser/client code.
- Do not disable RLS.
- Do not run destructive SQL.
- Do not apply production migrations unless explicitly approved.
- Do not make ad-hoc production writes through MCP.
- Do not hardcode CMS content in React to bypass missing `sections` or `entities`.

## Working Pattern

1. Classify the task as code, content, schema, ops, access, security, or research.
2. Use the intent router above to load the minimum required docs.
3. Confirm the issue number, or draft a structured issue before non-trivial implementation.
4. State the write scope before editing.
5. Keep changes narrow.
6. Use migrations for durable Supabase changes.
7. Run relevant checks.
8. Summarize production impact clearly.

If no issue exists and the task is not trivial, draft or request a structured issue before broad implementation.

## Local Skill Files

Agents that support repo-local skills can use:

- `.agents/skills/create-bremen-issue/SKILL.md`
- `.agents/skills/guarded-supabase-mcp/SKILL.md`
