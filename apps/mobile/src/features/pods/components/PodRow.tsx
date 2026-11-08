import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Chip, Icon, PressableScale, Text } from '@/components/ui'
import { chatTime, firstName } from '@/lib/format'
import { podWindow, type PodSummary } from '../hooks'
import { PodAvatar } from './PodAvatar'

/** Messenger-style chat row: tree-health avatar · name · last message · time · today's status. */
export function PodRow({ pod, emoji, now }: { pod: PodSummary; emoji: string; now: Date }) {
  const w = podWindow(pod, now)
  const preview = pod.lastMessage
    ? pod.lastMessage.kind === 'system'
      ? `🌳 ${pod.lastMessage.body}`
      : `${pod.lastMessage.author ? `${firstName(pod.lastMessage.author)}: ` : ''}${pod.lastMessage.kind === 'snap' ? `📸 ${pod.lastMessage.body || 'Sent a snap'}` : pod.lastMessage.body}`
    : pod.goal
  const urgent = w.status === 'open' && !pod.meContributedToday && pod.treeStatus === 'alive'
  return (
    <PressableScale onPress={() => router.push({ pathname: '/pod/[id]', params: { id: pod.id } })} scaleTo={0.98} accessibilityLabel={pod.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 14 }}>
        <PodAvatar emoji={emoji} hp={pod.hp} maxHp={pod.maxHp} dead={pod.treeStatus === 'dead'} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1, fontSize: 17 }}>
              {pod.name}
            </Text>
            {pod.myStreak > 0 ? <Chip icon="flame" label={String(pod.myStreak)} color={colors.flame.DEFAULT} bg={colors.flame.soft} /> : null}
          </View>
          <Text numberOfLines={1} style={{ fontSize: 15, color: urgent ? colors.ink.DEFAULT : colors.ink.muted, fontWeight: urgent ? '600' : '400' }}>
            {preview}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text variant="caption">{chatTime(pod.lastActivityAt, now)}</Text>
          {pod.treeStatus === 'dead' ? (
            <Chip label="Replant" color={colors.danger.DEFAULT} bg={colors.danger.soft} />
          ) : pod.meContributedToday ? (
            <Icon name="checkCircle" size={20} color={colors.leaf.DEFAULT} />
          ) : urgent ? (
            <Chip icon="timer" label={`${w.closesInMin}m`} color={colors.ink.inverse} bg={colors.flame.DEFAULT} />
          ) : (
            <Text variant="caption" numberOfLines={1}>
              {pod.contributedToday}/{pod.memberCount}
            </Text>
          )}
        </View>
      </View>
    </PressableScale>
  )
}

