-- Podmates core schema: people, habits, pods (habit groups), trees, snaps, chat.
-- Tree numbers (hp, max_hp, growth, energy, stars, streaks) are WRITTEN ONLY by
-- apps/api settlement using packages/tree-engine. Nothing in SQL computes them.

create extension if not exists pgcrypto with schema extensions;

-- ─── People ───────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_color text not null default 'leaf' check (avatar_color in ('leaf', 'sky', 'star', 'flame', 'rose', 'teal')),
  avatar_url text,
  -- Aggregates over pod_members, refreshed by settlement (refresh_profile_stats).
  energy integer not null default 0,
  stars integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default now()
);

-- Every auth user gets a profile. Username comes from sign-up metadata, else the email local part.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  base text := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'user'), '[^a-z0-9_.]', '', 'g'));
  candidate text;
begin
  if char_length(base) < 3 then base := base || 'pod'; end if;
  candidate := left(base, 20);
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := left(base, 18) || floor(random() * 1000)::int;
  end loop;
  insert into public.profiles (id, username, display_name, avatar_color)
  values (
    new.id,
    candidate,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), candidate),
    (array['leaf', 'sky', 'star', 'flame', 'rose', 'teal'])[1 + floor(random() * 6)::int]
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ─── Habits & pods ────────────────────────────────────────────────────────────

-- Catalogue of habit kinds. Pods pick one; the chat screen's top tabs are habits.
create table public.habits (
  id text primary key check (id ~ '^[a-z_]+$'),
  name text not null,
  emoji text not null,
  sf_symbol text not null,
  sort integer not null default 0
);

create table public.pods (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  habit_id text not null references public.habits (id),
  goal text not null default '' check (char_length(goal) <= 120),
  -- Daily snap window, in the pod's timezone. Never crosses midnight.
  snap_time time not null,
  window_minutes integer not null default 20 check (window_minutes between 5 and 60),
  timezone text not null default 'America/Toronto',
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint window_within_day check (snap_time + make_interval(mins => window_minutes) > snap_time)
);

create table public.pod_members (
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  -- Per-pod game stats, written by settlement.
  energy integer not null default 0,
  stars integer not null default 0,
  streak integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (pod_id, user_id)
);
create index pod_members_user_idx on public.pod_members (user_id);

