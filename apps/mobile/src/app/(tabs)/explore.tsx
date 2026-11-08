import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, Icon, PressableScale, Text } from '@/components/ui'
import { CommunityChips } from '@/features/explore/components/CommunityChips'
import { PostCard } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, type FeedMode, type FeedSort } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string; icon: 'flame' | 'clock' | 'trophy' }[] = [
  { key: 'hot', label: 'Hot', icon: 'flame' },
  { key: 'new', label: 'New', icon: 'clock' },
  { key: 'top', label: 'Top', icon: 'trophy' },
]

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<FeedMode>('home')
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed(mode, sort)
  const communities = useCommunities()
  const current = SORTS.find((s) => s.key === sort)!
  const modeLabel = mode === 'home' ? 'My communities' : 'Popular'

  const cycleSort = () => {
    const index = SORTS.findIndex((item) => item.key === sort)
    const next = SORTS[(index + 1) % SORTS.length]!
    haptics.select()
    setSort(next.key)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <FlatList
        data={feed.data}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 15 }}>
              <Text variant="overline" style={{ color: colors.leaf.DEFAULT }}>
                Find a conversation
              </Text>
              <Text variant="display" style={{ marginTop: 3 }}>
                Community
              </Text>
              <Text variant="subhead" style={{ marginTop: 5 }}>
                Posts from people building habits together.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12, gap: 10 }}>
              <PressableScale
                onPress={() => {
                  haptics.select()
                  setMode(mode === 'home' ? 'popular' : 'home')
                }}
                accessibilityRole="button"
                accessibilityLabel={`Feed: ${modeLabel}`}
                accessibilityHint="Switch between posts from your communities and popular posts."
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 42, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
                  <Text style={{ fontSize: 13, fontWeight: '700' }}>{modeLabel}</Text>
                  <Icon name="chevronDown" size={13} color={colors.ink.muted} weight="bold" />
                </View>
              </PressableScale>
              <PressableScale
                onPress={cycleSort}
                accessibilityRole="button"
                accessibilityLabel={`Sorted by ${current.label}. Tap to change sort order.`}
                accessibilityHint={`Changes the order to ${SORTS[(SORTS.findIndex((item) => item.key === sort) + 1) % SORTS.length]!.label}.`}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 42, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.raised }}>
                  <Icon name={current.icon} size={16} color={colors.energy.DEFAULT} />
                  <Text style={{ fontSize: 13, fontWeight: '700' }}>{current.label}</Text>
                  <Icon name="chevronDown" size={12} color={colors.ink.muted} />
                </View>
              </PressableScale>
            </View>

            {communities.isError ? (
              <View accessibilityRole="alert" style={{ marginHorizontal: 18, marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: colors.danger.soft }}>
                <Text style={{ color: colors.danger.DEFAULT, fontWeight: '700' }}>Couldn’t load communities.</Text>
                <Text style={{ marginTop: 3, marginBottom: 10, fontSize: 13, color: colors.ink.muted }}>Check your connection and try again.</Text>
                <Button label="Try again" size="sm" variant="secondary" onPress={() => void communities.refetch()} />
              </View>
            ) : communities.data ? (
              <CommunityChips communities={communities.data} />
            ) : (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.ink.muted} />
            )}

            {feed.isError ? (
              <View accessibilityRole="alert" style={{ marginHorizontal: 18, marginTop: 10, padding: 14, borderRadius: 14, backgroundColor: colors.danger.soft }}>
                <Text style={{ color: colors.danger.DEFAULT, fontWeight: '700' }}>Couldn’t load posts.</Text>
                <Text style={{ marginTop: 3, marginBottom: 10, fontSize: 13, color: colors.ink.muted }}>Check your connection and try again.</Text>
                <Button label="Try again" size="sm" variant="secondary" onPress={() => void feed.refetch()} />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
          ) : feed.isError ? null : mode === 'home' ? (
            <EmptyState
              emoji="🪴"
              title="No posts from your communities yet"
              body="Join a community to see its posts, or switch to Popular."
            />
          ) : (
            <EmptyState emoji="🪴" title="No community posts yet" body="Check back after someone shares a post." />
          )
        }
        refreshControl={
          <RefreshControl
            tintColor={colors.ink.muted}
            refreshing={feed.isRefetching}
            onRefresh={() => void feed.refetch()}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}
