import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, IconButton, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { HabitTabs } from '@/features/pods/components/HabitTabs'
import { PodRow } from '@/features/pods/components/PodRow'
import { StoriesRow } from '@/features/pods/components/StoriesRow'
import { WindowBanner } from '@/features/pods/components/WindowBanner'
import { needsSnap, useMyHabits, useMyPods } from '@/features/pods/hooks'
import { useProfile } from '@/features/profile/hooks'
import { useStories } from '@/features/snaps/hooks'
import { useNow } from '@/lib/useNow'

/** Home: habit pills → podmates' snaps → the pod chats for that habit. */
export default function PodsScreen() {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const now = useNow()
  const profile = useProfile(me)
  const pods = useMyPods()
  const myHabits = useMyHabits()
  const [picked, setHabitId] = useState<string>()
  // Until a pill is tapped: the first habit with a window open for me, else the first one.
  const habitId =
    picked && myHabits.data.some((h) => h.id === picked)
      ? picked
      : (pods.data?.find((p) => needsSnap(p, now))?.habitId ?? myHabits.data[0]?.id)

  const stories = useStories(habitId)
  const due = useMemo(() => new Set(pods.data?.filter((p) => needsSnap(p, now)).map((p) => p.habitId)), [pods.data, now])
  const inHabit = pods.data?.filter((p) => p.habitId === habitId) ?? []
  const urgent = inHabit.find((p) => needsSnap(p, now))

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 10, paddingTop: 12, paddingBottom: 14 }}>
        <Text style={{ flex: 1, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1 }}>Pods</Text>
        <IconButton icon="plus" label="Start or join a pod" size={28} onPress={() => router.push('/pod/new')} />
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
          <View>
            <HabitTabs habits={myHabits.data} selected={habitId} onSelect={setHabitId} due={due} />
          </View>
          <FlatList
            data={inHabit}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => <PodRow pod={item} now={now} />}
            ListHeaderComponent={
              <View style={{ paddingBottom: 8 }}>
                {urgent ? <WindowBanner pod={urgent} now={now} /> : null}
                {habitId ? <StoriesRow me={profile.data} groups={stories.groups} habitId={habitId} /> : null}
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
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </>
      )}
    </View>
  )
}
