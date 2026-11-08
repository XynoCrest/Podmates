-- RLS tests (pgTAP). Run with `npm run db:test` against a freshly reset local DB.
-- Seed facts used here: Ben tracks Reading, Running, Swimming, Meditation (not Gym); Ben ↔ Maya
-- follow each other; Ben follows Priya one-way; Aisha is private and Ben's request is pending;
-- one of Jonas's Reading snaps is hidden after 5 flags.
begin;
select plan(28);

-- Fixtures created as the superuser before switching to Ben.
insert into public.direct_messages (sender_id, recipient_id, body)
values ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'just us');
-- An Aisha snap she put on her profile, in Swimming (a pod Ben shares) and in Reading.
insert into public.snaps (pod_id, user_id, image, on_profile)
values ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'https://example.com/a.jpg', true);
-- A Gym snap by Theo (Ben is not in Gym).
insert into public.snaps (pod_id, user_id, image)
values ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000003', 'https://example.com/gym.jpg');

-- Act as Ben.
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}';

-- Pods and trees are public (Explore).
select is((select count(*)::int from public.pods), 10, 'Every pod is visible');
select is((select count(*)::int from public.trees), 10, 'Every tree is visible');
select ok((select count(*) from public.profiles) = 6, 'Profiles are visible to every signed-in user');

-- Snaps: only pods you are in, hidden ones only to their owner.
-- (Gym snaps that people put on their public profile grid stay visible to everyone.)
select is((select count(*)::int from public.snaps where pod_id = 'b0000000-0000-4000-8000-000000000005' and not on_profile), 0, 'Ben cannot see Gym snaps (not his pod)');
select ok((select count(*) from public.snaps where pod_id = 'b0000000-0000-4000-8000-000000000001') > 0, 'Ben sees Reading snaps');
select is((select count(*)::int from public.snaps where hidden), 0, 'Ben cannot see a snap hidden by flags');
select is(
  (select count(*)::int from public.snaps where user_id = 'a0000000-0000-4000-8000-000000000006' and on_profile and pod_id = 'b0000000-0000-4000-8000-000000000003' and image = 'https://example.com/a.jpg'),
  1, 'Pod members see a private user''s snap in their shared pod'
);

-- Writing snaps.
select throws_ok(
  $$ insert into public.snaps (pod_id, image) values ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001/x.jpg') $$,
  '42501', null, 'Ben cannot post into a pod he is not in'
);
select throws_ok(
  $$ insert into public.snaps (pod_id, image) values ('b0000000-0000-4000-8000-000000000001', 'https://evil.example/tracker.png') $$,
  '42501', null, 'Snap images must come from your own upload folder'
);
select lives_ok(
  $$ insert into public.snaps (pod_id, image, caption) values ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001/today.jpg', 'om') $$,
  'Ben can snap into Meditation'
);
select is(
  (select day from public.snaps where caption = 'om'), public.user_today('a0000000-0000-4000-8000-000000000001'),
  'The server stamps the snap with Ben''s local day'
);
select is(
  (select status from public.habit_days where user_id = 'a0000000-0000-4000-8000-000000000001' and pod_id = 'b0000000-0000-4000-8000-000000000004' and day = public.user_today('a0000000-0000-4000-8000-000000000001')),
  'snapped', 'A snap records today as snapped'
);

-- Streaks and trees are settlement-owned.
select throws_ok(
  $$ update public.user_habits set current_streak = 999 where user_id = 'a0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Clients cannot set their own streak (column grant)'
);
update public.trees set health = 0 where pod_id = 'b0000000-0000-4000-8000-000000000001';
select isnt((select health from public.trees where pod_id = 'b0000000-0000-4000-8000-000000000001'), 0::real, 'Clients cannot touch tree health');
select throws_ok($$ select public.apply_streaks('[]') $$, '42501', null, 'Clients cannot call the streak writer');
select throws_ok($$ select public.review_snap('00000000-0000-0000-0000-000000000000', true) $$, '42501', null, 'Clients cannot review flagged snaps');
select is((select count(*)::int from public.habit_days where user_id <> 'a0000000-0000-4000-8000-000000000001'), 0, 'Ben cannot read other people''s day logs');

-- Rest days: two per week, then refused.
select lives_ok($$ select public.declare_rest('b0000000-0000-4000-8000-000000000003') $$, 'Ben can declare a rest day for Swimming');
select throws_ok($$ select public.declare_rest('b0000000-0000-4000-8000-000000000003') $$, '23505', null, 'A day that already counts cannot be rested again');
select throws_ok($$ select public.declare_rest('b0000000-0000-4000-8000-000000000005') $$, '42501', null, 'Ben cannot rest a habit he does not track');

-- Habits: adding joins the pod.
select isnt(public.add_habit('gym'), null, 'Ben can add Gym');
select is((select count(*)::int from public.snaps where pod_id = 'b0000000-0000-4000-8000-000000000005' and image = 'https://example.com/gym.jpg'), 1, 'After adding Gym, Ben sees its snaps');

-- Flags are anonymous; one per person.
select is((select count(*)::int from public.snap_flags), 0, 'Nobody can read who flagged what');

-- Follows and private profiles.
select is(public.request_follow('a0000000-0000-4000-8000-000000000003'), 'accepted', 'Following a public profile is accepted at once');
select is((select status from public.follows where follower_id = 'a0000000-0000-4000-8000-000000000001' and followee_id = 'a0000000-0000-4000-8000-000000000006'), 'pending', 'Ben''s request to private Aisha is pending');

-- Direct messages: mutual follows only.
select lives_ok($$ insert into public.direct_messages (recipient_id, body) values ('a0000000-0000-4000-8000-000000000002', 'hey Maya') $$, 'Ben can DM Maya (mutual follow)');
select throws_ok(
  $$ insert into public.direct_messages (recipient_id, body) values ('a0000000-0000-4000-8000-000000000004', 'hi Priya') $$,
  '42501', null, 'Ben cannot DM Priya (she does not follow him back)'
);
select is((select count(*)::int from public.direct_messages where body = 'just us'), 0, 'Ben cannot read a DM between Maya and Theo');

select * from finish();
rollback;
