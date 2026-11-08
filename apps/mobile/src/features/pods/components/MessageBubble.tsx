import { windowState } from '@podmates/shared'
import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import { imageUri } from '@/lib/images'
import type { ChatMessage, PodSummary } from '../hooks'

const AVATAR = 44
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/**
 * One chat row. `grouped` = same author as the message above, so the name line is hidden.
 * The avatar sits on the last message of a run; a green check means that person snapped today.
 */
export function MessageBubble({ message, mine, grouped, lastOfRun, snappedToday, pod }: { message: ChatMessage; mine: boolean; grouped: boolean; lastOfRun: boolean; snappedToday: boolean; pod: PodSummary }) {
  if (message.kind === 'system') {
    return (
      <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.leaf.soft, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }}>
          <Icon name="tree" size={16} color={colors.leaf.DEFAULT} />
          <Text style={{ flexShrink: 1, color: colors.leaf.DEFAULT, fontWeight: '600', fontSize: 15 }}>{message.body}</Text>
        </View>
      </View>
    )
  }

  const author = message.author
  const showName = !mine && !grouped && author
  return (
    <View style={{ paddingHorizontal: 20, marginTop: grouped ? 6 : 16 }}>
      {showName ? (
        <Text style={{ marginLeft: AVATAR + 12, marginBottom: 6, fontSize: 15, color: colors.ink.muted }}>
          {firstName(author.display_name).toLowerCase()} · {clock(message.createdAt)}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 12 }}>
        {!mine ? <View style={{ width: AVATAR }}>{lastOfRun && author ? <Avatar person={author} size={AVATAR} ring={snappedToday ? 'done' : undefined} /> : null}</View> : null}
        <View style={{ maxWidth: '78%', flexShrink: 1, alignItems: mine ? 'flex-end' : 'flex-start' }}>
          {message.kind === 'snap' && message.snap ? (
            <SnapCard message={message} pod={pod} />
          ) : (
            <View style={{ backgroundColor: mine ? colors.leaf.DEFAULT : colors.raised, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12 }}>
              <Text style={{ fontSize: 17, lineHeight: 24, color: mine ? colors.ink.inverse : colors.ink.DEFAULT }}>{message.body}</Text>
            </View>
          )}
        </View>
      </View>
      {mine && lastOfRun ? <Text style={{ alignSelf: 'flex-end', marginTop: 6, fontSize: 14, color: colors.ink.muted }}>{clock(message.createdAt)}</Text> : null}
    </View>
  )
}

/** Snap in the chat: photo, then a footer saying whether it counted. */
function SnapCard({ message, pod }: { message: ChatMessage; pod: PodSummary }) {
  const snap = message.snap!
  // How early it landed, from the pod's schedule at the time the server stamped (created_at = taken_at).
  const at = windowState(new Date(message.createdAt), { snapTime: pod.snapTime, windowMinutes: pod.windowMinutes, timeZone: pod.timeZone })
  const detail = snap.onTime ? (at.status === 'open' ? `${at.closesInMin} min before close` : null) : "didn't count for the tree"
  return (
    <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: snap.id } })} scaleTo={0.98} accessibilityLabel="Open snap">
      <View style={{ width: 280, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.raised }}>
        <Image source={{ uri: imageUri(snap.image) }} style={{ width: 280, height: 340 }} contentFit="cover" transition={200} />
        {message.body ? (
          <Text style={{ paddingHorizontal: 16, paddingTop: 10, fontSize: 16, lineHeight: 22 }} numberOfLines={3}>
            {message.body}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
          {snap.onTime ? <Icon name="check" size={18} color={colors.leaf.DEFAULT} /> : <Icon name="clock" size={16} color={colors.flame.deep} />}
          <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 15, color: colors.ink.muted }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: snap.onTime ? colors.leaf.DEFAULT : colors.flame.deep }}>{snap.onTime ? 'On time' : 'Late'}</Text>
            {detail ? ` · ${detail}` : ''}
          </Text>
        </View>
      </View>
    </PressableScale>
  )
}
