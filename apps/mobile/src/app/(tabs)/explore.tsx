import { colors } from '@podmates/ui-tokens'
import { useMemo, useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, FlatList, Platform, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, Icon, PressableScale, Text } from '@/components/ui'
import { CommunityCircles, SearchBar, UnderlineTabs } from '@/features/explore/components/ExploreTop'
import { PostCard } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, type FeedMode, type FeedSort } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'hot', label: 'Active' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
]

/** Feed: search + "Home ⌄" switcher, community circles, Active/New/Top tabs, then cards separated by black gutters. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<FeedMode>('home')
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed(mode, sort)
  const communities = useCommunities()
  const [query, setQuery] = useState('')
  // Search narrows both the circles and the posts already loaded, by name, title or body.
  const q = query.trim().toLowerCase()
  const shownCommunities = useMemo(() => communities.data?.filter((c) => !q || c.name.toLowerCase().includes(q)), [communities.data, q])
  const posts = useMemo(
    () => (q ? feed.data?.filter((p) => [p.title, p.body, p.community.name].some((t) => t.toLowerCase().includes(q))) : feed.data),
    [feed.data, q],
  )

  const pick = <T,>(title: string, options: { label: string; value: T }[], onPick: (v: T) => void) => {
    if (Platform.OS !== 'ios') return onPick(options[0]!.value) // the product targets iOS; other platforms get the default
    ActionSheetIOS.showActionSheetWithOptions({ title, options: [...options.map((o) => o.label), 'Cancel'], cancelButtonIndex: options.length, userInterfaceStyle: 'dark' }, (i) => {
      if (i < options.length) {
        haptics.select()
        onPick(options[i]!.value)
      }
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search posts, communities" />
        <PressableScale
          onPress={() => pick('Feed', [{ label: 'Home', value: 'home' as FeedMode }, { label: 'Popular', value: 'popular' as FeedMode }], setMode)}
          accessibilityLabel={`Feed: ${mode}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.raised }}>
            <Text style={{ fontSize: 15, fontWeight: '600' }}>{mode === 'home' ? 'Home' : 'Popular'}</Text>
            <Icon name="chevronDown" size={12} color={colors.ink.muted} weight="bold" />
          </View>
        </PressableScale>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8, backgroundColor: colors.sunken }} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {shownCommunities?.length ? <CommunityCircles communities={shownCommunities} /> : null}
            <UnderlineTabs tabs={SORTS} value={sort} onChange={setSort} />
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
          ) : q ? (
            <EmptyState icon="explore" title="Nothing matches" body={`No posts or communities for "${query.trim()}"`} />
          ) : (
            <EmptyState icon="explore" title="Your home feed is empty" body="Join a community above, or switch to Popular" />
          )
        }
        refreshControl={<RefreshControl tintColor={colors.ink.muted} refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}
