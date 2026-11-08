/**
 * App-wide live updates and freshness, mounted once while signed in:
 *  - one Realtime subscription per table that many screens share (instead of one per hook call,
 *    which opened a channel for every screen showing the pod list and refetched N times per message);
 *  - a refresh when a pod's local day rolls over, so "snapped today" never carries into tomorrow.
 * Coming back to the foreground is handled by focusManager in queryClient.ts.
 */
import { podDate } from '@podmates/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useMyPods } from '@/features/pods/hooks'
import { qk } from './keys'
import { useRealtimeInvalidate } from './realtime'
import { useNow } from './useNow'

export function LiveSync() {
  // Chat previews and "snapped today" counts change whenever anyone posts.
  useRealtimeInvalidate('messages', undefined, [qk.pods])
  useRealtimeInvalidate('direct_messages', undefined, [qk.dmThreads])
  useRealtimeInvalidate('pair_trees', undefined, [qk.pairTrees])
  // Friend requests sent to me (or answered) update the + badge and the Friends tab.
  useRealtimeInvalidate('friend_requests', undefined, [qk.friendRequests, qk.friends])
  useRealtimeInvalidate('friendships', undefined, [qk.friends, qk.pods])
  useDayRollover()
  return null
}

function useDayRollover() {
  const queryClient = useQueryClient()
  const pods = useMyPods()
  const now = useNow()
  const days = pods.data?.map((p) => podDate(now, p.timeZone)).join('|') ?? ''
  const last = useRef(days)
  useEffect(() => {
    if (last.current && days && last.current !== days) {
      for (const key of [qk.pods, ['members'], ['stories'], qk.pairTrees, ['pairToday']]) void queryClient.invalidateQueries({ queryKey: key })
    }
    last.current = days
  }, [days, queryClient])
}
