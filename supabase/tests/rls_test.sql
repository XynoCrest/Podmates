-- RLS tests (pgTAP). Run with `npm run db:test` against a freshly reset local DB.
begin;
select plan(65);

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

-- ─── Safety and well-being ────────────────────────────────────────────────────
-- Rest days: open Zen Den's window now (as the database owner) and clear any snap of Ben's today.
reset role;
update public.pods set snap_time = date_trunc('minute', (now() at time zone timezone)::time), window_minutes = 5 where id = 'b0000000-0000-4000-8000-000000000005';
delete from public.contributions where pod_id = 'b0000000-0000-4000-8000-000000000005' and user_id = 'a0000000-0000-4000-8000-000000000001';
set local role authenticated;
select is(public.rest_today('b0000000-0000-4000-8000-000000000005'), (now() at time zone (select timezone from public.pods where id = 'b0000000-0000-4000-8000-000000000005'))::date, 'Ben can take a rest day while the window is open');
select is((select me_resting_today from public.pod_overview where id = 'b0000000-0000-4000-8000-000000000005'), true, 'The pod summary shows Ben resting');
select lives_ok($$ select public.cancel_rest('b0000000-0000-4000-8000-000000000005') $$, 'Ben can cancel his rest day');
select is((select count(*)::int from public.rest_days where pod_id = 'b0000000-0000-4000-8000-000000000005' and user_id = 'a0000000-0000-4000-8000-000000000001'), 0, 'Cancelling removes it');
select throws_ok(
  $$ insert into public.rest_days (pod_id, user_id, pod_date) values ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', current_date) $$,
  '42501', null, 'Rest days are only written through rest_today'
);

-- Removing and leaving. Ben owns Atomic Habits Club; Maya owns Zen Den.
select throws_ok($$ select public.remove_pod_member('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002') $$, '42501', null, 'Only the pod''s owner can remove members');
select lives_ok($$ select public.remove_pod_member('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003') $$, 'The owner can remove a member');
select lives_ok($$ select public.leave_pod('b0000000-0000-4000-8000-000000000001') $$, 'Ben can leave a pod he owns');
select is((select count(*)::int from public.pods where id = 'b0000000-0000-4000-8000-000000000001'), 0, 'After leaving, Ben no longer sees the pod');
reset role;
select is((select count(*)::int from public.pod_members where pod_id = 'b0000000-0000-4000-8000-000000000001' and role = 'owner'), 1, 'Ownership passes to someone still in the pod');
set local role authenticated;

-- Blocks: Ben blocks Maya (they still share Zen Den).
select ok((select count(*) from public.snaps where user_id = 'a0000000-0000-4000-8000-000000000002') > 0, 'Before blocking, Ben sees Maya''s snaps');
insert into public.blocks (blocked_id) values ('a0000000-0000-4000-8000-000000000002');
select is((select count(*)::int from public.snaps where user_id = 'a0000000-0000-4000-8000-000000000002'), 0, 'After blocking, Ben no longer sees Maya''s snaps');
select is((select count(*)::int from public.messages where user_id = 'a0000000-0000-4000-8000-000000000002'), 0, 'or her chat messages');
select throws_ok(
  $$ insert into public.direct_messages (recipient_id, body) values ('a0000000-0000-4000-8000-000000000002', 'hi') $$,
  '42501', null, 'Ben cannot message someone he blocked'
);

-- Reports: Ben reports someone else's snap. It is hidden from him only.
insert into public.reports (target_type, target_id, reason)
select 'snap', id, 'fake' from public.snaps where user_id <> 'a0000000-0000-4000-8000-000000000001' order by id limit 1;
select is(
  (select count(*)::int from public.snaps where id = (select target_id from public.reports where reporter_id = 'a0000000-0000-4000-8000-000000000001' and target_type = 'snap')),
  0, 'A reported snap is hidden from the reporter'
);
reset role;
create temp table reported as select r.target_id, s.user_id as author from public.reports r join public.snaps s on s.id = r.target_id where r.reporter_id = 'a0000000-0000-4000-8000-000000000001';
grant select on reported to authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select author from reported)::text, 'role', 'authenticated')::text, true);
set local role authenticated;
select is((select count(*)::int from public.snaps where id = (select target_id from reported)), 1, 'The snap''s author still sees it');
select is((select count(*)::int from public.reports), 0, 'Nobody can read someone else''s reports');

