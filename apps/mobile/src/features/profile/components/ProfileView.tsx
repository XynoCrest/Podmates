import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, Alert, Dimensions, FlatList, Platform, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, HabitIcon, Icon, IconButton, PressableScale, Text, type IconName } from '@/components/ui'
import { auth, useMe } from '@/ctx/session'
import { compact } from '@/lib/format'
import { imageUri } from '@/lib/images'
import { goBack } from '@/lib/nav'
import type { Snap } from '../../snaps/hooks'
import { useProfileSnaps } from '../../snaps/hooks'
import { useProfile, useProfileHabits, type Profile } from '../hooks'

const GAP = 4
const TILE_W = (Dimensions.get('window').width - GAP * 2) / 3
const TILE_H = TILE_W * (4 / 3) // 3:4 portrait grid

/**
 * Profile: avatar · name · @username, three stats (⚡ energy, ⭐ stars, 🔥 streak),
 * one icon tab per habit, then a 3:4 grid of the snaps chosen for that habit.
 * On my own profile the settings icon holds Edit / Share / Join / New pod / Sign out.
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

  const count = snaps.data?.length ?? 0
  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: asTab ? 24 : 4, gap: 20 }}>
        <PressableScale onPress={isMe ? () => router.push('/profile/edit') : undefined} disabled={!isMe} accessibilityLabel="Profile photo">
          <Avatar person={p} size={112} ring="unseen" />
        </PressableScale>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 }}>
            {p.display_name}
          </Text>
          <Text numberOfLines={1} style={{ fontSize: 18, color: colors.ink.muted }}>
            @{p.username}
          </Text>
        </View>
        {isMe ? <IconButton icon="settings" label="Settings" color={colors.ink.muted} size={28} onPress={() => openSettings(p)} /> : null}
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 28, gap: 8 }}>
        <Stat value={p.energy} label="Energy" icon="bolt" color={colors.energy.DEFAULT} />
        <Stat value={p.stars} label="Stars" icon="star" color={colors.star.DEFAULT} />
        <Stat value={p.streak} label="Streak" icon="flame" color={colors.flame.DEFAULT} />
      </View>

      {/* Habit tabs: icon per habit, green underline on the active one. */}
      <View style={{ flexDirection: 'row', marginTop: 28, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        {habits.data.map((h) => {
          const active = h.id === habitId
          return (
            <PressableScale key={h.id} flex onPress={() => setHabitId(h.id)} accessibilityRole="tab" accessibilityLabel={h.name} accessibilityState={{ selected: active }} scaleTo={0.94}>
              <View style={{ alignItems: 'center', paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: active ? colors.leaf.DEFAULT : 'transparent', marginBottom: -1 }}>
                <HabitIcon habit={h} size={28} color={active ? colors.leaf.DEFAULT : colors.ink.muted} />
              </View>
            </PressableScale>
          )
        })}
      </View>

      {habitId ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 }}>
          <Text style={{ fontSize: 17, color: colors.ink.muted }}>
            <Text numeric style={{ fontSize: 17, fontWeight: '700', color: colors.ink.DEFAULT }}>
              {count}
            </Text>{' '}
            {isMe ? (count === 1 ? 'snap you picked' : 'snaps you picked') : count === 1 ? 'snap' : 'snaps'}
          </Text>
          {isMe ? <Button label="Pick snaps" variant="outline" pill size="md" onPress={() => router.push({ pathname: '/profile/pick', params: { habit: habitId } })} /> : null}
        </View>
      ) : null}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      {!asTab ? (
        <View style={{ height: 52, justifyContent: 'center', paddingHorizontal: 8 }}>
          <IconButton icon="back" label="Back" onPress={goBack} />
        </View>
      ) : null}
      <FlatList
        data={snaps.data ?? []}
        numColumns={3}
        keyExtractor={(s: Snap) => s.id}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: item.id } })} scaleTo={0.98} accessibilityLabel="Open snap">
            <Image source={{ uri: imageUri(item.image) }} style={{ width: TILE_W, height: TILE_H, backgroundColor: colors.raised }} contentFit="cover" transition={150} recyclingKey={item.id} />
          </PressableScale>
        )}
        ListEmptyComponent={
          <Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>
            {habits.data.length ? (isMe ? 'No snaps picked for this habit yet. Tap Pick snaps to choose some.' : 'No snaps on the profile for this habit yet.') : isMe ? 'Join a pod to start snapping.' : 'Nothing shared yet.'}
          </Text>
        }
      />
    </View>
  )
}

function openSettings(p: Profile) {
  const actions: { label: string; run: () => void; destructive?: boolean }[] = [
    { label: 'Edit profile', run: () => router.push('/profile/edit') },
    { label: 'Share profile', run: () => void Share.share({ message: `Grow habits with me on Podmates — I'm @${p.username}` }) },
    { label: 'Join a pod', run: () => router.push({ pathname: '/pod/new', params: { tab: 'join' } }) },
    { label: 'Start a new pod', run: () => router.push('/pod/new') },
    { label: 'Sign out', run: () => void auth.signOut(), destructive: true },
  ]
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...actions.map((a) => a.label), 'Cancel'], destructiveButtonIndex: actions.length - 1, cancelButtonIndex: actions.length, userInterfaceStyle: 'light' },
      (i) => actions[i]?.run(),
    )
  } else {
    // Android/web alerts hold at most three buttons: keep the two most used plus Cancel.
    Alert.alert('Settings', undefined, [
      { text: 'Edit profile', onPress: actions[0]!.run },
      { text: 'Sign out', style: 'destructive', onPress: actions[4]!.run },
      { text: 'Cancel', style: 'cancel' },
    ])
  }
}

function Stat({ value, label, icon, color }: { value: number; label: string; icon: IconName; color: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }} accessibilityLabel={`${value} ${label}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={20} color={color} />
        <Text numeric style={{ fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 }}>
          {value < 100_000 ? value.toLocaleString() : compact(value)}
        </Text>
      </View>
      <Text style={{ fontSize: 17, color: colors.ink.muted }}>{label}</Text>
    </View>
  )
}
