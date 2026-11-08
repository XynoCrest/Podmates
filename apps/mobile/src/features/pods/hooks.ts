import { podDate, windowState, type WindowState } from '@podmates/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
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

export interface PodSummary {
  id: string
  name: string
  goal: string
  habitId: string
  snapTime: string
  windowMinutes: number
  timeZone: string
  inviteCode: string
  hp: number
  maxHp: number
  growth: number
  treeStatus: 'alive' | 'dead'
  memberCount: number
  contributedToday: number
  meContributedToday: boolean
  myStreak: number
  /** Members in join order — the faces on the pod's group icon. */
  members: Person[]
  /** Messages from others since I last opened the chat. */
  unread: number
  lastMessage: { kind: string; body: string; author: string | null } | null
  lastActivityAt: string
}

export interface Person {
  id: string
  username: string
  display_name: string
  avatar_color: string
  avatar_url: string | null
}

export const PERSON_FIELDS = 'id, username, display_name, avatar_color, avatar_url'

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

/** Every pod I'm in (RLS scopes pod_overview to my memberships), newest activity first. */
export function useMyPods() {
  const query = useQuery({
    queryKey: qk.pods,
    queryFn: async (): Promise<PodSummary[]> => {
      const { data, error } = await supabase.from('pod_overview').select('*').order('last_activity_at', { ascending: false })
      if (error) throw error
      const ids = data.map((p) => p.id!)
      const faces = new Map<string, Person[]>()
      if (ids.length) {
        const m = await supabase.from('pod_members').select(`pod_id, profile:profiles(${PERSON_FIELDS})`).in('pod_id', ids).order('joined_at')
        if (m.error) throw m.error
        for (const row of m.data) faces.set(row.pod_id, [...(faces.get(row.pod_id) ?? []), row.profile as Person])
      }
      return data.map((p) => ({
        id: p.id!,
        name: p.name!,
        goal: p.goal ?? '',
        habitId: p.habit_id!,
        snapTime: p.snap_time!,
        windowMinutes: p.window_minutes!,
        timeZone: p.timezone!,
        inviteCode: p.invite_code!,
        hp: p.hp ?? 0,
        maxHp: p.max_hp ?? 100,
        growth: p.growth ?? 0,
        treeStatus: (p.tree_status as 'alive' | 'dead') ?? 'alive',
        memberCount: p.member_count ?? 0,
        contributedToday: p.contributed_today ?? 0,
        meContributedToday: p.me_contributed_today ?? false,
        myStreak: p.my_streak ?? 0,
        members: faces.get(p.id!) ?? [],
        unread: p.unread_count ?? 0,
        lastMessage: p.last_message_kind
          ? { kind: p.last_message_kind, body: p.last_message_body ?? '', author: p.last_message_author }
          : null,
        lastActivityAt: p.last_activity_at!,
      }))
    },
  })
  // Chat previews and "snapped today" counts change whenever anyone posts.
  useRealtimeInvalidate('messages', undefined, [qk.pods])
  return query
}

export function usePod(podId: string) {
  const pods = useMyPods()
  return { ...pods, data: pods.data?.find((p) => p.id === podId) }
}

/** The habits I have pods in, in catalogue order — the chat screen's top tabs. */
export function useMyHabits() {
  const habits = useHabits()
  const pods = useMyPods()
  const data = useMemo(() => {
    const mine = new Set(pods.data?.map((p) => p.habitId))
    return habits.data?.filter((h) => mine.has(h.id)) ?? []
  }, [habits.data, pods.data])
  return { data, isLoading: habits.isLoading || pods.isLoading, error: habits.error ?? pods.error, refetch: pods.refetch }
}

export const podWindow = (pod: PodSummary, now: Date): WindowState =>
  windowState(now, { snapTime: pod.snapTime, windowMinutes: pod.windowMinutes, timeZone: pod.timeZone })

/** Snap now? true when the window is open and I haven't contributed today. */
export const needsSnap = (pod: PodSummary, now: Date) => !pod.meContributedToday && podWindow(pod, now).status === 'open' && pod.treeStatus === 'alive'

export interface Member extends Person {
  role: string
  streak: number
  contributedToday: boolean
}

export function usePodMembers(pod: PodSummary | undefined) {
  return useQuery({
    queryKey: qk.members(pod?.id ?? ''),
    enabled: !!pod,
    queryFn: async (): Promise<Member[]> => {
      const today = podDate(new Date(), pod!.timeZone)
      const [members, today_] = await Promise.all([
        supabase.from('pod_members').select(`role, streak, joined_at, profile:profiles(${PERSON_FIELDS})`).eq('pod_id', pod!.id).order('joined_at'),
        supabase.from('contributions').select('user_id').eq('pod_id', pod!.id).eq('pod_date', today),
      ])
      if (members.error) throw members.error
      if (today_.error) throw today_.error
      const done = new Set(today_.data.map((c) => c.user_id))
      return members.data.map((m) => ({
        ...(m.profile as Person),
        role: m.role,
        streak: m.streak,
        contributedToday: done.has((m.profile as Person).id),
      }))
    },
  })
}

export interface ChatMessage {
  id: string
  kind: 'text' | 'snap' | 'system'
  body: string
  createdAt: string
  author: Person | null
  snap: { id: string; image: string; onTime: boolean } | null
}

export function useMessages(podId: string) {
  const query = useQuery({
    queryKey: qk.messages(podId),
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select(`id, kind, body, created_at, author:profiles(${PERSON_FIELDS}), snap:snaps(id, image, on_time)`)
        .eq('pod_id', podId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data.map((m) => ({
        id: m.id,
        kind: m.kind as ChatMessage['kind'],
        body: m.body,
        createdAt: m.created_at,
        author: (m.author as Person | null) ?? null,
        snap: m.snap ? { id: m.snap.id, image: m.snap.image, onTime: m.snap.on_time } : null,
      }))
    },
  })
  useRealtimeInvalidate('messages', `pod_id=eq.${podId}`, [qk.messages(podId), qk.members(podId), qk.tree(podId)])
  return query
}

/**
 * Moves my read marker to now while the chat is open: once on open, and again whenever
 * a new message lands (the pod list refetches on realtime, so `unread` goes back above 0).
 */
export function useMarkPodRead(podId: string, unread: number | undefined) {
  const queryClient = useQueryClient()
  const pending = !!unread
  useEffect(() => {
    if (!pending) return
    void supabase.rpc('mark_pod_read', { p_pod: podId }).then(({ error }) => {
      if (!error) void queryClient.invalidateQueries({ queryKey: qk.pods })
    })
  }, [pending, podId, queryClient])
}

export function useSendMessage(podId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('messages').insert({ pod_id: podId, body, kind: 'text' })
      if (error) throw error
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.messages(podId) })
      void queryClient.invalidateQueries({ queryKey: qk.pods })
    },
  })
}

export function useCreatePod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; habitId: string; goal: string; snapTime: string; timeZone: string; windowMinutes: number }) => {
      const { data, error } = await supabase.rpc('create_pod', {
        p_name: input.name,
        p_habit_id: input.habitId,
        p_goal: input.goal,
        p_snap_time: input.snapTime,
        p_timezone: input.timeZone,
        p_window_minutes: input.windowMinutes,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.pods }),
  })
}

export function useJoinPod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_pod', { p_invite_code: code })
      if (error) throw new Error(error.code === 'P0002' ? 'No pod with that code' : error.message)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.pods }),
  })
}
