import { stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { Redirect, router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, PressableScale, Segmented, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { PodmateRow } from '@/features/dms/components/PodmateRow'
import { usePodmates, type PodmateThread } from '@/features/dms/hooks'
import { HabitTabs } from '@/features/pods/components/HabitTabs'
import { PodRow } from '@/features/pods/components/PodRow'
import { StoriesRow } from '@/features/pods/components/StoriesRow'
import { useDeclareRest, useMyHabits, type MyHabit } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { useStories } from '@/features/snaps/hooks'
import { TreeArt } from '@/features/tree/TreeArt'
import { haptics } from '@/lib/haptics'
import { useNow } from '@/lib/useNow'

/** The hero band: a neutral green, with dark ink on it. */
const HERO = { bg: '#46A862', ink: '#0C2414', soft: 'rgba(12, 36, 20, 0.72)' }
const HERO_H = 196
/** How far the sheet rides up over the hero. */
const OVERLAP = 22

/**
 * Home: a green hero with my streak for the selected habit and the healthiest tree among my pods,
 * then a sheet: habit tabs → today's card (snap or rest) → stories from people I follow →
 * the habit's pod, or Podmates (one-to-one chats with mutual follows).
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow()
  const profile = useProfile(me)
  const myHabits = useMyHabits()
  const [picked, setHabitId] = useState<string>()
  const [focused, setFocused] = useState(true)
  const [pastHero, setPastHero] = useState(false)
  const [list, setList] = useState<'today' | 'podmates'>('today')
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )

  const habits = myHabits.data
  // Until a tab is tapped: the first habit not done yet today, else the first one.
  const current = habits.find((h) => h.habit.id === picked) ?? habits.find((h) => !h.today) ?? habits[0]
  const healthiest = useMemo(() => [...habits].sort((a, b) => b.pod.tree.health - a.pod.tree.health || b.pod.tree.totalSnaps - a.pod.tree.totalSnaps)[0], [habits])
  const due = useMemo(() => new Set(habits.filter((h) => !h.today).map((h) => h.habit.id)), [habits])
  const stories = useStories(current?.habit.id)
  const podmates = usePodmates()
  const rows: PodmateThread[] = list === 'podmates' ? podmates.data : []
  const heroTotal = insets.top + HERO_H

  // First run (or every habit removed): pick habits before anything else.
  if (!myHabits.isLoading && !habits.length) return <Redirect href="/onboarding" />

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {focused ? <StatusBar style={pastHero ? 'light' : 'dark'} /> : null}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.person.id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.canvas }}>
            <PodmateRow thread={item} now={now} />
          </View>
        )}
        onScroll={(e) => setPastHero(e.nativeEvent.contentOffset.y > HERO_H - 8)}
        scrollEventThrottle={32}
        ListHeaderComponent={
          <View>
            {/* Rides above the hero inside the scroll content, so pulling down reveals more green, not the canvas. */}
            <View style={{ position: 'absolute', top: -2000, left: 0, right: 0, height: 2000 + heroTotal, backgroundColor: HERO.bg }} />
            <StreakHero current={current} healthiest={healthiest} topInset={insets.top} />
            <View style={{ backgroundColor: colors.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -OVERLAP, paddingTop: 10 }}>
              {current ? (
                <>
                  <HabitTabs habits={habits.map((h) => h.habit)} selected={current.habit.id} onSelect={setHabitId} due={due} onAdd={() => router.push('/pod/new')} />
                  <StoriesRow me={profile.data} groups={stories.groups} habitId={current.habit.id} />
                  <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
                    <Segmented
                      value={list}
                      onChange={setList}
                      segments={[
                        { key: 'today', label: 'Today', badge: current.today ? 0 : 1 },
                        { key: 'podmates', label: 'Podmates', badge: podmates.data.filter((t) => t.unread > 0).length },
                      ]}
                    />
                  </View>
                  {list === 'today' ? <TodayCard habit={current} /> : null}
                </>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          myHabits.isLoading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
          ) : !current ? (
            <EmptyState
              icon="tree"
              title="Pick your first habit"
              body="Each habit has a pod of people building it too. Snap once a day to keep your streak and grow the pod's tree."
              action={<Button label="Add a habit" icon="plus" onPress={() => router.push('/pod/new')} />}
            />
          ) : list === 'podmates' && !podmates.isLoading ? (
            <Text variant="subhead" center style={{ padding: 32 }}>
              No one to message yet. Follow people in your pods; when they follow you back, you can chat here.
            </Text>
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            tintColor={HERO.ink}
            refreshing={myHabits.isRefetching}
            onRefresh={() => {
              void myHabits.refetch()
              void stories.refetch()
              void podmates.refetch()
            }}
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}

/** Today for the selected habit: done, resting, or the two ways to keep the streak (snap or rest). */
function TodayCard({ habit }: { habit: MyHabit }) {
  const rest = useDeclareRest()
  const status =
    habit.today === 'snapped'
      ? { text: 'Snapped today. Your streak is safe.', color: colors.leaf.DEFAULT }
      : habit.today === 'rest'
        ? { text: 'Resting today. Your streak is held.', color: colors.sky.DEFAULT }
        : { text: habit.streak > 0 ? `Snap today to make it ${habit.streak + 1} days.` : 'Snap today to start a streak.', color: colors.ink.DEFAULT }

  const confirmRest = () =>
    Alert.alert(
      'Rest today?',
      `Your ${habit.habit.name} streak holds without a snap. ${habit.restDaysLeft} of 2 rest days left this week.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rest today',
          onPress: () =>
            rest.mutate(habit.pod.id, {
              onSuccess: () => haptics.success(),
              onError: (e) => {
                haptics.error()
                Alert.alert("Couldn't rest today", e.message)
              },
            }),
        },
      ],
    )

  return (
    <View style={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}>
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text variant="headline">{habit.habit.name}</Text>
          <Text variant="caption">Best {habit.best} days</Text>
        </View>
        <Text style={{ fontSize: 15, color: status.color }}>{status.text}</Text>
        {!habit.today ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button label="Snap now" icon="camera" onPress={() => router.navigate({ pathname: '/camera', params: { podId: habit.pod.id } })} />
            </View>
            <Button
              label={habit.restDaysLeft ? `Rest (${habit.restDaysLeft} left)` : 'No rest left'}
              variant="secondary"
              disabled={!habit.restDaysLeft}
              loading={rest.isPending}
              onPress={confirmRest}
            />
          </View>
        ) : null}
      </View>
      <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
        <PodRow pod={habit.pod} symbol={habit.habit.sf_symbol} />
      </View>
    </View>
  )
}

/** The selected habit's streak, said big, and the healthiest of my pods' trees (tap for its tree). */
function StreakHero({ current, healthiest, topInset }: { current: MyHabit | undefined; healthiest: MyHabit | undefined; topInset: number }) {
  const streak = current?.streak ?? 0
  const name = current?.habit.name.toLowerCase() ?? ''
  const [lead, count, sub] = !current
    ? ['Start your', 'first streak!', 'Pick a habit and show up for a healthier, happier you.']
    : streak === 0
      ? ['Start your', `${name} streak!`, 'Snap today, or take a rest day when you need one.']
      : ["You're on a", `${streak}-day streak!`, `You're showing up for ${name}, and for a healthier, happier you.`]
  return (
    <View style={{ height: topInset + HERO_H, paddingTop: topInset + 16, paddingLeft: 20, paddingBottom: OVERLAP + 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 196, gap: 8 }} accessible accessibilityLabel={`${lead} ${count} ${sub}`}>
        <View>
          <Text style={{ fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, color: HERO.ink }}>{lead}</Text>
          <Text style={{ fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, color: '#FFFFFF' }} numeric adjustsFontSizeToFit numberOfLines={1}>
            {count}
          </Text>
        </View>
        <Text style={{ fontSize: 14, lineHeight: 19, color: HERO.soft }} numberOfLines={3}>
          {sub}
        </Text>
      </View>
      {healthiest ? (
        <PressableScale
          onPress={() => router.push({ pathname: '/pod/[id]/tree', params: { id: healthiest.pod.id } })}
          accessibilityLabel={`Healthiest tree: ${healthiest.pod.name} pod, ${Math.round(healthiest.pod.tree.health * 100)} percent healthy`}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 16 }}
        >
          <TreeArt totalSnaps={healthiest.pod.tree.totalSnaps} health={healthiest.pod.tree.health} size={HERO_H - OVERLAP - 52} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: HERO.ink }} numberOfLines={1}>
            {healthiest.pod.name} · {stageFor(healthiest.pod.tree.totalSnaps).name} · {Math.round(healthiest.pod.tree.health * 100)}%
          </Text>
        </PressableScale>
      ) : null}
    </View>
  )
}
