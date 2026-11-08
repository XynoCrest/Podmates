import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ActionSheetIOS, Alert, Platform, View } from 'react-native'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { useMe } from '@/ctx/session'
import { timeAgo } from '@/lib/format'
import { haptics } from '@/lib/haptics'
import { imageUri } from '@/lib/images'
import { useCheer, useFlagSnap, type Snap } from '../hooks'

/**
 * A snap in a pod feed: author, photo, caption, and the kind reactions. Cheers are positive only;
 * "Flag as fake" is tucked behind ••• and anonymous (five flags hide a snap for team review).
 */
export function SnapCard({ snap }: { snap: Snap }) {
  const me = useMe()
  const cheer = useCheer()
  const flag = useFlagSnap()
  const mine = snap.author.id === me

  const toggleCheer = () => {
    haptics.select()
    cheer.mutate({ snap, on: !snap.cheeredByMe })
  }

  const confirmFlag = () => {
    const doFlag = () =>
      flag.mutate(snap, {
        onSuccess: () => {
          haptics.success()
          Alert.alert('Thanks for flagging', 'If enough people flag it, the Podmates team will review it.')
        },
      })
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: 'Does this snap not show the habit?', options: ['Flag as fake', 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1, userInterfaceStyle: 'dark' },
        (i) => i === 0 && doFlag(),
      )
    } else {
      Alert.alert('Flag as fake?', 'Does this snap not show the habit?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Flag', style: 'destructive', onPress: doFlag }])
    }
  }

  return (
    <View style={{ backgroundColor: colors.surface, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 }}>
        <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: snap.author.id } })} accessibilityLabel={snap.author.display_name}>
          <Avatar person={snap.author} size={32} />
        </PressableScale>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, color: colors.ink.muted }}>
          <Text style={{ fontWeight: '600', color: colors.ink.DEFAULT }}>{snap.author.username}</Text> snapped · {timeAgo(snap.takenAt)}
        </Text>
        {!mine ? (
          <PressableScale onPress={confirmFlag} accessibilityLabel="More" hitSlop={8}>
            <Icon name="more" size={18} color={colors.ink.subtle} />
          </PressableScale>
        ) : null}
      </View>
      <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: snap.id } })} scaleTo={0.99} accessibilityLabel="Open snap">
        <Image source={{ uri: imageUri(snap.image) }} style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.raised }} contentFit="cover" transition={200} recyclingKey={snap.id} />
      </PressableScale>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}>
        <PressableScale onPress={toggleCheer} scaleTo={0.85} accessibilityRole="button" accessibilityLabel={snap.cheeredByMe ? 'Remove cheer' : 'Cheer'} accessibilityState={{ selected: snap.cheeredByMe }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: snap.cheeredByMe ? colors.leaf.soft : colors.raised }}>
            <Icon name="sparkles" size={16} color={snap.cheeredByMe ? colors.leaf.DEFAULT : colors.ink.muted} />
            <Text numeric style={{ fontSize: 14, fontWeight: '600', color: snap.cheeredByMe ? colors.leaf.DEFAULT : colors.ink.muted }}>
              {snap.cheers ? `${snap.cheers} ${snap.cheers === 1 ? 'cheer' : 'cheers'}` : 'Cheer'}
            </Text>
          </View>
        </PressableScale>
        {snap.caption ? (
          <Text numberOfLines={2} style={{ flex: 1, fontSize: 15, color: colors.ink.DEFAULT }}>
            {snap.caption}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
