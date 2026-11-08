import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActionSheetIOS, Platform, ScrollView, View } from 'react-native'
import { Icon, PressableScale, SectionLabel, SheetHeader, Text, TextField } from '@/components/ui'
import { communityLabel, CommunityIcon } from '@/features/explore/components/PostCard'
import { useCommunities, useCreatePost } from '@/features/explore/hooks'
import { haptics } from '@/lib/haptics'

/** New post: pick one of your communities, a one-line title, an optional body. */
export default function NewPost() {
  const params = useLocalSearchParams<{ community: string }>()
  const communities = useCommunities()
  const create = useCreatePost()
  const [communityId, setCommunityId] = useState(params.community)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const joined = communities.data?.filter((c) => c.joined) ?? []
  const c = communities.data?.find((x) => x.id === communityId)

  // You can only post where you're a member (RLS), so the picker lists joined communities.
  const pickCommunity = () => {
    if (Platform.OS !== 'ios' || joined.length < 2) return
    ActionSheetIOS.showActionSheetWithOptions({ title: 'Post to', options: [...joined.map(communityLabel), 'Cancel'], cancelButtonIndex: joined.length, userInterfaceStyle: 'light' }, (i) => {
      const next = joined[i]
      if (next) {
        haptics.select()
        setCommunityId(next.id)
      }
    })
  }

  const submit = () =>
    create.mutate(
      { communityId, title, body },
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
    <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[0]}>
      <SheetHeader title="New post" onCancel={() => router.back()} action="Post" onAction={submit} actionDisabled={!title.trim() || !c} actionLoading={create.isPending} />
      <View style={{ padding: 20, gap: 20 }}>
        <View style={{ gap: 8 }}>
          <SectionLabel style={{ textTransform: 'none', letterSpacing: 0, fontSize: 15 }}>Community</SectionLabel>
          <PressableScale onPress={pickCommunity} disabled={joined.length < 2} accessibilityRole="button" accessibilityLabel={`Community: ${c ? communityLabel(c) : 'none'}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, height: 64, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.canvas }}>
              {c ? <CommunityIcon community={c} size={40} /> : null}
              <Text style={{ flex: 1, fontSize: 19, fontWeight: '700' }}>{c ? communityLabel(c) : 'Choose a community'}</Text>
              {joined.length > 1 ? <Icon name="chevronDown" size={22} color={colors.ink.muted} /> : null}
            </View>
          </PressableScale>
        </View>
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Say it in one line" maxLength={300} />
        <TextField label="Body" hint="optional" value={body} onChangeText={setBody} placeholder="What happened, and what you are asking" multiline />
        {create.error ? (
          <Text variant="caption" style={{ color: colors.danger.DEFAULT }}>
            {create.error.message}
          </Text>
        ) : null}
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.ink.muted }}>Posts here are public to the community. Pod snaps stay in your pod.</Text>
      </View>
    </ScrollView>
  )
}
