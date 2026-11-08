import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Icon, PressableScale, Text } from '@/components/ui'
import { podWindow, type PodSummary } from '../hooks'

/** "Your window is open" call-out — the one thing that matters most right now. */
export function WindowBanner({ pod, now }: { pod: PodSummary; now: Date }) {
  const w = podWindow(pod, now)
  if (w.status !== 'open') return null
  return (
    <PressableScale onPress={() => router.navigate({ pathname: '/camera', params: { podId: pod.id } })} accessibilityLabel={`Snap now for ${pod.name}`}>
      <View style={{ marginHorizontal: 20, marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.flame.soft, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.flame.DEFAULT }} />
        <Text numberOfLines={1} style={{ flex: 1, color: colors.flame.deep, fontWeight: '700', fontSize: 16 }}>
          {pod.name}: {w.closesInMin} min left in the window
        </Text>
        <Icon name="camera" size={20} color={colors.flame.deep} />
      </View>
    </PressableScale>
  )
}
