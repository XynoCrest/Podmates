import { colors, radii } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Avatar, Icon, PlantLabel, PressableScale, Text } from '@/components/ui'
import { chatTime, firstName } from '@/lib/format'
import { imageUri } from '@/lib/images'
import type { ChatMessage } from '../hooks'

/** One chat row. `grouped` = same author as the message above, so avatar and name are hidden. */
export function MessageBubble({ message, mine, grouped }: { message: ChatMessage; mine: boolean; grouped: boolean }) {
  if (message.kind === 'system') {
    // Tree news: a quiet line with a leaf, centred between the runs of chat.
    return (
      <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 12, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="leaf" size={14} color={colors.leaf.DEFAULT} />
          <Text variant="subhead" center style={{ color: colors.ink.muted, flexShrink: 1 }}>
            {message.body}
          </Text>
        </View>
        <Text variant="caption">{chatTime(message.createdAt)}</Text>
      </View>
    )
  }

  const author = message.author
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', paddingHorizontal: 16, marginTop: grouped ? 4 : 12, gap: 8 }}>
      {!mine ? <View style={{ width: 28, justifyContent: 'flex-end' }}>{!grouped && author ? <Avatar person={author} size={28} /> : null}</View> : null}
      <View style={{ maxWidth: '76%', alignItems: mine ? 'flex-end' : 'flex-start', gap: 4 }}>
        {!mine && !grouped && author ? (
          <Text variant="caption" style={{ marginLeft: 12 }}>
            {firstName(author.display_name)}
          </Text>
        ) : null}
        {message.kind === 'snap' && message.snap ? (
          <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: message.snap!.id } })} scaleTo={0.98} accessibilityLabel="Open snap">
            <View style={{ width: 208, borderRadius: radii.tile, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.lip, backgroundColor: colors.surface, padding: 4, gap: 8 }}>
              <Image source={{ uri: imageUri(message.snap.image) }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radii.photo }} contentFit="cover" transition={200} />
              <View style={{ paddingHorizontal: 8, paddingBottom: 8, gap: 8 }}>
                <PlantLabel tone={message.snap.onTime ? 'done' : 'waiting'} label={message.snap.onTime ? 'On time · +10 energy' : 'Late'} icon={message.snap.onTime ? 'bolt' : 'clock'} />
                {message.body ? (
                  <Text variant="callout" numberOfLines={3}>
                    {message.body}
                  </Text>
                ) : null}
              </View>
            </View>
          </PressableScale>
        ) : (
          <View
            style={{
              backgroundColor: mine ? colors.leaf.soft : colors.surface,
              borderWidth: 2,
              borderColor: mine ? colors.leaf.deep : colors.line,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontSize: 16, lineHeight: 22 }}>{message.body}</Text>
          </View>
        )}
      </View>
    </View>
  )
}
