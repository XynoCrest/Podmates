import { colors, hero, space } from '@podmates/ui-tokens'
import { Redirect, router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, HeroHeading, HeroSheet, HERO_OVERLAP, ScreenState, Segmented, TabHero } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { PodmateRow } from '@/features/dms/components/PodmateRow'
import { usePodmates, type PodmateThread } from '@/features/dms/hooks'
import { HabitTabs } from '@/features/pods/components/HabitTabs'
import { PodRow } from '@/features/pods/components/PodRow'
import { StoriesRow } from '@/features/pods/components/StoriesRow'
import { TodayCard } from '@/features/pods/components/TodayCard'
import { needsSnap, useMyHabits, useMyPods, type PodSummary } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { useStories } from '@/features/snaps/hooks'
import { LeafTree } from '@/features/tree/LeafTree'
import { useNow } from '@/lib/useNow'

const HERO_H = 196

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
  const habitName = myHabits.data.find((h) => h.id === habitId)?.name
  const podmates = usePodmates(useMemo(() => inHabit.map((p) => p.id), [inHabit]))
  // Unread spans every habit: pod chats and one-to-one threads with anything I haven't opened, newest first.
  const everyone = usePodmates(useMemo(() => pods.data?.map((p) => p.id) ?? [], [pods.data]))
  const unread = useMemo<(PodSummary | PodmateThread)[]>(
    () =>
      [...(pods.data?.filter((p) => p.unread > 0) ?? []), ...everyone.data.filter((t) => t.unread > 0)].sort((a, b) => lastAt(b).localeCompare(lastAt(a))),
    [pods.data, everyone.data],
  )
  // First sign-in: onboarding once (profiles.onboarded_at).
  if (profile.data && !profile.data.onboarded_at) return <Redirect href="/onboarding" />

  const rows: (PodSummary | PodmateThread)[] = !hasPods ? [] : list === 'pods' ? inHabit : list === 'podmates' ? podmates.data : unread

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
            <StreakHero streak={profile.data?.streak ?? 0} topInset={insets.top} />
            {/* Clips its children to the rounded corners: the habit tabs' edge fades would otherwise square them off. */}
            <HeroSheet clip>
              {hasPods ? (
                <>
                  <HabitTabs habits={myHabits.data} selected={habitId} onSelect={setHabitId} due={due} onAdd={() => router.push('/pod/new')} />
                  {habitId ? <StoriesRow me={profile.data} groups={stories.groups} habitId={habitId} /> : null}
                  <View style={{ paddingHorizontal: space.gutter, paddingVertical: space.sm }}>
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
                  {habitName ? <TodayCard habitName={habitName} pods={inHabit} now={now} /> : null}
                </>
              ) : null}
            </HeroSheet>
          </View>
        }
        ListEmptyComponent={
          pods.isLoading || pods.error ? (
            <ScreenState loading={pods.isLoading} error={pods.error} onRetry={() => void pods.refetch()} />
          ) : !hasPods ? (
            <ScreenState
              empty={{
                icon: 'tree',
                title: 'No pods yet',
                body: 'A pod is a few friends tracking one habit together. Snap daily, grow a tree.',
                action: <Button label="Start or join a pod" icon="plus" onPress={() => router.push('/pod/new')} />,
              }}
            />
          ) : list === 'unread' && !everyone.isLoading ? (
            <ScreenState empty={{ icon: 'checkCircle', title: 'You’re all caught up', body: 'No unread chats in any habit.' }} />
          ) : list === 'podmates' && !podmates.isLoading ? (
            <ScreenState empty={{ icon: 'people', title: 'No podmates yet', body: 'Invite friends to your pod to chat one-to-one.' }} />
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            tintColor={hero.ink}
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

/** The streak, said big: the shared hero heading, with the pod tree on the right. */
function StreakHero({ streak, topInset }: { streak: number; topInset: number }) {
  const [lead, count, sub] =
    streak === 0
      ? ['Start your', 'first streak!', 'Snap today and show up for a healthier, happier you.']
      : // profiles.streak is the longest current streak across your pods, so say "top" (each pod's own is on its card).
        ['Your top streak is', `${streak} ${streak === 1 ? 'day' : 'days'}!`, "You're showing up for a healthier, happier you."]
  return (
    <TabHero
      topInset={topInset}
      minHeight={topInset + HERO_H}
      heading={<View style={{ maxWidth: 196 }}><HeroHeading lead={lead} bright={count} sub={sub} fit /></View>}
      backdrop={
        // The tree grows in from the screen's right edge, just above where the sheet overlaps the band.
        // Drawn first, so leaves reaching left sit behind the text.
        <View pointerEvents="none" style={{ position: 'absolute', right: 0, bottom: HERO_OVERLAP - 4 }}>
          <LeafTree height={HERO_H - HERO_OVERLAP - 8} />
        </View>
      }
    />
  )
}
