-- Safety and well-being:
--   rest days    up to 2 per pod per week (Mon–Sun, pod timezone), declared before the window closes.
--                A resting member keeps their streak and is left out of that day's tree count
--                (packages/tree-engine decides the numbers; settlement reads rest_days).
--   leave/remove members leave a pod; the owner can remove someone. An empty pod is deleted, and when
--                the owner goes, the longest-standing member becomes owner (one trigger covers leaving,
--                removal and account deletion).
--   blocks       hide that person's snaps, chat messages, posts and comments from the blocker, and stop
--                direct messages both ways.
--   reports      saved for the team to review; the item is hidden from the reporter only.

-- ─── Rest days ────────────────────────────────────────────────────────────────

create table public.rest_days (
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pod_date date not null,
  created_at timestamptz not null default now(),
  primary key (pod_id, user_id, pod_date)
);
create index rest_days_user_idx on public.rest_days (user_id, pod_id, pod_date);

alter table public.rest_days enable row level security;
create policy rest_days_read on public.rest_days for select to authenticated using (public.is_pod_member(pod_id));
-- Writes only through rest_today / cancel_rest.

create function public.rest_today(p_pod_id uuid) returns date
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  p public.pods;
  local_ts timestamp;
  today date;
  week_start date;
  used int;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.pod_members where pod_id = p_pod_id and user_id = me) then
    raise exception 'not a member of this pod' using errcode = '42501';
  end if;
  select * into p from public.pods where id = p_pod_id;
  local_ts := now() at time zone p.timezone;
  today := local_ts::date;
  if exists (select 1 from public.rest_days where pod_id = p_pod_id and user_id = me and pod_date = today) then
    return today;
  end if;
  if exists (select 1 from public.contributions where pod_id = p_pod_id and user_id = me and pod_date = today) then
    raise exception 'You already snapped today' using errcode = 'P0001';
  end if;
  if local_ts::time >= p.snap_time + make_interval(mins => p.window_minutes) then
    raise exception 'Today''s window has closed. Rest days are taken before it ends.' using errcode = 'P0001';
  end if;
  week_start := today - (extract(isodow from today)::int - 1);
  select count(*) into used from public.rest_days
  where pod_id = p_pod_id and user_id = me and pod_date between week_start and today;
  if used >= 2 then
    raise exception 'You''ve used both rest days this week' using errcode = 'P0001';
  end if;

  insert into public.rest_days (pod_id, user_id, pod_date) values (p_pod_id, me, today);
  insert into public.messages (pod_id, user_id, kind, body)
  select p_pod_id, null, 'system', display_name || ' is taking a rest day.' from public.profiles where id = me;
  return today;
end $$;

create function public.cancel_rest(p_pod_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  today date;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select (now() at time zone timezone)::date into today from public.pods where id = p_pod_id;
  delete from public.rest_days where pod_id = p_pod_id and user_id = me and pod_date = today;
end $$;

-- ─── Leaving and removing members ─────────────────────────────────────────────

-- After any membership row goes (leave, remove, account deletion): delete the pod if it is now
-- empty, otherwise hand ownership on if the owner left.
create function public.pod_members_after_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.pods where id = old.pod_id) then return old; end if; -- the pod itself is being deleted
  if not exists (select 1 from public.pod_members where pod_id = old.pod_id) then
    delete from public.pods where id = old.pod_id;
  elsif old.role = 'owner' and not exists (select 1 from public.pod_members where pod_id = old.pod_id and role = 'owner') then
    update public.pod_members set role = 'owner'
    where pod_id = old.pod_id
      and user_id = (select user_id from public.pod_members where pod_id = old.pod_id order by joined_at, user_id limit 1);
  end if;
  return old;
end $$;

create trigger pod_members_after_delete after delete on public.pod_members
for each row execute function public.pod_members_after_delete();

create function public.leave_pod(p_pod_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  who text;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select display_name into who from public.profiles where id = me;
  delete from public.pod_members where pod_id = p_pod_id and user_id = me;
  if not found then raise exception 'not a member of this pod' using errcode = '42501'; end if;
  if exists (select 1 from public.pods where id = p_pod_id) then
    insert into public.messages (pod_id, user_id, kind, body) values (p_pod_id, null, 'system', who || ' left the pod.');
  end if;
end $$;

create function public.remove_pod_member(p_pod_id uuid, p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  who text;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.pod_members where pod_id = p_pod_id and user_id = me and role = 'owner') then
    raise exception 'Only the pod''s creator can remove members' using errcode = '42501';
  end if;
  if p_user_id = me then raise exception 'Use leave_pod to leave' using errcode = 'P0001'; end if;
  select display_name into who from public.profiles where id = p_user_id;
  delete from public.pod_members where pod_id = p_pod_id and user_id = p_user_id;
  if not found then raise exception 'not a member of this pod' using errcode = 'P0002'; end if;
  insert into public.messages (pod_id, user_id, kind, body) values (p_pod_id, null, 'system', who || ' is no longer in the pod.');
end $$;

-- ─── Blocks ───────────────────────────────────────────────────────────────────

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;
create policy blocks_own on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Did I block this person? (Their content is hidden from me.)
create function public.i_blocked(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists (select 1 from public.blocks where blocker_id = auth.uid() and blocked_id = p_user_id);
$$;

-- Is there a block either way? (No direct messages.)
create function public.block_between(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = p_user_id) or (blocker_id = p_user_id and blocked_id = auth.uid())
  );
$$;

-- ─── Reports ──────────────────────────────────────────────────────────────────

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('snap', 'post', 'comment', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'fake', 'other')),
  details text check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;
