-- Kind-accountability model (docs/PRODUCT_SPEC.md). Replaces small friend pods with
-- one open pod per habit, personal photo-verified streaks per habit, declared rest days,
-- one tree per pod (health = share of members on a streak; size = verified snaps),
-- follows, cheers and fake-snap flags. Energy and stars are gone.
--
-- As before, streaks and tree health are COMPUTED ONLY in packages/tree-engine and
-- written by apps/api through the service-only RPCs at the bottom. SQL stores raw
-- activity (habit_days) and enforces who may do what.

-- ─── Tear down the friend-pod model ───────────────────────────────────────────

drop view if exists public.pod_overview;
drop function if exists public.create_pod(text, text, text, time, text, integer);
drop function if exists public.join_pod(text);
drop function if exists public.refresh_profile_stats(uuid[]);
drop function if exists public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz);

drop table if exists public.messages, public.contributions, public.pod_days, public.snap_views,
  public.snaps, public.trees, public.pod_members, public.community_members cascade;
drop function if exists public.snaps_before_insert() cascade;
drop function if exists public.snaps_after_insert() cascade;
drop function if exists public.community_members_count() cascade;

-- Posts move from communities to pods. Old posts belong to communities that no longer exist.
delete from public.posts;
alter table public.posts drop column community_id;
drop table if exists public.communities cascade;

-- Direct messages: the old rule (shares a pod) is replaced by mutual follows below.
drop policy if exists direct_messages_insert on public.direct_messages;
drop function if exists public.shares_pod_with(uuid);
drop table if exists public.pods cascade;
drop function if exists public.is_pod_member(uuid);

-- ─── Profiles ─────────────────────────────────────────────────────────────────

alter table public.profiles
  drop column energy,
  drop column stars,
  drop column streak,
  -- A user's day ends at midnight in their own timezone (the app keeps this in sync with the device).
  add column timezone text not null default 'America/Edmonton',
  add column is_private boolean not null default false,
  -- Podmates team members who review flagged snaps. Never client-writable.
  add column is_admin boolean not null default false;

revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, bio, avatar_color, avatar_url, timezone, is_private) on public.profiles to authenticated;

-- ─── Pods: one open community per habit ──────────────────────────────────────

create table public.pods (
  id uuid primary key default gen_random_uuid(),
  habit_id text not null unique references public.habits (id),
  name text not null check (char_length(name) between 1 and 40),
  description text not null default '' check (char_length(description) <= 300),
  color text not null default 'leaf' check (color in ('leaf', 'sky', 'star', 'flame', 'rose', 'teal')),
  created_at timestamptz not null default now()
);

alter table public.posts add column pod_id uuid not null references public.pods (id) on delete cascade;
create index posts_pod_created_idx on public.posts (pod_id, created_at desc);

-- Tracking a habit = being in its pod. Streak numbers are settlement-owned.
create table public.user_habits (
  user_id uuid not null references public.profiles (id) on delete cascade,
  pod_id uuid not null references public.pods (id) on delete cascade,
  reminder_time time,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  -- Streak is settled through this user-local date. Null = never settled (or invalidated by a review).
  settled_through date,
  joined_at timestamptz not null default now(),
  primary key (user_id, pod_id)
);
create index user_habits_pod_idx on public.user_habits (pod_id);

-- What counted each day for each user and habit. Raw activity: written by triggers and declare_rest only.
create table public.habit_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  pod_id uuid not null references public.pods (id) on delete cascade,
  day date not null,
  status text not null check (status in ('snapped', 'rest')),
  snap_id uuid,
  created_at timestamptz not null default now(),
  primary key (user_id, pod_id, day)
);

-- One tree per pod. health/active/counted are written by apps/api (tree-engine); total_snaps by trigger.
create table public.trees (
  pod_id uuid primary key references public.pods (id) on delete cascade,
  health real not null default 1 check (health between 0 and 1),
  active integer not null default 0,
  counted integer not null default 0,
  total_snaps integer not null default 0 check (total_snaps >= 0),
  updated_at timestamptz not null default now()
);

-- Daily history of each tree's health (UTC date; the latest value of that day wins).
create table public.tree_days (
  pod_id uuid not null references public.pods (id) on delete cascade,
  day date not null,
  health real not null check (health between 0 and 1),
  active integer not null,
  counted integer not null,
  primary key (pod_id, day)
);

-- ─── Snaps, views, cheers, flags ──────────────────────────────────────────────

