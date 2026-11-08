import { RULES } from '@podmates/tree-engine'
import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Icon, PressableScale, Text } from '@/components/ui'
import { firstName } from '@/lib/format'
import { imageUri } from '@/lib/images'
import { goBack } from '@/lib/nav'
import type { Snap } from '../hooks'

const shadow = { textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 6 }

/** Full-screen snap: author and pod on top with a close button, the on-time badge and caption at the bottom. */
export function SnapFrame({ snap, top, footer }: { snap: Snap; top?: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets()
  const at = new Date(snap.takenAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <Image source={{ uri: imageUri(snap.image) }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" transition={150} />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 16 }}>
        {top}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <PressableScale onPress={() => router.push({ pathname: '/user/[id]', params: { id: snap.author.id } })} flex accessibilityLabel={snap.author.display_name}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ borderRadius: 30, borderWidth: 2.5, borderColor: '#fff' }}>
                <Avatar person={snap.author} size={52} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '700', fontSize: 19, ...shadow }}>
                  {firstName(snap.author.display_name).toLowerCase()}
                </Text>
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, ...shadow }}>
                  {snap.podName ? `${snap.podName} · ${at}` : at}
                </Text>
              </View>
            </View>
          </PressableScale>
          <PressableScale onPress={goBack} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} scaleTo={0.9}>
            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" size={30} color="#fff" />
            </View>
          </PressableScale>
        </View>
      </View>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 24, gap: 10, alignItems: 'flex-start' }}>
        {snap.caption ? (
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }}>
            <Text style={{ color: '#fff', fontSize: 17, lineHeight: 23 }}>{snap.caption}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(20,40,30,0.75)' }}>
          {snap.onTime ? <Icon name="check" size={20} color={colors.leaf.bright} /> : <Icon name="clock" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{snap.onTime ? `On time · earned ⚡${RULES.energyPerCheckin}` : "Late · didn't count"}</Text>
        </View>
        {footer}
      </View>
    </View>
  )
}
