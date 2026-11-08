-- One-to-one chats between podmates. Only people who share a pod can message each other;
-- either side can read the thread.
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index direct_messages_pair_idx on public.direct_messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);
create index direct_messages_recipient_idx on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

create policy direct_messages_read on public.direct_messages for select to authenticated
  using (auth.uid() in (sender_id, recipient_id));
create policy direct_messages_insert on public.direct_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.shares_pod_with(recipient_id));

alter publication supabase_realtime add table public.direct_messages;
