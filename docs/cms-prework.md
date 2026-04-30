# CMS Prework

This is the working plan for turning the current content graph into an actual CMS.

GitHub issue creation is currently blocked by local `gh` auth, so this document is the issue draft for the first implementation slice.

## Goal

Prepare the codebase for a CMS without giving the CMS broad write access or hardcoding new page content.

## First Slice

Scope:

- Define a code-level schema registry for editable `pages`, `sections`, `entities`, and relations.
- Reuse `/ponix` as the real CMS route.
- Keep `/admin` as a decoy warning route.
- Keep CMS access limited to authenticated `members.role = 'admin'`.
- Show registry status in `/ponix` so future editor screens can build from the same contract.

Non-goals:

- No production DB writes.
- No editable forms yet.
- No service role usage.
- No RLS changes.
- No public CMS route.

## Why Schema Registry Comes First

The database already has JSONB fields:

- `sections.props`
- `entities.data`
- `section_entities.props`
- `entity_relations.props`

Those fields are flexible but not enough for a safe CMS. A CMS needs to know which JSON keys are editable, which fields are required, which options are allowed, and which fields are read-only.

The first registry lives in code at `lib/cms/schema-registry.ts`. It can later move to database-backed metadata if needed.

## Next Issues

1. Add CMS list views for pages, sections, and entities.
2. Add read-only detail views that render registry fields.
3. Add section copy editor with validation.
4. Add entity editor with thumbnail upload.
5. Add section entity ordering editor.
6. Add preview mode for unpublished content.
7. Add audit/revision strategy before broad write access.