-- ─── Abuse guards ─────────────────────────────────────────────────────────────
-- Back to Ben, and a copy of Atomic Habits Club's code for Theo (who was removed above).
reset role;
create temp table p1_code as select invite_code from public.pods where id = 'b0000000-0000-4000-8000-000000000001';
grant select on p1_code to authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

insert into public.messages (pod_id, body, created_at) values ('b0000000-0000-4000-8000-000000000002', 'from the future', '2099-01-01');
select ok((select created_at <= now() from public.messages where body = 'from the future'), 'Clients can''t backdate or future-date chat messages');
insert into public.direct_messages (recipient_id, body, read_at) values ('a0000000-0000-4000-8000-000000000005', 'pre-read', now());
select is((select read_at from public.direct_messages where body = 'pre-read'), null, 'Clients can''t send a DM already marked read');
insert into public.posts (community_id, title, body, score, comment_count)
select community_id, 'Inflated', 'x', 99999, 500 from public.community_members where user_id = 'a0000000-0000-4000-8000-000000000001' limit 1;
select is((select score + comment_count from public.posts where title = 'Inflated'), 0, 'Clients can''t set a post''s score or comment count');
select throws_ok(
  $$ update public.post_votes set post_id = post_id where user_id = 'a0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'A vote can''t be moved to another post'
);
select throws_ok(
  $$ select public.create_pod('Odd zone', 'reading', 'x', '08:00', 'Factory', 20) $$,
  '22023', null, 'Timezones must be region names the app can use'
);
select lives_ok($$ select public.create_pod('Seconds', 'reading', 'x', '08:00:30', 'America/Edmonton', 20) $$, 'A pod can be created with a region timezone');
select is((select snap_time from public.pods where name = 'Seconds'), '08:00:00'::time, 'Snap times are stored as whole minutes');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok(
  $$ select public.join_pod((select invite_code from p1_code)) $$,
  '42501', null, 'Someone removed from a pod can''t rejoin with its code'
);

-- ─── Friend requests ──────────────────────────────────────────────────────────
-- Maya and Aisha share no pod; Maya and Jonas share Dawn Patrol.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok($$ select public.send_friend_request('a0000000-0000-4000-8000-000000000006') $$, 'P0001', null, 'A request to someone you share no pod with must name a pod');
select throws_ok($$ select public.send_friend_request('a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000004') $$, '42501', null, 'You can only invite people to your own pods');
select lives_ok($$ select public.send_friend_request('a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005') $$, 'Maya can ask Aisha to be friends in Zen Den');
select throws_ok($$ select public.send_friend_request('a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005') $$, 'P0001', null, 'Only one open request per pair');
select throws_ok($$ insert into public.friendships (user_a, user_b) values ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000006') $$, '42501', null, 'Clients can''t make friendships directly');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000006","role":"authenticated"}', true);
select is((select pod_name from public.my_friend_requests() where incoming), 'Zen Den', 'Aisha sees the request and the pod it would add her to');
select is(public.respond_friend_request((select id from public.my_friend_requests() where incoming), true), 'b0000000-0000-4000-8000-000000000005'::uuid, 'Accepting returns the pod joined');
select ok(exists (select 1 from public.pod_members where pod_id = 'b0000000-0000-4000-8000-000000000005' and user_id = 'a0000000-0000-4000-8000-000000000006'), 'Accepting joins the pod');
select is((select count(*)::int from public.friendships), 1, 'and makes them friends');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select lives_ok($$ select public.send_friend_request('a0000000-0000-4000-8000-000000000005') $$, 'Podmates can become friends without picking a pod');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select ok((select pod_id is null from public.my_friend_requests() where incoming), 'A request between podmates carries no pod');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select lives_ok($$ select public.cancel_friend_request((select id from public.my_friend_requests() where not incoming)) $$, 'The sender can cancel a request');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select is((select count(*)::int from public.my_friend_requests()), 0, 'A cancelled request disappears');

-- Blocks: after Aisha blocks Theo, he can't send her a request.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000006","role":"authenticated"}', true);
insert into public.blocks (blocked_id) values ('a0000000-0000-4000-8000-000000000003');
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($$ select public.send_friend_request('a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003') $$, '42501', null, 'No requests across a block');

select * from finish();
rollback;
