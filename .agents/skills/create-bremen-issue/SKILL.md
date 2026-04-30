---
name: create-bremen-issue
description: Draft structured GitHub issues for the Bremen Landing repository, including scope classification, Supabase/code impact, acceptance checks, non-goals, and agent guardrails.
---

# Create Bremen Issue

Use this skill when asked to create, refine, or post a GitHub issue for Bremen Landing.

This repository uses issue-driven development. For non-trivial implementation work, create or identify the issue before changing code, Supabase, Vercel, Auth, Storage, or content graph data.

## Workflow

1. Classify the issue as `content`, `db-migration`, `ui-change`, `bug`, `ops`, `access`, or `agent-task`.
2. Identify affected routes, tables, files, and user-facing behavior.
3. State whether Supabase changes are expected.
4. Add acceptance checks that a human can verify.
5. Add non-goals to prevent broad agent drift.
6. Add guardrails for risky areas.

Implementation PRs should use a branch like `<type>/<issue-number>-short-slug` and include `Closes #<issue-number>`.

## Issue Body Template

```markdown
## Goal

Describe the user-facing outcome.

## Type

- [ ] Content graph
- [ ] DB/schema/policy
- [ ] UI/UX
- [ ] Auth/member flow
- [ ] Ops/deployment
- [ ] Access/onboarding
- [ ] Research/data collection

## Affected Surface

- Routes:
- Components/loaders:
- Supabase tables:
- Storage buckets:
- External systems:

## Proposed Scope

What should change.

## Supabase Impact

- [ ] No Supabase change expected
- [ ] Content rows only
- [ ] Migration required
- [ ] RLS/storage/auth policy involved
- [ ] Dashboard/config change involved

## Acceptance Checks

- [ ] Check 1
- [ ] Check 2
- [ ] Check 3

## Non-Goals

- Out of scope item 1
- Out of scope item 2

## Risks and Guardrails

- Do not run destructive SQL.
- Do not disable RLS.
- Do not use service role keys outside approved scripts.
- Do not hardcode content that belongs in `sections` or `entities`.
- Do not paste invitation emails in public issues unless the contributor explicitly accepts public exposure.
```

## Posting

If the GitHub CLI is available and authenticated:

```bash
gh issue create --title "<title>" --body-file <body-file> --label "<label>"
```

Do not include secrets or private email tokens in issue bodies.
