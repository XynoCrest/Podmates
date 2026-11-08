import { formatSnapTime } from '@podmates/shared'
import { healthRatio } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native'
import { Header, healthColor, Icon, PlantLabel, PressableScale, Text, Tile } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { Composer } from '@/features/pods/components/Composer'
import { MessageBubble } from '@/features/pods/components/MessageBubble'
import { podStatus } from '@/features/pods/components/PodRow'
import { useMessages, usePod, useSendMessage, type PodSummary } from '@/features/pods/hooks'
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
  const ratio = pod.treeStatus === 'dead' ? 0 : healthRatio(pod)
  const color = healthColor(ratio)
  return (
    <Tile onPress={onPress} accessibilityLabel="Tree" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 12, marginRight: 8 }}>
      <Icon name="tree" size={16} color={color} />
      <Text numeric style={{ color, fontWeight: '600', fontSize: 15 }}>
        {pod.treeStatus === 'dead' ? '0' : pod.hp}
      </Text>
    </Tile>
  )
}

/** Today's status for this pod, as a plant label with one line of context. */
function WindowStrip({ pod }: { pod: PodSummary }) {
  const now = useNow()
  const status = podStatus(pod, now)
  const context =
    pod.treeStatus === 'dead'
      ? 'Open the tree to replant'
      : `${pod.contributedToday} of ${pod.memberCount} snapped today`
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <PlantLabel tone={status.tone} label={status.label} />
      <Text variant="subhead">{context}</Text>
    </View>
  )
}
