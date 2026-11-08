/**
 * Pair settlement: a podmate pair's tree and streak, settled like a pod of two.
 * A person counts as "snapped" on a day if they made an on-time contribution in
 * any pod the two share. Every number comes from @podmates/tree-engine; this
 * module only gathers inputs and persists outputs (via apply_pair_settlement).
 */
import type { DbClient } from '@podmates/db'
import { podDate } from '@podmates/shared'
import { newTree, perfectStreak, settleDay, type TreeState } from '@podmates/tree-engine'
import { addDays, daysToSettle } from './dates'

export interface PairSettleOptions {
  /** Only this pair (either order). Default: every pair. */
  pair?: [string, string]
  /** Also close today (local demo "end the day now"). */
  throughToday?: boolean
  now?: Date
}

interface SharedPod {
  id: string
  timeZone: string
  /** When the later of the two joined it. */
  since: string
}

/** Stored order: the smaller id first, so a pair has one row. */
export const pairKey = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x])

/** Every pair who shares a pod right now, with the pods they share. */
async function sharedPods(db: DbClient, only?: [string, string]) {
  let query = db.from('pod_members').select('pod_id, user_id, joined_at, pod:pods!inner(timezone)')
  if (only) query = query.in('user_id', only)
  const { data, error } = await query
  if (error) throw error

  const byPod = new Map<string, typeof data>()
  for (const row of data ?? []) byPod.set(row.pod_id, [...(byPod.get(row.pod_id) ?? []), row])

  const pairs = new Map<string, { a: string; b: string; pods: SharedPod[] }>()
  for (const [podId, rows] of byPod) {
    for (const x of rows) {
      for (const y of rows) {
        if (x.user_id >= y.user_id) continue
        const key = `${x.user_id}:${y.user_id}`
        const entry = pairs.get(key) ?? { a: x.user_id, b: y.user_id, pods: [] }
        entry.pods.push({ id: podId, timeZone: x.pod.timezone, since: x.joined_at > y.joined_at ? x.joined_at : y.joined_at })
        pairs.set(key, entry)
      }
    }
  }
  return [...pairs.values()]
}

/** The pair's current day: the earliest local date across the pods they share (null if they share none). */
export async function pairToday(db: DbClient, x: string, y: string, now = new Date()) {
  const [a, b] = pairKey(x, y)
  const pair = (await sharedPods(db, [a, b])).find((p) => p.a === a && p.b === b)
  return pair ? pair.pods.map((p) => podDate(now, p.timeZone)).sort()[0]! : null
}

/** Settles every pair-day that has ended. Returns how many pair-days were written. */
export async function settlePairsDue(db: DbClient, { pair, throughToday = false, now = new Date() }: PairSettleOptions = {}) {
  const only = pair ? pairKey(...pair) : undefined
  const pairs = await sharedPods(db, only)
  let settledDays = 0

  for (const { a, b, pods } of pairs) {
    if (only && (a !== only[0] || b !== only[1])) continue
    // A pair-day ends once it has ended in every pod they share.
    const today = pods.map((p) => podDate(now, p.timeZone)).sort()[0]!
    const through = throughToday ? today : addDays(today, -1)

    const { data: existing, error: tErr } = await db
      .from('pair_trees')
      .select('hp, max_hp, growth, status, streak, last_settled_date')
      .eq('user_a', a)
      .eq('user_b', b)
      .maybeSingle()
    if (tErr) throw tErr

    let tree: TreeState
    let streak: number
    let last: string
    if (existing) {
      tree = { hp: existing.hp, maxHp: existing.max_hp, growth: existing.growth, status: existing.status as TreeState['status'] }
      streak = existing.streak
      last = existing.last_settled_date
    } else {
      // A new pair's tree starts the day they first shared a pod; like a new pod, that day isn't scored.
      tree = newTree()
      streak = 0
      last = pods.map((p) => podDate(new Date(p.since), p.timeZone)).sort()[0]!
      const { error } = await db
        .from('pair_trees')
        .upsert({ user_a: a, user_b: b, hp: tree.hp, max_hp: tree.maxHp, growth: tree.growth, status: tree.status, last_settled_date: last }, { onConflict: 'user_a,user_b', ignoreDuplicates: true })
      if (error) throw error
    }

    const days = daysToSettle(last, through)
    if (!days.length) continue

    const { data: contributions, error: cErr } = await db
      .from('contributions')
      .select('user_id, pod_date')
      .in('pod_id', pods.map((p) => p.id))
      .in('user_id', [a, b])
      .gte('pod_date', days[0]!)
      .lte('pod_date', days[days.length - 1]!)
    if (cErr) throw cErr

    for (const day of days) {
      const snapped = new Set((contributions ?? []).filter((c) => c.pod_date === day).map((c) => c.user_id))
      const r = settleDay(tree, [a, b].map((userId) => ({ userId, streak: 0, contributed: snapped.has(userId) })))
      const nextStreak = perfectStreak(streak, r.outcome)

      const { data: applied, error: aErr } = await db.rpc('apply_pair_settlement', {
        p_user_a: a,
        p_user_b: b,
        p_pair_date: day,
        p_expected_last: last,
        p_tree: { hp: r.tree.hp, max_hp: r.tree.maxHp, growth: r.tree.growth, status: r.tree.status, streak: nextStreak },
        p_day: { outcome: r.outcome, contributors: r.contributors, hp_delta: r.hpDelta, hp_after: r.tree.hp },
      })
      if (aErr) throw aErr
      if (!applied) break // another worker got there first

      tree = r.tree
      streak = nextStreak
      last = day
      settledDays++
    }
  }
  return settledDays
}
