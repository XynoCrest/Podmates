import { avatar as avatarColors, colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Dimensions, ScrollView, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Icon, IconButton, PressableScale, Text } from '@/components/ui'
import { auth, useMe } from '@/ctx/session'
import { compact } from '@/lib/format'
import { showActionSheet } from '@/lib/actionSheet'
import { imageUri } from '@/lib/images'
import { goBack } from '@/lib/nav'
import type { Snap } from '../../snaps/hooks'
import { useProfileBoard } from '../../snaps/hooks'
import { CardCarousel, type CarouselItem } from '../../pods/components/CardCarousel'
import { useHabitCards, useProfile, useSharedPods, type HabitCard } from '../hooks'

const SCREEN_W = Dimensions.get('window').width
const BANNER_H = 128
const AVATAR = 96
const PAD = 16
const GAP = 8
const COL_W = (SCREEN_W - PAD * 2 - GAP) / 2
/** Masonry rhythm: varied tile heights (× column width), Pinterest-style. */
const RHYTHM = [1.35, 1.05, 1.5, 1.2, 1.0, 1.4]

/**
 * Profile, LinkedIn/Pinterest-inspired: a banner with the avatar overlapping it, name and
 * @username, Streak · Best · Snaps, actions, one card per habit (mine open that habit's
 * calendar), then a masonry board of the snaps this person chose to show.
 */
