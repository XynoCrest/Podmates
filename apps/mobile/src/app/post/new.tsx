import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Button, SheetScreen, TextField } from '@/components/ui'
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

  return (
    <SheetScreen
      title="New post"
      subtitle={c ? `In ${c.name}` : undefined}
      error={create.error?.message}
      action={<Button label="Post" size="lg" disabled={!title.trim()} loading={create.isPending} onPress={submit} />}
    >
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="What’s it about?" maxLength={300} />
      <TextField label="Details" value={body} onChangeText={setBody} placeholder="Say more (optional)" multiline style={{ minHeight: 140 }} />
    </SheetScreen>
  )
}
