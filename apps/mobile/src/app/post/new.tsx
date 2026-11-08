import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, TextInput } from 'react-native'
import { Button, Text } from '@/components/ui'
import { useCreatePost } from '@/features/explore/hooks'
import { usePods } from '@/features/pods/hooks'
import { haptics } from '@/lib/haptics'

export default function NewPost() {
  const { pod: podId } = useLocalSearchParams<{ pod: string }>()
  const pods = usePods()
  const create = useCreatePost()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const pod = pods.data?.find((x) => x.id === podId)

  const submit = () =>
    create.mutate(
      { podId, title, body },
      {
        onSuccess: (id) => {
          haptics.success()
          router.back()
          router.push({ pathname: '/post/[id]', params: { id } })
        },
        onError: () => haptics.error(),
      },
    )

  const input = { color: colors.ink.DEFAULT, backgroundColor: colors.raised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }
  return (
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Text variant="title">Post to the {pod?.name} pod</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.ink.subtle} maxLength={300} style={{ ...input, fontSize: 18, fontWeight: '600' }} />
      <TextInput value={body} onChangeText={setBody} placeholder="Say more (optional)" placeholderTextColor={colors.ink.subtle} multiline style={{ ...input, fontSize: 16, minHeight: 140, textAlignVertical: 'top' }} />
      {create.error ? (
        <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
          {create.error.message}
        </Text>
      ) : null}
      <Button label="Post" size="lg" disabled={!title.trim()} loading={create.isPending} onPress={submit} />
    </ScrollView>
  )
}
