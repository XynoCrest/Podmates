-- Demo data for local development. Loaded by `supabase db reset`.
--
-- What is seeded here is RAW activity only: people, pods, snaps, contributions, chat,
-- communities. Tree health, energy, stars, streaks and the day log are NOT faked —
-- every tree starts fresh 12 days ago and apps/api settlement (packages/tree-engine)
-- replays those days on boot / `npm run settle`, exactly as in production.
--
-- Demo accounts (password for all: podmates123):
--   ben@podmates.dev  (main demo user — member of 5 pods)
--   maya@ theo@ priya@ jonas@ aisha@podmates.dev
-- Images are placeholder photos from picsum.photos, avatars from randomuser.me (needs network in the simulator).

-- ─── Accounts ─────────────────────────────────────────────────────────────────

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('podmates123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('username', u.username, 'display_name', u.display_name),
  now() - interval '30 days', now(), '', '', '', ''
from (values
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'ben@podmates.dev', 'ben', 'Ben S.'),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'maya@podmates.dev', 'maya.reads', 'Maya'),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'theo@podmates.dev', 'theo_runs', 'Theo'),
  ('a0000000-0000-4000-8000-000000000004'::uuid, 'priya@podmates.dev', 'priya', 'Priya'),
  ('a0000000-0000-4000-8000-000000000005'::uuid, 'jonas@podmates.dev', 'jonas.k', 'Jonas'),
  ('a0000000-0000-4000-8000-000000000006'::uuid, 'aisha@podmates.dev', 'aisha', 'Aisha')
) as u(id, email, username, display_name);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now(), now()
from auth.users where email like '%@podmates.dev';

update public.profiles p set bio = v.bio, avatar_color = v.color, avatar_url = v.photo
from (values
  ('ben', 'Building Podmates. Reading more, scrolling less.', 'leaf', 'https://randomuser.me/api/portraits/men/32.jpg'),
  ('maya.reads', 'Two books a month or bust 📚', 'rose', 'https://randomuser.me/api/portraits/women/44.jpg'),
  ('theo_runs', 'Sub-25 5K loading…', 'flame', 'https://randomuser.me/api/portraits/men/75.jpg'),
  ('priya', 'Pool at 7, coffee at 8.', 'sky', 'https://randomuser.me/api/portraits/women/68.jpg'),
  ('jonas.k', 'Night owl. Bookworm. Occasional runner.', 'star', 'https://randomuser.me/api/portraits/men/46.jpg'),
  ('aisha', 'Swim · read · repeat', 'teal', 'https://randomuser.me/api/portraits/women/90.jpg')
) as v(username, bio, color, photo)
where p.username = v.username;

-- ─── Habits ───────────────────────────────────────────────────────────────────

insert into public.habits (id, name, emoji, sf_symbol, sort) values
  ('reading', 'Reading', '📚', 'book', 1),
  ('running', 'Running', '🏃', 'figure.run', 2),
  ('swimming', 'Swimming', '🏊', 'figure.pool.swim', 3),
  ('meditation', 'Meditation', '🧘', 'figure.mind.and.body', 4),
  ('gym', 'Gym', '🏋️', 'dumbbell', 5),
  ('journaling', 'Journaling', '✍️', 'pencil.and.scribble', 6),
  ('walking', 'Walking', '🚶', 'figure.walk', 7),
  ('coding', 'Coding', '💻', 'chevron.left.forwardslash.chevron.right', 8),
  ('water', 'Hydration', '💧', 'drop', 9),
  ('sleep', 'Sleep', '😴', 'moon.zzz', 10);

-- ─── Pods ─────────────────────────────────────────────────────────────────────
-- Atomic Habits Club's window opens 5 minutes before the reset, so a fresh
-- `db reset` always has one pod you can snap into right away.

