import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Header, Icon, inputText, PressableScale, Text, Tile } from '@/components/ui'
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
      <Header title={post.data?.community.name ?? ''} subtitle={post.data ? `${post.data.commentCount} ${post.data.commentCount === 1 ? "reply" : "replies"}` : undefined} />
      <FlatList
        data={comments.data}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={post.data ? <View style={{ padding: 16 }}><PostCard post={post.data} full /></View> : undefined}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }}>
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
        ListEmptyComponent={comments.isLoading ? undefined : <Text variant="subhead" center style={{ padding: 32 }}>No replies yet</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardDismissMode="interactive"
      />
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: colors.line }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Reply"
          placeholderTextColor={colors.ink.subtle}
          multiline
          style={[inputText, { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 16, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }]}
        />
        <Tile tone={text.trim() ? 'leaf' : 'surface'} onPress={text.trim() ? submit : undefined} accessibilityLabel="Post reply" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={18} color={text.trim() ? colors.leaf.DEFAULT : colors.ink.subtle} weight="bold" />
        </Tile>
      </View>
    </KeyboardAvoidingView>
  )
}
