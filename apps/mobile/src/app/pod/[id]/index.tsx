import { formatSnapTime } from '@podmates/shared'
import { healthRatio } from '@podmates/tree-engine'
import { colors, radii, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, FlatList, Share, View } from 'react-native'
import { Button, ChatScreen, Chip, Header, IconButton, PressableScale, ScreenState, Text } from '@/components/ui'
import { REST_DAYS_PER_WEEK, useCancelRest, useLeavePod, useRemoveMember, useRestToday } from '@/features/safety/hooks'
import { showActionSheet } from '@/lib/actionSheet'
import { haptics } from '@/lib/haptics'
import { goBack } from '@/lib/nav'
import { useMe } from '@/ctx/session'
import { Composer } from '@/features/pods/components/Composer'
import { MessageBubble } from '@/features/pods/components/MessageBubble'
import { podWindow, useMarkPodRead, useMessages, usePod, usePodMembers, useSendMessage, type PodSummary } from '@/features/pods/hooks'
import { useNow } from '@/lib/useNow'

export default function PodChat() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const me = useMe()
  const pod = usePod(id)
  const messages = useMessages(id)
  const send = useSendMessage(id)
  useMarkPodRead(id, pod.data?.unread)

  const openTree = () => router.push({ pathname: '/pod/[id]/tree', params: { id } })
  const p = pod.data
  const members = usePodMembers(p)
  const rest = useRestToday(id)
  const cancelRest = useCancelRest(id)
  const leave = useLeavePod(id)
  const remove = useRemoveMember(id)
  const now = useNow()
  const iOwn = members.data?.some((m) => m.id === me && m.role === 'owner') ?? false

  const fail = (e: Error) => {
    haptics.error()
    Alert.alert('Couldn’t do that', e.message)
  }
  const restToday = () => rest.mutate(undefined, { onSuccess: () => haptics.success(), onError: fail })
  const undoRest = () => cancelRest.mutate(undefined, { onError: fail })

  const confirmLeave = () =>
    Alert.alert(`Leave ${p?.name ?? 'this pod'}?`, 'You’ll stop counting towards its tree and won’t see its chat. You can rejoin with the invite code.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => leave.mutate(undefined, { onSuccess: () => { haptics.success(); goBack() }, onError: fail }) },
    ])

  const pickMemberToRemove = () =>
    showActionSheet({
      title: 'Remove someone from the pod',
      options: (members.data ?? [])
        .filter((m) => m.id !== me)
        .map((m) => ({
          label: m.display_name,
          destructive: true,
          onPress: () =>
            Alert.alert(`Remove ${m.display_name}?`, 'They’ll leave the pod and stop counting towards its tree. They can rejoin only with the invite code.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(m.id, { onSuccess: () => haptics.success(), onError: fail }) },
            ]),
        })),
    })

  const openMenu = () => {
    if (!p) return
    const left = REST_DAYS_PER_WEEK - p.myRestsThisWeek
    const closed = podWindow(p, now).status === 'closed'
    showActionSheet({
      options: [
        ...(p.meRestingToday
          ? [{ label: 'Cancel today’s rest day', onPress: undoRest }]
          : !p.meContributedToday && !closed && left > 0 && p.treeStatus === 'alive'
            ? [{ label: `Take a rest day (${left} left this week)`, onPress: restToday }]
            : []),
        { label: 'Invite friends', onPress: () => shareInvite(p) },
        ...(iOwn && (members.data?.length ?? 0) > 1 ? [{ label: 'Remove a member', onPress: pickMemberToRemove }] : []),
        { label: 'Leave pod', destructive: true, onPress: confirmLeave },
      ],
    })
  }

  return (
    <ChatScreen
      strip={
        p ? (
          <>
            <WindowStrip pod={p} onRest={restToday} onUndoRest={undoRest} />
            {p.memberCount < INVITE_UNTIL ? <InviteCard pod={p} /> : null}
          </>
        ) : null
      }
      composer={<Composer onSend={(t) => send.mutateAsync(t)} sending={send.isPending} onCamera={() => router.navigate({ pathname: '/camera', params: { podId: id } })} />}
      header={
      <Header
        title={
          <PressableScale onPress={openTree} scaleTo={0.98} accessibilityLabel="Open pod tree">
            <Text variant="headline" numberOfLines={1}>
              {p?.name ?? ' '}
            </Text>
          </PressableScale>
        }
        subtitle={p ? `${p.memberCount} members · ${formatSnapTime(p.snapTime)}` : undefined}
        right={
          p ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginRight: space.sm }}>
              <IconButton icon="personAdd" label={`Invite friends, code ${p.inviteCode}`} onPress={() => shareInvite(p)} />
              <TreeButton pod={p} onPress={openTree} />
              <IconButton icon="more" label="Pod options" onPress={openMenu} />
            </View>
          ) : null
        }
      />
      }
    >
      {messages.isLoading || messages.error ? (
        <ScreenState fill loading={messages.isLoading} error={messages.error} onRetry={() => void messages.refetch()} />
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
          contentContainerStyle={{ paddingVertical: space.md }}
          keyboardDismissMode="interactive"
        />
      )}
    </ChatScreen>
  )
}