insert into public.pods (id, name, habit_id, goal, snap_time, timezone, invite_code, created_by, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'Atomic Habits Club', 'reading', '20 pages of Atomic Habits a day',
     least(date_trunc('minute', (now() at time zone 'America/Toronto'))::time - interval '5 minutes', time '23:30'),
     'America/Toronto', 'ATOMIC', 'a0000000-0000-4000-8000-000000000001', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000002', 'Night Owl Readers', 'reading', 'Read before bed — any book counts',
     least(date_trunc('minute', (now() at time zone 'America/Toronto'))::time + interval '45 minutes', time '23:30'),
     'America/Toronto', 'NIGHTO', 'a0000000-0000-4000-8000-000000000005', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000003', 'Dawn Patrol 5K', 'running', 'Run 5K before 7am',
     '06:30', 'America/Toronto', 'DAWN5K', 'a0000000-0000-4000-8000-000000000003', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000004', 'Lane Six', 'swimming', '1 km in the pool',
     '07:00', 'America/Toronto', 'LANE06', 'a0000000-0000-4000-8000-000000000004', now() - interval '20 days'),
  ('b0000000-0000-4000-8000-000000000005', 'Zen Den', 'meditation', '10 minutes of stillness',
     '08:00', 'America/Toronto', 'ZENDEN', 'a0000000-0000-4000-8000-000000000002', now() - interval '20 days'),
  -- Ben is NOT in this one (RLS tests rely on that).
  ('b0000000-0000-4000-8000-000000000006', 'Iron Pact', 'gym', 'Lift 4x a week',
     '18:00', 'America/Toronto', 'IRONPT', 'a0000000-0000-4000-8000-000000000003', now() - interval '20 days');

-- Member order matters: the activity patterns below are one character per member, in this order.
insert into public.pod_members (pod_id, user_id, role, joined_at)
select ('b0000000-0000-4000-8000-00000000000' || m.pod)::uuid, ('a0000000-0000-4000-8000-00000000000' || m.usr)::uuid,
       case when m.ord = 1 then 'owner' else 'member' end, now() - interval '20 days' + m.ord * interval '1 minute'
from (values
  (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4),
  (2, 5, 1), (2, 1, 2), (2, 6, 3),
  (3, 3, 1), (3, 1, 2), (3, 5, 3), (3, 2, 4),
  (4, 4, 1), (4, 1, 2), (4, 6, 3),
  (5, 2, 1), (5, 1, 2),
  (6, 3, 1), (6, 5, 2)
) as m(pod, usr, ord);

-- Trees start fresh 12 days ago; settlement replays the days since.
insert into public.trees (pod_id, last_settled_date, planted_at)
select id, (now() at time zone timezone)::date - 13, now() - interval '13 days' from public.pods;

-- ─── Snap history ─────────────────────────────────────────────────────────────
-- One pattern string per pod-day, oldest first (12 days ago → yesterday), then today.
-- '1' = that member snapped on time, '0' = missed, '-' = today and they haven't yet.
-- Today's entries for pods whose window hasn't ended yet are skipped automatically.

create temporary table seed_activity (pod int, pattern text[]);
insert into seed_activity values
  (1, array['1111','1111','1101','1111','1111','1111','1111','1011','1111','1111','1111','1111', '-11-']),
  (2, array['111','101','111','011','111','100','111','110','011','101','111','010', '---']),
  (3, array['1111','1111','1111','1111','1111','1111','1111','1111','1111','1111','1111','1111', '1011']),
  (4, array['111','111','110','111','111','101','111','011','110','111','100','011', '101']),
  (5, array['11','11','10','11','11','11','01','11','11','11','11','11', '1-']),
  (6, array['11','11','10','11','11','11','11','01','11','11','11','11', '11']);

alter table public.snaps disable trigger snaps_before_insert;

do $$
declare
  a record;
  p public.pods;
  mem uuid[];
  day_index int;
  day_offset int;
  local_day date;
  ch text;
  shot timestamptz;
  captions text[] := array['Done ✅', 'Day in the books', '', 'Almost skipped. Didn''t.', '', 'Today''s proof', '🔥', '', 'Easy one today', 'Felt great'];
