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
      <View style={{ marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: colors.flame.soft, borderWidth: 1, borderColor: colors.flame.deep, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.flame.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cameraFill" size={20} color={colors.ink.inverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.flame.DEFAULT, fontWeight: '700', fontSize: 15 }}>Snap window open · {w.closesInMin} min left</Text>
          <Text variant="subhead" numberOfLines={1}>
            {pod.name} — {pod.goal}
          </Text>
        </View>
        <Icon name="chevronRight" size={16} color={colors.flame.DEFAULT} weight="semibold" />
      </View>
    </PressableScale>
  )
}
