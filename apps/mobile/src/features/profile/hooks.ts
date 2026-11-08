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
  /** Best current streak across my pods (settlement). */
  streak: number
  /** Longest streak ever (settlement; never goes down). */
  best_streak: number
  /** Every snap posted, on time and late (trigger). */
  snap_count: number
  /** Cover photo behind the avatar (storage path); null = the avatar colour. */
  banner_url: string | null
  /** When onboarding was finished; null = show it. */
  onboarded_at: string | null
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: qk.profile(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_color, avatar_url, streak, best_streak, snap_count, banner_url, onboarded_at')
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
    mutationFn: async (input: { display_name: string; username: string; avatar_color: string; newAvatarUri?: string | null; newBannerUri?: string | null }) => {
      const avatar_url = input.newAvatarUri ? await uploadImage(me, input.newAvatarUri, 512) : undefined
      const banner_url = input.newBannerUri ? await uploadImage(me, input.newBannerUri, 1500) : undefined
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: input.display_name.trim(),
          username: input.username.trim().toLowerCase(),
          avatar_color: input.avatar_color,
          ...(avatar_url ? { avatar_url } : {}),
          ...(banner_url ? { banner_url } : {}),
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
 * My snaps for one habit in one month, grouped by pod-day (the pod's local date, as the server stamps it).
 * Only I see this: it reads my own snaps.
 */
export function useMyMonth(monthStart: string, habitId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.profileMonth(monthStart, habitId),
    queryFn: async (): Promise<Record<string, CalendarDay>> => {
      const [y, m] = monthStart.split('-').map(Number) as [number, number]
      const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10)
      const { data, error } = await supabase.from('snaps').select('pod_id, pod_date, on_time').eq('user_id', me).eq('habit_id', habitId).gte('pod_date', monthStart).lt('pod_date', next)
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

// ─── Habit cards and the profile board ────────────────────────────────────────

export interface HabitCard {
  habit: Habit
  /** Highest current streak among this person's pods of that habit (null = not visible to me). */
  streak: number | null
  best: number | null
}

/**
 * One card per habit this person tracks. Streaks come from pod_members: for me, all my pods;
 * for someone else, RLS only shows pods we share, so their other habits (seen through their
 * profile snaps) show without a number.
 */
export function useHabitCards(userId: string) {
  const habits = useHabits()
  const q = useQuery({
    queryKey: qk.habitCards(userId),
    queryFn: async () => {
      const [members, shown] = await Promise.all([
        supabase.from('pod_members').select('streak, best_streak, pod:pods(habit_id)').eq('user_id', userId),
        supabase.from('snaps').select('habit_id').eq('user_id', userId).eq('on_profile', true),
      ])
      if (members.error) throw members.error
      if (shown.error) throw shown.error
      const byHabit = new Map<string, { streak: number | null; best: number | null }>()
      for (const m of members.data) {
        const id = (m.pod as unknown as { habit_id: string } | null)?.habit_id
        if (!id) continue
        const cur = byHabit.get(id)
        byHabit.set(id, { streak: Math.max(cur?.streak ?? 0, m.streak), best: Math.max(cur?.best ?? 0, m.best_streak) })
      }
      for (const s of shown.data) if (!byHabit.has(s.habit_id)) byHabit.set(s.habit_id, { streak: null, best: null })
      return byHabit
    },
  })
  const data: HabitCard[] = (habits.data ?? []).filter((h) => q.data?.has(h.id)).map((h) => ({ habit: h, ...q.data!.get(h.id)! }))
  return { data, isLoading: habits.isLoading || q.isLoading }
}