begin
  for a in select * from seed_activity loop
    select * into p from public.pods where id = ('b0000000-0000-4000-8000-00000000000' || a.pod)::uuid;
    select array_agg(user_id order by joined_at) into mem from public.pod_members where pod_id = p.id;
    for day_index in 1 .. array_length(a.pattern, 1) loop
      day_offset := array_length(a.pattern, 1) - day_index; -- 12 … 0
      local_day := (now() at time zone p.timezone)::date - day_offset;
      for i in 1 .. array_length(mem, 1) loop
        ch := substr(a.pattern[day_index], i, 1);
        continue when ch <> '1';
        -- A few minutes into the window, varied per member.
        shot := ((local_day + p.snap_time) + make_interval(mins => 1 + ((i * 7 + day_index * 3) % (p.window_minutes - 2)))) at time zone p.timezone;
        if day_offset = 0 then
          continue when ((local_day + p.snap_time) at time zone p.timezone) > now(); -- today's window hasn't opened
          shot := least(shot, now() - make_interval(mins => i)); -- never in the future
        end if;
        insert into public.snaps (pod_id, user_id, habit_id, image, caption, taken_at, pod_date, on_time, on_profile)
        values (
          p.id, mem[i], p.habit_id,
          format('https://picsum.photos/seed/pm-%s-%s-%s/720/1280', right(p.id::text, 2), right(mem[i]::text, 2), day_index),
          captions[1 + ((i + day_index) % array_length(captions, 1))],
          shot, local_day, true,
          (day_index % 4 = 0)
        );
      end loop;
    end loop;
  end loop;
end $$;

alter table public.snaps enable trigger snaps_before_insert;

-- ─── Chat ─────────────────────────────────────────────────────────────────────

insert into public.messages (pod_id, user_id, kind, body, created_at)
select ('b0000000-0000-4000-8000-00000000000' || m.pod)::uuid,
       case when m.usr = 0 then null else ('a0000000-0000-4000-8000-00000000000' || m.usr)::uuid end,
       case when m.usr = 0 then 'system' else 'text' end,
       m.body, now() - m.ago
from (values
  (1, 0, 'A seed was planted. Snap every day to help it grow.', interval '13 days'),
  (1, 2, 'Chapter 3 is the best one so far, the identity stuff 🤯', interval '5 hours'),
  (1, 3, 'Agreed. "Every action is a vote for the type of person you want to become"', interval '4 hours 50 minutes'),
  (1, 4, 'I''m behind, catching up tonight', interval '2 hours'),
  (1, 2, 'Window''s open! Don''t let the tree down 🌳', interval '2 minutes'),
  (2, 0, 'A seed was planted. Snap every day to help it grow.', interval '13 days'),
  (2, 5, 'Starting Project Hail Mary tonight', interval '1 day 2 hours'),
  (2, 6, 'Ooh jealous. Still stuck in Middlemarch', interval '1 day 1 hour'),
  (2, 5, 'We keep dipping below 70%. Tree''s looking rough, let''s all hit tonight', interval '3 hours'),
  (3, 0, 'A seed was planted. Snap every day to help it grow.', interval '13 days'),
  (3, 3, 'Twelve perfect days. This tree is getting tall 💪', interval '20 hours'),
  (3, 2, 'My legs disagree but yes', interval '19 hours'),
  (3, 5, 'Rain tomorrow — treadmill counts right?', interval '6 hours'),
  (3, 3, 'Treadmill counts 👍', interval '5 hours 55 minutes'),
  (4, 0, 'A seed was planted. Snap every day to help it grow.', interval '13 days'),
  (4, 4, 'Pool was freezing this morning', interval '1 day'),
  (4, 6, 'Sorry I missed yesterday, lane was closed', interval '23 hours'),
  (5, 0, 'A seed was planted. Snap every day to help it grow.', interval '13 days'),
  (5, 2, 'Tried the body scan one today, so good', interval '1 day 3 hours'),
  (6, 0, 'A seed was planted. Snap every day to help it grow.', interval '13 days'),
  (6, 3, 'Leg day 😩', interval '3 hours')
) as m(pod, usr, body, ago);

-- Ben has watched some of today's stories.
insert into public.snap_views (snap_id, user_id)
select s.id, 'a0000000-0000-4000-8000-000000000001'
from public.snaps s
where s.taken_at > now() - interval '24 hours'
  and s.pod_id in ('b0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000005');

-- ─── Explore ──────────────────────────────────────────────────────────────────

