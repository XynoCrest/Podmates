-- Profile banner (a cover photo behind the avatar, LinkedIn-style). A storage path in the
-- owner's own folder of the `snaps` bucket, like avatar_url; null = the avatar colour.
alter table public.profiles add column banner_url text check (char_length(banner_url) <= 500);

-- Owners edit it like their other presentation columns (column grants add up).
grant update (banner_url) on public.profiles to authenticated;
