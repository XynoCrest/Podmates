import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { randomUUID } from 'expo-crypto'
import { File, Paths } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useMemo } from 'react'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'
import { PERSON_FIELDS, type Person, type PodSummary } from '../pods/hooks'

export interface Snap {
  id: string
  image: string
  caption: string
  takenAt: string
  onTime: boolean
  onProfile: boolean
  podId: string
  habitId: string
  podName: string | null
  author: Person
}

export interface StoryGroup {
  person: Person
  snaps: Snap[]
  /** Per snap, in order: whether I've seen it (my own always count as seen). */
  seen: boolean[]
  unseen: boolean
}

export const SNAP_FIELDS = `id, image, caption, taken_at, on_time, on_profile, pod_id, habit_id, user_id, author:profiles!snaps_user_id_fkey(${PERSON_FIELDS})`

export const toSnap = (s: any, podName: string | null = null): Snap => ({
  id: s.id,
  image: s.image,
  caption: s.caption,
  takenAt: s.taken_at,
  onTime: s.on_time,
  onProfile: s.on_profile,
  podId: s.pod_id,
  habitId: s.habit_id,
  podName: s.pod?.name ?? podName,
  author: s.author as Person,
})

/**
 * Stories for a habit tab: every snap from the last 24h in my pods of that
 * habit, grouped by person. Mine first, then people with unseen snaps.
 */
export function useStories(habitId: string | undefined) {
  const me = useMe()
  const query = useQuery({
    queryKey: qk.stories(habitId ?? ''),
    enabled: !!habitId,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString()
      const { data, error } = await supabase
        .from('snaps')
        .select(`${SNAP_FIELDS}, pod:pods!inner(name)`)
        .eq('habit_id', habitId!)
        .gte('taken_at', since)
        .order('taken_at')
      if (error) throw error
      const ids = data.map((s) => s.id)
      const { data: views, error: vErr } = ids.length
        ? await supabase.from('snap_views').select('snap_id').in('snap_id', ids)
        : { data: [], error: null }
      if (vErr) throw vErr
      return { snaps: data.map((s) => toSnap(s)), seen: new Set((views ?? []).map((v) => v.snap_id)) }
    },
  })

  const groups = useMemo<StoryGroup[]>(() => {
    if (!query.data) return []
    const byUser = new Map<string, StoryGroup>()
    for (const s of query.data.snaps) {
      const g = byUser.get(s.author.id) ?? { person: s.author, snaps: [], seen: [], unseen: false }
      const seen = s.author.id === me || query.data.seen.has(s.id)
      g.snaps.push(s)
      g.seen.push(seen)
      if (!seen) g.unseen = true
      byUser.set(s.author.id, g)
    }
    return [...byUser.values()].sort((a, b) => {
      if (a.person.id === me) return -1
      if (b.person.id === me) return 1
      if (a.unseen !== b.unseen) return a.unseen ? -1 : 1
      return b.snaps.at(-1)!.takenAt.localeCompare(a.snaps.at(-1)!.takenAt)
    })
  }, [query.data, me])

  return { ...query, groups }
}

export function useMarkSeen(habitId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (snapId: string) => {
      const { error } = await supabase.from('snap_views').upsert({ snap_id: snapId }, { onConflict: 'snap_id,user_id', ignoreDuplicates: true })
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.stories(habitId) }),
  })
}

/** A person's profile grid for one habit: the snaps they chose to show. */
export function useProfileSnaps(userId: string, habitId: string | undefined) {
  return useQuery({
    queryKey: qk.profileSnaps(userId, habitId ?? ''),
    enabled: !!habitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('snaps')
        .select(SNAP_FIELDS)
        .eq('user_id', userId)
        .eq('habit_id', habitId!)
        .eq('on_profile', true)
        .order('taken_at', { ascending: false })
      if (error) throw error
      return data.map((s) => toSnap(s))
    },
  })
}

