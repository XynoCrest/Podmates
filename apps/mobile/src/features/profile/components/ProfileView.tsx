import { colors, radii } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, Dimensions, FlatList, Platform, ScrollView, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Icon, IconButton, PressableScale, SymbolIcon, Text, Tile, type IconName } from '@/components/ui'
import { auth, useMe } from '@/ctx/session'
import { compact } from '@/lib/format'
import { imageUri } from '@/lib/images'
import { goBack } from '@/lib/nav'
import type { Snap } from '../../snaps/hooks'
import { useProfileSnaps } from '../../snaps/hooks'
import { useProfile, useProfileHabits } from '../hooks'

const PAD = 16
const GAP = 8
const TILE_W = (Dimensions.get('window').width - PAD * 2 - GAP * 2) / 3
const TILE_H = TILE_W * (5 / 4)

/**
 * A gardener's page: who they are, what they've earned, and the snaps they chose
 * to keep, one habit at a time.
 */
export function ProfileView({ userId, asTab }: { userId: string; asTab?: boolean }) {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const isMe = userId === me
  const profile = useProfile(userId)
  const habits = useProfileHabits(userId)
  const [picked, setHabitId] = useState<string>()
  const habitId = picked && habits.data.some((h) => h.id === picked) ? picked : habits.data[0]?.id
  const snaps = useProfileSnaps(userId, habitId)

  const p = profile.data
  if (!p) return <View style={{ flex: 1, backgroundColor: colors.canvas }}>{profile.isLoading ? <ActivityIndicator style={{ marginTop: 120 }} /> : null}</View>

  const openMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Sign out', 'Cancel'], destructiveButtonIndex: 0, cancelButtonIndex: 1, userInterfaceStyle: 'dark' }, (i) => {
        if (i === 0) void auth.signOut()
      })
    } else void auth.signOut()
  }
  const share = () => void Share.share({ message: isMe ? `Keep a habit with me on Podmates. I'm @${p.username}` : `@${p.username} on Podmates` })

  // A leading tile on my own grid opens the picker.
  const tiles: (Snap | 'add')[] = isMe && habitId ? ['add', ...(snaps.data ?? [])] : (snaps.data ?? [])

  const header = (
    <View style={{ paddingHorizontal: PAD, gap: 16, paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <PressableScale onPress={isMe ? () => router.push('/profile/edit') : undefined} disabled={!isMe} accessibilityLabel="Profile photo">
          <Avatar person={p} size={72} />
        </PressableScale>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" numberOfLines={1}>
            {p.display_name}
          </Text>
          <Text variant="subhead">@{p.username}</Text>
        </View>
      </View>
      {p.bio ? <Text variant="callout" style={{ color: colors.ink.muted, lineHeight: 21 }}>{p.bio}</Text> : null}

      <View style={{ flexDirection: 'row', gap: GAP }}>
        <Stat icon="bolt" value={p.energy} label="Energy" />
        <Stat icon="star" value={p.stars} label="Perfect days" />
        <Stat icon="flame" value={p.streak} label="Day streak" />
      </View>

      <View style={{ flexDirection: 'row', gap: GAP }}>
        {isMe ? <Button label="Edit profile" variant="secondary" size="sm" flex onPress={() => router.push('/profile/edit')} /> : null}
        <Button label="Share" icon="share" variant="secondary" size="sm" flex={!isMe} onPress={share} />
        {isMe ? <Button label="Join a pod" icon="personAdd" variant="secondary" size="sm" onPress={() => router.push({ pathname: '/pod/new', params: { tab: 'join' } })} /> : null}
      </View>

      {habits.data.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: GAP }}>
          {habits.data.map((h) => {
            const active = h.id === habitId
            return (
              <PressableScale key={h.id} onPress={() => setHabitId(h.id)} accessibilityRole="tab" accessibilityLabel={h.name} accessibilityState={{ selected: active }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: active ? colors.leaf.deep : colors.line, backgroundColor: active ? colors.leaf.soft : 'transparent' }}>
                  <SymbolIcon name={h.sf_symbol} size={16} color={active ? colors.leaf.DEFAULT : colors.ink.subtle} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: active ? colors.leaf.DEFAULT : colors.ink.muted }}>{h.name}</Text>
                </View>
              </PressableScale>
            )
          })}
        </ScrollView>
      ) : null}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: asTab ? PAD : 8 }}>
        {!asTab ? <IconButton icon="back" label="Back" onPress={goBack} /> : null}
        <Text variant="headline" style={{ flex: 1 }} numberOfLines={1}>
          {asTab ? 'Profile' : p.display_name}
        </Text>
        {isMe ? <IconButton icon="menu" label="Menu" onPress={openMenu} /> : null}
      </View>
      <FlatList
        data={tiles}
        numColumns={3}
        keyExtractor={(t) => (t === 'add' ? 'add' : t.id)}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
        contentContainerStyle={{ gap: GAP, paddingBottom: insets.bottom + 96 }}
        renderItem={({ item }) =>
          item === 'add' ? (
            <PressableScale onPress={() => router.push({ pathname: '/profile/pick', params: { habit: habitId! } })} accessibilityLabel="Choose snaps for your profile">
              <View style={{ width: TILE_W, height: TILE_H, borderRadius: radii.photo, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.lip, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="plus" size={20} color={colors.ink.muted} />
                <Text variant="caption">Choose snaps</Text>
              </View>
            </PressableScale>
          ) : (
            <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: item.id } })} scaleTo={0.98} accessibilityLabel="Open snap">
              <Image source={{ uri: imageUri(item.image) }} style={{ width: TILE_W, height: TILE_H, borderRadius: radii.photo, backgroundColor: colors.surface }} contentFit="cover" transition={150} recyclingKey={item.id} />
            </PressableScale>
          )
        }
        ListEmptyComponent={
          <Text variant="subhead" center style={{ padding: 32 }}>
            {habits.data.length ? 'No snaps kept for this habit yet' : isMe ? 'Join a pod to start snapping' : 'Nothing shared yet'}
          </Text>
        }
      />
    </View>
  )
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Tile style={{ paddingVertical: 12, paddingHorizontal: 12, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={icon} size={16} color={colors.ink.subtle} />
          <Text numeric style={{ fontSize: 20, lineHeight: 26, fontWeight: '600' }}>
            {compact(value)}
          </Text>
        </View>
        <Text variant="caption">{label}</Text>
      </Tile>
    </View>
  )
}
