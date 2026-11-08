-- Explore: subreddit-style communities with a voted post feed.

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_]{2,30}$'),
  name text not null,
  description text not null default '',
  emoji text not null,
  color text not null default 'leaf' check (color in ('leaf', 'sky', 'star', 'flame', 'rose', 'teal')),
  habit_id text references public.habits (id),
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index community_members_user_idx on public.community_members (user_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  body text not null default '' check (char_length(body) <= 10000),
  image_url text,
  -- Maintained by triggers below.
  score integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index posts_community_created_idx on public.posts (community_id, created_at desc);

create table public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (post_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index comments_post_created_idx on public.comments (post_id, created_at);

-- Counters. security definer so a voter can bump a post they don't own.
create function public.post_votes_score() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.posts set score = score
    + coalesce(case when tg_op in ('INSERT', 'UPDATE') then new.value end, 0)
    - coalesce(case when tg_op in ('DELETE', 'UPDATE') then old.value end, 0)
  where id = coalesce(new.post_id, old.post_id);
  return null;
end $$;
create trigger post_votes_score after insert or update or delete on public.post_votes
for each row execute function public.post_votes_score();

create function public.comments_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.posts set comment_count = comment_count + case when tg_op = 'INSERT' then 1 else -1 end
  where id = coalesce(new.post_id, old.post_id);
  return null;
end $$;
create trigger comments_count after insert or delete on public.comments
for each row execute function public.comments_count();

create function public.community_members_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.communities set member_count = member_count + case when tg_op = 'INSERT' then 1 else -1 end
  where id = coalesce(new.community_id, old.community_id);
  return null;
end $$;
create trigger community_members_count after insert or delete on public.community_members
for each row execute function public.community_members_count();
