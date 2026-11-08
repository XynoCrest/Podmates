-- RLS tests (pgTAP). Run with `npm run db:test` against a freshly reset local DB.
begin;
select plan(26);

-- A private thread Ben is not part of.
insert into public.direct_messages (sender_id, recipient_id, body)
values ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'just us');

-- Act as Ben (member of pods 1–5, not 6 "Iron Pact").
set local role authenticated;
set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is((select count(*)::int from public.pods), 5, 'Ben sees only his own pods');
select is((select count(*)::int from public.pods where id = 'b0000000-0000-4000-8000-000000000006'), 0, 'Ben cannot see Iron Pact');
select is((select count(*)::int from public.messages where pod_id = 'b0000000-0000-4000-8000-000000000006'), 0, 'Ben cannot read Iron Pact chat');
select is((select count(*)::int from public.trees where pod_id = 'b0000000-0000-4000-8000-000000000006'), 0, 'Ben cannot see Iron Pact''s tree');
select ok((select count(*) from public.profiles) = 6, 'Profiles are visible to every signed-in user');

select throws_ok(
  $$ insert into public.messages (pod_id, body) values ('b0000000-0000-4000-8000-000000000006', 'hi') $$,
  '42501', null, 'Ben cannot post into a pod he is not in'
);
select throws_ok(
  $$ insert into public.messages (pod_id, kind, body) values ('b0000000-0000-4000-8000-000000000001', 'system', 'fake') $$,
  '42501', null, 'Clients cannot forge system messages'
);
select throws_ok(
  $$ update public.profiles set streak = 9999 where id = 'a0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Streak is settlement-owned (column grant)'
);
-- No update policy on trees: the write matches zero rows rather than raising.
update public.trees set hp = 999 where pod_id = 'b0000000-0000-4000-8000-000000000001';
select isnt((select hp from public.trees where pod_id = 'b0000000-0000-4000-8000-000000000001'), 999, 'Clients cannot touch tree health');
select throws_ok(
  $$ select public.apply_day_settlement('b0000000-0000-4000-8000-000000000001', current_date, current_date, '{}', '{}', '[]', 'x', now()) $$,
  '42501', null, 'Clients cannot call the settlement writer'
);

-- Direct messages: only the two people in a thread can read it, and you can only send as yourself.
select is((select count(*)::int from public.direct_messages where body = 'just us'), 0, 'Ben cannot read a DM between Maya and Theo');
select throws_ok(
  $$ insert into public.direct_messages (sender_id, recipient_id, body) values ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'spoof') $$,
  '42501', null, 'Ben cannot send a DM as someone else'
);
select lives_ok(
  $$ insert into public.direct_messages (recipient_id, body) values ('a0000000-0000-4000-8000-000000000002', 'hey Maya') $$,
  'Ben can DM a podmate'
);

-- No update policy: a direct write matches zero rows.
update public.direct_messages set read_at = now() where read_at is null;
select is((select count(*)::int from public.direct_messages where read_at is not null and body = 'Your tree is looking healthy this week'), 0, 'Clients cannot write read_at directly');
select is(public.mark_dm_read('a0000000-0000-4000-8000-000000000005'), 1, 'Opening the Jonas thread marks his unread message read');

-- Pod chat read markers: only through the RPC, and only for my own membership.
update public.pod_members set last_read_at = now() - interval '1 day' where pod_id = 'b0000000-0000-4000-8000-000000000001';
select ok((select last_read_at > now() - interval '1 day' from public.pod_members where pod_id = 'b0000000-0000-4000-8000-000000000001' and user_id = 'a0000000-0000-4000-8000-000000000002'), 'Clients cannot write read markers directly');
select public.mark_pod_read('b0000000-0000-4000-8000-000000000001');
select is((select unread_count from public.pod_overview where id = 'b0000000-0000-4000-8000-000000000001'), 0, 'Opening a pod chat clears its unread count');

-- Pair trees: only the two people in a pair can see it, and only settlement writes it.
select is((select count(*)::int from public.pair_trees where 'a0000000-0000-4000-8000-000000000001' not in (user_a, user_b)), 0, 'Ben sees only his own pair trees');
select throws_ok(
  $$ select public.apply_pair_settlement('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', current_date, current_date, '{}', '{}') $$,
  '42501', null, 'Clients cannot call the pair settlement writer'
);

-- Joining by invite code works through the RPC.
select isnt(public.join_pod('IRONPT'), null, 'Ben can join Iron Pact with its invite code');
select is((select count(*)::int from public.pods), 6, 'After joining, Ben sees Iron Pact');

-- Profile numbers (Best, Snaps) are settlement/trigger-owned, like the streak.
select throws_ok(
  $$ update public.profiles set best_streak = 999 where id = 'a0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Best streak is settlement-owned (column grant)'
);
select throws_ok(
  $$ update public.profiles set snap_count = 999 where id = 'a0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Snap count is trigger-owned (column grant)'
);
select ok((select snap_count from public.profiles where username = 'maya.reads') > 0, 'Anyone signed in can read another person''s snap count');

-- Banner: you can set your own, not someone else's (no matching row to update).
select lives_ok($$ update public.profiles set banner_url = 'a0000000-0000-4000-8000-000000000001/banner.jpg' where id = 'a0000000-0000-4000-8000-000000000001' $$, 'Ben can set his own banner');
update public.profiles set banner_url = 'x' where username = 'maya.reads';
select is((select banner_url from public.profiles where username = 'maya.reads'), null, 'Ben cannot change Maya''s banner');

select * from finish();
rollback;
