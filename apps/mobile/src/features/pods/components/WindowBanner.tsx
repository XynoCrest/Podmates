import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Icon, Text, Tile } from '@/components/ui'
import { podWindow, type PodSummary } from '../hooks'

/** The one thing that matters right now: a window is open and you haven't snapped. */
export function WindowBanner({ pod, now }: { pod: PodSummary; now: Date }) {
  const w = podWindow(pod, now)
  if (w.status !== 'open') return null
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
      <Tile tone="sun" onPress={() => router.navigate({ pathname: '/camera', params: { podId: pod.id } })} accessibilityLabel={`Snap now for ${pod.name}`} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.sun.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cameraFill" size={20} color={colors.ink.inverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numeric style={{ color: colors.sun.DEFAULT, fontWeight: '600', fontSize: 15 }}>
            {w.closesInMin} min left to snap
          </Text>
          <Text variant="subhead" numberOfLines={1}>
            {pod.name} · {pod.goal}
          </Text>
        </View>
        <Icon name="chevronRight" size={16} color={colors.sun.DEFAULT} weight="semibold" />
      </Tile>
    </View>
  )
}
