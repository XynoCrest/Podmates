import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, TextInput } from 'react-native'
import { Button, Text, inputText } from '@/components/ui'
import { useCommunities, useCreatePost } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

export default function NewPost() {
  const { community } = useLocalSearchParams<{ community: string }>()
  const communities = useCommunities()
  const create = useCreatePost()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const c = communities.data?.find((x) => x.id === community)

  const submit = () =>
    create.mutate(
      { communityId: community, title, body },
      {
        onSuccess: (id) => {
          haptics.success()
          router.back()
          router.push({ pathname: '/post/[id]', params: { id } })
        },
        onError: () => haptics.error(),
      },
    )

  const input = { backgroundColor: colors.canvas, borderWidth: 2, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }
  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text variant="title">Post to {c?.name}</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.ink.subtle} maxLength={300} style={[inputText, input, { fontSize: 18, fontFamily: 'Figtree_600SemiBold' }]} />
      <TextInput value={body} onChangeText={setBody} placeholder="Say more (optional)" placeholderTextColor={colors.ink.subtle} multiline style={[inputText, input, { minHeight: 140, textAlignVertical: 'top' }]} />
      {create.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {create.error.message}
        </Text>
      ) : null}
      <Button label="Post" size="lg" disabled={!title.trim()} loading={create.isPending} onPress={submit} />
    </ScrollView>
  )
}
