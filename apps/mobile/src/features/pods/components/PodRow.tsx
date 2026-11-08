import { healthBand, stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Icon, PressableScale, Text } from '@/components/ui'
import { compact } from '@/lib/format'
import type { Pod } from '../hooks'
import { PodAvatar } from './PodAvatar'

const BAND_COLOR = { thriving: colors.leaf.DEFAULT, okay: colors.energy.DEFAULT, struggling: colors.danger.DEFAULT } as const

/** A habit pod: tree-health ring · name · members and tree stage · health. Opens the pod's feed. */
export function PodRow({ pod, symbol, trailing }: { pod: Pod; symbol: string; trailing?: React.ReactNode }) {
  const band = healthBand(pod.tree.health)
  const stage = stageFor(pod.tree.totalSnaps)
  return (
    <PressableScale onPress={() => router.push({ pathname: '/pod/[id]', params: { id: pod.id } })} scaleTo={0.98} accessibilityLabel={`${pod.name} pod`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
        <PodAvatar symbol={symbol} health={pod.tree.health} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="headline" numberOfLines={1} style={{ fontSize: 17 }}>
            {pod.name} pod
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 15, color: colors.ink.muted }}>
            {compact(pod.memberCount)} {pod.memberCount === 1 ? 'member' : 'members'} · {stage.name}
          </Text>
        </View>
        {trailing ?? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numeric style={{ fontSize: 15, fontWeight: '600', color: BAND_COLOR[band] }}>
              {Math.round(pod.tree.health * 100)}%
            </Text>
            <Icon name="chevronRight" size={14} color={colors.ink.subtle} />
          </View>
        )}
      </View>
    </PressableScale>
  )
}
