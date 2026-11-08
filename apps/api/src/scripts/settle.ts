/**
 * One-off settlement: `npm run settle` (repo root). Recomputes every streak whose
 * last day has ended, then every tree — the same thing the worker does each tick.
 * Used after db:reset to turn the seeded history into streaks and tree health.
 */
import { createAdminClient } from '@podmates/db/server'
import { loadEnv } from '../env'
import { settleAll } from '../services/settlement'

const env = loadEnv()
const db = createAdminClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
const { streaks, trees } = await settleAll(db)
console.log(`settled ${streaks} streak(s) and ${trees} tree(s)`)
