import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, EmptyState, Icon, PressableScale, Text, Tile } from '@/components/ui'
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
  const symbol = (id: string) => habits.data?.find((h) => h.id === id)?.sf_symbol ?? 'leaf'

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 }}>
        <PressableScale onPress={() => router.navigate('/profile')} accessibilityLabel="Your profile">
          {profile.data ? <Avatar person={profile.data} size={36} /> : <View style={{ width: 36, height: 36 }} />}
        </PressableScale>
        <Text variant="title" style={{ flex: 1 }}>
          Your pods
        </Text>
        <Tile onPress={() => router.push('/pod/new')} accessibilityLabel="Start or join a pod" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={20} weight="semibold" />
        </Tile>
      </View>

      {pods.isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
      ) : !pods.data?.length ? (
        <EmptyState
          icon="tree"
          title="No pods yet"
          body="A pod is a few friends keeping one habit together. Snap every day and your tree grows."
          action={<Button label="Start or join a pod" icon="plus" onPress={() => router.push('/pod/new')} />}
        />
      ) : (
        <>
          <HabitTabs habits={myHabits.data} selected={habitId} onSelect={setHabitId} due={due} />
          <FlatList
            data={inHabit}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: 16 }}>
                <PodRow pod={item} symbol={symbol(item.habitId)} now={now} />
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListHeaderComponent={
              <View>
                {urgent ? <WindowBanner pod={urgent} now={now} /> : null}
                {habitId ? <StoriesRow me={profile.data} groups={stories.groups} habitId={habitId} /> : null}
                <Text variant="label" style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                  {inHabit.length === 1 ? '1 pod' : `${inHabit.length} pods`}
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
            style={{ marginTop: 4 }}
          />
        </>
      )}
    </View>
  )
}
