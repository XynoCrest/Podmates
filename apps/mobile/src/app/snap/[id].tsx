import { useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { Button } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { SnapFrame } from '@/features/snaps/components/SnapFrame'
import { useSnap, useToggleOnProfile } from '@/features/snaps/hooks'
import { haptics } from '@/lib/haptics'

/** One snap, opened from chat or a profile grid. Your own snaps can be pinned to your profile. */
export default function SnapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useMe()
  const snap = useSnap(id)
  const queryClient = useQueryClient()
  const toggle = useToggleOnProfile(snap.data?.habitId ?? '')

  if (!snap.data) return <View style={{ flex: 1, backgroundColor: '#000' }} />
  const s = snap.data
  return (
    <SnapFrame
      snap={s}
      footer={
        s.author.id === me ? (
          <Button
            variant="secondary"
            size="sm"
            icon={s.onProfile ? 'check' : 'grid'}
            label={s.onProfile ? 'On your profile' : 'Show on profile'}
            loading={toggle.isPending}
            onPress={() =>
              toggle.mutate(
                { snapId: s.id, onProfile: !s.onProfile },
                {
                  onSuccess: () => {
                    haptics.success()
                    void queryClient.invalidateQueries({ queryKey: ['snap', id] })
                  },
                },
              )
            }
          />
        ) : null
      }
    />
  )
}
