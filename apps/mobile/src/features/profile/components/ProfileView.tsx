import { alpha, avatar as avatarColors, colors, overlay, radii, space } from '@podmates/ui-tokens'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { ActivityIndicator, Alert, Dimensions, Share, View } from 'react-native'
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, HERO_OVERLAP, Icon, IconButton, PressableScale, ScreenState, Text } from '@/components/ui'
import { auth, useMe } from '@/ctx/session'
import { REPORT_REASONS, useBlocked, useDeleteAccount, useReport, useSetBlocked } from '../../safety/hooks'
import { haptics } from '@/lib/haptics'
import { compact } from '@/lib/format'
import { showActionSheet } from '@/lib/actionSheet'
import { imageUri } from '@/lib/images'
import { goBack } from '@/lib/nav'
import type { Snap } from '../../snaps/hooks'
import { useProfileBoard } from '../../snaps/hooks'
import { CardCarousel, type CarouselItem } from '../../pods/components/CardCarousel'
import { useHabitCards, useProfile, useProfileStory, useSharedPods, type HabitCard } from '../hooks'

const SCREEN_W = Dimensions.get('window').width
const BANNER_H = 128
/** How far the rounded sheet below rides up over the banner (as on Home). */
const OVERLAP = HERO_OVERLAP
const AVATAR = 96
const PAD = space.gutter
const GAP = 8
const COL_W = (SCREEN_W - PAD * 2 - GAP) / 2
/** Masonry rhythm: varied tile heights (× column width), Pinterest-style. */
const RHYTHM = [1.35, 1.05, 1.5, 1.2, 1.0, 1.4]

/**
 * Profile: the cover photo running to the top of the screen (like Home's hero), a rounded sheet
 * riding over it with the avatar on its edge inside their story ring (my ☰ menu floats top right
 * on the cover), name and @username, Streak · Best · Snaps, the habit carousel, then a masonry
 * board of the snaps this person chose to show.
 */
