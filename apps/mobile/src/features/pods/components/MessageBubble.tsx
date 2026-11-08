import { colors, radii } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Avatar, Chip, PressableScale, Text } from '@/components/ui'
import { chatTime, firstName } from '@/lib/format'
import { imageUri } from '@/lib/images'
import type { ChatMessage } from '../hooks'

/**
 * One chat row. `grouped` = same author as the message above, so the avatar
 * and name are hidden (Messenger-style runs).
 */
export function MessageBubble({ message, mine, grouped }: { message: ChatMessage; mine: boolean; grouped: boolean }) {
  if (message.kind === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 10 }}>
        <View style={{ backgroundColor: colors.leaf.soft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text variant="subhead" center style={{ color: colors.leaf.DEFAULT }}>
            🌳 {message.body}
          </Text>
        </View>
        <Text variant="caption" style={{ marginTop: 4, color: colors.ink.subtle }}>
          {chatTime(message.createdAt)}
        </Text>
      </View>
    )
  }

  const author = message.author
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', paddingHorizontal: 12, marginTop: grouped ? 2 : 10, gap: 8 }}>
      {!mine ? <View style={{ width: 28, justifyContent: 'flex-end' }}>{!grouped && author ? <Avatar person={author} size={28} /> : null}</View> : null}
      <View style={{ maxWidth: '75%', alignItems: mine ? 'flex-end' : 'flex-start' }}>
        {!mine && !grouped && author ? (
          <Text variant="caption" style={{ marginLeft: 10, marginBottom: 2 }}>
            {firstName(author.display_name)}
          </Text>
        ) : null}
        {message.kind === 'snap' && message.snap ? (
          <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: message.snap!.id } })} scaleTo={0.98} accessibilityLabel="Open snap">
            <View style={{ width: 200, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surface }}>
              <Image source={{ uri: imageUri(message.snap.image) }} style={{ width: 200, height: 266, borderRadius: radii.snap }} contentFit="cover" transition={200} />
              <View style={{ position: 'absolute', top: 8, left: 8 }}>
                {message.snap.onTime ? (
                  <Chip icon="bolt" label="ON TIME" color={colors.ink.inverse} bg={colors.energy.DEFAULT} />
                ) : (
                  <Chip icon="clock" label="LATE" color={colors.ink.DEFAULT} bg="rgba(0,0,0,0.55)" />
                )}
              </View>
              {message.body ? (
                <Text style={{ paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 }} numberOfLines={3}>
                  {message.body}
                </Text>
              ) : null}
            </View>
          </PressableScale>
        ) : (
          <View
            style={{
              backgroundColor: mine ? colors.sky.deep : colors.raised,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 9,
            }}
          >
            <Text style={{ fontSize: 16, lineHeight: 21, color: colors.ink.DEFAULT }}>{message.body}</Text>
          </View>
        )}
      </View>
    </View>
  )
}
