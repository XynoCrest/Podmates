import { colors, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, IconButton, PushedScreen, ScreenState, Text } from '@/components/ui'
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
    <PushedScreen
      title={c?.name ?? ''}
      right={c?.joined ? <IconButton icon="plusSquare" label="New post" onPress={() => router.push({ pathname: '/post/new', params: { community: c.id } })} /> : null}
    >
      {!c ? (
        <ScreenState fill loading={communities.isLoading} error={communities.error} onRetry={() => void communities.refetch()} empty={{ icon: 'explore', title: 'Community not found' }} />
      ) : (
        <FlatList
          data={c.id ? feed.data : []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ItemSeparatorComponent={() => <View style={{ height: space.sm, backgroundColor: colors.sunken }} />}
          ListHeaderComponent={
            <View style={{ padding: space.gutter, gap: space.md, backgroundColor: colors.surface, marginBottom: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <CommunityIcon name={c.name} color={c.color} size={56} />
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
              <Text variant="callout" style={{ color: colors.ink.muted }}>{c.description}</Text>
            </View>
          }
          ListEmptyComponent={<ScreenState loading={feed.isLoading} error={feed.error} onRetry={() => void feed.refetch()} empty={{ icon: 'comment', title: 'No posts yet', body: c.joined ? 'Be the first to post' : 'Join to start the conversation' }} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
        />
      )}
    </PushedScreen>
  )
}
