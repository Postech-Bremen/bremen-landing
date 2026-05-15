-- Bremen - restore guestbook author FK covering index.
--
-- Supabase advisor prefers foreign keys to have covering indexes. Keep this
-- even though the first UI path primarily reads by profile member.

create index if not exists member_guestbook_entries_author_idx
  on public.member_guestbook_entries(author_member_id);
