## Summary

Describe the user-facing change.

## Linked Issue

Closes #<issue-number>

Branch format:

- [ ] Branch follows `<type>/<issue-number>-short-slug` for internal branches.

## Change Type

- [ ] Code/UI
- [ ] Content graph data
- [ ] Database schema/policy/storage migration
- [ ] Auth/member flow
- [ ] Ops/deployment/config
- [ ] Documentation only

## Supabase Impact

- [ ] No Supabase change
- [ ] Content rows only
- [ ] Migration added
- [ ] Types regenerated
- [ ] Advisors checked

Migration files:

- none

## Guardrails

- [ ] No secrets committed
- [ ] Work stayed inside the linked issue scope
- [ ] No service role key in client code
- [ ] RLS remains enabled
- [ ] No destructive SQL
- [ ] Required sections/entities still load from Supabase, not hardcoded fallback

## Validation

- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm run lint`
- [ ] `git diff --check`
- [ ] `pnpm run build`

Notes on skipped checks:

## Screenshots or Evidence

Add screenshots, logs, or query results when relevant.
