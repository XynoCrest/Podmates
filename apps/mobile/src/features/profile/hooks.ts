import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { podDate } from '@podmates/shared'
import { addDays } from '@podmates/tree-engine'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { PERSON_FIELDS, useHabits, type Habit, type Person } from '../pods/hooks'
import { uploadImage } from '../snaps/hooks'

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_color: string
  avatar_url: string | null
  timezone: string
  is_private: boolean
  is_admin: boolean
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: qk.profile(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_color, avatar_url, timezone, is_private, is_admin')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })
}

/** The habit tabs on a profile: the habits that person tracks. */
export function useProfileHabits(userId: string) {
  const habits = useHabits()
  const ids = useQuery({
    queryKey: qk.profileHabits(userId),
    queryFn: async () => {
      // Others' rows are only readable in pods we share; their profile-grid snaps fill in the rest.
      const [tracked, shown] = await Promise.all([
        supabase.from('user_habits').select('pod:pods(habit_id)').eq('user_id', userId),
        supabase.from('snaps').select('habit_id').eq('user_id', userId).eq('on_profile', true),
      ])
      if (tracked.error) throw tracked.error
      if (shown.error) throw shown.error
      return [...new Set([...tracked.data.map((t) => (t.pod as unknown as { habit_id: string }).habit_id), ...shown.data.map((s) => s.habit_id)])]
    },
  })
  const data: Habit[] = (habits.data ?? []).filter((h) => ids.data?.includes(h.id))
  return { data, isLoading: habits.isLoading || ids.isLoading }
}

export interface HabitStat {
  habitId: string
  streak: number
}

export interface ProfileStats {
  /** Share of the last 30 days (since joining) that were snapped or rested, across all habits. */
  consistency: number | null
  habits: number
  perHabit: HabitStat[]
}

/** KPI cards on my profile. Per-habit current streaks come from settlement; consistency from my day log. */
export function useProfileStats(userId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.profileStats(userId),
    queryFn: async (): Promise<ProfileStats> => {
      const { data: rows, error } = await supabase.from('user_habits').select('current_streak, joined_at, pod:pods(habit_id)').eq('user_id', userId)
      if (error) throw error
      const perHabit = rows.map((r) => ({ habitId: (r.pod as unknown as { habit_id: string }).habit_id, streak: r.current_streak }))
      if (userId !== me || !rows.length) return { consistency: null, habits: rows.length, perHabit }

      const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', me).single()
      const today = podDate(new Date(), profile?.timezone ?? 'UTC')
      const from = addDays(today, -29)
      const { data: days, error: dErr } = await supabase.from('habit_days').select('day').eq('user_id', me).gte('day', from).lt('day', today)
      if (dErr) throw dErr
      // Possible days = for each habit, finished days in the window since I joined it.
      let possible = 0
      for (const r of rows) {
        const joined = podDate(new Date(r.joined_at), profile?.timezone ?? 'UTC')
        const start = joined > from ? joined : from
        possible += Math.max(0, Math.round((Date.parse(today) - Date.parse(start)) / 86_400_000))
      }
      return { consistency: possible ? Math.min(1, days.length / possible) : null, habits: rows.length, perHabit }
    },
  })
}

export function useUpdateProfile() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { display_name: string; username: string; bio: string; avatar_color: string; is_private: boolean; newAvatarUri?: string | null }) => {
      const avatar_url = input.newAvatarUri ? await uploadImage(me, input.newAvatarUri, 512) : undefined
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: input.display_name.trim(),
          username: input.username.trim().toLowerCase(),
          bio: input.bio.trim(),
          avatar_color: input.avatar_color,
          is_private: input.is_private,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq('id', me)
      if (error) throw new Error(error.code === '23505' ? 'That username is taken' : error.code === '23514' ? 'Usernames are 3–24 lowercase letters, numbers, _ or .' : error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.profile(me) })
    },
  })
}

/** Keep my profile's timezone in step with the device, so my day ends at my midnight. */
export async function syncTimezone(userId: string, timeZone: string) {
  await supabase.from('profiles').update({ timezone: timeZone }).eq('id', userId).neq('timezone', timeZone)
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export interface Follows {
  /** People I follow (accepted). */
  following: Set<string>
  /** People who follow me (accepted). */
  followers: Set<string>
  /** My requests waiting on a private account. */
  requested: Set<string>
  /** Requests waiting on me (I'm private). */
  incoming: Person[]
}

export function useFollows() {
  const me = useMe()
  const query = useQuery({
    queryKey: qk.follows,
    queryFn: async (): Promise<Follows> => {
      const { data, error } = await supabase.from('follows').select(`follower_id, followee_id, status, follower:profiles!follows_follower_id_fkey(${PERSON_FIELDS})`)
      if (error) throw error
      const out: Follows = { following: new Set(), followers: new Set(), requested: new Set(), incoming: [] }
      for (const f of data) {
        if (f.follower_id === me && f.status === 'accepted') out.following.add(f.followee_id)
        if (f.follower_id === me && f.status === 'pending') out.requested.add(f.followee_id)
        if (f.followee_id === me && f.status === 'accepted') out.followers.add(f.follower_id)
        if (f.followee_id === me && f.status === 'pending') out.incoming.push(f.follower as unknown as Person)
      }
      return out
    },
  })
  useRealtimeInvalidate('follows', undefined, [qk.follows])
  return query
}

function useInvalidateFollows() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: qk.follows })
    void queryClient.invalidateQueries({ queryKey: ['stories'] })
    void queryClient.invalidateQueries({ queryKey: qk.dmThreads })
  }
}

export function useFollow() {
  const invalidate = useInvalidateFollows()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc('request_follow', { p_user: userId })
      if (error) throw error
      return data
    },
    onSettled: invalidate,
  })
}

export function useUnfollow() {
  const me = useMe()
  const invalidate = useInvalidateFollows()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('follows').delete().eq('follower_id', me).eq('followee_id', userId)
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

export function useAnswerFollow() {
  const invalidate = useInvalidateFollows()
  return useMutation({
    mutationFn: async ({ follower, accept }: { follower: string; accept: boolean }) => {
      const { error } = await supabase.rpc('answer_follow', { p_follower: follower, p_accept: accept })
      if (error) throw error
    },
    onSettled: invalidate,
  })
}
