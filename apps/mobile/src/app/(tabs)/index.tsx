import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, EmptyState, IconButton, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { HabitTabs } from '@/features/pods/components/HabitTabs'
import { PodRow } from '@/features/pods/components/PodRow'
import { StoriesRow } from '@/features/pods/components/StoriesRow'
import { WindowBanner } from '@/features/pods/components/WindowBanner'
import { needsSnap, useHabits, useMyHabits, useMyPods } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { useStories } from '@/features/snaps/hooks'
import { useNow } from '@/lib/useNow'

/** Home: habit tabs → podmates' stories → the pod chats for that habit. */
export default function PodsScreen() {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow()
  const profile = useProfile(me)
  const pods = useMyPods()
  const habits = useHabits()
  const myHabits = useMyHabits()
  const [picked, setHabitId] = useState<string>()
  // Until a tab is tapped: the first habit with a window open for me, else the first tab.
  const habitId =
    picked && myHabits.data.some((h) => h.id === picked)
      ? picked
      : (pods.data?.find((p) => needsSnap(p, now))?.habitId ?? myHabits.data[0]?.id)

  const stories = useStories(habitId)
  const due = useMemo(() => new Set(pods.data?.filter((p) => needsSnap(p, now)).map((p) => p.habitId)), [pods.data, now])
  const inHabit = pods.data?.filter((p) => p.habitId === habitId) ?? []
  const urgent = inHabit.find((p) => needsSnap(p, now))
  const emoji = (id: string) => habits.data?.find((h) => h.id === id)?.emoji ?? '🌱'

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 12 }}>
        <PressableScale onPress={() => router.navigate('/profile')} accessibilityLabel="Your profile">
          {profile.data ? <Avatar person={profile.data} size={34} /> : <View style={{ width: 34, height: 34 }} />}
        </PressableScale>
        <Text variant="title" style={{ flex: 1 }}>
          Pods
        </Text>
        <IconButton icon="plusSquare" label="New or join a pod" onPress={() => router.push('/pod/new')} />
      </View>

      {pods.isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
      ) : !pods.data?.length ? (
        <EmptyState
          emoji="🌱"
          title="No pods yet"
          body="A pod is a few friends tracking one habit together. Snap daily, grow a tree."
          action={<Button label="Start or join a pod" icon="plus" onPress={() => router.push('/pod/new')} />}
        />
      ) : (
        <>
          <HabitTabs habits={myHabits.data} selected={habitId} onSelect={setHabitId} due={due} />
          <FlatList
            data={inHabit}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => <PodRow pod={item} emoji={emoji(item.habitId)} now={now} />}
            ListHeaderComponent={
              <View>
                {urgent ? <WindowBanner pod={urgent} now={now} /> : null}
                {habitId ? <StoriesRow me={profile.data} groups={stories.groups} habitId={habitId} /> : null}
                <Text variant="overline" style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 6 }}>
                  Pods
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                tintColor={colors.ink.muted}
                refreshing={pods.isRefetching}
                onRefresh={() => {
                  void pods.refetch()
                  void stories.refetch()
                }}
              />
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          />
        </>
      )}
    </View>
  )
}