/** Pods are meant for 3 to 5 people: the big code card stays until there are three of you. */
const INVITE_UNTIL = 3

/** Opens the system share sheet with the pod's invite code (it also offers Copy). The wording works for
    a friend who is new (onboarding's last step) and for one already in a pod (+ on Home): both say "Join with code". */
const shareInvite = (pod: PodSummary) =>
  void Share.share({ message: `Join my pod "${pod.name}" on Podmates: tap "Join with code" and enter ${pod.inviteCode}.` })

/** Until the pod has three members: the invite code, big, with a share button. */
function InviteCard({ pod }: { pod: PodSummary }) {
  return (
    <View style={{ margin: space.md, marginBottom: 0, padding: space.lg, borderRadius: radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption">{pod.memberCount < 2 ? 'Invite friends with this code' : 'Invite one more to make it a pod'}</Text>
        <Text variant="title" numeric selectable style={{ letterSpacing: 4 }} accessibilityLabel={`Invite code ${pod.inviteCode.split('').join(' ')}`}>
          {pod.inviteCode}
        </Text>
      </View>
      <Button label="Share" icon="share" size="sm" onPress={() => shareInvite(pod)} />
    </View>
  )
}

/** Header tree chip: the tree's health at a glance, tap for the full tree screen. */
function TreeButton({ pod, onPress }: { pod: PodSummary; onPress: () => void }) {
  const ratio = healthRatio(pod)
  const color = pod.treeStatus === 'dead' ? colors.danger.DEFAULT : ratio > 0.5 ? colors.leaf.DEFAULT : ratio > 0.25 ? colors.energy.DEFAULT : colors.danger.DEFAULT
  return (
    <Chip size="md" icon="tree" label={pod.treeStatus === 'dead' ? '0' : String(pod.hp)} color={color} bg={colors.raised} onPress={onPress} accessibilityLabel="Open pod tree" />
  )
}

/** Today at a glance, with the rest-day action when it applies (2 a week, before the window closes). */
function WindowStrip({ pod, onRest, onUndoRest }: { pod: PodSummary; onRest: () => void; onUndoRest: () => void }) {
  const now = useNow()
  const w = podWindow(pod, now)
  const counted = pod.memberCount - pod.restingToday
  const canRest = !pod.meContributedToday && !pod.meRestingToday && w.status !== 'closed' && pod.myRestsThisWeek < REST_DAYS_PER_WEEK && pod.treeStatus === 'alive'
  const [bg, fg, text] = pod.treeStatus === 'dead'
    ? [colors.danger.soft, colors.danger.DEFAULT, 'Your tree died. Open it to replant.']
    : pod.meContributedToday
      ? [colors.leaf.soft, colors.leaf.DEFAULT, `You snapped today · ${pod.contributedToday}/${counted} done`]
      : pod.meRestingToday
        ? [colors.sky.soft, colors.sky.DEFAULT, 'Resting today · your streak is safe']
        : w.status === 'open'
          ? [colors.flame.soft, colors.flame.DEFAULT, `Window open · ${w.closesInMin} min left to snap`]
          : w.status === 'upcoming'
            ? [colors.surface, colors.ink.muted, `Window opens at ${formatSnapTime(pod.snapTime)} · ${pod.contributedToday}/${counted} done`]
            : [colors.surface, colors.ink.muted, `Today's window has closed · ${pod.contributedToday}/${counted} snapped`]
  const action = pod.meRestingToday && !pod.meContributedToday ? { label: 'Undo', onPress: onUndoRest } : canRest ? { label: 'Rest today', onPress: onRest } : null
  return (
    <View style={{ backgroundColor: bg, paddingVertical: space.sm, paddingHorizontal: space.gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm }}>
      <Text variant="subhead" center style={{ color: fg, fontWeight: '600', flexShrink: 1 }}>{text}</Text>
      {action ? <Chip icon="moon" label={action.label} color={fg} bg={colors.raised} onPress={action.onPress} accessibilityLabel={action.label === 'Undo' ? 'Cancel today’s rest day' : 'Take a rest day: your streak holds and the tree won’t count you today'} /> : null}
    </View>
  )
}
