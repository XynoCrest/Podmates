import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { randomUUID } from 'expo-crypto'
import { File, Paths } from 'expo-file-system'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useMemo } from 'react'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { PERSON_FIELDS, type Person, type Pod } from '../pods/hooks'

export interface Snap {
  id: string
  image: string
  caption: string
  takenAt: string
  day: string
  onProfile: boolean
  podId: string
  habitId: string
  podName: string | null
  author: Person
  cheers: number
  cheeredByMe: boolean
}

export interface StoryGroup {
  person: Person
  snaps: Snap[]
  /** Per snap, in order: whether I've seen it (my own always count as seen). */
  seen: boolean[]
  unseen: boolean
}

export const SNAP_FIELDS = `id, image, caption, taken_at, day, on_profile, pod_id, habit_id, user_id, author:profiles!snaps_user_id_fkey(${PERSON_FIELDS}), pod:pods(name), cheers(user_id)`

export const toSnap = (s: any, me: string): Snap => ({
  id: s.id,
  image: s.image,
  caption: s.caption,
  takenAt: s.taken_at,
  day: s.day,
  onProfile: s.on_profile,
  podId: s.pod_id,
  habitId: s.habit_id,
  podName: s.pod?.name ?? null,
  author: s.author as Person,
  cheers: (s.cheers as { user_id: string }[] | undefined)?.length ?? 0,
  cheeredByMe: !!(s.cheers as { user_id: string }[] | undefined)?.some((c) => c.user_id === me),
})

/**
 * Stories for a habit tab: the last 24h of snaps from me and the people I follow
 * (accepted), grouped by person. Mine first, then people with unseen snaps.
 */
export function useStories(habitId: string | undefined) {
  const me = useMe()
  const query = useQuery({
    queryKey: qk.stories(habitId ?? ''),
    enabled: !!habitId,
    queryFn: async () => {
      const { data: follows, error: fErr } = await supabase.from('follows').select('followee_id').eq('follower_id', me).eq('status', 'accepted')
      if (fErr) throw fErr
      const people = [me, ...follows.map((f) => f.followee_id)]
      const since = new Date(Date.now() - 24 * 3600_000).toISOString()
      const { data, error } = await supabase.from('snaps').select(SNAP_FIELDS).eq('habit_id', habitId!).in('user_id', people).gte('taken_at', since).order('taken_at')
      if (error) throw error
      const ids = data.map((s) => s.id)
      const { data: views, error: vErr } = ids.length ? await supabase.from('snap_views').select('snap_id').in('snap_id', ids) : { data: [], error: null }
      if (vErr) throw vErr
      return { snaps: data.map((s) => toSnap(s, me)), seen: new Set((views ?? []).map((v) => v.snap_id)) }
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
  const me = useMe()
  return useQuery({
    queryKey: qk.profileSnaps(userId, habitId ?? ''),
    enabled: !!habitId,
    queryFn: async () => {
      const { data, error } = await supabase.from('snaps').select(SNAP_FIELDS).eq('user_id', userId).eq('habit_id', habitId!).eq('on_profile', true).order('taken_at', { ascending: false })
      if (error) throw error
      return data.map((s) => toSnap(s, me))
    },
  })
}

/** All my snaps for a habit — the "pick for profile" sheet. */
export function useMySnaps(habitId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.mySnaps(habitId),
    queryFn: async () => {
      const { data, error } = await supabase.from('snaps').select(SNAP_FIELDS).eq('user_id', me).eq('habit_id', habitId).order('taken_at', { ascending: false }).limit(120)
      if (error) throw error
      return data.map((s) => toSnap(s, me))
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

/** Upload once, post to every chosen habit's pod. The server stamps the day; the first snap of a day counts. */
export function useSendSnap() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ uri, caption, pods }: { uri: string; caption: string; pods: Pod[] }) => {
      const path = await uploadImage(me, uri)
      const { data, error } = await supabase
        .from('snaps')
        .insert(pods.map((p) => ({ pod_id: p.id, habit_id: p.habitId, image: path, caption }))) // habit and day are re-stamped by the server
        .select('pod_id')
      if (error) throw error
      return data
    },
    onSuccess: (_d, { pods }) => {
      for (const key of [qk.myHabits, qk.pods, qk.profileStats(me)]) void queryClient.invalidateQueries({ queryKey: key })
      for (const p of pods) {
        void queryClient.invalidateQueries({ queryKey: ['podFeed', p.id] })
        void queryClient.invalidateQueries({ queryKey: qk.stories(p.habitId) })
      }
    },
  })
}

/** One snap by id (opened from a feed or a profile grid). */
export function useSnap(snapId: string | undefined) {
  const me = useMe()
  const query = useQuery({
    queryKey: ['snap', snapId],
    enabled: !!snapId,
    queryFn: async () => {
      const { data, error } = await supabase.from('snaps').select(SNAP_FIELDS).eq('id', snapId!).single()
      if (error) throw error
      return toSnap(data, me)
    },
  })
  useRealtimeInvalidate('cheers', snapId ? `snap_id=eq.${snapId}` : undefined, [['snap', snapId]], !!snapId)
  return query
}

/** Cheer (or un-cheer) a snap. Positive only: there is no opposite. */
export function useCheer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ snap, on }: { snap: Snap; on: boolean }) => {
      const { error } = on
        ? await supabase.from('cheers').insert({ snap_id: snap.id })
        : await supabase.from('cheers').delete().eq('snap_id', snap.id).eq('user_id', (await supabase.auth.getUser()).data.user!.id)
      if (error && error.code !== '23505') throw error
    },
    onSettled: (_d, _e, { snap }) => {
      void queryClient.invalidateQueries({ queryKey: ['snap', snap.id] })
      void queryClient.invalidateQueries({ queryKey: ['podFeed', snap.podId] })
    },
  })
}

/** Flag a snap as fake. Anonymous; five flags hide it until the team reviews it. */
export function useFlagSnap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (snap: Snap) => {
      const { error } = await supabase.from('snap_flags').insert({ snap_id: snap.id })
      if (error && error.code !== '23505') throw error
    },
    onSettled: (_d, _e, snap) => {
      void queryClient.invalidateQueries({ queryKey: ['podFeed', snap.podId] })
    },
  })
}
