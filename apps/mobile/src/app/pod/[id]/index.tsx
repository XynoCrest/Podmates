import { formatSnapTime } from '@podmates/shared'
import { healthRatio } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native'
import { Header, Icon, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { Composer } from '@/features/pods/components/Composer'
import { MessageBubble } from '@/features/pods/components/MessageBubble'
import { podWindow, useMessages, usePod, useSendMessage, type PodSummary } from '@/features/pods/hooks'
import { useNow } from '@/lib/useNow'

export default function PodChat() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useMe()
  const pod = usePod(id)
  const messages = useMessages(id)
  const send = useSendMessage(id)

  const openTree = () => router.push({ pathname: '/pod/[id]/tree', params: { id } })
  const p = pod.data

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={
          <PressableScale onPress={openTree} scaleTo={0.98} accessibilityLabel="Open pod tree">
            <Text variant="headline" numberOfLines={1}>
              {p?.name ?? ' '}
            </Text>
          </PressableScale>
        }
        subtitle={p ? `${p.memberCount} members · snaps at ${formatSnapTime(p.snapTime)}` : undefined}
        right={p ? <TreeButton pod={p} onPress={openTree} /> : null}
      />
      {p ? <WindowStrip pod={p} /> : null}
      {messages.isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.ink.muted} />
      ) : (
        <FlatList
          inverted
          data={messages.data}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            // Inverted: the message visually above is the next one in the array.
            const above = messages.data?.[index + 1]
            const grouped = !!above && above.kind !== 'system' && item.kind !== 'system' && above.author?.id === item.author?.id
            return <MessageBubble message={item} mine={item.author?.id === me} grouped={grouped} />
          }}
          contentContainerStyle={{ paddingVertical: 12 }}
          keyboardDismissMode="interactive"
        />
      )}
      <Composer onSend={(t) => send.mutate(t)} sending={send.isPending} onCamera={() => router.navigate({ pathname: '/camera', params: { podId: id } })} />
    </KeyboardAvoidingView>
  )
}

/** Header tree chip: the tree's health at a glance, tap for the full tree screen. */
function TreeButton({ pod, onPress }: { pod: PodSummary; onPress: () => void }) {
  const ratio = healthRatio(pod)
  const color = pod.treeStatus === 'dead' ? colors.danger.DEFAULT : ratio > 0.5 ? colors.leaf.DEFAULT : ratio > 0.25 ? colors.energy.DEFAULT : colors.danger.DEFAULT
  return (
    <PressableScale onPress={onPress} accessibilityLabel="Tree" scaleTo={0.92}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginRight: 6 }}>
        <Icon name="tree" size={16} color={color} />
        <Text numeric style={{ color, fontWeight: '700', fontSize: 14 }}>
          {pod.treeStatus === 'dead' ? '0' : pod.hp}
        </Text>
      </View>
    </PressableScale>
  )
}

function WindowStrip({ pod }: { pod: PodSummary }) {
  const now = useNow()
  const w = podWindow(pod, now)
  const [bg, fg, text] = pod.treeStatus === 'dead'
    ? [colors.danger.soft, colors.danger.DEFAULT, 'Your tree died. Open it to replant.']
    : pod.meContributedToday
      ? [colors.leaf.soft, colors.leaf.DEFAULT, `You snapped today · ${pod.contributedToday}/${pod.memberCount} done`]
      : w.status === 'open'
        ? [colors.flame.soft, colors.flame.DEFAULT, `Window open · ${w.closesInMin} min left to snap`]
        : w.status === 'upcoming'
          ? [colors.surface, colors.ink.muted, `Window opens at ${formatSnapTime(pod.snapTime)} · ${pod.contributedToday}/${pod.memberCount} done`]
          : [colors.surface, colors.ink.muted, `Today's window has closed · ${pod.contributedToday}/${pod.memberCount} snapped`]
  return (
    <View style={{ backgroundColor: bg, paddingVertical: 8, paddingHorizontal: 16 }}>
      <Text style={{ color: fg, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{text}</Text>
    </View>
  )
}
