-- Demo data for local development. Loaded by `supabase db reset`.
--
-- Seeded here is RAW activity only: people, habit pods, snaps, rest days, follows, cheers,
-- posts. Streaks and tree health are NOT faked: apps/api settlement (packages/tree-engine)
-- computes them from this history on boot / `npm run settle`, exactly as in production.
--
-- Demo accounts (password for all: podmates123):
--   ben@podmates.dev   main demo user; tracks Reading, Running, Swimming, Meditation (not Gym);
--                      is a Podmates admin (reviews flagged snaps)
--   maya@ theo@ priya@ jonas@ aisha@podmates.dev   (aisha has a private profile)
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

update public.profiles p set bio = v.bio, avatar_color = v.color, avatar_url = v.photo, is_private = v.private, is_admin = v.admin,
  timezone = 'America/Edmonton'
from (values
  ('ben', 'Building Podmates. Reading more, scrolling less.', 'leaf', 'https://randomuser.me/api/portraits/men/32.jpg', false, true),
  ('maya.reads', 'Two books a month or bust 📚', 'rose', 'https://randomuser.me/api/portraits/women/44.jpg', false, false),
  ('theo_runs', 'Sub-25 5K loading…', 'flame', 'https://randomuser.me/api/portraits/men/75.jpg', false, false),
  ('priya', 'Pool at 7, coffee at 8.', 'sky', 'https://randomuser.me/api/portraits/women/68.jpg', false, false),
  ('jonas.k', 'Night owl. Bookworm. Occasional runner.', 'star', 'https://randomuser.me/api/portraits/men/46.jpg', false, false),
  ('aisha', 'Swim · read · repeat', 'teal', 'https://randomuser.me/api/portraits/women/90.jpg', true, false)
) as v(username, bio, color, photo, private, admin)
where p.username = v.username;

-- ─── Habits and their pods (one pod per habit; each pod gets a tree by trigger) ─

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

insert into public.pods (id, habit_id, name, description, color)
select ('b0000000-0000-4000-8000-0000000000' || lpad(h.sort::text, 2, '0'))::uuid, h.id, h.name, d.description, d.color
from public.habits h
join (values
  ('reading', 'What are you reading? Reviews, streaks and TBR piles.', 'rose'),
  ('running', 'Every pace welcome. Routes, gear and race reports.', 'flame'),
  ('swimming', 'Laps, open water and the 6am pool crew.', 'sky'),
  ('meditation', 'Meditation, breathwork and slowing down.', 'teal'),
  ('gym', 'Programs, PRs and form checks.', 'star'),
  ('journaling', 'A few lines a day. Prompts and notebooks.', 'leaf'),
  ('walking', 'Daily steps, neighbourhood loops and trails.', 'leaf'),
  ('coding', 'Learn in public, one commit a day.', 'sky'),
  ('water', 'Small sips, all day long.', 'sky'),
  ('sleep', 'Wind-down routines and consistent bedtimes.', 'star')
) as d(habit, description, color) on d.habit = h.id;

-- Who tracks what. Member order matters: the activity patterns below are one character per member.
-- Ben does NOT track Gym (RLS tests rely on that).
insert into public.user_habits (user_id, pod_id, joined_at)
select ('a0000000-0000-4000-8000-00000000000' || m.usr)::uuid, ('b0000000-0000-4000-8000-0000000000' || lpad(m.pod::text, 2, '0'))::uuid,
       now() - interval '20 days' + m.ord * interval '1 minute'
from (values
  (1, 1, 1), (1, 2, 2), (1, 5, 3), (1, 6, 4), (1, 4, 5), (1, 3, 6),
  (2, 3, 1), (2, 1, 2), (2, 5, 3), (2, 2, 4),
  (3, 4, 1), (3, 1, 2), (3, 6, 3),
  (4, 2, 1), (4, 1, 2),
  (5, 3, 1), (5, 5, 2)
) as m(pod, usr, ord);

-- ─── Activity history ─────────────────────────────────────────────────────────
-- One pattern per day, oldest first (12 days ago → yesterday), then today.
-- '1' = snapped, 'r' = declared rest day, '0' = missed, '-' = today and not done yet.
-- Days are in each user's own timezone (everyone here is America/Edmonton).

create temporary table seed_activity (pod int, pattern text[]);
insert into seed_activity values
  (1, array['111111','1110r1','11r111','111111','1r1011','111111','111110','r11111','111r11','110111','111111','1111r1', '-11-1-']),
  (2, array['1111','1111','1101','1111','111r','1111','1011','1111','1111','r111','1111','1101', '11--']),
  (3, array['111','111','110','111','1r1','101','111','011','110','111','100','011', '1-1']),
  (4, array['11','11','10','11','11','11','01','11','11','11','11','11', '1-']),
  (5, array['11','11','10','11','11','11','11','01','11','11','11','11', '11']);

