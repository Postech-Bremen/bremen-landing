-- Bremen — keep image object URLs public, but prevent public bucket listing.
--
-- Public buckets can serve known object URLs without a broad SELECT policy on
-- storage.objects. Removing this policy avoids exposing the object list through
-- Storage APIs while preserving existing thumbnail_url values.

drop policy if exists "storage_public_read_images" on storage.objects;
