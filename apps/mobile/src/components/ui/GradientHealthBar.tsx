import { colors } from '@podmates/ui-tokens'
import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Glyph } from './Glyph'

/**
 * Pod health as one continuous red→green ramp, with a heart bulb that takes the
 * colour of the current level. Unlike <HealthBar />, the gradient is laid out
 * across the FULL track and then clipped to the fill, so the colour at the tip
 * tells you the level even without reading the length.
 */
const RAMP = ['#FF5D63', '#FF8A3D', '#FFC83D', '#C7D93F', '#7BD64B'] as const

/** The ramp colour at a 0–1 ratio, for the bulb behind the heart. */
export function healthColor(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, ratio))
  return RAMP[Math.min(RAMP.length - 1, Math.round(clamped * (RAMP.length - 1)))]!
}

export function GradientHealthBar({ ratio, width = 76, height = 10 }: { ratio: number; width?: number; height?: number }) {
  const clamped = Math.min(1, Math.max(0, ratio))
  const tint = healthColor(clamped)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name="heart" size={12} color={colors.ink.inverse} />
      </View>
      <View style={{ width, height, borderRadius: height / 2, backgroundColor: colors.raised, overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: `${Math.round(clamped * 100)}%`,
            height: '100%',
            borderRadius: height / 2,
            overflow: 'hidden',
            transitionProperty: 'width',
            transitionDuration: 500,
          }}
        >
          <LinearGradient colors={RAMP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width, height: '100%' }} />
        </Animated.View>
      </View>
    </View>
  )
}
