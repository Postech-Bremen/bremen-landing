# Issue-Driven Development

This repository uses issue-driven development. An issue is the contract for a change. Code, Supabase, Vercel, and agent work should happen only after the issue has a clear goal, scope, acceptance checks, and guardrails.

## Contract

Every non-trivial change needs a GitHub issue before implementation.

The issue should define:

- user-facing goal
- affected route, component, table, or service
- expected Supabase impact
- acceptance checks
- explicit non-goals
- risk and guardrail notes

The PR should implement that issue, not rediscover the scope from scratch.

GitHub Actions enforce this for PRs:

- PR body must include `Closes #<issue-number>`, `Fixes #<issue-number>`, or `Resolves #<issue-number>`.
- Internal branch names must follow `<type>/<issue-number>-short-slug`.
- For internal branches, the branch issue number must match a closing issue reference in the PR body.

## Lifecycle

1. Create a structured issue from the closest template.
2. Discuss and narrow the scope.
3. Create a branch from the issue number.
4. Implement only the accepted scope.
5. Open a PR with `Closes #<issue-number>`.
6. Run checks and record skipped checks.
7. Merge after review.
8. Let GitHub close the issue from the PR link.

## Branch Naming

Use:

```txt
<type>/<issue-number>-short-slug
```

Examples:

- `ui/42-video-filter-search`
- `content/51-home-hero-curation`
- `db/64-member-profile-policy`
- `ops/72-vercel-auth-redirects`
- `docs/88-agent-onboarding`
- `agent/91-gallery-triage`

Allowed internal branch prefixes:

- `issue`
- `ui`
- `content`
- `db`
- `ops`
- `bug`
- `docs`
- `agent`
- `access`
- `security`
- `chore`

External fork PRs may use different branch names, but the PR must still link an issue.

## PR Requirement

Every PR body must include a closing issue reference:

```txt
Closes #123
```

Accepted closing keywords:

- `Closes #123`
- `Fixes #123`
- `Resolves #123`

Use `Refs #123` only for related work that should not close the issue. It does not satisfy the required issue-driven PR check.

## Agent Rule

Agents should not start broad implementation from a vague request.

If a user asks for work without an issue:

- For small, obvious fixes, proceed and summarize.
- For non-trivial UI, DB, Supabase, Vercel, Auth, Storage, CMS, or agent work, first draft a structured issue.
- If the user explicitly says to implement immediately, keep the scope narrow and make the final summary state that no issue existed.

If an issue exists, the agent must stay inside it.

## Supabase Rule

Supabase changes are especially sensitive.

An issue is required before:

- production DB writes
- migrations
- RLS changes
- Storage bucket or policy changes
- Auth trigger/function changes
- service role maintenance scripts
- content graph structure changes

The issue must say whether the change is content-only, schema/policy, ops/config, or uncertain.

## Exceptions

PRs are expected to link an issue. For trivial work, create a lightweight issue rather than bypassing the flow.

Maintainers may use direct commits for urgent repository maintenance, but this should be rare and should not be used for feature, content, DB, UI, Auth, Supabase, Vercel, or ops work.
