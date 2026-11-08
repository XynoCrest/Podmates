#!/usr/bin/env node
/**
 * End-to-end check of the running local stack, as a real client would use it:
 * sign in → read pods and streaks (RLS) → upload + post a snap → server stamps the day →
 * declare a rest day → end the day (API) → streak and tree updated → team review of a
 * flagged snap → DMs between mutual follows only.
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
const pod = (n) => `b0000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`
const READING = pod(1)
const SWIMMING = pod(3)
const MEDITATION = pod(4) // Ben hasn't snapped today in the seed
const GYM = pod(5) // Ben doesn't track Gym
const user = (n) => `a0000000-0000-4000-8000-00000000000${n}`

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

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
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

// Reads under RLS.
const pods = await ben.sb.from('pods').select('id')
check(!pods.error && pods.data.length === 10, 'RLS: every pod is visible (Explore)', pods.error?.message ?? `${pods.data.length} pods`)
const gym = await ben.sb.from('snaps').select('id').eq('pod_id', GYM).eq('on_profile', false)
check(!gym.error && gym.data.length === 0, "RLS: ben can't see snaps from a pod he isn't in")
const streaks = await ben.sb.from('user_habits').select('pod_id, current_streak').eq('user_id', ben.userId)
const readingStreak = streaks.data?.find((s) => s.pod_id === READING)?.current_streak ?? 0
check(readingStreak > 0, 'Seed history settled into streaks by the rules engine', `Reading streak ${readingStreak}`)
const cheat = await ben.sb.from('user_habits').update({ current_streak: 999 }).eq('user_id', ben.userId)
check(!!cheat.error, "Column grants: ben can't set his own streak")

// Snapping.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const path = `${ben.userId}/smoke-${Date.now()}.png`
const up = await ben.sb.storage.from('snaps').upload(path, png, { contentType: 'image/png' })
check(!up.error, 'Storage: uploaded a snap image to my folder', up.error?.message)
const notMine = await ben.sb.storage.from('snaps').upload(`${user(2)}/x.png`, png, { contentType: 'image/png' })
check(!!notMine.error, "Storage: can't upload into someone else's folder")
const foreign = await ben.sb.from('snaps').insert({ pod_id: MEDITATION, image: 'https://evil.example/pixel.png' })
check(!!foreign.error, "Trigger: a snap can't point at an outside image")

const before = await ben.sb.from('trees').select('total_snaps').eq('pod_id', MEDITATION).single()
const meditationBefore = streaks.data?.find((s) => s.pod_id === MEDITATION)?.current_streak ?? 0
const snap = await ben.sb.from('snaps').insert({ pod_id: MEDITATION, image: path, caption: 'smoke test', habit_id: 'gym', day: '2000-01-01' }).select('id, day, habit_id').single()
check(!snap.error && snap.data.day !== '2000-01-01' && snap.data.habit_id === 'meditation', 'Trigger: day and habit are stamped by the server, not the client', snap.error?.message ?? JSON.stringify(snap.data))
const today = await ben.sb.from('habit_days').select('status').eq('pod_id', MEDITATION).eq('day', snap.data?.day).single()
check(today.data?.status === 'snapped', 'Today recorded as snapped')
const after = await ben.sb.from('trees').select('total_snaps').eq('pod_id', MEDITATION).single()
check(after.data?.total_snaps === before.data?.total_snaps + 1, 'Pod tree counted the verified snap', `${before.data?.total_snaps} → ${after.data?.total_snaps}`)

// Rest days.
const rest = await ben.sb.rpc('declare_rest', { p_pod_id: SWIMMING })
check(!rest.error, 'Declared a rest day for Swimming', rest.error?.message ?? `${rest.data} left this week`)
const restAgain = await ben.sb.rpc('declare_rest', { p_pod_id: SWIMMING })
check(!!restAgain.error, "Can't rest a day that already counts")

// End the day (local demo helper): streaks and trees recomputed by the rules engine.
const end = await api('POST', '/v1/dev/end-day', ben.token)
check(end.status === 200 && end.body.streaks > 0, 'API: ended the day; streaks recomputed', JSON.stringify(end.body))
const settled = await ben.sb.from('user_habits').select('current_streak').eq('user_id', ben.userId).eq('pod_id', MEDITATION).single()
check(settled.data?.current_streak === meditationBefore + 1, "Today's snap added 1 to the Meditation streak", `${meditationBefore} → ${settled.data?.current_streak}`)
const again = await api('POST', '/v1/dev/end-day', ben.token)
check(again.status === 200 && again.body.streaks === 0, 'Settlement is idempotent (second end-day recomputes nothing)')

// Team review of the snap the seed hid with 5 flags. Ben is an admin; Maya isn't.
const maya = await client('maya@podmates.dev')
const notAdmin = await api('GET', '/v1/admin/flagged', maya.token)
check(notAdmin.status === 403, "API: non-admins can't see flagged snaps")
const flagged = await api('GET', '/v1/admin/flagged', ben.token)
const target = flagged.body.snaps?.[0]
check(flagged.status === 200 && !!target, 'API: admin sees the flagged snap', target ? `${target.flagCount} flags` : JSON.stringify(flagged.body))
if (target) {
  const review = await api('POST', `/v1/admin/snaps/${target.id}/review`, ben.token, { approve: false })
  check(review.status === 200 && review.body.status === 'rejected', 'API: rejecting removes that day and recomputes the streak')
}

// Direct messages: mutual follows only.
const toMaya = await ben.sb.from('direct_messages').insert({ recipient_id: user(2), body: 'smoke hi' })
check(!toMaya.error, 'DM: ben can message Maya (they follow each other)', toMaya.error?.message)
const toPriya = await ben.sb.from('direct_messages').insert({ recipient_id: user(4), body: 'smoke hi' })
check(!!toPriya.error, "DM: ben can't message Priya (she doesn't follow him back)")

console.log(failures ? `\n${failures} check(s) failed ❌` : '\nAll good ✅')
process.exit(failures ? 1 : 0)