insert into public.communities (id, slug, name, description, emoji, color, habit_id) values
  ('c0000000-0000-4000-8000-000000000001', 'bookworms', 'Bookworms', 'What are you reading? Reviews, streaks and TBR piles.', '📚', 'rose', 'reading'),
  ('c0000000-0000-4000-8000-000000000002', 'runclub', 'RunClub', 'Every pace welcome. Routes, gear and race reports.', '🏃', 'flame', 'running'),
  ('c0000000-0000-4000-8000-000000000003', 'swimmers', 'Swimmers', 'Laps, open water and the 6am pool crew.', '🏊', 'sky', 'swimming'),
  ('c0000000-0000-4000-8000-000000000004', 'mindful', 'Mindful', 'Meditation, breathwork and slowing down.', '🧘', 'teal', 'meditation'),
  ('c0000000-0000-4000-8000-000000000005', 'gymrats', 'GymRats', 'Programs, PRs and form checks.', '🏋️', 'star', 'gym'),
  ('c0000000-0000-4000-8000-000000000006', 'habitscience', 'HabitScience', 'The research behind building habits that stick.', '🧠', 'leaf', null);

insert into public.community_members (community_id, user_id)
select ('c0000000-0000-4000-8000-00000000000' || c)::uuid, ('a0000000-0000-4000-8000-00000000000' || u)::uuid
from (values (1,1),(1,2),(1,5),(1,6),(2,1),(2,3),(2,5),(3,4),(3,6),(3,1),(4,2),(5,3),(6,1),(6,2),(6,3),(6,4)) as m(c, u);

insert into public.posts (id, community_id, user_id, title, body, image_url, created_at)
select ('d0000000-0000-4000-8000-0000000000' || lpad(p.n::text, 2, '0'))::uuid,
       ('c0000000-0000-4000-8000-00000000000' || p.c)::uuid,
       ('a0000000-0000-4000-8000-00000000000' || p.u)::uuid,
       p.title, p.body,
       case when p.img then format('https://picsum.photos/seed/post%s/1080/720', p.n) end,
       now() - p.ago
from (values
  (1, 1, 2, 'Finished my 30th book this year thanks to a 5-person reading pod', 'The daily snap at 9pm is the only thing that worked for me. Missing it means the tree loses HP and everyone sees it. Peer pressure, but wholesome.', true, interval '4 hours'),
  (2, 6, 1, 'Why "never miss twice" beats perfect streaks', 'Missing one day barely matters. Missing two starts a new habit. Our pods hold steady at 70% for exactly this reason.', false, interval '6 hours'),
  (3, 2, 3, 'First sub-25 5K! 24:51 🎉', 'Six weeks of Dawn Patrol with three friends. Never thought I''d be a morning runner.', true, interval '9 hours'),
  (4, 3, 4, 'Tips for not dreading the cold pool at 7am?', 'Lane Six is close to losing our tree and it''s 100% because we all hate the first minute in the water.', false, interval '11 hours'),
  (5, 1, 5, 'Project Hail Mary is the perfect "read before bed" book', 'Short chapters, every one ends on a hook. Dangerous at 1am.', true, interval '14 hours'),
  (6, 4, 2, 'Ten minutes a day for 60 days — what changed', 'Less reactive, sleeping better, and I actually notice when I''m about to doomscroll.', false, interval '20 hours'),
  (7, 5, 3, 'Form check: is my deadlift hinge okay?', 'Filmed from the side. Be honest.', true, interval '1 day'),
  (8, 6, 4, 'The 2-minute rule, applied to swimming', 'Goal isn''t 1 km. Goal is "get in the water". The kilometre follows.', false, interval '1 day 4 hours'),
  (9, 2, 5, 'Rainy-day treadmill playlist thread', 'Drop your best 170 bpm tracks.', false, interval '1 day 8 hours'),
  (10, 1, 6, 'Your shelf this month 📸', 'Show us what''s on the nightstand.', true, interval '2 days')
) as p(n, c, u, title, body, img, ago);

insert into public.post_votes (post_id, user_id, value)
select ('d0000000-0000-4000-8000-0000000000' || lpad(v.p::text, 2, '0'))::uuid, ('a0000000-0000-4000-8000-00000000000' || v.u)::uuid, v.val
from (values
  (1,1,1),(1,3,1),(1,4,1),(1,5,1),(1,6,1),(2,2,1),(2,3,1),(2,4,1),(3,1,1),(3,2,1),(3,4,1),(3,5,1),(3,6,1),
  (4,1,1),(4,6,1),(5,1,1),(5,2,1),(5,6,1),(6,1,1),(6,4,1),(7,5,-1),(7,1,1),(8,1,1),(8,2,1),(9,3,1),(10,2,1)
) as v(p, u, val);

