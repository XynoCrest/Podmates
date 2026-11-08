/**
 * Friends: being friends means sharing a habit and a pod. A request names one of my pods (unless we
 * already share one); accepting joins it and makes us friends. Rules live in the database
 * (supabase/migrations/…_friend_requests.sql); these hooks call it and refresh what changes.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'
import { PERSON_FIELDS, useMyPods, type Person } from '../pods/hooks'

export interface FriendRequest {
  id: string
  incoming: boolean
  person: Person
  /** The pod the recipient joins on accept; null when they already share one. */
  pod: { id: string; name: string; habitId: string } | null
  createdAt: string
}

/** My open requests, sent and received, with the other person's profile. */
export function useFriendRequests() {
  return useQuery({
    queryKey: qk.friendRequests,
    queryFn: async (): Promise<FriendRequest[]> => {
      const { data, error } = await supabase.rpc('my_friend_requests')
      if (error) throw error
      const ids = [...new Set(data.map((r) => r.other_id))]
      const people = new Map<string, Person>()
      if (ids.length) {
        const p = await supabase.from('profiles').select(PERSON_FIELDS).in('id', ids)
        if (p.error) throw p.error
        for (const row of p.data) people.set(row.id, row as Person)
      }
      return data
        .filter((r) => people.has(r.other_id))
        .map((r) => ({
          id: r.id,
          incoming: r.incoming,
          person: people.get(r.other_id)!,
          pod: r.pod_id ? { id: r.pod_id, name: r.pod_name ?? 'a pod', habitId: r.habit_id ?? '' } : null,
          createdAt: r.created_at,
        }))
    },
  })
}

/** How many requests are waiting for my answer (the badge on Home's +). */
export function useIncomingRequestCount() {
  const requests = useFriendRequests()
  return requests.data?.filter((r) => r.incoming).length ?? 0
}

export function useFriends() {
  const me = useMe()
  return useQuery({
    queryKey: qk.friends,
    queryFn: async (): Promise<Person[]> => {
      const { data, error } = await supabase.from('friendships').select('user_a, user_b').or(`user_a.eq.${me},user_b.eq.${me}`)
      if (error) throw error
      const ids = data.map((f) => (f.user_a === me ? f.user_b : f.user_a))
      if (!ids.length) return []
      const p = await supabase.from('profiles').select(PERSON_FIELDS).in('id', ids).order('display_name')
      if (p.error) throw p.error
      return p.data as Person[]
    },
  })
}

/** People whose username starts with what I typed (2+ characters), not me and not anyone I blocked. */
export function useSearchPeople(query: string) {
  const me = useMe()
  const q = query.trim().replace(/^@/, '').toLowerCase()
  return useQuery({
    queryKey: qk.peopleSearch(q),
    enabled: q.length >= 2,
    staleTime: 60_000,
    queryFn: async (): Promise<Person[]> => {
      const safe = q.replace(/[%_\\]/g, (c) => `\\${c}`)
      const [found, blocks] = await Promise.all([
        supabase.from('profiles').select(PERSON_FIELDS).ilike('username', `${safe}%`).neq('id', me).order('username').limit(20),
        supabase.from('blocks').select('blocked_id').eq('blocker_id', me),
      ])
      if (found.error) throw found.error
      if (blocks.error) throw blocks.error
      const blocked = new Set(blocks.data.map((b) => b.blocked_id))
      return (found.data as Person[]).filter((p) => !blocked.has(p.id))
    },
  })
}

/** Which of my pods this person is already in (they can be invited to the others). */
export function useTheirPods(userId: string, enabled = true) {
  const pods = useMyPods()
  const myIds = useMemo(() => pods.data?.map((p) => p.id) ?? [], [pods.data])
  return useQuery({
    queryKey: [...qk.theirPods(userId), myIds.join(',')],
    enabled: enabled && myIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('pod_members').select('pod_id').eq('user_id', userId).in('pod_id', myIds)
      if (error) throw error
      return new Set(data.map((m) => m.pod_id))
    },
  })
}

export type FriendState =
  | { kind: 'self' }
  | { kind: 'friends' }
  | { kind: 'sent'; request: FriendRequest }
  | { kind: 'received'; request: FriendRequest }
  | { kind: 'none' }

/** Where I stand with this person: friends, a request either way, or nothing yet. */
export function useFriendState(userId: string): FriendState {
  const me = useMe()
  const requests = useFriendRequests()
  const friends = useFriends()
  if (userId === me) return { kind: 'self' }
  if (friends.data?.some((f) => f.id === userId)) return { kind: 'friends' }
  const r = requests.data?.find((x) => x.person.id === userId)
  if (r) return r.incoming ? { kind: 'received', request: r } : { kind: 'sent', request: r }
  return { kind: 'none' }
}

function refresh(queryClient: QueryClient) {
  for (const key of [qk.friendRequests, qk.friends, ['theirPods'], qk.pods, ['podmates'], ['sharedPods']]) {
    void queryClient.invalidateQueries({ queryKey: key })
  }
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ to, podId }: { to: string; podId?: string | null }) => {
      const { error } = await supabase.rpc('send_friend_request', { p_to: to, p_pod_id: podId ?? undefined })
      if (error) throw new Error(error.message)
    },
    onSettled: () => refresh(queryClient),
  })
}

/** Accept (join their pod and become friends) or decline. Returns the pod joined, if any. */
export function useRespondFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { data, error } = await supabase.rpc('respond_friend_request', { p_id: id, p_accept: accept })
      if (error) throw new Error(error.message)
      return (data as string | null) ?? null
    },
    onSettled: () => refresh(queryClient),
  })
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('cancel_friend_request', { p_id: id })
      if (error) throw new Error(error.message)
    },
    onSettled: () => refresh(queryClient),
  })
}
