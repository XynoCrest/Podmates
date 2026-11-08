import { colors } from '@podmates/ui-tokens'
import { router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, Segmented, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { PodmateRow } from '@/features/dms/components/PodmateRow'
import { usePodmates, type PodmateThread } from '@/features/dms/hooks'
import { HabitTabs } from '@/features/pods/components/HabitTabs'
import { PodRow } from '@/features/pods/components/PodRow'
import { StoriesRow } from '@/features/pods/components/StoriesRow'
import { WindowBanner } from '@/features/pods/components/WindowBanner'
import { needsSnap, useMyHabits, useMyPods, type PodSummary } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { useStories } from '@/features/snaps/hooks'
import { GroveFigure } from '@/features/tree/GroveFigure'
import { useNow } from '@/lib/useNow'

/** The hero band: a neutral green, with dark ink on it. */
const HERO = { bg: '#46A862', ink: '#0C2414', soft: 'rgba(12, 36, 20, 0.72)' }
const HERO_H = 196
/** How far the sheet rides up over the hero. */
const OVERLAP = 22

/** Home: a green streak hero, then a sheet with habit tabs → podmates' stories → Pods (group chats) or Podmates (one-to-one chats) for that habit, or Unread (every unopened chat, all habits). */
export default function PodsScreen() {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow()
  const profile = useProfile(me)
  const pods = useMyPods()
  const myHabits = useMyHabits()
  const [picked, setHabitId] = useState<string>()
  const [focused, setFocused] = useState(true)
  const [pastHero, setPastHero] = useState(false)
  const [list, setList] = useState<'pods' | 'podmates' | 'unread'>('pods')
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )
  // Until a tab is tapped: the first habit with a window open for me, else the first tab.
  const habitId =
    picked && myHabits.data.some((h) => h.id === picked)
      ? picked
      : (pods.data?.find((p) => needsSnap(p, now))?.habitId ?? myHabits.data[0]?.id)

  const stories = useStories(habitId)
  const due = useMemo(() => new Set(pods.data?.filter((p) => needsSnap(p, now)).map((p) => p.habitId)), [pods.data, now])
  const hasPods = !!pods.data?.length
  const inHabit = pods.data?.filter((p) => p.habitId === habitId) ?? []
  const urgent = inHabit.find((p) => needsSnap(p, now))
  const podmates = usePodmates(useMemo(() => inHabit.map((p) => p.id), [inHabit]))
  // Unread spans every habit: pod chats and one-to-one threads with anything I haven't opened, newest first.
  const everyone = usePodmates(useMemo(() => pods.data?.map((p) => p.id) ?? [], [pods.data]))
  const unread = useMemo<(PodSummary | PodmateThread)[]>(
    () =>
      [...(pods.data?.filter((p) => p.unread > 0) ?? []), ...everyone.data.filter((t) => t.unread > 0)].sort((a, b) => lastAt(b).localeCompare(lastAt(a))),
    [pods.data, everyone.data],
  )
  const rows: (PodSummary | PodmateThread)[] = !hasPods ? [] : list === 'pods' ? inHabit : list === 'podmates' ? podmates.data : unread
  const heroTotal = insets.top + HERO_H

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {focused ? <StatusBar style={pastHero ? 'light' : 'dark'} /> : null}
      <FlatList
        data={rows}
        keyExtractor={(r) => ('person' in r ? `u:${r.person.id}` : r.id)}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.canvas }}>
            {'person' in item ? <PodmateRow thread={item} now={now} /> : <PodRow pod={item} now={now} />}
          </View>
        )}
        onScroll={(e) => setPastHero(e.nativeEvent.contentOffset.y > HERO_H - 8)}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Rides above the hero inside the scroll content, so pulling down reveals more green, not the canvas. */}
            <View style={{ position: 'absolute', top: -2000, left: 0, right: 0, height: 2000 + heroTotal, backgroundColor: HERO.bg }} />
            <StreakHero streak={profile.data?.streak ?? 0} topInset={insets.top} />
            <View style={{ backgroundColor: colors.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -OVERLAP, paddingTop: 10 }}>
              {hasPods ? (
                <>
                  <HabitTabs habits={myHabits.data} selected={habitId} onSelect={setHabitId} due={due} onAdd={() => router.push('/pod/new')} />
                  {urgent ? <WindowBanner pod={urgent} now={now} /> : null}
                  {habitId ? <StoriesRow me={profile.data} groups={stories.groups} habitId={habitId} /> : null}
                  <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
                    <Segmented
                      value={list}
                      onChange={setList}
                      segments={[
                        { key: 'pods', label: 'Pods', badge: inHabit.filter((p) => needsSnap(p, now)).length },
                        { key: 'podmates', label: 'Podmates', badge: podmates.data.filter((t) => t.unread > 0).length },
                        { key: 'unread', label: 'Unread', badge: unread.length },
                      ]}
                    />
                  </View>
                </>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          pods.isLoading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
          ) : !hasPods ? (
            <EmptyState
              icon="tree"
              title="No pods yet"
              body="A pod is a few friends tracking one habit together. Snap daily, grow a tree."
              action={<Button label="Start or join a pod" icon="plus" onPress={() => router.push('/pod/new')} />}
            />
          ) : list === 'unread' && !everyone.isLoading ? (
            <Text variant="subhead" center style={{ padding: 32 }}>
              {"You're all caught up"}
            </Text>
          ) : list === 'podmates' && !podmates.isLoading ? (
            <Text variant="subhead" center style={{ padding: 32 }}>
              No podmates in this habit yet. Invite friends to your pod.
            </Text>
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            tintColor={HERO.ink}
            refreshing={pods.isRefetching}
            onRefresh={() => {
              void pods.refetch()
              void stories.refetch()
              void profile.refetch()
              void podmates.refetch()
              void everyone.refetch()
            }}
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}

const lastAt = (r: PodSummary | PodmateThread) => ('person' in r ? (r.last?.createdAt ?? '') : r.lastActivityAt)

/** The streak, said big: a dark lead-in, the count in white, and a quiet line of encouragement. */
function StreakHero({ streak, topInset }: { streak: number; topInset: number }) {
  const [lead, count, sub] =
    streak === 0
      ? ['Start your', 'first streak!', 'Snap today and show up for a healthier, happier you.']
      : ["You're on a", `${streak}-day streak!`, "You're showing up for a healthier, happier you."]
  return (
    <View style={{ height: topInset + HERO_H, paddingTop: topInset + 16, paddingLeft: 20, paddingBottom: OVERLAP + 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 196, gap: 8 }} accessible accessibilityLabel={`${lead} ${count} ${sub}`}>
        <View>
          <Text style={{ fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, color: HERO.ink }}>{lead}</Text>
          <Text style={{ fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, color: '#FFFFFF' }} numeric adjustsFontSizeToFit numberOfLines={1}>
            {count}
          </Text>
        </View>
        <Text style={{ fontSize: 14, lineHeight: 19, color: HERO.soft }} numberOfLines={3}>{sub}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 64 }}>
        <GroveFigure height={HERO_H - OVERLAP - 50} ground={HERO.bg} ink={HERO.ink} />
      </View>
    </View>
  )
}
