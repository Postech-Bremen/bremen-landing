-- Move home hero text emphasis into section props so the CMS can control it
-- alongside the section copy.

update public.sections
set props = coalesce(props, '{}'::jsonb) || jsonb_build_object(
  'eyebrow_accent', 'Since 2001',
  'title_accent', 'en',
  'body_accent', '함께 연주하고 공연하는 사람들.',
  'feature_caption_accent', true
)
where key = 'home-hero';
