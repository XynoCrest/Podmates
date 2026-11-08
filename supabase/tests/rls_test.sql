-- RLS tests (pgTAP). Run with `npm run db:test` against a freshly reset local DB.
begin;
select plan(12);

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
  $$ update public.profiles set energy = 9999 where id = 'a0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Energy is settlement-owned (column grant)'
);
-- No update policy on trees: the write matches zero rows rather than raising.
update public.trees set hp = 999 where pod_id = 'b0000000-0000-4000-8000-000000000001';
select isnt((select hp from public.trees where pod_id = 'b0000000-0000-4000-8000-000000000001'), 999, 'Clients cannot touch tree health');
select throws_ok(
  $$ select public.apply_day_settlement('b0000000-0000-4000-8000-000000000001', current_date, current_date, '{}', '{}', '[]', 'x', now()) $$,
  '42501', null, 'Clients cannot call the settlement writer'
);

-- Joining by invite code works through the RPC.
select isnt(public.join_pod('IRONPT'), null, 'Ben can join Iron Pact with its invite code');
select is((select count(*)::int from public.pods), 6, 'After joining, Ben sees Iron Pact');

select * from finish();
rollback;
