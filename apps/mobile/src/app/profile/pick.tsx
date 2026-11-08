import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { Dimensions, FlatList, View } from 'react-native'
import { Icon, PressableScale, Text } from '@/components/ui'
import { useHabits } from '@/features/pods/hooks'
import { useMySnaps, useToggleOnProfile } from '@/features/snaps/hooks'
import { haptics } from '@/lib/haptics'
import { imageUri } from '@/lib/images'

const W = (Dimensions.get('window').width - 4) / 3

/** Pick which of my past snaps show on my profile grid for this habit. */
export default function PickSnaps() {
  const { habit } = useLocalSearchParams<{ habit: string }>()
  const habits = useHabits()
  const snaps = useMySnaps(habit)
  const toggle = useToggleOnProfile(habit)
  const name = habits.data?.find((h) => h.id === habit)?.name ?? ''
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ padding: 20, gap: 4 }}>
        <Text variant="title">Your {name} snaps</Text>
        <Text variant="subhead">Tap to show or hide on your profile. Shown snaps are visible to everyone on Podmates.</Text>
      </View>
      <FlatList
        data={snaps.data}
        numColumns={3}
        keyExtractor={(s) => s.id}
        columnWrapperStyle={{ gap: 2 }}
        contentContainerStyle={{ gap: 2, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <PressableScale
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
                <Icon name={item.onProfile ? 'checkCircle' : 'circle'} size={24} color={item.onProfile ? colors.leaf.DEFAULT : '#fff'} />
              </View>
            </View>
          </PressableScale>
        )}
        ListEmptyComponent={<Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>No snaps for this habit yet.</Text>}
      />
    </View>
  )
}