/** A person's profile board: every snap they chose to show, across all habits, newest first. */
export function useProfileBoard(userId: string) {
  return useQuery({
    queryKey: qk.profileBoard(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from('snaps').select(`${SNAP_FIELDS}, pod:pods(name)`).eq('user_id', userId).eq('on_profile', true).order('taken_at', { ascending: false }).limit(60)
      if (error) throw error
      return data.map((s) => toSnap(s))
    },
  })
}

/** All my snaps for a habit — the "pick for profile" sheet. */
export function useMySnaps(habitId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.mySnaps(habitId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('snaps')
        .select(SNAP_FIELDS)
        .eq('user_id', me)
        .eq('habit_id', habitId)
        .order('taken_at', { ascending: false })
        .limit(120)
      if (error) throw error
      return data.map((s) => toSnap(s))
    },
  })
}

export function useToggleOnProfile(habitId: string) {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ snapId, onProfile }: { snapId: string; onProfile: boolean }) => {
      const { error } = await supabase.from('snaps').update({ on_profile: onProfile }).eq('id', snapId)
      if (error) throw error
    },
    onMutate: ({ snapId, onProfile }) => {
      queryClient.setQueryData<Snap[]>(qk.mySnaps(habitId), (old) => old?.map((s) => (s.id === snapId ? { ...s, onProfile } : s)))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.mySnaps(habitId) })
      void queryClient.invalidateQueries({ queryKey: qk.profileSnaps(me, habitId) })
      void queryClient.invalidateQueries({ queryKey: qk.profileHabits(me) })
      void queryClient.invalidateQueries({ queryKey: qk.profileBoard(me) })
    },
  })
}

/** Resize + JPEG-encode a local or remote image and upload it to my folder in the `snaps` bucket. */
export async function uploadImage(userId: string, uri: string, maxWidth = 1080): Promise<string> {
  let local = uri
  if (/^https?:\/\//.test(uri)) {
    local = (await File.downloadFileAsync(uri, new File(Paths.cache, `${randomUUID()}.jpg`))).uri
  }
  const rendered = await ImageManipulator.manipulate(local).resize({ width: maxWidth }).renderAsync()
  const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG })
  const bytes = await new File(saved.uri).arrayBuffer()
  const path = `${userId}/${randomUUID()}.jpg`
  const { error } = await supabase.storage.from('snaps').upload(path, bytes, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

/** Upload once, post to every chosen pod. The server decides on-time vs late. */
export function useSendSnap() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uri, caption, pods }: { uri: string; caption: string; pods: PodSummary[] }) => {
      const path = await uploadImage(me, uri)
      const { data, error } = await supabase
        .from('snaps')
        .insert(pods.map((p) => ({ pod_id: p.id, habit_id: p.habitId, image: path, caption })))
        .select('pod_id, on_time')
      if (error) throw error
      return data
    },
    onSuccess: (_d, { pods }) => {
      void queryClient.invalidateQueries({ queryKey: qk.pods })
      for (const p of pods) {
        void queryClient.invalidateQueries({ queryKey: qk.messages(p.id) })
        void queryClient.invalidateQueries({ queryKey: qk.tree(p.id) })
        void queryClient.invalidateQueries({ queryKey: qk.members(p.id) })
        void queryClient.invalidateQueries({ queryKey: qk.stories(p.habitId) })
        void queryClient.invalidateQueries({ queryKey: qk.mySnaps(p.habitId) })
      }
      // My own story ring, habit cards and calendar show the new snap too.
      void queryClient.invalidateQueries({ queryKey: qk.profileStory(me) })
      void queryClient.invalidateQueries({ queryKey: qk.habitCards(me) })
      void queryClient.invalidateQueries({ queryKey: ['profileMonth'] })
    },
  })
}

/** One snap by id (opened from chat or a profile grid). */
export function useSnap(snapId: string | undefined) {
  return useQuery({
    queryKey: ['snap', snapId],
    enabled: !!snapId,
    queryFn: async () => {
      const { data, error } = await supabase.from('snaps').select(SNAP_FIELDS).eq('id', snapId!).single()
      if (error) throw error
      return toSnap(data)
    },
  })
}
