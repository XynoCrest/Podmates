-- Friend requests. Being friends means sharing a habit and a pod:
--   • A request names one of the sender's pods (which sets the habit). Accepting joins that pod
--     and makes the two friends, so they can message each other as podmates.
--   • If they already share a pod, the request carries no pod and accepting just makes them friends.
--   • Anyone signed in can send one, except across a block (either way). Senders can cancel a
--     pending request; there is no unfriend (leaving the pod or blocking is how people separate).
--   • Pods have no member cap any more (the 6-member cap from 20261108000700 is removed).

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  -- The sender's pod the recipient joins on accept; null when they already share a pod.
  pod_id uuid references public.pods (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (from_id <> to_id)
);
-- One open request per pair, whichever way it goes.
create unique index friend_requests_one_pending on public.friend_requests (least(from_id, to_id), greatest(from_id, to_id)) where status = 'pending';
create index friend_requests_to_idx on public.friend_requests (to_id, status);
create index friend_requests_from_idx on public.friend_requests (from_id, status);

create table public.friendships (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
create index friendships_b_idx on public.friendships (user_b);

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
create policy friend_requests_mine on public.friend_requests for select to authenticated using (auth.uid() in (from_id, to_id));
create policy friendships_mine on public.friendships for select to authenticated using (auth.uid() in (user_a, user_b));
-- No client writes: everything goes through the functions below.
revoke insert, update, delete on public.friend_requests, public.friendships from anon, authenticated;

create function public.are_friends(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.friendships where user_a = least(auth.uid(), p_user_id) and user_b = greatest(auth.uid(), p_user_id));
$$;

create function public.send_friend_request(p_to uuid, p_pod_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  pod uuid := p_pod_id;
  new_id uuid;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if p_to is null or p_to = me then raise exception 'You can''t add yourself' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_to) then raise exception 'No such person' using errcode = 'P0002'; end if;
  if public.block_between(p_to) then raise exception 'You can''t send a request to this person' using errcode = '42501'; end if;
  if public.are_friends(p_to) then raise exception 'You''re already friends' using errcode = 'P0001'; end if;
  if exists (select 1 from public.friend_requests where status = 'pending' and from_id = p_to and to_id = me) then
    raise exception 'They already sent you a request: accept it on the Friends tab' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.friend_requests where status = 'pending' and from_id = me and to_id = p_to) then
    raise exception 'Request already sent' using errcode = 'P0001';
  end if;

  if public.shares_pod_with(p_to) then
    pod := null; -- already podmates: accepting just makes them friends
  else
    if pod is null then raise exception 'Pick one of your pods for them to join' using errcode = 'P0001'; end if;
    if not exists (select 1 from public.pod_members where pod_id = pod and user_id = me) then
      raise exception 'You can only invite people to your own pods' using errcode = '42501';
    end if;
    if exists (select 1 from public.pod_removals where pod_id = pod and user_id = p_to) then
      raise exception 'They were removed from that pod: pick another' using errcode = 'P0001';
    end if;
  end if;

  insert into public.friend_requests (from_id, to_id, pod_id) values (me, p_to, pod) returning id into new_id;
  return new_id;
end $$;

create function public.respond_friend_request(p_id uuid, p_accept boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  r public.friend_requests;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into r from public.friend_requests where id = p_id and to_id = me and status = 'pending' for update;
  if r.id is null then raise exception 'This request is no longer open' using errcode = 'P0002'; end if;

  if not p_accept then
    update public.friend_requests set status = 'declined', responded_at = now() where id = p_id;
    return null;
  end if;
  if public.block_between(r.from_id) then raise exception 'You can''t accept this request' using errcode = '42501'; end if;

  if r.pod_id is not null and not exists (select 1 from public.pod_members where pod_id = r.pod_id and user_id = me) then
    perform 1 from public.pods where id = r.pod_id for update;
    if exists (select 1 from public.pod_removals where pod_id = r.pod_id and user_id = me) then
      raise exception 'You were removed from this pod' using errcode = '42501';
    end if;
    insert into public.pod_members (pod_id, user_id) values (r.pod_id, me);
    insert into public.messages (pod_id, user_id, kind, body)
    select r.pod_id, null, 'system', display_name || ' joined the pod.' from public.profiles where id = me;
  end if;

  insert into public.friendships (user_a, user_b) values (least(me, r.from_id), greatest(me, r.from_id)) on conflict do nothing;
  update public.friend_requests set status = 'accepted', responded_at = now() where id = p_id;
  return r.pod_id;
end $$;

create function public.cancel_friend_request(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in' using errcode = '42501'; end if;
  update public.friend_requests set status = 'cancelled', responded_at = now()
  where id = p_id and from_id = auth.uid() and status = 'pending';
  if not found then raise exception 'This request is no longer open' using errcode = 'P0002'; end if;
end $$;

-- Open requests I sent or received, with the pod's name and habit (the recipient isn't a member
-- yet, so RLS on pods would hide them).
create function public.my_friend_requests()
returns table (id uuid, incoming boolean, other_id uuid, pod_id uuid, pod_name text, habit_id text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select r.id, r.to_id = auth.uid(), case when r.to_id = auth.uid() then r.from_id else r.to_id end,
         r.pod_id, p.name, p.habit_id, r.created_at
  from public.friend_requests r
  left join public.pods p on p.id = r.pod_id
  where r.status = 'pending' and auth.uid() in (r.from_id, r.to_id)
    and not public.block_between(case when r.to_id = auth.uid() then r.from_id else r.to_id end)
  order by r.created_at desc;
$$;

revoke execute on function public.send_friend_request(uuid, uuid), public.respond_friend_request(uuid, boolean),
  public.cancel_friend_request(uuid), public.my_friend_requests(), public.are_friends(uuid) from public, anon;
grant execute on function public.send_friend_request(uuid, uuid), public.respond_friend_request(uuid, boolean),
  public.cancel_friend_request(uuid), public.my_friend_requests(), public.are_friends(uuid) to authenticated;

-- ─── No pod size cap ──────────────────────────────────────────────────────────
create or replace function public.join_pod(p_invite_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  -- Lock the pod so joining can't race a leave or a removal.
  select id into target from public.pods where invite_code = upper(trim(p_invite_code)) for update;
  if target is null then raise exception 'no pod with that code' using errcode = 'P0002'; end if;
  if exists (select 1 from public.pod_members where pod_id = target and user_id = me) then return target; end if;
  if exists (select 1 from public.pod_removals where pod_id = target and user_id = me) then
    raise exception 'You were removed from this pod' using errcode = '42501';
  end if;
  insert into public.pod_members (pod_id, user_id) values (target, me);
  insert into public.messages (pod_id, user_id, kind, body)
  select target, null, 'system', display_name || ' joined the pod.' from public.profiles where id = me;
  return target;
end $$;

-- Live updates: a new or answered request refreshes the badge and the Friends tab.
alter publication supabase_realtime add table public.friend_requests, public.friendships;
