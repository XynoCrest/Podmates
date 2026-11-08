#!/usr/bin/env node
/**
 * End-to-end check of the running local stack, as a real client would use it:
 * sign in → read pods (RLS) → open a snap window (API) → upload + post a snap →
 * server marks it on time → contribution counted → end the day (API) → tree settled.
 *
 *   npm run db:reset && npm run dev:api     # in another terminal
 *   npm run smoke
 *
 * Mutates local data (that's the point). Re-run `npm run db:reset` for a clean slate.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readEnv = (file) =>
  Object.fromEntries(
    readFileSync(join(root, file), 'utf8')
      .split('\n')
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  )

const env = readEnv('apps/mobile/.env.local')
const API = env.EXPO_PUBLIC_API_URL
const POD = 'b0000000-0000-4000-8000-000000000003' // Dawn Patrol 5K (Ben + Theo + Jonas + Maya)
const IRON_PACT = 'b0000000-0000-4000-8000-000000000006' // Ben is not a member

let failures = 0
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '✔' : '✘'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

async function client(email) {
  const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  const { data, error } = await sb.auth.signInWithPassword({ email, password: 'podmates123' })
  if (error) throw new Error(`sign-in ${email}: ${error.message} (did you run npm run db:reset?)`)
  return { sb, token: data.session.access_token, userId: data.user.id }
}

async function api(path, token) {
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' })
  return { status: res.status, body: await res.json() }
}

try {
  const health = await fetch(`${API}/health`).then((r) => r.json())
  check(health.ok === true, 'API is up', `${API} (worker: ${health.worker})`)
} catch {
  console.error(`✘ Can't reach the API at ${API}. Start it with: npm run dev:api`)
  process.exit(1)
}

const ben = await client('ben@podmates.dev')
check(true, 'Signed in as ben')

const pods = await ben.sb.from('pod_overview').select('id, name, hp, max_hp')
check(!pods.error && pods.data.length === 5, 'RLS: ben sees exactly his 5 pods', pods.error?.message ?? `${pods.data.length} pods`)
check(!pods.data?.some((p) => p.id === IRON_PACT), "RLS: ben can't see Iron Pact")
const settledDays = await ben.sb.from('pod_days').select('pod_date').eq('pod_id', POD)
check((settledDays.data?.length ?? 0) >= 12, 'Seed history settled by the tree engine', `${settledDays.data?.length ?? 0} days for Dawn Patrol`)

const sneaky = await ben.sb.from('messages').insert({ pod_id: IRON_PACT, body: 'hi' })
check(!!sneaky.error, "RLS: ben can't post into a pod he isn't in")
const cheat = await ben.sb.from('profiles').update({ energy: 99999 }).eq('id', ben.userId)
check(!!cheat.error, "Column grants: ben can't set his own energy")

const open = await api(`/v1/dev/pods/${POD}/open-window`, ben.token)
check(open.status === 200, 'API: opened the snap window now', open.body.snapTime ?? JSON.stringify(open.body))

// Ben may already have snapped for today in the seed; contributions are one per day either way.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const path = `${ben.userId}/smoke-${Date.now()}.png`
const up = await ben.sb.storage.from('snaps').upload(path, png, { contentType: 'image/png' })
check(!up.error, 'Storage: uploaded a snap image to my folder', up.error?.message)
const notMine = await ben.sb.storage.from('snaps').upload(`a0000000-0000-4000-8000-000000000002/x.png`, png, { contentType: 'image/png' })
check(!!notMine.error, "Storage: can't upload into someone else's folder")

const snap = await ben.sb
  .from('snaps')
  .insert({ pod_id: POD, habit_id: 'gym', image: path, caption: 'smoke test', on_time: false, pod_date: '2000-01-01' })
  .select('on_time, pod_date, habit_id')
  .single()
check(!snap.error && snap.data.on_time === true, 'Trigger: snap stamped on time by the server (client value ignored)', snap.error?.message ?? JSON.stringify(snap.data))
check(snap.data?.habit_id === 'running' && snap.data?.pod_date !== '2000-01-01', 'Trigger: habit and pod-day come from the pod, not the client')

const contributed = await ben.sb.from('contributions').select('user_id').eq('pod_id', POD).eq('pod_date', snap.data?.pod_date).eq('user_id', ben.userId)
check(contributed.data?.length === 1, "Contribution recorded for today's pod-day")
const chat = await ben.sb.from('messages').select('kind').eq('pod_id', POD).order('created_at', { ascending: false }).limit(1).single()
check(chat.data?.kind === 'snap', 'Snap appeared in the pod chat')

const before = await ben.sb.from('trees').select('hp, last_settled_date').eq('pod_id', POD).single()
const end = await api(`/v1/dev/pods/${POD}/end-day`, ben.token)
const day = end.body.settled?.at(-1)
check(end.status === 200 && !!day, 'API: ended the day; tree engine settled it', day ? `${day.outcome} ${day.contributors}/${day.members}, hp ${before.data.hp} → ${day.hpAfter}` : JSON.stringify(end.body))
const after = await ben.sb.from('trees').select('hp, last_settled_date').eq('pod_id', POD).single()
check(after.data?.last_settled_date === snap.data?.pod_date, 'Tree marked settled through today')
const again = await api(`/v1/dev/pods/${POD}/end-day`, ben.token)
check(again.status === 200 && again.body.settled.length === 0, 'Settlement is idempotent (second end-day settles nothing)')

const forbidden = await api(`/v1/pods/${IRON_PACT}/replant`, ben.token)
check(forbidden.status === 403, "API: can't act on a pod you aren't in")

console.log(failures ? `\n${failures} check(s) failed ❌` : '\nAll good ✅')
process.exit(failures ? 1 : 0)
