-- Read markers for pod group chats: each member's "read up to" time, so the app can count unread messages.
alter table public.pod_members add column last_read_at timestamptz not null default now();

-- Clients get no update policy on pod_members; this is the only way last_read_at changes,
-- and only for the caller's own membership.
create function public.mark_pod_read(p_pod uuid) returns void
language sql security definer set search_path = '' as $$
  update public.pod_members set last_read_at = now()
  where pod_id = p_pod and user_id = auth.uid();
$$;
revoke execute on function public.mark_pod_read(uuid) from public, anon;
grant execute on function public.mark_pod_read(uuid) to authenticated;

-- Same view as before, plus unread_count: messages from others since I last opened the chat.
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
  (select count(*) from public.pod_members m where m.pod_id = p.id)::int as member_count,
  (select count(*) from public.contributions c
     where c.pod_id = p.id and c.pod_date = (now() at time zone p.timezone)::date)::int as contributed_today,
  exists (select 1 from public.contributions c
     where c.pod_id = p.id and c.user_id = auth.uid() and c.pod_date = (now() at time zone p.timezone)::date) as me_contributed_today,
  (select m.streak from public.pod_members m where m.pod_id = p.id and m.user_id = auth.uid()) as my_streak,
  lm.kind as last_message_kind,
  lm.body as last_message_body,
  lm.author_name as last_message_author,
  coalesce(lm.created_at, p.created_at) as last_activity_at,
  (select count(*) from public.messages msg
     join public.pod_members me on me.pod_id = msg.pod_id and me.user_id = auth.uid()
     where msg.pod_id = p.id and msg.created_at > me.last_read_at
       and msg.user_id is distinct from auth.uid())::int as unread_count
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
