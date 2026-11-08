-- Energy and stars are gone: the streak and the tree are the only rewards.
-- Settlement stops writing them (same function signatures, so the API keeps working),
-- then the columns are dropped.

create or replace function public.apply_day_settlement(
  p_pod_id uuid,
  p_pod_date date,
  p_expected_last date,
  p_tree jsonb,
  p_day jsonb,
  p_members jsonb,  -- [{user_id, streak, best_streak}]
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
    streak = coalesce(s.streak, 0),
    best_streak = greatest(pr.best_streak, coalesce(s.best, 0))
  from (
    select u.id, max(m.streak)::int as streak, max(m.best_streak)::int as best
    from unnest(p_user_ids) as u(id)
    left join public.pod_members m on m.user_id = u.id
    group by u.id
  ) s
  where pr.id = s.id;
$$;

revoke execute on function public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz) to service_role;
revoke execute on function public.refresh_profile_stats(uuid[]) from public, anon, authenticated;
grant execute on function public.refresh_profile_stats(uuid[]) to service_role;

alter table public.profiles drop column energy, drop column stars;
alter table public.pod_members drop column energy, drop column stars;
