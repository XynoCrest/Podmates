-- Onboarding shows once per account: set when the person finishes (or skips) it.
-- Everyone who already has an account counts as onboarded.
alter table public.profiles add column onboarded_at timestamptz;
update public.profiles set onboarded_at = now();

-- The owner marks their own onboarding done (column grants add up).
grant update (onboarded_at) on public.profiles to authenticated;
