import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'
import { useHabits, type Habit } from '../pods/hooks'
import { uploadImage } from '../snaps/hooks'

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_color: string
  avatar_url: string | null
  energy: number
  stars: number
  streak: number
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: qk.profile(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_color, avatar_url, energy, stars, streak')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })
}

/**
 * The habit tabs on a profile: for me, every habit I have a pod in; for others,
 * habits they've put snaps on their profile for.
 */
export function useProfileHabits(userId: string) {
  const me = useMe()
  const habits = useHabits()
  const ids = useQuery({
    queryKey: qk.profileHabits(userId),
    queryFn: async () => {
      if (userId === me) {
        const { data, error } = await supabase.from('pods').select('habit_id, pod_members!inner(user_id)').eq('pod_members.user_id', me)
        if (error) throw error
        return [...new Set(data.map((p) => p.habit_id))]
      }
      const { data, error } = await supabase.from('snaps').select('habit_id').eq('user_id', userId).eq('on_profile', true)
      if (error) throw error
      return [...new Set(data.map((s) => s.habit_id))]
    },
  })
  const data: Habit[] = (habits.data ?? []).filter((h) => ids.data?.includes(h.id))
  return { data, isLoading: habits.isLoading || ids.isLoading }
}

export function useUpdateProfile() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { display_name: string; username: string; bio: string; avatar_color: string; newAvatarUri?: string | null }) => {
      const avatar_url = input.newAvatarUri ? await uploadImage(me, input.newAvatarUri, 512) : undefined
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: input.display_name.trim(),
          username: input.username.trim().toLowerCase(),
          bio: input.bio.trim(),
          avatar_color: input.avatar_color,
          ...(avatar_url ? { avatar_url } : {}),
        })
        .eq('id', me)
      if (error) throw new Error(error.code === '23505' ? 'That username is taken' : error.code === '23514' ? 'Usernames are 3–24 lowercase letters, numbers, _ or .' : error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.profile(me) })
      void queryClient.invalidateQueries({ queryKey: qk.pods })
    },
  })
}
