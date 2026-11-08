import { colors, radii, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Header, Icon, ListRow, ScreenState, Section, Segmented, Text, TextField, TimeScrubber } from '@/components/ui'
import { FriendButton } from '@/features/friends/FriendButton'
import { useFriendRequests, useFriends, useIncomingRequestCount, useSearchPeople, type FriendRequest } from '@/features/friends/hooks'
import { HabitCarousel } from '@/features/pods/components/HabitCarousel'
import { useCreatePod, useHabits, useJoinPod, type Person } from '@/features/pods/hooks'
import { deviceTimeZone } from '@/lib/format'
import { haptics } from '@/lib/haptics'

const WINDOWS = [15, 20, 30, 45]

type Tab = 'friends' | 'create' | 'join'

/**
 * Connect: friends and pods in one page. Friends (find people, answer requests, your friends) ·
 * Start a pod · Join with code. Home's + opens it on Friends; other entries pass `tab`.
 */
export default function Connect() {
  const params = useLocalSearchParams<{ tab?: string; habit?: string }>()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>(params.tab === 'create' || params.tab === 'join' ? params.tab : 'friends')
  const incoming = useIncomingRequestCount()
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Connect" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.gutter, gap: space.xl, paddingBottom: insets.bottom + space.xxl }}>
        <Segmented
          fill
          value={tab}
          onChange={setTab}
          segments={[
            { key: 'friends', label: incoming ? `Friends · ${incoming}` : 'Friends' },
            { key: 'create', label: 'Start a pod' },
            { key: 'join', label: 'Join a pod' },
          ]}
        />
        {/* Keyed so switching tabs mounts fresh fields (a reused input can keep the code field's letter spacing). */}
        {tab === 'friends' ? <FriendsTab key="friends" /> : tab === 'create' ? <CreateForm key="create" initialHabit={params.habit} /> : <JoinForm key="join" />}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/** Find people by username, answer requests, see what you've sent, and open a chat with a friend. */
function FriendsTab() {
  const [query, setQuery] = useState('')
  const search = useSearchPeople(query)
  const requests = useFriendRequests()
  const friends = useFriends()
  const incoming = requests.data?.filter((r) => r.incoming) ?? []
  const sent = requests.data?.filter((r) => !r.incoming) ?? []
  const searching = query.trim().replace(/^@/, '').length >= 2

  return (
    <View style={{ gap: space.xl }}>
      <Section label="Add a friend">
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search by @username"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search people by username"
        />
        <Text variant="caption">Friends share a habit and a pod: when they accept, they join the pod you pick (or you just become friends if you already share one).</Text>
        {searching ? (
          search.data?.length ? (
            <Card>
              {search.data.map((p, i) => (
                <PersonRow key={p.id} person={p} first={i === 0} trailing={<FriendButton person={p} />} onPress={() => router.push({ pathname: '/user/[id]', params: { id: p.id } })} />
              ))}
            </Card>
          ) : (
            <ScreenState loading={search.isLoading} error={search.error} empty={{ icon: 'people', title: 'No one found', body: 'Check the spelling of their username.' }} />
          )
        ) : null}
      </Section>

      {incoming.length ? (
        <Section label={`Requests · ${incoming.length}`}>
          <Card>
            {incoming.map((r, i) => (
              <RequestRow key={r.id} request={r} first={i === 0} />
            ))}
          </Card>
        </Section>
      ) : null}

      {sent.length ? (
        <Section label="Sent">
          <Card>
            {sent.map((r, i) => (
              <PersonRow key={r.id} person={r.person} first={i === 0} detail={r.pod ? `Invited to ${r.pod.name}` : 'Already podmates'} trailing={<FriendButton person={r.person} />} />
            ))}
          </Card>
        </Section>
      ) : null}

      <Section label="Your friends">
        {friends.data?.length ? (
          <Card>
            {friends.data.map((f, i) => (
              <PersonRow
                key={f.id}
                person={f}
                first={i === 0}
                trailing={<Icon name="comment" size={18} color={colors.ink.muted} />}
                onPress={() => router.push({ pathname: '/dm/[userId]', params: { userId: f.id } })}
                accessibilityLabel={`Message ${f.display_name}`}
              />
            ))}
          </Card>
        ) : (
          <ScreenState loading={friends.isLoading} error={friends.error} empty={{ icon: 'personAdd', title: 'No friends yet', body: 'Search for someone above and add them to one of your pods.' }} />
        )}
      </Section>
    </View>
  )
}

function RequestRow({ request, first }: { request: FriendRequest; first: boolean }) {
  return (
    <View style={{ borderTopWidth: first ? 0 : 0.5, borderTopColor: colors.line, padding: space.md, gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Avatar person={request.person} size={40} />
        <View style={{ flex: 1 }}>
          <Text variant="label" numberOfLines={1}>{request.person.display_name}</Text>
          <Text variant="subhead" numberOfLines={2}>
            {request.pod ? `Wants to be friends in ${request.pod.name}` : `@${request.person.username} · you already share a pod`}
          </Text>
        </View>
      </View>
      <FriendButton person={request.person} />
    </View>
  )
}

function PersonRow({ person, first, detail, trailing, onPress, accessibilityLabel }: { person: Person; first: boolean; detail?: string; trailing?: React.ReactNode; onPress?: () => void; accessibilityLabel?: string }) {
  return (
    <View style={{ borderTopWidth: first ? 0 : 0.5, borderTopColor: colors.line }}>
      <ListRow
        leading={<Avatar person={person} size={40} />}
        title={person.display_name}
        detail={detail ?? `@${person.username}`}
        trailing={trailing}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel ?? person.display_name}
      />
    </View>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ borderRadius: radii.card, backgroundColor: colors.raised, overflow: 'hidden' }}>{children}</View>
}

function CreateForm({ initialHabit }: { initialHabit?: string }) {
  const habits = useHabits()
  const create = useCreatePod()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  // Until one is picked (or passed in), the middle habit of the carousel is chosen.
  const [pickedHabit, setHabitId] = useState<string | undefined>(initialHabit)
  const middle = habits.data?.[Math.floor(habits.data.length / 2)]?.id
  const habitId = pickedHabit ?? middle ?? 'reading'
  const [minutes, setMinutes] = useState(21 * 60)
  const [windowMinutes, setWindowMinutes] = useState(20)

  const snapTime = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

  const submit = () =>
    create.mutate(
      { name: name.trim(), habitId, goal: goal.trim(), snapTime, timeZone: deviceTimeZone(), windowMinutes },
      {
        onSuccess: (id) => {
          haptics.success()
          router.replace({ pathname: '/pod/[id]', params: { id } })
        },
        onError: () => haptics.error(),
      },
    )

  return (
    <View style={{ gap: space.xl }}>
      <TextField label="Pod name" value={name} onChangeText={setName} placeholder="Atomic Habits Club" maxLength={40} />
      <Section label="Habit">
        {/* Full-bleed: the carousel band runs edge to edge of the page. */}
        <View style={{ marginHorizontal: -space.gutter }}>
          <HabitCarousel habits={habits.data ?? []} value={habitId} onChange={setHabitId} />
        </View>
      </Section>
      <TextField label="Daily goal" value={goal} onChangeText={setGoal} placeholder="Example: 20 pages a day" maxLength={120} />
      <Section label="Daily snap time">
        {/* Windows can't cross midnight, so the latest start leaves room for the window. */}
        <TimeScrubber value={minutes} onChange={setMinutes} max={24 * 60 - windowMinutes - 15} step={15} caption={deviceTimeZone()} />
        <Segmented
          fill
          value={String(windowMinutes)}
          onChange={(v) => setWindowMinutes(Number(v))}
          segments={WINDOWS.map((w) => ({ key: String(w), label: `${w} min` }))}
        />
        <Text variant="caption">Everyone gets a reminder at this time and has {windowMinutes} minutes to snap proof.</Text>
      </Section>
      <FormAction error={create.error?.message}>
        <Button label="Plant the seed 🌱" size="lg" disabled={!name.trim()} loading={create.isPending} onPress={submit} />
      </FormAction>
    </View>
  )
}

function JoinForm() {
  const join = useJoinPod()
  const [code, setCode] = useState('')
  const submit = () =>
    join.mutate(code, {
      onSuccess: (id) => {
        haptics.success()
        router.replace({ pathname: '/pod/[id]', params: { id } })
      },
      onError: () => haptics.error(),
    })
  return (
    <View style={{ gap: space.xl }}>
      <TextField
        label="Invite code"
        hint="Demo: try IRONPT as Ben."
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        maxLength={6}
        autoCapitalize="characters"
        placeholder="ABC123"
        style={{ height: 64, textAlign: 'center', fontSize: 30, fontWeight: '600', letterSpacing: 8 }}
      />
      <FormAction error={join.error?.message}>
        <Button label="Join pod" size="lg" disabled={code.length !== 6} loading={join.isPending} onPress={submit} />
      </FormAction>
    </View>
  )
}

/** A form's main button at the end of the content, with its error under it. */
function FormAction({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      {children}
      {error ? (
        <Text variant="caption" center style={{ color: colors.danger.DEFAULT }}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}
