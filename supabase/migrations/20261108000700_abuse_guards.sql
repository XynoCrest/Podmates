-- Abuse guards (from the code review):
--   1. Clients can't forge server-owned columns on insert (timestamps, read receipts, post counters).
--   2. Someone removed from a pod can't rejoin with the same invite code.
--   3. A vote can only change its value, and counters stay right if it moves.
--   4. Pods cap at 6 members.
--   5. Timezones must be region names the app and the server can both use; snap times are whole minutes.
--   6. Membership changes lock the pod row, so two people leaving at once can't leave it empty or ownerless.

-- ─── 1. Server-owned columns ──────────────────────────────────────────────────
-- Only direct client inserts (role "authenticated") are corrected. Triggers and RPCs run as the
-- function owner, and the API as service_role, so their own timestamps (e.g. a snap message dated
-- at the snap, a settlement summary at midnight) are kept.

create function public.client_insert_defaults() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  new.created_at := now();
  if tg_table_name = 'direct_messages' then
    new.read_at := null;
  elsif tg_table_name = 'posts' then
    new.score := 0;
    new.comment_count := 0;
  end if;
  return new;
end $$;

create trigger messages_client_defaults before insert on public.messages
for each row execute function public.client_insert_defaults();
create trigger direct_messages_client_defaults before insert on public.direct_messages
for each row execute function public.client_insert_defaults();
create trigger posts_client_defaults before insert on public.posts
for each row execute function public.client_insert_defaults();
create trigger comments_client_defaults before insert on public.comments
for each row execute function public.client_insert_defaults();

-- ─── 2. Removed members stay out ──────────────────────────────────────────────

create table public.pod_removals (
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  removed_by uuid references public.profiles (id) on delete set null,
  removed_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);
alter table public.pod_removals enable row level security;
-- No client policies: written by remove_pod_member, read by join_pod.

-- ─── 3. Votes ─────────────────────────────────────────────────────────────────

revoke update on public.post_votes from authenticated;
grant update (value) on public.post_votes to authenticated;

create or replace function public.post_votes_score() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Take the old vote off the post it was on, and add the new one to the post it is on now
  -- (the same post unless the vote moved).
  if tg_op in ('DELETE', 'UPDATE') then
    update public.posts set score = score - old.value where id = old.post_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.posts set score = score + new.value where id = new.post_id;
  end if;
  return null;
end $$;

-- ─── 4–6. Pods: create, join, leave, remove ───────────────────────────────────

create or replace function public.create_pod(
  p_name text,
  p_habit_id text,
  p_goal text,
  p_snap_time time,
  p_timezone text,
  p_window_minutes integer default 20
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  new_id uuid;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  -- Region names only (America/Edmonton, Europe/London) or UTC: aliases such as "Factory",
  -- "posix/…" or "Etc/…" exist in Postgres but not in every JavaScript runtime.
  if not (p_timezone = 'UTC' or (p_timezone ~ '^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)/[A-Za-z0-9_+-]+(/[A-Za-z0-9_+-]+)?$'
      and exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone))) then
    raise exception 'unknown timezone %', p_timezone using errcode = '22023';
  end if;
  insert into public.pods (name, habit_id, goal, snap_time, timezone, window_minutes, created_by)
  values (p_name, p_habit_id, coalesce(p_goal, ''), date_trunc('minute', p_snap_time)::time, p_timezone, p_window_minutes, me)
  returning id into new_id;
  insert into public.pod_members (pod_id, user_id, role) values (new_id, me, 'owner');
  -- First settled day is tomorrow: today is already partly over.
  insert into public.trees (pod_id, last_settled_date) values (new_id, (now() at time zone p_timezone)::date);
  insert into public.messages (pod_id, user_id, kind, body) values (new_id, null, 'system', 'A seed was planted. Snap every day to help it grow.');
  return new_id;
end $$;

create or replace function public.join_pod(p_invite_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  -- Lock the pod so the size check and the insert can't race another join or a leave.
  select id into target from public.pods where invite_code = upper(trim(p_invite_code)) for update;
  if target is null then raise exception 'no pod with that code' using errcode = 'P0002'; end if;
  if exists (select 1 from public.pod_members where pod_id = target and user_id = me) then return target; end if;
  if exists (select 1 from public.pod_removals where pod_id = target and user_id = me) then
    raise exception 'You were removed from this pod' using errcode = '42501';
  end if;
  if (select count(*) from public.pod_members where pod_id = target) >= 6 then
    raise exception 'This pod is full (6 members)' using errcode = 'P0001';
  end if;
  insert into public.pod_members (pod_id, user_id) values (target, me);
  insert into public.messages (pod_id, user_id, kind, body)
  select target, null, 'system', display_name || ' joined the pod.' from public.profiles where id = me;
  return target;
end $$;

create or replace function public.pod_members_after_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Lock the pod first: two members leaving at once then run one after the other, so the last
  -- one out always sees an empty pod, and ownership is handed to someone still there.
  perform 1 from public.pods where id = old.pod_id for update;
  if not found then return old; end if; -- the pod itself is being deleted
  if not exists (select 1 from public.pod_members where pod_id = old.pod_id) then
    delete from public.pods where id = old.pod_id;
  elsif not exists (select 1 from public.pod_members where pod_id = old.pod_id and role = 'owner') then
    update public.pod_members set role = 'owner'
    where pod_id = old.pod_id
      and user_id = (select user_id from public.pod_members where pod_id = old.pod_id order by joined_at, user_id limit 1);
  end if;
  return old;
end $$;

create or replace function public.remove_pod_member(p_pod_id uuid, p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  who text;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  perform 1 from public.pods where id = p_pod_id for update;
  if not exists (select 1 from public.pod_members where pod_id = p_pod_id and user_id = me and role = 'owner') then
    raise exception 'Only the pod''s creator can remove members' using errcode = '42501';
  end if;
  if p_user_id = me then raise exception 'Use leave_pod to leave' using errcode = 'P0001'; end if;
  select display_name into who from public.profiles where id = p_user_id;
  delete from public.pod_members where pod_id = p_pod_id and user_id = p_user_id;
  if not found then raise exception 'not a member of this pod' using errcode = 'P0002'; end if;
  insert into public.pod_removals (pod_id, user_id, removed_by) values (p_pod_id, p_user_id, me)
  on conflict (pod_id, user_id) do update set removed_by = excluded.removed_by, removed_at = now();
  insert into public.messages (pod_id, user_id, kind, body) values (p_pod_id, null, 'system', who || ' is no longer in the pod.');
end $$;

-- Hot paths flagged in review: foreign keys used by cascades and snap lookups.
create index if not exists messages_snap_idx on public.messages (snap_id) where snap_id is not null;
create index if not exists contributions_snap_idx on public.contributions (snap_id) where snap_id is not null;
