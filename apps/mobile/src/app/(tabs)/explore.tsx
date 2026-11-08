import { colors, hero } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HeroHeading, HeroSheet, ScreenState, TabHero } from '@/components/ui'
import { SearchBar, UnderlineTabs } from '@/features/explore/components/ExploreTop'
import { PostCard } from '@/features/explore/components/PostCard'
import { useFeed, type FeedSort } from '@/features/explore/hooks'

const PEAS = require('../../../assets/images/home-peas.png')

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'hot', label: 'Active' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
]

/** Feed: green hero (heading, search, peas), then the sheet: Active/New/Top tabs, cards. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed('popular', sort)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(true)
  const [pastHero, setPastHero] = useState(false)
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )
  // Search narrows both the circles and the posts already loaded, by name, title or body.
  const q = query.trim().toLowerCase()
  const posts = useMemo(
    () => (q ? feed.data?.filter((p) => [p.title, p.body, p.community.name].some((t) => t.toLowerCase().includes(q))) : feed.data),
    [feed.data, q],
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {focused ? <StatusBar style={pastHero ? 'light' : 'dark'} /> : null}
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 8, backgroundColor: colors.sunken }} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setPastHero(e.nativeEvent.contentOffset.y > 120)}
        scrollEventThrottle={32}
        ListHeaderComponent={
          <View>
            <TabHero topInset={insets.top} heading={<HeroHeading lead="Find your" bright="people." oneLine />}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SearchBar value={query} onChange={setQuery} placeholder="Search posts" />
                <Image
                  source={PEAS}
                  style={{ width: 156, height: 92, marginTop: -18, transform: [{ rotate: '-30deg' }] }}
                  contentFit="contain"
                  accessible={false}
                />
              </View>
            </TabHero>
            <HeroSheet>
              <UnderlineTabs tabs={SORTS} value={sort} onChange={setSort} />
            </HeroSheet>
          </View>
        }
        ListEmptyComponent={
          feed.isLoading || feed.error ? (
            <ScreenState loading={feed.isLoading} error={feed.error} onRetry={() => void feed.refetch()} />
          ) : q ? (
            <ScreenState empty={{ icon: 'explore', title: 'Nothing matches', body: `No posts for "${query.trim()}"` }} />
          ) : (
            <ScreenState empty={{ icon: 'explore', title: 'No posts yet', body: 'Join a community and be the first to post.' }} />
          )
        }
        refreshControl={<RefreshControl tintColor={hero.ink} refreshing={feed.isRefetching} onRefresh={() => void feed.refetch()} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
      />
    </View>
  )
}
