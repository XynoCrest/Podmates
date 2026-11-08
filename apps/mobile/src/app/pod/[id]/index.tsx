import { formatSnapTime } from '@podmates/shared'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native'
import { Header, PressableScale, StatusPill, Text, type StatusTone } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { Composer } from '@/features/pods/components/Composer'
import { MessageBubble } from '@/features/pods/components/MessageBubble'
import { podWindow, useMessages, usePod, usePodMembers, useSendMessage, windowCloseLabel, type ChatMessage, type Member, type PodSummary } from '@/features/pods/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { firstName } from '@/lib/format'
import { useNow } from '@/lib/useNow'

export default function PodChat() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useMe()
  const pod = usePod(id)
  const members = usePodMembers(pod.data)
  const messages = useMessages(id)
  const send = useSendMessage(id)

  const openTree = () => router.push({ pathname: '/pod/[id]/tree', params: { id } })
  const p = pod.data
  const snapped = new Set(members.data?.filter((m) => m.contributedToday).map((m) => m.id))
  const list = messages.data ?? []

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={
          <PressableScale onPress={openTree} scaleTo={0.98} accessibilityLabel="Open pod tree">
            <Text numberOfLines={1} style={{ fontSize: 21, fontWeight: '700', letterSpacing: -0.3 }}>
              {p?.name ?? ' '}
            </Text>
          </PressableScale>
        }
        subtitle={p ? `Snap by ${windowCloseLabel(p)} · ${p.windowMinutes} min window` : undefined}
        subtitleColor={colors.leaf.DEFAULT}
        right={
          p ? (
            <PressableScale onPress={openTree} accessibilityLabel={`Tree: ${p.treeStatus === 'dead' ? 'dead' : `${p.hp} of ${p.maxHp} HP`}`} scaleTo={0.92} hitSlop={6}>
              <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <TreeArt growth={p.growth} dead={p.treeStatus === 'dead'} size={48} still />
              </View>
            </PressableScale>
          ) : null
        }
      />
      {messages.isLoading || !p ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.ink.muted} />
      ) : (
        <FlatList
          inverted
          data={list}
          keyExtractor={(m) => m.id}
          // Inverted: the header renders at the bottom, under the newest message.
          ListHeaderComponent={<TodayStatus pod={p} members={members.data} me={me} />}
          renderItem={({ item, index }) => {
            // Inverted: the message visually above is the next one in the array, the one below the previous.
            const above = list[index + 1]
            const below = list[index - 1]
            const newDay = !above || dayKey(above) !== dayKey(item)
            const sameRun = (a: ChatMessage | undefined) => !!a && a.kind !== 'system' && item.kind !== 'system' && a.author?.id === item.author?.id
            const lastOfRun = !sameRun(below) || dayKey(below!) !== dayKey(item)
            return (
              <View>
                {newDay ? <DayLabel iso={item.createdAt} /> : null}
                <MessageBubble message={item} mine={item.author?.id === me} grouped={!newDay && sameRun(above)} lastOfRun={lastOfRun} snappedToday={!!item.author && snapped.has(item.author.id)} pod={p} />
              </View>
            )
          }}
          contentContainerStyle={{ paddingVertical: 12 }}
          keyboardDismissMode="interactive"
        />
      )}
      <Composer onSend={(t) => send.mutate(t)} sending={send.isPending} onCamera={() => router.navigate({ pathname: '/camera', params: { podId: id } })} />
    </KeyboardAvoidingView>
  )
}

const dayKey = (m: ChatMessage) => new Date(m.createdAt).toDateString()

function DayLabel({ iso }: { iso: string }) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86_400_000)
  const label =
    d.toDateString() === today.toDateString()
      ? 'Today'
      : d.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
  return <Text style={{ textAlign: 'center', paddingTop: 20, paddingBottom: 4, fontSize: 15, fontWeight: '600', color: colors.ink.muted }}>{label}</Text>
}

/** Where today stands, under the newest message: who still has to snap, or that everyone did. */
function TodayStatus({ pod, members, me }: { pod: PodSummary; members: Member[] | undefined; me: string }) {
  const now = useNow()
  const w = podWindow(pod, now)
  const missing = (members ?? []).filter((m) => !m.contributedToday)
  const names = missing.map((m) => (m.id === me ? 'you' : firstName(m.display_name).toLowerCase())).sort((a, b) => Number(b === 'you') - Number(a === 'you'))
  const who = names.length <= 3 ? joinNames(names) : `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`
  const plural = names.length > 1 || names[0] === 'you'

  let tone: StatusTone
  let label: string
  if (pod.treeStatus === 'dead') [tone, label] = ['bad', 'Your tree died. Open it to replant.']
  else if (!members) return null
  else if (!missing.length) [tone, label] = ['good', 'Everyone snapped today']
  else if (w.status === 'upcoming') [tone, label] = ['neutral', `Window opens at ${formatSnapTime(pod.snapTime)}`]
  else if (w.status === 'open') [tone, label] = ['warn', `${capitalize(who)} ${plural ? 'have' : 'has'} not snapped yet`]
  else [tone, label] = ['warn', `${capitalize(who)} did not snap today`]

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
      <StatusPill tone={tone} label={label} />
    </View>
  )
}

const joinNames = (n: string[]) => (n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`)
const capitalize = (s: string) => (s.startsWith('you') ? `Y${s.slice(1)}` : s)
