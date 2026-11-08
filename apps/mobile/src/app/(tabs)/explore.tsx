import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, FlatList, Platform, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, Icon, PressableScale, Text } from '@/components/ui'
import { CommunityChips } from '@/features/explore/components/CommunityChips'
import { PostCard } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, type FeedMode, type FeedSort } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'hot', label: 'Popular now' },
  { key: 'new', label: 'Newest' },
  { key: 'top', label: 'Most upvoted' },
]

/** Posts from habit communities: the ones you joined, or everyone's. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<FeedMode>('home')
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed(mode, sort)
  const communities = useCommunities()
  const current = SORTS.find((s) => s.key === sort)!

  const pickSort = () => {
    if (Platform.OS !== 'ios') return setSort(SORTS[(SORTS.findIndex((s) => s.key === sort) + 1) % SORTS.length]!.key)
    ActionSheetIOS.showActionSheetWithOptions({ title: 'Sort posts', options: [...SORTS.map((s) => s.label), 'Cancel'], cancelButtonIndex: SORTS.length, userInterfaceStyle: 'dark' }, (i) => {
      if (i < SORTS.length) {
        haptics.select()
        setSort(SORTS[i]!.key)
      }
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 }}>
        <Text variant="title">Communities</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', flex: 1, padding: 4, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.line }}>
            {(['home', 'popular'] as const).map((m) => (
              <PressableScale key={m} flex onPress={() => setMode(m)} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}>
                <View style={{ height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? colors.raised : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: mode === m ? colors.ink.DEFAULT : colors.ink.subtle }}>{m === 'home' ? 'Joined' : 'Everyone'}</Text>
                </View>
              </PressableScale>
            ))}
          </View>
          <PressableScale onPress={pickSort} accessibilityLabel={`Sort: ${current.label}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 44 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.ink.muted }}>{current.label}</Text>
              <Icon name="chevronDown" size={12} color={colors.ink.subtle} weight="semibold" />
            </View>
          </PressableScale>
        </View>
      </View>

      <FlatList
        data={feed.data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PostCard post={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={communities.data ? <CommunityChips communities={communities.data} /> : undefined}
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
          ) : (
            <EmptyState icon="people" title="Nothing here yet" body="Join a community above, or switch to Everyone" />
          )
        }
        refreshControl={<RefreshControl tintColor={colors.ink.muted} refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}
