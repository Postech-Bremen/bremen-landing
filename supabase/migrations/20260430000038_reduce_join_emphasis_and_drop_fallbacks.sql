-- Join CTA should keep emphasis restrained. The renderer now treats the CTA
-- link as the accent and leaves the heading/body in the normal text hierarchy.

update public.sections
set props = coalesce(props, '{}'::jsonb) - 'body_accent'
where key = 'home-join';
