import { colors } from '@podmates/ui-tokens'
import { useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, FlatList, Platform, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, Icon, PressableScale, Text } from '@/components/ui'
import { CommunityChips } from '@/features/explore/components/CommunityChips'
import { PostCard } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, type FeedMode, type FeedSort } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string; icon: 'flame' | 'clock' | 'trophy' }[] = [
  { key: 'hot', label: 'Hot', icon: 'flame' },
  { key: 'new', label: 'New', icon: 'clock' },
  { key: 'top', label: 'Top', icon: 'trophy' },
]

/** Apollo-style feed: "Home ⌄" switcher, community strip, cards separated by black gutters. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<FeedMode>('home')
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed(mode, sort)
  const communities = useCommunities()
  const current = SORTS.find((s) => s.key === sort)!

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
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
        <PressableScale
          onPress={() => pick('Feed', [{ label: 'Home', value: 'home' as FeedMode }, { label: 'Popular', value: 'popular' as FeedMode }], setMode)}
          accessibilityLabel={`Feed: ${mode}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 18, borderRadius: 19, backgroundColor: colors.raised }}>
            <Text style={{ fontSize: 17, fontWeight: '700' }}>{mode === 'home' ? 'Home' : 'Popular'}</Text>
            <Icon name="chevronDown" size={13} color={colors.ink.muted} weight="bold" />
          </View>
        </PressableScale>
        <View style={{ position: 'absolute', right: 12 }}>
          <PressableScale onPress={() => pick('Sort by', SORTS.map((s) => ({ label: s.label, value: s.key })), setSort)} accessibilityLabel={`Sort: ${current.label}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: colors.raised }}>
              <Icon name={current.icon} size={16} color={colors.ink.DEFAULT} />
              <Icon name="more" size={16} color={colors.ink.DEFAULT} weight="bold" />
            </View>
          </PressableScale>
        </View>
      </View>

      <FlatList
        data={feed.data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10, backgroundColor: colors.sunken }} />}
        ListHeaderComponent={communities.data ? <CommunityChips communities={communities.data} /> : undefined}
        ListEmptyComponent={
          feed.isLoading ? (
            <ActivityIndicator style={{ marginTop: 48 }} color={colors.ink.muted} />
          ) : (
            <EmptyState emoji="🧭" title="Your home feed is empty" body="Join a community above, or switch to Popular." />
          )
        }
        refreshControl={<RefreshControl tintColor={colors.ink.muted} refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}
