import { colors, overlay, space } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { Dimensions, View } from 'react-native'
import { Icon, PressableScale, ScreenState, SheetScreen } from '@/components/ui'
import { useHabits } from '@/features/pods/hooks'
import { useMySnaps, useToggleOnProfile } from '@/features/snaps/hooks'
import { haptics } from '@/lib/haptics'
import { imageUri } from '@/lib/images'

const GAP = 2
const W = (Dimensions.get('window').width - space.gutter * 2 - GAP * 2) / 3

/** Pick which of my past snaps show on my profile grid for this habit. Saves on every tap. */
export default function PickSnaps() {
  const { habit } = useLocalSearchParams<{ habit: string }>()
  const habits = useHabits()
  const snaps = useMySnaps(habit)
  const toggle = useToggleOnProfile(habit)
  const name = habits.data?.find((h) => h.id === habit)?.name ?? ''
  return (
    <SheetScreen title={`Your ${name} snaps`} subtitle="Tap to show or hide on your profile. Shown snaps are visible to everyone on Podmates.">
      {snaps.data?.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {snaps.data.map((item) => (
            <PressableScale
              key={item.id}
              onPress={() => {
                haptics.select()
                toggle.mutate({ snapId: item.id, onProfile: !item.onProfile })
              }}
              scaleTo={0.96}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.onProfile }}
            >
              <View>
                <Image source={{ uri: imageUri(item.image) }} style={{ width: W, height: W * (4 / 3), opacity: item.onProfile ? 1 : 0.55 }} contentFit="cover" recyclingKey={item.id} />
                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                  <Icon name={item.onProfile ? 'checkCircle' : 'circle'} size={24} color={item.onProfile ? colors.leaf.DEFAULT : overlay.ink} />
                </View>
              </View>
            </PressableScale>
          ))}
        </View>
      ) : (
        <ScreenState loading={snaps.isLoading} error={snaps.error} empty={{ icon: 'camera', title: 'No snaps yet', body: 'Snaps you take for this habit show up here.' }} />
      )}
    </SheetScreen>
  )
}