-- Backdated snaps: skip the stamping trigger (it would use now()); the after-insert trigger
-- still records each snap in habit_days.
alter table public.snaps disable trigger snaps_before_insert;

do $$
declare
  a record;
  pod public.pods;
  mem uuid[];
  day_index int;
  day_offset int;
  local_day date;
  ch text;
  shot timestamptz;
  tz constant text := 'America/Edmonton';
  captions text[] := array['Done ✅', 'Day in the books', '', 'Almost skipped. Didn''t.', '', 'Today''s proof', '🔥', '', 'Easy one today', 'Felt great'];
begin
  for a in select * from seed_activity loop
    select * into pod from public.pods where id = ('b0000000-0000-4000-8000-0000000000' || lpad(a.pod::text, 2, '0'))::uuid;
    select array_agg(user_id order by joined_at) into mem from public.user_habits where pod_id = pod.id;
    for day_index in 1 .. array_length(a.pattern, 1) loop
      day_offset := array_length(a.pattern, 1) - day_index; -- 12 … 0
      local_day := (now() at time zone tz)::date - day_offset;
      for i in 1 .. array_length(mem, 1) loop
        ch := substr(a.pattern[day_index], i, 1);
        if ch = 'r' then
          insert into public.habit_days (user_id, pod_id, day, status) values (mem[i], pod.id, local_day, 'rest');
        elsif ch = '1' then
          -- Some time between 7am and 5pm, varied per member and day.
          shot := ((local_day + time '07:00') + make_interval(mins => (i * 53 + day_index * 37) % 600)) at time zone tz;
          if shot > now() then shot := now() - make_interval(mins => i * 3); end if;
          insert into public.snaps (pod_id, user_id, habit_id, image, caption, taken_at, day, on_profile)
          values (
            pod.id, mem[i], pod.habit_id,
            format('https://picsum.photos/seed/pm-%s-%s-%s/720/1280', right(pod.id::text, 2), right(mem[i]::text, 2), day_index),
            captions[1 + ((i + day_index) % array_length(captions, 1))],
            shot, local_day, (day_index % 4 = 0)
          );
        end if;
      end loop;
    end loop;
  end loop;
end $$;

alter table public.snaps enable trigger snaps_before_insert;

-- Make demo pods look like busy communities: extra lifetime snaps on top of the seeded ones
-- (drives tree stage only). Remove for real data.
update public.trees t set total_snaps = total_snaps + b.bonus
from (values ('reading', 412), ('running', 236), ('swimming', 61), ('meditation', 14), ('gym', 120)) as b(habit, bonus)
join public.pods p on p.habit_id = b.habit
where t.pod_id = p.id;

-- ─── Follows ──────────────────────────────────────────────────────────────────
-- Ben ↔ Maya, Theo, Jonas are mutual (so they can DM). Ben follows Priya, she doesn't follow back.
-- Aisha is private: Maya is an approved follower; Ben's request is still pending.

insert into public.follows (follower_id, followee_id, status)
select ('a0000000-0000-4000-8000-00000000000' || f.a)::uuid, ('a0000000-0000-4000-8000-00000000000' || f.b)::uuid, f.status
from (values
  (1, 2, 'accepted'), (2, 1, 'accepted'),
  (1, 3, 'accepted'), (3, 1, 'accepted'),
  (1, 5, 'accepted'), (5, 1, 'accepted'),
  (1, 4, 'accepted'),
  (2, 4, 'accepted'), (4, 2, 'accepted'),
  (2, 6, 'accepted'),
  (1, 6, 'pending'),
  (6, 2, 'accepted')
) as f(a, b, status);

-- ─── Cheers, views, flags ─────────────────────────────────────────────────────

-- Podmates cheer each other's recent snaps.
insert into public.cheers (snap_id, user_id)
select s.id, uh.user_id
from public.snaps s
join public.user_habits uh on uh.pod_id = s.pod_id and uh.user_id <> s.user_id
where s.taken_at > now() - interval '3 days'
  and (hashtext(s.id::text || uh.user_id::text) % 3) = 0;

-- Ben has watched some of today's snaps.
insert into public.snap_views (snap_id, user_id)
select s.id, 'a0000000-0000-4000-8000-000000000001'
from public.snaps s
where s.taken_at > now() - interval '24 hours'
  and s.pod_id in ('b0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004');

-- One of Jonas's Reading snaps from yesterday was flagged by the other five members:
-- it is hidden and waiting for team review (Ben is an admin).
insert into public.snap_flags (snap_id, user_id)
select s.id, uh.user_id
from (select id, pod_id, user_id from public.snaps
      where pod_id = 'b0000000-0000-4000-8000-000000000001' and user_id = 'a0000000-0000-4000-8000-000000000005'
        and day = (now() at time zone 'America/Edmonton')::date - 1) s