export function ProfileView({ userId, asTab }: { userId: string; asTab?: boolean }) {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const isMe = userId === me
  const profile = useProfile(userId)
  const cards = useHabitCards(userId)
  const board = useProfileBoard(userId)
  const shared = useSharedPods(userId)

  const p = profile.data
  if (!p) return <View style={{ flex: 1, backgroundColor: colors.canvas }}>{profile.isLoading ? <ActivityIndicator style={{ marginTop: 120 }} /> : null}</View>

  const shareMine = () => void Share.share({ message: `Grow habits with me on Podmates — I'm @${p.username}` })

  // The ☰ menu holds the profile actions (no button row on my own profile).
  const openMenu = () =>
    showActionSheet({
      options: [
        { label: 'Edit profile', onPress: () => router.push('/profile/edit') },
        { label: 'Share profile', onPress: shareMine },
        { label: 'Sign out', destructive: true, onPress: () => void auth.signOut() },
      ],
    })

  // Pick snaps works per habit (Ben's picker): choose the habit first.
  const pickSnaps = () => {
    const list = cards.data
    if (list.length === 1) return router.push({ pathname: '/profile/pick', params: { habit: list[0]!.habit.id } })
    if (!list.length) return
    showActionSheet({
      title: 'Pick snaps for which habit?',
      options: list.map((c) => ({ label: c.habit.name, onPress: () => router.push({ pathname: '/profile/pick', params: { habit: c.habit.id } }) })),
    })
  }

  const bannerColor = avatarColors[p.avatar_color as keyof typeof avatarColors] ?? colors.raised
  const [left, right] = masonry(board.data ?? [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: asTab ? 16 : 4 }}>
        {!asTab ? <IconButton icon="back" label="Back" onPress={goBack} /> : null}
        <Text style={{ fontSize: 22, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {p.username}
        </Text>
        {isMe ? <IconButton icon="menu" label="Menu" onPress={openMenu} /> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
        {/* Banner: their cover photo, or a wash of their avatar colour until they set one. */}
        <View style={{ height: BANNER_H, backgroundColor: bannerColor }}>
          {p.banner_url ? (
            <Image source={{ uri: imageUri(p.banner_url) }} style={{ width: '100%', height: BANNER_H }} contentFit="cover" transition={150} accessibilityLabel="Profile banner" />
          ) : (
            <View style={{ flex: 1, backgroundColor: 'rgba(11, 12, 15, 0.35)' }} />
          )}
        </View>

        <View style={{ paddingHorizontal: PAD }}>
          {/* Centred stack: avatar overlapping the banner, name, @username, then Streak · Best · Snaps evenly spaced. */}
          <View style={{ alignItems: 'center' }}>
            <PressableScale onPress={isMe ? () => router.push('/profile/edit') : undefined} disabled={!isMe} accessibilityLabel="Profile photo" style={{ marginTop: -AVATAR / 2 }}>
              <View style={{ borderRadius: AVATAR, borderWidth: 4, borderColor: colors.canvas }}>
                <Avatar person={p} size={AVATAR} />
              </View>
            </PressableScale>
            <Text center style={{ marginTop: 10, fontSize: 24, fontWeight: '700', letterSpacing: -0.4 }} numberOfLines={1}>
              {p.display_name}
            </Text>
            <Text variant="subhead" center numberOfLines={1}>
              @{p.username}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Stat value={p.streak} label="Streak" icon="flame" />
            </View>
            <View style={{ flex: 1 }}>
              <Stat value={p.best_streak} label="Best" icon="trophy" />
            </View>
            <View style={{ flex: 1 }}>
              <Stat value={p.snap_count} label="Snaps" icon="camera" />
            </View>
          </View>

          {!isMe ? (
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button label="Share profile" variant="secondary" size="sm" flex onPress={() => void Share.share({ message: `Check out @${p.username} on Podmates` })} />
            </View>
          ) : null}

          {!isMe && shared.data?.length ? <SharedPods names={shared.data} /> : null}
        </View>

        {cards.data.length ? <HabitCards cards={cards.data} tappable={isMe} /> : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, marginTop: 20, marginBottom: 10 }}>
          <Text variant="overline">Board</Text>
          {isMe && cards.data.length ? <Button label="Pick snaps" icon="plus" variant="secondary" size="sm" onPress={pickSnaps} /> : null}
        </View>

        {board.data?.length ? (
          <View style={{ flexDirection: 'row', gap: GAP, paddingHorizontal: PAD }}>
            <Column items={left} />
            <Column items={right} />
          </View>
        ) : (
          <Text variant="subhead" style={{ textAlign: 'center', padding: 32 }}>
            {isMe ? 'Pick your best snaps to show here.' : 'Nothing shared yet.'}
          </Text>
        )}
      </ScrollView>
    </View>
  )
}

/** Split tiles into two columns, each tile going to the shorter one. */
function masonry(snaps: Snap[]): [{ snap: Snap; h: number }[], { snap: Snap; h: number }[]] {
  const cols: [{ snap: Snap; h: number }[], { snap: Snap; h: number }[]] = [[], []]
  const height = [0, 0]
  snaps.forEach((snap, i) => {
    const h = Math.round(COL_W * RHYTHM[i % RHYTHM.length]!)
    const c = height[0]! <= height[1]! ? 0 : 1
    cols[c].push({ snap, h })
    height[c]! += h + GAP
  })
  return cols
}

function Column({ items }: { items: { snap: Snap; h: number }[] }) {
  return (
    <View style={{ flex: 1, gap: GAP }}>
      {items.map(({ snap, h }) => (
        <PressableScale key={snap.id} onPress={() => router.push({ pathname: '/snap/[id]', params: { id: snap.id } })} scaleTo={0.97} accessibilityLabel="Open snap">
          <Image source={{ uri: imageUri(snap.image) }} style={{ width: '100%', height: h, borderRadius: 14, backgroundColor: colors.surface }} contentFit="cover" transition={150} recyclingKey={snap.id} />
        </PressableScale>
      ))}
    </View>
  )
}

/** One card per habit: icon, name, streak. On my own profile a card opens that habit's calendar. */
/** One carousel card per habit: its figure, the habit, and the streak. Mine open that habit's calendar. */
function HabitCards({ cards, tappable }: { cards: HabitCard[]; tappable: boolean }) {
  const [index, setIndex] = useState(0)
  const items: CarouselItem[] = cards.map((c) => {
    const streak = c.streak === null ? null : `${c.streak}-day streak`
    const best = c.best ? `Best ${c.best} ${c.best === 1 ? 'day' : 'days'}` : null
    return {
      id: c.habit.id,
      figure: c.habit.id,
      label: best ?? 'Habit',
      title: c.habit.name,
      sub: streak ?? 'Streak not shared',
      about: tappable
        ? `${streak ? `On a ${streak}` : 'No streak yet'}${best ? `, ${best.toLowerCase()}` : ''}. Tap the card to open your ${c.habit.name.toLowerCase()} calendar.`
        : streak
          ? `On a ${streak}${best ? `, ${best.toLowerCase()}` : ''}.`
          : `Shares ${c.habit.name.toLowerCase()} snaps on their profile. Streaks show for pods you share.`,
      a11y: `${c.habit.name}, ${streak ?? 'streak not shared'}${tappable ? '. Open calendar' : ''}`,
    }
  })
  return (
    <View style={{ marginTop: 18 }}>
      <CardCarousel
        items={items}
        index={Math.min(index, Math.max(0, items.length - 1))}
        onIndex={setIndex}
        onPickCentre={tappable ? (i) => router.push({ pathname: '/profile/habit', params: { habit: cards[i]!.habit.id } }) : undefined}
        label="Habit"
        scale={0.78}
      />
    </View>
  )
}

/** "You're both in Atomic Habits Club and Lane Six" — how we're connected. */
function SharedPods({ names }: { names: string[] }) {
  const list = names.length <= 2 ? names.join(' and ') : `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.surface }}>
      <Icon name="people" size={16} color={colors.leaf.DEFAULT} />
      <Text style={{ flex: 1, fontSize: 14, color: colors.ink.muted }}>
        {"You're both in "}
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink.DEFAULT }}>{list}</Text>
      </Text>
    </View>
  )
}

function Stat({ value, label, icon }: { value: number; label: string; icon: 'flame' | 'trophy' | 'camera' }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text numeric style={{ fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5 }}>
        {compact(value)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name={icon} size={12} color={colors.ink.muted} />
        <Text style={{ fontSize: 15, lineHeight: 19, color: colors.ink.muted }}>{label}</Text>
      </View>
    </View>
  )
}
