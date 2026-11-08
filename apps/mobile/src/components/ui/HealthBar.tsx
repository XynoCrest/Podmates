import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

/** Rounded progress bar; colour shifts with health so a dying tree reads at a glance. */
export function HealthBar({ ratio, height = 14, color }: { ratio: number; height?: number; color?: string }) {
  const fill = color ?? (ratio > 0.5 ? colors.leaf.DEFAULT : ratio > 0.25 ? colors.energy.DEFAULT : colors.danger.DEFAULT)
  const pct = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` as const
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.raised, overflow: 'hidden' }}>
      <Animated.View
        style={{
          width: pct,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fill,
          transitionProperty: 'width',
          transitionDuration: 500,
        }}
      >
        {/* Highlight stripe gives the bar a little volume, Duolingo-style. */}
        <View style={{ position: 'absolute', top: height * 0.2, left: height / 2, right: height / 2, height: Math.max(2, height * 0.18), borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      </Animated.View>
    </View>
  )
}