create policy reports_insert_own on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_read_own on public.reports for select to authenticated using (reporter_id = auth.uid());
-- No update or delete: the team reviews them with the secret key.

create function public.i_reported(p_type text, p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_id is not null and exists (select 1 from public.reports where reporter_id = auth.uid() and target_type = p_type and target_id = p_id);
$$;

-- ─── Read policies: hide what I blocked or reported ───────────────────────────

drop policy snaps_read on public.snaps;
create policy snaps_read on public.snaps for select to authenticated
  using ((public.is_pod_member(pod_id) or on_profile) and not public.i_blocked(user_id) and not public.i_reported('snap', id));

drop policy messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated
  using (public.is_pod_member(pod_id) and not public.i_blocked(user_id) and not public.i_reported('snap', snap_id));

drop policy posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated
  using (not public.i_blocked(user_id) and not public.i_reported('post', id));

drop policy comments_read on public.comments;
create policy comments_read on public.comments for select to authenticated
  using (not public.i_blocked(user_id) and not public.i_reported('comment', id));

drop policy direct_messages_read on public.direct_messages;
create policy direct_messages_read on public.direct_messages for select to authenticated
  using ((auth.uid() = sender_id or auth.uid() = recipient_id)
    and not public.block_between(case when auth.uid() = sender_id then recipient_id else sender_id end));

drop policy direct_messages_insert on public.direct_messages;
create policy direct_messages_insert on public.direct_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.shares_pod_with(recipient_id) and not public.block_between(recipient_id));

-- ─── Pod summary: who is resting today ────────────────────────────────────────
-- Same columns as before, plus resting_today (resting and not snapped), me_resting_today and
-- my_rests_this_week (Mon–Sun in the pod's timezone).

create or replace view public.pod_overview with (security_invoker = true) as
select
  p.id,
  p.name,
  p.goal,
  p.habit_id,
  p.snap_time,
  p.window_minutes,
  p.timezone,
  p.invite_code,
  t.hp,
  t.max_hp,
  t.growth,
  t.status as tree_status,
  (select count(*) from public.pod_members m where m.pod_id = p.id)::integer as member_count,
  (select count(*) from public.contributions c
    where c.pod_id = p.id and c.pod_date = (now() at time zone p.timezone)::date)::integer as contributed_today,
  exists (select 1 from public.contributions c
    where c.pod_id = p.id and c.user_id = auth.uid() and c.pod_date = (now() at time zone p.timezone)::date) as me_contributed_today,
  (select m.streak from public.pod_members m where m.pod_id = p.id and m.user_id = auth.uid()) as my_streak,
  lm.kind as last_message_kind,
  lm.body as last_message_body,
  lm.author_name as last_message_author,
  coalesce(lm.created_at, p.created_at) as last_activity_at,
  (select count(*) from public.messages msg
    join public.pod_members me on me.pod_id = msg.pod_id and me.user_id = auth.uid()
    where msg.pod_id = p.id and msg.created_at > me.last_read_at and msg.user_id is distinct from auth.uid())::integer as unread_count,
  (select count(*) from public.rest_days r
    join public.pod_members m on m.pod_id = r.pod_id and m.user_id = r.user_id
    where r.pod_id = p.id and r.pod_date = (now() at time zone p.timezone)::date
      and not exists (select 1 from public.contributions c where c.pod_id = r.pod_id and c.user_id = r.user_id and c.pod_date = r.pod_date))::integer as resting_today,
  exists (select 1 from public.rest_days r
    where r.pod_id = p.id and r.user_id = auth.uid() and r.pod_date = (now() at time zone p.timezone)::date) as me_resting_today,
  (select count(*) from public.rest_days r
    where r.pod_id = p.id and r.user_id = auth.uid()
      and r.pod_date between (now() at time zone p.timezone)::date - (extract(isodow from (now() at time zone p.timezone)::date)::int - 1)
                         and (now() at time zone p.timezone)::date)::integer as my_rests_this_week
from public.pods p
join public.trees t on t.pod_id = p.id
left join lateral (
  select msg.kind, msg.body, msg.created_at, pr.display_name as author_name
  from public.messages msg
  left join public.profiles pr on pr.id = msg.user_id
  where msg.pod_id = p.id
  order by msg.created_at desc
  limit 1
) lm on true;

grant execute on function public.rest_today(uuid), public.cancel_rest(uuid), public.leave_pod(uuid), public.remove_pod_member(uuid, uuid) to authenticated;
