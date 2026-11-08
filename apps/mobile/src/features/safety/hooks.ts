/**
 * Safety and well-being: rest days, leaving and removing pod members, blocking, reporting and
 * deleting your account. Rules live in the database (supabase/migrations/…_safety_and_rest.sql);
 * these hooks call it and refresh what changes.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { showActionSheet } from '@/lib/actionSheet'
import { haptics } from '@/lib/haptics'
import { auth, useMe } from '@/ctx/session'
import { api } from '@/lib/api'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'

/** Everything that shows people's content: refreshed after a block or report hides something. */
function refreshContent(queryClient: QueryClient) {
  for (const key of [['messages'], ['stories'], ['feed'], ['post'], ['comments'], ['dm'], ['dmThreads'], ['podmates'], ['profileBoard'], ['profileStory'], ['profileSnaps'], ['daySnaps'], ['snap'], ['community'], qk.pods]) {
    void queryClient.invalidateQueries({ queryKey: key })
  }
}

function refreshPod(queryClient: QueryClient, podId: string) {
  void queryClient.invalidateQueries({ queryKey: qk.pods })
  void queryClient.invalidateQueries({ queryKey: qk.members(podId) })
  void queryClient.invalidateQueries({ queryKey: qk.messages(podId) })
  void queryClient.invalidateQueries({ queryKey: qk.tree(podId) })
}

export const REST_DAYS_PER_WEEK = 2

/** Declare today a rest day in this pod: the streak holds and the tree doesn't count you today. */
export function useRestToday(podId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('rest_today', { p_pod_id: podId })
      if (error) throw new Error(error.message)
    },
    onSettled: () => refreshPod(queryClient, podId),
  })
}

export function useCancelRest(podId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cancel_rest', { p_pod_id: podId })
      if (error) throw new Error(error.message)
    },
    onSettled: () => refreshPod(queryClient, podId),
  })
}

export function useLeavePod(podId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('leave_pod', { p_pod_id: podId })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: qk.messages(podId) })
      // Its stories, shared-pod lines and habit cards go too.
      for (const key of [qk.pods, ['podmates'], ['stories'], ['sharedPods'], ['habitCards'], ['profileHabits'], qk.pairTrees]) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/** The pod's creator removes someone. */
export function useRemoveMember(podId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_pod_member', { p_pod_id: podId, p_user_id: userId })
      if (error) throw new Error(error.message)
    },
    onSettled: () => refreshPod(queryClient, podId),
  })
}

/** Have I blocked this person? */
export function useBlocked(userId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.blocked(userId),
    enabled: userId !== me,
    queryFn: async () => {
      const { count, error } = await supabase.from('blocks').select('blocked_id', { count: 'exact', head: true }).eq('blocker_id', me).eq('blocked_id', userId)
      if (error) throw error
      return (count ?? 0) > 0
    },
  })
}

export function useSetBlocked(userId: string) {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (block: boolean) => {
      const { error } = block
        ? await supabase.from('blocks').upsert({ blocker_id: me, blocked_id: userId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true })
        : await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', userId)
      if (error) throw error
    },
    onSuccess: (_d, block) => {
      queryClient.setQueryData(qk.blocked(userId), block)
      refreshContent(queryClient)
    },
  })
}

export type ReportTarget = 'snap' | 'post' | 'comment' | 'profile'
export const REPORT_REASONS = [
  { key: 'inappropriate', label: 'Inappropriate or offensive' },
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'fake', label: 'Fake or reused snap' },
  { key: 'spam', label: 'Spam' },
  { key: 'other', label: 'Something else' },
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]['key']

/** Saves a report for the team. The item is then hidden from me (not from anyone else). */
export function useReport() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (r: { type: ReportTarget; id: string; reason: ReportReason }) => {
      const { error } = await supabase.from('reports').insert({ reporter_id: me, target_type: r.type, target_id: r.id, reason: r.reason })
      // Reporting the same thing twice is fine: it's already saved.
      if (error && error.code !== '23505') throw error
    },
    onSuccess: () => refreshContent(queryClient),
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await api.deleteAccount()
      // The account is gone: if the local sign-out hiccups, that's not a failed deletion.
      await auth.signOut().catch(() => {})
    },
  })
}

/**
 * The report flow everywhere: pick a reason, save it, say thanks. `onDone` runs after saving
 * (the item is now hidden from me, so a full-screen viewer should close).
 */
export function useReportFlow() {
  const report = useReport()
  return (type: ReportTarget, id: string, what: string, onDone?: () => void) =>
    showActionSheet({
      title: `Why are you reporting this ${what}?`,
      options: REPORT_REASONS.map((r) => ({
        label: r.label,
        onPress: () =>
          report.mutate(
            { type, id, reason: r.key },
            {
              onSuccess: () => {
                haptics.success()
                Alert.alert('Thanks for telling us', `We’ll review it. You won’t see this ${what} again.`)
                onDone?.()
              },
              onError: (e) => Alert.alert('Couldn’t send the report', e.message),
            },
          ),
      })),
    })
}
