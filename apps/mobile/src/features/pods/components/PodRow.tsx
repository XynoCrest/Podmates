import { formatSnapTime } from '@podmates/shared'
import { healthRatio } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { HealthBar, Meta, PlantLabel, SymbolIcon, Text, Tile, type LabelTone } from '@/components/ui'
import { chatTime, firstName } from '@/lib/format'
import { podWindow, type PodSummary } from '../hooks'

/** The pod's status for its plant label, shared by every screen that shows one. */
export function podStatus(pod: PodSummary, now: Date): { tone: LabelTone; label: string } {
  if (pod.treeStatus === 'dead') return { tone: 'dead', label: 'Replant' }
  if (pod.meContributedToday) return { tone: 'done', label: 'Done' }
  const w = podWindow(pod, now)
  if (w.status === 'open') return { tone: 'open', label: `${w.closesInMin} min left` }
  if (w.status === 'upcoming') return { tone: 'waiting', label: `Opens ${formatSnapTime(pod.snapTime)}` }
  return { tone: 'waiting', label: 'Closed today' }
}

/** A pod: its habit, last chat line, today's status, and the tree's health as a bar. */
export function PodRow({ pod, symbol, now }: { pod: PodSummary; symbol: string; now: Date }) {
  const status = podStatus(pod, now)
  const preview = pod.lastMessage
    ? pod.lastMessage.kind === 'system'
      ? pod.lastMessage.body
      : `${pod.lastMessage.author ? `${firstName(pod.lastMessage.author)}: ` : ''}${pod.lastMessage.kind === 'snap' ? pod.lastMessage.body || 'Sent a snap' : pod.lastMessage.body}`
    : pod.goal
  const ratio = pod.treeStatus === 'dead' ? 0 : healthRatio(pod)
  return (
    <Tile onPress={() => router.push({ pathname: '/pod/[id]', params: { id: pod.id } })} accessibilityLabel={pod.name} style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
          <SymbolIcon name={symbol} size={22} color={colors.ink.muted} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>
              {pod.name}
            </Text>
            <Text variant="caption">{chatTime(pod.lastActivityAt, now)}</Text>
          </View>
          <Text variant="subhead" numberOfLines={1}>
            {preview}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PlantLabel tone={status.tone} label={status.label} />
        <View style={{ flex: 1 }}>
          <HealthBar ratio={ratio} height={8} />
        </View>
        <Meta icon="flame" label={String(pod.myStreak)} />
        <Meta icon="people" label={`${pod.contributedToday}/${pod.memberCount}`} />
      </View>
    </Tile>
  )
}
