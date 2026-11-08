import { colors, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, Pressable, View } from 'react-native'
import { Avatar, ChatScreen, Header, IconButton, PressableScale, ScreenState, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useReportFlow } from '@/features/safety/hooks'
import { goBack } from '@/lib/nav'
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
  const me = useMe()
  const reportFlow = useReportFlow()
  const mine = post.data?.author.id === me

  return (
    <ChatScreen
      header={
        <Header
          title={post.data?.community.name ?? ''}
          subtitle={post.data ? `${post.data.commentCount} comments` : undefined}
          right={post.data && !mine ? <IconButton icon="more" label="Report post" onPress={() => reportFlow('post', id, 'post', goBack)} /> : null}
        />
      }
      composer={<Composer placeholder="Add a comment" onSend={(t) => add.mutateAsync(t)} sending={add.isPending} />}
    >
      <FlatList
        data={comments.data}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={post.data ? <View style={{ marginBottom: space.sm }}><PostCard post={post.data} full /></View> : <ScreenState loading={post.isLoading} error={post.error} />}
        renderItem={({ item }) => (
          // Long-press someone else's comment to report it.
          <Pressable
            onLongPress={item.author.id !== me ? () => reportFlow('comment', item.id, 'comment') : undefined}
            accessibilityHint={item.author.id !== me ? 'Long-press to report' : undefined}
            style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.gutter, paddingVertical: space.md, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.line }}
          >
            <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.author.id } })} accessibilityLabel={item.author.display_name}>
              <Avatar person={item.author} size={32} />
            </PressableScale>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="caption">
                <Text variant="caption" style={{ fontWeight: '600' }}>{item.author.username}</Text> · {timeAgo(item.createdAt)}
              </Text>
              <Text variant="callout">{item.body}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={post.data ? <ScreenState loading={comments.isLoading} empty={{ icon: 'comment', title: 'No comments yet', body: 'Start the conversation.' }} /> : undefined}
        contentContainerStyle={{ paddingBottom: space.lg }}
        keyboardDismissMode="interactive"
      />
    </ChatScreen>
  )
}
