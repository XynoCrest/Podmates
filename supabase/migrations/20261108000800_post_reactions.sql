-- Post action bar counts: thumbs down and shares, next to the existing score and comment count.
--   down_count   how many thumbs-down votes a post has. Kept by the vote trigger, like score
--                (score stays the net: ups minus downs, so ups = score + down_count).
--   share_count  how many people have shared it. One per person (post_shares), so tapping
--                share again doesn't inflate it.
-- Neither is client-writable: posts grants clients no UPDATE.

alter table public.posts
  add column down_count integer not null default 0 check (down_count >= 0),
  add column share_count integer not null default 0 check (share_count >= 0);

update public.posts p set down_count = (select count(*) from public.post_votes v where v.post_id = p.id and v.value = -1);

create or replace function public.post_votes_score() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Take the old vote off the post it was on, and add the new one to the post it is on now
  -- (the same post unless the vote moved).
  if tg_op in ('DELETE', 'UPDATE') then
    update public.posts set score = score - old.value, down_count = down_count - (old.value = -1)::int where id = old.post_id;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update public.posts set score = score + new.value, down_count = down_count + (new.value = -1)::int where id = new.post_id;
  end if;
  return null;
end $$;

create table public.post_shares (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  shared_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_shares enable row level security;
-- No client policies: written only by share_post.

-- Record that I shared a post (once per person) and return its share count.
create function public.share_post(p_post uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  total integer;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  insert into public.post_shares (post_id, user_id) values (p_post, me) on conflict do nothing;
  if found then
    update public.posts set share_count = share_count + 1 where id = p_post returning share_count into total;
  else
    select share_count into total from public.posts where id = p_post;
  end if;
  return total;
end $$;
revoke execute on function public.share_post(uuid) from public, anon;
grant execute on function public.share_post(uuid) to authenticated;
