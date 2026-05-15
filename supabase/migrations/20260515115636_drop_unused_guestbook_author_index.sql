-- Bremen - remove unused guestbook author-only index.
--
-- Guestbook profile reads use the profile/date index. Deletes target the row
-- primary key and let RLS check authorship, so the author-only index adds
-- advisor noise without serving the current UI path.

drop index if exists public.member_guestbook_entries_author_idx;
