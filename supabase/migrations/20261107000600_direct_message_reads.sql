-- Read receipts for direct messages. Null until the recipient opens the thread.
alter table public.direct_messages add column read_at timestamptz;
create index direct_messages_unread_idx on public.direct_messages (recipient_id, sender_id) where read_at is null;

-- Clients get no update policy on direct_messages; this is the only way read_at changes,
-- and only for messages sent to the caller.
create function public.mark_dm_read(p_other uuid) returns integer
language sql security definer set search_path = '' as $$
  with marked as (
    update public.direct_messages set read_at = now()
    where recipient_id = auth.uid() and sender_id = p_other and read_at is null
    returning 1
  )
  select count(*)::int from marked;
$$;
revoke execute on function public.mark_dm_read(uuid) from public, anon;
grant execute on function public.mark_dm_read(uuid) to authenticated;
