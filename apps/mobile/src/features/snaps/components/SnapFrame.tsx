import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { goBack } from '@/lib/nav'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Chip, Icon, PressableScale, Text } from '@/components/ui'
import { timeAgo } from '@/lib/format'
import { imageUri } from '@/lib/images'
import type { Snap } from '../hooks'

/** Full-screen snap: photo, author bar on top, caption + on-time badge at the bottom. */
export function SnapFrame({ snap, top, footer }: { snap: Snap; top?: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Image source={{ uri: imageUri(snap.image) }} style={{ position: 'absolute', top: insets.top, left: 0, right: 0, bottom: insets.bottom + 8, borderRadius: 14 }} contentFit="cover" transition={150} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 10, gap: 10 }}>
        {top}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Top-left, on a dark disc: readable over any photo and clear of Expo Go's top-right dev button. */}
          <PressableScale onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} scaleTo={0.9}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="back" size={20} color="#fff" weight="semibold" />
            </View>
          </PressableScale>
          <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: snap.author.id } })} accessibilityLabel={snap.author.display_name}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar person={snap.author} size={34} />
              <View>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }}>
                  {snap.author.display_name} <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>{timeAgo(snap.takenAt)}</Text>
                </Text>
                {snap.podName ? <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>{snap.podName}</Text> : null}
              </View>
            </View>
          </PressableScale>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 28, gap: 10, alignItems: 'flex-start' }}>
        <Chip icon="check" label={snap.podName ? `${snap.podName.toUpperCase()} · VERIFIED` : 'VERIFIED'} color={colors.ink.inverse} bg={colors.leaf.DEFAULT} />
        {snap.cheers ? <Chip icon="sparkles" label={`${snap.cheers} ${snap.cheers === 1 ? 'CHEER' : 'CHEERS'}`} color="#fff" bg="rgba(0,0,0,0.55)" /> : null}
        {snap.caption ? (
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: '#fff', fontSize: 16 }}>{snap.caption}</Text>
          </View>
        ) : null}
        {footer}
      </View>
    </View>
  )
}
