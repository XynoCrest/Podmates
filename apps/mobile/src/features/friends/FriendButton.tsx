import { router } from 'expo-router'
import { Alert, View } from 'react-native'
import { space } from '@podmates/ui-tokens'
import { Button } from '@/components/ui'
import { showActionSheet } from '@/lib/actionSheet'
import { haptics } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { useMyPods, type Person } from '../pods/hooks'
import { useCancelFriendRequest, useFriendState, useRespondFriendRequest, useSendFriendRequest } from './hooks'

/**
 * "Add friend": being friends means sharing a pod. If we already share one, the request just makes
 * us friends; otherwise I pick one of my pods they aren't in, and accepting joins it.
 */
export function useAddFriend() {
  const pods = useMyPods()
  const send = useSendFriendRequest()

  const sent = () => {
    haptics.success()
  }
  const failed = (e: Error) => {
    haptics.error()
    Alert.alert('Couldn’t send the request', e.message)
  }

  const addFriend = async (person: Person) => {
    const mine = pods.data ?? []
    if (!mine.length) {
      Alert.alert('Start a pod first', 'Friends share a habit and a pod. Start one, then invite them to it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start a pod', onPress: () => router.push({ pathname: '/connect', params: { tab: 'create' } }) },
      ])
      return
    }
    const { data, error } = await supabase.from('pod_members').select('pod_id').eq('user_id', person.id).in('pod_id', mine.map((p) => p.id))
    if (error) return failed(new Error(error.message))
    const theirs = new Set(data.map((m) => m.pod_id))
    if (theirs.size > 0) {
      // Already podmates: the request just makes us friends.
      send.mutate({ to: person.id }, { onSuccess: sent, onError: failed })
      return
    }
    showActionSheet({
      title: `Which pod should ${person.display_name} join?`,
      options: mine.map((p) => ({ label: p.name, onPress: () => send.mutate({ to: person.id, podId: p.id }, { onSuccess: sent, onError: failed }) })),
    })
  }

  return { addFriend, sending: send.isPending }
}

/** The button for one person, in whatever state we're in: add, requested (cancel), accept/decline, friends. */
export function FriendButton({ person, size = 'sm', flex }: { person: Person; size?: 'sm' | 'md'; flex?: boolean }) {
  const state = useFriendState(person.id)
  const { addFriend, sending } = useAddFriend()
  const cancel = useCancelFriendRequest()
  const respond = useRespondFriendRequest()

  const failed = (e: Error) => {
    haptics.error()
    Alert.alert('Something went wrong', e.message)
  }

  switch (state.kind) {
    case 'self':
      return null
    case 'friends':
      return <Button label="Friends" icon="check" variant="secondary" size={size} flex={flex} disabled />
    case 'sent':
      return (
        <Button
          label="Requested"
          icon="clock"
          variant="secondary"
          size={size}
          flex={flex}
          loading={cancel.isPending}
          onPress={() =>
            Alert.alert('Cancel your request?', `${person.display_name} won’t see it any more.`, [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Cancel request', style: 'destructive', onPress: () => cancel.mutate(state.request.id, { onError: failed }) },
            ])
          }
        />
      )
    case 'received':
      return (
        <View style={{ flexDirection: 'row', gap: space.sm, flex: flex ? 1 : undefined }}>
          <Button
            label={state.request.pod ? `Accept · join ${state.request.pod.name}` : 'Accept'}
            size={size}
            flex
            loading={respond.isPending}
            onPress={() => respond.mutate({ id: state.request.id, accept: true }, { onSuccess: () => haptics.success(), onError: failed })}
          />
          <Button label="Decline" variant="secondary" size={size} onPress={() => respond.mutate({ id: state.request.id, accept: false }, { onError: failed })} />
        </View>
      )
    default:
      return <Button label="Add friend" icon="personAdd" size={size} flex={flex} loading={sending} onPress={() => void addFriend(person)} />
  }
}
