-- Podmate pairs get their own tree and streak, like a pod of two.
-- A pair is any two people who share a pod. Each day, a person counts as "snapped"
-- if they made an on-time contribution in any pod the two share.
-- apps/api settles pair-days with packages/tree-engine (same rules as pods) and
-- writes them through apply_pair_settlement; clients can only read their own pairs.

create table public.pair_trees (
  -- Always stored in id order, so a pair has exactly one row.
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  hp integer not null default 100 check (hp >= 0),
  max_hp integer not null default 100 check (max_hp > 0),
  growth integer not null default 0 check (growth >= 0),
  status text not null default 'alive' check (status in ('alive', 'dead')),
  -- Consecutive days both snapped (the pair's 🔥).
  streak integer not null default 0 check (streak >= 0),
  last_settled_date date not null,
  planted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
create index pair_trees_user_b_idx on public.pair_trees (user_b);

-- Settlement log, one row per pair per settled day (the pair tree screen's week strip).
create table public.pair_days (
  user_a uuid not null,
  user_b uuid not null,
  pair_date date not null,
  outcome text not null check (outcome in ('thrive', 'steady', 'wilt', 'dormant')),
  contributors integer not null,
  hp_delta integer not null,
  hp_after integer not null,
  settled_at timestamptz not null default now(),
  primary key (user_a, user_b, pair_date),
  foreign key (user_a, user_b) references public.pair_trees (user_a, user_b) on delete cascade
);

alter table public.pair_trees enable row level security;
alter table public.pair_days enable row level security;
create policy pair_trees_read on public.pair_trees for select to authenticated using (auth.uid() in (user_a, user_b));
create policy pair_days_read on public.pair_days for select to authenticated using (auth.uid() in (user_a, user_b));
revoke all on public.pair_trees, public.pair_days from anon;

-- Atomic write for one settled pair-day, guarded like apply_day_settlement.
create function public.apply_pair_settlement(
  p_user_a uuid,
  p_user_b uuid,
  p_pair_date date,
  p_expected_last date,
  p_tree jsonb, -- {hp, max_hp, growth, status, streak}
  p_day jsonb   -- {outcome, contributors, hp_delta, hp_after}
) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.pair_trees set
    hp = (p_tree ->> 'hp')::int,
    max_hp = (p_tree ->> 'max_hp')::int,
    growth = (p_tree ->> 'growth')::int,
    status = p_tree ->> 'status',
    streak = (p_tree ->> 'streak')::int,
    last_settled_date = p_pair_date,
    updated_at = now()
  where user_a = p_user_a and user_b = p_user_b and last_settled_date = p_expected_last;
  if not found then return false; end if;

  insert into public.pair_days (user_a, user_b, pair_date, outcome, contributors, hp_delta, hp_after)
  values (
    p_user_a, p_user_b, p_pair_date, p_day ->> 'outcome', (p_day ->> 'contributors')::int,
    (p_day ->> 'hp_delta')::int, (p_day ->> 'hp_after')::int
  );
  return true;
end $$;
revoke execute on function public.apply_pair_settlement(uuid, uuid, date, date, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.apply_pair_settlement(uuid, uuid, date, date, jsonb, jsonb) to service_role;

alter publication supabase_realtime add table public.pair_trees;
