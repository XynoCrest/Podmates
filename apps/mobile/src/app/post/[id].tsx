import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Header, Icon, PressableScale, Text } from '@/components/ui'
import { PostCard } from '@/features/explore/components/PostCard'
import { useAddComment, useComments, usePost } from '@/features/explore/hooks'
import { timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'

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
      <Header title={post.data?.community.name ?? ''} subtitle={post.data ? `${post.data.commentCount} comments` : undefined} />
      <FlatList
        data={comments.data}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={post.data ? <View style={{ marginBottom: 10 }}><PostCard post={post.data} full /></View> : undefined}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
            <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.author.id } })} accessibilityLabel={item.author.display_name}>
              <Avatar person={item.author} size={30} />
            </PressableScale>
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="caption">
                <Text style={{ fontWeight: '600', color: colors.ink.muted, fontSize: 12 }}>{item.author.username}</Text> · {timeAgo(item.createdAt)}
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 21 }}>{item.body}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={comments.isLoading ? undefined : <Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>No comments yet. Start the conversation.</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardDismissMode="interactive"
      />
      <View style={{ flexDirection: 'row', gap: 8, padding: 10, paddingBottom: Math.max(insets.bottom, 10), borderTopWidth: 0.5, borderTopColor: colors.line }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment"
          placeholderTextColor={colors.ink.subtle}
          multiline
          style={{ flex: 1, minHeight: 40, maxHeight: 120, borderRadius: 20, backgroundColor: colors.raised, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, color: colors.ink.DEFAULT, fontSize: 16 }}
        />
        <PressableScale onPress={submit} disabled={!text.trim()} accessibilityLabel="Post comment" scaleTo={0.9}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? colors.ink.DEFAULT : colors.raised, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={18} color={text.trim() ? colors.ink.inverse : colors.ink.subtle} weight="bold" />
          </View>
        </PressableScale>
      </View>
    </KeyboardAvoidingView>
  )
}
