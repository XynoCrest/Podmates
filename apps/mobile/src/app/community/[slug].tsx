import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, Header, IconButton, Text } from '@/components/ui'
import { CommunityIcon, PostCard } from '@/features/explore/components/PostCard'
import { useCommunities, useFeed, useToggleJoin } from '@/features/explore/hooks'
import { compact } from '@/lib/format'
import { haptics } from '@/lib/haptics'

export default function CommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const insets = useSafeAreaInsets()
  const communities = useCommunities()
  const c = communities.data?.find((x) => x.slug === slug)
  const feed = useFeed('popular', 'hot', c?.id)
  const toggle = useToggleJoin()

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={c?.name ?? ''}
        right={c?.joined ? <IconButton icon="plusSquare" label="New post" onPress={() => router.push({ pathname: '/post/new', params: { community: c.id } })} /> : null}
      />
      {c ? (
        <FlatList
          data={c.id ? feed.data : []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <PostCard post={item} />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={
            <View style={{ padding: 16, gap: 12, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CommunityIcon symbol={c.symbol} color={c.color} size={56} />
                <View style={{ flex: 1 }}>
                  <Text variant="title">{c.name}</Text>
                  <Text variant="subhead">{compact(c.memberCount)} members</Text>
                </View>
                <Button
                  label={c.joined ? 'Joined' : 'Join'}
                  variant={c.joined ? 'secondary' : 'primary'}
                  size="sm"
                  onPress={() => {
                    haptics.tap()
                    toggle.mutate(c)
                  }}
                />
              </View>
              <Text style={{ fontSize: 15, lineHeight: 21, color: colors.ink.muted }}>{c.description}</Text>
            </View>
          }
          ListEmptyComponent={feed.isLoading ? undefined : <EmptyState icon="comment" title="No posts yet" body={c.joined ? 'Start the first conversation' : 'Join to post here'} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        />
      ) : null}
    </View>
  )
}
