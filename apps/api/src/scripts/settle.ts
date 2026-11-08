/**
 * One-off settlement: `npm run settle` (repo root). Settles every pod-day that
 * has ended — the same thing the worker does each tick. Used after db:reset.
 */
import { createAdminClient } from '@podmates/db/server'
import { loadEnv } from '../env'
import { settlePairsDue } from '../services/pairSettlement'
import { settleDue } from '../services/settlement'

const env = loadEnv()
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
const settled = await settleDue(db)
const byOutcome = settled.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.outcome]: (acc[d.outcome] ?? 0) + 1 }), {})
console.log(`settled ${settled.length} pod-day(s)`, byOutcome)
console.log(`settled ${await settlePairsDue(db)} podmate pair-day(s)`)
