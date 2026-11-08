import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, Header, HeaderAction, Pill, Text } from '@/components/ui'
import { communityLabel, CommunityIcon, PostRow } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, useToggleJoin, type FeedSort } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
]

export default function CommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const communities = useCommunities()
  const c = communities.data?.find((x) => x.slug === slug)
  const [sort, setSort] = useState<FeedSort>('hot')
  const feed = useFeed('popular', sort, c?.id)
  const toggle = useToggleJoin()

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={c ? communityLabel(c) : ''}
        border={false}
        right={c?.joined ? <HeaderAction label="Post" onPress={() => router.push({ pathname: '/post/new', params: { community: c.id } })} /> : null}
      />
      {c ? (
        <FlatList
          data={c.id ? feed.data : []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostRow post={item} showCommunity={false} />}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <CommunityIcon community={c} size={84} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.4 }}>
                    {communityLabel(c)}
                  </Text>
                  <Text style={{ fontSize: 17, color: colors.ink.muted }}>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: colors.ink.DEFAULT }}>{c.memberCount.toLocaleString()}</Text> members
                  </Text>
                </View>
                <Button
                  label={c.joined ? 'Joined' : 'Join'}
                  variant={c.joined ? 'secondary' : 'primary'}
                  pill
                  onPress={() => {
                    haptics.tap()
                    toggle.mutate(c)
                  }}
                />
              </View>
              {c.description ? <Text style={{ fontSize: 17, lineHeight: 25, color: colors.ink.muted }}>{c.description}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 4 }}>
                {SORTS.map((s) => (
                  <Pill key={s.key} label={s.label} selected={s.key === sort} onPress={() => setSort(s.key)} />
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={feed.isLoading ? undefined : <EmptyState emoji="📝" title="No posts yet" body={c.joined ? 'Be the first to post.' : 'Join to start the conversation.'} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      ) : null}
    </View>
  )
}
