import { colors } from '@podmates/ui-tokens'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, FlatList, RefreshControl, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, Icon, IconButton, Pill, SectionLabel, Text } from '@/components/ui'
import { CommunityRow, PostRow } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, type FeedSort } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string; heading: string }[] = [
  { key: 'hot', label: 'Hot', heading: 'Hot right now' },
  { key: 'new', label: 'New', heading: 'Newest' },
  { key: 'top', label: 'Top', heading: 'Top posts' },
]

/** Explore: search communities, your communities, then posts from every community. */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets()
  const [sort, setSort] = useState<FeedSort>('hot')
  const [query, setQuery] = useState('')
  const feed = useFeed('popular', sort)
  const communities = useCommunities()

  const q = query.trim().toLowerCase()
  const all = communities.data ?? []
  const joined = all.filter((c) => c.joined)
  // Searching looks through every community; otherwise show yours (or all, until you join one).
  const shown = q ? all.filter((c) => c.slug.includes(q) || c.name.toLowerCase().includes(q)) : joined.length ? joined : all
  const listLabel = q ? 'Communities' : joined.length ? 'Your communities' : 'Communities to join'

  const newPost = () => {
    const first = joined[0]
    if (!first) return Alert.alert('Join a community first', 'Open a community and tap Join, then you can post there.')
    router.push({ pathname: '/post/new', params: { community: first.id } })
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <FlatList
        data={q ? [] : feed.data}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostRow post={item} />}
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 10, paddingTop: 12 }}>
              <Text style={{ flex: 1, fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1 }}>Explore</Text>
              <IconButton icon="plus" label="New post" size={28} onPress={newPost} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16, height: 56, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface }}>
              <Icon name="explore" size={22} color={colors.ink.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search communities"
                placeholderTextColor={colors.ink.subtle}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
                style={{ flex: 1, fontSize: 18, color: colors.ink.DEFAULT }}
              />
            </View>

            {!q ? (
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
                {SORTS.map((s) => (
                  <Pill
                    key={s.key}
                    label={s.label}
                    selected={s.key === sort}
                    onPress={() => {
                      if (s.key !== sort) haptics.select()
                      setSort(s.key)
                    }}
                  />
                ))}
              </View>
            ) : null}

            <SectionLabel style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8 }}>{listLabel}</SectionLabel>
            {shown.map((c) => (
              <CommunityRow key={c.id} community={c} />
            ))}
            {q && !shown.length ? <Text style={{ paddingHorizontal: 20, paddingVertical: 12, fontSize: 16, color: colors.ink.muted }}>No communities match “{query.trim()}”.</Text> : null}

            {!q ? <SectionLabel style={{ paddingHorizontal: 20, paddingTop: 28 }}>{SORTS.find((s) => s.key === sort)!.heading}</SectionLabel> : null}
          </View>
        }
        ListEmptyComponent={
          q ? undefined : feed.isLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.ink.muted} />
          ) : (
            <EmptyState emoji="🧭" title="No posts yet" body="Join a community and start the conversation." />
          )
        }
        refreshControl={
          <RefreshControl
            tintColor={colors.ink.muted}
            refreshing={feed.isRefetching}
            onRefresh={() => {
              void feed.refetch()
              void communities.refetch()
            }}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  )
}
