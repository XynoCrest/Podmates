import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Header, Icon, PressableScale, Text } from '@/components/ui'
import { age, communityLabel, VoteColumn } from '@/features/explore/components/PostCard'
import { useAddComment, useComments, usePost, type Post } from '@/features/explore/hooks'
import { compact } from '@/lib/format'
import { haptics } from '@/lib/haptics'

/** One post: title, body, votes, then a flat list of comments and a comment box. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const post = usePost(id)
  const comments = useComments(id)
  const add = useAddComment(id)
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim()) return
    haptics.tap()
    add.mutate(text.trim())
    setText('')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={post.data ? communityLabel(post.data.community) : ''} />
      <FlatList
        data={comments.data}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={post.data ? <PostBody post={post.data} /> : undefined}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingVertical: 14 }}>
            <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.author.id } })} accessibilityLabel={item.author.display_name}>
              <Avatar person={item.author} size={48} />
            </PressableScale>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 15, color: colors.ink.muted }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink.DEFAULT }}>{item.author.username}</Text> · {age(item.createdAt)}
              </Text>
              <Text style={{ fontSize: 17, lineHeight: 25 }}>{item.body}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={comments.isLoading ? undefined : <Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>No comments yet. Start the conversation.</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardDismissMode="interactive"
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: colors.line }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment"
          placeholderTextColor={colors.ink.subtle}
          multiline
          style={{ flex: 1, minHeight: 56, maxHeight: 130, borderRadius: 28, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, color: colors.ink.DEFAULT, fontSize: 18 }}
        />
        {text.trim() ? (
          <PressableScale onPress={submit} accessibilityLabel="Post comment" scaleTo={0.9}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.leaf.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="send" size={22} color={colors.ink.inverse} weight="bold" />
            </View>
          </PressableScale>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  )
}

function PostBody({ post }: { post: Post }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 14 }}>
      <Text style={{ fontSize: 16, color: colors.ink.muted }}>
        {post.author.username} · {age(post.createdAt)} ago
      </Text>
      <Text style={{ fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.5 }}>{post.title}</Text>
      {post.body ? <Text style={{ fontSize: 18, lineHeight: 27 }}>{post.body}</Text> : null}
      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={{ width: '100%', aspectRatio: 3 / 2, borderRadius: 14, backgroundColor: colors.raised }} contentFit="cover" transition={200} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <VoteColumn post={post} horizontal />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel={`${post.commentCount} comments`}>
          <Icon name="comment" size={20} color={colors.ink.muted} />
          <Text numeric style={{ fontSize: 17, color: colors.ink.muted }}>
            {compact(post.commentCount)}
          </Text>
        </View>
      </View>
    </View>
  )
}