join public.user_habits uh on uh.pod_id = s.pod_id and uh.user_id <> s.user_id;

-- ─── Posts (now inside pods) ──────────────────────────────────────────────────

insert into public.posts (id, pod_id, user_id, title, body, image_url, created_at)
select ('d0000000-0000-4000-8000-0000000000' || lpad(p.n::text, 2, '0'))::uuid,
       ('b0000000-0000-4000-8000-0000000000' || lpad(p.pod::text, 2, '0'))::uuid,
       ('a0000000-0000-4000-8000-00000000000' || p.u)::uuid,
       p.title, p.body,
       case when p.img then format('https://picsum.photos/seed/post%s/1080/720', p.n) end,
       now() - p.ago
from (values
  (1, 1, 2, 'Finished my 30th book this year thanks to the Reading pod', 'One snap a day, any time. Two rest days a week got me through exams without losing my streak, and watching the pod tree fill up at night is weirdly motivating.', true, interval '4 hours'),
  (2, 1, 1, 'Why "never miss twice" beats perfect streaks', 'Missing one day barely matters. Missing two starts a new habit. That''s what rest days are for: plan the miss instead of breaking the chain.', false, interval '6 hours'),
  (3, 2, 3, 'First sub-25 5K! 24:51 🎉', 'Six weeks of daily run snaps. Never thought I''d be a morning runner.', true, interval '9 hours'),
  (4, 3, 4, 'Tips for not dreading the cold pool at 7am?', 'My streak is alive but the first minute in the water is brutal.', false, interval '11 hours'),
  (5, 1, 5, 'Project Hail Mary is the perfect "read before bed" book', 'Short chapters, every one ends on a hook. Dangerous at 1am.', true, interval '14 hours'),
  (6, 4, 2, 'Ten minutes a day for 60 days — what changed', 'Less reactive, sleeping better, and I actually notice when I''m about to doomscroll.', false, interval '20 hours'),
  (7, 5, 3, 'Form check: is my deadlift hinge okay?', 'Filmed from the side. Be honest.', true, interval '1 day'),
  (8, 3, 4, 'The 2-minute rule, applied to swimming', 'Goal isn''t 1 km. Goal is "get in the water". The kilometre follows.', false, interval '1 day 4 hours'),
  (9, 2, 5, 'Rainy-day treadmill playlist thread', 'Drop your best 170 bpm tracks.', false, interval '1 day 8 hours'),
  (10, 1, 6, 'Your shelf this month 📸', 'Show us what''s on the nightstand.', true, interval '2 days')
) as p(n, pod, u, title, body, img, ago);

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
  (1, 5, 'Watching the pod tree go green at night is my favourite part.', interval '3 hours'),
  (1, 1, 'Congrats! What was your favourite of the 30?', interval '2 hours'),
  (1, 2, 'Piranesi, no contest.', interval '1 hour'),
  (2, 3, 'This reframed streaks for me.', interval '5 hours'),
  (3, 1, 'Huge! Morning runners represent 🌅', interval '8 hours'),
  (3, 5, 'Next stop sub-24', interval '7 hours'),
  (4, 6, 'Count down from 3 and just go. Thinking is the enemy.', interval '10 hours'),
  (4, 1, 'Warm shower first, then straight in.', interval '9 hours'),
  (5, 6, 'Adding to my list', interval '13 hours'),
  (7, 5, 'Hips are shooting up a little early. Otherwise solid.', interval '22 hours')
) as c(p, u, body, ago);

-- ─── Direct messages (between mutual follows only) ───────────────────────────

-- Ben has read everything except Jonas's latest, so one thread shows as unread.
insert into public.direct_messages (sender_id, recipient_id, body, created_at, read_at)
select s.id, r.id, v.body, now() - v.ago, case when v.sender = 'jonas.k' then null else now() - v.ago + interval '5 minutes' end
from (values
  ('maya.reads', 'ben', 'Finished chapter 9 last night, no spoilers!', interval '5 hours'),
  ('ben', 'maya.reads', 'Haha I''m two behind. Tonight for sure', interval '4 hours 40 minutes'),
  ('maya.reads', 'ben', 'Snap it or it didn''t happen 📸', interval '4 hours 30 minutes'),
  ('theo_runs', 'ben', 'Long run Saturday? 10k loop by the river', interval '1 day 2 hours'),
  ('ben', 'theo_runs', 'In. 7am?', interval '1 day 1 hour'),
  ('jonas.k', 'ben', 'Your reading streak is looking good this week', interval '3 hours')
) as v(sender, recipient, body, ago)
join public.profiles s on s.username = v.sender
join public.profiles r on r.username = v.recipient;