-- Make demo scores look like a busy community without seeding hundreds of votes.
update public.posts set score = score + s.bonus
from (values (1, 1243), (2, 512), (3, 2087), (4, 88), (5, 431), (6, 297), (7, 41), (8, 156), (9, 23), (10, 302)) as s(n, bonus)
where id = ('d0000000-0000-4000-8000-0000000000' || lpad(s.n::text, 2, '0'))::uuid;

insert into public.comments (post_id, user_id, body, created_at)
select ('d0000000-0000-4000-8000-0000000000' || lpad(c.p::text, 2, '0'))::uuid, ('a0000000-0000-4000-8000-00000000000' || c.u)::uuid, c.body, now() - c.ago
from (values
  (1, 5, 'The public tree is genius. Nobody wants to be the one who killed it.', interval '3 hours'),
  (1, 1, 'Congrats! What was your favourite of the 30?', interval '2 hours'),
  (1, 2, 'Piranesi, no contest.', interval '1 hour'),
  (2, 3, 'This reframed streaks for me.', interval '5 hours'),
  (3, 1, 'Huge! Dawn Patrol represent 🌅', interval '8 hours'),
  (3, 5, 'Next stop sub-24', interval '7 hours'),
  (4, 6, 'Count down from 3 and just go. Thinking is the enemy.', interval '10 hours'),
  (4, 1, 'Warm shower first, then straight in.', interval '9 hours'),
  (5, 6, 'Adding to my list', interval '13 hours'),
  (7, 1, 'Hips are shooting up a little early. Otherwise solid.', interval '22 hours')
) as c(p, u, body, ago);

-- ─── Direct messages ──────────────────────────────────────────────────────────

-- Ben has read everything except Jonas's latest, so one thread shows as unread.
insert into public.direct_messages (sender_id, recipient_id, body, created_at, read_at)
select s.id, r.id, v.body, now() - v.ago, case when v.sender = 'jonas.k' then null else now() - v.ago + interval '5 minutes' end
from (values
  ('maya.reads', 'ben', 'Finished chapter 9 last night, no spoilers!', interval '5 hours'),
  ('ben', 'maya.reads', 'Haha I''m two behind. Tonight for sure', interval '4 hours 40 minutes'),
  ('maya.reads', 'ben', 'Snap it or it didn''t happen 📸', interval '4 hours 30 minutes'),
  ('theo_runs', 'ben', 'Long run Saturday? 10k loop by the river', interval '1 day 2 hours'),
  ('ben', 'theo_runs', 'In. 7am?', interval '1 day 1 hour'),
  ('jonas.k', 'ben', 'Your tree is looking healthy this week', interval '3 hours')
) as v(sender, recipient, body, ago)
join public.profiles s on s.username = v.sender
join public.profiles r on r.username = v.recipient;

-- ─── Pod chat read markers ────────────────────────────────────────────────────

-- Ben is behind on two pod chats, so the Unread tab has something in it.
update public.pod_members set last_read_at = now() - interval '1 hour'
where user_id = 'a0000000-0000-4000-8000-000000000001' and pod_id = 'b0000000-0000-4000-8000-000000000001';
update public.pod_members set last_read_at = now() - interval '7 hours'
where user_id = 'a0000000-0000-4000-8000-000000000001' and pod_id = 'b0000000-0000-4000-8000-000000000003';

-- ─── Podmate pair trees ───────────────────────────────────────────────────────

-- Every pair who shares a pod starts its tree alongside the pod trees; settlement replays the days since.
insert into public.pair_trees (user_a, user_b, last_settled_date, planted_at)
select a.user_id, b.user_id, min((now() at time zone p.timezone)::date) - 13, now() - interval '13 days'
from public.pod_members a
join public.pod_members b on b.pod_id = a.pod_id and a.user_id < b.user_id
join public.pods p on p.id = a.pod_id
group by a.user_id, b.user_id;
