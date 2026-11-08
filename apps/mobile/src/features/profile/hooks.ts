import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'
import { useHabits, type Habit } from '../pods/hooks'
import { uploadImage } from '../snaps/hooks'

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_color: string
  avatar_url: string | null
  energy: number
  stars: number
  /** Best current streak across my pods (settlement). */
  streak: number
  /** Longest streak ever (settlement; never goes down). */
  best_streak: number
  /** Every snap posted, on time and late (trigger). */
  snap_count: number
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: qk.profile(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_color, avatar_url, energy, stars, streak, best_streak, snap_count')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })
}

/**
 * The habit tabs on a profile: for me, every habit I have a pod in; for others,
 * habits they've put snaps on their profile for.
 */
export function useProfileHabits(userId: string) {
  const me = useMe()
  const habits = useHabits()
  const ids = useQuery({
    queryKey: qk.profileHabits(userId),
    queryFn: async () => {
      if (userId === me) {
        const { data, error } = await supabase.from('pods').select('habit_id, pod_members!inner(user_id)').eq('pod_members.user_id', me)
        if (error) throw error
        return [...new Set(data.map((p) => p.habit_id))]
      }
      const { data, error } = await supabase.from('snaps').select('habit_id').eq('user_id', userId).eq('on_profile', true)
      if (error) throw error
      return [...new Set(data.map((s) => s.habit_id))]
    },
  })
  const data: Habit[] = (habits.data ?? []).filter((h) => ids.data?.includes(h.id))
  return { data, isLoading: habits.isLoading || ids.isLoading }
}

export function useUpdateProfile() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { display_name: string; username: string; bio: string; avatar_color: string; newAvatarUri?: string | null }) => {
      const avatar_url = input.newAvatarUri ? await uploadImage(me, input.newAvatarUri, 512) : undefined
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: input.display_name.trim(),
          username: input.username.trim().toLowerCase(),
          bio: input.bio.trim(),
          avatar_color: input.avatar_color,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq('id', me)
      if (error) throw new Error(error.code === '23505' ? 'That username is taken' : error.code === '23514' ? 'Usernames are 3–24 lowercase letters, numbers, _ or .' : error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.profile(me) })
      void queryClient.invalidateQueries({ queryKey: qk.pods })
    },
  })
}

// ─── Proof of progress: my month and shared pods ──────────────────────────────

/** One calendar day: how many pods I snapped on time in, and whether I only posted late. */
export interface CalendarDay {
  onTimePods: number
  lateOnly: boolean
}

/**
 * My snaps in one month, grouped by pod-day (the pod's local date, as the server stamps it).
 * Only I see this: it reads my own snaps.
 */
export function useMyMonth(monthStart: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.profileMonth(monthStart),
    queryFn: async (): Promise<Record<string, CalendarDay>> => {
      const [y, m] = monthStart.split('-').map(Number) as [number, number]
      const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
      const { data, error } = await supabase.from('snaps').select('pod_id, pod_date, on_time').eq('user_id', me).gte('pod_date', monthStart).lt('pod_date', next)
      if (error) throw error
      const byDay = new Map<string, { onTime: Set<string>; any: boolean }>()
      for (const s of data) {
        const d = byDay.get(s.pod_date) ?? { onTime: new Set<string>(), any: false }
        d.any = true
        if (s.on_time) d.onTime.add(s.pod_id)
        byDay.set(s.pod_date, d)
      }
      return Object.fromEntries([...byDay].map(([day, d]) => [day, { onTimePods: d.onTime.size, lateOnly: d.any && d.onTime.size === 0 }]))
    },
  })
}

/** Pods the viewer and this person are both in (RLS only returns memberships of my own pods). */
export function useSharedPods(userId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.sharedPods(userId),
    enabled: userId !== me,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from('pod_members').select('pod:pods(name)').eq('user_id', userId)
      if (error) throw error
      return data.map((m) => (m.pod as unknown as { name: string } | null)?.name).filter((n): n is string => !!n)
    },
  })
}
