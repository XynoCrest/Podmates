import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './supabase'

/**
 * Invalidate `keys` whenever rows change in `table` (optionally filtered,
 * e.g. `pod_id=eq.<id>`). RLS applies to Realtime too: you only hear about
 * rows you could read.
 */
export function useRealtimeInvalidate(table: string, filter: string | undefined, keys: QueryKey[], enabled = true) {
  const queryClient = useQueryClient()
  const keyHash = JSON.stringify(keys)
  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel(`rt:${table}:${filter ?? 'all'}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        for (const key of JSON.parse(keyHash) as QueryKey[]) void queryClient.invalidateQueries({ queryKey: key })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table, filter, keyHash, enabled, queryClient])
}
