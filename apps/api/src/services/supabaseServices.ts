import type { DbClient } from '@podmates/db'
import { podDate, zonedParts } from '@podmates/shared'
import { newTree } from '@podmates/tree-engine'
import { HttpError } from '../lib/httpError'
import { pairKey, pairToday, settlePairsDue } from './pairSettlement'
import { settleDue } from './settlement'
import type { Services } from './types'

export function createSupabaseServices(db: DbClient): Services {
  async function loadPod(podId: string) {
    const { data, error } = await db.from('pods').select('id, timezone, window_minutes, trees(status)').eq('id', podId).maybeSingle()
    if (error) throw error
    if (!data) throw new HttpError('not_found', 'Pod not found')
    return data
  }

  return {
    async verifyAccessToken(token) {
      const { data, error } = await db.auth.getUser(token)
      if (error || !data.user) return null
      return { id: data.user.id, email: data.user.email ?? null }
    },

    async isPodMember(podId, userId) {
      const { count, error } = await db
        .from('pod_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('pod_id', podId)
        .eq('user_id', userId)
      if (error) throw error
      return (count ?? 0) > 0
    },

    settle: (options) => settleDue(db, options),

    async arePodmates(userId, otherId) {
      if (userId === otherId) return false
      const { data, error } = await db.from('pod_members').select('pod_id, user_id').in('user_id', [userId, otherId])
      if (error) throw error
      const mine = new Set(data.filter((m) => m.user_id === userId).map((m) => m.pod_id))
      return data.some((m) => m.user_id === otherId && mine.has(m.pod_id))
    },

    settlePairs: (options) => settlePairsDue(db, options),

    async replantPair(userId, otherId, now = new Date()) {
      const [a, b] = pairKey(userId, otherId)
      const fresh = newTree()
      // Like a replanted pod, today isn't scored: the new tree's first day ends tonight.
      const today = await pairToday(db, a, b, now)
      if (!today) throw new HttpError('forbidden', 'You no longer share a pod')
      const { data, error } = await db
        .from('pair_trees')
        .update({
          hp: fresh.hp,
          max_hp: fresh.maxHp,
          growth: fresh.growth,
          status: fresh.status,
          streak: 0,
          last_settled_date: today,
          planted_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_a', a)
        .eq('user_b', b)
        .eq('status', 'dead')
        .select('hp, max_hp')
      if (error) throw error
      if (!data?.length) throw new HttpError('conflict', 'The tree is still alive')
      return { userId: otherId, hp: data[0]!.hp, maxHp: data[0]!.max_hp }
    },

    async replant(podId, now = new Date()) {
      const pod = await loadPod(podId)
      const fresh = newTree()
      const { data, error } = await db
        .from('trees')
        .update({
          hp: fresh.hp,
          max_hp: fresh.maxHp,
          growth: fresh.growth,
          status: fresh.status,
          last_settled_date: podDate(now, pod.timezone),
          planted_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('pod_id', podId)
        .eq('status', 'dead')
        .select('hp, max_hp')
      if (error) throw error
      if (!data?.length) throw new HttpError('conflict', 'The tree is still alive')
      await db.from('messages').insert({ pod_id: podId, user_id: null, kind: 'system', body: 'A new seed was planted. Fresh start! 🌱' })
      return { podId, hp: data[0]!.hp, maxHp: data[0]!.max_hp }
    },

    async openWindowNow(podId, now = new Date()) {
      const pod = await loadPod(podId)
      const start = zonedParts(now, pod.timezone).minuteOfDay - 1
      if (start < 0 || start + pod.window_minutes >= 24 * 60) {
        throw new HttpError('conflict', 'Too close to midnight for a demo window — try again in a bit')
      }
      const snapTime = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}:00`
      const { error } = await db.from('pods').update({ snap_time: snapTime }).eq('id', podId)
      if (error) throw error
      return { podId, snapTime }
    },
  }
}
