import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, FlatList, Platform, RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, Icon, PressableScale, SymbolIcon, Text } from '@/components/ui'
import { PostCard } from '@/features/explore/components/PostCard'
import { useFeed, type FeedSort } from '@/features/explore/hooks'
import { useHabits, useMyHabits, usePods, type Pod } from '@/features/pods/hooks'
import { compact } from '@/lib/format'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string; icon: 'flame' | 'clock' | 'trophy' }[] = [
  { key: 'hot', label: 'Hot', icon: 'flame' },
  { key: 'new', label: 'New', icon: 'clock' },
  { key: 'top', label: 'Top', icon: 'trophy' },
]

/** Explore: discover habit pods (top strip), then trending posts from every pod. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed(sort)
  const pods = usePods()
  const current = SORTS.find((s) => s.key === sort)!

  const pickSort = () => {
    if (Platform.OS !== 'ios') return
    ActionSheetIOS.showActionSheetWithOptions({ title: 'Sort by', options: [...SORTS.map((s) => s.label), 'Cancel'], cancelButtonIndex: SORTS.length, userInterfaceStyle: 'dark' }, (i) => {
      if (i < SORTS.length) {
        haptics.select()
        setSort(SORTS[i]!.key)
      }
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
        <Text variant="title" style={{ flex: 1 }}>
          Explore
        </Text>
        <PressableScale onPress={pickSort} accessibilityLabel={`Sort: ${current.label}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.raised }}>
            <Icon name={current.icon} size={16} color={colors.ink.DEFAULT} />
            <Text style={{ fontSize: 15, fontWeight: '600' }}>{current.label}</Text>
          </View>
        </PressableScale>
      </View>

      <FlatList
        data={feed.data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8, backgroundColor: colors.sunken }} />}
        ListHeaderComponent={pods.data ? <DiscoverPods pods={pods.data} /> : undefined}
        ListEmptyComponent={
          feed.isLoading ? <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} /> : <EmptyState icon="explore" title="No posts yet" body="Open a pod and start the conversation" />
        }
        refreshControl={
          <RefreshControl
            tintColor={colors.ink.muted}
            refreshing={feed.isRefetching}
            onRefresh={() => {
              void feed.refetch()
              void pods.refetch()
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}

/** Horizontal strip of habit pods, busiest first; pods I'm in are marked. */
function DiscoverPods({ pods }: { pods: Pod[] }) {
  const habits = useHabits()
  const mine = useMyHabits()
  const tracked = new Set(mine.data.map((h) => h.pod.id))
  const sorted = [...pods].sort((a, b) => b.memberCount - a.memberCount || b.tree.totalSnaps - a.tree.totalSnaps)
  return (
    <View style={{ paddingVertical: 12, gap: 10 }}>
      <Text variant="overline" style={{ paddingHorizontal: 16 }}>
        Discover pods
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {sorted.map((p) => {
          const symbol = habits.data?.find((h) => h.id === p.habitId)?.sf_symbol ?? 'leaf'
          const mineP = tracked.has(p.id)
          return (
            <PressableScale key={p.id} onPress={() => router.push({ pathname: '/pod/[id]', params: { id: p.id } })} scaleTo={0.96} accessibilityLabel={`${p.name} pod${mineP ? ', in your habits' : ''}`}>
              <View style={{ width: 132, padding: 12, gap: 8, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: mineP ? colors.leaf.DEFAULT : colors.line }}>
                <SymbolIcon name={symbol} size={22} color={mineP ? colors.leaf.DEFAULT : colors.ink.muted} />
                <Text style={{ fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {compact(p.memberCount)} members · {Math.round(p.tree.health * 100)}%
                </Text>
              </View>
            </PressableScale>
          )
        })}
      </ScrollView>
    </View>
  )
}
