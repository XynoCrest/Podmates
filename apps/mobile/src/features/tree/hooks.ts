import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

export interface PodDay {
  podDate: string
  outcome: 'thrive' | 'steady' | 'wilt' | 'dormant'
  contributors: number
  members: number
  hpDelta: number
}

/** The tree's last 7 settled days (oldest first) for the week strip. */
export function useTreeHistory(podId: string) {
  const query = useQuery({
    queryKey: qk.tree(podId),
    queryFn: async (): Promise<PodDay[]> => {
      const { data, error } = await supabase
        .from('pod_days')
        .select('pod_date, outcome, contributors, members, hp_delta')
        .eq('pod_id', podId)
        .order('pod_date', { ascending: false })
        .limit(7)
      if (error) throw error
      return data
        .map((d) => ({ podDate: d.pod_date, outcome: d.outcome as PodDay['outcome'], contributors: d.contributors, members: d.members, hpDelta: d.hp_delta }))
        .reverse()
    },
  })
  useRealtimeInvalidate('trees', `pod_id=eq.${podId}`, [qk.tree(podId), qk.pods])
  return query
}

function useTreeMutation(fn: (podId: string) => Promise<unknown>, podId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => fn(podId),
    onSettled: () => {
      for (const key of [qk.pods, qk.tree(podId), qk.members(podId), qk.messages(podId)]) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

export const useReplant = (podId: string) => useTreeMutation(api.replant, podId)
export const useEndDay = (podId: string) => useTreeMutation(api.endDay, podId)
export const useOpenWindow = (podId: string) => useTreeMutation(api.openWindow, podId)
