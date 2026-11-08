import { colors, overlay, radii, space } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Chip, IconButton, PressableScale, Text } from '@/components/ui'
import { goBack } from '@/lib/nav'
import { timeAgo } from '@/lib/format'
import { imageUri } from '@/lib/images'
import type { Snap } from '../hooks'

/** Story-style progress: one bar per snap, done ones filled; `current` fills the active one (animated or not). */
export function ProgressBars({ count, index, current }: { count: number; index: number; current?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.xs }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, backgroundColor: overlay.track, overflow: 'hidden' }}>
          {i < index ? <View style={{ flex: 1, backgroundColor: overlay.ink }} /> : i === index ? (current ?? <View style={{ flex: 1, backgroundColor: overlay.ink }} />) : null}
        </View>
      ))}
    </View>
  )
}

/** Full-screen snap (the media template): photo, author bar on top, caption + on-time badge at the bottom. */
export function SnapFrame({ snap, top, footer }: { snap: Snap; top?: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: overlay.media }}>
      <Image source={{ uri: imageUri(snap.image) }} style={{ position: 'absolute', top: insets.top, left: 0, right: 0, bottom: insets.bottom + space.sm, borderRadius: radii.card }} contentFit="cover" transition={150} />
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.md, gap: space.md }}>
        {top}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Top-left, on a dark disc: readable over any photo and clear of Expo Go's top-right dev button. */}
          <IconButton icon="back" label="Back" onPress={goBack} tone="media" />
          <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: snap.author.id } })} accessibilityLabel={snap.author.display_name}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar person={snap.author} size={34} />
              <View>
                <Text variant="label" style={{ color: overlay.ink, textShadowColor: overlay.scrim, textShadowRadius: 4 }}>
                  {snap.author.display_name} <Text variant="subhead" style={{ color: overlay.ink, opacity: 0.75 }}>{timeAgo(snap.takenAt)}</Text>
                </Text>
                {snap.podName ? <Text variant="caption" style={{ color: overlay.ink, opacity: 0.8 }}>{snap.podName}</Text> : null}
              </View>
            </View>
          </PressableScale>
        </View>
      </View>
      <View style={{ position: 'absolute', left: space.gutter, right: space.gutter, bottom: insets.bottom + 28, gap: space.md, alignItems: 'flex-start' }}>
        {snap.onTime ? <Chip icon="bolt" label="ON TIME" color={colors.ink.inverse} bg={colors.energy.DEFAULT} /> : <Chip icon="clock" label="LATE" color={overlay.ink} bg={overlay.scrim} />}
        {snap.caption ? (
          <View style={{ backgroundColor: overlay.scrim, borderRadius: radii.control, paddingHorizontal: space.md, paddingVertical: space.sm }}>
            <Text style={{ color: overlay.ink }}>{snap.caption}</Text>
          </View>
        ) : null}
        {footer}
      </View>
    </View>
  )
}