-- One tree per pod.
create table public.trees (
  pod_id uuid primary key references public.pods (id) on delete cascade,
  hp integer not null default 100 check (hp >= 0),
  max_hp integer not null default 100 check (max_hp > 0),
  growth integer not null default 0 check (growth >= 0),
  status text not null default 'alive' check (status in ('alive', 'dead')),
  -- Last pod-day settlement has processed. The worker settles every later day that has ended.
  last_settled_date date not null,
  planted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Settlement log: one row per pod per settled day (tree screen's week strip, history).
create table public.pod_days (
  pod_id uuid not null references public.pods (id) on delete cascade,
  pod_date date not null,
  outcome text not null check (outcome in ('thrive', 'steady', 'wilt', 'dormant')),
  contributors integer not null,
  members integer not null,
  hp_delta integer not null,
  hp_after integer not null,
  settled_at timestamptz not null default now(),
  primary key (pod_id, pod_date)
);

-- ─── Snaps & chat ─────────────────────────────────────────────────────────────

create table public.snaps (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Copied from the pod by the trigger, so profile grids can group snaps by habit
  -- even for viewers who can't see the pod itself.
  habit_id text not null references public.habits (id),
  -- Storage path in the `snaps` bucket ("<user_id>/<uuid>.jpg") or an absolute https URL (seed data).
  image text not null check (char_length(image) <= 500),
  caption text not null default '' check (char_length(caption) <= 200),
  -- Server-stamped by snaps_before_insert; client values are ignored.
  taken_at timestamptz not null default now(),
  pod_date date not null default current_date, -- placeholder; the trigger always overwrites it
  on_time boolean not null default false,
  -- Owner picks snaps to show on their profile grid.
  on_profile boolean not null default false
);
create index snaps_pod_taken_idx on public.snaps (pod_id, taken_at desc);
create index snaps_user_idx on public.snaps (user_id, habit_id, taken_at desc);

-- The proof that counts: first on-time snap per member per pod-day.
create table public.contributions (
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pod_date date not null,
  snap_id uuid references public.snaps (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (pod_id, user_id, pod_date)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods (id) on delete cascade,
  -- null for system messages (settlement results, joins).
  user_id uuid default auth.uid() references public.profiles (id) on delete set null,
  kind text not null default 'text' check (kind in ('text', 'snap', 'system')),
  body text not null default '' check (char_length(body) <= 2000),
  snap_id uuid references public.snaps (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index messages_pod_created_idx on public.messages (pod_id, created_at desc);

-- Which story snaps a user has seen (drives the ring colour).
create table public.snap_views (
  snap_id uuid not null references public.snaps (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (snap_id, user_id)
);

-- Server stamps time, pod-day and on-time. Same rule as packages/shared/src/snapWindow.ts.
create function public.snaps_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p public.pods;
  local_ts timestamp;
begin
  select * into p from public.pods where id = new.pod_id;
  local_ts := now() at time zone p.timezone;
  new.habit_id := p.habit_id;
  new.taken_at := now();
  new.pod_date := local_ts::date;
  new.on_time := local_ts::time >= p.snap_time
    and local_ts::time < p.snap_time + make_interval(mins => p.window_minutes);
  return new;
end $$;

create trigger snaps_before_insert before insert on public.snaps
for each row execute function public.snaps_before_insert();

-- Every snap appears in the pod chat; on-time snaps count as that day's contribution.
create function public.snaps_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.messages (pod_id, user_id, kind, body, snap_id, created_at)
  values (new.pod_id, new.user_id, 'snap', new.caption, new.id, new.taken_at);
  if new.on_time then
    insert into public.contributions (pod_id, user_id, pod_date, snap_id)
    values (new.pod_id, new.user_id, new.pod_date, new.id)
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger snaps_after_insert after insert on public.snaps
for each row execute function public.snaps_after_insert();

-- ─── Read model for the chat list ─────────────────────────────────────────────

create view public.pod_overview with (security_invoker = true) as
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
  (select count(*) from public.pod_members m where m.pod_id = p.id)::int as member_count,
  (select count(*) from public.contributions c
     where c.pod_id = p.id and c.pod_date = (now() at time zone p.timezone)::date)::int as contributed_today,
  exists (select 1 from public.contributions c
     where c.pod_id = p.id and c.user_id = auth.uid() and c.pod_date = (now() at time zone p.timezone)::date) as me_contributed_today,
  (select m.streak from public.pod_members m where m.pod_id = p.id and m.user_id = auth.uid()) as my_streak,
  lm.kind as last_message_kind,
  lm.body as last_message_body,
  lm.author_name as last_message_author,
  coalesce(lm.created_at, p.created_at) as last_activity_at
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

-- ─── RPCs the app calls ───────────────────────────────────────────────────────

create function public.create_pod(
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
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'unknown timezone %', p_timezone using errcode = '22023';
  end if;
  insert into public.pods (name, habit_id, goal, snap_time, timezone, window_minutes, created_by)
  values (p_name, p_habit_id, coalesce(p_goal, ''), p_snap_time, p_timezone, p_window_minutes, me)
  returning id into new_id;
  insert into public.pod_members (pod_id, user_id, role) values (new_id, me, 'owner');
  -- First settled day is tomorrow: today is already partly over.
  insert into public.trees (pod_id, last_settled_date) values (new_id, (now() at time zone p_timezone)::date);
  insert into public.messages (pod_id, user_id, kind, body) values (new_id, null, 'system', 'A seed was planted. Snap every day to help it grow.');
  return new_id;
end $$;

create function public.join_pod(p_invite_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select id into target from public.pods where invite_code = upper(trim(p_invite_code));
  if target is null then raise exception 'no pod with that code' using errcode = 'P0002'; end if;
  insert into public.pod_members (pod_id, user_id) values (target, me) on conflict do nothing;
  if found then
    insert into public.messages (pod_id, user_id, kind, body)
    select target, null, 'system', display_name || ' joined the pod.' from public.profiles where id = me;
  end if;
  return target;
end $$;

-- Recompute profile aggregates from per-pod stats. Called by apps/api after settlement.
create function public.refresh_profile_stats(p_user_ids uuid[]) returns void
language sql security definer set search_path = '' as $$
  update public.profiles pr set
    energy = coalesce(s.energy, 0),
    stars = coalesce(s.stars, 0),
    streak = coalesce(s.streak, 0)
  from (
    select u.id, sum(m.energy)::int as energy, sum(m.stars)::int as stars, max(m.streak)::int as streak
    from unnest(p_user_ids) as u(id)
    left join public.pod_members m on m.user_id = u.id
    group by u.id
  ) s
  where pr.id = s.id;
$$;
revoke execute on function public.refresh_profile_stats(uuid[]) from public, anon, authenticated;

-- ─── Realtime ─────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.messages, public.trees, public.contributions;
