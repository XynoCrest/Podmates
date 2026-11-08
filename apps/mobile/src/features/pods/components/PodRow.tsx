import { healthRatio } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { LineIcon, PressableScale, Text } from '@/components/ui'
import { chatTime, firstName } from '@/lib/format'
import { podWindow, type PodSummary } from '../hooks'
import { PodAvatar } from './PodAvatar'

/** Chat row: tree disc · name · last message (author in bold) · time, green + dot while my window is open. */
export function PodRow({ pod, now }: { pod: PodSummary; now: Date }) {
  const w = podWindow(pod, now)
  const dead = pod.treeStatus === 'dead'
  const urgent = w.status === 'open' && !pod.meContributedToday && !dead
  const last = pod.lastMessage
  // Tree news (system messages) reads amber while the tree is struggling.
  const struggling = dead || healthRatio(pod) <= 0.5
  const previewColor = last?.kind === 'system' && struggling ? colors.flame.deep : colors.ink.muted
  const body = !last ? pod.goal : last.kind === 'snap' ? `snapped${last.body ? `: ${last.body}` : ''}. ${pod.contributedToday} of ${pod.memberCount} in` : last.body

  return (
    <PressableScale onPress={() => router.push({ pathname: '/pod/[id]', params: { id: pod.id } })} scaleTo={0.98} accessibilityLabel={pod.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 16 }}>
        <PodAvatar growth={pod.growth} hp={pod.hp} maxHp={pod.maxHp} dead={dead} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text numberOfLines={1} style={{ fontSize: 19, fontWeight: '700' }}>
            {pod.name}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 16, color: previewColor }}>
            {last?.author && last.kind !== 'system' ? <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink.DEFAULT }}>{firstName(last.author).toLowerCase()} </Text> : null}
            {body}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8, alignSelf: 'stretch', paddingVertical: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: urgent ? '700' : '400', color: urgent ? colors.leaf.DEFAULT : colors.ink.muted }}>{urgent ? `${w.closesInMin} min` : chatTime(pod.lastActivityAt, now)}</Text>
          {dead ? (
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger.DEFAULT }}>Replant</Text>
          ) : urgent ? (
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.leaf.bright }} accessibilityLabel="Snap window open" />
          ) : pod.meContributedToday ? (
            <LineIcon name="checkedBadge" size={16} color={colors.leaf.bright} />
          ) : null}
        </View>
      </View>
    </PressableScale>
  )
}
