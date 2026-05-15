-- Bremen - remove eager UGC visibility indexes flagged unused by advisors.
--
-- The visibility column is still part of the access model. Add targeted
-- indexes later once member UGC query paths exist and real plans show need.

drop index if exists public.entities_visibility_published_sort_idx;
drop index if exists public.entities_owner_visibility_idx;