export function ProfileView({ userId, asTab }: { userId: string; asTab?: boolean }) {
  const insets = useSafeAreaInsets()
  const me = useMe()
  const isMe = userId === me
  const profile = useProfile(userId)
  const cards = useHabitCards(userId)
  const board = useProfileBoard(userId)
  const shared = useSharedPods(userId)
  const story = useProfileStory(userId)
  const blocked = useBlocked(userId)
  const setBlocked = useSetBlocked(userId)
  const report = useReport()
  const deleteAccount = useDeleteAccount()
  // No top bar: once the banner scrolls away, a canvas strip fades in behind the status bar.
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y
  })
  const statusStrip = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [BANNER_H * 0.5, BANNER_H], [0, 1], 'clamp') }))
  // Pulling down past the top (overscroll): a blur fades in over the stretched cover, full by 120pt.
  // The cover grows upward by the overscroll, so it always fills from the screen's top to its own bottom.
  const coverStretch = useAnimatedStyle(() => ({ height: insets.top + BANNER_H + OVERLAP + Math.max(0, -scrollY.value) }))
  const overscrollBlur = useAnimatedStyle(() => ({ opacity: interpolate(-scrollY.value, [0, 120], [0, 1], 'clamp') }))

  const p = profile.data
  if (!p) return <View style={{ flex: 1, backgroundColor: colors.canvas }}><ScreenState fill loading={profile.isLoading} error={profile.error} onRetry={() => void profile.refetch()} /></View>

  const shareMine = () => void Share.share({ message: `Grow habits with me on Podmates — I'm @${p.username}` })

  // The ☰ menu holds the profile actions (no button row on my own profile).
  const openMenu = () =>
    showActionSheet({
      options: [
        { label: 'Edit profile', onPress: () => router.push('/profile/edit') },
        { label: 'Share profile', onPress: shareMine },
        { label: 'Sign out', onPress: () => void auth.signOut() },
        { label: 'Delete account', destructive: true, onPress: confirmDelete },
      ],
    })

  // Deleting is for good: photos, snaps, messages' authorship, pods you were alone in. Two steps.
  const confirmDelete = () =>
    Alert.alert('Delete your account?', 'Your profile, snaps, photos and messages are deleted for good. Pods you’re alone in are deleted too. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete for good',
        style: 'destructive',
        onPress: () =>
          deleteAccount.mutate(undefined, {
            onError: (e) => {
              haptics.error()
              Alert.alert('Couldn’t delete your account', e.message)
            },
          }),
      },
    ])

  const blockFailed = (e: Error) => {
    haptics.error()
    Alert.alert('Couldn’t update the block', e.message)
  }

  // Someone else's profile: report or block them.
  const openTheirMenu = () =>
    showActionSheet({
      options: [
        {
          label: 'Report',
          onPress: () =>
            showActionSheet({
              title: `Why are you reporting @${p.username}?`,
              options: REPORT_REASONS.map((r) => ({
                label: r.label,
                onPress: () =>
                  report.mutate(
                    { type: 'profile', id: userId, reason: r.key },
                    {
                      onSuccess: () => Alert.alert('Thanks for telling us', 'We’ll review it. You can also block them so you don’t see their snaps or messages.'),
                      onError: (e) => Alert.alert('Couldn’t send the report', e.message),
                    },
                  ),
              })),
            }),
        },
        blocked.data
          ? { label: `Unblock @${p.username}`, onPress: () => setBlocked.mutate(false, { onError: blockFailed }) }
          : {
              label: `Block @${p.username}`,
              destructive: true,
              onPress: () =>
                Alert.alert(`Block @${p.username}?`, 'You won’t see their snaps, posts or messages, and you can’t message each other. They aren’t told.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Block', style: 'destructive', onPress: () => setBlocked.mutate(true, { onSuccess: () => haptics.success(), onError: blockFailed }) },
                ]),
            },
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
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="light" />
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
        {/*
          Cover from the top of the screen (no top bar: the name is right below): their cover photo, or a wash of
          their avatar colour. Pulling down stretches the cover itself up to the screen's top edge (anchored at its
          bottom), so the overscroll area is the photo, not a separate colour. Back and menu float on it.
        */}
        <View style={{ height: insets.top + BANNER_H + OVERLAP }}>
          <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: bannerColor }, coverStretch]}>
            {p.banner_url ? (
              <Image source={{ uri: imageUri(p.banner_url) }} style={{ flex: 1 }} contentFit="cover" transition={150} accessibilityLabel="Profile cover photo" />
            ) : (
              <View style={{ flex: 1, backgroundColor: alpha(colors.canvas, 0.35) }} />
            )}
            {/* Inside the cover, so it blurs only the cover: the sheet and avatar are drawn on top of it. */}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, overscrollBlur]}>
              <BlurView intensity={40} tint="dark" style={{ flex: 1 }} />
            </Animated.View>
          </Animated.View>
          <View style={{ position: 'absolute', top: insets.top + space.xs, left: PAD - space.xs, right: PAD - space.xs, flexDirection: 'row', justifyContent: 'space-between' }}>
            {asTab ? <View /> : <IconButton icon="back" label="Back" onPress={goBack} tone="media" />}
            {isMe ? <IconButton icon="menu" label="Menu" onPress={openMenu} tone="media" /> : <IconButton icon="more" label="Report or block" onPress={openTheirMenu} tone="media" />}
          </View>
        </View>

        {/* A sheet with rounded top corners riding up over the banner, like Home's; the avatar sits on its edge. */}
        <View style={{ paddingHorizontal: PAD, marginTop: -OVERLAP, backgroundColor: colors.canvas, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet }}>
          {/* Centred stack: avatar overlapping the banner, name, @username, then Streak · Best · Snaps evenly spaced. */}
          <View style={{ alignItems: 'center' }}>
            {/* Avatar in its story ring (flame = something new, grey = seen or none); tap opens their story. */}
            <View style={{ marginTop: -AVATAR / 2 }}>
              <PressableScale
                onPress={story.data ? () => router.push({ pathname: '/story/[userId]', params: { userId, habit: story.data!.habitId } }) : isMe ? () => router.push('/profile/edit') : undefined}
                disabled={!story.data && !isMe}
                accessibilityLabel={story.data ? `${p.display_name}'s story` : 'Profile photo'}
              >
                <View style={{ borderRadius: AVATAR, borderWidth: 3, borderColor: colors.canvas }}>
                  <Avatar person={p} size={AVATAR} ring={story.data?.unseen ? 'unseen' : 'seen'} />
                </View>
              </PressableScale>
            </View>
            <Text variant="title" center style={{ marginTop: space.sm }} numberOfLines={1}>
              {p.display_name}
            </Text>
            <Text variant="subhead" center numberOfLines={1}>
              @{p.username}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: space.lg }}>
            <View style={{ flex: 1 }}>
              <Stat value={p.streak} label="Top streak" icon="flame" />
            </View>
            <View style={{ flex: 1 }}>
              <Stat value={p.best_streak} label="Best ever" icon="trophy" />
            </View>
            <View style={{ flex: 1 }}>
              <Stat value={p.snap_count} label="Snaps" icon="camera" />
            </View>
          </View>

          {!isMe ? (
            <View style={{ flexDirection: 'row', marginTop: space.lg }}>
              <Button label="Share profile" variant="secondary" size="sm" flex onPress={() => void Share.share({ message: `Check out @${p.username} on Podmates` })} />
            </View>
          ) : null}

          {!isMe && blocked.data ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg, padding: space.md, borderRadius: radii.card, backgroundColor: colors.surface }}>
              <Icon name="warning" size={16} color={colors.ink.muted} />
              <Text variant="subhead" style={{ flex: 1 }}>You blocked @{p.username}. Their snaps and messages are hidden.</Text>
              <Button label="Unblock" variant="secondary" size="sm" onPress={() => setBlocked.mutate(false, { onError: blockFailed })} />
            </View>
          ) : null}

          {!isMe && shared.data?.length ? <SharedPods names={shared.data} /> : null}
        </View>

        {cards.data.length ? <HabitCards cards={cards.data} tappable={isMe} /> : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, marginTop: space.xl, marginBottom: space.sm }}>
          <Text variant="overline">Board</Text>
          {isMe && cards.data.length ? <Button label="Pick snaps" icon="plus" variant="secondary" size="sm" onPress={pickSnaps} /> : null}
        </View>

        {board.data?.length ? (
          <View style={{ flexDirection: 'row', gap: GAP, paddingHorizontal: PAD }}>
            <Column items={left} userId={userId} />
            <Column items={right} userId={userId} />
          </View>
        ) : (
          <ScreenState loading={board.isLoading} empty={{ icon: 'photo', title: isMe ? 'Your board is empty' : 'Nothing shared yet', body: isMe ? 'Pick your best snaps to show here.' : undefined }} />
        )}
      </Animated.ScrollView>
      {deleteAccount.isPending ? (
        // Deleting runs on the server (photos, then the account): block the screen so it isn't tapped twice.
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: overlay.scrim, alignItems: 'center', justifyContent: 'center', gap: space.md }}>
          <ActivityIndicator color={overlay.ink} />
          <Text variant="callout" style={{ color: overlay.ink }}>Deleting your account…</Text>
        </View>
      ) : null}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.canvas }, statusStrip]} />
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

