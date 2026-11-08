-- Profile "proof of progress" numbers: Streak · Best · Snaps.
--   best_streak  longest streak ever, per pod and on the profile. Computed by
--                packages/tree-engine during settlement (like every streak number)
--                and persisted here; it never goes down.
--   snap_count   every snap a person has posted (on time and late). A plain counter
--                kept by trigger, so visitors can see it without reading the snaps.
-- Neither column is client-writable (profiles only grants the presentation columns).

alter table public.pod_members
  add column best_streak integer not null default 0 check (best_streak >= 0);

alter table public.profiles
  add column best_streak integer not null default 0 check (best_streak >= 0),
  add column snap_count integer not null default 0 check (snap_count >= 0);

-- Backfill from what exists already.
update public.pod_members set best_streak = streak;
update public.profiles p set
  best_streak = coalesce((select max(m.best_streak) from public.pod_members m where m.user_id = p.id), 0),
  snap_count = (select count(*) from public.snaps s where s.user_id = p.id);

-- Settlement writes best_streak alongside streak (a missing value falls back to the streak,
-- so an older API keeps working). Same signature and guard as before.
create or replace function public.apply_day_settlement(
  p_pod_id uuid,
  p_pod_date date,
  p_expected_last date,
  p_tree jsonb,
  p_day jsonb,
  p_members jsonb,
  p_message text,
  p_message_at timestamptz
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.trees set
    hp = (p_tree ->> 'hp')::int,
    max_hp = (p_tree ->> 'max_hp')::int,
    growth = (p_tree ->> 'growth')::int,
    status = p_tree ->> 'status',
    last_settled_date = p_pod_date,
    updated_at = now()
  where pod_id = p_pod_id and last_settled_date = p_expected_last;
  if not found then return false; end if; -- someone else settled it first

  insert into public.pod_days (pod_id, pod_date, outcome, contributors, members, hp_delta, hp_after)
  values (
    p_pod_id, p_pod_date, p_day ->> 'outcome', (p_day ->> 'contributors')::int, (p_day ->> 'members')::int,
    (p_day ->> 'hp_delta')::int, (p_day ->> 'hp_after')::int
  );

  update public.pod_members pm set
    energy = pm.energy + (m ->> 'energy_delta')::int,
    stars = pm.stars + (m ->> 'stars_delta')::int,
    streak = (m ->> 'streak')::int,
    best_streak = greatest(pm.best_streak, coalesce((m ->> 'best_streak')::int, (m ->> 'streak')::int))
  from jsonb_array_elements(p_members) m
  where pm.pod_id = p_pod_id and pm.user_id = (m ->> 'user_id')::uuid;

  insert into public.messages (pod_id, user_id, kind, body, created_at)
  values (p_pod_id, null, 'system', p_message, p_message_at);
  return true;
end $$;

create or replace function public.refresh_profile_stats(p_user_ids uuid[]) returns void
language sql security definer set search_path = '' as $$
  update public.profiles pr set
    energy = coalesce(s.energy, 0),
    stars = coalesce(s.stars, 0),
    streak = coalesce(s.streak, 0),
    best_streak = greatest(pr.best_streak, coalesce(s.best, 0))
  from (
    select u.id, sum(m.energy)::int as energy, sum(m.stars)::int as stars, max(m.streak)::int as streak, max(m.best_streak)::int as best
    from unnest(p_user_ids) as u(id)
    left join public.pod_members m on m.user_id = u.id
    group by u.id
  ) s
  where pr.id = s.id;
$$;

-- `create or replace` keeps existing grants, but restate them so this file reads on its own.
revoke execute on function public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz) to service_role;
revoke execute on function public.refresh_profile_stats(uuid[]) from public, anon, authenticated;
grant execute on function public.refresh_profile_stats(uuid[]) to service_role;

-- Snap counter: +1 per snap posted, -1 if one is ever deleted.
create function public.snaps_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set snap_count = snap_count + 1 where id = new.user_id;
  else
    update public.profiles set snap_count = greatest(0, snap_count - 1) where id = old.user_id;
  end if;
  return null;
end $$;
create trigger snaps_count after insert or delete on public.snaps
for each row execute function public.snaps_count();
