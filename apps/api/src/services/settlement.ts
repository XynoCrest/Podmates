/**
 * Settlement: turns raw activity (habit_days) into streaks and tree health.
 * Every number comes from @podmates/tree-engine; this module only gathers inputs
 * and persists outputs through the service-only RPCs apply_streaks / apply_tree_health.
 *
 * Streaks are recomputed from history, so running this twice (or after a rejected
 * snap invalidates settled_through) is always safe.
 */
import type { DbClient } from '@podmates/db'
import { podDate as localDate } from '@podmates/shared'
import { addDays, settleStreak, treeHealth, type DayStatus, type MemberToday } from '@podmates/tree-engine'
import type { SettleOptions } from './types'

interface Membership {
  user_id: string
  pod_id: string
  current_streak: number
  best_streak: number
  settled_through: string | null
  joined_at: string
  profile: { timezone: string } | null
}

async function memberships(db: DbClient, userId?: string): Promise<Membership[]> {
  let q = db.from('user_habits').select('user_id, pod_id, current_streak, best_streak, settled_through, joined_at, profile:profiles(timezone)')
  if (userId) q = q.eq('user_id', userId)
  const { data, error } = await q
  if (error) throw error
  return data as unknown as Membership[]
}

/** Recompute every user-habit whose streak isn't settled through the end of its last finished day. */
export async function settleStreaks(db: DbClient, { userId, throughToday = false, now = new Date() }: SettleOptions = {}) {
  const rows: { user_id: string; pod_id: string; current_streak: number; best_streak: number; settled_through: string }[] = []
  for (const m of await memberships(db, userId)) {
    const tz = m.profile?.timezone ?? 'UTC'
    const today = localDate(now, tz)
    const through = throughToday ? today : addDays(today, -1)
    if (m.settled_through && m.settled_through >= through) continue
    const from = localDate(new Date(m.joined_at), tz)

    const { data, error } = await db
      .from('habit_days')
      .select('day, status')
      .eq('user_id', m.user_id)
      .eq('pod_id', m.pod_id)
      .gte('day', from)
      .lte('day', through)
    if (error) throw error
    const days: Record<string, DayStatus> = Object.fromEntries((data ?? []).map((d) => [d.day, d.status as DayStatus]))
    const streak = settleStreak(days, from, through)
    rows.push({ user_id: m.user_id, pod_id: m.pod_id, current_streak: streak.current, best_streak: streak.best, settled_through: through })
  }
  if (rows.length) {
    const { error } = await db.rpc('apply_streaks', { p_rows: rows })
    if (error) throw error
  }
  return rows.length
}

/** Recompute every pod's tree health from its members' settled streaks and what today counts as so far. */
export async function settleTrees(db: DbClient, { now = new Date() }: { now?: Date } = {}) {
  const members = await memberships(db)
  const { data: pods, error: pErr } = await db.from('pods').select('id')
  if (pErr) throw pErr

  // Today's entries for everyone: "today" differs by timezone, so fetch a window and match per member.
  const utcToday = localDate(now, 'UTC')
  const { data: recent, error: dErr } = await db.from('habit_days').select('user_id, pod_id, day, status').gte('day', addDays(utcToday, -1)).lte('day', addDays(utcToday, 1))
  if (dErr) throw dErr
  const entry = new Map((recent ?? []).map((d) => [`${d.user_id}|${d.pod_id}|${d.day}`, d.status as DayStatus]))

  const byPod = new Map<string, MemberToday[]>()
  for (const m of members) {
    const today = localDate(now, m.profile?.timezone ?? 'UTC')
    const list = byPod.get(m.pod_id) ?? []
    list.push({ settledStreak: m.current_streak, today: entry.get(`${m.user_id}|${m.pod_id}|${today}`) ?? null })
    byPod.set(m.pod_id, list)
  }

  const rows = (pods ?? []).map((p) => ({ pod_id: p.id, ...treeHealth(byPod.get(p.id) ?? []) }))
  if (rows.length) {
    const { error } = await db.rpc('apply_tree_health', { p_rows: rows, p_day: utcToday })
    if (error) throw error
  }
  return rows.length
}

/** One full pass: streaks first (tree health reads them), then trees. */
export async function settleAll(db: DbClient, options: SettleOptions = {}) {
  const streaks = await settleStreaks(db, options)
  const trees = await settleTrees(db, { now: options.now })
  return { streaks, trees }
}
