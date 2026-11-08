import { colors, space } from '@podmates/ui-tokens'
import { router, useLocalSearchParams } from 'expo-router'
import { FlatList, View } from 'react-native'
import { Avatar, ChatScreen, Chip, Header, PressableScale, ScreenState, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { useDirectMessages, useMarkThreadRead, useSendDirect } from '@/features/dms/hooks'
import { usePairTree } from '@/features/pairs/hooks'
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
  const pair = usePairTree(userId)
  const openTree = () => router.push({ pathname: '/dm/[userId]/tree', params: { userId } })

  return (
    <ChatScreen
      composer={<Composer onSend={(t) => send.mutate(t)} sending={send.isPending} onCamera={() => router.navigate('/camera')} />}
      header={
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
        right={
          pair.data ? (
            // Our streak; tap for the pair tree (the same game as a pod's, for two).
            <View style={{ marginRight: space.sm }}>
              <Chip size="md" icon="flame" label={String(pair.data.streak)} color={colors.flame.DEFAULT} bg={colors.raised} onPress={openTree} accessibilityLabel="Open your tree together" />
            </View>
          ) : null
        }
      />
      }
    >
      {thread.isLoading || !p ? (
        <ScreenState fill loading />
      ) : thread.messages.length === 0 ? (
        <ScreenState fill empty={{ icon: 'comment', title: `Say hi to ${p.display_name}`, body: 'Your podmate will see it here.' }} />
      ) : (
        <FlatList
          inverted
          data={thread.messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const above = thread.messages[index + 1]
            return <MessageBubble message={item} mine={item.author?.id === me} grouped={!!above && above.author?.id === item.author?.id} />
          }}
          contentContainerStyle={{ paddingVertical: space.md }}
          keyboardDismissMode="interactive"
        />
      )}
    </ChatScreen>
  )
}
