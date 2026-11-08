import { podDate } from '@podmates/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useMe } from '@/ctx/session'
import { api } from '@/lib/api'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { useMyPods, type PodSummary } from '../pods/hooks'
import type { PodDay } from '../tree/hooks'

/**
 * A podmate pair's tree and streak: a pod of two, settled nightly by apps/api.
 * A person counts as snapped on a day if they snapped on time in any pod the two share.
 */
export interface PairTree {
  hp: number
  maxHp: number
  growth: number
  status: 'alive' | 'dead'
  /** Consecutive days both snapped. */
  streak: number
}

/** Every pair tree I'm in, keyed by the other person's id. */
export function usePairTrees() {
  const me = useMe()
  const query = useQuery({
    queryKey: qk.pairTrees,
    queryFn: async () => {
      // RLS returns only the pairs I'm in.
      const { data, error } = await supabase.from('pair_trees').select('user_a, user_b, hp, max_hp, growth, status, streak')
      if (error) throw error
      return data
    },
  })
  const data = useMemo(() => {
    const byOther = new Map<string, PairTree>()
    for (const t of query.data ?? []) {
      byOther.set(t.user_a === me ? t.user_b : t.user_a, { hp: t.hp, maxHp: t.max_hp, growth: t.growth, status: t.status as PairTree['status'], streak: t.streak })
    }
    return byOther
  }, [query.data, me])
  return { ...query, data }
}

export function usePairTree(otherId: string) {
  const trees = usePairTrees()
  return { ...trees, data: trees.data.get(otherId) }
}

/** The pods we share, and the pair's "today": the earliest local date across them (what settlement scores). */
export function useSharedPods(otherId: string, now: Date) {
  const pods = useMyPods()
  const shared = useMemo<PodSummary[]>(() => pods.data?.filter((p) => p.members.some((m) => m.id === otherId)) ?? [], [pods.data, otherId])
  const today = shared.map((p) => podDate(now, p.timeZone)).sort()[0] ?? null
  return { shared, today }
}

/** Which of us has snapped on time today in any shared pod. */
export function usePairToday(otherId: string, now: Date) {
  const me = useMe()
  const { shared, today } = useSharedPods(otherId, now)
  const podIds = shared.map((p) => p.id)
  const query = useQuery({
    queryKey: [...qk.pairToday(otherId), today, podIds.join(',')],
    enabled: !!today && podIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('contributions').select('user_id').in('pod_id', podIds).in('user_id', [me, otherId]).eq('pod_date', today!)
      if (error) throw error
      const done = new Set(data.map((c) => c.user_id))
      return { me: done.has(me), other: done.has(otherId) }
    },
  })
  useRealtimeInvalidate('contributions', undefined, [qk.pairToday(otherId)], podIds.length > 0)
  return { ...query, shared, today }
}

/** The pair tree's last 7 settled days (oldest first), shaped like a pod's for the week strip. */
export function usePairHistory(otherId: string) {
  const me = useMe()
  const [a, b] = me < otherId ? [me, otherId] : [otherId, me]
  return useQuery({
    queryKey: qk.pairHistory(otherId),
    queryFn: async (): Promise<PodDay[]> => {
      const { data, error } = await supabase
        .from('pair_days')
        .select('pair_date, outcome, contributors, hp_delta')
        .eq('user_a', a)
        .eq('user_b', b)
        .order('pair_date', { ascending: false })
        .limit(7)
      if (error) throw error
      return data
        .map((d) => ({ podDate: d.pair_date, outcome: d.outcome as PodDay['outcome'], contributors: d.contributors, members: 2, hpDelta: d.hp_delta }))
        .reverse()
    },
  })
}

function usePairMutation(fn: (userId: string) => Promise<unknown>, otherId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fn(otherId),
    onSettled: () => {
      for (const key of [qk.pairTrees, qk.pairHistory(otherId), qk.pairToday(otherId)]) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export const useReplantPair = (otherId: string) => usePairMutation(api.replantPair, otherId)
export const useEndPairDay = (otherId: string) => usePairMutation(api.endPairDay, otherId)
