import { colors, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, View } from 'react-native'
import { Avatar, ChatScreen, Header, PressableScale, ScreenState, Text } from '@/components/ui'
import { PostCard } from '@/features/explore/components/PostCard'
import { useAddComment, useComments, usePost } from '@/features/explore/hooks'
import { Composer } from '@/features/pods/components/Composer'
import { timeAgo } from '@/lib/format'

/** A post and its comments: the chat template, with the post on top and the shared composer. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const post = usePost(id)
  const comments = useComments(id)
  const add = useAddComment(id)

  return (
    <ChatScreen
      header={<Header title={post.data?.community.name ?? ''} subtitle={post.data ? `${post.data.commentCount} comments` : undefined} />}
      composer={<Composer placeholder="Add a comment" onSend={(t) => add.mutate(t)} sending={add.isPending} />}
    >
      <FlatList
        data={comments.data}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={post.data ? <View style={{ marginBottom: space.sm }}><PostCard post={post.data} full /></View> : <ScreenState loading={post.isLoading} error={post.error} />}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.gutter, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
            <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.author.id } })} accessibilityLabel={item.author.display_name}>
              <Avatar person={item.author} size={32} />
            </PressableScale>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="caption">
                <Text variant="caption" style={{ fontWeight: '600' }}>{item.author.username}</Text> · {timeAgo(item.createdAt)}
              </Text>
              <Text variant="callout">{item.body}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={post.data ? <ScreenState loading={comments.isLoading} empty={{ icon: 'comment', title: 'No comments yet', body: 'Start the conversation.' }} /> : undefined}
        contentContainerStyle={{ paddingBottom: space.lg }}
        keyboardDismissMode="interactive"
      />
    </ChatScreen>
  )
}
