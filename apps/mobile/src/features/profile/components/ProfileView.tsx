import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { goBack } from '@/lib/nav'
import { useState, type ReactNode } from 'react'
import { ActionSheetIOS, ActivityIndicator, Alert, Dimensions, FlatList, Platform, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Icon, IconButton, PressableScale, SymbolIcon, Text } from '@/components/ui'
import { auth, useMe } from '@/ctx/session'
import { imageUri } from '@/lib/images'
import { compact } from '@/lib/format'
import type { Snap } from '../../snaps/hooks'
import { useProfileSnaps } from '../../snaps/hooks'
import { useAnswerFollow, useFollow, useFollows, useProfile, useProfileHabits, useProfileStats, useUnfollow } from '../hooks'

const GAP = 2
const TILE_W = (Dimensions.get('window').width - GAP * 2) / 3
const TILE_H = TILE_W * (4 / 3) // Instagram's 3:4 portrait grid

/**
 * Instagram-style profile: avatar + habits / followers / following, bio, actions,
 * my KPI cards (consistency, habits) and current streak per habit, then one icon
 * tab per habit over a 3:4 grid of chosen snaps. Private profiles show the grid to
 * approved followers only.
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
  const stats = useProfileStats(userId)
  const follows = useFollows()
  const follow = useFollow()
  const unfollow = useUnfollow()
  const answer = useAnswerFollow()

  const p = profile.data
  if (!p) return <View style={{ flex: 1, backgroundColor: colors.canvas }}>{profile.isLoading ? <ActivityIndicator style={{ marginTop: 120 }} /> : null}</View>

  const f = follows.data
  const following = !!f?.following.has(userId)
  const requested = !!f?.requested.has(userId)
  const mutual = following && !!f?.followers.has(userId)
  const locked = !isMe && p.is_private && !following

  const openMenu = () => {
    const items: { label: string; run: () => void; destructive?: boolean }[] = []
    if (p.is_admin) items.push({ label: 'Review flagged snaps', run: () => router.push('/admin/flagged') })
    items.push({ label: 'Sign out', run: () => void auth.signOut(), destructive: true })
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...items.map((i) => i.label), 'Cancel'], destructiveButtonIndex: items.findIndex((i) => i.destructive), cancelButtonIndex: items.length, userInterfaceStyle: 'dark' },
        (i) => items[i]?.run(),
      )
    } else void auth.signOut()
  }

  const reviewRequests = () => {
    const first = f?.incoming[0]
    if (!first) return
    Alert.alert('Follow request', `${first.display_name} (@${first.username}) wants to follow you.`, [
      { text: 'Decline', style: 'destructive', onPress: () => answer.mutate({ follower: first.id, accept: false }) },
      { text: 'Approve', onPress: () => answer.mutate({ follower: first.id, accept: true }) },
    ])
  }

  // A leading "+" tile on my own grid opens the picker.
  const tiles: (Snap | 'add')[] = locked ? [] : isMe && habitId ? ['add', ...(snaps.data ?? [])] : (snaps.data ?? [])

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
          <Text style={{ fontSize: 17, fontWeight: '600' }}>{p.display_name}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 8 }}>
            <Stat value={stats.data?.habits ?? 0} label="habits" icon={<Icon name="leaf" size={13} color={colors.leaf.DEFAULT} />} />
            {isMe ? (
              <>
                <Stat value={f?.followers.size ?? 0} label="followers" icon={<Icon name="people" size={13} color={colors.ink.muted} />} />
                <Stat value={f?.following.size ?? 0} label="following" icon={<Icon name="personAdd" size={13} color={colors.ink.muted} />} />
              </>
            ) : (
              <Stat value={Math.max(0, ...(stats.data?.perHabit.map((h) => h.streak) ?? [0]))} label="best now" icon={<Icon name="flame" size={13} color={colors.flame.DEFAULT} />} />
            )}
          </View>
        </View>
      </View>

      {p.bio ? <Text style={{ paddingHorizontal: 16, paddingTop: 12, fontSize: 15, lineHeight: 20 }}>{p.bio}</Text> : null}

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16 }}>
        {isMe ? (
          <>
            <Button label="Edit profile" variant="secondary" size="sm" flex onPress={() => router.push('/profile/edit')} />
            <Button label="Share profile" variant="secondary" size="sm" flex onPress={() => void Share.share({ message: `Grow habits with me on Podmates — I'm @${p.username}` })} />
            {f?.incoming.length ? <Button label={`Requests (${f.incoming.length})`} size="sm" onPress={reviewRequests} /> : null}
          </>
        ) : (
          <>
            {following ? (
              <Button label="Following" variant="secondary" size="sm" flex loading={unfollow.isPending} onPress={() => unfollow.mutate(userId)} />
            ) : requested ? (
              <Button label="Requested" variant="secondary" size="sm" flex loading={unfollow.isPending} onPress={() => unfollow.mutate(userId)} />
            ) : (
              <Button label="Follow" size="sm" flex loading={follow.isPending} onPress={() => follow.mutate(userId)} />
            )}
            {mutual ? <Button label="Message" variant="secondary" size="sm" flex onPress={() => router.push({ pathname: '/dm/[userId]', params: { userId } })} /> : null}
          </>
        )}
      </View>

      {isMe && stats.data ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <KpiCard label="Consistency" value={stats.data.consistency === null ? '—' : `${Math.round(stats.data.consistency * 100)}%`} sub="last 30 days, snaps + rest days" />
            <KpiCard label="Habits" value={String(stats.data.habits)} sub={stats.data.habits === 1 ? 'pod joined' : 'pods joined'} />
          </View>
          {habits.data.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {habits.data.map((h) => {
                const streak = stats.data!.perHabit.find((x) => x.habitId === h.id)?.streak
                return streak === undefined ? null : (
                  <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: colors.raised }} accessibilityLabel={`${h.name}: ${streak}-day streak`}>
                    <SymbolIcon name={h.sf_symbol} size={14} color={colors.ink.muted} />
                    <Icon name="flame" size={12} color={colors.flame.DEFAULT} />
                    <Text numeric style={{ fontSize: 14, fontWeight: '600' }}>
                      {streak}
                    </Text>
                  </View>
                )
              })}
            </View>
          ) : null}
        </View>
      ) : null}

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
        <Text style={{ fontSize: 22, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {p.username}
        </Text>
        {isMe ? (
          <>
            <IconButton icon="plusSquare" label="Your habits" onPress={() => router.push('/pod/new')} />
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
            {locked ? 'This profile is private. Follow to see their snaps.' : habits.data.length ? 'No snaps on the profile for this habit yet' : isMe ? 'Add a habit to start snapping' : 'Nothing shared yet'}
          </Text>
        }
      />
    </View>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 14, backgroundColor: colors.surface, padding: 12, gap: 2 }}>
      <Text variant="overline">{label}</Text>
      <Text numeric style={{ fontSize: 22, fontWeight: '700', color: colors.leaf.DEFAULT }}>
        {value}
      </Text>
      <Text variant="caption">{sub}</Text>
    </View>
  )
}

function Stat({ value, label, icon }: { value: number; label: string; icon: ReactNode }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text numeric style={{ fontSize: 17, fontWeight: '600' }}>
          {compact(value)}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: colors.ink.muted }}>{label}</Text>
    </View>
  )
}
