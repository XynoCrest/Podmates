-- Atomic write for one settled pod-day. apps/api computes every number with
-- packages/tree-engine and hands them here; this function only persists them,
-- in one transaction, guarded so two workers can never settle the same day twice.

create function public.apply_day_settlement(
  p_pod_id uuid,
  p_pod_date date,
  p_expected_last date,
  p_tree jsonb,     -- {hp, max_hp, growth, status}
  p_day jsonb,      -- {outcome, contributors, members, hp_delta, hp_after}
  p_members jsonb,  -- [{user_id, energy_delta, stars_delta, streak}]
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
    streak = (m ->> 'streak')::int
  from jsonb_array_elements(p_members) m
  where pm.pod_id = p_pod_id and pm.user_id = (m ->> 'user_id')::uuid;

  insert into public.messages (pod_id, user_id, kind, body, created_at)
  values (p_pod_id, null, 'system', p_message, p_message_at);
  return true;
end $$;

revoke execute on function public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_day_settlement(uuid, date, date, jsonb, jsonb, jsonb, text, timestamptz) to service_role;
grant execute on function public.refresh_profile_stats(uuid[]) to service_role;
