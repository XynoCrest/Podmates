/**
 * Settlement: turns a pod's finished days into tree and streak changes. Every number comes from @podmates/tree-engine; this module only
 * gathers inputs and persists outputs (atomically, via apply_day_settlement).
 */
import type { DbClient } from '@podmates/db'
import { parseSnapTime, podDate, zonedParts, type SettledDay } from '@podmates/shared'
import { settleDay, type MemberDay, type TreeState } from '@podmates/tree-engine'
import { addDays, daysToSettle, endOfLocalDay } from './dates'
import type { SettleOptions } from './types'

export async function settleDue(db: DbClient, { podId, throughToday = false, now = new Date(), onError }: SettleOptions = {}) {
  let query = db.from('pods').select('id, timezone, snap_time, window_minutes, trees!inner(hp, max_hp, growth, status, last_settled_date)')
  if (podId) query = query.eq('id', podId)
  const { data: pods, error } = await query
  if (error) throw error

  const settled: SettledDay[] = []
  const touchedUsers = new Set<string>()

  try {
    for (const pod of pods ?? []) {
      try {
        await settlePod(pod)
      } catch (err) {
        if (!onError) throw err
        onError(pod.id, err)
      }
    }
  } finally {
    // Even if a pod failed, refresh the profiles of everyone whose streak already changed.
    if (touchedUsers.size) {
      const { error: pErr } = await db.rpc('refresh_profile_stats', { p_user_ids: [...touchedUsers] })
      if (pErr) throw pErr
    }
  }
  return settled

  async function settlePod(pod: NonNullable<typeof pods>[number]) {
    const t = pod.trees
    if (!t) return
    const today = podDate(now, pod.timezone)
    const through = throughToday ? today : addDays(today, -1)
    const days = daysToSettle(t.last_settled_date, through)
    if (!days.length) return

    const { data: members, error: mErr } = await db
      .from('pod_members')
      .select('user_id, streak, best_streak, joined_at')
      .eq('pod_id', pod.id)
    if (mErr) throw mErr
    const { data: contributions, error: cErr } = await db
      .from('contributions')
      .select('user_id, pod_date')
      .eq('pod_id', pod.id)
      .gte('pod_date', days[0]!)
      .lte('pod_date', days[days.length - 1]!)
    if (cErr) throw cErr
    const { data: rests, error: rErr } = await db
      .from('rest_days')
      .select('user_id, pod_date')
      .eq('pod_id', pod.id)
      .gte('pod_date', days[0]!)
      .lte('pod_date', days[days.length - 1]!)
    if (rErr) throw rErr

    let tree: TreeState = { hp: t.hp, maxHp: t.max_hp, growth: t.growth, status: t.status as TreeState['status'] }
    const streaks = new Map((members ?? []).map((m) => [m.user_id, m.streak]))
    const bests = new Map((members ?? []).map((m) => [m.user_id, m.best_streak]))
    let last = t.last_settled_date

    for (const day of days) {
      // A member counts towards a day if they had joined before that day's window closed: someone who
      // joins after it can't snap on time, so counting them would cost the pod HP for nothing.
      const windowEnd = parseSnapTime(pod.snap_time) + pod.window_minutes
      const active = (members ?? []).filter((m) => {
        const joined = zonedParts(new Date(m.joined_at), pod.timezone)
        return joined.date < day || (joined.date === day && joined.minuteOfDay < windowEnd)
      })
      const contributed = new Set((contributions ?? []).filter((c) => c.pod_date === day).map((c) => c.user_id))
      const rested = new Set((rests ?? []).filter((r) => r.pod_date === day).map((r) => r.user_id))
      const memberDays: MemberDay[] = active.map((m) => ({
        userId: m.user_id,
        streak: streaks.get(m.user_id) ?? 0,
        bestStreak: bests.get(m.user_id) ?? 0,
        contributed: contributed.has(m.user_id),
        rested: rested.has(m.user_id),
      }))
      const r = settleDay(tree, memberDays)

      const { data: applied, error: aErr } = await db.rpc('apply_day_settlement', {
        p_pod_id: pod.id,
        p_pod_date: day,
        p_expected_last: last,
        p_tree: { hp: r.tree.hp, max_hp: r.tree.maxHp, growth: r.tree.growth, status: r.tree.status },
        p_day: { outcome: r.outcome, contributors: r.contributors, members: r.members, hp_delta: r.hpDelta, hp_after: r.tree.hp },
        p_members: r.memberUpdates.map((u) => ({
          user_id: u.userId,
          streak: u.streak,
          best_streak: u.bestStreak,
        })),
        p_message: r.summary,
        // A replayed day's summary lands at that day's midnight; "end the day now" lands now.
        p_message_at: (day === today ? now : endOfLocalDay(day, pod.timezone)).toISOString(),
      })
      if (aErr) throw aErr
      if (!applied) break // another worker got there first; it will finish this pod

      tree = r.tree
      last = day
      for (const u of r.memberUpdates) {
        streaks.set(u.userId, u.streak)
        bests.set(u.userId, u.bestStreak)
        touchedUsers.add(u.userId)
      }
      settled.push({
        podId: pod.id,
        podDate: day,
        outcome: r.outcome,
        contributors: r.contributors,
        members: r.members,
        hpDelta: r.hpDelta,
        hpAfter: r.tree.hp,
        died: r.died,
      })
    }
  }
}
