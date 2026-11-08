import { colors } from '@podmates/ui-tokens'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

/** Flat rounded progress bar; colour shifts with health so a dying tree reads at a glance. */
export function HealthBar({ ratio, height = 12, color }: { ratio: number; height?: number; color?: string }) {
  const fill = color ?? (ratio > 0.5 ? colors.leaf.bright : ratio > 0.25 ? colors.flame.DEFAULT : colors.danger.DEFAULT)
  const pct = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` as const
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: colors.sunken, overflow: 'hidden' }}>
      <Animated.View
        style={{
          width: pct,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fill,
          transitionProperty: 'width',
          transitionDuration: 500,
        }}
      />
    </View>
  )
}
