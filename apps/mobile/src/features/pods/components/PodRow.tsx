import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Chip, PressableScale, StreakFlame, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { firstName } from '@/lib/format'
import { podWindow, type PodSummary } from '../hooks'
import { PodAvatar } from './PodAvatar'

/** Messenger-style chat row: group faces · name · last message · today's status · streak. */
export function PodRow({ pod, now }: { pod: PodSummary; now: Date }) {
  const me = useMe()
  const w = podWindow(pod, now)
  const preview = pod.lastMessage
    ? pod.lastMessage.kind === 'system'
      ? pod.lastMessage.body
      : `${pod.lastMessage.author ? `${firstName(pod.lastMessage.author)}: ` : ''}${pod.lastMessage.kind === 'snap' ? pod.lastMessage.body || 'Sent a snap' : pod.lastMessage.body}`
    : pod.goal
  const urgent = w.status === 'open' && !pod.meContributedToday && pod.treeStatus === 'alive'
  return (
    <PressableScale onPress={() => router.push({ pathname: '/pod/[id]', params: { id: pod.id } })} scaleTo={0.98} accessibilityLabel={pod.name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
        <PodAvatar members={pod.members} me={me} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="headline" numberOfLines={1} style={{ fontSize: 17 }}>
            {pod.name}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 15, color: urgent || pod.unread ? colors.ink.DEFAULT : colors.ink.muted, fontWeight: pod.unread ? '600' : urgent ? '500' : '400' }}>
            {preview}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {pod.treeStatus === 'dead' ? (
            <Chip label="Replant" color={colors.danger.DEFAULT} bg={colors.danger.soft} />
          ) : urgent ? (
            <Chip icon="timer" label={`${w.closesInMin}m`} color={colors.ink.inverse} bg={colors.flame.DEFAULT} />
          ) : null}
          {pod.myStreak > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLabel={`${pod.myStreak} day streak`}>
              <StreakFlame size={22} />
              <Text numeric style={{ fontSize: 17, fontWeight: '700', color: '#FF9600' }}>
                {pod.myStreak}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  )
}