create table public.snaps (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  habit_id text not null references public.habits (id),
  -- Storage path "<user_id>/<uuid>.jpg". Clients may only point at their own folder (trigger);
  -- seed data uses absolute https URLs.
  image text not null check (char_length(image) <= 500),
  caption text not null default '' check (char_length(caption) <= 200),
  taken_at timestamptz not null default now(),
  -- The uploader's local date, stamped by the server.
  day date not null default current_date,
  on_profile boolean not null default false,
  hidden boolean not null default false,
  review_status text not null default 'none' check (review_status in ('none', 'pending', 'approved', 'rejected')),
  flag_count integer not null default 0
);
create index snaps_pod_taken_idx on public.snaps (pod_id, taken_at desc);
create index snaps_user_taken_idx on public.snaps (user_id, taken_at desc);

create table public.snap_views (
  snap_id uuid not null references public.snaps (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (snap_id, user_id)
);

create table public.cheers (
  snap_id uuid not null references public.snaps (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (snap_id, user_id)
);

create table public.snap_flags (
  snap_id uuid not null references public.snaps (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (snap_id, user_id)
);

-- ─── Follows ──────────────────────────────────────────────────────────────────

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

-- ─── Helpers (security definer so policies don't recurse) ────────────────────

create function public.is_pod_member(p_pod_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_habits where pod_id = p_pod_id and user_id = auth.uid());
$$;

create function public.is_mutual_follow(p_other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.follows where follower_id = auth.uid() and followee_id = p_other and status = 'accepted')
     and exists (select 1 from public.follows where follower_id = p_other and followee_id = auth.uid() and status = 'accepted');
$$;

-- Public profiles are visible to everyone; private ones to the owner and accepted followers.
create function public.can_view_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid()
      or not (select is_private from public.profiles where id = p_user)
      or exists (select 1 from public.follows where follower_id = auth.uid() and followee_id = p_user and status = 'accepted');
$$;

-- A user's current local date.
create function public.user_today(p_user uuid) returns date
language sql stable security definer set search_path = '' as $$
  select (now() at time zone (select timezone from public.profiles where id = p_user))::date;
$$;

-- ─── Triggers ─────────────────────────────────────────────────────────────────

-- Server stamps time, day and habit; clients can only attach images from their own folder.
create function public.snaps_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'authenticated' and new.image not like new.user_id::text || '/%' then
    raise exception 'image must be in your own upload folder' using errcode = '42501';
  end if;
  new.taken_at := now();
  new.day := public.user_today(new.user_id);
  new.habit_id := (select habit_id from public.pods where id = new.pod_id);
  new.hidden := false;
  new.review_status := 'none';
  new.flag_count := 0;
  return new;
end $$;
create trigger snaps_before_insert before insert on public.snaps
for each row execute function public.snaps_before_insert();

-- The first snap of the day counts (a declared rest day is upgraded to a snap).
create function public.snaps_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.habit_days (user_id, pod_id, day, status, snap_id)
  values (new.user_id, new.pod_id, new.day, 'snapped', new.id)
  on conflict (user_id, pod_id, day) do update set status = 'snapped', snap_id = excluded.snap_id
  where public.habit_days.status = 'rest';
  return new;
end $$;
create trigger snaps_after_insert after insert on public.snaps
for each row execute function public.snaps_after_insert();

-- trees.total_snaps = the pod's verified snap-days (one per user per day).
create function public.habit_days_count() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  delta int := 0;
begin
  if tg_op in ('INSERT', 'UPDATE') and new.status = 'snapped' then delta := delta + 1; end if;
  if tg_op in ('DELETE', 'UPDATE') and old.status = 'snapped' then delta := delta - 1; end if;
  if delta <> 0 then
    update public.trees set total_snaps = greatest(0, total_snaps + delta) where pod_id = coalesce(new.pod_id, old.pod_id);
  end if;
  return null;
end $$;
create trigger habit_days_count after insert or update or delete on public.habit_days
for each row execute function public.habit_days_count();

-- Every pod gets its tree.
create function public.pods_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.trees (pod_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger pods_after_insert after insert on public.pods
for each row execute function public.pods_after_insert();

-- Flags: at 5 a snap is hidden pending team review. Mirrors RULES.flagsToHide in packages/tree-engine.
create function public.snap_flags_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.snaps set
    flag_count = flag_count + 1,
    hidden = hidden or flag_count + 1 >= 5,
    review_status = case when flag_count + 1 >= 5 and review_status = 'none' then 'pending' else review_status end
  where id = new.snap_id;
  return null;
end $$;
create trigger snap_flags_after_insert after insert on public.snap_flags
for each row execute function public.snap_flags_after_insert();

-- ─── RPCs the app calls ───────────────────────────────────────────────────────

-- Add a habit = join its pod. Returns the pod id.
create function public.add_habit(p_habit_id text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  target uuid;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select id into target from public.pods where habit_id = p_habit_id;
  if target is null then raise exception 'no pod for that habit' using errcode = 'P0002'; end if;
  -- Nothing to settle before today.
  insert into public.user_habits (user_id, pod_id, settled_through)
  values (me, target, public.user_today(me) - 1)
  on conflict do nothing;
  return target;
end $$;

-- Remove a habit = leave its pod. History stays (it is yours), the streak goes.
create function public.remove_habit(p_habit_id text) returns void
language sql security definer set search_path = '' as $$
  delete from public.user_habits uh using public.pods p
  where uh.pod_id = p.id and p.habit_id = p_habit_id and uh.user_id = auth.uid();
$$;

-- Declare today a rest day for one habit. Max 2 per Monday–Sunday week in the user's timezone
-- (mirrors RULES.restDaysPerWeek). Returns rest days left this week.
create function public.declare_rest(p_pod_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  today date;
  week_start date;
  used int;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.user_habits where user_id = me and pod_id = p_pod_id) then
    raise exception 'you are not tracking that habit' using errcode = '42501';
  end if;
  today := public.user_today(me);
  week_start := date_trunc('week', today)::date;
  if exists (select 1 from public.habit_days where user_id = me and pod_id = p_pod_id and day = today) then
    raise exception 'today already counts' using errcode = '23505';
  end if;
  select count(*) into used from public.habit_days
  where user_id = me and pod_id = p_pod_id and status = 'rest' and day between week_start and today;
  if used >= 2 then raise exception 'no rest days left this week' using errcode = 'P0001'; end if;
  insert into public.habit_days (user_id, pod_id, day, status) values (me, p_pod_id, today, 'rest');
  return 2 - used - 1;
end $$;

-- Follow someone: accepted at once for public profiles, pending for private ones.
create function public.request_follow(p_user uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  result text;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  insert into public.follows (follower_id, followee_id, status)
  values (me, p_user, case when (select is_private from public.profiles where id = p_user) then 'pending' else 'accepted' end)
  on conflict (follower_id, followee_id) do update set status = public.follows.status
  returning status into result;
  return result;
end $$;

-- Private accounts approve or decline follow requests.
create function public.answer_follow(p_follower uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_accept then
    update public.follows set status = 'accepted' where follower_id = p_follower and followee_id = auth.uid() and status = 'pending';
  else
    delete from public.follows where follower_id = p_follower and followee_id = auth.uid() and status = 'pending';
  end if;
end $$;

-- ─── Service-only writers (apps/api, numbers from packages/tree-engine) ──────

-- p_rows: [{user_id, pod_id, current_streak, best_streak, settled_through}]
create function public.apply_streaks(p_rows jsonb) returns integer
language sql security definer set search_path = '' as $$
  with updated as (
    update public.user_habits uh set
      current_streak = (r ->> 'current_streak')::int,
      best_streak = (r ->> 'best_streak')::int,
      settled_through = (r ->> 'settled_through')::date
    from jsonb_array_elements(p_rows) r
    where uh.user_id = (r ->> 'user_id')::uuid and uh.pod_id = (r ->> 'pod_id')::uuid
    returning 1
  )
  select count(*)::int from updated;
$$;

-- p_rows: [{pod_id, health, active, counted}]; p_day: today's UTC date for the history row.
create function public.apply_tree_health(p_rows jsonb, p_day date) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  update public.trees t set
    health = (r ->> 'health')::real, active = (r ->> 'active')::int, counted = (r ->> 'counted')::int, updated_at = now()
  from jsonb_array_elements(p_rows) r
  where t.pod_id = (r ->> 'pod_id')::uuid;
  get diagnostics n = row_count;
  insert into public.tree_days (pod_id, day, health, active, counted)
  select (r ->> 'pod_id')::uuid, p_day, (r ->> 'health')::real, (r ->> 'active')::int, (r ->> 'counted')::int
  from jsonb_array_elements(p_rows) r
  on conflict (pod_id, day) do update set health = excluded.health, active = excluded.active, counted = excluded.counted;
  return n;
end $$;

-- Team review of a flagged snap. Rejecting removes that day's credit; the streak is
-- recalculated by the next settlement (settled_through is invalidated).
create function public.review_snap(p_snap_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.snaps;
begin
  select * into s from public.snaps where id = p_snap_id;
  if s.id is null then raise exception 'no such snap' using errcode = 'P0002'; end if;
  if p_approve then
    update public.snaps set hidden = false, review_status = 'approved' where id = p_snap_id;
  else
    update public.snaps set hidden = true, review_status = 'rejected' where id = p_snap_id;
    delete from public.habit_days where snap_id = p_snap_id and status = 'snapped';
    update public.user_habits set settled_through = null where user_id = s.user_id and pod_id = s.pod_id;
  end if;
end $$;

revoke execute on function public.apply_streaks(jsonb) from public, anon, authenticated;
revoke execute on function public.apply_tree_health(jsonb, date) from public, anon, authenticated;
revoke execute on function public.review_snap(uuid, boolean) from public, anon, authenticated;
grant execute on function public.apply_streaks(jsonb) to service_role;
grant execute on function public.apply_tree_health(jsonb, date) to service_role;
grant execute on function public.review_snap(uuid, boolean) to service_role;

-- ─── Row-level security ───────────────────────────────────────────────────────

alter table public.pods enable row level security;
alter table public.user_habits enable row level security;
alter table public.habit_days enable row level security;
alter table public.trees enable row level security;
alter table public.tree_days enable row level security;
alter table public.snaps enable row level security;
alter table public.snap_views enable row level security;
alter table public.cheers enable row level security;
alter table public.snap_flags enable row level security;
alter table public.follows enable row level security;

-- Pods and trees are public to signed-in users (Explore lists them).
create policy pods_read on public.pods for select to authenticated using (true);
create policy trees_read on public.trees for select to authenticated using (true);
create policy tree_days_read on public.tree_days for select to authenticated using (true);

-- Habits you track: yours, plus podmates' streaks in pods you share. Joining/leaving via RPCs;
-- the only client-editable column is your reminder time.
create policy user_habits_read on public.user_habits for select to authenticated
  using (user_id = auth.uid() or public.is_pod_member(pod_id));
create policy user_habits_update_own on public.user_habits for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, update, delete on public.user_habits from anon, authenticated;
grant update (reminder_time) on public.user_habits to authenticated;

-- Your own day log only. Written by triggers and declare_rest.
create policy habit_days_read_own on public.habit_days for select to authenticated using (user_id = auth.uid());

-- Snaps: everyone in the pod sees them unless hidden by flags (owners always see theirs);
-- profile-grid snaps are visible to anyone allowed to see that profile.
create policy snaps_read on public.snaps for select to authenticated
  using (
    user_id = auth.uid()
    or (not hidden and public.is_pod_member(pod_id))
    or (not hidden and on_profile and public.can_view_profile(user_id))
  );
create policy snaps_insert on public.snaps for insert to authenticated
  with check (user_id = auth.uid() and public.is_pod_member(pod_id));
create policy snaps_update_own on public.snaps for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.snaps from anon, authenticated;
grant update (on_profile) on public.snaps to authenticated;

create policy snap_views_own on public.snap_views for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Cheers: visible with the snap; one per person; only in your pods.
create policy cheers_read on public.cheers for select to authenticated
  using (exists (select 1 from public.snaps s where s.id = snap_id));
create policy cheers_insert on public.cheers for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.snaps s where s.id = snap_id and public.is_pod_member(s.pod_id)));
create policy cheers_delete_own on public.cheers for delete to authenticated using (user_id = auth.uid());

-- Flags: anonymous (no read policy), one per person, not on your own snap, only in your pods.
create policy snap_flags_insert on public.snap_flags for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.snaps s where s.id = snap_id and s.user_id <> auth.uid() and public.is_pod_member(s.pod_id))
  );

-- Follows: both people see the row; you follow via request_follow; either side can end it.
create policy follows_read on public.follows for select to authenticated
  using (auth.uid() in (follower_id, followee_id));
create policy follows_delete on public.follows for delete to authenticated
  using (auth.uid() in (follower_id, followee_id));

-- Posts and comments live in pods: write only where you are a member.
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
  with check (user_id = auth.uid() and public.is_pod_member(pod_id));
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id and public.is_pod_member(p.pod_id)));

-- Direct messages: only between people who follow each other.
create policy direct_messages_insert on public.direct_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_mutual_follow(recipient_id));

revoke all on all tables in schema public from anon;

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.snaps, public.trees, public.cheers, public.follows;