/** Tapping a tile opens the board as a vertical feed (swipe up/down), starting at that snap. */
function Column({ items, userId }: { items: { snap: Snap; h: number }[]; userId: string }) {
  return (
    <View style={{ flex: 1, gap: GAP }}>
      {items.map(({ snap, h }) => (
        <PressableScale key={snap.id} onPress={() => router.push({ pathname: '/snap/[id]', params: { id: snap.id, board: userId } })} scaleTo={0.97} accessibilityLabel="Open snap">
          <Image source={{ uri: imageUri(snap.image) }} style={{ width: '100%', height: h, borderRadius: radii.card, backgroundColor: colors.surface }} contentFit="cover" transition={150} recyclingKey={snap.id} />
        </PressableScale>
      ))}
    </View>
  )
}

/** One card per habit: icon, name, streak. On my own profile a card opens that habit's calendar. */
/** One carousel card per habit: its figure, the habit, and the streak. Mine open that habit's calendar. */
function HabitCards({ cards, tappable }: { cards: HabitCard[]; tappable: boolean }) {
  // Until a card is chosen, the middle one is centred.
  const [picked, setIndex] = useState<number | null>(null)
  const index = picked ?? Math.floor(cards.length / 2)
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
    <View style={{ marginTop: space.xl }}>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg, padding: space.md, borderRadius: radii.card, backgroundColor: colors.surface }}>
      <Icon name="people" size={16} color={colors.leaf.DEFAULT} />
      <Text variant="subhead" style={{ flex: 1 }}>
        {"You're both in "}
        <Text variant="subhead" style={{ fontWeight: '600', color: colors.ink.DEFAULT }}>{list}</Text>
      </Text>
    </View>
  )
}

function Stat({ value, label, icon }: { value: number; label: string; icon: 'flame' | 'trophy' | 'camera' }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="title" numeric>
        {compact(value)}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <Icon name={icon} size={12} color={colors.ink.muted} />
        <Text variant="subhead">{label}</Text>
      </View>
    </View>
  )
}
