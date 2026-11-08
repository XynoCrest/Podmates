import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

export interface TreeDay {
  day: string
  health: number
  active: number
  counted: number
}

/** A pod tree's last 7 days of health (oldest first) for the week strip. */
export function useTreeHistory(podId: string) {
  const query = useQuery({
    queryKey: qk.tree(podId),
    enabled: !!podId,
    queryFn: async (): Promise<TreeDay[]> => {
      const { data, error } = await supabase.from('tree_days').select('day, health, active, counted').eq('pod_id', podId).order('day', { ascending: false }).limit(7)
      if (error) throw error
      return data.reverse()
    },
  })
  useRealtimeInvalidate('trees', `pod_id=eq.${podId}`, [qk.tree(podId), qk.pods], !!podId)
  return query
}

/** Local demo helper: close today for my habits now, so streaks and trees update immediately. */
export function useEndDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.endDay(),
    onSettled: () => {
      for (const key of [qk.myHabits, qk.pods, ['tree'], ['profileStats'], ['podMembers']]) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
