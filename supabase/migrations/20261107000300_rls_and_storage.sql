-- Row-level security. The app talks to Postgres directly with the user's JWT, so
-- these policies ARE the authorization layer. Tables with no write policy can
-- only be written by apps/api (secret key) or security-definer functions.

-- Membership helpers. security definer so policies on pod_members don't recurse.
create function public.is_pod_member(p_pod_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pod_members where pod_id = p_pod_id and user_id = auth.uid());
$$;

create function public.shares_pod_with(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pod_members a
    join public.pod_members b on b.pod_id = a.pod_id
    where a.user_id = auth.uid() and b.user_id = p_user_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.pods enable row level security;
alter table public.pod_members enable row level security;
alter table public.trees enable row level security;
alter table public.pod_days enable row level security;
alter table public.snaps enable row level security;
alter table public.contributions enable row level security;
alter table public.messages enable row level security;
alter table public.snap_views enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_votes enable row level security;
alter table public.comments enable row level security;

-- Profiles: public to signed-in users; you edit your own presentation fields only
-- (energy/stars/streak are settlement-owned, enforced by column grants).
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_color, avatar_url) on public.profiles to authenticated;

create policy habits_read on public.habits for select to authenticated using (true);

-- Pods and everything inside them: members only. Creating/joining goes through RPCs.
create policy pods_read on public.pods for select to authenticated using (public.is_pod_member(id));
create policy pod_members_read on public.pod_members for select to authenticated using (public.is_pod_member(pod_id));
create policy trees_read on public.trees for select to authenticated using (public.is_pod_member(pod_id));
create policy pod_days_read on public.pod_days for select to authenticated using (public.is_pod_member(pod_id));
create policy contributions_read on public.contributions for select to authenticated using (public.is_pod_member(pod_id));

-- Snaps: pod members see them; anyone signed in sees the ones the owner put on their profile.
create policy snaps_read on public.snaps for select to authenticated
  using (public.is_pod_member(pod_id) or on_profile);
create policy snaps_insert on public.snaps for insert to authenticated
  with check (user_id = auth.uid() and public.is_pod_member(pod_id));
create policy snaps_update_own on public.snaps for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.snaps from anon, authenticated;
grant update (on_profile) on public.snaps to authenticated;

-- Chat: members read; members post plain text as themselves. Snap/system rows come from triggers.
create policy messages_read on public.messages for select to authenticated using (public.is_pod_member(pod_id));
create policy messages_insert on public.messages for insert to authenticated
  with check (user_id = auth.uid() and kind = 'text' and snap_id is null and public.is_pod_member(pod_id));

create policy snap_views_own on public.snap_views for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Explore is public to signed-in users; you write only as yourself.
create policy communities_read on public.communities for select to authenticated using (true);
create policy community_members_read on public.community_members for select to authenticated using (true);
create policy community_members_join on public.community_members for insert to authenticated with check (user_id = auth.uid());
create policy community_members_leave on public.community_members for delete to authenticated using (user_id = auth.uid());
create policy posts_read on public.posts for select to authenticated using (true);
create policy posts_insert on public.posts for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.community_members cm where cm.community_id = posts.community_id and cm.user_id = auth.uid()
  ));
revoke update on public.posts from anon, authenticated;
create policy post_votes_own on public.post_votes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_insert on public.comments for insert to authenticated with check (user_id = auth.uid());

-- Nothing is exposed to anonymous (signed-out) clients.
revoke all on all tables in schema public from anon;

-- ─── Storage ──────────────────────────────────────────────────────────────────
-- Public-read bucket with unguessable paths "<user_id>/<uuid>.jpg". See docs/PLACEHOLDERS.md:
-- production should switch to a private bucket + signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('snaps', 'snaps', true, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy snaps_upload_own_folder on storage.objects for insert to authenticated
  with check (bucket_id = 'snaps' and (storage.foldername(name))[1] = auth.uid()::text);
create policy snaps_delete_own_folder on storage.objects for delete to authenticated
  using (bucket_id = 'snaps' and (storage.foldername(name))[1] = auth.uid()::text);
