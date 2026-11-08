import { stageFor } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, Header, HealthBar, IconButton, PressableScale, Segmented, Text } from '@/components/ui'
import { PostCard } from '@/features/explore/components/PostCard'
import { usePodFeed, type FeedSort } from '@/features/explore/hooks'
import { useAddHabit, useMyHabits, usePods } from '@/features/pods/hooks'
import { SnapCard } from '@/features/snaps/components/SnapCard'
import { TreeArt } from '@/features/tree/TreeArt'
import { compact } from '@/lib/format'
import { haptics } from '@/lib/haptics'

/** A habit's pod: a Reddit-like feed of its snaps and posts, with the pod's tree at a glance. */
export default function PodScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const pods = usePods()
  const mine = useMyHabits()
  const add = useAddHabit()
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = usePodFeed(id, sort)
  const pod = pods.data?.find((p) => p.id === id)
  const member = mine.data.some((h) => h.pod.id === id)

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={pod ? `${pod.name} pod` : ''}
        right={member && pod ? <IconButton icon="plusSquare" label="New post" onPress={() => router.push({ pathname: '/post/new', params: { pod: pod.id } })} /> : null}
      />
      {!pod ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
      ) : (
        <FlatList
          data={feed.data ?? []}
          keyExtractor={(i) => (i.kind === 'post' ? `p:${i.post.id}` : `s:${i.snap.id}`)}
          renderItem={({ item }) => (item.kind === 'post' ? <PostCard post={item.post} showPod={false} /> : <SnapCard snap={item.snap} />)}
          ItemSeparatorComponent={() => <View style={{ height: 8, backgroundColor: colors.sunken }} />}
          ListHeaderComponent={
            <View style={{ padding: 16, gap: 14, backgroundColor: colors.surface, marginBottom: 8 }}>
              <PressableScale onPress={() => router.push({ pathname: '/pod/[id]/tree', params: { id: pod.id } })} scaleTo={0.98} accessibilityLabel="Open the pod tree">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <TreeArt totalSnaps={pod.tree.totalSnaps} health={pod.tree.health} size={88} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text variant="subhead">
                      {compact(pod.memberCount)} members · {stageFor(pod.tree.totalSnaps).name}
                    </Text>
                    <HealthBar ratio={pod.tree.health} height={10} />
                    <Text variant="caption">
                      {pod.tree.counted ? `${pod.tree.active} of ${pod.tree.counted} members on a streak` : 'Nobody to count today'}
                    </Text>
                  </View>
                </View>
              </PressableScale>
              {pod.description ? <Text style={{ fontSize: 15, lineHeight: 21, color: colors.ink.muted }}>{pod.description}</Text> : null}
              {!member ? (
                <Button
                  label={`Add ${pod.name} to my habits`}
                  icon="plus"
                  loading={add.isPending}
                  onPress={() => add.mutate(pod.habitId, { onSuccess: () => haptics.success() })}
                />
              ) : null}
              <Segmented
                value={sort}
                onChange={setSort}
                segments={[
                  { key: 'hot', label: 'Hot' },
                  { key: 'new', label: 'New' },
                  { key: 'top', label: 'Top' },
                ]}
              />
            </View>
          }
          ListEmptyComponent={
            feed.isLoading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={colors.ink.muted} />
            ) : (
              <EmptyState icon="camera" title="Nothing here yet" body={member ? 'Snap today or start a conversation.' : 'Add this habit to snap and post here.'} />
            )
          }
          refreshControl={<RefreshControl tintColor={colors.ink.muted} refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      )}
    </View>
  )
}
