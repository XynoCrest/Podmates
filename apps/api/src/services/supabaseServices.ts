import type { DbClient } from '@podmates/db'
import { HttpError } from '../lib/httpError'
import { settleAll } from './settlement'
import type { Services } from './types'

export function createSupabaseServices(db: DbClient): Services {
  return {
    async verifyAccessToken(token) {
      const { data, error } = await db.auth.getUser(token)
      if (error || !data.user) return null
      return { id: data.user.id, email: data.user.email ?? null }
    },

    async isAdmin(userId) {
      const { data, error } = await db.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
      if (error) throw error
      return data?.is_admin === true
    },

    settle: (options) => settleAll(db, options),

    async flaggedSnaps() {
      const { data, error } = await db
        .from('snaps')
        .select('id, pod_id, habit_id, user_id, image, caption, day, flag_count')
        .eq('review_status', 'pending')
        .order('taken_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((s) => ({
        id: s.id,
        podId: s.pod_id,
        habitId: s.habit_id,
        userId: s.user_id,
        image: s.image,
        caption: s.caption,
        day: s.day,
        flagCount: s.flag_count,
      }))
    },

    async reviewSnap(snapId, approve) {
      const { data: snap, error: sErr } = await db.from('snaps').select('user_id, review_status').eq('id', snapId).maybeSingle()
      if (sErr) throw sErr
      if (!snap) throw new HttpError('not_found', 'Snap not found')
      if (snap.review_status !== 'pending') throw new HttpError('conflict', 'This snap is not waiting for review')
      const { error } = await db.rpc('review_snap', { p_snap_id: snapId, p_approve: approve })
      if (error) throw error
      return { userId: snap.user_id }
    },
  }
}
