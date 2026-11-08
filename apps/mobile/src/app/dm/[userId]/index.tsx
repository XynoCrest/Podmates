import { colors } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native'
import { Avatar, Header, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useDirectMessages, useMarkThreadRead, useSendDirect } from '@/features/dms/hooks'
import { Composer } from '@/features/pods/components/Composer'
import { MessageBubble } from '@/features/pods/components/MessageBubble'
import { useProfile } from '@/features/profile/hooks'

/** One-to-one chat with a podmate. */
export default function DirectChat() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const me = useMe()
  const other = useProfile(userId)
  const thread = useDirectMessages(other.data)
  const send = useSendDirect(userId)
  useMarkThreadRead(userId, thread.data)
  const p = other.data
  const openProfile = () => router.push({ pathname: '/user/[id]', params: { id: userId } })

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={
          <PressableScale onPress={openProfile} scaleTo={0.98} accessibilityLabel="Open profile">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {p ? <Avatar person={p} size={30} /> : null}
              <Text variant="headline" numberOfLines={1}>
                {p?.display_name ?? ' '}
              </Text>
            </View>
          </PressableScale>
        }
        subtitle={p ? `@${p.username}` : undefined}
      />
      {thread.isLoading || !p ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.ink.muted} />
      ) : thread.messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <Avatar person={p} size={72} />
          <Text variant="headline">{p.display_name}</Text>
          <Text variant="subhead" center>
            Say hi to your podmate.
          </Text>
        </View>
      ) : (
        <FlatList
          inverted
          data={thread.messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const above = thread.messages[index + 1]
            return <MessageBubble message={item} mine={item.author?.id === me} grouped={!!above && above.author?.id === item.author?.id} />
          }}
          contentContainerStyle={{ paddingVertical: 12 }}
          keyboardDismissMode="interactive"
        />
      )}
      <Composer onSend={(t) => send.mutate(t)} sending={send.isPending} onCamera={() => router.navigate('/camera')} />
    </KeyboardAvoidingView>
  )
}
