import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { goBack } from '@/lib/nav'
import { useState, type ReactNode } from 'react'
import { ActionSheetIOS, ActivityIndicator, Dimensions, FlatList, Platform, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Icon, IconButton, PressableScale, SymbolIcon, Text } from '@/components/ui'
import { auth, useMe } from '@/ctx/session'
import { imageUri } from '@/lib/images'
import { compact } from '@/lib/format'
import type { Snap } from '../../snaps/hooks'
import { useProfileSnaps } from '../../snaps/hooks'
import { useProfile, useProfileHabits } from '../hooks'

const GAP = 2
const TILE_W = (Dimensions.get('window').width - GAP * 2) / 3
const TILE_H = TILE_W * (4 / 3) // Instagram's 3:4 portrait grid

/**
 * Instagram-style profile: avatar + three stats (⚡ energy, ⭐ stars, 🔥 streak),
 * bio, actions, then one icon tab per habit over a 3:4 grid of chosen snaps.
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

  // A leading "+" tile on my own grid opens the picker.
  const tiles: (Snap | 'add')[] = isMe && habitId ? ['add', ...(snaps.data ?? [])] : (snaps.data ?? [])

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, gap: 24 }}>
        <PressableScale onPress={isMe ? () => router.push('/profile/edit') : undefined} disabled={!isMe} accessibilityLabel="Profile photo">
          <View>
            <Avatar person={p} size={88} />
            {isMe ? (
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink.DEFAULT, borderWidth: 3, borderColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={13} color={colors.ink.inverse} weight="bold" />
              </View>
            ) : null}
          </View>
        </PressableScale>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '700' }}>{p.display_name}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 8 }}>
            <Stat value={p.energy} label="energy" icon={<Icon name="bolt" size={13} color={colors.energy.DEFAULT} />} />
            <Stat value={p.stars} label="stars" icon={<Icon name="star" size={13} color={colors.star.DEFAULT} />} />
            <Stat value={p.streak} label="streak" icon={<Icon name="flame" size={13} color={colors.flame.DEFAULT} />} />
          </View>
        </View>
      </View>

      {p.bio ? <Text style={{ paddingHorizontal: 16, paddingTop: 12, fontSize: 15, lineHeight: 20 }}>{p.bio}</Text> : null}

      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 14 }}>
        {isMe ? (
          <>
            <Button label="Edit profile" variant="secondary" size="sm" flex onPress={() => router.push('/profile/edit')} />
            <Button label="Share profile" variant="secondary" size="sm" flex onPress={() => void Share.share({ message: `Grow habits with me on Podmates — I'm @${p.username}` })} />
            <PressableScale onPress={() => router.push({ pathname: '/pod/new', params: { tab: 'join' } })} accessibilityLabel="Join a pod">
              <View style={{ width: 38, height: 34, borderRadius: 10, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="personAdd" size={16} />
              </View>
            </PressableScale>
          </>
        ) : (
          <Button label="Share profile" variant="secondary" size="sm" flex onPress={() => void Share.share({ message: `Check out @${p.username} on Podmates` })} />
        )}
      </View>

      {/* Habit tabs: icon per habit, underline on the active one (Instagram's grid tabs). */}
      <View style={{ flexDirection: 'row', marginTop: 16, borderBottomWidth: 0.5, borderBottomColor: colors.line }}>
        {habits.data.map((h) => {
          const active = h.id === habitId
          return (
            <PressableScale key={h.id} flex onPress={() => setHabitId(h.id)} accessibilityRole="tab" accessibilityLabel={h.name} accessibilityState={{ selected: active }} scaleTo={0.94}>
              <View style={{ alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: active ? colors.ink.DEFAULT : 'transparent' }}>
                <SymbolIcon name={h.sf_symbol} size={22} color={active ? colors.ink.DEFAULT : colors.ink.subtle} />
              </View>
            </PressableScale>
          )
        })}
      </View>
      {habitId ? (
        <Text variant="caption" style={{ textAlign: 'center', paddingVertical: 8 }}>
          {habits.data.find((h) => h.id === habitId)?.name}
        </Text>
      ) : null}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: asTab ? 16 : 4 }}>
        {!asTab ? <IconButton icon="back" label="Back" onPress={goBack} /> : null}
        <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.3, flex: 1 }} numberOfLines={1}>
          {p.username}
        </Text>
        {isMe ? (
          <>
            <IconButton icon="plusSquare" label="New pod" onPress={() => router.push('/pod/new')} />
            <IconButton icon="menu" label="Menu" onPress={openMenu} />
          </>
        ) : null}
      </View>
      <FlatList
        data={tiles}
        numColumns={3}
        keyExtractor={(t) => (t === 'add' ? 'add' : t.id)}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: insets.bottom + 96 }}
        renderItem={({ item }) =>
          item === 'add' ? (
            <PressableScale onPress={() => router.push({ pathname: '/profile/pick', params: { habit: habitId! } })} accessibilityLabel="Pick snaps for your profile">
              <View style={{ width: TILE_W, height: TILE_H, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="plus" size={26} color={colors.ink.muted} />
                <Text variant="caption">Pick snaps</Text>
              </View>
            </PressableScale>
          ) : (
            <PressableScale onPress={() => router.push({ pathname: '/snap/[id]', params: { id: item.id } })} scaleTo={0.98} accessibilityLabel="Open snap">
              <Image source={{ uri: imageUri(item.image) }} style={{ width: TILE_W, height: TILE_H, backgroundColor: colors.surface }} contentFit="cover" transition={150} recyclingKey={item.id} />
            </PressableScale>
          )
        }
        ListEmptyComponent={
          <Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>
            {habits.data.length ? 'No snaps on the profile for this habit yet.' : isMe ? 'Join a pod to start snapping.' : 'Nothing shared yet.'}
          </Text>
        }
      />
    </View>
  )
}

function Stat({ value, label, icon }: { value: number; label: string; icon: ReactNode }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text numeric style={{ fontSize: 17, fontWeight: '700' }}>
          {compact(value)}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: colors.ink.DEFAULT }}>{label}</Text>
    </View>
  )
}
