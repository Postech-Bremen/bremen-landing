-- Keep the hero title as a single wordmark. The accent belongs on meaningful
-- supporting copy, not an arbitrary substring of "Bremen".

update public.sections
set props = coalesce(props, '{}'::jsonb) - 'title_accent'
where key = 'home-hero';
