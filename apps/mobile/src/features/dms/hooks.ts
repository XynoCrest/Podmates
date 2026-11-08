import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { usePairTrees, type PairTree } from '../pairs/hooks'
import { PERSON_FIELDS, type ChatMessage, type Person } from '../pods/hooks'

export interface DirectMessage {
  id: string
  senderId: string
  recipientId: string
  body: string
  createdAt: string
  readAt: string | null
}

export interface PodmateThread {
  person: Person
  /** Names of the pods we share in this habit. */
  pods: string[]
  last: DirectMessage | null
  /** Messages from them I haven't opened yet. */
  unread: number
  /** Our pair tree and streak; null until settlement first sees the pair. */
  pair: PairTree | null
}

const DM_FIELDS = 'id, sender_id, recipient_id, body, created_at, read_at'
const toDm = (m: { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null }): DirectMessage => ({
  id: m.id,
  senderId: m.sender_id,
  recipientId: m.recipient_id,
  body: m.body,
  createdAt: m.created_at,
  readAt: m.read_at,
})

/** Everyone in these pods but me, each with the last direct message between us. Threads with messages first. */
export function usePodmates(podIds: string[]) {
  const me = useMe()
  const key = [...podIds].sort().join(',')
  const members = useQuery({
    queryKey: qk.podmates(key),
    enabled: podIds.length > 0,
    queryFn: async () => {
      const [{ data, error }, blocks] = await Promise.all([
        supabase.from('pod_members').select(`pod:pods(name), profile:profiles(${PERSON_FIELDS})`).in('pod_id', podIds),
        supabase.from('blocks').select('blocked_id').eq('blocker_id', me),
      ])
      if (error) throw error
      if (blocks.error) throw blocks.error
      // People I blocked don't show up as podmates (we can't message each other).
      const blocked = new Set(blocks.data.map((b) => b.blocked_id))
      return data
        .filter((m) => !blocked.has((m.profile as Person).id))
        .map((m) => ({ pod: (m.pod as { name: string } | null)?.name ?? '', person: m.profile as Person }))
    },
  })
  const threads = useQuery({
    queryKey: qk.dmThreads,
    queryFn: async (): Promise<DirectMessage[]> => {
      // RLS returns only messages I sent or received; newest first, so the first per person is the last word.
      const { data, error } = await supabase.from('direct_messages').select(DM_FIELDS).order('created_at', { ascending: false }).limit(500)
      if (error) throw error
      return data.map(toDm)
    },
  })
  const pairs = usePairTrees()

  const data = useMemo<PodmateThread[]>(() => {
    const byId = new Map<string, PodmateThread>()
    for (const m of members.data ?? []) {
      if (m.person.id === me) continue
      const t = byId.get(m.person.id) ?? { person: m.person, pods: [], last: null, unread: 0, pair: pairs.data.get(m.person.id) ?? null }
      if (m.pod && !t.pods.includes(m.pod)) t.pods.push(m.pod)
      byId.set(m.person.id, t)
    }
    for (const dm of threads.data ?? []) {
      const other = dm.senderId === me ? dm.recipientId : dm.senderId
      const t = byId.get(other)
      if (!t) continue
      if (!t.last) t.last = dm
      if (dm.senderId === other && !dm.readAt) t.unread++
    }
    return [...byId.values()].sort((a, b) => {
      if (a.last && b.last) return b.last.createdAt.localeCompare(a.last.createdAt)
      if (a.last || b.last) return a.last ? -1 : 1
      return a.person.display_name.localeCompare(b.person.display_name)
    })
  }, [members.data, threads.data, me, pairs.data])

  return {
    data,
    isLoading: members.isLoading || threads.isLoading,
    refetch: () => Promise.all([members.refetch(), threads.refetch()]),
  }
}

/** One thread, newest first (for an inverted list), shaped like pod chat messages so the same bubbles render it. */
export function useDirectMessages(other: Person | undefined) {
  const me = useMe()
  const otherId = other?.id ?? ''
  const query = useQuery({
    queryKey: qk.dm(otherId),
    enabled: !!other,
    queryFn: async (): Promise<DirectMessage[]> => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(DM_FIELDS)
        .or(`and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data.map(toDm)
    },
  })
  useRealtimeInvalidate('direct_messages', undefined, [qk.dm(otherId), qk.dmThreads], !!other)
  const messages = useMemo<ChatMessage[]>(
    () =>
      (query.data ?? []).map((m) => ({
        id: m.id,
        kind: 'text',
        body: m.body,
        createdAt: m.createdAt,
        author: m.senderId === me ? ({ id: me } as Person) : (other ?? null),
        snap: null,
      })),
    [query.data, me, other],
  )
  return { ...query, messages }
}

/**
 * Marks everything they've sent me as read while the thread is open: once on open,
 * and again whenever a new message from them lands (the thread query refetches on realtime).
 */
export function useMarkThreadRead(otherId: string, thread: DirectMessage[] | undefined) {
  const me = useMe()
  const queryClient = useQueryClient()
  const pending = !!thread?.some((m) => m.senderId === otherId && m.recipientId === me && !m.readAt)
  useEffect(() => {
    if (!pending) return
    void supabase.rpc('mark_dm_read', { p_other: otherId }).then(({ error }) => {
      if (error) return
      void queryClient.invalidateQueries({ queryKey: qk.dm(otherId) })
      void queryClient.invalidateQueries({ queryKey: qk.dmThreads })
    })
  }, [pending, otherId, queryClient])
}

export function useSendDirect(otherId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('direct_messages').insert({ recipient_id: otherId, body })
      if (error) throw error
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.dm(otherId) })
      void queryClient.invalidateQueries({ queryKey: qk.dmThreads })
    },
  })
}
