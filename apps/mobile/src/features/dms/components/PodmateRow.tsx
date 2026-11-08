import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Avatar, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { chatTime } from '@/lib/format'
import type { PodmateThread } from '../hooks'

/** Messenger-style row for a one-to-one chat with a mutual follow: avatar · name · last message · time. */
export function PodmateRow({ thread, now }: { thread: PodmateThread; now: Date }) {
  const me = useMe()
  const { person, last, unread } = thread
  const fresh = unread > 0
  const preview = last ? `${last.senderId === me ? 'You: ' : ''}${last.body}` : 'You follow each other. Say hi'
  return (
    <PressableScale onPress={() => router.push({ pathname: '/dm/[userId]', params: { userId: person.id } })} scaleTo={0.98} accessibilityLabel={`Chat with ${person.display_name}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
        <Avatar person={person} size={56} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="headline" numberOfLines={1} style={{ fontSize: 17 }}>
            {person.display_name}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 15, color: fresh ? colors.ink.DEFAULT : colors.ink.muted, fontWeight: fresh ? '600' : '400' }}>
            {preview}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          {last ? <Text variant="caption">{chatTime(last.createdAt, now)}</Text> : null}
          {fresh ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.sky.DEFAULT }} accessibilityLabel={`${unread} unread`} /> : null}
        </View>
      </View>
    </PressableScale>
  )
}
