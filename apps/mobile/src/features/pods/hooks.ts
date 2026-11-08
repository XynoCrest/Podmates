/**
 * Habits and their pods. One open pod per habit; tracking a habit = being in its pod.
 * Streak and tree numbers come from the server (settled by packages/tree-engine);
 * the app only adds today's snap on top with liveStreak().
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { podDate } from '@podmates/shared'
import { liveStreak, restDaysLeft, weekStart, type DayStatus } from '@podmates/tree-engine'
import { useMemo } from 'react'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

export interface Habit {
  id: string
  name: string
  emoji: string
  sf_symbol: string
  sort: number
}

export interface Person {
  id: string
  username: string
  display_name: string
  avatar_color: string
  avatar_url: string | null
}

export const PERSON_FIELDS = 'id, username, display_name, avatar_color, avatar_url'

export interface Pod {
  id: string
  habitId: string
  name: string
  description: string
  color: string
  memberCount: number
  tree: { health: number; active: number; counted: number; totalSnaps: number }
}

/** A habit I track, with my streak as of right now. */
export interface MyHabit {
  pod: Pod
  habit: Habit
  /** Streak including today if I've already snapped. */
  streak: number
  best: number
  /** What today counts as so far. */
  today: DayStatus | null
  restDaysLeft: number
  reminderTime: string | null
}

export function useHabits() {
  return useQuery({
    queryKey: qk.habits,
    staleTime: Infinity,
    queryFn: async (): Promise<Habit[]> => {
      const { data, error } = await supabase.from('habits').select('*').order('sort')
      if (error) throw error
      return data
    },
  })
}

/** Every pod with its tree and member count (Explore, Home's healthiest tree). */
export function usePods() {
  const query = useQuery({
    queryKey: qk.pods,
    queryFn: async (): Promise<Pod[]> => {
      const { data, error } = await supabase.from('pods').select('id, habit_id, name, description, color, trees(health, active, counted, total_snaps), user_habits(count)')
      if (error) throw error
      return data.map((p) => {
        const t = p.trees as unknown as { health: number; active: number; counted: number; total_snaps: number } | null
        return {
          id: p.id,
          habitId: p.habit_id,
          name: p.name,
          description: p.description,
          color: p.color,
          memberCount: (p.user_habits as unknown as { count: number }[])[0]?.count ?? 0,
          tree: { health: t?.health ?? 1, active: t?.active ?? 0, counted: t?.counted ?? 0, totalSnaps: t?.total_snaps ?? 0 },
        }
      })
    },
  })
  useRealtimeInvalidate('trees', undefined, [qk.pods])
  return query
}

/** The habits I track, in catalogue order, with today's status and live streak. */
export function useMyHabits() {
  const me = useMe()
  const habits = useHabits()
  const pods = usePods()
  const mine = useQuery({
    queryKey: qk.myHabits,
    queryFn: async () => {
      const [{ data: profile, error: pErr }, { data: rows, error: hErr }] = await Promise.all([
        supabase.from('profiles').select('timezone').eq('id', me).single(),
        supabase.from('user_habits').select('pod_id, current_streak, best_streak, reminder_time').eq('user_id', me),
      ])
      if (pErr) throw pErr
      if (hErr) throw hErr
      const today = podDate(new Date(), profile.timezone)
      const { data: days, error: dErr } = await supabase.from('habit_days').select('pod_id, day, status').eq('user_id', me).gte('day', weekStart(today))
      if (dErr) throw dErr
      return { today, rows, days }
    },
  })
  useRealtimeInvalidate('user_habits', `user_id=eq.${me}`, [qk.myHabits])

  const data = useMemo<MyHabit[]>(() => {
    if (!mine.data || !habits.data || !pods.data) return []
    const { today, rows, days } = mine.data
    return rows
      .map((r): MyHabit | null => {
        const pod = pods.data.find((p) => p.id === r.pod_id)
        const habit = pod && habits.data.find((h) => h.id === pod.habitId)
        if (!pod || !habit) return null
        const todayStatus = (days.find((d) => d.pod_id === r.pod_id && d.day === today)?.status ?? null) as DayStatus | null
        const rests = days.filter((d) => d.pod_id === r.pod_id && d.status === 'rest').length
        const streak = liveStreak(r.current_streak, todayStatus)
        return { pod, habit, streak, best: Math.max(r.best_streak, streak), today: todayStatus, restDaysLeft: restDaysLeft(rests), reminderTime: r.reminder_time }
      })
      .filter((h): h is MyHabit => !!h)
      .sort((a, b) => a.habit.sort - b.habit.sort)
  }, [mine.data, habits.data, pods.data])

  return {
    data,
    isLoading: mine.isLoading || habits.isLoading || pods.isLoading,
    refetch: () => Promise.all([mine.refetch(), pods.refetch()]),
    isRefetching: mine.isRefetching || pods.isRefetching,
  }
}

function useInvalidateHabits() {
  const queryClient = useQueryClient()
  const me = useMe()
  return () => {
    for (const key of [qk.myHabits, qk.pods, qk.profileHabits(me), qk.profileStats(me)]) void queryClient.invalidateQueries({ queryKey: key })
  }
}

export function useAddHabit() {
  const invalidate = useInvalidateHabits()
  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase.rpc('add_habit', { p_habit_id: habitId })
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

export function useRemoveHabit() {
  const invalidate = useInvalidateHabits()
  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase.rpc('remove_habit', { p_habit_id: habitId })
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

/** Declare today a rest day for one habit. The server enforces 2 per week. */
export function useDeclareRest() {
  const invalidate = useInvalidateHabits()
  return useMutation({
    mutationFn: async (podId: string) => {
      const { data, error } = await supabase.rpc('declare_rest', { p_pod_id: podId })
      if (error) throw new Error(error.message.includes('no rest days') ? 'No rest days left this week' : error.message.includes('already counts') ? 'Today already counts' : error.message)
      return data
    },
    onSettled: invalidate,
  })
}

export function useSetReminder() {
  const me = useMe()
  const invalidate = useInvalidateHabits()
  return useMutation({
    mutationFn: async ({ podId, time }: { podId: string; time: string | null }) => {
      const { error } = await supabase.from('user_habits').update({ reminder_time: time }).eq('user_id', me).eq('pod_id', podId)
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

export interface PodMember extends Person {
  streak: number
}

/** A pod's members with their settled streak (pod page, tree screen). */
export function usePodMembers(podId: string | undefined) {
  return useQuery({
    queryKey: qk.podMembers(podId ?? ''),
    enabled: !!podId,
    queryFn: async (): Promise<PodMember[]> => {
      const { data, error } = await supabase
        .from('user_habits')
        .select(`current_streak, profile:profiles(${PERSON_FIELDS})`)
        .eq('pod_id', podId!)
        .order('current_streak', { ascending: false })
      if (error) throw error
      return data.map((m) => ({ ...(m.profile as unknown as Person), streak: m.current_streak }))
    },
  })
}
